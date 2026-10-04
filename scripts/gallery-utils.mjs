import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const imagePattern = /\.(jpe?g|png|webp|tiff?|heic|heif|avif)$/i;
export const videoPattern = /\.(mp4|mov|m4v|webm)$/i;
export const normalize = value => value.normalize('NFC');
export const digest = value => createHash('sha256').update(value).digest('hex');
export const slugify = value => normalize(value).toLocaleLowerCase('tr').replaceAll('ı', 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const sortNames = (a, b) => a.localeCompare(b, 'tr', { numeric: true, sensitivity: 'base' });
export async function exists(path) { try { await access(path); return true; } catch { return false; } }
export async function readJson(path, fallback = {}) { try { return JSON.parse(await readFile(path, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; } }
export async function writeJson(path, value) {
  const text = JSON.stringify(value, null, 2) + '\n';
  if (await exists(path) && await readFile(path, 'utf8') === text) return;
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp, text);
  await rename(temp, path);
}
export async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
export async function withGalleryLock(root, action) {
  const lock = join(root, 'assets/gallery/.pipeline-lock');
  await mkdir(dirname(lock), { recursive: true });
  const started = Date.now();
  while (true) {
    try { await mkdir(lock); break; } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const owner = await readJson(join(lock, 'owner.json'), null);
      if (owner) {
        try { process.kill(owner.pid, 0); } catch (error) {
          if (error.code === 'ESRCH') { await rm(lock, { recursive: true, force: true }); continue; }
        }
      }
      if (Date.now() - started > 1800000) throw new Error('Başka bir galeri işlemi hâlâ sürüyor.');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  await writeJson(join(lock, 'owner.json'), { pid: process.pid });
  try { return await action(); } finally { await rm(lock, { recursive: true, force: true }); }
}
export async function walk(root, relative = '') {
  const files = [], directories = [];
  for (const entry of (await readdir(join(root, relative), { withFileTypes: true })).sort((a, b) => sortNames(a.name, b.name))) {
    const path = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Sembolik bağlantı desteklenmiyor: ${path}`);
    if (entry.isDirectory()) {
      directories.push(path);
      const nested = await walk(root, path);
      files.push(...nested.files); directories.push(...nested.directories);
    } else if (entry.isFile()) files.push(path);
  }
  return { files, directories };
}

// Additive import: never remove an archive entry and never overwrite different bytes.
export async function importSources(sources, archive) {
  await mkdir(archive, { recursive: true });
  const plan = new Map();
  const directories = new Set();
  for (const source of sources) {
    const tree = await walk(source);
    tree.directories.forEach(path => directories.add(normalize(path)));
    for (const relative of tree.files) {
      // Finder's per-computer view metadata is not gallery content.
      if (relative.split('/').some(part => part === '.DS_Store' || part.startsWith('._'))) continue;
      const path = normalize(relative);
      const sourcePath = join(source, relative);
      const hash = await hashFile(sourcePath);
      if (plan.has(path) && plan.get(path).sha256 !== hash) throw new Error(`Aynı yolda farklı dosyalar var; hiçbir dosya üzerine yazılmadı: ${path}`);
      const destination = join(archive, path);
      if (await exists(destination) && await hashFile(destination) !== hash) throw new Error(`Arşivde aynı adlı farklı dosya var; yeni bir dosya adı kullanın: ${path}`);
      plan.set(path, { path, sourcePath, sha256: hash, bytes: (await stat(sourcePath)).size });
    }
  }
  for (const path of directories) await mkdir(join(archive, path), { recursive: true });
  for (const item of plan.values()) {
    const destination = join(archive, item.path);
    await mkdir(dirname(destination), { recursive: true });
    if (!(await exists(destination))) await copyFile(item.sourcePath, destination);
    if (await hashFile(destination) !== item.sha256) throw new Error(`Kopya doğrulanamadı: ${item.path}`);
  }
  return [...plan.values()].map(({ path, sha256, bytes }) => ({ path, sha256, bytes }));
}
