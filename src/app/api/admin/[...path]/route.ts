import { revalidatePath, revalidateTag } from 'next/cache';
import { authenticated, changePassword, hasPassword, localSetupAllowed, login, logout, requireAdmin, sameOrigin, setInitialPassword, consumeAttempt } from '@/lib/cms/auth';
import { createProject, exportContent, getProjectRecord, getSettings, listProjects, restoreRevision, revisions, saveProject, saveSettings, setDeleted } from '@/lib/cms/store';
import { CmsError } from '@/lib/cms/types';
import { upload } from '@/lib/cms/upload';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 3600;
type Context = { params: Promise<{ path: string[] }> };
function json(value: unknown, status = 200) { return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new CmsError('JSON bekleniyor.', 415);
  const reader = request.body?.getReader(); if (!reader) throw new CmsError('İstek boş.');
  let length = 0; const chunks: Uint8Array[] = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 2 * 1024 ** 2) { await reader.cancel(); throw new CmsError('İstek çok büyük.', 413); } chunks.push(value); }
  try { const value = JSON.parse(Buffer.concat(chunks).toString()); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; } catch { throw new CmsError('İstek okunamadı.'); }
}
function version(value: unknown) { if (!Number.isSafeInteger(value) || Number(value) < 1) throw new CmsError('Geçersiz sürüm.'); return Number(value); }
function refresh() { revalidateTag('cms', { expire: 0 }); revalidatePath('/', 'layout'); revalidatePath('/sitemap.xml'); }
async function handle(request: Request, context: Context) {
  try {
    const { path } = await context.params, route = path.join('/'), method = request.method;
    if (method !== 'GET') sameOrigin(request);
    if (route === 'session' && method === 'GET') return json({ authenticated: await authenticated(), setup: !hasPassword() && localSetupAllowed(request) });
    if (route === 'setup' && method === 'POST') { if (!localSetupAllowed(request)) throw new CmsError('İlk kurulum yalnızca yerel geliştirme ortamında yapılabilir.', 403); consumeAttempt('setup'); const data = await body(request); await setInitialPassword(data.password); await login(data.password); return json({ ok: true }); }
    if (route === 'login' && method === 'POST') { await login((await body(request)).password); return json({ ok: true }); }
    await requireAdmin();
    if (route === 'logout' && method === 'POST') { await logout(); return json({ ok: true }); }
    if (route === 'password' && method === 'POST') { const data = await body(request); await changePassword(data.current, data.password); return json({ ok: true }); }
    if (route === 'projects' && method === 'GET') return json(listProjects());
    if (route === 'projects' && method === 'POST') return json(createProject(), 201);
    if (route === 'settings' && method === 'GET') return json(getSettings());
    if (route === 'settings' && method === 'PUT') { const data = await body(request); const result = saveSettings(version(data.version), data.data); refresh(); return json(result); }
    if (route === 'export' && method === 'GET') return new Response(JSON.stringify(exportContent(), null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="16mm-icerik-yedegi.json"', 'Cache-Control': 'no-store' } });
    if (path[0] === 'projects' && path[1]) {
      const id = path[1];
      if (path.length === 2 && method === 'GET') return json(getProjectRecord(id));
      if (path.length === 2 && method === 'PUT') { const data = await body(request); const result = saveProject(id, version(data.version), data.draft); return json(result); }
      if (path.length === 3 && path[2] === 'upload' && method === 'POST') return json(await upload(request, id), 201);
      if (path.length === 3 && path[2] === 'history' && method === 'GET') return json(revisions(id));
      if (path.length === 3 && method === 'POST') {
        const data = await body(request), v = version(data.version);
        if (path[2] === 'publish') { const result = saveProject(id, v, data.draft, true); refresh(); return json(result); }
        if (path[2] === 'trash' || path[2] === 'restore') { const result = setDeleted(id, v, path[2] === 'trash'); refresh(); return json(result); }
        if (path[2] === 'revision') return json(restoreRevision(id, v, version(data.revision)));
      }
    }
    throw new CmsError('İşlem bulunamadı.', 404);
  } catch (error) {
    if (error instanceof CmsError) return json({ error: error.message }, error.status);
    console.error('[cms] request failed', error instanceof Error ? error.name : 'Error');
    return json({ error: 'İşlem tamamlanamadı. Tekrar deneyin.' }, 500);
  }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
