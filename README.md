# 16mm Production

Mimari fotoğraf ve film portfolyosu. Next.js 16, React 19, TypeScript; Türkçe site ve proje yönetim paneli.

## Başka cihazda açma

Node.js 24, pnpm 11.19.0, Git LFS ve FFmpeg kurun:

```sh
git lfs install
git clone https://github.com/ahmetagsakalli/16-mm-production.git
cd 16-mm-production
git lfs pull
node scripts/restore-transfer.mjs
python3 scripts/verify-transfer.py --restore-empty-directories
pnpm install --frozen-lockfile
FFMPEG_PATH=ffmpeg pnpm dev
```

Site: http://localhost:3000 — Yönetim: http://localhost:3000/admin

**Mevcut giriş şifresi, Windows adımları ve canlı sunucu kurulumu: [KURULUM.md](KURULUM.md)**

## Aktarımın içeriği

- Kaynak kod, bütün proje klasörleri, orijinal fotoğraf/video arşivi, hazır WebP/MP4 sürümleri.
- 30 projenin mevcut yönetim verileri, iletişim bilgileri ve giriş şifresi kaydı.
- `.env.local`, `.vercel/`, yerel yapılandırmalar, testler ve ölçüm raporları.
- `.transfer/` içinde bağımlılıkların tamamı, yerel `.next/` çıktıları ve orijinal SQLite/WAL/SHM dosyaları.
- Kaynak projede veya bağlı bağımlılık klasöründe bulunan 27.669 dosya/bağlantı kaydının SHA-256 doğrulama listesi.

Hiçbir kaynak dosya atlanmamıştır. 667 orijinal galeri dosyası ve siteye servis edilen 3.938 medya dosyası dahildir. Ağır dosyalar Git LFS ile saklanır; ZIP yerine yukarıdaki klonlama adımlarını kullanın. Bağımlılık ve derleme arşivleri tam yedek içindir; yeni cihazda bağımlılıkları kurup yeniden derleyin.

Aktarım öncesi README ve Git ignore kuralları da `.transfer/original-readme.md` ve `.transfer/original.gitignore` olarak korunur. Önceki teknik açıklamalar için [orijinal README](.transfer/original-readme.md), en güncel taşınabilir kurulum için [KURULUM.md](KURULUM.md) geçerlidir.

İki büyük video, kayıpsız aktarım parçaları olarak dahildir; yukarıdaki geri yükleme komutu ve `dev` / `build` bunları aynı dosya adı ve klasörlerine otomatik birleştirir. Her parçanın ve son dosyanın SHA-256 özeti kontrol edilir.
