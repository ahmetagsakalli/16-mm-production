import type { Metadata } from 'next';
import { site } from '@/content/site';
import { projects } from '@/content/projects';

export function pageMetadata(path: string, title: string, description: string, image = projects[0].cover.image.src): Metadata {
  return {
    title: { absolute: `${title} | ${site.name}` },
    description,
    alternates: { canonical: path || '/' },
    openGraph: { title: `${title} | ${site.name}`, description, url: path || '/', siteName: site.name, locale: 'tr_TR', type: 'website', images: [{ url: image, alt: title }] },
    twitter: { card: 'summary_large_image', title: `${title} | ${site.name}`, description, images: [image] },
  };
}
