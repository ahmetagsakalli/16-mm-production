import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, readdir, open } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { get, head, put, issueSignedToken, presignUrl, type IssuedSignedToken } from '@vercel/blob';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import sharp from 'sharp';
import { convertImage } from '../../../scripts/encode-media.mjs';
import { addMedia, db, findMedia, getProjectRecord, transaction } from './store';
import { CmsError, type Media } from './types';
const execute = promisify(execFile);
export const cloudMediaEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
type UploadPlan = { id: string; projectId: string; name: string; bytes: number; kind: 'image' | 'video'; pathname: string; extension: string };
let readToken: Promise<IssuedSignedToken> | undefined;
let readTokenExpires = 0;
export async function signedMediaUrl(pathname: string) {
  if (!readToken || readTokenExpires < Date.now() + 60000) {
    readTokenExpires = Date.now() + 60 * 60000;
    readToken = issueSignedToken({ pathname: '*', operations: ['get'], validUntil: readTokenExpires }).catch(error => { readToken = undefined; throw error; });
  }
  return (await presignUrl(await readToken, { pathname, operation: 'get', access: 'private', validUntil: Math.min(Date.now() + 30 * 60000, readTokenExpires) })).presignedUrl;
}
export function validateUpload(name: unknown, bytes: unknown) {
  if (typeof name !== 'string' || !name || name.length > 240 || /[/\\\x00-\x1f]/.test(name) || basename(name) !== name) throw new CmsError('Dosya adı geçersiz.');
  const extension = extname(name).toLowerCase();
  const kind: UploadPlan['kind'] | null = /^\.(jpe?g|png|webp|avif|tiff?|heic|heif)$/.test(extension) ? 'image' : /^\.(mp4|webm)$/.test(extension) ? 'video' : null;
  if (!kind) throw new CmsError('Fotoğraf veya MP4 / WebM video yükleyin. MOV videoyu önce MP4 olarak dışa aktarın.');
  const limit = kind === 'image' ? 128 * 1024 ** 2 : 2 * 1024 ** 3;
  if (!Number.isSafeInteger(bytes) || Number(bytes) <= 0 || Number(bytes) > limit) throw new CmsError('Dosya boyutu sınırı aşıldı.', 413);
  return { name: name.normalize('NFC'), bytes: Number(bytes), kind, extension };
}
export async function prepareCloudUpload(projectId: string, input: Record<string, unknown>) {
  if (!cloudMediaEnabled()) return { cloud: false };
  const project = await getProjectRecord(projectId);
  if (project.deleted) throw new CmsError('Önce projeyi geri alın.');
  const file = validateUpload(input.name, input.bytes), id = randomUUID();
  const plan: UploadPlan = { ...file, id, projectId, pathname: `originals/${projectId}/${id}/${file.name}` };
  await db().prepare('INSERT INTO cloud_uploads(id,project_id,data,created_at) VALUES(?,?,?,?)').run(id, projectId, JSON.stringify(plan), Date.now());
  return { cloud: true, id, pathname: plan.pathname };
}
export async function cloudUploadPlan(id: string): Promise<UploadPlan> {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new CmsError('Yükleme bulunamadı.', 404);
  const row = await db().prepare('SELECT data,status,created_at FROM cloud_uploads WHERE id=?').get(id);
  if (!row || row.status !== 'pending' || Number(row.created_at) < Date.now() - 24 * 60 * 60000) throw new CmsError('Yükleme süresi doldu. Dosyayı yeniden seçin.', 409);
  const plan = JSON.parse(row.data as string) as UploadPlan;
  if ((await getProjectRecord(plan.projectId)).deleted) throw new CmsError('Önce projeyi geri alın.');
  return plan;
}
async function readSmallBlob(pathname: string, destination: string, limit: number) {
  const result = await get(pathname, { access: 'private' });
  if (!result || result.statusCode !== 200) throw new CmsError('Yüklenen dosya bulunamadı.');
  const reader = result.stream.getReader(), file = await open(destination, 'wx');
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      bytes += value.length; if (bytes > limit) { await reader.cancel(); throw new CmsError('Dosya boyutu sınırı aşıldı.', 413); }
      await file.writeFile(value);
    }
  } finally { await file.close(); }
  return bytes;
}
export async function finishCloudUpload(projectId: string, id: string) {
  const existing = await findMedia(id);
  if (existing) { if (existing.projectId !== projectId) throw new CmsError('Dosya bu projeye ait değil.', 403); return getProjectRecord(projectId); }
  const plan = await cloudUploadPlan(id);
  if (plan.projectId !== projectId) throw new CmsError('Dosya bu projeye ait değil.', 403);
  // A lease allows safe retry after an interrupted serverless invocation.
  const lock = await db().prepare("UPDATE cloud_uploads SET lease_until=? WHERE id=? AND status='pending' AND lease_until<?").run(Date.now() + 6 * 60000, id, Date.now());
  if (!lock.changes) throw new CmsError('Dosya hâlâ hazırlanıyor. Biraz sonra tekrar deneyin.', 409);
  const temporary = await mkdtemp(join(tmpdir(), '16mm-upload-'));
  try {
    const original = await head(plan.pathname);
    if (original.size !== plan.bytes) throw new CmsError('Dosya eksik yüklendi. Tekrar deneyin.');
    const base = `/media/uploads/${id}/asset`, output = join(temporary, 'asset');
    const files: Record<string, string> = {};
    let image: Media['image'];
    if (plan.kind === 'image') {
      const source = join(temporary, `source${plan.extension}`);
      await readSmallBlob(plan.pathname, source, 128 * 1024 ** 2);
      const meta = await sharp(source, { limitInputPixels: 100_000_000 }).metadata();
      if (!['jpeg', 'png', 'webp', 'avif', 'heif', 'tiff'].includes(meta.format || '') || (meta.pages || 1) > 1) throw new CmsError('Bu görsel biçimi desteklenmiyor.');
      image = await convertImage(source, output, base);
    } else {
      // Read only the beginning of the remote film. The byte-identical original
      // remains in Blob; a short silent H.264 preview is encoded independently.
      const source = await signedMediaUrl(plan.pathname);
      const shared = ['-y', '-protocol_whitelist', 'https,tls,tcp,crypto,pipe,file', '-threads', '2', '-i', source];
      const { stdout } = await execute(ffmpeg.path, [...shared, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1'], { encoding: 'buffer', maxBuffer: 32 * 1024 ** 2, timeout: 60000 });
      image = await convertImage(stdout, `${output}-poster`, `${base}-poster`);
      await execute(ffmpeg.path, [...shared, '-t', '12', '-an', '-vf', "scale=w='min(960,iw)':h=-2", '-c:v', 'libx264', '-threads', '2', '-preset', 'veryfast', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${output}-preview.mp4`], { maxBuffer: 8 * 1024 ** 2, timeout: 150000 });
      files[`asset${plan.extension}`] = plan.pathname;
    }
    for (const name of await readdir(temporary)) {
      if (!name.startsWith('asset') || !/\.(webp|mp4)$/.test(name)) continue;
      const pathname = `processed/${projectId}/${id}/${name}`;
      await put(pathname, await readFile(join(temporary, name)), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: name.endsWith('.webp') ? 'image/webp' : 'video/mp4' });
      files[name] = pathname;
    }
    const media: Media = { id, projectId, kind: plan.kind, name: plan.name, image, bytes: plan.kind === 'image' ? image.bytes : plan.bytes, originalBytes: plan.bytes, uploaded: true, storage: { original: plan.pathname, files }, ...(plan.kind === 'video' ? { src: `${base}${plan.extension}`, previewSrc: `${base}-preview.mp4` } : {}) };
    return await transaction(async () => {
      const result = await addMedia(projectId, media);
      await db().prepare("UPDATE cloud_uploads SET status='complete',lease_until=0 WHERE id=?").run(id);
      return result;
    });
  } catch (error) {
    if (error instanceof CmsError) throw error;
    console.error('[cms] cloud processing failed', error instanceof Error ? error.name : 'Error');
    throw new CmsError(plan.kind === 'video' ? 'Video okunamadı. H.264 MP4 veya WebM olarak dışa aktarıp yeniden deneyin.' : 'Görsel okunamadı. JPG, PNG veya WebP olarak tekrar deneyin.');
  } finally {
    await rm(temporary, { recursive: true, force: true });
    await db().prepare('UPDATE cloud_uploads SET lease_until=0 WHERE id=?').run(id);
  }
}
