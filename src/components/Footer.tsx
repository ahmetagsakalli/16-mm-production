import Link from 'next/link';
import { categories, categoryIds, copy, site, type Locale } from '@/content/site';
import type { Settings } from '@/lib/cms/types';
import { getInstagramHandle, getPhoneNumber } from '@/lib/contact';
import { Arrow } from './Arrow';
import s from './Footer.module.css';

export function Footer({ locale, contact }: { locale: Locale; contact: Pick<Settings, 'email' | 'phone' | 'instagram'> }) {
  const number = getPhoneNumber(contact.phone);
  return <footer id="footer" className={s.footer}>
    <div className={s.invitation}>
      <h2>Birlikte <span>üretelim.</span></h2>
      <Link className={s.start} href="/contact"><span>Projenizi konuşalım</span><span className={s.startArrow}><Arrow diagonal /></span></Link>
    </div>
    <div className={s.body}>
      <div className={s.brand}>
        <Link href="/" className={s.wordmark} aria-label={`${site.name} — Ana sayfa`}>{site.name}</Link>
        <p>Mimari, iç mekân ve ürün.<br />Fotoğraf ve film.</p>
      </div>
      <nav className={s.navigation} aria-labelledby="footer-work-heading">
        <h3 id="footer-work-heading">Çalışmalar</h3>
        <div>{categoryIds.map(id => <Link key={id} href={`/portfolio/${id}`}>{categories[id].title[locale]}</Link>)}</div>
      </nav>
      <div className={s.contact}>
        <h3>İletişim</h3>
        {number ? <a className={s.phone} href={`tel:+${number}`}>{contact.phone}</a> : null}
        {contact.email ? <a className={s.email} href={`mailto:${contact.email}`}>{contact.email}</a> : null}
        {contact.instagram ? <a className={s.instagram} href={contact.instagram} target="_blank" rel="noopener noreferrer">{getInstagramHandle(contact.instagram)}<Arrow diagonal /></a> : null}
        {!number && !contact.email && !contact.instagram ? <Link href="/contact">{copy[locale].contact}</Link> : null}
      </div>
    </div>
    <div className={s.bottom}>
      <span>© {new Date().getFullYear()} {site.name}</span>
      <p>Web Tasarım, Uygulama ve Geliştirme :{' '}<a href="https://kocyigityazilim.com" target="_blank" rel="noopener noreferrer">kocyigityazilim.com</a></p>
      <a href="#top" className={s.back} aria-label="Sayfanın başına dön"><Arrow /></a>
    </div>
  </footer>;
}
