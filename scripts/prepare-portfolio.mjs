import sharp from 'sharp';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { exists, readJson, writeJson, digest, slugify } from './gallery-utils.mjs';

const selected = ['Emaar Square Mall-196', 'Ozan Arslan Architecure Photography147', 'Hilltown III-80', 'IGA_ISTANBUL_AIRPORT_NEW_YEAR_DECORATION-349', 'IGA_ISTANBUL_AIRPORT_NEW_YEAR_DECORATION-207', 'Paşa Konağı ikinci çekim-188', 'Kırşehir Villa-008', 'Kırşehir Villa-096', 'Ozan Arslan Architecure Photography (13)', 'Tiffany_Co ZORLU28', 'Beymen-2', 'Orion Adatepe renk-15', 'İda Trio Otel-302'];
const references = {
  'Antwell Suites .png': 'Antwell Suites', 'artside mimarlık.png': 'Artside Mimarlık', 'Casa Gaia Otel Bozcaada.jpeg': 'Casa Gaia',
  'emaar.png': 'Emaar', 'fitoz.png': 'Fitoz', 'hexalight.png': 'Hexalight', 'highlight1.png': 'Highlight', 'hyatt-house.svg': 'Hyatt House',
  'ida Trio Otel .webp': 'İda Trio', 'karauzum-bozcaada.jpg': 'Kara Üzüm', 'lizay.png': 'Lizay', 'lizera.png': 'Lizera', 'markaled.png': 'Markaled',
  'MK_Illumination.svg.webp': 'MK Illumination', 'ms sparkle light.png': 'MS Sparkle Light', 'myhome_architecture_cover.jpeg': 'MyHome Architecture',
  'na-lightstyle.jpg': 'NA Lightstyle', 'nka mimarlık.jpeg': 'NKA Mimarlık', 'Olivera.webp': 'Olivera', 'platform-office-dark-logo.png': 'Platform Office',
  'prolux': 'Prolux', 'ramada-logo.jpg': 'Ramada', 'redi led.png': 'Redi LED', 'SCHoeNER.webp': 'Schöner', 'storks_diamond.png': 'Storks Diamond',
  'teras-otel-logo-aa2.png': 'Teras Otel', 'Urban+Lumina.webp': 'Urban Lumina', 'Vackerlite-Logo.png': 'Vackerlite',
};

export async function preparePortfolio(root) {
  if (process.env.VERCEL) {
    // Deploy prepared assets as-is. Ignored source directories may still exist
    // in the upload, so their presence must never trigger a cloud re-import.
    const identity = await readJson(join(root, 'src/content/identity.json'));
    const slides = await readJson(join(root, 'src/content/home-slides.json'));
    if (!identity?.logo?.src || !identity?.portrait?.src || !identity.references?.length || !slides?.length) {
      throw new Error('Hazır portfolyo içeriği eksik; derleme durduruldu.');
    }
    const paths = [identity.logo.src, identity.portrait.src, ...identity.references.map(image => image.src)];
    for (const { image } of slides) {
      paths.push(image.src, ...[640, 768, 1280, 1920, 2560].map(width => image.src.replace(/\.webp$/, `-${width}.webp`)));
    }
    for (const src of paths) {
      const file = join(root, 'public', src);
      if (!(await exists(file)) || !(await stat(file)).size) throw new Error(`Hazır portfolyo dosyası eksik: ${src}`);
    }
    console.log(`Hazır portfolyo doğrulandı: ${paths.length} dosya; içerikler değiştirilmedi.`);
    return;
  }
  const source = join(root, 'assets/client-2026-10-02');
  if (!(await exists(source))) return;
  await mkdir(join(root, 'public/media/identity'), { recursive: true });
  async function identity(path, name, width, lossless = true) {
    const bytes = await readFile(join(source, path));
    const src = `/media/identity/${name}-${digest(bytes).slice(0, 10)}.webp`;
    if (!(await exists(join(root, 'public', src)))) {
      await sharp(bytes).rotate().resize({ width, withoutEnlargement: true }).toColourspace('srgb').webp({ lossless, quality: 90, effort: 5 }).toFile(join(root, 'public', src));
    }
    const meta = await sharp(join(root, 'public', src)).metadata();
    return { src, width: meta.width, height: meta.height };
  }
  const logo = await identity('branding/16mm logo.png', '16mm-production', 640);
  const portrait = await identity('contact.jpeg', 'ozan-arslan', 854, false);
  const logos = [];
  for (const [file, name] of Object.entries(references)) {
    logos.push({ name, ...await identity(`branding/${file}`, slugify(name), 420) });
  }
  await writeJson(join(root, 'src/content/identity.json'), { logo, portrait, references: logos });
  const cache = await readJson(join(root, 'assets/gallery/cache.json'));
  const slides = [], missing = [], ambiguous = [];
  await mkdir(join(root, 'public/media/home'), { recursive: true });
  for (const name of selected) {
    const matches = Object.entries(cache).filter(([path, record]) => record.image && path.split('/').pop().replace(/\.[^.]+$/, '').normalize('NFC') === name);
    if (matches.length !== 1) { (matches.length ? ambiguous : missing).push({ name, matches: matches.map(([path]) => path) }); continue; }
    const [path, record] = matches[0];
    const src = `/media/home/${record.id}-${record.sha256.slice(0, 12)}.webp`;
    const master = await sharp(join(root, 'assets/gallery/originals', path)).rotate().resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true }).toColourspace('srgb').png().toBuffer();
    for (const width of [0, 640, 768, 1280, 1920, 2560]) {
      const target = join(root, 'public', width ? src.replace('.webp', `-${width}.webp`) : src);
      if (!(await exists(target))) await sharp(master).resize({ width: width || record.image.width, withoutEnlargement: true }).webp({ quality: 92, effort: 5 }).toFile(target);
    }
    slides.push({ source: path, originalSrc: record.image.src, image: { ...record.image, src, bytes: (await stat(join(root, 'public', src))).size } });
  }
  await writeJson(join(root, 'src/content/home-slides.json'), slides);
  await writeJson(join(root, 'assets/client-2026-10-02/home-selection-status.json'), { requested: selected.length, ready: slides.length, missing, ambiguous });
  console.log(`Portfolyo: ${slides.length}/${selected.length} seçili ana sayfa fotoğrafı, ${logos.length} referans logosu hazır.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await preparePortfolio(resolve(import.meta.dirname, '..'));
