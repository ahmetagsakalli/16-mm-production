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
- Bu yerel kurulum kalıcı SQLite ve dosya depolaması kullanır. Vercel için aşağıdaki kalıcı bulut bağlantıları gereklidir; yalnızca statik export paneli çalıştırmaz.
- Hazır tüm WebP boyutları ve videolar dahildir. İlk kurulumda dosya tarihlerinin değişmesi nedeniyle medya hazırlama bir kez yeniden çalışabilir. Sonraki ziyaretlerde fotoğraflar yeniden kodlanmaz.
- `assets/gallery/local.json` eski Mac’in FFmpeg yolunu aynen korur; yeni cihazda `FFMPEG_PATH=ffmpeg` ile geçersiz kılın.
- `.env.local` isteğiniz doğrultusunda aynen dahildir. İçindeki eski Vercel OIDC oturumu 16 Eylül 2026’da sona ermiştir; yeni cihazda Vercel yetkisi sağlamaz. Gerekirse kendi hesabınızla yeniden giriş yapın. Mevcut `.vercel/` proje bağlantısı da korunmuştur.

## Hiçbir dosya atlanmadığının denetimi

`.transfer/manifest.json`, kaynak projedeki ve bağlı bağımlılık klasöründeki dosyaların SHA-256 özetlerini ve konumlarını listeler. `scripts/verify-transfer.py` ilk aktarım dosyalarını ve arşivlerin her üyesini bu listeyle karşılaştırır. Manifest ilk aktarımın kaydıdır; sonraki kod değişiklikleri doğal olarak farklı özet üretir. İlk aktarımı birebir denetlemek için ayrı bir checkout içinde `9d6b89b` sürümünü kullanın.

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

Git’te videoların büyük tek dosyaları yerine bu tam parçalar saklanır; geri oluşturulan MP4 kopyaları Git dışında tutulur. Orijinal dosyalardan hiçbir bayt atlanmamıştır. Elle çalıştırılan geri yükleme/doğrulama komutu mevcut farklı bir videonun üzerine yazmaz, durur. Normal `dev` / `build` mevcut videoları olduğu gibi korur; yalnızca eksik olanları arşivden tamamlar. Böylece sonraki medya güncellemeleri eski yedekle ezilmez. Taşıma öncesi medya hazırlama betiği de `.transfer/original-prepare-media.mjs` olarak saklanır.

## Vercel ve kalıcı bulut paneli (30 Eylül 2026)

Vercel projesi: `guncel-yayin / ozan-b-portfolio`. Yerel kullanımda SQLite ve yerel dosyalar çalışmaya devam eder. Vercel, ayrı `16mm-production-cms` Turso veritabanı ve özel `16mm-production-media` Blob deposunu kullanır. Proje, galeri sırası, taslak, yayın geçmişi, giriş ve şifre değişiklikleri Turso'da kalıcıdır.

Vercel ortam değişkenleri: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`; isteğe bağlı `SITE_URL`. Yeni bulut anahtarları Vercel ayarlarında tutulur. Başka bilgisayarda aynı Vercel hesabıyla `vercel link` ve `vercel env pull` kullanın. Yerel `.data/cms.sqlite` canlı bulut veritabanının otomatik güncel yedeği değildir; paneldeki içerik dışa aktarmayı ve sağlayıcı yedeklerini kullanın.

Yeni yüklemeler tarayıcıdan özel Blob deposuna gider. Fotoğraflar sunucuda orijinal korunarak WebP ve uyumlu boyutlara çevrilir. Bulutta video için MP4 veya WebM kullanın; MOV dosyasını MP4 dışa aktarın. Video orijinali korunur; sessiz kısa H.264 önizleme ve WebP kapak üretilir. Taslaklara sadece yönetici erişir. Yayından kaldırılan dosyanın yeni bağlantıları kapanır; daha önce verilmiş imzalı bağlantı en fazla 30 dakika daha geçerli kalır.

Hazır galerinin 3.933 dosyası `assets/gallery/deployment.json` manifestine göre özel depodaki SHA-256 doğrulamalı arşivden derleme sırasında aynı klasörlere açılır ve Vercel CDN'den servis edilir. Bu nedenle GitHub'ın private yapılması galerinin yayınını veya bu Vercel projesindeki yeni derlemeleri etkilemez. Orijinal klasör arşivi GitHub'da ayrıca korunur. Yeni yerel galeri aktarımında manifest ve özel yayın arşivi güncellenmelidir; panel yüklemeleri bu arşive ihtiyaç duymaz.

Turso Starter ve Vercel Hobby ücretsiz kotaları kullanılır; ücretli paket açılmadı. Yeni dosya eklerken sağlayıcı panelindeki depolama/kullanım kotasını takip edin. Boyut sınırları dosya başınadır; kalan hesap kotasını artırmaz. Üretime güncelleme: `vercel deploy --prod --skip-domain`, kontrol sonrası `vercel promote <deployment-url>`. Çalışan bulut veritabanının üzerine eski SQLite yedeğini aktarmayın; geçiş betiği dolu hedefe yazmayı reddeder.
