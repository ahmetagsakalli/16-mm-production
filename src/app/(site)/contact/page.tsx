import Image from 'next/image';
import { getPublicSettings } from '@/lib/cms/public';
import { getInstagramHandle, getPhoneNumber } from '@/lib/contact';
import { pageMetadata } from '@/lib/metadata';
import identity from '@/content/identity.json';
import { ReferenceMarquee } from '@/components/ReferenceMarquee';
import { ProjectInquiry } from '@/components/ProjectInquiry';
import s from '@/components/Portfolio.module.css';

export function generateMetadata() { return pageMetadata('/contact', 'İletişim', '16mm Production ile mimari, otel, mağaza, ürün fotoğrafçılığı ve film projeleriniz için iletişime geçin.', identity.portrait.src); }
export default async function Contact() {
  const contact = await getPublicSettings();
  const number = getPhoneNumber(contact.phone);
  const mapQuery = encodeURIComponent(contact.address || '');
  return <main id="main"><div className={s.contactGrid}>
    <Image {...identity.portrait} alt="Ozan Arslan" className={s.portrait} unoptimized priority />
    <div className={s.contactContent}><h1>İletişim</h1>
      {contact.about && <p className={s.biography}>{contact.about}</p>}
      <address>
        {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
        {number && <a href={`tel:+${number}`}>{contact.phone}</a>}
        {contact.instagram && <a href={contact.instagram} target="_blank" rel="noopener noreferrer">{getInstagramHandle(contact.instagram)} ↗</a>}
        {contact.address && <p className={s.address}>{contact.address}</p>}
      </address>
    </div>
  </div>
    {number && <ProjectInquiry number={number} />}
    {contact.address && <section className={s.contactMap} aria-labelledby="map-title">
      <div className={s.mapHeading}><h2 id="map-title">Bizi ziyaret edin.</h2><a href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`} target="_blank" rel="noopener noreferrer">Yol tarifi <span aria-hidden="true">↗</span></a></div>
      <iframe title="Vadi Park Seyrantepe — Google Haritalar" src={`https://www.google.com/maps?q=${mapQuery}&output=embed&hl=tr&z=16`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
    </section>}
    <ReferenceMarquee references={identity.references} />
  </main>;
}
