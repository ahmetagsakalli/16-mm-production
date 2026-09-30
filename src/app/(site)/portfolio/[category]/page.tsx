import { notFound } from 'next/navigation';
import { categories, categoryIds, isCategory } from '@/content/site';
import { getPublicProjects } from '@/lib/cms/public';
import { pageMetadata } from '@/lib/metadata';
import { ProjectCard } from '@/components/ProjectCard';
import s from '@/components/Site.module.css';

const locale = 'tr';
type Props = { params: Promise<{ category: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return categoryIds.map(category => ({ category })); }
export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  return pageMetadata(`/portfolio/${category}`, categories[category].title[locale], categories[category].description[locale]);
}
export default async function Collection({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const collection = (await getPublicProjects()).filter(project => project.categories.includes(category));
  return <main id="main">
    <div className={s.pageIntro}><h1>{categories[category].title[locale]}</h1></div>
    <div className={s.collectionGrid}>{collection.map((project, index) => <ProjectCard key={project.slug} locale={locale} project={project} priority={index === 0} headingLevel={2} sizes="(max-width: 600px) calc(100vw - 48px), (max-width: 1440px) calc(50vw - 69px), 651px" />)}</div>
  </main>;
}
