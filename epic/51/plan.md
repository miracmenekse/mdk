# Epic 51 Uygulama Planı: Sağlayıcı Hataları Sınıflandırması ve Akıllı Üstel Bekleme (Retry-After)

## Hedef
Ücretsiz modellerde oran sınırı (`429`), zaman aşımı (`timeout`, `408`) ve sunucu (`5xx`) hatalarında sağlayıcının belirttiği `Retry-After` süresine uygun akıllı üstel bekleme yapmak; kalıcı hatalarda (`kota`, `kimlik`, `model_yok`) beklemeden sıradaki modele geçmek.

## Yürütücü Yapılandırması
- **Ana Yürütücü:** Argon (`gemini-4-argon-medium`, default effort)
- **Kodcu:** Flash (`agy/gemini-3.8-flash-medium`, default effort)

## Bileşenler ve Değişiklikler

### 1. Hata ve Bekleme Motoru (`mdk-hata.mjs`)
- **`zaman_asimi` Sınıfı:** `['request timeout', 'gateway timeout', 'timed out', 'timeout']` ve `/\b408\b/` desenleriyle `gecici: true` olarak sınıflandırılır (`ag` içindeki `etimedout` geriye dönük uyumluluk için korunur).
- **`retryAfterBul(metin)`:**
  - JSON hata satırlarında `retryAfter`, `retry_after`, `headers['retry-after']` alanlarını okur.
  - Metin loglarında `Retry-After: 15`, `retry after 15s`, `try again in 20s`, `retry in 10 seconds`, `retry_after: 12` kalıplarını saniye/milisaniye olarak ayrıştırıp milisaniye (`number`) döndürür; yoksa `null` döner.
- **`gunlukHatasi(logYolu)`:** Hata sınıfı bulunduğunda log veya `.err` içinden `retryAfterBul` ile süre varsa `{ tur, gecici, retryAfterMs }` döndürür (yoksa `{ tur, gecici }` şeklini korur).
- **`bekleMs(tekrar, tabanMs = 5000, tavanMs = 60000, retryAfterMs = null)`:** `retryAfterMs > 0` ise `Math.min(tavanMs, retryAfterMs)` döndürür; değilse `Math.min(tavanMs, tabanMs * 3 ** (tekrar - 1))` üstel hesabını uygular.
- **`ILETILER.zaman_asimi`:** Kullanıcı dostu Türkçe açıklama ve öneri.

### 2. Koşturucu Entegrasyonu (`mdk-adim.mjs`)
- `SAGLAYICI_TURLER` ve `GECICI_TURLER` listelerine `'zaman_asimi'` eklenir.
- `calistir` fonksiyonu `gunlukHatasi(log)` sonucundaki `retryAfterMs` değerini de döndürür.
- Geçici hata döngüsünde `bekleMs(geciciTekrar, GECICI_BEKLE, 60000, r.retryAfterMs)` ile bekleme süresi hesaplanır.
- Kalıcı hatalarda (`kota`, `kimlik`, `model_yok`) beklemeden sıradaki modele geçilir.

## Doğrulama
- `node test/mdk-hata-retry.test.mjs`
- `node test/mdk-adim-retry.test.mjs`
- `node test/mdk-hata.test.mjs`
- `node test/mdk-adim-hata.test.mjs`
