# Galeri ve iletişim düzenlemesi — 4 Ekim 2026

Yerel kaynak: `/Users/ahmetagsakalli/Developer/ozan-portfolio-local`.
Bu turda Vercel yayını veya GitHub aktarımı yapılmadı.

## Değişiklikler

- Kamuya açık sayfalarda serif yazılar kaldırıldı; yerel Manrope fontunun ince ağırlıkları kullanıldı.
- Ürün, Aydınlatma, Yemek Fotoğrafçılığı, Fuar / Organizasyon ve Talking Head menüleri doğrudan üç sütunlu kare fotoğraf galerisi açıyor. Fotoğraflar tıklanınca kırpılmadan tam ekran açılıyor; oklar, klavye ve dokunmatik kaydırma destekleniyor.
- Aynı kategorilerin mevcut proje bağlantıları da kare galeri kullanıyor. Mimari gibi gruplu kategorilerin proje kartları ve proje içi galerileri korunuyor.
- Fuar ve Organizasyon menü ve yönetim paneli seçeneklerinde birleştirildi. Eski `events` kayıtları okunabiliyor; `/portfolio/events` kalıcı 308 yönlendirmesiyle `/portfolio/exhibitions` adresine gidiyor. Dosyalar veya veritabanı kayıtları değiştirilmedi.
- Sol menüde ve mobil ana sayfada “Projenizden bahsedin” bağlantısı eklendi. İletişimde ad ve proje açıklaması isteyen form, metni mevcut işletme numarasının WhatsApp sohbetine taşıyor; otomatik mesaj göndermiyor ve form verisini sunucuda saklamıyor.
- Yönetimdeki iletişim adresinden Google Haritalar görünümü ve yol tarifi bağlantısı oluşturuldu.

## Kontroller

- ESLint: değişen TypeScript/TSX dosyalarında hata yok.
- TypeScript ve üretim derlemesi: başarılı; 51 sayfa üretildi.
- Doğrudan galeriler: Ürün 104, Aydınlatma 76, Yemek 85, Fuar 37, Talking Head 19 fotoğraf. Fuar videosu korunuyor.
- Eski Ürün proje bağlantısı: 104 kare fotoğraf, küçük resim şeridi yok.
- Mimari: 11 proje kartı; Emaar detayında mevcut küçük resim şeridi korunuyor.
- Chrome 1680×836 ve 390×844: taşma yok, kare düzen doğru. Mobil tam ekran, sağ/sol gezinme, Escape ile kapatma ve önceki butona odak dönüşü doğrulandı.
- Formun hedefi, geçerli alanları ve WhatsApp metin hazırlığı doğrulandı. Test mesajı gönderilmedi.
- Harita tarayıcıda Vadipark Seyrantepe çevresini gösterdi. Ana sayfa ve sol menü teklif bağlantıları form bölümüne ulaşıyor.
- Tarayıcıda hata/uyarı kaydı yok. Geçici mobil ekran ölçüsü test sonunda sıfırlandı.

## Görseller

- `square-gallery-desktop-2026-10-04.jpg`
- `square-gallery-mobile-2026-10-04.jpg`
- `contact-inquiry-map-2026-10-04.jpg`
- `contact-inquiry-mobile-2026-10-04.jpg`
