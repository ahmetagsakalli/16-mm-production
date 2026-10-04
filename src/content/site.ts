export type Locale = 'tr';
export type Localized = Record<Locale, string>;

export const site = {
  name: '16mm Production',
  url: process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  demo: false,
  contact: { email: 'ozanars@live.com', phone: '+90 555 614 00 15', instagram: 'https://instagram.com/arsozan' },
  address: 'Vadi Park Seyrantepe, Hamidiye, Selçuklu Cd. A Blok No:10 G/2, 34408 Kağıthane / İstanbul',
  description: {
    tr: '16mm Production — Mimari fotoğrafçılık, iç mekân, ürün fotoğrafçılığı ve film. Mekânın karakterini, ışığın ve detayların hikâyesini keşfedin.',
  },
};

export const portfolioCategoryIds = ['architecture', 'hotels', 'retail', 'product', 'lighting', 'food', 'music', 'exhibitions', 'talking-head'] as const;
// Older addresses and saved revisions stay readable after the menu change.
export const categoryIds = [...portfolioCategoryIds, 'events', 'interiors', 'video', 'clips'] as const;
export type Category = (typeof categoryIds)[number];
export const isCategory = (value: string): value is Category => categoryIds.includes(value as Category);
export const galleryCategoryIds: readonly Category[] = ['product', 'lighting', 'food', 'exhibitions', 'talking-head'];
export function canonicalCategory(category: Category): Category { return category === 'events' ? 'exhibitions' : category; }
export function isGalleryCategory(category: Category) { return galleryCategoryIds.includes(canonicalCategory(category)); }
export function belongsToCategory(project: { categories: readonly Category[] }, category: Category) {
  return project.categories.some(id => canonicalCategory(id) === canonicalCategory(category));
}
export const categories: Record<Category, { title: Localized; description: Localized }> = {
  architecture: { title: { tr: 'Mimari' }, description: { tr: '16mm Production mimari fotoğrafçılık portfolyosu. Yapılar, cepheler ve mekânlar.' } },
  hotels: { title: { tr: 'Otel' }, description: { tr: '16mm Production otel ve konaklama mekânları fotoğrafçılığı.' } },
  retail: { title: { tr: 'Mağaza' }, description: { tr: '16mm Production mağaza, perakende ve marka mekânları fotoğrafçılığı.' } },
  lighting: { title: { tr: 'Aydınlatma' }, description: { tr: '16mm Production aydınlatma projeleri ve ışık tasarımı fotoğrafçılığı.' } },
  food: { title: { tr: 'Yemek Fotoğrafçılığı' }, description: { tr: '16mm Production yemek, gastronomi ve restoran fotoğrafçılığı.' } },
  music: { title: { tr: 'Müzik' }, description: { tr: '16mm Production müzik, konser fotoğrafları ve film çalışmaları.' } },
  exhibitions: { title: { tr: 'Fuar / Organizasyon' }, description: { tr: '16mm Production fuar, organizasyon ve etkinlik fotoğraf ve filmleri.' } },
  'talking-head': { title: { tr: 'Talking Head' }, description: { tr: '16mm Production röportaj, konuşmacı ve kurumsal anlatım çalışmaları.' } },
  events: { title: { tr: 'Organizasyon' }, description: { tr: '16mm Production organizasyon ve etkinlik fotoğrafçılığı.' } },
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
