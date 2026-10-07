import type { Category } from './site';

export const homeIntroductions: Partial<Record<Category, { title: string; description: string }>> = {
  architecture: { title: 'Mimari Fotoğrafçılık', description: 'Yapıların çizgilerini, ışığını ve karakterini fotoğrafa taşıyoruz.' },
  hotels: { title: 'Otel Fotoğrafçılığı', description: 'Odalardan ortak alanlara, mekânın atmosferini ve deneyimini anlatıyoruz.' },
  product: { title: 'Ürün Fotoğrafçılığı', description: 'Ürünün malzemesini, dokusunu ve detaylarını öne çıkarıyoruz.' },
  retail: { title: 'Mağaza Fotoğrafçılığı', description: 'Markanın kimliğini, mekânın tasarımını ve alışveriş deneyimini aynı karede buluşturuyoruz.' },
  lighting: { title: 'Aydınlatma Fotoğrafçılığı', description: 'Işığın mekâna ve malzemeye kattığı karakteri görünür kılıyoruz.' },
  food: { title: 'Yemek Fotoğrafçılığı', description: 'Lezzetin rengini, dokusunu ve sunumunu özenle fotoğraflıyoruz.' },
  music: { title: 'Müzik ve Sahne', description: 'Sahnenin enerjisini, performansın duygusunu ve o anın hikâyesini yakalıyoruz.' },
  exhibitions: { title: 'Fuar ve Organizasyon', description: 'Buluşmaların atmosferini, markaları ve etkinliğin öne çıkan anlarını anlatıyoruz.' },
  'talking-head': { title: 'Talking Head', description: 'İnsanları ve fikirlerini, doğal bir anlatımla kamera önüne taşıyoruz.' },
  interiors: { title: 'İç Mekân Fotoğrafçılığı', description: 'Işığı, malzemeyi ve mekânın içindeki yaşamı fotoğrafa taşıyoruz.' },
  video: { title: 'Fotoğraf ve Film', description: 'Mekânların ve markaların hikâyesini hareketli görüntülerle anlatıyoruz.' },
  clips: { title: 'Klip ve Görsel Anlatım', description: 'Ritmi, hareketi ve duyguyu aynı hikâyede buluşturuyoruz.' },
};
