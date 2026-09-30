import Link from 'next/link';
import { copy } from '@/content/site';
export default function NotFound() { const locale = 'tr'; const t = copy[locale]; return <main id="main" className="not-found"><span>404</span><h1>{t.notFound}</h1><p>{t.notFoundText}</p><Link href={'/'}>{t.home} ↗</Link></main>; }
