import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { resolve, parse } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const input = resolve(root, 'assets/originals');
const output = resolve(root, 'public/images');
const cachePath = resolve(root, 'assets/.image-cache.json');
const manifestPath = resolve(root, 'src/content/images.json');
await mkdir(output, { recursive: true });
let cache = {};
try { cache = JSON.parse(await readFile(cachePath, 'utf8')); } catch {}
const manifest = {};
const updatedCache = {};
const files = (await readdir(input)).filter(name => /\.(jpe?g|png|webp)$/i.test(name)).sort();
const stems = new Set();
let changed = 0;
for (const file of files) {
  const name = parse(file).name;
  if (stems.has(name)) throw new Error(`Duplicate image name: ${name}`);
  stems.add(name);
  try {
    const buffer = await readFile(resolve(input, file));
    const hash = createHash('sha256').update(buffer).update('webp-85-2560-v1').digest('hex');
    const filename = `${name}-${hash.slice(0, 10)}.webp`;
    const dest = resolve(output, filename);
    let exists = true;
    try { await access(dest); } catch { exists = false; }
    let data = cache[file]?.data;
    if (cache[file]?.hash !== hash || !exists || !data) {
      const result = await sharp(buffer).rotate().resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true }).toColourspace('srgb').webp({ quality: 85, effort: 6 }).toFile(dest);
      const tiny = await sharp(buffer).rotate().resize({ width: 16 }).webp({ quality: 30 }).toBuffer();
      data = { src: `/images/${filename}`, width: result.width, height: result.height, blurDataURL: `data:image/webp;base64,${tiny.toString('base64')}`, bytes: result.size, originalBytes: buffer.length };
      changed++;
    }
    manifest[name] = data;
    updatedCache[file] = { hash, data };
  } catch (error) {
    throw new Error(`Image conversion failed for ${file}: ${error.message}`, { cause: error });
  }
}
const json = JSON.stringify(manifest, null, 2) + '\n';
let previous = '';
try { previous = await readFile(manifestPath, 'utf8'); } catch {}
if (json !== previous) await writeFile(manifestPath, json);
await writeFile(cachePath, JSON.stringify(updatedCache, null, 2) + '\n');
const original = Object.values(manifest).reduce((sum, item) => sum + item.originalBytes, 0);
const optimized = Object.values(manifest).reduce((sum, item) => sum + item.bytes, 0);
console.log(`Images: ${files.length} ready, ${changed} converted. ${(original / 1048576).toFixed(2)} MB → ${(optimized / 1048576).toFixed(2)} MB (${Math.round((1 - optimized / original) * 100)}% smaller).`);
