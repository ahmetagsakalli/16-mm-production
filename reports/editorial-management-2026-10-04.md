# İçerik yönetimi — 4 Ekim 2026

Canlı: https://16mm-production.vercel.app/
Panel: https://16mm-production.vercel.app/admin
Blog: https://16mm-production.vercel.app/blog
Deployment: dpl_4hcqGzTdfhdS1VErKvQB5NDNMgJc
Artifact: https://16mm-production-3ivbf9rn2-guncel-yayin.vercel.app
Önceki sürüm: dpl_DFPqH3gf6eqXKchdMDuV3b4X2Vg7

## Değişiklikler
- Galeri, Projeler ile aynı içeriğe kısayol sağlıyordu; ayrı menü kaldırıldı. Eski /admin/galeri adresi /admin/projeler adresine yönlenir.
- Proje düzenleyicisinde görünür kapak önizlemesi ve fotoğraf seçici var. Seçimi Yayınla ile siteye aktarılır; galerinin sırası değişmez.
- Ana sayfa bölümü açılış fotoğrafları ve mobil seçilmiş projeleri, sıralarıyla birlikte kalıcı olarak yönetir.
- Blog yazıları bölümünde oluşturma, taslak kaydetme, önizleme, yayınlama, yayından kaldırma ve geri alınabilir çöp kutusu var. Kapak, yayınlanan proje fotoğraflarından seçilir.
- Beş özgün Türkçe başlangıç yazısı yayınlandı: mimari ışık, otel, mağaza, ürün ve çekim hazırlığı.
- Yeni içerikler yedek dışa aktarımına dahil. Kurulum yalnızca ek tabloları ve bir defalık başlangıç içeriğini oluşturur.

## Doğrulama
- Mevcut CMS: 9/9; yeni içerik yönetimi: 10/10 test geçti. İzole geçici veritabanları kullanıldı.
- ESLint, TypeScript ve 56 sayfalık üretim derlemesi başarılı.
- Local: ana sayfa sıralaması kaydetme ve yenileme ile doğrulandı; ilk sıraya geri döndürüldü. Kapak seçicisi önizlemede denendi ve kayıt yapılmadan geri alındı.
- Canlı: ana sayfa, iletişim, mimari/ürün galerileri, örnek proje, panel, blog listesi, beş yazı ve sitemap HTTP 200. Beş yazı sitemap içinde.
- Canlı yönetim: Ana sayfa, Blog yazıları, medya seçenekleri API 200; oturumsuz blog API 401. Eski Galeri adresi doğru yönleniyor.
- Masaüstü panel ve 390 × 844 mobil yazı düzenleyicisi / kamuya açık yazı görünümü tarayıcıda kontrol edildi. Geçici viewport sıfırlandı.
- Yeni deployment hata günlüğü sorgusu hata kaydı döndürmedi.

## Verilerin korunması
Canlı içerik önce, aşamalı deploy sonrası ve yayına geçiş sonrası dışa aktarıldı. settings, projects ve revisions alanları kimliklerine göre karşılaştırıldı; tamamı aynı. 31 proje, 674 medya (673 fotoğraf + 1 film), 52 yayın geçmişi kaydı korundu. Önceki ana sayfadaki 2 fotoğraf / 2 seçilmiş proje aynı sıralamayla başlangıç seçimi oldu. Yeni 5 blog yazısı eklendi. Mevcut şifreler veya depolama ayarları değiştirilmedi.

Özel yedekler: .data/backups/editorial-2026-10-04/ (deployment dışında).
Doğrulamada kullanılan ayrı API oturumu kapatıldı; geçici çerez ve header dosyaları kaldırıldı.

Ekran görüntüsü: editorial-panel-live-2026-10-04.png
