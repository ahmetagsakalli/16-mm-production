# 16mm Production — SEO ve hız denetimi

30 Eylül 2026 · Yerel üretim sürümü

| Sayfa | Hız | SEO | Erişilebilirlik | En iyi uygulamalar | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| [Ana sayfa · Mobil](hero-quality-final/home-mobile.html) | 94 | 100 | 100 | 100 | 3.13 sn | 0 | 55 ms |
| [Ana sayfa · Masaüstü](hero-quality-final/home-desktop.html) | 100 | 100 | 100 | 100 | 0.61 sn | 0 | 0 ms |
| [İletişim · Mobil](final/contact-mobile.html) | 97 | 100 | 100 | 100 | 2.56 sn | 0 | 20 ms |
| [Mimari proje listesi · Mobil](final/architecture-mobile.html) | 94 | 100 | 100 | 100 | 3.10 sn | 0 | 20 ms |
| [Ürün / 104 fotoğraf · Mobil](final/project-mobile.html) | 94 | 100 | 100 | 100 | 3.01 sn | 0 | 19 ms |
| [Fuar / video projesi · Mobil](video-priority/video-mobile.html) | 96 | 100 | 100 | 100 | 2.69 sn | 0 | 32 ms |

## Ölçüm koşulları

Lighthouse 13.4.1, Chrome 154 ve Next.js 16.3.5 üretim derlemesi. Ana uygulama geliştirme portu 3000 üzerinde açık tutuldu; ölçümler ayrı bir üretim sunucusunda 127.0.0.1:3001 üzerinden, boş tarayıcı önbelleği ve uzantısız ayrı Chrome profiliyle, sırayla yapıldı. Mobil ölçümlerde Lighthouse varsayılan benzetimi (150 ms RTT, 1.6 Mbps, 4× CPU yavaşlatma), masaüstünde varsayılan desktop ayarları kullanıldı.

Bunlar yerel laboratuvar ölçümleridir; canlı sunucu/CDN, ağ ve gerçek kullanıcı verisini temsil etmez. Mobil LCP bazı sayfalarda 2.5 saniyenin üzerinde kalıyor. SEO puanı teknik Lighthouse kontrollerini gösterir; arama sıralaması ölçümü değildir. [Lighthouse ölçüm rehberi](https://developer.chrome.com/docs/lighthouse/overview).

## Yapılan iyileştirmeler

- Küçük CSS dosyaları ilk HTML yanıtına alındı; ilk açılışta engelleyici stil istekleri kaldırıldı. Next.js inlineCss seçeneği deneysel; üretim derlemesi ve sayfalar arası geçişler doğrulandı. Stillerin HTML ile yeniden gönderilmesi karşılığında ilk ziyaret daha hızlı açılıyor.
- Yükleme görünümü footer'ın ekran içinde yer değiştirmesini önleyecek yüksekliğe getirildi. Galeri fotoğraflarının en-boy oranı görsel indirilmeden ayrılıyor; ölçülen CLS 0.
- Kart ve galeri sizes değerleri gerçek mobil genişliklere uyarlandı. Tarayıcı uygun boyuttaki mevcut WebP dosyasını seçiyor. Orijinal dosyalar, proje klasörleri ve sıkıştırma kalitesi değiştirilmedi.
- Tek videolu projede ilk fotoğraf mobilde ilk ekranda bulunduğundan öncelikli yükleniyor. Tam film ilk sayfa açılışında indirilmiyor.
- Eski boş iletişim ayarlarının üretim derlemesine taşınmasına neden olan kalıcı ayar önbelleği kaldırıldı; aynı render içindeki tekrarlar React cache ile birleştiriliyor. Sayfa önbelleği korunuyor, yönetim panelinde kaydetme public layout'u yeniliyor. Telefon, WhatsApp, e-posta ve Instagram üretimde doğrulandı.
- Kuruluş yapılandırılmış verisine mevcut iletişim bilgileri ve Instagram eklendi.
- Olmayan/yayından kaldırılmış proje adresleri, akış başlamadan gerçek HTTP 404 ve noindex döndürüyor. Yeniden adlandırılmış projelerin 308 yönlendirmesi korunuyor.

## Diğer doğrulamalar

[37 sayfalık SEO taraması](seo-pages.json): 37/37 başarılı. Başlık, açıklama, tek H1, Türkçe dil, canonical, WebP görseller, alt metin, görsel ölçüleri ve kuruluş verisi kontrol edildi. Sitemap ve robots.txt başarılı; yönetim paneli noindex; eski /tr ve /en adresleri 308 ile yönleniyor. Yerelde canonical alan adı localhost:3000; canlıya alınırken SITE_URL gerçek HTTPS alan adı olmalıdır.

Üretim derlemesi ve TypeScript başarılı. ESLint başarılı. CMS'nin 8 testi geçti; yayın/taslak/silme ve adres değişikliğinin public proje kontrolü de bu testlere eklendi. Mobil galeride 104 fotoğraf, tam ekran açılış/kapanış, kategoriye geçiş, taşma olmaması ve güncel iletişim bağlantıları tarayıcıda doğrulandı.

## Rapor geçmişi

JSON ve HTML ham Lighthouse raporları ilgili klasörlerde saklandı. baseline ilk durumdur; optimized CSS/yerleşim denemesidir. İkisinde de inceleme sırasında fark edilen eski iletişim önbelleği bulunuyordu; nihai skorlar olarak kullanılmamalıdır. final güncel iletişim bilgileri ve görsel boyutlarıyla ölçüldü. Sadece video sayfasındaki ilk fotoğraf önceliği daha sonra değiştirildi ve bu sayfa video-priority altında yeniden ölçüldü; yukarıdaki tabloda bu son ölçüm kullanıldı. Tüm denemeler korunmuştur.

SEO taramasını yeniden çalıştırmak için üretim sunucusu açıkken:

```sh
./run.sh exec node scripts/audit-seo.mjs http://127.0.0.1:3001 reports/seo-audit.json
```

## Hero görsel kalitesi güncellemesi

Kullanıcının sonraki isteği üzerine yalnızca üç hero fotoğrafına, orijinal dosyalardan %92 WebP kalitesinde ayrı kopyalar üretildi. Normal galeri kopyaları ve orijinaller değişmedi. Hero üzerindeki koyu katman hafifletildi. En fazla 480 px genişlikteki dikey telefonlarda yatay fotoğraflar için aynı odak noktasında 3:4 mobil kadraj kullanılıyor; böylece ekranda görünmeyen alanlar indirilmeden kaynak pikselleri korunuyor. Otomatik geçiş ve hafif zoom devam ediyor.

Hero kaynaklarının uzun kenarı 1024 px. Daha büyük ekranlarda belirgin ölçüde daha fazla detay için yüksek çözünürlüklü kaynaklar gerekir; yapay büyütme uygulanmadı. `scripts/optimize-hero.mjs` hazırlığı standart medya hazırlama akışına eklendi.

`hero-quality` ilk tam genişlik denemesidir (mobil 88); `hero-quality-final` mobil kadraj optimizasyonundan sonraki kabul edilen sürümdür (mobil 94, masaüstü 100; SEO/erişilebilirlik/en iyi uygulamalar 100, CLS 0). Tablodaki ana sayfa sonuçları son sürüme güncellendi. Diğer sayfalar önceki denetimlerini gösterir.
