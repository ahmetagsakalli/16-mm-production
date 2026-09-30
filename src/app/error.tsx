'use client';
import { copy } from '@/content/site';
export default function ErrorPage({ reset }: { reset: () => void }) { const locale = 'tr'; const t = copy[locale]; return <main id="main" className="not-found"><h1>{t.error}</h1><button onClick={reset}>{t.retry}</button></main>; }
