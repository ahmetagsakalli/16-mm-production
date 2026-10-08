import Link from 'next/link';
import { getPublicHomepage, getPublicProjects, getPublicSettings } from '@/lib/cms/public';
import { pageMetadata } from '@/lib/metadata';
import { PortfolioSlideshow, type SlideCaption } from '@/components/PortfolioSlideshow';
import { PortfolioCard } from '@/components/PortfolioCard';
import { homeIntroductions } from '@/content/home-introductions';
import s from '@/components/Portfolio.module.css';

export async function generateMetadata() {
  return pageMetadata('', 'Mimari Fotoğrafçılık & Film', (await getPublicSettings()).description, (await getPublicHomepage()).photos[0]?.image.src);
}
export default async function Home() {
  const [projects, home] = await Promise.all([getPublicProjects(), getPublicHomepage()]);
  const featuredProjects = home.slugs.flatMap(slug => { const project = projects.find(p => p.slug === slug); return project ? [project] : []; });
  const photos = home.photos;
  const captions: Record<string, SlideCaption> = {};
  photos.forEach((photo, index) => {
    captions[photo.key] = homeIntroductions[index % homeIntroductions.length];
  });
  return <main id="main" className={s.home}>
    <h1 className="visually-hidden">16mm Production — Mimari fotoğrafçılık ve film</h1>
    <PortfolioSlideshow photos={photos} captions={captions} title="Seçilmiş fotoğraflar" autoplay />
    {featuredProjects.length > 0 && <section className={s.homeProjects} aria-labelledby="home-projects-title">
      <h2 id="home-projects-title">Seçilmiş projeler</h2>
      <div className={s.homeGrid}>{featuredProjects.map(project => <PortfolioCard key={project.slug} project={project} headingLevel={3} />)}</div>
    </section>}
    <Link className={s.mobileInquiryLink} href="/contact#projenizden-bahsedin">Projenizden bahsedin.</Link>
  </main>;
}
