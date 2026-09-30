import gallery from './gallery.json';
import type { Category, Localized } from './site';
import type { ImageData, Photo } from '@/lib/images';
export type { ImageKey, Photo } from '@/lib/images';

export type ProjectVideo = { src: string; previewSrc: string; title: string; poster: Photo };
export type Project = {
  slug: string; sourceFolder: string; category: Category; categories: Category[];
  title: Localized; description: Localized; cover: Photo; photos: Photo[];
  videos: ProjectVideo[]; video?: ProjectVideo;
};
export type ProjectPreview = Pick<Project, 'slug' | 'category' | 'categories' | 'title' | 'cover'> & { hasVideo: boolean };

const images: Record<string, ImageData> = gallery.images;
export const projects: Project[] = gallery.projects.map(project => {
  const photo = (key: string, index: number): Photo => ({
    key, image: images[key],
    alt: { tr: `${project.title.tr} — fotoğraf ${index + 1}` },
  });
  const photos = project.photoKeys.map(photo);
  const videos = project.videos.map(video => ({ src: video.src, previewSrc: video.previewSrc, title: video.title, poster: photo(video.posterKey, 0) }));
  return {
    slug: project.slug, sourceFolder: project.sourceFolder,
    category: project.category as Category, categories: project.categories as Category[],
    title: { tr: project.title.tr }, description: { tr: project.description.tr },
    cover: photos.find(photo => photo.key === project.coverKey) || photo(project.coverKey, 0),
    photos, videos, video: videos[0],
  };
});
export function getProject(slug: string) { return projects.find(project => project.slug === slug); }
export function projectPreview(project: Project): ProjectPreview {
  return { slug: project.slug, category: project.category, categories: project.categories, title: project.title, cover: project.cover, hasVideo: project.videos.length > 0 };
}
