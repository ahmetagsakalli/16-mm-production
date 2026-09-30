'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Icon } from './ui';
const navigation = [{ id: 'genel', title: 'Genel bakış', icon: 'grid' }, { id: 'projeler', title: 'Projeler', icon: 'folder' }, { id: 'galeri', title: 'Galeri', icon: 'image' }, { id: 'ayarlar', title: 'Site ayarları', icon: 'settings' }, { id: 'guvenlik', title: 'Şifre değiştir', icon: 'lock' }] as const;
export function Shell({ active, children }: { active: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false); const toggle = useRef<HTMLButtonElement>(null); const router = useRouter();
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [open]);
  return <div className={`admin-shell ${open ? 'is-open' : ''}`}>
    <aside className="admin-sidebar" id="admin-navigation"><Link href="/admin/genel" className="admin-wordmark">16mm<span>Production</span></Link><nav aria-label="Yönetim menüsü">{navigation.map(item => <Link key={item.id} href={`/admin/${item.id}`} aria-current={active === item.id ? 'page' : undefined} onClick={() => setOpen(false)}><Icon name={item.icon} />{item.title}</Link>)}</nav><div className="admin-sidebar-bottom"><a href="/" target="_blank" rel="noopener noreferrer"><Icon name="arrow" />Siteyi görüntüle</a><button onClick={async () => { if (window.confirm('Panelden çıkış yapmak istiyor musunuz?')) { await api('logout', 'POST'); router.replace('/admin'); router.refresh(); } }}><Icon name="logout" />Çıkış yap</button><span>16mm Production © {new Date().getFullYear()}</span></div></aside>
    {open && <button className="admin-overlay" aria-label="Menüyü kapat" onClick={() => setOpen(false)} />}
    <div className="admin-main"><header className="admin-topbar"><button ref={toggle} className="admin-mobile-toggle" aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(!open)}><Icon name="menu" /></button><span>Yönetim <span className="admin-topbar-divider">/</span> <strong>{navigation.find(item => item.id === active)?.title || 'Projeler'}</strong></span><a href="/" target="_blank" rel="noopener noreferrer">Siteyi aç <Icon name="arrow" /></a></header><main className="admin-content" id="admin-main" inert={open || undefined}>{children}</main></div>
  </div>;
}
