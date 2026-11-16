# Epic detayında işlem geri bildirimi ve canlı güncelleme

Kullanıcı (2026-11-16): Panelde bir Epic'e tıklayınca detay artık tam sayfa açılıyor (adım 206). Detay sayfasındaki düğmelere basınca bir işlem olup olmadığını anlamıyorum. Düğmeler: krokinin altındaki "Krokiyi onayla → Figma'da çiz" ve "Yorum"; KARAR bölümündeki "Çözümü onayla", "Reddet" ve "Yorum".

Sorunlar:
- Krokiye yorum yazıyorum ama "yeni kroki hazırlanıyor" gibi bir bilgi çıkmıyor. İsteğimin alındığını, üzerinde çalışıldığını ve ne zaman bittiğini göremiyorum.
- Kroki güncellenince sayfadaki görsel kendiliğinden yenilenmiyor; görmek için detayı kapatıp yeniden açmam gerekiyor.

Beklenen:
- Her düğmeye basınca hemen görünür bir durum: gönderildi → alındı → hazırlanıyor → hazır (ya da hata). Bu sırada düğmeye tekrar basılamaz.
- Kroki, çözüm ya da tartışma değişince açık sayfa kendini yeniler; yeni görsel ve metin kapatıp açmadan görünür, neyin değiştiği kısa bir işaretle belli olur.
- Not yazmanın zorunlu olduğu işlemlerde (Reddet, Yorum) not boşsa neden çalışmadığı söylenir.

Bağlam: panel `panel/index.html` (`epicDrawerAc`, drawer tıklama/submit işleyicileri), `panel/ciz.mjs` `epicDrawerHtml`, sunucu `panel/sunucu.mjs` (Epic karar uçları, SSE akışı), karar kuyruğu `karar-bekle.mjs` (Claude kararı alınca "alındı" yazılıyor). "Hazırlanıyor" ve "hazır" aşamalarını kimin, hangi sinyalle bildireceği tartışılmalı (Claude'un işi bitirdiği nasıl anlaşılır: commit, dosya değişimi, açık bildirim?).
