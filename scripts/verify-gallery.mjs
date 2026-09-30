import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { exists, imagePattern, normalize, readJson, videoPattern, walk } from './gallery-utils.mjs';

const root = resolve(import.meta.dirname, '..');
const { projects, images } = await readJson(join(root, 'src/content/gallery.json'));
const report = await readJson(join(root, 'assets/gallery/report.json'));
const archiveIndex = await readJson(join(root, 'assets/gallery/archive-index.json'));
const keys = projects.flatMap(project => project.photoKeys);
assert.equal(keys.length, report.imageCount);
assert.equal(new Set(keys).size, report.imageCount, 'Her kaynak fotoğrafın ayrı kaydı olmalı');
assert.equal(projects.flatMap(project => project.videos).length, report.videoCount);
for (const project of projects) {
  assert.ok(images[project.coverKey], `Kapak bulunamadı: ${project.slug}`);
  for (const key of project.photoKeys) assert.ok(images[key], `Fotoğraf bulunamadı: ${key}`);
}
for (const record of report.files) {
  if (archiveIndex[record.path]) assert.equal(record.sha256, archiveIndex[record.path].sha256, `Arşiv özeti uyuşmuyor: ${record.path}`);
  for (const output of record.outputs) {
    const file = join(root, 'public', output);
    assert.ok((await stat(file)).size > 0, `Boş çıktı: ${output}`);
    if (output.endsWith('.webp')) {
      const metadata = await sharp(file).metadata();
      assert.equal(metadata.format, 'webp');
      await sharp(file).stats();
      assert.equal(metadata.exif, undefined);
      assert.ok(metadata.width <= 2560 && metadata.height <= 2560);
    }
  }
}
const archive = join(root, 'assets/gallery/originals');
if (await exists(archive)) {
  const paths = new Set(report.files.map(file => file.path));
  for (const path of (await walk(archive)).files.filter(path => imagePattern.test(path) || videoPattern.test(path))) assert.ok(paths.has(normalize(path)), `İçe aktarılmamış medya: ${path}`);
}
// All live photo URLs use WebP; videos intentionally retain their MP4 format.
assert.ok(Object.values(images).every(image => image.src.endsWith('.webp')));
assert.equal(projects.length, report.projectCount);
console.log(`Doğrulandı: ${report.imageCount} fotoğraf, ${report.videoCount} video, ${projects.length} proje; bütün WebP boyutları mevcut ve okunabilir.`);
