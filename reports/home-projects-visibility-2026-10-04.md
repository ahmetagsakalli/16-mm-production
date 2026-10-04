# Ana sayfa proje görünürlüğü — 4 Ekim 2026

Sebep: Kaydedilen 12 proje canlı HTML içinde vardı, ancak Seçilmiş projeler bölümü masaüstünde CSS ile gizleniyordu. Kaydetme veya önbellek sorunu yoktu.

Düzeltme: Bölüm masaüstünde 3, orta genişlikte 2, telefonda 1 sütun gösterir. Var olan mobil fotoğraf oranları ve slayt korunur. Panelde açılış fotoğrafları ve proje kartlarının ayrı seçimler olduğu açıklanır.

Kontroller: ESLint ve TypeScript başarılı. Vercel üretim derlemesi 56 sayfayla başarılı. Yerel masaüstü 3 sütun ve mobil 390px tek sütun/taşma yok kontrolü yapıldı. Canlı tarayıcıda 12 kart, display:block ve 3 sütun doğrulandı. Projelerin sırası önceki kayıtla aynı.

Canlı dışa aktarımlar karşılaştırıldı: settings, projects, revisions, homepage, blog aynı. Yeni içerik kurulumu already initialized sonucu verdi; kullanıcının son ana sayfa seçimi (version 2, 12 proje) korundu. Geçici API doğrulama oturumu kapatıldı.

Canlı: https://16mm-production.vercel.app/#home-projects-title
Deployment: dpl_HTPu2zDCmU5pyiUsjvgYWne75yq3
Artifact: https://16mm-production-nyv4ycqg2-guncel-yayin.vercel.app
Önceki deployment: dpl_4hcqGzTdfhdS1VErKvQB5NDNMgJc
Özel yedekler: .data/backups/home-visibility-2026-10-04/
Ekran görüntüsü: home-projects-live-2026-10-04.png
