# Epic detayında işlem geri bildirimi ve canlı güncelleme

Kullanıcı (2026-11-16): Epic detay sayfasındaki düğmelere ("Krokiyi onayla → Figma'da çiz", krokinin altındaki "Yorum", KARAR bölümündeki "Çözümü onayla", "Reddet", "Yorum") bastığımda bir işlem olup olmadığını anlamıyorum.

Sorunlar:
- Krokiye yorum veriyorum, ama "yeni kroki hazırlanıyor" gibi bir bilgi çıkmıyor. İsteğin alındığı, kimin (Claude) üzerinde çalıştığı ve ne zaman bittiği görünmüyor.
- Kroki güncellendiğinde sayfadaki görsel kendiliğinden yenilenmiyor; görmek için detayı kapatıp yeniden açmak gerekiyor.
- Epic detayı artık tam sayfa açılıyor (adım 206); geri bildirim bu tam sayfa görünümde net görünmeli.

Beklenen:
- Her düğmeye basınca hemen görünür bir durum: gönderildi → Claude aldı → hazırlanıyor → hazır (ya da hata). Düğme bu sırada tekrar basılamaz.
- Kroki, çözüm ya da tartışma değişince açık olan detay sayfası kendini yeniler; yeni görsel ve metin kapatıp açmadan görünür, neyin değiştiği kısa bir işaretle belli olur.
- Notu zorunlu olan işlemlerde (red, yorum) not boşsa neden çalışmadığı söylenir.

Bağlam: panel `panel/index.html` (`epicDrawerAc`, drawer tıklama/submit işleyicileri), `panel/ciz.mjs` `epicDrawerHtml`, sunucu `panel/sunucu.mjs` (Epic karar uçları, SSE akışı), karar kuyruğu `karar-bekle.mjs` (Claude kararı alınca "Claude aldı" yazılıyor).
