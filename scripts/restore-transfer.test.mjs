import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { restoreTransferredMedia } from './restore-transfer.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), '16mm-transfer-test-'));
  await mkdir(join(root, '.transfer'), { recursive: true });
  const bytes = Buffer.from('16mm film — bütün kareler ve ses korunur.');
  const pieces = [bytes.subarray(0, 13), bytes.subarray(13)];
  const parts = await Promise.all(pieces.map(async (part, i) => {
    const path = `.transfer/${i}.part`;
    await writeFile(join(root, path), part);
    return { path, bytes: part.length, sha256: hash(part) };
  }));
  const path = 'public/media/movie.mp4';
  await writeFile(join(root, '.transfer/media-parts.json'), JSON.stringify({ files: [{ path, bytes: bytes.length, sha256: hash(bytes), mtimeMs: 1700000000000, parts }] }));
  return { root, bytes, destination: join(root, path) };
}

test('restores exact bytes and leaves an already restored file unchanged', async () => {
  const f = await fixture();
  try {
    await restoreTransferredMedia(f.root);
    assert.deepEqual(await readFile(f.destination), f.bytes);
    const before = await stat(f.destination);
    await restoreTransferredMedia(f.root);
    assert.equal((await stat(f.destination)).mtimeMs, before.mtimeMs);
  } finally { await rm(f.root, { recursive: true, force: true }); }
});

test('rejects a damaged part without publishing a partial movie', async () => {
  const f = await fixture();
  try {
    await writeFile(join(f.root, '.transfer/1.part'), 'broken');
    await assert.rejects(restoreTransferredMedia(f.root), /parçası eksik veya farklı/);
    await assert.rejects(stat(f.destination), { code: 'ENOENT' });
  } finally { await rm(f.root, { recursive: true, force: true }); }
});

test('never overwrites an existing movie with different contents', async () => {
  const f = await fixture();
  try {
    await mkdir(join(f.root, 'public/media'), { recursive: true });
    await writeFile(f.destination, 'user-edited-video');
    await assert.rejects(restoreTransferredMedia(f.root, { verifyExisting: true }), /üzerine yazılmadı/);
    assert.equal(await readFile(f.destination, 'utf8'), 'user-edited-video');
    // Ordinary dev/build runs preserve an existing later version of a movie.
    await restoreTransferredMedia(f.root);
    assert.equal(await readFile(f.destination, 'utf8'), 'user-edited-video');
  } finally { await rm(f.root, { recursive: true, force: true }); }
});
