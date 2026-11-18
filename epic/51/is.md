# Epic 51 — Sağlayıcı hataları sınıflandırması ve akıllı üstel bekleme (Retry-After)

## Amaç
Ücretsiz modellerde oran sınırı, zaman aşımı ve 5xx hatalarında Retry-After'a uygun üstel bekleme; kimlik/kota bittiğinde beklemeden sıradaki modele geçiş ve hatanın sınıflandırılması.

## Kapsam
1. `mdk-hata.mjs`:
   - `zaman_asimi` geçici hata sınıfı (`timeout`, `timed out`, `etimedout`, `request timeout`, `gateway timeout`, `408`).
   - `retryAfterBul(metin)` ile JSON hata alanlarından (`retryAfter`, `retry_after`, `headers['retry-after']`) ve metin loglarından (`Retry-After: 15`, `retry after 15s`, `try again in 20s`, `retry in 10 seconds`) bekleme süresinin milisaniye olarak ayıklanması.
   - `gunlukHatasi(logYolu)` çıktısına varsa `retryAfterMs` alanının eklenmesi.
   - `bekleMs(tekrar, tabanMs, tavanMs, retryAfterMs)` içinde `retryAfterMs` varsa tavan sınırıyla sınırlandırılarak kullanılması.
   - `ILETILER` sözlüğüne `zaman_asimi` için kullanıcı dostu Türkçe ileti ve öneri eklenmesi.
2. `mdk-adim.mjs`:
   - `SAGLAYICI_TURLER` ve `GECICI_TURLER` listelerine `zaman_asimi` eklenmesi.
   - `calistir` dönüş değerine `retryAfterMs` eklenmesi ve geçici hata döngüsünde `bekleMs` çağrısına aktarılması.
   - `kimlik`, `kota`, `model_yok` hatalarında bekleme yapılmadan doğrudan sıradaki modele geçilmesi.
3. `panel/ciz.mjs`:
   - `NEDEN_ACIKLAMA` sözlüğüne `zaman_asimi: 'istek zaman aşımına uğradı'` eklenmesi.
