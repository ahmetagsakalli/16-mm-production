import { createReadStream } from 'node:fs';
import { access, mkdir, open, readFile, rename, stat, unlink, utimes } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function sha256(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function restoreTransferredMedia(root) {
  const manifestPath = join(root, '.transfer/media-parts.json');
  try { await access(manifestPath); } catch { return; }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const localPath = (value) => {
    const result = resolve(root, value);
    const rel = relative(root, result);
    if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Geçersiz aktarım yolu.');
    return result;
  };
  for (const item of manifest.files) {
    const destination = localPath(item.path);
    const existing = await stat(destination).catch((error) => { if (error.code === 'ENOENT') return null; throw error; });
    if (existing) {
      if (existing.size !== item.bytes || await sha256(destination) !== item.sha256) {
        throw new Error(`Mevcut dosya aktarım kopyasından farklı; üzerine yazılmadı: ${item.path}`);
      }
      continue;
    }
    await mkdir(dirname(destination), { recursive: true });
    const temporary = `${destination}.${randomUUID()}.restoring`;
    const output = await open(temporary, 'wx');
    const hash = createHash('sha256');
    let size = 0;
    try {
      for (const part of item.parts) {
        const bytes = await readFile(localPath(part.path));
        if (bytes.length !== part.bytes || createHash('sha256').update(bytes).digest('hex') !== part.sha256) {
          throw new Error(`Aktarım parçası eksik veya farklı: ${part.path}. Önce git lfs pull çalıştırın.`);
        }
        hash.update(bytes);
        size += bytes.length;
        await output.writeFile(bytes);
      }
      if (size !== item.bytes || hash.digest('hex') !== item.sha256) throw new Error(`Video bütünlüğü doğrulanamadı: ${item.path}`);
      await output.close();
      await utimes(temporary, item.mtimeMs / 1000, item.mtimeMs / 1000);
      await rename(temporary, destination);
      console.log(`Video eksiksiz birleştirildi: ${item.path}`);
    } catch (error) {
      await output.close().catch(() => {});
      await unlink(temporary).catch(() => {});
      throw error;
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await restoreTransferredMedia(resolve(import.meta.dirname, '..'));
}
