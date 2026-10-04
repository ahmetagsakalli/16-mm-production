import { resolve, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { optimizeGallery } from './optimize-gallery.mjs';
import { exists } from './gallery-utils.mjs';
import { optimizeHero } from './optimize-hero.mjs';
import { fetchDeployMedia } from './fetch-deploy-media.mjs';
import { restoreTransferredMedia } from './restore-transfer.mjs';
const root = resolve(import.meta.dirname, '..');
if (process.env.VERCEL) {
  // A deployment contains prepared media, not the private source archive.
  // Never scan an empty originals directory and replace the real catalog.
  await fetchDeployMedia(root);
  const gallery = JSON.parse(await readFile(join(root, 'src/content/gallery.json'), 'utf8'));
  if (!gallery.projects.length || !Object.keys(gallery.images).length) throw new Error('Yayın galerisi boş; derleme durduruldu.');
  const hero = JSON.parse(await readFile(join(root, 'src/content/hero-images.json'), 'utf8'));
  for (const image of Object.values(hero)) for (const src of [image.src, image.mobileSrc].filter(Boolean)) {
    if (!(await exists(join(root, 'public', src)))) throw new Error(`Hero dosyası eksik: ${src}`);
  }
  console.log(`Hazır yayın galerisi doğrulandı: ${gallery.projects.length} proje.`);
} else {
  await restoreTransferredMedia(root);
  if (!(await optimizeGallery(root))) {
    if (!(await exists(join(root, 'src/content/gallery.json')))) throw new Error('Önce import:gallery komutuyla galeri ekleyin.');
    console.log('Hazır WebP galerisi kullanılıyor; özel orijinal arşiv dağıtımda gerekli değil.');
  }
  await optimizeHero(root);
}

const { preparePortfolio } = await import('./prepare-portfolio.mjs');
await preparePortfolio(root);
