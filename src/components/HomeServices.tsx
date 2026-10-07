import Link from 'next/link';
import type { Project } from '@/content/projects';
import { belongsToCategory, type Category } from '@/content/site';
import { Photo } from './Photo';
import s from './HomeServices.module.css';

const services = [
  {
    category: 'architecture',
    title: 'Mimari Fotoğrafçılık',
    description: 'Yapıların çizgilerini, ışığını ve karakterini fotoğrafa taşıyoruz.',
    photoKey: 'gallery-503344f277c97876',
  },
  {
    category: 'hotels',
    title: 'Otel Fotoğrafçılığı',
    description: 'Odalardan ortak alanlara, mekânın atmosferini ve deneyimini anlatıyoruz.',
    photoKey: 'gallery-b1eac467ce8554b9',
  },
  {
    category: 'product',
    title: 'Ürün Fotoğrafçılığı',
    description: 'Ürünün malzemesini, dokusunu ve detaylarını öne çıkarıyoruz.',
    photoKey: 'gallery-0ffad429ab64a366',
  },
] satisfies { category: Category; title: string; description: string; photoKey: string }[];

export function HomeServices({ projects }: { projects: Project[] }) {
  return (
    <section id="calisma-alanlari" className={s.services} aria-label="Çalışma alanlarımız">
      {services.map(service => {
        const categoryProjects = projects.filter(project => belongsToCategory(project, service.category));
        const photo = categoryProjects.flatMap(project => project.photos).find(image => image.key.endsWith(service.photoKey))
          ?? categoryProjects[0]?.cover;
        if (!photo) return null;

        return (
          <Link key={service.category} href={`/portfolio/${service.category}`} className={s.card} aria-labelledby={`service-${service.category}`}>
            <div className={s.image}>
              <Photo photo={photo} locale="tr" sizes="(max-width: 560px) calc(100vw - 36px), (max-width: 900px) calc(100vw - 48px), (max-width: 1200px) calc((100vw - 348px) / 3), (min-width: 1600px) calc((100vw - 478px) / 3), calc((100vw - 424px) / 3)" />
            </div>
            <h2 id={`service-${service.category}`}>{service.title}</h2>
            <p>{service.description}</p>
          </Link>
        );
      })}
    </section>
  );
}
