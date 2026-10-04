import type { Localized } from '@/content/site';

export type ImageKey = string;
export type ImageData = {
  src: string; width: number; height: number; blurDataURL: string;
  mobileSrc?: string;
  bytes: number; totalBytes: number;
};
export type Photo = { key: ImageKey; alt: Localized; image: ImageData };
