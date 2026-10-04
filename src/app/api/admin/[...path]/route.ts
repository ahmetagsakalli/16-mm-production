import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { prepareCloudUpload, finishCloudUpload, cloudUploadPlan, cloudMediaEnabled } from '@/lib/cms/cloud-media';
import { revalidatePath, revalidateTag } from 'next/cache';
import { authenticated, changePassword, hasPassword, localSetupAllowed, login, logout, requireAdmin, sameOrigin, setInitialPassword, consumeAttempt } from '@/lib/cms/auth';
import { createProject, exportContent, getProjectRecord, getSettings, listProjects, restoreRevision, revisions, saveProject, saveSettings, setDeleted } from '@/lib/cms/store';
import { CmsError } from '@/lib/cms/types';
import { upload } from '@/lib/cms/upload';
import { getHomepage, saveHomepage, listBlogPosts, createBlogPost, getBlogPost, saveBlogPost, setBlogState, mediaOptions } from '@/lib/cms/editorial';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
type Context = {
    params: Promise<{
        path: string[];
    }>;
};
function json(value: unknown, status = 200) { return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
async function body(request: Request): Promise<Record<string, unknown>> {
    if (!request.headers.get('content-type')?.startsWith('application/json'))
        throw new CmsError('JSON bekleniyor.', 415);
    const reader = request.body?.getReader();
    if (!reader)
        throw new CmsError('İstek boş.');
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        length += value.length;
        if (length > 2 * 1024 ** 2) {
            await reader.cancel();
            throw new CmsError('İstek çok büyük.', 413);
        }
        chunks.push(value);
    }
    try {
        const value = JSON.parse(Buffer.concat(chunks).toString());
        if (!value || typeof value !== 'object' || Array.isArray(value))
            throw new Error();
        return value;
    }
    catch {
        throw new CmsError('İstek okunamadı.');
    }
}
function version(value: unknown) { if (!Number.isSafeInteger(value) || Number(value) < 1)
    throw new CmsError('Geçersiz sürüm.'); return Number(value); }
function refresh() { revalidateTag('cms', { expire: 0 }); revalidatePath('/', 'layout'); revalidatePath('/sitemap.xml'); }
async function handle(request: Request, context: Context) {
    try {
        const { path } = await context.params, route = path.join('/'), method = request.method;
        if (method !== 'GET')
            sameOrigin(request);
        if (route === 'session' && method === 'GET')
            return json({ authenticated: await authenticated(), setup: !await hasPassword() && localSetupAllowed(request) });
        if (route === 'setup' && method === 'POST') {
            if (!localSetupAllowed(request))
                throw new CmsError('İlk kurulum yalnızca yerel geliştirme ortamında yapılabilir.', 403);
            await consumeAttempt('setup');
            const data = await body(request);
            await setInitialPassword(data.password);
            await login(data.password);
            return json({ ok: true });
        }
        if (route === 'login' && method === 'POST') {
            await login((await body(request)).password);
            return json({ ok: true });
        }
        await requireAdmin();
        if (route === 'media-options' && method === 'GET') return json(await mediaOptions());
        if (route === 'homepage' && method === 'GET') return json(await getHomepage());
        if (route === 'homepage' && method === 'PUT') {
            const data = await body(request);
            if (!Number.isSafeInteger(data.version) || Number(data.version) < 0) throw new CmsError('Geçersiz sürüm.');
            const result = await saveHomepage(Number(data.version), data.data);
            refresh(); return json(result);
        }
        if (route === 'blog' && method === 'GET') return json(await listBlogPosts());
        if (route === 'blog' && method === 'POST') return json(await createBlogPost(), 201);
        if (path[0] === 'blog' && path[1]) {
            const id = path[1];
            if (path.length === 2 && method === 'GET') return json(await getBlogPost(id));
            if (path.length === 2 && method === 'PUT') { const data = await body(request); return json(await saveBlogPost(id, version(data.version), data.data)); }
            if (path.length === 3 && method === 'POST') {
                const data = await body(request);
                if (path[2] === 'publish') { const result = await saveBlogPost(id, version(data.version), data.data, true); refresh(); return json(result); }
                if (path[2] === 'trash' || path[2] === 'restore' || path[2] === 'unpublish') { const result = await setBlogState(id, version(data.version), path[2]); refresh(); return json(result); }
            }
        }
        if (route === 'blob-token' && method === 'POST') {
            const data = await body(request);
            if (!cloudMediaEnabled() || data.type !== 'blob.generate-client-token') throw new CmsError('Geçersiz yükleme isteği.');
            return json(await handleUpload({ request, body: data as unknown as HandleUploadBody,
                onBeforeGenerateToken: async (pathname, payload) => {
                    let id: unknown; try { id = JSON.parse(payload || '{}').id; } catch { throw new CmsError('Geçersiz yükleme isteği.'); }
                    if (typeof id !== 'string') throw new CmsError('Geçersiz yükleme isteği.');
                    const plan = await cloudUploadPlan(id);
                    if (pathname !== plan.pathname) throw new CmsError('Dosya yolu doğrulanamadı.', 403);
                    return { maximumSizeInBytes: plan.bytes, validUntil: Date.now() + 60 * 60000, addRandomSuffix: false, allowOverwrite: false, allowedContentTypes: plan.kind === 'image' ? ['image/*', 'application/octet-stream'] : ['video/mp4', 'video/webm', 'application/octet-stream'] };
                }
            }));
        }
        if (route === 'logout' && method === 'POST') {
            await logout();
            return json({ ok: true });
        }
        if (route === 'password' && method === 'POST') {
            const data = await body(request);
            await changePassword(data.current, data.password);
            return json({ ok: true });
        }
        if (route === 'projects' && method === 'GET')
            return json(await listProjects());
        if (route === 'projects' && method === 'POST')
            return json(await createProject(), 201);
        if (route === 'settings' && method === 'GET')
            return json(await getSettings());
        if (route === 'settings' && method === 'PUT') {
            const data = await body(request);
            const result = await saveSettings(version(data.version), data.data);
            refresh();
            return json(result);
        }
        if (route === 'export' && method === 'GET')
            return new Response(JSON.stringify(await exportContent(), null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="16mm-icerik-yedegi.json"', 'Cache-Control': 'no-store' } });
        if (path[0] === 'projects' && path[1]) {
            const id = path[1];
            if (path.length === 3 && path[2] === 'upload-plan' && method === 'POST') return json(await prepareCloudUpload(id, await body(request)));
            if (path.length === 3 && path[2] === 'upload-complete' && method === 'POST') {
                const data = await body(request);
                if (typeof data.id !== 'string') throw new CmsError('Geçersiz yükleme isteği.');
                return json(await finishCloudUpload(id, data.id), 201);
            }
            if (path.length === 2 && method === 'GET')
                return json(await getProjectRecord(id));
            if (path.length === 2 && method === 'PUT') {
                const data = await body(request);
                const result = await saveProject(id, version(data.version), data.draft);
                return json(result);
            }
            if (path.length === 3 && path[2] === 'upload' && method === 'POST')
                { if (cloudMediaEnabled()) throw new CmsError('Dosyayı yeniden seçerek doğrudan yükleyin.'); return json(await upload(request, id), 201); }
            if (path.length === 3 && path[2] === 'history' && method === 'GET')
                return json(await revisions(id));
            if (path.length === 3 && method === 'POST') {
                const data = await body(request), v = version(data.version);
                if (path[2] === 'publish') {
                    const result = await saveProject(id, v, data.draft, true);
                    refresh();
                    return json(result);
                }
                if (path[2] === 'trash' || path[2] === 'restore') {
                    const result = await setDeleted(id, v, path[2] === 'trash');
                    refresh();
                    return json(result);
                }
                if (path[2] === 'revision')
                    return json(await restoreRevision(id, v, version(data.revision)));
            }
        }
        throw new CmsError('İşlem bulunamadı.', 404);
    }
    catch (error) {
        if (error instanceof CmsError)
            return json({ error: error.message }, error.status);
        console.error('[cms] request failed', error instanceof Error ? error.name : 'Error');
        return json({ error: 'İşlem tamamlanamadı. Tekrar deneyin.' }, 500);
    }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
