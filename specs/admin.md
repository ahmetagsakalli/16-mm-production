# 16mm Production yönetim paneli

Capilora panelinin Türkçe, proje kartlarıyla çalışan düzeni örnek alınmıştır. Capilora veritabanına, hesaplarına veya dosyalarına bağlanmaz.

## Kullanım

`./run.sh dev` ardından http://localhost:3000/admin. Yönetici şifresi terminalden ayarlandıktan sonra doğrudan giriş yapılır; sonradan menüdeki Şifre değiştir alanından güncellenir. Hesap henüz kurulmamış bir kurulumda ilk yerel girişte en az 12 karakterlik şifre belirlenir. İlk kurulum ekranı üretim ortamında kapalıdır. Üretimde kurulum veya şifre kurtarma için sunucuda etkileşimli `./run.sh admin:password` kullanılır; şifre ekranda gösterilmez.

- Genel bakış: proje, fotoğraf, film ve taslak sayıları.
- Projeler / Galeri: mevcut 30 albüm, arama ve kategori filtresi; her projenin kendi dosyaları.
- Düzenleyici: proje adı, bölümler, ana sayfa seçimi, kapak ve fotoğraf sırası. Teknik alanlar ve dekoratif etiketler gösterilmez. Yeni proje adresi ve arama açıklaması otomatik hazırlanır; yayınlanmış projelerin adresi başlık değişince korunur.
- Dosya ekle: çoklu seçim; dosyalar sırayla yüklenir. JPG/PNG/WebP/AVIF/TIFF/HEIC → WebP + 640/768/1280/1920/2560 türevler. Fotoğraf başına 128 MB; video başına 2 GB. Video FFmpeg ile MP4, sessiz önizleme ve WebP posterine dönüştürülür. FFmpeg yolu FFMPEG_PATH veya assets/gallery/local.json ile verilir. HEIC sunucuda libvips HEIF desteği gerektirir; macOS'ta sips kullanılır.
- Taslağı kaydet siteyi değiştirmez. Önizle kaydedilmiş taslağı gösterir. Yayınla yerel sitede içeriği günceller, yeniden derleme gerektirmez.
- Galeriden kaldır işlemi dosyayı silmez. Görsel geri eklenebilir. Çöp kutusundan alınan projeler taslak olarak döner. Yayın geçmişi eski sürümü taslağa geri getirir.
- Site ayarları: ana sayfa başlıkları ve iletişim bilgileri. Kaydet işlemi ayarları doğrudan yayınlar.
- İçerik yedeği: JSON içeriği, medya kayıtları ve yayın geçmişi. Medya dosyalarının kendisi veya şifre/oturumlar dışa aktarılmaz.

## Saklama ve dağıtım

Varsayılan veri dizini `.data/`; `CMS_DATA_DIR` mutlak yol ile değiştirilebilir. SQLite WAL veritabanı, özel orijinaller ve yeni WebP/MP4 dosyaları bu dizinde kalıcı saklanır. Başlangıçtaki 654 fotoğraf ve 1 video, gallery.json üzerinden mevcut dosyalarına referans verilerek alınır. `assets/gallery/originals` ve mevcut public/media/gallery dosyaları değiştirilmez.

Panelden eklenen dosyalar `.data/originals/<proje-id>/<dosya-id>/<orijinal-ad>` içinde korunur. Yayın dosyaları `.data/media/<dosya-id>` içinde tutulur. Yeni dosyaların taslak URL'leri oturum kontrolüyle sunulur. Var olan portfolyo dosyaları zaten public/media/gallery altında herkese açıktır.

Bu sürüm yerel çalışma ve kalıcı diski olan tek Node.js 24 VPS içindir. `.data` kalıcı disk birimiyle taşınmalı ve düzenli yedeklenmelidir. SQLite için çevrimiçi yedek API'si/CLI `.backup` kullanın veya uygulama kapalıyken .data dizinini birlikte yedekleyin. Orijinal arşiv ve mevcut public/media/gallery de tam yedeğe dahil edilmelidir. Yalnız JSON dışa aktarımı tam medya yedeği değildir.

Vercel'in geçici dosya sistemi bu saklama modeli için uygun değildir. Canlıya geçişte kalıcı veritabanı ve nesne depolama entegrasyonu ya da VPS gerekir. Bu çalışmada canlı siteye dağıtım yapılmamıştır.

Yeni yönetilen yüklemeleri panelden yapın. Eski import:gallery komutu arşivi ve manifesti korur; mevcut panel kayıtlarına yapılan değişiklikleri üzerine yazmaz. Yeni kaynak albümler uygulama yeniden başlatıldığında ilk kez tohumlanır. Mevcut albümlere arşivden eklenen yeni dosyalar yeniden başlatmada taslağa eklenir; başlık, kapak, sıra ve yayınlanmış içerik değiştirilmez. Bu eklemeler panelden yayınlanır.

## Güvenlik ve doğrulama

Argon2id şifre özeti; 8 saatlik HttpOnly/SameSite=Strict oturum; üretimde Secure çerez; yalnız SHA256 oturum özeti veritabanında. Girişte 15 dakikada 5 deneme sınırı. Yazma ve dosya yükleme uçlarında oturum ve aynı origin kontrolü. Zod alan doğrulama, dosya uzantısı + gerçek görsel çözümleme, boyut sınırı, parametreli SQL, iyimser sürüm kontrolü. Dosyalar birer birer işlenir; Sharp ve FFmpeg iş parçacıkları sınırlıdır. Yönetim sayfaları noindex ve önbelleksizdir.

`./run.sh test:admin` içerik koruma, taslak/yayın ayrımı, çakışma, geçmiş/çöp kutusu, gerçek WebP dönüşümü/orijinal bütünlüğü, tehlikeli yükleme reddi, Argon2/oturum/sınırlandırma ve ayar doğrulamasını yalıtılmış geçici veri dizininde test eder.

HTTPS ters proxy arkasında CMS_ORIGIN gerçek origin olarak ayarlanmalı (ör. https://16mm.example). İstek kaynağı doğrulaması güvenilmeyen x-forwarded-host/proto başlıklarını kullanmaz.
