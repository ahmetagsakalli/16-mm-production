# 16mm Production — Mimari fotoğraf ve film

Next.js 16.3.5, React 19.3 ve TypeScript. Galeri yerel dosyalardan hazırlanır; Drive bağlantısına veya veritabanına ihtiyaç duymaz.

## Yerelde çalıştırma

Çalışan proje, bulut dosya erişiminden bağımsız olarak `/Users/ahmetagsakalli/Developer/ozan-portfolio-local` klasöründedir. Görevdeki `outputs/ozan-portfolio` yolu bu klasöre bağlanır. Önceki çalışma kopyası aynı görevin `work/ozan-portfolio-before-local-move` klasöründe korunur.

```sh
./run.sh dev
```

Site: http://localhost:3000

`dev`, önce yeni medyayı hazırlar, ardından Next.js ve klasör izleyicisini çalıştırır. `assets/gallery/originals/` içine eklenen yeni görseller otomatik olarak WebP’ye dönüştürülür ve ilgili proje güncellenir. `build` öncesinde de aynı kontrol yapılır.

## Gerçek galeri — 30 Eylül 2026

654 fotoğraf ve 1 video, kaynak klasörlerine göre 30 dolu albüme aktarıldı. 667 kaynak dosyanın bağımsız kopyası alındı ve SHA-256 özetleri karşılaştırıldı. Boş klasörler ve arşivdeki yardımcı dosyalar korunur; Finder’ın sonradan oluşturduğu `.DS_Store` / `._` dosyaları içerik sayılmaz.

- Mimari ve detay albümleri: Mimari Projeler.
- Mağaza ve otel projeleri: Interior.
- Ürün, aydınlatma ve gıda albümleri: Ürün.
- Müzik klasörleri: Klip.
- Fuar albümü fotoğraflarıyla Mimari Projeler’de, filmiyle Video bölümünde yer alır. Aynı proje sayfasında hem fotoğraflar hem tam video bulunur.

Alt proje klasörü bulunmayan Ürün, Aydınlatma, Gıda, Fuar ve Detay grupları mevcut düzenleriyle birer albümdür; dosya adlarından yeni proje sınırları uydurulmaz. Boş projeler sitede boş kart üretmez. Aynı fotoğraf farklı projelerde varsa her konumda ayrı kayıt olarak korunur.

## Sonraki galeri yüklemeleri

Kategori ve proje klasörlerini içeren yeni arşivi şu komutla ekleyin:

```sh
./run.sh import:gallery "/tam/yol/yeni-galeri"
```

Birden fazla arşiv parçası aynı komuta verilebilir. Bu komut orijinalleri **kopyalar**, dosya özetlerini doğrular, WebP sürümlerini üretir ve proje kayıtlarını günceller. Aynı yoldaki aynı dosya tekrar eklenmez; aynı adlı farklı içerik gelirse orijinalin üzerine yazmadan hata verir. Yeni bir dosya adı kullanın.

Örnek kaynak düzeni:

```text
1- MİMARİ/
  Yeni Proje/
    01.jpg
    02.png
2- MAĞAZA/
  Yeni Mağaza/
    01.jpg
```

Dev sunucusu açıkken doğrudan `assets/gallery/originals/` altına eklemek de otomatik dönüşümü tetikler. Manuel çalıştırma: `./run.sh optimize`. Yeni üst kategori için önce `assets/gallery/config.json` içindeki `groups` eşleştirmesini tanımlayın. Proje adı, URL ve kapak değişiklikleri aynı dosyanın `projects` alanında kaynak klasör yolu anahtarıyla yapılabilir; orijinal klasör adı değişmez. Kapak için `cover` alanına dosyanın uzantılı adını yazın.

Görseller JPG, JPEG, PNG, WebP, AVIF, TIFF, HEIC/HEIF olabilir. Bu Mac’te HEIC, sistemdeki `sips` ile açılır; başka işletim sistemlerinde HEVC destekli libvips gerekir. Desteklenemeyen/bozuk görselde işlem hatayla durur ve son tamamlanmış site galerisi korunur.

## WebP ve hız

- Orijinal görüntü değiştirilmez. Yön bilgisi uygulanır, çıktı sRGB olur, EXIF/GPS bilgileri kaldırılır.
- Uzun kenar en çok 2560 px; kalite 85. Küçük görüntüler büyütülmez, şeffaflık korunur.
- Mobil ve masaüstü için 640 / 768 / 1280 / 1920 / 2560 genişlik hedeflerinde WebP sürümleri önceden oluşturulur. Ana WebP kopyaları yaklaşık 105,6 MiB; tüm boyutlar birlikte yaklaşık 456,5 MiB’dir. Tarayıcı ihtiyacına uygun **bir** boyut indirir.
- `next/image` ve özel loader, hazır WebP dosyasını seçer. Ziyaretçi isteğinde Sharp çalıştırılmaz. İçerik özetli URL’ler uzun süre önbelleklenir.
- Albümler gecikmeli yükleme, bulanık önizleme, sabit görüntü ölçüleri ve tam ekran fotoğraf gezinmesi kullanır. Ana sayfa yalnızca seçki gösterir; kategori sayfalarında tüm albümler erişilebilirdir.
- Tüm galeri manifesti tarayıcının JavaScript paketine eklenmez; sayfaya yalnızca o görünümün görsel bilgileri aktarılır.

## Video

Video dosyaları WebP’ye çevrilmez; görüntü ve ses korunarak MP4 web kopyası hazırlanır. Tam sürüm proje sayfasında, 24 saniyelik sessiz ve daha küçük önizleme ana sayfanın otomatik oynayan alanında kullanılır. Video posterleri WebP’dir. Kaynak videonun tamamı arşivde saklanır.

Yeni video dönüşümü için FFmpeg gerekir. Yolu `FFMPEG_PATH` ortam değişkeniyle veya yerel `assets/gallery/local.json` dosyasındaki `ffmpeg` alanıyla verin. Bu Mac için mevcut FFmpeg yolu ayarlıdır. Hazır videolar tekrar kodlanmaz.

## Dosyalar ve bağımsızlık

- `assets/gallery/originals/`: özel orijinal arşiv; herkese açık `public/` altında değildir, dağıtım ve Git dışında tutulur.
- `assets/gallery/archive-index.json`: kaynak yolları, boyutları ve SHA-256 kayıtları.
- `assets/gallery/config.json`: kategori/proje ayarları.
- `assets/gallery/cache.json`: yerel dönüşüm önbelleği.
- `assets/gallery/report.json`: fotoğraf sayıları ve kaynak–çıktı eşleştirmesi.
- `src/content/gallery.json`: otomatik üretilen proje/görsel manifesti; elle düzenlemeyin.
- `public/media/gallery/`: siteye servis edilen WebP ve MP4 kopyaları.

Drive’dan veya Downloads’tan silmek siteyi etkilemez. İçe aktarma yalnızca ekleme yapar; silmeleri senkronize etmez. Kaynak arşivden bir dosya kaldırılırsa önceden yayınlanmış kayıt ve WebP’ler korunur. Proje kaldırma ayrı ve bilinçli bir düzenleme gerektirir. Kaynak arşiv ayrıca yedeklenmelidir.

## Kontroller

```sh
./run.sh test:gallery
./run.sh verify:gallery
./run.sh lint
./run.sh typecheck
./run.sh build
```

Testler orijinallerin korunmasını, isim çakışmalarını, tekrar eden fotoğrafları, yön/şeffaflığı, boş klasörleri, önbelleği, eksik çıktıların yeniden üretimini ve bozuk dosyada son galerinin korunmasını denetler. Doğrulama komutu her albümün fotoğraf sayısını ve bütün WebP dosyalarını kontrol eder.

## Site ayarları

İsim ve iletişim bilgileri `src/content/site.ts` içindedir. Marka 16mm Production. Site yalnızca Türkçedir; adreslerde dil öneki kullanılmaz. Eski `/tr/...` ve `/en/...` adresleri aynı sayfanın öneksiz adresine kalıcı olarak yönlendirilir. Footer imzası: “Web Tasarım, Uygulama ve Geliştirme : kocyigityazilim.com”. Görünür etiket/rozet sistemi yoktur.

Türkçe metadata, canonical ve 37 sayfalık sitemap proje manifestinden üretilir. İngilizce dil seçimi ve hreflang alternatifleri kaldırılmıştır. Canlı alan adı için `SITE_URL` tanımlanır. Bu galeri çalışması yereldedir; canlı Vercel sürümü ayrıca yayınlanmalıdır. Önceki demo dosyaları eski çalışma kopyasında korunur; site gerçek galeri kayıtlarını kullanır.

## Son yerel ölçüm

30 Eylül 2026: Lighthouse 13.4.1 mobil simülasyonu, üretim derlemesi üzerinden. Ana sayfa hız 98; 104 fotoğraflı Ürün albümü hız 94. Her ikisinde SEO, erişilebilirlik ve en iyi uygulamalar 100. Bunlar yerel ölçümlerdir; canlı barındırmanın sonucu ayrıca ölçülmelidir. Ayrıntılı raporlar `reports/gallery/mobile-home.html` ve `reports/gallery/mobile-project.html` içindedir.

74 TR/EN sayfasının HTTP/metadata ve fotoğraf sayısı kontrolü, tüm WebP dosyalarının tam açılma kontrolü, MP4 görüntü/ses çözme kontrolü, içe aktarma testleri, lint, tip kontrolü ve derleme başarılıdır.
