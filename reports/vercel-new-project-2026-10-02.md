# 16mm Production — 2 Ekim 2026 yayını

- Hesap: ahmetagsakalli; takım: Güncel Yayın (`guncel-yayin`).
- Yeni proje: `16mm-production` (`prj_KodCtqSgfsDuq0BMJjS0uZ7xFtHS`).
- Canlı adres: https://16mm-production.vercel.app
- Panel: https://16mm-production.vercel.app/admin
- Başarılı üretim dağıtımı: `dpl_7iBADBo246okFc8byU3iwktJsXfX`.
- Yerel kaynak: `/Users/ahmetagsakalli/Developer/ozan-portfolio-local`.
- Bu dizinin `.vercel/project.json` bağlantısı artık yeni projeye aittir.

## Veri ve medya

Yerel SQLite verisinin tutarlı bir yedeği, yeni ve boş `16mm-redesign-cms` Turso veritabanına aktarıldı. 31 proje, 674 medya kaydı (673 fotoğraf, 1 video), 52 revizyon, ayarlar ve mevcut parola özeti birebir doğrulandı. Yerel oturumlar taşınmadı. Veritabanı Vercel'de yeni projeye bağlı; eski yayının veritabanı değiştirilmedi.

Mevcut özel `16mm-production-media` Blob deposu medya arşivi ve yüklemeler için kullanılmaya devam ediyor. Galerinin 3933 dosyası arşivden SHA-256 doğrulamasıyla hazırlandı. Sonradan eklenen Talking Head projesinin 114 WebP dosyası doğrudan dağıtıma dahil edildi. Logo, portre ve seçili ana sayfa görselleri hazır WebP dosyalarıyla yayınlandı.

Bulut erişim anahtarları Vercel ortam ayarlarında. `SITE_URL=https://16mm-production.vercel.app`. Yerel `.env.local` değiştirilmedi; geliştirme yerel SQLite ile devam ediyor. Kaynak görsel arşivleri dağıtıma dahil edilmez; bilgisayarda korunur. `.vercelignore`, hazır medya ile kaynak arşivlerini ayırır. Yeni kaynak klasörü eklenirse yayın arşivine veya doğrudan gönderilen galeri istisnalarına da eklenmelidir.

## Doğrulama

Üretim derlemesi ve TypeScript kontrolü başarılı; 51 sayfa üretildi. Ana sayfa, iletişim, kategori sayfaları, eski/yeni proje detayları, WebP dosyaları, robots ve sitemap HTTP 200 döndü. Canlı panelde mevcut şifreyle giriş başarılı; 31 proje ve güncel iletişim ayarları doğrulandı, kontrol oturumu kapatıldı. İletişim logosu şeritlerinde başlık ortalı, kontrol düğmesi yok, animasyon yönleri birbirine ters ve bütün logolar yükleniyor.

GitHub'a gönderim yapılmadı; eski `ozan-b-portfolio` dağıtımı değiştirilmedi.
