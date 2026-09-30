import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categories, copy } from '@/content/site';
import { getPublicProjects } from '@/lib/cms/public';
import { pageMetadata } from '@/lib/metadata';
import { Gallery } from '@/components/Gallery';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Arrow } from '@/components/Arrow';
import { Photo } from '@/components/Photo';
import s from './Project.module.css';

const locale = 'tr';
type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = true;
export const revalidate = 3600;
export async function generateStaticParams() { return (await getPublicProjects()).map(project => ({ slug: project.slug })); }
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const projects = await getPublicProjects();
  const project = projects.find(project => project.slug === slug);
  if (!project) return {};
  return pageMetadata(`/projects/${slug}`, project.title[locale], project.description[locale], project.cover.image.src);
}
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const projects = await getPublicProjects();
  const project = projects.find(project => project.slug === slug);
  if (!project) notFound();
  const next = projects.length > 1 ? projects[(projects.indexOf(project) + 1) % projects.length] : null;
  return <main id="main" className={s.page}>
    <div className={s.intro}>
      <Link className={s.backLink} href={`/portfolio/${project.category}`}><Arrow />{categories[project.category].title[locale]}</Link>
      <h1>{project.title[locale]}</h1>
    </div>
    {project.videos.length ? <div className={s.videos}>{project.videos.map(video => <VideoPlayer key={video.src} src={video.src} poster={video.poster} locale={locale} title={video.title} description={project.description[locale]} />)}</div> : null}
    {project.photos.length ? <Gallery key={project.slug} photos={project.photos} locale={locale} title={project.title[locale]} priorityFirst={project.videos.length < 2} /> : null}
    {next ? <Link href={`/projects/${next.slug}`} className={s.nextProject} aria-label={`${copy[locale].next}: ${next.title[locale]}`}>
      <div className={s.nextImage}><Photo photo={next.cover} locale={locale} sizes="(max-width: 600px) 86vw, (max-width: 1440px) 35vw, 440px" /></div>
      <div className={s.nextContent}><p>{copy[locale].next}</p><h2>{next.title[locale]}</h2><span className={s.nextArrow}><Arrow diagonal /></span></div>
    </Link> : null}
  </main>;
}
