import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { restoreTransferredMedia } from './restore-transfer.mjs';

const root = resolve(import.meta.dirname, '..');
await import('./setup-vps.mjs');
await restoreTransferredMedia(root, { verifyExisting: true });
// Use the exact prepared WebP files. A Git clone changes mtimes; that must not
// force hundreds of needless conversions or depend on a macOS FFmpeg path.
const manifest = JSON.parse(await readFile(join(root, '.transfer/public-files.json'), 'utf8'));
for (const entry of manifest.files) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(join(root, entry.path))) hash.update(chunk);
  if (hash.digest('hex') !== entry.sha256) throw new Error(`Eksik/farklı medya: ${entry.path}. git lfs pull çalıştırın.`);
}
console.log(`${manifest.files.length} hazır yayın dosyası doğrulandı.`);
for (const args of [
  ['--import', 'tsx', 'scripts/initialize-editorial.ts'],
  ['node_modules/next/dist/bin/next', 'build', '--webpack'],
]) {
  const child = spawnSync(process.execPath, args, { cwd: root, env: process.env, stdio: 'inherit' });
  if (child.error) throw child.error;
  if (child.status !== 0) process.exit(child.status ?? 1);
}
