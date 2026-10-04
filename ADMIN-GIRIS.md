# Yönetim paneli

- Adres: `https://ALAN-ADINIZ/admin`
- Şifre: `Mimarifotograf55*`
- Kullanıcı adı/e-posta istenmez; yalnızca şifre kullanılır.

Bu şifre, talep doğrultusunda aktarım paketine açık olarak eklendi. Aynı şifreyle canlı panelden alınan içerik kopyası ve Argon2 şifre kaydı pakette bulunur.

Panelde **Şifre değiştir** bölümünden değiştirilebilir. Terminalden kurtarmak için proje dizininde `pnpm admin:password` çalıştırılır; `.env.local` içindeki `CMS_DATA_DIR` kullanılır.

VPS'in çalışması için GitHub, Vercel veya Turso hesabına ait bir erişim anahtarı gerekmez. VPS kendi SQLite veritabanını ve yerel medya dosyalarını kullanır.
