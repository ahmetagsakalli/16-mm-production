import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, rename, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
const execute = promisify(execFile);
export const widths = [640, 768, 1280, 1920, 2560];
export const imageRecipe = 'webp-85-srgb-2560-responsive-v1';
export const videoRecipe = `${imageRecipe}-h264-24-preview-26-v1`;
sharp.concurrency(2);
sharp.cache({ memory: 64, files: 20, items: 50 });
async function writeWebp(pipeline, destination) {
  const temporary = `${destination}.${process.pid}.tmp`;
  const result = await pipeline.toFile(temporary);
  await rename(temporary, destination);
  return result;
}

export async function addImageSize(image, root, width) {
  const src = image.src.replace(/\.webp$/, `-${width}.webp`);
  const result = await writeWebp(sharp(join(root, 'public', image.src)).resize({ width, withoutEnlargement: true }).webp({ quality: 85, effort: 4 }), join(root, 'public', src));
  image.totalBytes += result.size;
  return src;
}

async function webpImage(input, output, publicBase) {
  await mkdir(dirname(output), { recursive: true });
  const master = await sharp(input).rotate().resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true }).toColourspace('srgb').png().toBuffer();
  const result = await writeWebp(sharp(master).webp({ quality: 85, effort: 4 }), `${output}.webp`);
  let totalBytes = result.size;
  for (const width of widths) {
    const variant = await writeWebp(sharp(master).resize({ width, withoutEnlargement: true }).webp({ quality: 85, effort: 4 }), `${output}-${width}.webp`);
    totalBytes += variant.size;
  }
  const tiny = await sharp(master).resize({ width: 16 }).webp({ quality: 30 }).toBuffer();
  return { src: `${publicBase}.webp`, width: result.width, height: result.height, blurDataURL: `data:image/webp;base64,${tiny.toString('base64')}`, bytes: result.size, totalBytes };
}
export async function convertImage(source, output, publicBase) {
  if (!/\.hei[cf]$/i.test(source) || process.platform !== 'darwin') return webpImage(source, output, publicBase);
  const temp = await mkdtemp(join(tmpdir(), 'ozan-heic-'));
  try {
    const png = join(temp, 'decoded.png');
    await execute('sips', ['-s', 'format', 'png', source, '--out', png]);
    return await webpImage(png, output, publicBase);
  } finally { await rm(temp, { recursive: true, force: true }); }
}
export async function convertVideo(source, output, publicBase, ffmpeg) {
  await mkdir(dirname(output), { recursive: true });
  const full = `${output}.mp4`, preview = `${output}-preview.mp4`;
  await execute(ffmpeg, ['-y', '-protocol_whitelist', 'file,pipe', '-threads', '2', '-i', source, '-map', '0:v:0', '-map', '0:a:0?', '-vf', "scale=w='min(1920,iw)':h=-2", '-c:v', 'libx264', '-threads', '2', '-preset', 'medium', '-crf', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', full], { maxBuffer: 8 * 1024 * 1024, timeout: 20 * 60 * 1000 });
  await execute(ffmpeg, ['-y', '-protocol_whitelist', 'file,pipe', '-threads', '2', '-i', source, '-t', '24', '-an', '-vf', "scale=w='min(1280,iw)':h=-2", '-c:v', 'libx264', '-threads', '2', '-preset', 'medium', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', preview], { maxBuffer: 8 * 1024 * 1024, timeout: 20 * 60 * 1000 });
  const frameArgs = ['-protocol_whitelist', 'file,pipe', '-i', source, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1'];
  let { stdout: frame } = await execute(ffmpeg, ['-ss', '2', ...frameArgs], { encoding: 'buffer', maxBuffer: 24 * 1024 * 1024, timeout: 120000 });
  if (!frame.length) ({ stdout: frame } = await execute(ffmpeg, frameArgs, { encoding: 'buffer', maxBuffer: 24 * 1024 * 1024, timeout: 120000 }));
  const poster = await webpImage(frame, `${output}-poster`, `${publicBase}-poster`);
  return { poster, video: { src: `${publicBase}.mp4`, previewSrc: `${publicBase}-preview.mp4`, bytes: (await stat(full)).size, previewBytes: (await stat(preview)).size }, outputs: [`${publicBase}.mp4`, `${publicBase}-preview.mp4`, poster.src, ...widths.map(width => `${publicBase}-poster-${width}.webp`)] };
}
