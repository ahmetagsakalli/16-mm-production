import type { MetadataRoute } from 'next';
import { belongsToCategory, portfolioCategoryIds, site } from '@/content/site';
import { getPublicProjects, getPublicBlogPosts } from '@/lib/cms/public';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getPublicProjects(), getPublicBlogPosts()]);
  const paths = ['', '/contact', '/blog', ...posts.map(post => `/blog/${post.slug}`), ...portfolioCategoryIds.filter(id => projects.some(project => belongsToCategory(project, id))).map(id => `/portfolio/${id}`), ...projects.map(project => `/projects/${project.slug}`)];
  return paths.map(path => ({ url: `${site.url}${path}` }));
}
