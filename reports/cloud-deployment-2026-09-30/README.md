# Kalıcı Vercel CMS geçişi

- 30 kaynak proje, 655 medya kaydı, 30 yayın geçmişi satırı, iletişim ayarları ve Argon2 yönetici şifresi Turso'ya taşındı. Her tablonun içeriği SQLite kaynağıyla karşılaştırıldı. Localhost oturumları taşınmadı; canlıda yeniden giriş yapılır.
- 9 yerel CMS testi başarılı: içerik izolasyonu, yayın/geri alma, WebP, orijinal koruma, oturum, şifre kuralları, URL koruma ve eşzamanlı düzenleme çakışması.
- TypeScript ve ESLint başarılı.
- `local-cloud-checks.json`: gerçek Turso + özel Blob üzerinde 10 uçtan uca kontrol. 4,5 MB üstü fotoğraf doğrudan multipart yüklendi, WebP'ye dönüştü; orijinal baytlar karşılaştırıldı. MP4, kısa H.264 önizleme, WebP kapak ve range/seek kontrol edildi. Test projeleri yayından kaldırıldı.
- Hazır galerinin 3.933 dosyası, 2.098 benzersiz nesneden oluşan 396.681.760 bayt özel yayın arşivinde SHA-256 ile korunur. Derleme aynı adları ve klasörleri geri oluşturur. Hero kopyaları kaynak yayın paketindedir.
- Bulut başlangıç kaynağı: mevcut Vercel projesi `ozan-b-portfolio`, hesap `ahmetagsakalli`, takım `guncel-yayin`. Turso Starter ve Blob Hobby; ücretli paket açılmadı.
