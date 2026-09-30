# Başka cihazda kurulum — 16mm Production

Bu aktarım kaynak kodu, bütün orijinal fotoğraf/video klasörlerini, hazır WebP/MP4 dosyalarını, yönetim panelinin veritabanını, mevcut şifreyi, yerel ayarları ve raporları içerir. Dosya atlanmaması için bu Mac’in bağımlılıkları ve derleme çıktıları da `.transfer/` içinde arşivlenmiştir. Önceki README içindeki “Git dışında tutulur” açıklaması bu tam aktarım için geçerli değildir.

## İndirme

Node.js **24**, pnpm **11.19.0**, Git ve Git LFS kurulu olmalıdır. İlk medya hazırlığı ve sonraki video yüklemeleri için FFmpeg de kurun.

```sh
git lfs install
git clone https://github.com/ahmetagsakalli/16-mm-production.git
cd 16-mm-production
git lfs pull
node scripts/restore-transfer.mjs
python3 scripts/verify-transfer.py
pnpm install --frozen-lockfile
```

GitHub’ın normal ZIP indirmesi yerine bu komutları kullanın. Orijinal medya, hazır medya, veritabanı ve yedek arşivler Git LFS ile saklanır. `.gitattributes` LFS kurallarını içerir.

Arşivdeki boş kaynak klasörlerini de geri oluşturmak için:

```sh
python3 scripts/verify-transfer.py --restore-empty-directories
```

## Yönetim paneli

Adres: `/admin`

Mevcut giriş şifresi: `Mimarifotograf55*`

Bu şifre `.data/cms.sqlite` içindeki Argon2 kaydıyla doğrulanmıştır; yeniden hesap oluşturmak gerekmez. Veritabanında projeler, sıralamalar, kapaklar, iletişim bilgileri, taslaklar ve mevcut bütün tablolar korunmuştur. SQLite backup API ile çalışan veritabanının tutarlı kopyası alınmış, her tablonun bütün satırları kaynakla karşılaştırılmıştır. Orijinal DB/WAL/SHM dosyaları ayrıca `.transfer/database-original.tar.gz` içindedir.

## Yerelde açma

```sh
FFMPEG_PATH=ffmpeg pnpm dev
```

http://localhost:3000 adresini açın. Windows PowerShell’de önce `$env:FFMPEG_PATH = 'ffmpeg'`, ardından `pnpm dev` çalıştırın. FFmpeg PATH içinde bulunmalıdır.

## Sunucuda çalıştırma

`.env.production` oluşturun; aşağıdaki örnek alan adını kendi gerçek HTTPS alan adınızla değiştirin:

```dotenv
SITE_URL=https://alan-adiniz.com
CMS_ORIGIN=https://alan-adiniz.com
FFMPEG_PATH=ffmpeg
```

```sh
FFMPEG_PATH=ffmpeg pnpm build
pnpm start --port 3000
```

Uygulama `127.0.0.1:3000` üzerinde çalışır. Önüne HTTPS sağlayan Nginx/Caddy gibi bir ters vekil koyun; Host ve Origin gerçek alan adıyla eşleşmelidir. Üretimde yönetici oturum çerezi HTTPS gerektirir.

- Node.js süreci sürekli çalışmalı; `.data/`, `assets/gallery/` ve `public/media/` yazılabilir, kalıcı disk üzerinde olmalıdır. Paneldeki yeni fotoğraflar ve videolar bu alanlara yazılır.
- Yeni sürüm yüklerken canlı `.data/`, `assets/gallery/originals/` ve `public/media/` klasörlerini depodaki eski kopyalarla ezmeyin. Canlı verinin ayrıca yedeğini alın.
- Bu panel kalıcı SQLite ve dosya depolaması kullanır; yalnızca statik export veya geçici dosya sistemli serverless yayın, panel verilerini kalıcı tutmaz.
- Hazır tüm WebP boyutları ve videolar dahildir. İlk kurulumda dosya tarihlerinin değişmesi nedeniyle medya hazırlama bir kez yeniden çalışabilir. Sonraki ziyaretlerde fotoğraflar yeniden kodlanmaz.
- `assets/gallery/local.json` eski Mac’in FFmpeg yolunu aynen korur; yeni cihazda `FFMPEG_PATH=ffmpeg` ile geçersiz kılın.
- `.env.local` isteğiniz doğrultusunda aynen dahildir. İçindeki eski Vercel OIDC oturumu 16 Eylül 2026’da sona ermiştir; yeni cihazda Vercel yetkisi sağlamaz. Gerekirse kendi hesabınızla yeniden giriş yapın. Mevcut `.vercel/` proje bağlantısı da korunmuştur.

## Hiçbir dosya atlanmadığının denetimi

`.transfer/manifest.json`, kaynak projedeki ve bağlı bağımlılık klasöründeki dosyaların SHA-256 özetlerini ve konumlarını listeler. `scripts/verify-transfer.py` depo dosyalarını ve arşivlerin her üyesini bu listeyle karşılaştırır.

- `assets/gallery/originals/`: orijinal klasörler ve dosyalar.
- `public/media/`: siteye servis edilen tüm WebP/MP4 sürümleri ve yüksek kaliteli hero kopyaları.
- `.data/cms.sqlite`: bütün panel verilerinin çalıştırılabilir tutarlı kopyası.
- `.transfer/database-original.tar.gz`: kaynak `.data/` dosyalarının ham kopyası.
- `.transfer/next-build-local.tar.gz`: bu Mac’teki `.next/` derleme ve geliştirme dosyaları.
- `.transfer/node-modules-macos-arm64.tar.gz`: orijinal `node_modules` bağlantısının işaret ettiği bağımlılıkların bütün gerçek dosyaları ve iç bağlantıları.

`.transfer/` arşivlerini çalıştırmak için açmanız gerekmez; tam dosya aktarımı amacıyla saklanır. Başka işletim sisteminde `pnpm install` ve `pnpm build` kullanın. Yedeği incelemek için ayrı boş bir klasörde `tar -xzf /tam/yol/arsiv.tar.gz` çalıştırılabilir; çalışan uygulamanın üzerine açmayın. Ana `node_modules` bağlantısının eski mutlak hedefi manifestte kayıtlıdır; yeni cihazda bozuk bir bağlantı oluşturulmaz.

## Doğrulama

```sh
pnpm lint
pnpm typecheck
pnpm test:admin
pnpm verify:gallery
```

En son Lighthouse ölçümü: mobil ana sayfa 94, masaüstü 100; SEO 100. Raporlar `reports/performance-2026-09-30/` içindedir. Canlı sunucuda puan yeniden ölçülmelidir.

## Büyük videoların eksiksiz aktarımı

741 MB orijinal film ve 155 MB web filmi, bağlantıdaki tek dosya yükleme yavaşlığını aşmak için 32 MiB parçalara ayrılmıştır. Yeniden kodlama veya kalite kaybı yoktur. Bütün parçalar `.transfer/media-parts/`, dosya sırası ve SHA-256 özetleri `.transfer/media-parts.json` içindedir. `node scripts/restore-transfer.mjs` her parçayı ve birleşmiş dosyayı doğrulayıp videoları aynı ad ve aynı kaynak/site klasörlerine atomik olarak geri koyar. `dev` ve `build` de bu adımı otomatik çalıştırır.

Git’te videoların büyük tek dosyaları yerine bu tam parçalar saklanır; geri oluşturulan MP4 kopyaları Git dışında tutulur. Orijinal dosyalardan hiçbir bayt atlanmamıştır. Video dosyalarından biri kurulumdan sonra farklı içerikle değiştirilmişse yeniden birleştirme üzerine yazmaz, durur. Taşıma öncesi medya hazırlama betiği de `.transfer/original-prepare-media.mjs` olarak saklanır.
