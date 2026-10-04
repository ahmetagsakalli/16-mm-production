import { watch } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { optimizeGallery } from './optimize-gallery.mjs';
import { preparePortfolio } from './prepare-portfolio.mjs';

const root = resolve(import.meta.dirname, '..');
await import('./prepare-media.mjs');
const archive = join(root, 'assets/gallery/originals');
await mkdir(archive, { recursive: true });
let pending = false, running = false, timer;
async function update() {
  pending = true;
  if (running) return;
  running = true;
  while (pending) {
    pending = false;
    try { await optimizeGallery(root); await preparePortfolio(root); } catch (error) { console.error(error.message); }
  }
  running = false;
}
const watcher = watch(archive, { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(update, 1500); });
const configWatcher = watch(join(root, 'assets/gallery'), (_event, filename) => { if (filename === 'config.json') { clearTimeout(timer); timer = setTimeout(update, 500); } });
const next = spawn(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--disable-source-maps', ...process.argv.slice(2)], { cwd: root, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { watcher.close(); configWatcher.close(); clearTimeout(timer); next.kill(signal); });
next.on('exit', code => { watcher.close(); configWatcher.close(); clearTimeout(timer); process.exit(code ?? 0); });
