import type { MetadataRoute } from 'next';
import { categoryIds, site } from '@/content/site';
import { getPublicProjects } from '@/lib/cms/public';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublicProjects();
  const paths = ['', '/contact', ...categoryIds.map(id => `/portfolio/${id}`), ...projects.map(project => `/projects/${project.slug}`)];
  return paths.map(path => ({ url: `${site.url}${path}` }));
}
