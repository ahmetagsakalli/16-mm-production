'use client';
import type { ImageLoaderProps } from 'next/image';

// All sizes are encoded locally during import, never on a visitor request.
export default function galleryImageLoader({ src, width }: ImageLoaderProps) {
  if (!src.startsWith('/media/gallery/') && !src.startsWith('/media/uploads/')) return src;
  const size = [640, 768, 1280, 1920, 2560].find(size => size >= width) || 2560;
  return src.replace(/\.webp$/, `-${size}.webp`);
}
