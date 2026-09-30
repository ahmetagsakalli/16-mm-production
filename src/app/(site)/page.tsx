import { getPublicProjects, getPublicSettings, getFeaturedSlugs } from '@/lib/cms/public';
import Link from 'next/link';
import { projectPreview } from '@/content/projects';
import { pageMetadata } from '@/lib/metadata';
import { Photo } from '@/components/Photo';
import { ProjectCard } from '@/components/ProjectCard';
import { BackgroundVideo } from '@/components/BackgroundVideo';
import { Hero } from '@/components/Hero';
import heroImages from '@/content/hero-images.json';
import { SelectedProjects } from '@/components/SelectedProjects';
import s from '@/components/Site.module.css';

const locale = 'tr';
export async function generateMetadata() {
  return pageMetadata('', 'Mimari Fotoğrafçılık & Film', (await getPublicSettings()).description);
}
export default async function Home() {
  const [projects, settings, featured] = await Promise.all([getPublicProjects(), getPublicSettings(), getFeaturedSlugs()]);
  const motion = projects.find(project => project.videos.length > 0);
  const previews = projects.map(projectPreview);
  const hero = projects.filter(project => featured.includes(project.slug));
  const heroPreviews = (hero.length ? hero : projects.slice(0, 3)).map(project => {
    const preview = projectPreview(project);
    const image = (heroImages as Record<string, typeof preview.cover.image>)[preview.cover.image.src];
    return image ? { ...preview, cover: { ...preview.cover, image } } : preview;
  });
  const more = ['interiors', 'product', 'clips'].flatMap(category => {
    const project = projects.find(project => project.category === category && !project.sourceFolder.endsWith('/COVER'));
    return project ? [project] : [];
  });
  return <main id="main" className={s.home}>
    <Hero lines={[settings.heroLine1, settings.heroLine2]} projects={heroPreviews} locale={locale} />
    <div className={s.introduction}><p>Mimari, iç mekân ve ürün.<br /><span>Fotoğraf ve film.</span></p></div>
    <SelectedProjects projects={previews} locale={locale} />
    {motion ? <Link className={s.motion} href={`/projects/${motion.slug}`} aria-labelledby="motion-title">
      <Photo photo={motion.videos[0].poster} locale={locale} sizes="(max-width: 1440px) 97vw, 1408px" />
      <BackgroundVideo src={motion.videos[0].previewSrc} />
      <div className={s.motionShade} />
      <h2 id="motion-title">Mekânın{' '}<span>içinden</span></h2>
    </Link> : null}
    <section className={s.moreWorks} aria-labelledby="more-heading"><div className={s.sectionHead}><h2 id="more-heading">Diğer<span>çalışmalar</span></h2></div><div className={s.moreGrid}>{more.map(project => <ProjectCard key={project.slug} project={project} locale={locale} />)}</div></section>
  </main>;
}
