# 4 Ekim 2026 tam proje aktarımı

## Kaynak ve içerik

Paketin kaynağı güncel `ozan-portfolio-local` çalışma dizinidir; eski GitHub kopyası değildir. Aktarım hedefi `ahmetagsakalli/16-mm-production` deposudur. Canlı site değiştirilmemiştir.

5.130 kaynak dosyası `.transfer/source-manifest.json` içinde SHA-256 ile kayıtlıdır. `public/` altında 4.099 dosya vardır (687.063.724 bayt). Galeri klasör adları ve özgün dosyalar korunmuştur. Boş kaynak klasörler manifestte tutulur; `verify-transfer.py --restore-empty-directories` bunları oluşturur.

Canlı panelden alınan `.transfer/live-content.json` şu içerikleri kapsar:

| İçerik | Adet |
| --- | ---: |
| Proje | 31 |
| Medya | 674 (673 fotoğraf, 1 video) |
| Proje yayın revizyonu | 52 |
| Blog yazısı | 5 |
| Açılış fotoğrafı | 4 |
| Seçilmiş proje | 0 |

Son satır özellikle korunmuştur: kullanıcının canlıda son kaydettiği seçim boştur; daha eski 12 proje seçimi geri getirilmemiştir. Kopyanın zamanı JSON dosyasındaki `exportedAt` alanındadır.

`.transfer/live-cms.sqlite` ve `.data/cms.sqlite` bu canlı içeriklerin, sürümlerin, taslakların, yayınların ve yönetici parola kaydının bağımsız VPS kopyasıdır. Tüm kayıtlı medya yerel arşivde bulunmaktadır; canlıda özel bulut yüklemesi bulunmamaktadır. VPS için bulut hesap anahtarı gerekmez. Panel şifresi açık olarak [ADMIN-GIRIS.md](ADMIN-GIRIS.md) içindedir ve Argon2 kaydıyla doğrulanmıştır.

Canlı dışa aktarım içerik yedeğidir; Turso'nun ham sistem/veritabanı yedeği olduğu iddia edilmez. Sunucu oturumları, başarısız giriş sayaçları ve geçici iş kilitleri yeni VPS'e aktif olarak taşınmaz. Canlı dışa aktarımda yer almayan denetim olayları aktarılmış gibi gösterilmez. Ayarların içerikleri aynıdır; VPS kopyasının ayar revizyon sayacı 1'den başlar. Projelerin, ana sayfanın ve blogların sürüm sayaçları korunur. Eski URL'ler yayın revizyonlarından kontrol edilmiştir; bu kopyada ek yönlendirme yoktur.

Yerel DB'nin ayrıca tutarlı bir kopyası `.transfer/local-cms-consistent.sqlite`, yerel `.data` dosyalarının ham kopyası `.transfer/local-data-original/` altındadır. Böylece eski yerel veri ve yedekleri de kaybolmaz. Çalıştırılacak güncel kopya `live-cms.sqlite` dosyasıdır.

## Çalışma dosyaları

- Tüm `src`, `public`, `assets`, `scripts`, `tests`, `reports`, `specs` ve proje yapılandırmaları bulunur.
- Kurulum için güncellenen README, KURULUM, package.json ve ignore/env örneğinin özgünleri `.transfer/source-files/` altında saklanır.
- Mevcut `.next` klasörü 837 dosyalık `.transfer/runtime/next-local-macos.tar.gz` arşivindedir.
- Mevcut node_modules içeriği 23.989 dosya/bağlantılık `.transfer/runtime/node-modules-macos-arm64.tar.gz` arşivindedir. Linux'ta bu Mac arşivi yerine kilit dosyasıyla yeniden kurulum yapılır.
- İki büyük MP4 dosyası `.transfer/media-parts/` altında kayıpsız parçalara ayrılmıştır. `restore-transfer.mjs` tam dosyayı aynı SHA-256 ile geri kurar. `build:vps` bunu otomatik yapar.
- Kaynak `.env.local` dosyasının tamamı, talep doğrultusunda `.transfer/source-files/.env.local` içinde aynen korunmuştur. İçindeki Vercel OIDC oturumunun 16 Eylül 2026 22:27:35 UTC tarihinde sona erdiği doğrulanmıştır. Bu eski dosya kurulumda kullanılmaz; VPS için `.env.example` kopyalanıp düzenlenir. Uygulama giriş bilgileri ayrıca ADMIN-GIRIS.md içindedir.

## Doğrulama

- Kaynak dosyalar ve iki çalışma arşivi SHA-256 ile doğrulandı.
- Yayındaki 4.099 statik dosyanın tamamı doğrulandı.
- SQLite integrity_check ve foreign_key_check geçti.
- Yönetici şifresi paketteki Argon2 kaydıyla eşleşti.
- `pnpm install --frozen-lockfile` temiz bağımlılık klasöründe geçti.
- `pnpm build:vps` üretim derlemesi ve TypeScript kontrolü geçti; 56 sayfa üretildi.

Ek test ve uzaktan aktarım sonuçları `reports/github-vps-transfer-2026-10-04.md` dosyasına kaydedilir.
