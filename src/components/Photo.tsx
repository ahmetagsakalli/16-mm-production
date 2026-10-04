import Image from 'next/image';
import type { Photo as PhotoData } from '@/lib/images';
import type { Locale } from '@/content/site';

export function Photo({ photo, locale, sizes, priority = false, className = '', contain = false }: { photo: PhotoData; locale: Locale; sizes: string; priority?: boolean; className?: string; contain?: boolean }) {
  const image = photo.image;
  return <Image src={image.src} alt={photo.alt[locale]} width={image.width} height={image.height} sizes={sizes} unoptimized={image.src.startsWith('/media/hero/')} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} quality={85} placeholder="blur" blurDataURL={image.blurDataURL} className={className} style={contain ? { objectFit: 'contain', width: '100%', height: '100%' } : undefined} />;
}
