import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rm, rename } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';
import { convertImage, convertVideo } from '../../../scripts/encode-media.mjs';
import { addMedia, dataDirectory, db, getProjectRecord, transaction } from './store';
import { CmsError, type Media } from './types';

export async function upload(request: Request, projectId: string) {
  const project = getProjectRecord(projectId); if (project.deleted) throw new CmsError('Önce projeyi geri alın.');
  let name: string;
  try { name = decodeURIComponent(request.headers.get('x-file-name') || '').normalize('NFC'); } catch { throw new CmsError('Dosya adı geçersiz.'); }
  if (!name || name.length > 240 || /[/\\\x00-\x1f]/.test(name) || basename(name) !== name) throw new CmsError('Dosya adı geçersiz.');
  const extension = extname(name).toLowerCase();
  const image = /^\.(jpe?g|png|webp|avif|tiff?|heic|heif)$/.test(extension);
  const video = /^\.(mp4|mov|m4v|webm)$/.test(extension);
  if (!image && !video) throw new CmsError('JPG, PNG, WebP, AVIF, TIFF, HEIC veya MP4, MOV, WebM yükleyin.');
  const limit = image ? 128 * 1024 ** 2 : 2 * 1024 ** 3;
  if (Number(request.headers.get('content-length') || 0) > limit) throw new CmsError('Dosya boyutu sınırı aşıldı.', 413);
  if (!request.body) throw new CmsError('Dosya boş.');
  const id = randomUUID();
  transaction(() => {
    db().prepare('DELETE FROM jobs WHERE expires<?').run(Date.now());
    if (db().prepare('SELECT id FROM jobs WHERE id=1').get()) throw new CmsError('Bir dosya işleniyor. İşlem bittikten sonra tekrar yükleyin.', 409);
    db().prepare('INSERT INTO jobs VALUES(1,?,?)').run(id, Date.now() + 60 * 60000);
  });
  const temporary = join(dataDirectory(), 'incoming', id);
  const originalFolder = join(dataDirectory(), 'originals', projectId, id);
  const outputFolder = join(dataDirectory(), 'media', id);
  const finalOriginal = join(originalFolder, name);
  let retained = false;
  try {
    await mkdir(temporary, { recursive: true, mode: 0o700 });
    const source = join(temporary, `source${extension}`), file = await open(source, 'wx', 0o600);
    const reader = request.body.getReader(); let bytes = 0;
    try { while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > limit) { await reader.cancel(); throw new CmsError('Dosya boyutu sınırı aşıldı.', 413); } await file.writeFile(value); } } finally { await file.close(); }
    if (!bytes) throw new CmsError('Dosya boş.');
    await mkdir(outputFolder, { recursive: true, mode: 0o700 });
    const output = join(outputFolder, 'asset'), publicBase = `/media/uploads/${id}/asset`;
    let media: Media;
    if (image) {
      if (!/^\.hei[cf]$/.test(extension)) { const meta = await sharp(source, { limitInputPixels: 100_000_000 }).metadata(); if (!['jpeg', 'png', 'webp', 'avif', 'heif', 'tiff'].includes(meta.format || '') || (meta.pages || 1) > 1) throw new CmsError('Bu görsel biçimi desteklenmiyor.'); }
      const optimized = await convertImage(source, output, publicBase);
      media = { id, projectId, kind: 'image', name, image: optimized, bytes: optimized.bytes, originalBytes: bytes, uploaded: true };
    } else {
      const sourceFile = await open(source, 'r'); const signature = Buffer.alloc(12);
      try { await sourceFile.read(signature, 0, 12, 0); } finally { await sourceFile.close(); }
      if (!['ftyp', 'moov', 'mdat', 'wide', 'free'].includes(signature.toString('ascii', 4, 8)) && signature.readUInt32BE(0) !== 0x1a45dfa3) throw new CmsError('Geçerli bir MP4, MOV veya WebM dosyası yükleyin.');
      let local: { ffmpeg?: string } = {}; try { local = JSON.parse(await readFile(join(process.cwd(), 'assets/gallery/local.json'), 'utf8')); } catch {}
      const encoded = await convertVideo(source, output, publicBase, process.env.FFMPEG_PATH || local.ffmpeg || 'ffmpeg');
      media = { id, projectId, kind: 'video', name, image: encoded.poster, src: encoded.video.src, previewSrc: encoded.video.previewSrc, bytes: encoded.video.bytes, originalBytes: bytes, uploaded: true };
    }
    await mkdir(originalFolder, { recursive: true, mode: 0o700 }); await rename(source, finalOriginal);
    const result = addMedia(projectId, media); retained = true; return result;
  } catch (error) {
    if (error instanceof CmsError) throw error;
    console.error('[cms] upload failed', error instanceof Error ? error.name : 'Error');
    throw new CmsError(video ? 'Video işlenemedi. Dosyayı ve FFmpeg kurulumunu kontrol edin.' : 'Görsel okunamadı. Geçerli bir görsel yükleyin.');
  } finally {
    await rm(temporary, { recursive: true, force: true });
    if (!retained) { await rm(outputFolder, { recursive: true, force: true }); await rm(originalFolder, { recursive: true, force: true }); }
    db().prepare('DELETE FROM jobs WHERE owner=?').run(id);
  }
}
