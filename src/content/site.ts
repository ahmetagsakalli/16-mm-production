export type Locale = 'tr';
export type Localized = Record<Locale, string>;

export const site = {
  name: '16mm Production',
  url: process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  demo: false,
  contact: { email: 'ozanarslanozan@gmail.com', phone: '+90 555 614 00 15', instagram: 'https://instagram.com/arsozan' },
  description: {
    tr: '16mm Production — Mimari fotoğrafçılık, iç mekân, ürün fotoğrafçılığı ve film. Mekânın karakterini, ışığın ve detayların hikâyesini keşfedin.',
  },
};

export const categoryIds = ['architecture', 'interiors', 'product', 'video', 'clips'] as const;
export type Category = (typeof categoryIds)[number];
export const isCategory = (value: string): value is Category => categoryIds.includes(value as Category);
export const categories: Record<Category, { title: Localized; description: Localized }> = {
  architecture: { title: { tr: 'Mimari Projeler' }, description: { tr: 'Yapının karakteri, ışığın izinde. Dışarıdan içeriye, bütünden detaya bir bakış.' } },
  interiors: { title: { tr: 'İç Mekân' }, description: { tr: 'İçinde yaşanan, hissedilen mekânlar. Doğal ışık, malzeme ve gündelik hayatın sessiz dengesi.' } },
  product: { title: { tr: 'Ürün' }, description: { tr: 'Bir nesnenin çizgisi, dokusu, duruşu. Tasarımın özünü görünür kılan fotoğraflar.' } },
  video: { title: { tr: 'Video' }, description: { tr: 'Mekânı zamanın içinde deneyimlemek. Işığın değiştiği, hikâyenin hareket ettiği filmler.' } },
  clips: { title: { tr: 'Klip' }, description: { tr: 'Kısa anlar, güçlü bir atmosfer. Görsel ritim ve yaratıcı anlatım üzerine çalışmalar.' } },
};

export const copy = {
  tr: {
    discipline: 'Mimari fotoğraf & film', contact: 'İletişim', menu: 'Menü', close: 'Kapat', skip: 'İçeriğe geç',
    heroLine1: 'Mekânın ruhu.', heroLine2: 'Işığın hikâyesi.',
    heroIntro: 'Mimariyi, mekânları ve nesneleri\nkendi ışığında anlatıyorum.',
    explore: 'Çalışmaları keşfet', selected: 'Seçilmiş çalışmalar', selectedIntro: 'Her mekân, başka bir bakış.',
    viewProject: 'Projeyi incele', allProjects: 'Tüm mimari projeler', project: 'Proje',
    approach: 'Bakış açısı', statement: 'Bir yapının yalnızca nasıl göründüğü değil, nasıl hissettirdiği.',
    about: 'Işığın bir yüzeye dokunuşu, malzemenin dokusu, mekânın sessizliği. Fotoğraf ve film aracılığıyla tasarımın ardındaki duyguyu görünür kılmaya odaklanıyorum.',
    disciplines: 'Çalışma alanları', motion: 'Hareketin içinde', motionText: 'Bir mekân. Bir ritim.\nBaşka bir anlatım.', watch: 'Filmi keşfet',
    invitation: 'Birlikte, yeni bir\nbakış açısı.', start: 'Projenizi konuşalım',
    copyright: 'Tüm hakları saklıdır.', demo: 'Örnek görsel ve filmler kullanılmıştır.',
    back: 'Koleksiyona dön', next: 'Sonraki çalışma', gallery: 'Fotoğraflar', openPhoto: 'Fotoğrafı tam ekran aç', previousPhoto: 'Önceki fotoğraf', nextPhoto: 'Sonraki fotoğraf',
    play: 'Filmi oynat', videoError: 'Video yüklenemedi.', retry: 'Tekrar dene', download: 'Videoyu aç',
    contactHeading: 'Her iyi hikâye,\nbir merhabayla başlar.', contactIntro: 'Mimari projeleriniz, mekânlarınız ve tasarımlarınız için birlikte bir görsel hikâye oluşturalım.',
    contactPending: 'İletişim bilgileri yakında paylaşılacak.', contactNote: 'Bu önizlemede iletişim bilgileri henüz eklenmedi.', email: 'E-posta', phone: 'Telefon', social: 'Instagram', soon: 'Yakında',
    notFound: 'Bu sayfa kadrajın dışında.', notFoundText: 'Aradığınız çalışma burada bulunmuyor. Yeni bir bakış için ana sayfaya dönebilirsiniz.', home: 'Ana sayfaya dön',
    error: 'Bu sayfa şu anda yüklenemiyor.', count: 'çalışma', imageDescription: 'Görsel açıklaması',
  },
} satisfies Record<Locale, Record<string, string>>;
