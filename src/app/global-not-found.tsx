import Link from 'next/link';
import { site } from '@/content/site';
import { manrope } from '@/lib/font';
import './globals.css';
export const metadata = { title: `404 | ${site.name}`, robots: { index: false, follow: false } };
export default function GlobalNotFound() { return <html lang="tr" className={manrope.className}><body><main className="not-found"><span>404 — {site.name}</span><h1>Bu sayfa kadrajın dışında.</h1><p>Aradığınız sayfa bulunamadı.</p><Link href="/">Ana sayfaya dön ↗</Link></main></body></html>; }
