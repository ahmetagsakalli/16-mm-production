import { resolve, join } from 'node:path';
import { optimizeGallery } from './optimize-gallery.mjs';
import { exists } from './gallery-utils.mjs';
import { optimizeHero } from './optimize-hero.mjs';
const root = resolve(import.meta.dirname, '..');
if (!(await optimizeGallery(root))) {
  if (!(await exists(join(root, 'src/content/gallery.json')))) throw new Error('Önce import:gallery komutuyla galeri ekleyin.');
  console.log('Hazır WebP galerisi kullanılıyor; özel orijinal arşiv dağıtımda gerekli değil.');
}
await optimizeHero(root);
