# 16mm Production

Güncel site, yönetim paneli, özgün medya arşivi ve 4 Ekim 2026 canlı içerik kopyası. Bu depo başka bir hesaba fork edilip bağımsız VPS üzerinde çalıştırılabilir.

**Başlangıç:** [KURULUM.md](KURULUM.md) · **Panel şifresi:** [ADMIN-GIRIS.md](ADMIN-GIRIS.md) · **Aktarım kapsamı:** [AKTARIM.md](AKTARIM.md)

## Gereksinimler

Node.js 24, pnpm 11.19.0, Git LFS; video yüklemeleri için FFmpeg. Üretimde HTTPS ve kalıcı disk kullanılır.

```bash
git lfs install
git clone https://github.com/ahmetagsakalli/16-mm-production.git
cd 16-mm-production
git lfs pull
pnpm install --frozen-lockfile
cp .env.example .env.local
# .env.local: alan adı, CMS_ORIGIN, kalıcı CMS_DATA_DIR ve FFMPEG_PATH değerlerini düzenleyin.
pnpm setup:vps
pnpm build:vps
pnpm start
```

Fork ettiğinizde clone adresini kendi hesabınızla değiştirin. Kaynak ZIP indirmek yerine Git LFS ile klonlayın: büyük görseller ve videolar Git LFS içinde tutulur. İki büyük video kayıpsız parçalardan otomatik birleştirilir.

## Dahil olanlar

- Sol menülü güncel Türkçe tasarım, mobil ana sayfa, otomatik slayt, proje galerileri ve büyütme görünümü.
- Proje yönetimi, kapak fotoğrafı seçimi, ana sayfa fotoğraf/sıra seçimi, blog düzenleme, site ayarları ve şifre değiştirme.
- 31 proje, 674 medya kaydı (673 fotoğraf + 1 video), 52 proje revizyonu, 5 blog yazısı ve son ana sayfa seçimleri.
- Özgün görseller, videolar, logolar, optimize WebP boyutları, raporlar, testler ve mevcut yerel çalışma arşivleri.
- Son canlı içerikten hazırlanmış SQLite kopyası: Vercel, Turso veya Blob hesabı olmadan çalışır.

Mevcut canlı Vercel kurulumunun kaynak kodu korunmuştur. VPS için `build:vps`, Vercel için mevcut `build` akışı kullanılır. VPS kurulumu canlı Vercel veritabanına bağlanmaz ve onu değiştirmez.

Yeni panel yüklemeleri otomatik WebP'ye dönüştürülür; özgünleri kalıcı CMS dizininde saklanır. Üretimde veritabanı ve yüklemeleri Git klasörü dışındaki `CMS_DATA_DIR` altında tutun. `setup:vps` mevcut veritabanını asla değiştirmez.
