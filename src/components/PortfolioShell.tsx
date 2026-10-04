'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { categories, portfolioCategoryIds, site } from '@/content/site';
import identity from '@/content/identity.json';
import { SidebarContacts } from './SidebarContacts';
import s from './Portfolio.module.css';

export function PortfolioShell({ children, instagram, phone, email }: { children: React.ReactNode; instagram: string; phone: string; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <div className={s.shell} id="top">
    <header className={s.sidebar} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
      <div className={s.brandRow}>
        <Link href="/" className={s.logo} aria-label={`${site.name} — Ana sayfa`} onClick={() => setOpen(false)}><Image {...identity.logo} alt={site.name} unoptimized priority /></Link>
        <button className={s.menuToggle} aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={open} aria-controls="portfolio-navigation" onClick={() => setOpen(!open)}><span /> <span /></button>
      </div>
      <div className={`${s.navigationWrap} ${open ? s.navigationOpen : ''}`}>
        <nav className={s.navigation} id="portfolio-navigation" aria-label="Ana menü">
          {portfolioCategoryIds.map(id => <Link key={id} lang={id === 'talking-head' ? 'en' : undefined} href={`/portfolio/${id}`} aria-current={pathname === `/portfolio/${id}` ? 'page' : undefined} onClick={() => setOpen(false)}>{categories[id].title.tr}</Link>)}
          <Link href="/blog" aria-current={pathname === '/blog' ? 'page' : undefined} onClick={() => setOpen(false)}>Blog</Link>
          <Link href="/contact" aria-current={pathname === '/contact' ? 'page' : undefined} onClick={() => setOpen(false)}>İletişim</Link>
        </nav>
        <footer className={s.sidebarFooter}>
          <Link href="/contact#projenizden-bahsedin" className={s.inquiryLink} onClick={() => setOpen(false)}>Projenizden bahsedin.</Link>
          <SidebarContacts instagram={instagram} phone={phone} email={email} />
          <p>© {new Date().getFullYear()} {site.name}</p>
          <p className={s.credit}>Web Tasarım, Uygulama ve Geliştirme :<br /><a href="https://kocyigityazilim.com" target="_blank" rel="noopener noreferrer">kocyigityazilim.com</a></p>
        </footer>
      </div>
    </header>
    <div className={s.content}>{children}</div>
  </div>;
}
