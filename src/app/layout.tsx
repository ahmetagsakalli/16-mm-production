import type { Metadata } from 'next';
import { site } from '@/content/site';
import { manrope } from '@/lib/font';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  applicationName: site.name,
  robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large' } },
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr" className={manrope.variable} data-scroll-behavior="smooth"><body id="top" style={{ fontFamily: 'var(--font-manrope), Arial, sans-serif' }}>{children}</body></html>;
}
