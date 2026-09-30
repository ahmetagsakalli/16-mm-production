import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { authenticated } from '@/lib/cms/auth';
import { dataDirectory, findMedia, mediaIsPublic } from '@/lib/cms/store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path.length !== 2 || !/^[a-f0-9-]{36}$/.test(path[0]) || !/^asset(?:-preview|-poster)?(?:-(?:640|768|1280|1920|2560))?\.(webp|mp4)$/.test(path[1])) return new Response(null, { status: 404 });
  const media = findMedia(path[0]); if (!media) return new Response(null, { status: 404 });
  const published = mediaIsPublic(media);
  if (!published && !await authenticated()) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const file = join(dataDirectory(), 'media', ...path), info = await stat(file).catch(() => null);
  if (!info) return new Response(null, { status: 404 });
  const headers = new Headers({ 'Content-Type': path[1].endsWith('.mp4') ? 'video/mp4' : 'image/webp', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store', 'Accept-Ranges': 'bytes' });
  let start = 0, end = info.size - 1, status = 200;
  const range = request.headers.get('range');
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } });
    start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2])); end = match[1] && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } });
    status = 206; headers.set('Content-Range', `bytes ${start}-${end}/${info.size}`);
  }
  headers.set('Content-Length', String(end - start + 1));
  return new Response(Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream, { status, headers });
}
