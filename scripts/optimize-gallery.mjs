import { stat } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { addImageSize, convertImage, convertVideo, imageRecipe, videoRecipe, widths } from './encode-media.mjs';
import { digest, exists, hashFile, imagePattern, normalize, readJson, slugify, sortNames, videoPattern, walk, withGalleryLock, writeJson } from './gallery-utils.mjs';

export async function optimizeGallery(root, { alreadyLocked = false } = {}) {
  return alreadyLocked ? optimizeUnlocked(root) : withGalleryLock(root, () => optimizeUnlocked(root));
}
async function optimizeUnlocked(root) {
  const archive = join(root, 'assets/gallery/originals');
  if (!(await exists(archive))) return false;
  const config = await readJson(join(root, 'assets/gallery/config.json'));
  const local = await readJson(join(root, 'assets/gallery/local.json'));
  const ffmpeg = process.env.FFMPEG_PATH || local.ffmpeg || 'ffmpeg';
  const cachePath = join(root, 'assets/gallery/cache.json');
  const cache = await readJson(cachePath);
  // Source removal never triggers deletion of a previously imported photograph.
  const records = { ...cache };
  const tree = await walk(archive);
  const media = tree.files.filter(path => imagePattern.test(path) || videoPattern.test(path));
  const unsupported = tree.files.filter(path => !imagePattern.test(path) && !videoPattern.test(path) && !/(^|\/)(desktop\.ini|Thumbs\.db|\.DS_Store|\._[^/]*)$/i.test(path));
  if (unsupported.length) throw new Error(`Desteklenmeyen dosyalar arşivde korundu; sessizce atlanmadı:\n${unsupported.join('\n')}`);
  let changed = 0, processed = 0;
  async function processMedia(relative) {
    const path = normalize(relative), source = join(archive, relative), folder = normalize(dirname(relative));
    const group = config.groups[folder.split('/')[0]];
    if (!group) throw new Error(`Kategori eşleştirmesi eksik: ${folder}. assets/gallery/config.json dosyasına ekleyin.`);
    const sourceStat = await stat(source), cached = cache[path], isImage = imagePattern.test(path);
    const recipe = isImage ? imageRecipe : videoRecipe;
    let valid = cached?.recipe === recipe && cached.sourceBytes === sourceStat.size && cached.mtimeMs === sourceStat.mtimeMs;
    if (valid) valid = (await Promise.all(cached.outputs.map(file => exists(join(root, 'public', file))))).every(Boolean);
    if (!valid) {
      try {
        const sha256 = await hashFile(source), id = `gallery-${digest(path).slice(0, 16)}`;
        const version = digest(`${sha256}-${recipe}`).slice(0, 12);
        const album = `${slugify(folder)}-${digest(folder).slice(0, 6)}`;
        const stem = `${slugify(basename(path, extname(path))).slice(0, 70)}-${digest(path).slice(0, 8)}-${version}`;
        const publicBase = `/media/gallery/${album}/${stem}`, output = join(root, 'public', publicBase);
        const common = { path, folder, id, sha256, sourceBytes: sourceStat.size, mtimeMs: sourceStat.mtimeMs, recipe };
        if (isImage) {
          const image = await convertImage(source, output, publicBase);
          records[path] = { ...common, kind: 'image', image, outputs: [image.src, ...widths.map(width => `${publicBase}-${width}.webp`)] };
        } else records[path] = { ...common, kind: 'video', ...await convertVideo(source, output, publicBase, ffmpeg) };
        changed++;
      } catch (error) {
        throw new Error(`Dönüştürülemedi, galeri yayını değiştirilmedi: ${path}\n${error.message}`, { cause: error });
      }
    }
    const record = records[path];
    const image = record.kind === 'image' ? record.image : record.poster;
    for (const width of widths) {
      const variant = image.src.replace(/\.webp$/, `-${width}.webp`);
      if (!record.outputs.includes(variant)) record.outputs.push(await addImageSize(image, root, width));
    }
    processed++;
    if (processed % 25 === 0 || processed === media.length) console.log(`Galeri: ${processed}/${media.length} dosya hazır (${changed} dönüştürüldü).`);
  }
  let checkpoint = 0;
  for (let offset = 0; offset < media.length; offset += 3) {
    const results = await Promise.allSettled(media.slice(offset, offset + 3).map(processMedia));
    if (changed !== checkpoint) { await writeJson(cachePath, records); checkpoint = changed; }
    const failure = results.find(result => result.status === 'rejected');
    if (failure) throw failure.reason;
  }
  await writeJson(cachePath, records);
  const images = {}, albums = new Map();
  for (const record of Object.values(records).sort((a, b) => sortNames(a.path, b.path))) {
    const group = config.groups[record.folder.split('/')[0]], override = config.projects?.[record.folder] || {};
    if (!group) throw new Error(`Kategori eşleştirmesi eksik: ${record.folder}`);
    const name = basename(record.folder).replace(/^\d+\s*[-–]\s*/, '');
    const title = override.title || (record.folder.includes('/') ? { tr: name, en: name } : group.title);
    const category = override.category || group.category;
    if (!['architecture', 'hotels', 'retail', 'product', 'lighting', 'food', 'music', 'exhibitions', 'talking-head', 'events', 'interiors', 'video', 'clips'].includes(category)) throw new Error(`Geçersiz kategori: ${category}`);
    if (!albums.has(record.folder)) albums.set(record.folder, { sourceFolder: record.folder, slug: override.slug || `${slugify(record.folder)}-${digest(record.folder).slice(0, 6)}`, category, categories: [category], title, description: { tr: `${title.tr} — Fotoğraf ve film çalışmaları.`, en: `${title.en} — Photography and film.` }, photoKeys: [], videos: [], coverKey: null });
    const project = albums.get(record.folder);
    if (record.kind === 'image') {
      images[record.id] = record.image; project.photoKeys.push(record.id);
      if (override.cover === basename(record.path)) project.coverKey = record.id;
    } else {
      const posterKey = `${record.id}-poster`;
      images[posterKey] = record.poster;
      project.videos.push({ ...record.video, posterKey, title: basename(record.path, extname(record.path)) });
      if (!project.categories.includes('video')) project.categories.push('video');
    }
  }
  const projects = [...albums.values()].map(project => {
    if (config.projects?.[project.sourceFolder]?.cover && !project.coverKey) throw new Error(`Seçilen kapak bulunamadı: ${project.sourceFolder}`);
    return { ...project, coverKey: project.coverKey || project.photoKeys[0] || project.videos[0].posterKey };
  });
  if (new Set(projects.map(project => project.slug)).size !== projects.length) throw new Error('Proje adresleri benzersiz olmalı.');
  const all = Object.values(records);
  const report = {
    imageCount: all.filter(record => record.kind === 'image').length,
    videoCount: all.filter(record => record.kind === 'video').length,
    projectCount: projects.length,
    originalImageBytes: all.filter(record => record.kind === 'image').reduce((sum, record) => sum + record.sourceBytes, 0),
    webpMasterBytes: Object.values(images).reduce((sum, image) => sum + image.bytes, 0),
    webpAllSizesBytes: Object.values(images).reduce((sum, image) => sum + image.totalBytes, 0),
    files: all.map(({ path, id, sha256, kind, outputs, folder }) => ({ path, id, sha256, kind, outputs, folder }))
  };
  // Publish one manifest only when the complete import succeeds.
  await writeJson(join(root, 'src/content/gallery.json'), { projects, images });
  await writeJson(join(root, 'assets/gallery/report.json'), report);
  console.log(`${report.imageCount} fotoğraf, ${report.videoCount} video, ${projects.length} albüm. ${changed} dosya dönüştürüldü. WebP ana görseller: ${(report.webpMasterBytes / 1048576).toFixed(1)} MiB.`);
  return true;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await optimizeGallery(resolve(process.env.GALLERY_PROJECT_ROOT || resolve(import.meta.dirname, '..')));
