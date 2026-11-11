# MDK (MM Development Kit)

Amaç: Claude planlar, OpenCode (ücretsiz modellerle) geliştirir; kalite kapıdan geçerek garanti edilir.
Bu plan bu aracın kendi canlı kontrol panelini ve etki görünümünü yapar.

Yürütücü: opencode
Modeller: opencode/deepseek-v4.1-flash-free, opencode/glm-5.3-flash-free, opencode/beam-free
Görev kod: opencode/deepseek-v4.1-flash-free, opencode/glm-5.3-flash-free, opencode/beam-free
Görev tasarim: opencode/glm-5.3-flash-free, opencode/minimax-m3.1-flash-free, opencode/mimo-v2.6-flash-free
Görev persona: opencode/inkling-2-small-free, opencode/mimo-v2.6-flash-free
Görev kapi: opencode/beam-free, opencode/deepseek-v4.1-flash-free
Görev inceleme: opencode/minimax-m3.1-flash-free, opencode/inkling-2-small-free
Görev eskale: opencode/longcat-2.5-free, opencode/minimax-m3.1-flash-free, opencode/big-pickle
Görev mekanik: opencode/nemotron-3.5-lightning-free, opencode/flint-40b-free, opencode/iceman-free
Görev arastirma: opencode/inkling-2-small-free, opencode/nemotron-3.5-super-vl-free

Bütçe: 300000

Kurallar (tüm adımlar için):
- Kapı dosyalarına (`test/`, `*.test.*`) ve `PLAN.md`'ye dokunma; çalıştırıcı bunu tespit eder ve denemeyi geçersiz sayar.
- Yalnızca Node yerleşik modülleri; bağımlılık yok, ağ yok, dış CDN yok. ES modül (`.mjs`).
- `*.test.mjs` dosyaları Claude'un yazdığı kapılardır: DEĞİŞTİRME, sadece geçir.
- Panel sunucusu yalnızca `127.0.0.1`'e bağlanır.
- Proje kökü = çalışma dizini; yollar buna göre.

Biçim: `PLAN.md` adımları `- [ ] N. Başlık` satırıdır; altındaki `- Kapı:`, `- Yürütücü:`, `- Etki:`, `- Değer:` satırları alanlardır.

## Panel
- [x] 1. PLAN.md ayrıştırıcı
  - Kapı: `node panel/plan.test.mjs`
- [x] 2. Durum birleştirici
  - Kapı: `node panel/durum.test.mjs`
- [x] 3. Canlı sunucu
  - Kapı: `node panel/sunucu.test.mjs`
- [x] 4. Arayüz
  - Kapı: `node panel/arayuz.test.mjs`
## Etki görünümü
- [x] 5. Etki taslağı örneği
  - Kapı: `node etki/ornek.test.mjs`
- [x] 6. Maliyet tahmini ve etki listesi
  - Kapı: `node panel/etki.test.mjs && node panel/durum.test.mjs`
- [x] 7. Etki sekmesi
  - Kapı: `node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`
## Süreç
- [x] 8. BA/PM bakışı becerisi
  - Yürütücü: claude
  - Kapı: `test -f ~/.claude/skills/ba-pm-bakis/SKILL.md && test -f personalar.md`
## Karar notu: Geçmiş görünümü (ba-pm-bakis ile üretildi, 2026-10-17)
## Çalıştırıcı sertleştirme
- [x] 9. Çoklu kapı
  - Yürütücü: kodcu
  - Kapı: `bash test/mdk-adim.test.sh temel coklu`
- [x] 10. Taslak onayı zorunluluğu
  - Yürütücü: kodcu
  - Kapı: `bash test/mdk-adim.test.sh temel coklu onay`
- [x] 11. Süreç grubu, süre sınırı ve başarısızlık nedeni
  - Yürütücü: kodcu
  - Kapı: `bash test/mdk-adim.test.sh temel coklu onay neden sure yanit_yok`
- [x] 12. Token bütçesi
  - Yürütücü: kodcu
  - Kapı: `bash test/mdk-adim.test.sh temel coklu onay neden sure yanit_yok butce butce_ok`
- [x] 13. SORUN.md ve model sırası
  - Yürütücü: kodcu
  - Kapı: `bash test/mdk-adim.test.sh temel coklu onay neden sure yanit_yok butce butce_ok sorun once`
## Veri ve araçlar
- [x] 14. Ayrıştırıcıda çoklu kapı, bütçe ve onay
  - Kapı: `node panel/plan.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 15. Kayıt aracı (kodcu satırları ve inceleme sonucu)
  - Kapı: `node test/kayit.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 16. Durum: yürütücü bazlı model tablosu ve incelemeler
  - Kapı: `node panel/durum.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 17. Geçmiş verisi
  - Kapı: `node panel/gecmis.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 18. Karşılaştırma tablosu
  - Kapı: `node test/karsilastir.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 19. Panel başlat/durdur betiği
  - Kapı: `bash test/mdk-panel.test.sh`
  - Kapı: `bash test/hepsi.sh`
- [x] 20. Kapı denetleyici
  - Kapı: `node test/kapi-denetle.test.mjs`
  - Kapı: `bash test/hepsi.sh`
## Panel arayüzü
- [x] 21. Çizim modülü ve ekran görüntüsü hataları
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `node panel/arayuz.test.mjs`
  - Kapı: `node panel/sunucu.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 22. Adım geçmişi görünümü
  - Etki: etki/gecmis.html
  - Onay: evet (kullanıcının 2026-10-17 "tamamını yap, bitene kadar durma" talimatına dayanır; taslak etki/gecmis.html teslim turunda kullanıcı tarafından gözden geçirilecek)
  - Değer: 5
  - Kapı: `node panel/gecmis-ui.test.mjs`
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 23. Model tablosu ve etki çubuğu
  - Kapı: `node panel/modeller-ui.test.mjs`
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `bash test/hepsi.sh`
## Ekran görüntüsünden bulunanlar (2026-10-17, gerçek tarayıcı)
- [x] 27. Adım satırı düzeni
  - Yürütücü: kodcu
  - Kapı: `node panel/duzen.test.mjs`
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 28. Kayıt aracı durum.json'u günceller
  - Yürütücü: kodcu
  - Kapı: `node test/kayit-durum.test.mjs`
  - Kapı: `node test/kayit.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 29. Açık ayrıntılar canlı güncellemede korunur
  - Yürütücü: kodcu
  - Kapı: `node panel/acik.test.mjs`
  - Kapı: `node panel/gecmis-ui.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 30. Etki taslağı: önce ve sonra ayrı gösterilir
  - Yürütücü: kodcu
  - Kapı: `node panel/etki-goster.test.mjs`
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `node panel/sunucu.test.mjs`
  - Kapı: `bash test/hepsi.sh`
## Süreç (Claude)
- [x] 24. İnceleme kayıtları ve karşılaştırma verisi
  - Yürütücü: claude
  - Kapı: `test "$(grep -c '"tur":"inceleme"' metrikler.jsonl)" -ge 10`
- [x] 25. Personaları ve süreç belgelerini güncelle
  - Yürütücü: claude
  - Kapı: `grep -q 'Çıktı biçimi' personalar.md && grep -q 'önermeyeceği' personalar.md`
- [x] 26. Uçtan uca doğrulama
  - Yürütücü: claude
  - Kapı: `bash test/hepsi.sh && node kapi-denetle.mjs`
## Personalar v2: iş alanına göre kart paketleri
### Faz 1: kartlar
- [x] 31. Persona denetçisi
  - Kapı: `node test/persona-denetle.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 32. Kart biçimi ve proje-gelistirme paketi
  - Yürütücü: claude
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `test "$(node persona-denetle.mjs --sayim | grep -c '^proje-gelistirme/')" -ge 4`
  - Kapı: `node persona-denetle.mjs --sayim | grep -q 'proje-gelistirme/Kapıyı kandıran yürütücü'`
  - Kapı: `! grep -q 'Acelesi olan saha' personalar.md`
- [x] 33. Sunum paketi
  - Yürütücü: claude
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `test "$(node persona-denetle.mjs --sayim | grep -c '^sunum/')" -ge 3`
- [x] 34. Araştırma paketi
  - Yürütücü: claude
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `test "$(node persona-denetle.mjs --sayim | grep -c '^arastirma/')" -ge 3`
- [x] 35. Karar günlüğü ve seçim kuralı
  - Yürütücü: claude
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `node persona-denetle.mjs --sayim | grep -q 'proje-gelistirme/Minimalist ürün tasarımcısı: kullanım 1, kazanma 1'`
  - Kapı: `node persona-denetle.mjs --sayim | grep -q 'proje-gelistirme/Denetçi / güvenlik: kullanım 1, kazanma 0'`
  - Kapı: `grep -q 'Seçim kuralı' personalar.md`
- [x] 36. Canlı deneme 1: UI ve akış kararı
  - Yürütücü: claude
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `grep -q 'Durum: denendi' personalar.md`
  - Kapı: `test "$(grep -c '^| 2026-' personalar.md)" -ge 2`
  - Kapı: `grep -Eq '^Sonuç: (doğrulandı|çürüdü)' PLAN.md`
  - Kapı: `grep -Eq 'Harcanan token: [0-9]+k' PLAN.md`
- [x] 37. Kapı yazımı: geçmişe karşı deneme
  - Yürütücü: claude
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `grep -Eq 'Boşluk bulunan kapı: [0-3]/3' PLAN.md`
  - Kapı: `test "$(grep -c '^Sonuç: ' PLAN.md)" -ge 2`
- [x] 38. Plan bölme: geçmişe karşı deneme
  - Yürütücü: claude
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `test "$(grep -c '^Sonuç: ' PLAN.md)" -ge 3`
  - Kapı: `grep -q '^## Karar notu: Persona denemesi 3' PLAN.md`
- [x] 39. Belgeler ve bellek
  - Yürütücü: claude
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `! grep -q "9'dan devam" CLAUDE.md`
  - Kapı: `grep -q 'persona-denetle' ~/.claude/skills/ba-pm-bakis/SKILL.md`
  - Kapı: `bash test/hepsi.sh`
- [x] 40. Araştırma sekmesi
  - Kapı: `node panel/arastirma.test.mjs`
  - Kapı: `node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 41. Güven etiketli sayılar (model tablosu)
  - Etki: etki/guven.html
  - Onay: evet
  - Değer: 4
  - Kapı: `node panel/guven.test.mjs`
  - Kapı: `node panel/durum.test.mjs && node panel/modeller-ui.test.mjs && node panel/arayuz.test.mjs etki`
  - Kapı: `bash test/hepsi.sh`
## Karar notu: Persona denemesi 1 (adım 36; 1. tur Claude alt ajanlarıyla yarım, 2. tur OpenCode ile tamam)
- Dikkati dağınık kullanıcı: satır tek hüküm mü söylesin (gerçekte kim bitirdi), her denemenin dökümü mü; ayrıntı isteyene saklı.
- Bakımı yapacak geliştirici: tek `metrikler.jsonl` okumasıyla ucuza türetilen "son geçen yürütücü" mü, her satırda ayrı hesaplanıp test edilecek "deneme geçmişi" mi.
- Denetçi / güvenlik: planlanan yürütücüyü tek başına göstermek mi (gerçeği yansıtmaz, geri izlenemez), fiilî yürütücü ve deneme geçmişini satırda kayıtlı tutmak mı (izlenebilir, kalabalık).
Harcanan token: 0k Claude (ücretsiz modellerde 35k; Claude yalnız birleştirdi), süre ~10 dk (süre aşımı kartı bekletti).
Sonuç: doğrulandı (≥2 eksen; Claude maliyeti 107k → 0). Not: 3 karttan 1'i kota yüzünden düştü; kota sessizken tur ~10 dk sürer, `PERSONA_SURE` kısaltılabilir.
## Karar notu: Persona denemesi 2 (adım 37, 2026-10-27, persona-tur.sh)
Boşluk bulunan kapı: 2/3
Harcanan token: 0k Claude (ücretsiz modellerde 255k: 18k + 141k + 95k), süre ~6 dk.
Sonuç: doğrulandı (2/3 ≥ 2/3). Not: kart 25'te "hayır" dedi; kartın evet/hayır hükmü değil, önerdiği güçlendirme ve Claude'un sınaması güvenilir.
## Karar notu: Persona denemesi 3 (adım 38, 2026-10-27, persona-tur.sh)
Harcanan token: 0k Claude (ücretsiz modelde 27k), süre ~4 dk.
Sonuç: çürüdü (plandaki varsayım çürüdü: 9 ve 22 büyüklük yüzünden değil kota yüzünden zorlandı, ve UYARI'ya değecek isabette bir ölçüt yok; persona akışı ise çalıştı).
## Karar notu: Persona denemesi 4 (adım 60, 2026-10-27, persona-tur.sh, alan: arastirma)
Harcanan token: 0k Claude (ücretsiz modelde 56k), süre ~6 dk.
Sonuç: doğrulandı (3 geçerli kart, 3 ayrı eksen; üçü aynı sonuca vardı, güvenli taban. Kartlardan biri sayısal iddiada yanıldı, Claude sınaması yakaladı.)
## Karar notu: Persona denemesi 5 (adım 61, 2026-10-27, persona-tur.sh, alan: sunum)
Harcanan token: 0k Claude (ücretsiz modelde 55k), süre ~6 dk.
Sonuç: doğrulandı (3 geçerli kart, 3 ayrı eksen; 6 seçenek, mentör kartı diğerlerinin önermediği "sonraki adımları çıkar" seçeneğini getirdi.)
- [x] 42. Adım geçmişinde güven: sessizlik ayrı, gerçek yürütücü
  - Bütçe: 300000
  - Kapı: `node panel/gecmis-guven.test.mjs`
  - Kapı: `node panel/gecmis-ui.test.mjs && node panel/guven.test.mjs && node panel/modeller-ui.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 43. "Sadece sorunlu" süzgeci çalışmamış adımları gizlemesin
  - Bütçe: 300000
  - Kapı: `node panel/suzgec.test.mjs`
  - Kapı: `node panel/gecmis-ui.test.mjs && node panel/gecmis-guven.test.mjs && node panel/arayuz.test.mjs etki`
- [x] 44. Gerçek token ve tasarruf kartı (opencode.db)
  - Etki: etki/telemetri.html
  - Onay: evet
  - Değer: 5
  - Bütçe: 300000
  - Kapı: `node panel/telemetri.test.mjs`
  - Kapı: `node panel/durum.test.mjs && node panel/guven.test.mjs && node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`
- [x] 45. Model × adım matrisi
  - Etki: etki/matris.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `node panel/matris.test.mjs`
  - Kapı: `node panel/durum.test.mjs && node panel/guven.test.mjs && node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`
- [x] 46. KPI şeridi ve sekmeler
  - Etki: etki/sekmeler.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `node panel/sekme.test.mjs`
  - Kapı: `node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs && node panel/arastirma.test.mjs && node panel/telemetri.test.mjs && node panel/matris.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 47. Claude harcaması (Claude Code oturum dosyalarından)
  - Etki: etki/claude.html
  - Onay: evet
  - Değer: 5
  - Bütçe: 300000
  - Kapı: `node panel/claude.test.mjs`
  - Kapı: `node panel/sekme.test.mjs && node panel/telemetri.test.mjs && node panel/durum.test.mjs && node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 48. Depo durumu (sürüm, yayımlanmamış K'ler, CI, yerel) ve projeye süzülmüş token
  - Etki: etki/depo.html
  - Onay: evet
  - Değer: 5
  - Bütçe: 300000
  - Kapı: `node panel/depo.test.mjs`
  - Kapı: `node panel/sekme.test.mjs && node panel/telemetri.test.mjs && node panel/durum.test.mjs && node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs && node panel/matris.test.mjs`
- [x] 49. Matris yatay kaydırma
  - Etki: etki/matris-kaydir.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `node panel/matris-kaydir.test.mjs && node panel/matris.test.mjs`
- [x] 50. Sayı biçimi ve hüküm etiketi
  - Etki: etki/sayi-bicimi.html
  - Onay: evet
  - Değer: 2
  - Bütçe: 300000
  - Kapı: `node panel/sayi-bicimi.test.mjs && node panel/modeller-ui.test.mjs && node panel/gecmis-ui.test.mjs`
- [x] 51. Depo: yalnız anlamlı kutular, tekrarsız commit listesi
  - Etki: etki/depo-sade.html
  - Onay: evet
  - Değer: 3
  - Bütçe: 300000
  - Kapı: `node panel/depo-sade.test.mjs && node panel/depo.test.mjs`
- [x] 52. Dar ekran: sıkı KPI ve tek satır sekme
  - Etki: etki/dar-ekran.html
  - Onay: evet
  - Değer: 3
  - Bütçe: 300000
  - Kapı: `node panel/dar-ekran.test.mjs && node panel/sekme.test.mjs`
- [x] 53. Etki sekmesi: biten adımların taslakları
  - Etki: etki/etki-gecmis.html
  - Onay: evet
  - Değer: 3
  - Bütçe: 300000
  - Kapı: `node panel/etki-gecmis.test.mjs && node panel/etki.test.mjs && node panel/arayuz.test.mjs etki`
- [x] 54. Akış: açık adımlar üstte, biten bölümler katlı
  - Etki: etki/akis-katli.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `node panel/akis-katli.test.mjs && node panel/gecmis-ui.test.mjs && node panel/suzgec.test.mjs && node panel/ciz.test.mjs`
- [x] 55. Maliyet dengesi kartı
  - Etki: etki/denge.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `node panel/denge.test.mjs`
- [x] 56. Araştırma: yapılan önerilere rozet
  - Etki: etki/arastirma-yapildi.html
  - Onay: evet
  - Değer: 2
  - Bütçe: 300000
  - Kapı: `node panel/arastirma-yapildi.test.mjs && node panel/arastirma.test.mjs`
- [x] 57. Etki krokisi tıklanınca büyür
  - Etki: etki/kroki-buyut.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `node panel/kroki-buyut.test.mjs && node panel/etki-gecmis.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 58. Persona turu betiği
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `bash test/persona-tur.test.sh`
  - Kapı: `node persona-denetle.mjs`
- [x] 59. Persona turunda sessiz modeli erken atla
  - Değer: 3
  - Bütçe: 300000
  - Kapı: `bash test/persona-tur.test.sh`
  - Kapı: `bash test/hepsi.sh`
- [x] 60. Araştırma alanını gerçek kararla dene
  - Yürütücü: claude
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `grep -A1 '^## Alan: arastirma' personalar.md | grep -q 'Durum: denendi'`
  - Kapı: `grep -q '^## Karar notu: Persona denemesi 4' PLAN.md`
- [x] 61. Sunum alanını gerçek kararla dene
  - Yürütücü: claude
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `grep -A1 '^## Alan: sunum' personalar.md | grep -q 'Durum: denendi'`
  - Kapı: `grep -q '^## Karar notu: Persona denemesi 5' PLAN.md`
- [x] 62. Ücretsiz kota dolunca modeli hemen bırak
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `bash test/mdk-adim.test.sh kota`
  - Kapı: `bash test/hepsi.sh`
- [x] 63. Karar modülü
  - Değer: 3
  - Bütçe: 300000
  - Kapı: `node panel/karar.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 64. Sunucuda karar rotası
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `node panel/karar-sunucu.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 65. Karar izleyici betiği
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `node test/karar-bekle.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 66. Durumda karar bilgisi
  - Değer: 3
  - Bütçe: 300000
  - Kapı: `node panel/karar-durum.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 67. Etki kartında karar formu
  - Değer: 4
  - Bütçe: 300000
  - Etki: etki/etki-karar.html
  - Onay: evet
  - Kapı: `node panel/karar-ciz.test.mjs`
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 68. Panelde karar gönderimi
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `node panel/karar-ui.test.mjs`
  - Kapı: `node panel/arayuz.test.mjs etki`
  - Kapı: `bash test/hepsi.sh`
- [x] 69. Claude tarafı: kararı izle ve işle
  - Yürütücü: claude
  - Kapı: `grep -q '^## Panelden karar' CLAUDE.md`
  - Kapı: `bash test/hepsi.sh`
- [x] 70. Metrikte istek sayısı ve deney etiketi
  - Değer: 4
  - Bütçe: 300000
  - Kapı: `bash test/mdk-adim.test.sh deney temel`
  - Kapı: `bash test/hepsi.sh`
- [x] 71. Matriste token, istek ve deney satırları
  - Değer: 5
  - Bütçe: 300000
  - Kapı: `node panel/matris-token.test.mjs`
  - Kapı: `node panel/matris.test.mjs`
  - Kapı: `bash test/hepsi.sh`
- [x] 72. OpenCode v2'ye geçiş
  - Değer: 5
  - Bütçe: 400000
  - Kapı: `bash test/mdk-adim.test.sh v2 v1_token v2_kota temel kota deney`
  - Kapı: `node panel/telemetri-v2.test.mjs`
  - Kapı: `bash test/hepsi.sh`
## Karar notu: görev türüne göre model (2026-10-29)
### Faz 11 ölçümü (2026-10-29, adım 88; n küçük, gürültülü)
### Faz 11: görev türüne göre model ve paralel oturum (2026-10-29)
- [x] 81. Görev satırları ve Modeller temizliği
  - Yürütücü: claude
  - Kapı: `! grep -nE '^Modeller:.*(openrouter|-free|cursor/)' PLAN.md && grep -cE '^Görev [a-z]+: opencode-go/' PLAN.md | grep -qx 8`
- [x] 82. mdk-adim: adımın görev türüne göre model zinciri
  - Yürütücü: kodcu
  - Kapı: `bash test/mdk-adim.test.sh gorev` (Claude yazar: tür satırı seçilir; adım `Modeller:`'i öne geçer; tanımsız tür çıkış 4 + liste; tür yoksa kod; metrikte gorev)
- [x] 83. persona-tur: varsayılan model `Görev persona:`
  - Yürütücü: kodcu
  - Kapı: `bash test/persona-gorev.test.sh` (Claude yazar; persona-tur.test.sh vaka süzmediği için ayrı dosya)
- [x] 84. Model kilidi
  - Yürütücü: kodcu
  - Kapı: `bash test/mdk-adim.test.sh kilit_bekle kilit_ikinci kilit_tavan plan_dokunma` (iki koşu aynı tek modelle: ikincisi bekler; iki modelle: ikinci koşu ikinci modeli alır)
- [x] 85. Paralel koşturucu
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `bash test/mdk-paralel.test.sh`
- [x] 86. Go modeliyle inceleme
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `bash test/mdk-incele.test.sh`
- [x] 87. Kurallar ve belgeler
  - Yürütücü: claude
  - Kapı: `grep -q 'Görev persona' ~/.claude/skills/ba-pm-bakis/SKILL.md && grep -q 'mdk-paralel' CLAUDE.md && ! grep -q 'ücretsiz modelle' ~/.claude/skills/ba-pm-bakis/SKILL.md`
- [x] 88. Gerçek deneme ve ölçüm
  - Yürütücü: claude
  - Kapı: `grep -q 'Faz 11 ölçümü' PLAN.md`
- [x] 89. Model tablosu: kota deneme sayılmaz
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `node panel/kota-model.test.mjs`
- [x] 90. Adım geçmişi: kota ayrı gösterilir
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `node panel/kota-gecmis.test.mjs`
- [x] 91. Hızlı ön kontrol ve regresyon durumu
  - Yürütücü: kodcu
  - Kapı: `bash test/mdk-adim.test.sh onkontrol_durum onkontrol_kirmizi && bash test/hepsi-hizli.test.sh`
- [x] 92. Panelde ön regresyon durumu
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `node panel/regresyon.test.mjs`
## Faz 12 — Akış sekmesi yeniden tasarımı (kart=sekme + adım detay drawer)
- [x] 93. Ayrıştırıcı: `- Persona:` alanı
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `node panel/plan-persona.test.mjs` (geçerli yol → `adim.persona` = yol; `../x`/kök dışı → `null`; Persona satırı olmayan adımda `persona` anahtarı yok)
- [x] 94. Sunucu: `GET /api/persona?adim=<no>`
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `node panel/persona-api.test.mjs` (geçerli yol → ozet metni; kök dışı yol → 400; persona'sız adım → `ozet:null`)
- [x] 95. ciz.mjs: `personaBalonlarHtml(ozet)`
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `node panel/persona-ciz.test.mjs` (3 kartlı ozet → 3 balon, doğru rol/avatar/renk sırası; boş → boş durum; `<script>` kaçışlanır)
- [x] 96. ciz.mjs: `drawerHtml(adim, etkiKarti)`
  - Yürütücü: kodcu
  - Görev: kod
  - Kapı: `node panel/drawer-ciz.test.mjs` (başlıkta no+ad; etkili adım → etki kartı + `form.karar`; etkisiz → "etki yok"; persona kabı boş render)
- [x] 97. ciz.mjs: `akisTablosuHtml` (düz ADIMLAR tablosu)
  - Yürütücü: kodcu
  - Görev: kod
  - Kapı: `node panel/akis-tablo.test.mjs` (adımlar satır olur, `data-adim` taşır; durum/ilerleme/meta doğru; gruplu `<details data-kat>` yok)
- [x] 98. index.html + CSS: düz tabloya geç + drawer kabuğu/aç-kapat
  - Yürütücü: kodcu
  - Görev: kod
  - Kapı: `node panel/drawer-ui.test.mjs` (index.html: drawer+overlay iskeleti, `data-adim` tıklama→açma, 3 yolla kapatma, `/api/persona` çağrısı metinde var) + Firefox ekran görüntüsü (geciktirici sarmalayıcı)
- [x] 99. KPI kartları = sekme (4 kart, Etki yok)
  - Yürütücü: kodcu
  - Görev: kod
  - Kapı: `node panel/kpi-sekme.test.mjs` (4 kart, Etki yok, kart `data-sekme` taşır, seçili işaretlenir) + ekran görüntüsü
- [x] 100. Karar + kroki mantığını drawer'a taşı
  - Yürütücü: kodcu
  - Görev: kod
  - Kapı: `node panel/karar-ui.test.mjs` (drawer içindeki `form.karar` submit `/api/karar`'a no+tur+metin yollar; hata/odak-saklama korunur)
- [x] 101. Etki sekmesini kaldır + testleri yeşile al
  - Yürütücü: kodcu
  - Görev: kod
  - Kapı: `bash test/hepsi.sh` yeşil + Firefox ekran görüntüsüyle uçtan uca karar (Onayla→`kararlar.jsonl`)
## Faz 13 — Modeller sayfası grafikler + tam genişlik düzen
- [x] 103a. Tam genişlik: `main { max-width: 720px }` → `1600px` + yanal padding (clamp).
- [x] 103. Modeller v2 grafikleri: `tokenPayiHtml` (degrade halka + maliyet birleşik kart) + `modelTokenCubukHtml` (degrade çubuk); Modeller sekmesi "Özet grafikler" bölümüne eklenir, eski "Maliyet dengesi" (denge) kartı yerini birleşik karta bırakır; detay tablolar (modeller/telemetri) korunur.
  - Yürütücü: kodcu
  - Görev: kod
  - Kapı: `node panel/modeller-grafik.test.mjs` + görsel doğrulama
- [x] 104. Akış tablosu meta satırına süre
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `node panel/akis-sure.test.mjs`
## Faz 15 — Persona takımı (panel sekmesi + reasoning)
- [x] 107. `ciz.mjs`: `personaTakimHtml(takim)` (persona kartları: Ad/Optimize/Körlük/Soru, avatar+renk)
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `node panel/persona-takim.test.mjs`
- [x] 108. Sunucu: persona takımı oku + kaydet
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `node panel/persona-api2.test.mjs`
- [x] 109. index.html: Persona sekmesi (5. kart) + düzenle/sil/ekle/yorum
  - Yürütücü: kodcu
  - Görev: kod
  - Kapı: `node panel/persona-ui.test.mjs` + görsel
- [x] 110. Özellik reasoning → drawer
  - Yürütücü: kodcu
  - Görev: kod
  - Persona: persona-tur/20261101173915
  - Kapı: elle — `node persona-takim-tur.mjs <soru>` ozet üretir; drawer'da `/api/persona?adim=110` görüşleri gösterir (örnek koşuldu).
## Faz 14 — Manuel test tetikleme (Depo sekmesinde buton)
- [x] 105. Sunucu: `POST /api/test`
  - Yürütücü: opencode
  - Görev: kod
  - Kapı: `node panel/test-api.test.mjs`
- [x] 106. Depo sekmesinde "Testleri çalıştır" butonu + sonuç
  - Yürütücü: kodcu
  - Görev: kod
  - Kapı: `node panel/test-ui.test.mjs` (index.html: buton + /api/test fetch + sonuç alanı) + görsel
## Faz 12.1 — OpenCode `--standalone` uyumu
- [x] 102. `--standalone` bayrağını kaldır (3 çağrı + 2 kapı)
  - Yürütücü: kodcu
  - Görev: mekanik
  - Kapı: `bash test/mdk-adim.test.sh && bash test/persona-tur.test.sh` (argv'de `--standalone` yok, loglevel error)
## Faz 16 — iPhone uygulaması (canlı paneli açan kabuk)
- **Problem ve hipotez:** Kullanıcı Mac başında değilken adımları izleyemiyor, onay bekleyen adım duruyor. Hipotez: panelin aynısı cepte olursa onay bekleme süresi kısalır; ayrı arayüz yazmadan bu sağlanır.
- **İş değeri / başarı ölçütü:** Hücresel ağdan panel açılır, canlı güncellenir ve bir adım telefondan onaylanır; panel değişince uygulama yeniden kurulmadan değişir. Bir hafta gerçek kullanımda telefondan en az bir karar verilmesi hipotezi doğrular.
- **Akış:** Simgeye dokun → panel (1 adım). İlk açılışta adres. Bağlantı yoksa "Mac'e ulaşılamıyor", 5 sn'de bir kendisi dener.
- **Mimari:** SwiftUI + WKWebView, panel adresten yüklenir (HTML pakete gömülmez; `file://` göreli `/api` ve `/olay`'ı bozar). Sunucu `127.0.0.1`'de kalır; önüne Tailscale Serve (yalnız kişisel ağ, HTTPS). Uzak yazma izni `.mdk-uzak.json` (git-ignore) ile açılır, dosya yoksa kapalı.
- **Riskler:** (1) Ücretsiz Apple hesabında imza 7 gün (profiller 07-20→07-27, ekip D3TZD57793): adım 118 tek komutla yeniden kurar. (2) Mac uyursa panel yok; hata ekranı bunu söyler. (3) Tailscale Serve'ün Host/kimlik başlıkları ve SSE akışı henüz gerçek kurulumda görülmedi; adım 119'da doğrulanır, Host farklı gelirse izin kapalı kalır (güvenli yönde bozulur).
- **Kapsam dışı (ilk sürüm):** ekranları Swift ile yeniden yazmak, push bildirimi (ücretsiz hesapta yok), çevrimdışı önbellek, telefondan test çalıştırma, panelin kendiliğinden başlaması.
- **Kararlar (kullanıcı, 2026-11-01):** canlı paneli açan uygulama; telefondan karar ve persona düzenleme açık, test kapalı; sunucu adımları opencode, Swift adımları kodcu.
- [x] 111. Yazma izni kararı (saf modül)
  - Görev: kod
  - Kapı: `node panel/uzak.test.mjs`
- [x] 112. Karar ve persona uçları yazma iznini kullanır
  - Görev: kod
  - Kapı: `node panel/uzak-sunucu.test.mjs && node panel/karar-sunucu.test.mjs`
- [x] 113. Testleri çalıştır yalnız Mac'ten
  - Görev: kod
  - Kapı: `node panel/uzak-test-engel.test.mjs && node panel/test-api.test.mjs`
- [ ] 114. iOS kabuğu: paneli WKWebView'da açar
  - Yürütücü: kodcu
  - Ne: `ios/project.yml` (xcodegen; hedef MDK, iOS 17, paket `com.miracmenekse.mdk`, ekip D3TZD57793, otomatik imza), `ios/MDK/`: SwiftUI uygulama + `WKWebView` temsilcisi, tam ekran, güvenli alan içinde. Adres: `MDK_PANEL_URL` ortamı, yoksa `UserDefaults` `panelAdresi`, yoksa `http://127.0.0.1:4747`. ATS: yalnız `NSAllowsLocalNetworking`. Panel HTML'i pakete gömülmez, panele dokunulmaz.
  - Kapı: `bash test/ios-kabuk.test.sh`
- [ ] 115. Bağlantı yok ekranı ve kendiliğinden yeniden deneme
  - Yürütücü: kodcu
  - Etki: etki/ios-kabuk.html
  - Değer: 4
  - Ne: Yükleme başarısızsa (`didFail`, `didFailProvisionalNavigation`, 5xx) yerel ekran: "Mac'e ulaşılamıyor", "Mac uyuyor ya da panel kapalı", Yeniden dene, Adresi değiştir. Bu ekrandayken 5 sn'de bir dener, olunca panele geçer. WebContent süreci ölürse yeniden yükler.
  - Kapı: `bash test/ios-hata.test.sh`
- [ ] 116. İlk açılış adres ekranı
  - Yürütücü: kodcu
  - Etki: etki/ios-kabuk.html
  - Değer: 4
  - Ne: `ios/MDK/PanelAdresi.swift`: `enum PanelAdresi { static func cozumle(_ s: String) -> URL? }`, çıplak ad https olur; düz http yalnız 127.0.0.1/localhost için; sondaki `/` atılır, ad küçük harf. Kayıtlı adres yoksa yerel form (alan + Bağlan, geçersizse satır içi uyarı), `panelAdresi`'ne yazar. Hata ekranındaki Adresi değiştir bu forma döner. `MDK_PANEL_URL` varken form açılmaz; varsayılan adres fallback'i kalkar.
  - Kapı: `bash test/ios-adres.test.sh && bash test/ios-kabuk.test.sh`
- [ ] 117. Öne dönünce bayat paneli yenile
  - Yürütücü: kodcu
  - Ne: `ios/MDK/YenilemeKarari.swift`: `enum YenilemeKarari { static func gerekli(ayrilma: Date?, donus: Date) -> Bool }`, 120 sn ve üzeri ayrılıkta `true`. `scenePhase` arka plana geçişte zamanı tutar, dönüşte gerekliyse WebView yeniden yükler. Kısa ayrılık yazılan yorumu silmez.
  - Kapı: `bash test/ios-yenile.test.sh && bash test/ios-kabuk.test.sh`
- [ ] 118. Tek komutla iPhone'a kur (7 günlük imza için)
  - Yürütücü: kodcu
  - Ne: `ios/kur.sh`: bağlı iPhone'u `xcrun devicectl list devices` ile bulur, yoksa ne yapılacağını söyleyip çıkış 1. `xcodegen`, imzalı `xcodebuild`, `devicectl device install app`, `devicectl device process launch`. İmza hatasında Xcode'da hesap açmayı söyler.
  - Kapı: elle — iPhone bağlıyken `bash ios/kur.sh` uygulamayı kurup açar; bağlı değilken çıkış 1 ve açıklama.
- [ ] 119. Uçtan uca doğrulama (hücresel ağ)
  - Yürütücü: kodcu
  - Ne: Elle yapılacaklar bitince: Serve'den gelen Host/Origin/kimlik başlıklarını gerçek istekle gör, SSE'nin tamponlanmadan aktığını ölç, telefondan bir yorum gönderip `etki/kararlar.jsonl`'de gör, Testleri çalıştır'ın reddedildiğini gör. Host beklenenden farklıysa `uzak.mjs` için yeni adım aç.
  - Kapı: elle — Wi-Fi kapalı iPhone'da panel açılır, canlı güncellenir, yorum kaydedilir, test reddedilir.
## Faz 17 — Görev modelleri (ücretsiz modeller)
Kullanıcı Go kotası bitti; yalnız OpenCode ücretsiz modelleri kullanılıyor. Modeller sekmesine "Görev modelleri" bölgesi: her `Görev <tür>:` satırı ve modelleri listelenir, kullanıcı bir görevin modelini değiştirebilir. Seçenek listesi şimdilik statik; ileride sağlayıcı/API'den gelecek.
- [x] 120. Görev modelleri: ayrıştırma, yazma ve POST ucu
  - Ne: Yeni `panel/gorev.mjs` (~60 satır): `export const SERBEST_MODELLER` = şu 11 kimlik, bu sırayla: `opencode/iceman-free, opencode/inkling-2-small-free, opencode/crouton-alpha-free, opencode/longcat-2.5-free, opencode/flint-40b-free, opencode/nemotron-3.5-super-vl-free, opencode/beam-free, opencode/mimo-v2.6-flash-free, opencode/deepseek-v4.1-flash-free, opencode/nemotron-3.5-lightning-free, opencode/big-pickle` (ileride sağlayıcı entegrasyonu bunu değiştirecek; tek sabit). `export function gorevler(metin)` → PLAN metnindeki her `^Görev <tür>: a, b, c` satırı için `{ gorev: '<tür>', modeller: ['a','b','c'] }` dizisi (dosyadaki sırayla; boşluklar kırpılır). `export function gorevModelYaz(metin, gorev, sira, model)` → yalnız o görev satırının `sira` (0 tabanlı) numaralı modelini `model` ile değiştirir, diğer modelleri ve sırayı korur; `sira === modeller.length` ise sona ekler; dosyanın geri kalanı bayt bayt aynı kalır. Hatalarda `Error` fırlatır: görev yok, `model` SERBEST_MODELLER'de değil, `sira` geçersiz, ya da model o satırda başka sırada zaten var. `panel/sunucu.mjs`: anlık görüntüye (`sunucu.mjs:34` `durum()` nesnesi) `gorevler` (her çağrıda `PLAN.md` okunup `gorevler()` ile; okunamazsa `[]`) ve `serbestModeller: SERBEST_MODELLER` alanlarını ekle; `POST /api/gorev-model` ucu (`personaTakimAl` ~220-270 kalıbıyla: 64 KB sınırı, `yazmaIzni` denetimi, JSON gövde `{gorev, sira, model}`): `gorevModelYaz` ile `PLAN.md`'yi yazar, 200 `{tamam:true}`; doğrulama hatasında 400 `{hata}`. `panel/plan.mjs`'ye dokunma.
  - Kapı: `node panel/gorev.test.mjs` — kapı gerçek `PLAN.md`'ye ASLA dokunmaz: `mkdtemp` içine Görev satırları olan bir fikstür `PLAN.md` yazar, sunucuyu o dizinle ve boş bir portla başlatır. Doğrular: `gorevler()` fikstürdeki görevleri ve modelleri doğru sırayla döner; `SERBEST_MODELLER` 11 öğe ve `opencode/big-pickle` içerir; `gorevModelYaz` sıra 0'ı değiştirip ikinci modeli korur, sona ekler; bilinmeyen görev/model ve yinelenen model `Error` fırlatır; `POST /api/gorev-model` fikstür dosyadaki satırı değiştirir ve diğer tüm satırlar aynı kalır; bilinmeyen model 400 döner; anlık görüntü (`/api/durum` ya da SSE ilk olay) `gorevler` alanını içerir.
- [x] 121. Modeller sekmesinde "Görev modelleri" bölgesi
  - Ne: `panel/ciz.mjs`'ye `export function gorevModelleriHtml(gorevler, serbest)` (~40 satır, `modellerHtml` ~385 yakınına): tablo; her satır bir görev (`<td>` görev adı), modellerin her biri için bir `<select class="gorev-model" data-gorev="<tür>" data-sira="<i>">` (seçenekler = `serbest`; mevcut model `serbest`te yoksa en üstte "(<model>) — ücretsiz değil" seçeneği olarak seçili gelir), satır sonunda yedek eklemek için `data-sira="<modeller.length>"` ve boş "+ yedek ekle" ilk seçenekli bir select. Boş/eksik girdide `<span class="bos">görev yok</span>`. Tüm metinler `esc` ile. Başlık altına kısa not: "Seçenekler şimdilik sabit ücretsiz OpenCode listesi; sağlayıcı entegrasyonu sonra." `panel/index.html`: `sekme-modeller` içinde "Özet grafikler"den önce `<h2>Görev modelleri</h2><section id="gorev-modelleri"></section>`; `ciz` (~690) içinde `gorevModelleriHtml(d.gorevler, d.serbestModeller)` ile doldur; `change` olayını bölüm üzerinde dinle (event delegation), boş değer değilse `POST /api/gorev-model` `{gorev, sira:Number, model}`; hata gelirse bölümün altına kısa hata metni yaz. Sayfa yenilenmesi SSE ile kendiliğinden gelir.
  - Kapı: `node panel/gorev-ui.test.mjs` — `gorevModelleriHtml` için: iki görevli girdide her görev adı ve her model için seçili `<option ... selected>` var, `data-gorev`/`data-sira` doğru, "+ yedek ekle" var, serbest listede olmayan model "ücretsiz değil" etiketiyle seçili gelir, `<script>` içeren görev adı kaçışlanır, boş girdi "görev yok" verir; `index.html` metninde `id="gorev-modelleri"`, `gorevModelleriHtml` ve `/api/gorev-model` geçer.

## Faz 18 — Koşturucu sertleştirme (2026-11-10; kullanıcı kararıyla Claude elle yaptı)
Bulgu: adım 121 kapıyı geçti ama regresyonu bozdu (elle düzeltildi); adım 105/108'de model `test/hepsi.sh` koşup 600 sn'yi yaktı (yürütücü süresinin %54'ü); Claude'un CLAUDE.md'si ve skill listesi yürütücüye gidiyordu (ilk istek 21k token; yalıtımla boş depoda 8,7k); kurallar dört yerde kopyaydı. Gerekçeler `docs/gunluk.md` yerine burada, kısa.
- [x] 122. Kapı sonrası regresyon: adım kapısı geçince hızlı regresyon, kırılırsa `neden: regresyon` + ipucu
  - Yürütücü: claude
  - Kapı: `bash test/mdk-adim.test.sh regresyon_sonra`
- [x] 123. Yasaklar izinde: kod görevinde kapı dosyaları yazılamaz, hepsi.sh/stash/push koşulamaz; kapı görevinde yalnız eksik kapı dosyası
  - Yürütücü: claude
  - Kapı: `bash test/mdk-adim.test.sh izin_kural`
- [x] 124. Yürütücü yalıtımı: kurallar `yurutucu-kurallar.md`'den isteme (cursor dahil), `OPENCODE_DISABLE_CLAUDE_CODE=1`, PLAN `Kurallar` bloğu istemde
  - Yürütücü: claude
  - Kapı: `bash test/mdk-adim.test.sh izin_kural`
- [x] 125. Tek koşu döngüsü (`calistir`) ve kapı üretim metriği (`tur: kapi`), panel anlık görüntüsünde `kapiUretim`
  - Yürütücü: claude
  - Kapı: `bash test/mdk-adim.test.sh kapi_metrik && node panel/kapi-uretim.test.mjs`
- [x] 126. Doğru nedenle kırmızı: sözdizimi bozuk / kod yazılmadan yeşil kapı reddedilir; yalnız kaynak metni arayan kapıya UYARI
  - Yürütücü: claude
  - Kapı: `bash test/mdk-adim.test.sh kapi_sozdizimi && node test/kapi-denetle.test.mjs`
- [x] 127. Kurallar tek kaynakta: `esit/` → `mdk-esitle.sh` kopyalar; CLAUDE.md kısa kurallar, tarihçe `docs/gunluk.md`; kural dosyalarında model adı yok
  - Yürütücü: claude
  - Kapı: `bash test/mdk-esitle.test.sh`
Ertelenenler: opencode plugin'i (izin kalıpları aynı korumayı veriyor; kurcalama verisi yok), otomatik model sıralama (ölçüm az), koşturucuyu Node'a taşıma.
Doğrulanacak (ilk gerçek adımda): ilk istek girdi token'ı 21k'dan ne kadar düştü; izin reddi alan model toparlanıyor mu; cursor dalı kuralları izliyor mu.

## Faz 19 — Figma'lı iki aşamalı onay (2026-11-11)
Akış: kullanıcı özellik ister → (persona) → Claude `etki/<ad>.html` önce/sonra taslağı → panelde **taslak onayı** → Claude Figma'daki orijinal panel tasarımını günceller ve adıma `- Figma: <url>` yazar → etki alanında "Figma güncellendi · Figma'da aç" → kullanıcı Figma'ya elle bakar → panelde **adım onayı** → `- Onay: evet` + `mdk-adim.sh`. Karar türü iki aşamada da `onay`; aşamayı adımda `- Figma:` satırının varlığı belirler.
- [x] 128. Etki kartında Figma aşaması: `- Figma:` alanı, "Figma güncellendi" satırı, aşamaya göre onay düğmesi
  - Ne: `panel/plan.mjs:35-63`: adım nesnesine `figma: null`; `- Figma: <url>` satırını oku (alan regex'ine `Figma` ekle); yalnız `https://www.figma.com/` ya da `https://figma.com/` ile başlayan değer kabul edilir, aksi `null`. `panel/durum.mjs:178-190`: etki kaydına `figma: a.figma ?? null` ekle. `panel/ciz.mjs:697-745` `kararBolum`/`etkiKart`: `e.figma` varsa karar formunun üstünde `<p class="figma-bilgi">Figma güncellendi · <a href="<url>" target="_blank" rel="noopener">Figma'da aç ↗</a></p>` (url `esc` ile) ve onay düğmesinin metni "Adımı onayla"; `e.figma` yoksa düğme metni "Taslağı onayla" ve figma satırı yok. Düğmenin `value="onay"` değişmez; biten adımda karar bölümü yok, onaylı adımda "onaylandı" davranışı aynen korunur (figma satırı onaylı adımda da görünür).
  - Kapı: `node panel/figma-onay.test.mjs` — `parse()`'a iki adımlı fikstür metni verir: `- Figma: https://www.figma.com/design/abc?node-id=1-2` olan adımda `figma` o url; `- Figma: https://kotu.example.com/x` olan adımda `figma === null`; satırı olmayan adımda `null`. `etkiKartiHtml({no:5,baslik:'x',dosya:'etki/x.html',figma:'https://www.figma.com/design/abc?a=1&b="2"',onay:false,bitti:false})` çıktısında `Figma güncellendi`, `target="_blank"`, `Adımı onayla` var, `Taslağı onayla` yok ve href'teki `"` kaçırılmış (`&quot;`); `figma:null` ile `Taslağı onayla` var, `Figma güncellendi` yok; `onay:true` ile `onaylandı` ve `Figma güncellendi` var, `<form` yok; `bitti:true` ile `<form` yok.

- [ ] 129. Karar şeridi: bekleyen karar varken kartların altında tek satır, tık ilk bekleyen adımın çekmecesini açar
  - Etki: etki/karar-seridi.html
  - Değer: 4
  - Persona: persona-tur/20261111-171725
  - Figma: https://www.figma.com/design/ov6dUo0vLvaZXGgBout9L2?node-id=18-1512
  - Ne: Persona turu (persona-tur/20261111-171725, üç kart da aynı yönde) ayrı Onay kartı yerine koşullu şeridi seçti. `panel/ciz.mjs` (`kpiHtml` ~455-483 yanına) `export function kararSeridiHtml(etki)`: `etki` dizisinde `!bitti && !onay` kayıtları "bekleyen"; hiç yoksa `''` döner. Varsa `<button type="button" class="karar-seridi" data-adim="<ilk bekleyenin no>">` içinde `<n> adım karar bekliyor · <no> <başlık>: <aşama> →`; aşama `figma` doluysa "adım onayı", değilse "taslak onayı"; ilk bekleyen = en küçük `no`; başlık `esc` ile. `panel/index.html`: `<section id="kpi">` (384) altına `<div id="karar-seridi"></div>`; her `kpiEl.innerHTML = kpiHtml(...)` yapılan yerde (684, 834) şerit de `kararSeridiHtml(d.etki)` ile yenilenir (import satırı 458'e ekle); şerit tıklanınca `drawerAc(Number(data-adim))`. Kısa CSS: turuncu açık zemin, tam genişlik, sol hizalı, tek satır.
  - Kapı: `node panel/karar-seridi.test.mjs` — `kararSeridiHtml([])` ve yalnız `bitti:true` ya da `onay:true` kayıtlarla `''`; `[{no:131,baslik:'B',bitti:false,onay:false,figma:null},{no:129,baslik:'A <x>',bitti:false,onay:false,figma:null}]` → `2 adım karar bekliyor`, `data-adim="129"`, `taslak onayı`, `A &lt;x&gt;` var, `<x>` yok; ilk bekleyende `figma:'https://www.figma.com/design/k'` ile `adım onayı` var, `taslak onayı` yok; `panel/index.html` metni `kararSeridiHtml` içerir ve `id="karar-seridi"` öğesi `id="kpi"` öğesinden sonra gelir.

- [x] 130. Açık adım çekmecesi canlı güncellenir (persona, Figma, onay, karar değişince)
  - Ne: Sorun: `panel/index.html:556-577` `drawerAc` çekmeceyi yalnız açılışta çiziyor; adıma sonradan `- Persona:`/`- Figma:` eklenince ya da karar/onay değişince açık çekmece eski kalıyor. `panel/ciz.mjs` (`drawerHtml` ~314 yanına) `export function drawerImza(adim, etki)`: adımın `persona`, `bitti` alanları ile etki kaydının `figma`, `onay`, `bitti`, `karar?.ts`, `alindi` alanlarından kararlı bir metin üretir (eksik/null girdiler hata vermez; aynı girdi → aynı imza, bu alanlardan biri değişince farklı imza; başka alanlar (ör. `baslik`) imzayı değiştirmez). `panel/index.html`: import satırına (458) `drawerImza` ekle; `drawerAc` sonunda açık adımın imzasını `drawerSonImza`'ya yaz; canlı çizimde (`kpiEl.innerHTML = kpiHtml(d, araVeri)` ~684 sonrası) `drawerAdim != null` ise yeni imzayı hesapla, farklıysa ve çekmecedeki `textarea[name=metin]` boşsa `drawerAc(drawerAdim)` çağır (not yazılıyorsa dokunma).
  - Kapı: `node panel/drawer-imza.test.mjs` — `drawerImza` için: aynı girdiyle iki çağrı eşit; `persona` null→'persona-tur/x' değişince farklı; etki `figma` null→url farklı; `onay` false→true farklı; `karar` null→{ts:5} farklı; yalnız `baslik` değişince eşit; `drawerImza(null, null)` ve `drawerImza({no:1}, undefined)` hata vermez. `panel/index.html` metni `drawerImza(` çağrısını ve `textarea[name=metin]` denetimini içerir.

## Sonraki iyileştirmeler
- Kapıları (testleri) belirleme biçimini iyileştir: şu an adım başına dar, tek komut. Hedef: yapılan geliştirmeyi kapsayan (başarı/hata/sınır durumu, kullanıcı senaryosu) net kapılar.
- Personalar (2026-10-27, adım 31-39 ve 58): `personalar.md` v2 üç alan, `persona-tur.sh` ile OpenCode'da ücretsiz modelle çalışıyor. Üç alan da gerçek kararla denendi (adım 36-38, 60-61); sessiz model 60 sn sonra atlanır (adım 59, `PERSONA_ILK`).
- Gözlem: adım 7 yaklaşık 730 bin token harcadı (diğerleri 40-140 bin); adım başına token bütçesi ve dar adım kuralı düşünülebilir.
