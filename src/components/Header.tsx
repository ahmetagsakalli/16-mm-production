'use client';

import Link from 'next/link';
import { usePathname, useSelectedLayoutSegment } from 'next/navigation';
import { useRef, useState } from 'react';
import { categories, categoryIds, copy, site, type Locale } from '@/content/site';
import { Arrow } from './Arrow';
import s from './Site.module.css';

export function Header({ locale }: { locale: Locale }) {
  const path = usePathname();
  const segment = useSelectedLayoutSegment();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const t = copy[locale];
  // Vercel can render the root URL as /index internally. The layout segment
  // still identifies the home page correctly during SSR and client navigation.
  const home = segment === null;
  const links = categoryIds.map(id => ({ href: `/portfolio/${id}`, label: categories[id].title[locale] })).concat({ href: `/contact`, label: t.contact });
  return <header className={`${s.header} ${home ? s.homeHeader : ''}`} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } }}>
    <Link href={'/'} className={s.logo} onClick={() => setOpen(false)} aria-label={`${site.name} — Ana sayfa`}>{site.name}</Link>
    <nav className={s.desktopNav} aria-label="Ana menü">
      {links.filter(link => link.href !== `/contact`).map(link => <Link key={link.href} href={link.href} aria-current={path === link.href ? 'page' : undefined}>{link.label}</Link>)}
    </nav>
    <div className={s.headerEnd}>
      <Link className={s.contactButton} href={`/contact`} onClick={() => setOpen(false)}>{t.contact}<Arrow diagonal /></Link>
      <button ref={toggle} className={s.menuButton} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? t.close : t.menu} onClick={() => setOpen(!open)}><span>{open ? t.close : t.menu}</span><span className={open ? s.menuIconOpen : s.menuIcon} aria-hidden="true"><i /><i /></span></button>
    </div>
    <nav id="mobile-menu" className={`${s.mobileNav} ${open ? s.mobileNavOpen : ''}`} aria-label="Mobil menü" inert={!open}>
      {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={path === link.href ? 'page' : undefined}><span>{link.label}</span><Arrow diagonal /></Link>)}
    </nav>
  </header>;
}
