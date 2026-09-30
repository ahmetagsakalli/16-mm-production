import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { importSources, readJson, writeJson } from './gallery-utils.mjs';
import { optimizeGallery } from './optimize-gallery.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'ozan-gallery-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'incoming');
  const archive = join(root, 'assets/gallery/originals');
  await mkdir(join(source, '1- MİMARİ/A'), { recursive: true });
  await mkdir(join(source, '1- MİMARİ/B'), { recursive: true });
  await mkdir(join(source, '1- MİMARİ/Boş proje'), { recursive: true });
  await writeJson(join(root, 'assets/gallery/config.json'), { groups: { '1- MİMARİ': { category: 'architecture', title: { tr: 'Mimari', en: 'Architecture' } } } });
  return { root, source, archive };
}

test('Import preserves identical photos in different projects, empty folders, extensions and original bytes', async t => {
  const { root, source, archive } = await fixture(t);
  const photo = await sharp({ create: { width: 90, height: 60, channels: 3, background: '#888' } }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  for (const path of ['1- MİMARİ/A/same.jpg', '1- MİMARİ/B/same.jpg']) await writeFile(join(source, path), photo);
  await sharp({ create: { width: 40, height: 20, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 0.5 } } }).png().toFile(join(source, '1- MİMARİ/A/same.png'));
  await writeFile(join(source, '1- MİMARİ/A/Thumbs.db'), 'keep original auxiliary file');
  const imported = await importSources([source], archive);
  assert.equal(imported.length, 4);
  assert.deepEqual(await readdir(join(archive, '1- MİMARİ/Boş proje')), []);
  assert.deepEqual(await readFile(join(archive, '1- MİMARİ/A/same.jpg')), photo);
  await optimizeGallery(root);
  const manifestPath = join(root, 'src/content/gallery.json');
  const manifest = await readJson(manifestPath);
  assert.equal(manifest.projects.length, 2);
  assert.equal(Object.keys(manifest.images).length, 3);
  assert.equal(manifest.projects.reduce((n, p) => n + p.photoKeys.length, 0), 3);
  for (const image of Object.values(manifest.images)) {
    const metadata = await sharp(join(root, 'public', image.src)).metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.exif, undefined);
    assert.ok(image.width <= 90 && image.height <= 90);
  }
  const report = await readJson(join(root, 'assets/gallery/report.json'));
  const jpg = report.files.find(file => file.path === '1- MİMARİ/A/same.jpg');
  assert.deepEqual([manifest.images[jpg.id].width, manifest.images[jpg.id].height], [60, 90]);
  const png = report.files.find(file => file.path.endsWith('.png'));
  assert.equal((await sharp(join(root, 'public', manifest.images[png.id].src)).metadata()).hasAlpha, true);
  const output = join(root, 'public', manifest.images[jpg.id].src);
  const modified = (await stat(output)).mtimeMs;
  await optimizeGallery(root);
  assert.equal((await stat(output)).mtimeMs, modified);
  // A missing derivative is repaired; removing a source does not remove published media.
  await rm(join(root, 'public', jpg.outputs[1]));
  await optimizeGallery(root);
  await stat(join(root, 'public', jpg.outputs[1]));
  await rm(join(archive, '1- MİMARİ/B/same.jpg'));
  await optimizeGallery(root);
  assert.equal(Object.keys((await readJson(manifestPath)).images).length, 3);
  // A later upload appears in its project without removing earlier records.
  await writeFile(join(source, '1- MİMARİ/A/new-photo.jpg'), photo);
  await importSources([source], archive);
  await optimizeGallery(root);
  assert.equal(Object.keys((await readJson(manifestPath)).images).length, 4);
  assert.equal((await readJson(manifestPath)).projects.find(project => project.title.tr === 'A').photoKeys.length, 3);
  // Failed conversions leave the last complete site manifest intact.
  const before = await readFile(manifestPath);
  await writeFile(join(archive, '1- MİMARİ/A/broken.jpg'), 'broken');
  await assert.rejects(optimizeGallery(root), /broken\.jpg/);
  assert.deepEqual(await readFile(manifestPath), before);
});

test('Conflicting imports fail before overwriting any original', async t => {
  const { source, archive } = await fixture(t);
  await writeFile(join(source, '1- MİMARİ/A/photo.jpg'), 'original');
  await importSources([source], archive);
  await writeFile(join(source, '1- MİMARİ/A/photo.jpg'), 'replacement');
  await assert.rejects(importSources([source], archive), /aynı adlı farklı dosya/);
  assert.equal(await readFile(join(archive, '1- MİMARİ/A/photo.jpg'), 'utf8'), 'original');
});
