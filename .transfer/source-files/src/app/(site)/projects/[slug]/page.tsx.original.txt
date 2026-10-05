import Link from 'next/link';
import { notFound } from 'next/navigation';
import { belongsToCategory, canonicalCategory, categories, isGalleryCategory } from '@/content/site';
import { getPublicProjects } from '@/lib/cms/public';
import { pageMetadata } from '@/lib/metadata';
import { PortfolioSlideshow } from '@/components/PortfolioSlideshow';
import { PhotoGrid } from '@/components/PhotoGrid';
import { VideoPlayer } from '@/components/VideoPlayer';
import s from '@/components/Portfolio.module.css';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = true;
export const revalidate = 3600;
export async function generateStaticParams() { return (await getPublicProjects()).map(project => ({ slug: project.slug })); }
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = (await getPublicProjects()).find(project => project.slug === slug);
  return project ? pageMetadata(`/projects/${slug}`, project.title.tr, project.description.tr, project.cover.image.src) : {};
}
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const projects = await getPublicProjects();
  const project = projects.find(project => project.slug === slug);
  if (!project) notFound();
  const category = canonicalCategory(project.category);
  const siblings = projects.filter(item => belongsToCategory(item, category));
  const index = siblings.indexOf(project);
  const previous = siblings.length > 1 ? siblings[(index - 1 + siblings.length) % siblings.length] : null;
  const next = siblings.length > 1 ? siblings[(index + 1) % siblings.length] : null;
  return <main id="main"><div className={s.projectIntro}><h1>{project.title.tr}</h1><Link className={s.backLink} href={`/portfolio/${category}`}>← {categories[category].title.tr}</Link></div>
    {!!project.photos.length && (isGalleryCategory(category) ? <PhotoGrid key={project.slug} photos={project.photos} title={project.title.tr} /> : <PortfolioSlideshow key={project.slug} photos={project.photos} title={project.title.tr} showThumbnails />)}
    {!!project.videos.length && <div className={s.videos}>{project.videos.map(video => <VideoPlayer key={video.src} src={video.src} poster={video.poster} locale="tr" title={video.title} description={project.description.tr} />)}</div>}
    {(previous || next) && <nav className={s.projectNav} aria-label="Diğer projeler">{previous && <Link href={`/projects/${previous.slug}`} aria-label={`Önceki proje: ${previous.title.tr}`}><span aria-hidden="true">←</span>{previous.title.tr}</Link>}{next && <Link href={`/projects/${next.slug}`} aria-label={`Sonraki proje: ${next.title.tr}`}>{next.title.tr}<span aria-hidden="true">→</span></Link>}</nav>}
  </main>;
}
