# GitHub / VPS aktarımı — 4 Ekim 2026

Güncel kaynak: `ozan-portfolio-local`. Canlı içerik `/api/admin/export` üzerinden mevcut yönetici hesabıyla okundu; okuma oturumu kapatıldı. Canlıya içerik yazılmadı ve Vercel yayını değiştirilmedi.

## Doğrulamalar

- 5.129 kaynak dosyası SHA-256 doğrulaması: geçti.
- Mevcut .next ve node_modules çalışma arşivleri: geçti.
- 4.099 public dosyası SHA-256 doğrulaması: geçti.
- SQLite integrity_check ve foreign_key_check: geçti.
- Pakette belgelenen admin şifresi / Argon2 eşleşmesi: geçti.
- Temiz `pnpm install --frozen-lockfile`: geçti (388 paket).
- `pnpm lint`: geçti.
- `pnpm build:vps`: geçti, TypeScript başarılı, 56 sayfa üretildi.
- `pnpm test:admin`: 19 test geçti.
- `pnpm test:images`: 2 test geçti.
- `pnpm test:gallery`: 2 test geçti.
- VPS kurulumu ikinci çalıştırmada mevcut veritabanını korudu.
- Üretim sunucusu HTTP kontrolü: ana sayfa, iletişim, mimari, blog ve admin 200.
- Üretim sunucusunda admin girişi: başarılı.
- Yeni sunucunun içerik dışa aktarımı ile canlı kopya karşılaştırması: tüm proje/taslak/yayın/medya, revizyon, blog, ayar ve ana sayfa kayıtları eşit.
- 676 medya adresinin tamamı HTTP 200.

Testler ayrı `/tmp/16mm-vps-transfer-test-2026-10-04` veri dizininde çalıştırıldı; dağıtımdaki başlangıç SQLite kopyası değiştirilmedi. Uygulama kontrolleri macOS üzerinde Node.js 24 ile yapıldı. Gerçek Linux VPS kurulumu henüz yapılmadı; Linux servis ve reverse proxy örnekleri KURULUM.md'dedir.

GitHub LFS doğrulaması tamamlandı: 2.983 benzersiz nesnenin tamamı indirilebilir (3.412.566.135 bayt), eksik nesne yok. Özgün fotoğraf, logo, galeri WebP, ana sayfa WebP, canlı SQLite ve video parçası GitHub üzerinden indirilip SHA-256 ile doğrulandı. Ayrıntılar `github-lfs-verification.json` dosyasındadır. `git lfs fsck` geçti; normal Git tarafında 100 MB üstü blob bulunmuyor.
