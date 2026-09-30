# Yerel doğrulama — Ozan B.

16 Eylül 2026. Next.js üretim derlemesi (`next build` + `next start`), localhost. Lighthouse 13.4.1, Node.js 24.19.0. Mobil Lighthouse varsayılan telefon/ağ/CPU benzetimini; masaüstü resmi `desktop-config` ayarını kullanır. Raporların `formFactor` alanları ayrıca doğrulanmıştır.

## Header tasarımı

Tipografi güncellemesi: Menü 14 px / 500 ağırlık, dil seçimi 12 px; logo daha açık harf aralığı ve 650 ağırlıkla düzenlendi. 600 px ve altında menü düğmesi yalnızca simge gösteriyor, açılır menü yazıları 17 px. Üretim derlemesi geçti; Chrome'da masaüstü ve 320 px mobil görünümde taşma yok, menü açılıp kapandı.

16 Eylül 2026. Ana sayfadaki beyaz menü girintisi kaldırıldı. Fotoğrafın üzerinde koyu, hafif şeffaf tek bir bar içinde logo, ortalanmış proje menüsü, dil seçimi ve çerçeveli iletişim bağlantısı bulunuyor. İç sayfalarda aynı düzen opak koyu zeminle kullanılıyor. Mobilde uyumlu koyu açılır menü ve bağlantı okları var.

- Üretim derlemesi, TypeScript ve ESLint geçti.
- Chrome'da masaüstü görünümü ve 320 px mobil genişlik kontrol edildi; yatay taşma yok.
- Mobil menü açıldı, Ürün bağlantısı doğru koleksiyona gitti ve menü kapandı. TR/EN geçişi aynı koleksiyon sayfasında kaldı; İngilizce mobil görünümde de taşma yok.

## Vercel üretim yayını

16 Eylül 2026. [Canlı site](https://ozan-b-portfolio.vercel.app/tr), ahmetagsakalli hesabının `bgc-nakliyat` çalışma alanındaki `ozan-b-portfolio` projesine yayımlandı. Deployment `dpl_EoYktzmCC1o3PN6pWmZF59MLywFG`; durum READY, hedef production. Next.js üretim derlemesi Vercel'de 38 saniyede tamamlandı. Proje bir Git deposuna bağlı olmadığı için commit kimliği bulunmuyor.

- Yerel üretim derlemesi, TypeScript ve ESLint geçti; uzak Vercel derlemesi de geçti.
- Canlı sitedeki 30 yerelleştirilmiş sayfa HTTP 200 döndü. Dil, tek H1, başlık, açıklama, canonical ve hreflang kontrolleri geçti.
- Canonical, sitemap ve robots canlı `https://ozan-b-portfolio.vercel.app` alan adını kullanıyor. `/` kalıcı olarak `/tr` yoluna yönleniyor; bilinmeyen beş yol 404 verdi.
- Next.js görsel endpoint'i WebP verdi. Her iki MP4 dosyası byte-range isteğine 206 yanıtı verdi.
- Canlı ana sayfa Chrome'da oturum açma gerektirmeden açıldı. [HTTP denetim raporu](reports/production-http-check.json).
- Aşağıdaki Lighthouse skorları önceki yerel sürümlere aittir; canlı yayın skoru olarak kullanılmamalıdır.

## Otomatik hero ve hafif yakınlaşma

16 Eylül 2026. Hero görünürken ve sekme açıkken görseller beş saniyede bir otomatik değişir. Fotoğrafa 6 saniye boyunca en fazla %4,5 yakınlaşma uygulanır; yeni fotoğrafta hareket yeniden başlar. Klavye odağı hero üzerindeyken otomatik ilerleme bekler. Hareketi azaltma tercihinde yakınlaşma kapalıdır.

- Üretim derlemesi (TypeScript dahil) ve ESLint geçti.
- Chrome'da hiçbir geçiş düğmesine basmadan Bahçe Evi, Açık Ev ve Sakin Yaşam görselleri sırayla gözlemlendi; proje bağlantısı görselle birlikte güncellendi.
- Görsellerde ölçek değerleri 1,00475, 1,02188 ve 1,03137 olarak gözlemlendi. İç mekân fotoğrafı başarıyla yüklendi.
- Lighthouse bu güncellemede yeniden ölçülmedi.

## Footer düzenlemesi

16 Eylül 2026. Koyu footer üç alana ayrıldı: normal boyutta Ozan B. logosu, proje bağlantıları ve kısa iletişim çağrısı. Alt satırda telif, örnek medya bilgisi ve sayfa başına dönüş bulunuyor. Mobilde marka üstte, menü ve iletişim yan yana yerleşiyor.

- Üretim derlemesi (TypeScript dahil) ve ESLint geçti.
- Chrome'da 1680 px masaüstü ve 390 px mobil görünümde yatay taşma yok. Footer yüksekliği sırasıyla yaklaşık 270 px ve 389 px.
- Footer'daki beş koleksiyon bağlantısı doğru adreslere bağlı; iletişim bağlantısı mobilde `/tr/contact` sayfasını açtı.

## Mobilde üst üste gelen diğer çalışma kartları

16 Eylül 2026. “Diğer çalışmalar” kartları 600 px ve altında CSS sticky ile kaydırıldıkça sırayla üst üste geliyor. Kartlar arasında 20 px üst kenar farkı var; ek JavaScript veya animasyon kütüphanesi eklenmedi. Hareketi azaltma tercihinde kartlar normal akışta gösteriliyor.

- Üretim derlemesi ve TypeScript geçti.
- Chrome 390 × 844 görünümünde ilk kart 24 px, ikinci kart 44 px konumunda tutundu; üçüncü kart kaydırıldıkça bunların üzerine geldi. Yukarı kaydırınca kartlar tekrar ayrıldı. Yatay taşma yok.
- Normal 1680 px görünümüne dönüldüğünde üç kart aynı satırda ve `position: static`; masaüstü düzeni korundu.

## Seçilmiş çalışmalar için kart düzeni

16 Eylül 2026. Seçili kategorinin projeleri beyaz, yuvarlatılmış kartlarda gösteriliyor; kategori seçimi üstte sade metin olarak kaldı. Bölümün iki satırlı başlığı korundu. Masaüstünde iki sütun, mobilde tek sütun kullanılıyor; bu bölümdeki önceki/sonraki düğmeleri kaldırıldı.

- Üretim derlemesi (TypeScript dahil) ve ESLint geçti.
- Chrome'da 1680 px genişlikte iki kart aynı hizada; 390 px genişlikte alt alta. İki görünümde de yatay taşma yok.
- Interior seçimi kartları ve “Tümünü gör” bağlantısını güncelledi. Mobilde iki kapak görseli yüklendi; Açık Ev kartı doğru proje sayfasını açtı.
- Bu güncellemede Lighthouse yeniden çalıştırılmadı; aşağıdaki skorlar tarihsel ölçümlerdir.

## Menü birleşimi, bölüm boşlukları ve otomatik video

16 Eylül 2026. Orta menünün kenar parçaları kaldırıldı ve üst birleşimi kapatıldı. Gri proje bölümünün iç boşlukları ve sol sütunu daraltıldı; oklar kategori listesinin yakınına alındı. Ana sayfa film bandı görünür alana yaklaşınca sessiz, düğmesiz ve döngüde oynuyor.

- Üretim derlemesi (TypeScript dahil) ve ESLint geçti.
- Chrome'da 1680 px masaüstü ve 390 px mobil görünüm kontrol edildi; yatay taşma yok. Gri bölüm yüksekliği sırasıyla yaklaşık 635 px ve 455 px.
- Video tıklamadan oynadı: `muted=true`, `loop=true`, `controls=false`, `paused=false`, medya hatası yok. Oynatma zamanı 20,07 saniyelik filmin sonundan tekrar başa dönerek ilerledi. Film bandında düğme bulunmuyor.
- Bu dar kapsamlı güncellemede Lighthouse yeniden çalıştırılmadı. Aşağıdaki skorlar önceki sürümlerin ölçümleridir.

## Referansa göre yeniden düzenlenen sürüm

Dribbble Architecture Studio referansının tam sayfa görseli incelendi. Fotoğraf üstüne yerleşen beyaz orta menü, ortalanmış beyaz ana başlık, yuvarlatılmış geniş görseller, açık gri proje bölümü, solda çalışma alanları / sağda seçili proje, film görseli ve koyu alt bölüm uygulandı. Mimarlık stüdyosuna ait ödül, istatistik, müşteri yorumu ve örnek etiketler eklenmedi; içerik fotoğrafçı portfolyosuna uyarlandı.

- Üretim derlemesi ve TypeScript geçti; ESLint geçti.
- 30 yerelleştirilmiş sayfanın HTTP/SEO kontrolleri, sitemap, robots, WebP yanıtı ve MP4 range istekleri geçti.
- Ana kapakta önceki/sonraki proje; gri alanda çalışma alanı seçimi ve proje geçişi masaüstü ve mobilde çalıştı.
- Mobil menü, ürün koleksiyonuna geçiş ve aynı sayfada TR/EN değişimi çalıştı. Video kullanıcı tıklamasıyla oynadı; 11. saniyeden sonra da hata vermedi. Görünür başlat/durdur metni yok.
- 320, 390, 768 ve 1280 px genişliklerde yatay taşma bulunmadı. Kontrol edilen sayfalarda tarayıcı hatası yok.

Referansa göre düzenleme aşamasındaki ana sayfa için yerel Lighthouse, cihaz başına bir koşu:

| Cihaz | Performans | Erişilebilirlik | En iyi uygulamalar | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Mobil | 94 | 100 | 100 | 100 | 3,12 sn | 0 |
| Masaüstü | 100 | 100 | 100 | 100 | 0,62 sn | 0 |

Raporlar: [Mobil](reports/reference-rebuild/mobile.html), [masaüstü](reports/reference-rebuild/desktop.html), [ham skorlar](reports/reference-rebuild/summary.json). Mobil LCP 2,5 saniyenin üzerindedir. Ölçümler yerel laboratuvar koşullarına aittir; canlı saha verisi değildir. Aşağıdaki bölümler önceki tasarımların tarihsel kontrol kayıtlarıdır.

## Başlık tasarımı düzeltmesi

İki satırlı ana başlık, ikinci satırın gri tonu ve ilk tasarımın harf aralıkları geri getirildi. Ana başlık masaüstünde en fazla 56 px, mobilde 32–42 px; bölüm başlıkları 28/24 px. Düzenli görsel çerçeveleri korundu. Üretim derlemesi ve ESLint geçti; 1280 px ve 390 px görünümlerinde başlık iki satır kaldı ve yatay taşma bulunmadı. Aşağıdaki Lighthouse skorları bu tipografi düzeltmesinden önceki ölçümdür.

## Önceki sadeleştirme güncellemesi

Başlıklar masaüstünde 28–32 px, mobilde 23–27 px; bölüm başlıkları 18–20 px ve proje adları 14–15 px olarak düzenlendi. İçerik genişliği 1120 px ile sınırlandı. Kartlar aynı oran ve hizaya alındı; görseller kendi çerçeveleri içinde tutuluyor. Dekoratif numaralar, etiket gibi kullanılan üst başlıklar, sloganlar, tekrar eden açıklamalar ve büyük iletişim çağrıları kaldırıldı. Video kontrollerinde yalnızca simgeler gösteriliyor; ekran okuyucu adları korundu.

Bu güncellemeden sonra:

- ESLint ve üretim derlemesi (TypeScript dahil) geçti.
- 30 sayfanın HTTP/SEO ve WebP/MP4 kontrolleri yeniden geçti.
- 390 px mobil, 768 px tablet ve 1280 px masaüstünde yatay taşma bulunmadı. Kart ve albüm görselleri çerçeveleri içinde kaldı.
- Mobil menü, koleksiyon/proje bağlantıları, TR/EN geçişi, galeri okları ve Escape ile kapanma kontrol edildi.
- Video simgesine tıklayınca oynatma başladı; 19. saniyeye kadar ilerledi ve hata vermedi. Görünür başlat/durdur metni bulunmuyor.

Ana sayfanın güncel yerel Lighthouse ölçümü (cihaz başına **bir koşu**, önceki üçlü koşulardan ayrıdır):

| Cihaz | Performans | Erişilebilirlik | En iyi uygulamalar | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Mobil | 99 | 100 | 100 | 100 | 2,26 sn | 0 |
| Masaüstü | 100 | 100 | 100 | 100 | 0,62 sn | 0 |

Raporlar: [Mobil](reports/layout-revision/mobile.html), [masaüstü](reports/layout-revision/desktop.html), [ham skorlar](reports/layout-revision/summary.json). Bunlar yerel laboratuvar ölçümleridir.

Aşağıdaki eski üçlü Lighthouse koşuları ilk tasarıma aittir ve bu güncellemenin ölçümü olarak kullanılmamalıdır.

## İlk sürüm Lighthouse ölçümleri

Her sayfa ve cihazda **üç koşu**. Ortanca skorlar aşağıdadır; bu tablo en iyi koşuyu seçmez.

| Sayfa | Mobil koşular | Mobil ortanca | Masaüstü ortanca | Mobil LCP ortanca |
|---|---|---:|---:|---:|
| Ana sayfa | 91 / 96 / 96 | 96 | 100 | 2.79 sn |
| Mimari koleksiyon | 97 / 94 / 97 | 97 | 100 | 2.63 sn |
| Fotoğraf albümü | 99 / 96 / 96 | 96 | 100 | 2.78 sn |
| Video projesi | 98 / 99 / 99 | 99 | 100 | 2.19 sn |
| İletişim | 99 / 98 / 98 | 98 | 100 | 2.48 sn |

Beş sayfa türünün tüm koşularında:

- **SEO: 100**, **Erişilebilirlik: 100**, **En iyi uygulamalar: 100**.
- **CLS: 0**; masaüstü TBT: 0 ms.
- Mobil performans hedefi ≥90, masaüstü hedefi ≥95 karşılandı.

Ana sayfanın ilk mobil koşusu 91, sonraki koşuları 96’dır. Lighthouse laboratuvar ölçümüdür; gerçek kullanıcıların Core Web Vitals verisi veya canlı PageSpeed sonucu değildir. Bazı mobil sayfalarda LCP 2,5 saniyenin üzerindedir. Gerçek medya/hosting ile yayına geçişte yeniden ölçülmelidir. Yerelde INP saha verisi toplanmamıştır.

Ham skorlar: [lighthouse-summary.json](reports/lighthouse-summary.json). Her cihaz/sayfa için ortanca performans skoruna sahip koşunun ayrıntılı HTML raporu `reports/` klasöründedir.

## İşlev ve içerik kontrolleri

- 30 yerelleştirilmiş sayfa HTTP 200; doğru `html lang`, tek H1, Ozan B. içeren başlık, açıklama, canonical ve TR/EN hreflang alanları.
- Ana adres `/tr` yoluna HTTP 308 yönlendiriyor. Beş farklı geçersiz dil/kategori/proje/adres HTTP 404 döndürüyor.
- Sitemap 30 sayfayı iki dil alternatifiyle listeliyor; robots sitemap adresini içeriyor.
- Optimize görsel endpoint’i `image/webp` döndürüyor. Her iki MP4 de byte-range isteğine HTTP 206 veriyor.
- Masaüstü 1280×720, mobil 390×844 ve tablet 768×1024 görünümü tarayıcıda kontrol edildi; yatay taşma görülmedi.
- Mobil menü açılıyor ve gezinme sonrası kapanıyor. Projede dil değişimi aynı projenin diğer dilini açıyor.
- Tam ekran galeri açılıyor; sağ/sol oklarla geçiş ve Escape ile kapanma çalışıyor. Kapanınca odak fotoğraf düğmesine dönüyor.
- Video ve Klip örnekleri kullanıcı tıklamasıyla yüklenip sonuna kadar oynadı. Oynatmadan önce sayfada video elementi bulunmuyor.
- Gerçek iletişim bilgileri girilmediğinden sahte e-posta/telefon/sosyal bağlantı oluşturulmuyor.
- Kontrol edilen sayfalarda uygulamadan kaynaklanan tarayıcı hatası görülmedi.

HTTP kontrol çıktısı: [http-check.json](reports/http-check.json).

## Kod ve görsel optimizasyonu

- Üretim derlemesi: geçti, sayfalar statik üretildi.
- ESLint: geçti, hata/uyarı yok.
- TypeScript: geçti.
- Görsel dönüşüm testleri: 2/2 geçti. EXIF yönü, alfa kanalı, boyut sınırı, küçük dosyaları büyütmeme, kaynak dosyayı koruma, tekrar işleme önbelleği ve bozuk dosya hatası doğrulandı.
- 14 görselin kaynak toplamı **10,12 MiB**, WebP toplamı **5,96 MiB**: yaklaşık **%41 küçülme**. Tarayıcıda `next/image` daha küçük cihaz boyutlarını sunar.
- Yazı tipi yerel WOFF2: yaklaşık 52 KiB.

## Teslim sınırları

Site https://ozan-b-portfolio.vercel.app adresinde yayımlanmıştır. Görseller, filmler ve proje metinleri örnektir. Soyadı, gerçek proje medyası, iletişim bilgileri ve özel alan adı geldiğinde README’deki adımlarla güncellenmelidir.

## Şeffaf header güncellemesi — 16 Eylül 2026

- Ana sayfada fotoğraf üzerine yerleşen beyaz logo ve menü, ince ayırıcı çizgi, yuvarlatılmış iletişim butonu. İç sayfalarda aynı düzen koyu yazıyla uygulanır.
- Mobilde 44 px yuvarlak menü düğmesi ve açık renkli bağlantı paneli; hareket azaltma tercihi mevcut global CSS ile korunur.
- Üretim derlemesi ve TypeScript kontrolü geçti. 1680, 940, 390 ve 320 px genişliklerde yatay taşma görülmedi; mobil menü açıldı ve bağlantıya tıklayınca kapandı.
- Yeni JavaScript, font veya paket eklenmedi. Yukarıdaki Lighthouse değerleri önceki ölçümlerdir; bu CSS güncellemesinde yeniden ölçülmedi.
