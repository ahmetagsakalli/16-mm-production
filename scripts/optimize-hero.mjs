import sharp from 'sharp';
import { mkdir, rename, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { exists, readJson, writeJson } from './gallery-utils.mjs';

// Keep the archive and portfolio renditions intact. Only these hero photographs
// receive a separate, less compressed rendition, encoded before deployment.
const sources = [
  '1- MİMARİ/4- Hilltown avm/Hilltown II-36.jpg',
  '1- MİMARİ/17- Acıbadem Bodrum Hastanesi/Ozan Arslan Architecure Photography (7).jpg',
  '1- MİMARİ/23- Emaar Toskana Vadisi/Toskana Vadisi Detay Gece-63.jpg',
];

export async function optimizeHero(root) {
  const archive = join(root, 'assets/gallery/originals');
  if (!(await exists(archive))) return;
  const cache = await readJson(join(root, 'assets/gallery/cache.json'));
  const images = {};
  await mkdir(join(root, 'public/media/hero'), { recursive: true });
  for (const source of sources) {
    const record = cache[source];
    if (!record?.image) throw new Error(`Hero kaynağı bulunamadı: ${source}`);
    const src = `/media/hero/${record.id}-${record.sha256.slice(0, 12)}-q92.webp`;
    const destination = join(root, 'public', src);
    if (!(await exists(destination))) {
      const temporary = `${destination}.${process.pid}.tmp`;
      await sharp(join(archive, source)).rotate()
        .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
        .toColourspace('srgb').webp({ quality: 92, effort: 6 }).toFile(temporary);
      await rename(temporary, destination);
    }
    const { width, height, blurDataURL } = record.image;
    const bytes = (await stat(destination)).size;
    let mobileSrc = src, mobileBytes = 0;
    if (width / height > .75) {
      mobileSrc = src.replace('.webp', '-mobile-3x4.webp');
      const mobileDestination = join(root, 'public', mobileSrc);
      if (!(await exists(mobileDestination))) {
        const master = await sharp(join(archive, source)).rotate()
          .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
          .toColourspace('srgb').png().toBuffer();
        const cropWidth = Math.round(height * .75);
        const temporary = `${mobileDestination}.${process.pid}.tmp`;
        // Match the mobile CSS focal point, retaining the original source pixels.
        await sharp(master).extract({ left: Math.round((width - cropWidth) * .47), top: 0, width: cropWidth, height })
          .webp({ quality: 92, effort: 6 }).toFile(temporary);
        await rename(temporary, mobileDestination);
      }
      mobileBytes = (await stat(mobileDestination)).size;
    }
    images[record.image.src] = { src, mobileSrc, width, height, blurDataURL, bytes, totalBytes: bytes + mobileBytes };
  }
  await writeJson(join(root, 'src/content/hero-images.json'), images);
  console.log(`${sources.length} hero görseli yüksek kaliteli WebP olarak hazır.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await optimizeHero(resolve(import.meta.dirname, '..'));
}
