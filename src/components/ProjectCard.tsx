import Link from 'next/link';
import type { Project } from '@/content/projects';
import { copy, type Locale } from '@/content/site';
import { Photo } from './Photo';
import s from './Site.module.css';

export function ProjectCard({ project, locale, priority = false, headingLevel = 3, sizes = '(max-width: 600px) calc(90vw - 51px), (max-width: 1440px) 30vw, 400px' }: { project: Project; locale: Locale; priority?: boolean; headingLevel?: 2 | 3; sizes?: string }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return <article className={s.projectCard}>
    <Heading className={s.projectCaption}><Link href={`/projects/${project.slug}`}>{project.title[locale]}</Link></Heading>
    <Link href={`/projects/${project.slug}`} className={s.projectImage} aria-label={`${project.title[locale]} — ${copy[locale].viewProject}`}>
      <Photo photo={project.cover} locale={locale} sizes={sizes} priority={priority} />
      {project.video ? <span className={s.cardPlay} aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span> : null}
    </Link>
  </article>;
}
