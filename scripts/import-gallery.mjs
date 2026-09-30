import { resolve, join } from 'node:path';
import { importSources, readJson, withGalleryLock, writeJson } from './gallery-utils.mjs';
import { optimizeGallery } from './optimize-gallery.mjs';

const root = resolve(process.env.GALLERY_PROJECT_ROOT || resolve(import.meta.dirname, '..'));
const sources = process.argv.slice(2).map(path => resolve(path));
if (!sources.length) throw new Error('Kullanım: ./run.sh import:gallery "/kategori-klasörlerini-içeren/arşiv" ["/ikinci-parça"]');
await withGalleryLock(root, async () => {
console.log('Orijinaller kopyalanıyor; klasörler ve SHA-256 değerleri doğrulanıyor…');
const imported = await importSources(sources, join(root, 'assets/gallery/originals'));
const indexPath = join(root, 'assets/gallery/archive-index.json');
const previous = await readJson(indexPath);
await writeJson(indexPath, { ...previous, ...Object.fromEntries(imported.map(item => [item.path, item])) });
console.log(`${imported.length} kaynak dosya doğrulandı. Orijinaller değiştirilmedi.`);
await optimizeGallery(root, { alreadyLocked: true });
});
