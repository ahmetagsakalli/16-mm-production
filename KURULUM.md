# Bağımsız VPS kurulumu

## 1. Depoyu eksiksiz indirme

VPS üzerinde Node.js **24.x**, pnpm **11.19.0**, Git, **Git LFS**, FFmpeg ve Python 3 kurulu olmalı. Debian/Ubuntu'da dağıtım paketlerinden `git-lfs ffmpeg python3` kurabilirsiniz. Node ve pnpm sürümlerini `node -v` / `pnpm -v` ile kontrol edin.

```bash
git lfs install
git clone https://github.com/ahmetagsakalli/16-mm-production.git
cd 16-mm-production
git lfs pull
pnpm install --frozen-lockfile
node scripts/restore-transfer.mjs
python3 scripts/verify-transfer.py --restore-empty-directories
```

Fork kullanıyorsanız GitHub adresini kendi deponuzla değiştirin. GitHub ZIP indirmesi yerine Git LFS ile klonlayın; LFS pointer dosyaları fotoğraf değildir. Git LFS kotanız tüm büyük dosyaları indirmeye elverişli olmalıdır. Video parçaları SHA-256 doğrulamasıyla birleştirilir; mevcut farklı bir dosyanın üstüne yazılmaz.

`.transfer/runtime` içindeki node_modules ve .next arşivleri mevcut Mac çalışma ortamının kopyalarıdır. Bunları Linux'ta çalıştırmaya çalışmayın. Linux'ta bağımlılıklar `pnpm install` ile kurulur ve uygulama yeniden derlenir.

## 2. Kalıcı veri ve alan adı

Proje örnek konumu: `/opt/16mm-production`. Linux uygulama kullanıcısı: `16mm`. Ayrı, yönetici olmayan bir kullanıcı oluşturup proje dizinini ve veri dizinini bu kullanıcıya verin. Örnek:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin 16mm
sudo mkdir -p /var/lib/16mm-production/cms
sudo chown -R 16mm:16mm /opt/16mm-production /var/lib/16mm-production
```

Proje dizininde `.env.example` dosyasını `.env.local` olarak kopyalayıp şu değerleri düzenleyin:

```dotenv
SITE_URL=https://alan-adiniz.com
CMS_ORIGIN=https://alan-adiniz.com
CMS_DATA_DIR=/var/lib/16mm-production/cms
FFMPEG_PATH=/usr/bin/ffmpeg
```

`SITE_URL` ve `CMS_ORIGIN` aynı gerçek HTTPS adresi olmalı, sonunda `/` olmamalı. `which ffmpeg` sonucunu kullanın. Cloud değişkenlerini (`VERCEL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`) VPS'te tanımlamayın.

Uygulama kullanıcısıyla çalıştırın:

```bash
pnpm setup:vps
pnpm build:vps
pnpm start
```

- `setup:vps`: veri dizini boşsa canlı içerik kopyasını kurar. Veritabanı varsa dokunmaz.
- `build:vps`: tüm hazır yayın dosyalarını doğrular, var olan WebP'leri kullanır ve derler. Yüzlerce özgün görseli gereksiz yere tekrar dönüştürmez.
- `start`: yalnızca `127.0.0.1:3000` üzerinde dinler. Dış erişimi HTTPS reverse proxy sağlar.

Panel: `/admin`. Giriş şifresi [ADMIN-GIRIS.md](ADMIN-GIRIS.md) dosyasındadır. Parola kaydı kurulmuş durumdadır; ilk kurulum formu gerekmez.

## 3. HTTPS ve sürekli çalışma

`deploy/16mm.service` dosyasındaki `WorkingDirectory`, kullanıcı ve Node yolunu gerçek sunucunuza göre ayarlayın (`which node`). Systemd örneği:

```bash
sudo cp deploy/16mm.service /etc/systemd/system/16mm.service
sudo systemctl daemon-reload
sudo systemctl enable --now 16mm
sudo systemctl status 16mm
curl -I http://127.0.0.1:3000/
```

Caddy kullanıyorsanız `deploy/Caddyfile` içindeki `example.com` değerini alan adınızla değiştirin. DNS A/AAAA kayıtlarını VPS'e yönlendirin ve 80/443 portlarını açın. Mevcut Caddy yapılandırmanız varsa yeni site bloğunu ona ekleyin; diğer sitelerin ayarlarını silmeyin. Caddy HTTPS sertifikasını yönetir ve istekleri 127.0.0.1:3000'e aktarır.

Nginx kullanıyorsanız HTTPS sertifikasıyla birlikte Host/X-Forwarded-Proto başlıklarını aktarın, admin/API yanıtlarını önbelleğe almayın. Video yüklemeleri için body limitini 2 GB, okuma süresini uzun videolara uygun ayarlayın. `CMS_ORIGIN` doğru olmalı; aksi takdirde panelin yazma istekleri kaynak denetiminden geçmez.

Admin oturum çerezi üretimde HTTPS gerektirir. Paneli gerçek HTTPS alan adından açın. Ters proxy yalnızca Next.js'e yönlendirmeli; proje kökünü statik dosya dizini olarak dışarı açmayın.

## 4. Veriler, güncelleme ve yedek

Kalıcı `CMS_DATA_DIR` altında veritabanı (`cms.sqlite`), yeni yüklenen özgünler (`originals/`) ve WebP/video çıktıları (`media/`) bulunur. Bunlar uygulama kullanıcısı tarafından yazılabilir olmalıdır. Bu dizini silmeyin, sürüm güncellemesinde depo kopyasıyla değiştirmeyin. Mevcut `public/media` yayın arşivi de uygulamayla birlikte tutulmalıdır.

Yedek alırken uygulamayı durdurup CMS dizininin tamamını kopyalamak en kolay tutarlı yöntemdir:

```bash
sudo systemctl stop 16mm
sudo tar -czf /root/16mm-cms-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/lib/16mm-production cms
sudo systemctl start 16mm
```

Güncelleme: mevcut commit numarasını not edin, CMS yedeği alın, Git değişikliklerini inceleyin, `git pull --ff-only`, `git lfs pull`, `pnpm install --frozen-lockfile`, `pnpm build:vps` ve servis yeniden başlatma adımlarını uygulayın. Aktif sitede build klasörünü değiştirirken servisi durdurun veya ayrı sürüm dizininde derleyip ardından servisi ona geçirin. Kalıcı veri dizini aynı kalsın.

Geri dönüş: önceki kaynak sürümünü ayrı dizinde kurup derleyin, servisin `WorkingDirectory` değerini o dizine yönlendirin. CMS verilerini eski depo kopyasıyla ezmeyin. Bir veri geri dönüşü de gerekiyorsa önce mevcut veriyi ayrıca yedekleyip, yalnızca bilinçli olarak seçilmiş CMS yedeğini geri yükleyin.

## 5. Kontrol

- Ana sayfa, kategori, proje detayı, blog ve iletişim açılıyor mu?
- `/admin` girişinden sonra proje kapakları, 4 açılış fotoğrafı ve 5 blog yazısı doğru mu?
- Deneme amaçlı yeni taslak proje ve görsel yüklemesi çalışıyor mu? Fotoğraf WebP olur; taslak yayımlanmadan herkese açılmaz.
- Panelden değiştirdiğiniz veri servis yeniden başlatıldıktan sonra korunuyor mu?

Mevcut otomatik kontroller: `pnpm lint`, `pnpm typecheck`, `pnpm test:admin`, `pnpm test:images`, `pnpm test:gallery`. Bu paketin test sonuçları [AKTARIM.md](AKTARIM.md) içinde yer alır.
