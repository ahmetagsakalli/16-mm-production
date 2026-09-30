import { getPublicProjects, getPublicSettings } from '@/lib/cms/public';
import { getInstagramHandle, getPhoneNumber } from '@/lib/contact';
import { copy } from '@/content/site';
import { pageMetadata } from '@/lib/metadata';
import { Arrow } from '@/components/Arrow';
import { Photo } from '@/components/Photo';
import s from './Contact.module.css';

const locale = 'tr';
export function generateMetadata() {
  return pageMetadata('/contact', copy[locale].contact, copy[locale].contactIntro);
}
export default async function Contact() {
  const [contact, projects] = await Promise.all([getPublicSettings(), getPublicProjects()]);
  const portrait = projects.find(project => project.slug === '1-mimari-7-ayvalik-belediyesi-halil-basyazgan-kucukkoy-cumhuriyet-kultur-merkezi-5a1376')
    ?? projects.find(project => project.category === 'architecture') ?? projects[0];
  const number = getPhoneNumber(contact.phone);
  const hasContact = contact.email || number || contact.instagram;
  return <main id="main" className={s.page}>
    <div className={`${s.panel} ${!portrait ? s.withoutImage : ''}`}>
      <div className={s.content}>
        <h1>Projenizi<br /><span>konuşalım.</span></h1>
        <p className={s.intro}>Fotoğraf ve film için yeni bir bakış, birlikte.</p>
        {hasContact ? <div className={s.details}>
          {contact.email ? <a className={`${s.contactLink} ${s.email}`} href={`mailto:${contact.email}`}>
            <span><span className={s.label}>E-posta</span><span className={s.value}>{contact.email}</span></span><Arrow diagonal />
          </a> : null}
          {number ? <a className={s.contactLink} href={`tel:+${number}`}>
            <span><span className={s.label}>Telefon</span><span className={s.value}>{contact.phone}</span></span><Arrow diagonal />
          </a> : null}
          {contact.instagram ? <a className={s.contactLink} href={contact.instagram} target="_blank" rel="noopener noreferrer">
            <span><span className={s.label}>Instagram</span><span className={s.value}>{getInstagramHandle(contact.instagram)}</span></span><Arrow diagonal />
          </a> : null}
        </div> : <p className={s.intro}>{copy.tr.contactPending}</p>}
        {number ? <a className={s.whatsapp} href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer">WhatsApp’tan yaz<Arrow diagonal /></a> : null}
      </div>
      {portrait ? <div className={s.image}><Photo photo={portrait.cover} locale="tr" sizes="(max-width: 760px) 92vw, (max-width: 1440px) 42vw, 588px" priority /></div> : null}
    </div>
  </main>;
}
