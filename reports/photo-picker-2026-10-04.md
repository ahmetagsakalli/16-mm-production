# Fotoğraf seçici düzeltmesi — 4 Ekim 2026

Sorun: 205px yüksekliğindeki kartların implicit grid satırları 31px hesaplanıyordu; sonraki satır kartların üstüne biniyordu.
Düzeltme: Scroll alanı kart gridinden ayrıldı, grid-auto-rows:max-content tanımlandı. Modal genişletildi; masaüstü 3, tablet 2, telefon 1 sütun. Fotoğraflar object-fit:contain ile tamamı görünür. Seçim çemberi/yeşil çerçeve, sonuç adedi ve alfabetik proje filtresi var. Başlık, filtreler ve ekleme düğmesi sabit; yalnız fotoğraf alanı kayar. Filtre değişince sonuçlar başa döner. Ortak bileşen ana sayfa, proje kapağı ve blog kapağında kullanılır.

Doğrulama:
- ESLint ve TypeScript başarılı; Vercel 56 sayfalık üretim derlemesi başarılı.
- Yerelde Fuar (37) ve Ürün (104) fotoğraflarıyla kartlar arasında çakışma olmadığı ölçüldü.
- 390x844 mobilde tek sütun, yatay taşma yok, kaydırma çalışıyor. Çoklu seçim ve buton etkinleşmesi doğrulandı.
- Aramada bulunamayan sonuç durumu ve iptal sonrası değişiklik olmaması doğrulandı.
- Tekli proje kapağı seçicisinde 15 kart, çakışma yok.
- Canlı panelde Fuar 37 fotoğraf, 3 sütun, contain ve çakışma yok doğrulandı.
- Geçici viewport sıfırlandı. Deneme seçimleri kaydedilmedi.
- Canlı settings/projects/revisions/homepage/blog dışa aktarımları önce/sonra aynı. Özel yedekler .data/backups/photo-picker-2026-10-04/. Ayrı doğrulama oturumu kapatılıp çerez dosyası kaldırıldı.

Canlı: https://16mm-production.vercel.app/admin/ana-sayfa
Deployment: dpl_JDzGxaGwS5yoETNWpqaAVY6kX7wP
Artifact: https://16mm-production-rhpivhrxg-guncel-yayin.vercel.app
Önceki: dpl_HTPu2zDCmU5pyiUsjvgYWne75yq3
Ekran görüntüsü: photo-picker-live-2026-10-04.png
