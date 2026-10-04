# 16mm Production — yerel tasarım, 2 Ekim 2026

Çalışma dizini: `/Users/ahmetagsakalli/Developer/ozan-portfolio-local`.
Önizleme: http://localhost:3000/ — yönetim: http://localhost:3000/admin
Bu çalışma GitHub'a gönderilmedi ve canlı yayına alınmadı.

## Tasarım

Ed Massery örneğindeki sabit sol menü ve fotoğraf odaklı yerleşim uygulandı. Ana sayfa yalnızca seçilmiş fotoğrafların otomatik geçişinden oluşur. Projeler kategori ızgarasında; ayrıntılarda kırpılmayan fotoğraf galerisi, oklar, klavye ve tam ekran görünümü bulunur. Mobil menü ve fotoğraf oranları ayrıca düzenlendi.

Müşterinin menü PDF'ine göre 10 çalışma alanı, Blog ve İletişim yerleştirildi. İletişim sayfasında gönderilen portre, güncel e-posta ve adres ile 28 referans logosu kullanıldı. Hakkında metni panelden yönetilebilir. Eski projelerin adresleri, yayın durumları, özgün dosyaları ve kayıt geçmişleri korundu.

## Kaynaklar ve medya

- İndirilenler'deki `web site 2027` ve `web site 2027 2`: 654 fotoğraf + 1 video. 655 dosyanın SHA-256 değerleri yerel özgün arşivle eşleşti.
- Yeni Talking Head arşivi: 19 fotoğraf. Böylece toplam 673 fotoğraf, 1 video, 31 proje.
- Logo, referanslar ve portre: `assets/client-2026-10-02/`. Özgün AI, PDF ve diğer dosyalar burada korunur; yalnızca görsel WebP çıktıları ziyaretçiye sunulur.
- WebP pipeline, panelden yeni yüklenen görsellerde de çalışır. Özgün dosyalar silinmez.
- Yeni kimlik ve seçili ana sayfa çıktıları: `node scripts/prepare-portfolio.mjs`. Bu adım build/optimize işlemine ve yerel galeri izleyicisine bağlandı.
- Ana sayfada panelden öne çıkarılan projeler görünür. Müşterinin dosya adıyla belirttiği ve kesin eşleşen fotoğraflar, bu projelerin kapağının yerine kullanılır.
- 13 özel ana sayfa seçiminin 2'si kesin bulundu; 10'u mevcut indirme arşivlerinde yok; 1 ad üç projede tekrarlanıyor. Ayrıntı: `icerik-bekleyenler.md`.

## Kontroller

Üretim derlemesi, TypeScript, ESLint, 4 görsel/galeri testi ve 9 panel testi başarılı. 673 fotoğrafın ve video çıktılarının tamamı doğrulandı; tüm WebP varyantları mevcut ve okunabilir. Masaüstü/mobil gezinme, galeri geçişi, tam ekran, panel girişi ve ayar kaydı tarayıcıda denendi. Mobilde yatay taşma ve kırık görsel yok.

Önceki yerel sürümün kaynak ve tutarlı SQLite yedeği: `/Users/ahmetagsakalli/Developer/ozan-local-backups/before-redesign-2026-10-02`.
