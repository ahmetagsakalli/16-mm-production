import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, symlink, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import sharp from 'sharp';
const execute = promisify(execFile);
const project = resolve(import.meta.dirname, '..');
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'ozan-webp-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await Promise.all(['scripts', 'assets/originals', 'src/content'].map(dir => mkdir(join(root, dir), { recursive: true })));
  await symlink(join(project, 'node_modules'), join(root, 'node_modules'), 'dir');
  await copyFile(join(project, 'scripts/optimize-images.mjs'), join(root, 'scripts/optimize-images.mjs'));
  return { root, run: () => execute(process.execPath, [join(root, 'scripts/optimize-images.mjs')]) };
}
test('WebP conversion preserves orientation and alpha, limits dimensions and skips unchanged images', async t => {
  const { root, run } = await fixture(t);
  const originals = join(root, 'assets/originals');
  await sharp({ create: { width: 320, height: 180, channels: 3, background: '#918872' } }).withMetadata({ orientation: 6 }).jpeg().toFile(join(originals, 'rotated.jpg'));
  await sharp({ create: { width: 64, height: 32, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 0.5 } } }).png().toFile(join(originals, 'alpha.png'));
  await sharp({ create: { width: 3000, height: 1500, channels: 3, background: '#888888' } }).jpeg().toFile(join(originals, 'large.jpg'));
  const before = await readFile(join(originals, 'rotated.jpg'));
  await run();
  const manifest = JSON.parse(await readFile(join(root, 'src/content/images.json'), 'utf8'));
  assert.deepEqual([manifest.rotated.width, manifest.rotated.height], [180, 320]);
  assert.deepEqual([manifest.alpha.width, manifest.alpha.height], [64, 32]);
  assert.deepEqual([manifest.large.width, manifest.large.height], [2560, 1280]);
  const converted = join(root, 'public', manifest.alpha.src);
  const info = await sharp(converted).metadata();
  assert.equal(info.format, 'webp');
  assert.equal(info.hasAlpha, true);
  assert.equal(info.exif, undefined);
  assert.deepEqual(await readFile(join(originals, 'rotated.jpg')), before);
  const timestamp = (await stat(converted)).mtimeMs;
  const second = await run();
  assert.match(second.stdout, /0 converted/);
  assert.equal((await stat(converted)).mtimeMs, timestamp);
});
test('Corrupt image fails with a clear filename', async t => {
  const { root, run } = await fixture(t);
  await writeFile(join(root, 'assets/originals/broken.jpg'), 'not an image');
  await assert.rejects(run(), /Image conversion failed for broken\.jpg/);
});
