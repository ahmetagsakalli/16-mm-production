import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { belongsToCategory, canonicalCategory, categories, categoryIds, isCategory, isGalleryCategory } from '@/content/site';
import { getPublicProjects } from '@/lib/cms/public';
import { pageMetadata } from '@/lib/metadata';
import { PortfolioCard } from '@/components/PortfolioCard';
import { PhotoGrid } from '@/components/PhotoGrid';
import { VideoPlayer } from '@/components/VideoPlayer';
import s from '@/components/Portfolio.module.css';

type Props = { params: Promise<{ category: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return categoryIds.map(category => ({ category })); }
export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const id = canonicalCategory(category);
  const hasProjects = (await getPublicProjects()).some(project => belongsToCategory(project, id));
  return { ...pageMetadata(`/portfolio/${id}`, categories[id].title.tr, categories[id].description.tr), ...(!hasProjects ? { robots: { index: false, follow: true } } : {}) };
}
export default async function Collection({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  if (category !== canonicalCategory(category)) permanentRedirect(`/portfolio/${canonicalCategory(category)}`);
  const collection = (await getPublicProjects()).filter(project => belongsToCategory(project, category));
  const photos = Array.from(new Map(collection.flatMap(project => project.photos).map(photo => [photo.image.src, photo])).values());
  const videos = Array.from(new Map(collection.flatMap(project => project.videos).map(video => [video.src, video])).values());
  return <main id="main"><h1 className={s.pageHeading}>{categories[category].title.tr}</h1>
    {collection.length ? isGalleryCategory(category) ? <>
      <PhotoGrid photos={photos} title={categories[category].title.tr} />
      {videos.length > 0 && <div className={s.galleryVideos}>{videos.map(video => <VideoPlayer key={video.src} src={video.src} poster={video.poster} locale="tr" title={video.title} description={categories[category].description.tr} />)}</div>}
    </> : <div className={s.projectGrid}>{collection.map((project, index) => <PortfolioCard key={project.slug} project={project} priority={index === 0} />)}</div> : <div className={s.empty}><p>Yeni çalışmalar yakında.</p><Link href="/contact">İletişime geçin</Link></div>}
  </main>;
}
