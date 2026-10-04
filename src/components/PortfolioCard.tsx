import Link from 'next/link';
import type { Project } from '@/content/projects';
import { Photo } from './Photo';
import s from './Portfolio.module.css';

export function PortfolioCard({ project, priority = false, headingLevel = 2 }: { project: Project; priority?: boolean; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return <Link href={`/projects/${project.slug}`} className={s.projectCard} aria-label={`${project.title.tr} — Projeyi incele`}>
    <div className={s.projectPhoto}><Photo photo={project.cover} locale="tr" priority={priority} sizes="(max-width: 560px) calc(100vw - 36px), (max-width: 900px) calc((100vw - 66px) / 2), (max-width: 1200px) calc((100vw - 328px) / 2), (max-width: 1599px) calc((100vw - 432px) / 3), calc((100vw - 486px) / 3)" /></div>
    <div className={s.projectOverlay}>
      <Heading className={s.projectCardTitle}>{project.title.tr}</Heading>
    </div>
  </Link>;
}
