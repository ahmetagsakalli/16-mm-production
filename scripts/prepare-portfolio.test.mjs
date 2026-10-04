import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { preparePortfolio } from './prepare-portfolio.mjs';

test('cloud builds preserve prepared content even when an empty source directory exists', async () => {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-deploy-'));
  const previous = process.env.VERCEL;
  process.env.VERCEL = '1';
  try {
    await mkdir(join(root, 'assets/client-2026-10-02'), { recursive: true });
    const identity = { logo: { src: '/media/logo.webp' }, portrait: { src: '/media/portrait.webp' }, references: [{ src: '/media/reference.webp' }] };
    const slides = [{ image: { src: '/media/home/selected.webp' } }];
    const manifests = new Map([
      ['identity.json', JSON.stringify(identity)],
      ['home-slides.json', JSON.stringify(slides)],
    ]);
    await mkdir(join(root, 'src/content'), { recursive: true });
    for (const [name, content] of manifests) await writeFile(join(root, 'src/content', name), content);
    const assets = ['/media/logo.webp', '/media/portrait.webp', '/media/reference.webp', '/media/home/selected.webp', ...[640, 768, 1280, 1920, 2560].map(width => `/media/home/selected-${width}.webp`)];
    for (const src of assets) {
      const file = join(root, 'public', src);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, 'existing prepared asset');
    }
    await preparePortfolio(root);
    for (const [name, content] of manifests) assert.equal(await readFile(join(root, 'src/content', name), 'utf8'), content);
    for (const src of assets) assert.equal(await readFile(join(root, 'public', src), 'utf8'), 'existing prepared asset');

    await rm(join(root, 'public/media/home/selected-2560.webp'));
    await assert.rejects(preparePortfolio(root), /Hazır portfolyo dosyası eksik/);
    for (const [name, content] of manifests) assert.equal(await readFile(join(root, 'src/content', name), 'utf8'), content);
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
    await rm(root, { recursive: true, force: true });
  }
});
