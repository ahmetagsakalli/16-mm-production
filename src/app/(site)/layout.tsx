import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FloatingContact } from '@/components/FloatingContact';
import { site } from '@/content/site';
import { getPublicSettings } from '@/lib/cms/public';
import { getPhoneNumber } from '@/lib/contact';
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  const phone = getPhoneNumber(settings.phone);
  const schema = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: site.name, description: settings.description, url: site.url,
    ...(settings.email ? { email: settings.email } : {}),
    ...(phone ? { telephone: `+${phone}` } : {}),
    ...(settings.instagram ? { sameAs: [settings.instagram] } : {}),
  };
  return <><a className="skip-link" href="#main">İçeriğe geç</a><div className="page-shell"><Header locale="tr" />{children}<Footer locale="tr" contact={settings} /></div><FloatingContact phone={settings.phone} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} /></>;
}
