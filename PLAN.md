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

- [x] 129. Karar şeridi: bekleyen karar varken kartların altında tek satır, tık ilk bekleyen adımın çekmecesini açar
  - Etki: etki/karar-seridi.html
  - Değer: 4
  - Persona: persona-tur/20261111-171725
  - Figma: https://www.figma.com/design/ov6dUo0vLvaZXGgBout9L2?node-id=18-1512
  - Onay: evet
  - Ne: Persona turu (persona-tur/20261111-171725, üç kart da aynı yönde) ayrı Onay kartı yerine koşullu şeridi seçti. `panel/ciz.mjs` (`kpiHtml` ~455-483 yanına) `export function kararSeridiHtml(etki)`: `etki` dizisinde `!bitti && !onay` kayıtları "bekleyen"; hiç yoksa `''` döner. Varsa `<button type="button" class="karar-seridi" data-adim="<ilk bekleyenin no>">` içinde `<n> adım karar bekliyor · <no> <başlık>: <aşama> →`; aşama `figma` doluysa "adım onayı", değilse "taslak onayı"; ilk bekleyen = en küçük `no`; başlık `esc` ile. `panel/index.html`: `<section id="kpi">` (384) altına `<div id="karar-seridi"></div>`; her `kpiEl.innerHTML = kpiHtml(...)` yapılan yerde (684, 834) şerit de `kararSeridiHtml(d.etki)` ile yenilenir (import satırı 458'e ekle); şerit tıklanınca `drawerAc(Number(data-adim))`. Kısa CSS: turuncu açık zemin, tam genişlik, sol hizalı, tek satır.
  - Kapı: `node panel/karar-seridi.test.mjs` — `kararSeridiHtml([])` ve yalnız `bitti:true` ya da `onay:true` kayıtlarla `''`; `[{no:131,baslik:'B',bitti:false,onay:false,figma:null},{no:129,baslik:'A <x>',bitti:false,onay:false,figma:null}]` → `2 adım karar bekliyor`, `data-adim="129"`, `taslak onayı`, `A &lt;x&gt;` var, `<x>` yok; ilk bekleyende `figma:'https://www.figma.com/design/k'` ile `adım onayı` var, `taslak onayı` yok; `panel/index.html` metni `kararSeridiHtml` içerir ve `id="karar-seridi"` öğesi `id="kpi"` öğesinden sonra gelir.

- [x] 130. Açık adım çekmecesi canlı güncellenir (persona, Figma, onay, karar değişince)
  - Ne: Sorun: `panel/index.html:556-577` `drawerAc` çekmeceyi yalnız açılışta çiziyor; adıma sonradan `- Persona:`/`- Figma:` eklenince ya da karar/onay değişince açık çekmece eski kalıyor. `panel/ciz.mjs` (`drawerHtml` ~314 yanına) `export function drawerImza(adim, etki)`: adımın `persona`, `bitti` alanları ile etki kaydının `figma`, `onay`, `bitti`, `karar?.ts`, `alindi` alanlarından kararlı bir metin üretir (eksik/null girdiler hata vermez; aynı girdi → aynı imza, bu alanlardan biri değişince farklı imza; başka alanlar (ör. `baslik`) imzayı değiştirmez). `panel/index.html`: import satırına (458) `drawerImza` ekle; `drawerAc` sonunda açık adımın imzasını `drawerSonImza`'ya yaz; canlı çizimde (`kpiEl.innerHTML = kpiHtml(d, araVeri)` ~684 sonrası) `drawerAdim != null` ise yeni imzayı hesapla, farklıysa ve çekmecedeki `textarea[name=metin]` boşsa `drawerAc(drawerAdim)` çağır (not yazılıyorsa dokunma).
  - Kapı: `node panel/drawer-imza.test.mjs` — `drawerImza` için: aynı girdiyle iki çağrı eşit; `persona` null→'persona-tur/x' değişince farklı; etki `figma` null→url farklı; `onay` false→true farklı; `karar` null→{ts:5} farklı; yalnız `baslik` değişince eşit; `drawerImza(null, null)` ve `drawerImza({no:1}, undefined)` hata vermez. `panel/index.html` metni `drawerImza(` çağrısını ve `textarea[name=metin]` denetimini içerir.

- [x] 132. `mdk-figma.sh`: Talk to Figma aktarıcısını kur / başlat / durdur / durum, analitiksiz eklentiyi yerleştir
  - Ne: Figma MCP kotası (Starter+View ayda 20) yerine Talk to Figma (grab/cursor-talk-to-figma-mcp, commit `ddd90f3`) kullanılıyor; Claude onu MCP ile, Figma eklentisi WebSocket aktarıcısı (port 3055) ile konuşur. Yeni `mdk-figma.sh` (~110 satır, `mdk-panel.sh` kalıbında: PID ile yönetim, `pkill -f` yok). Ortam: `MDK_TTF_DIR` (varsayılan `$HOME/projects/cursor-talk-to-figma-mcp`), `MDK_BUN` (varsayılan `bun`), `MDK_FIGMA_PID` (varsayılan `$HOME/.local/share/talk-to-figma/socket.pid`; log aynı klasörde `socket.log`), `MDK_FIGMA_PORT` (varsayılan 3055). Alt komutlar: `start`: zaten çalışıyorsa `zaten çalışıyor pid=…` ve 0; değilse `$MDK_TTF_DIR` içinde `setsid nohup "$MDK_BUN" run src/socket.ts` arka planda, PID dosyasına yazar, 0.5 sn sonra canlı değilse log son 2 satırla hata ve 1; canlıysa `başlatıldı pid=… port=…`. `stop`: çalışmıyorsa `çalışmıyor` ve 0; çalışıyorsa PID'i öldürür, en çok 2 sn bekler, PID dosyasını siler, `durduruldu pid=…`. `durum`: `çalışıyor pid=…` (0) ya da `çalışmıyor` (3). `eklenti [hedef]`: `$MDK_TTF_DIR/src/cursor_mcp_plugin/` içinden `code.js ui.html setcharacters.js` dosyalarını hedefe kopyalar ve `figma/eklenti-manifest.json`'u (betiğin klasörüne göre) `manifest.json` olarak koyar; hedef verilmezse `/mnt/c/Users/<cmd.exe'den %USERNAME%>/talk-to-figma-eklenti` (WSL; `/mnt/c` yoksa `$HOME/talk-to-figma-eklenti`); sonunda manifest yolunu basar (`wslpath -w` varsa Windows biçiminde). `kur`: `$MDK_TTF_DIR` yoksa `git clone https://github.com/grab/cursor-talk-to-figma-mcp` + `git checkout ddd90f3`; `figma/talk-to-figma.patch` uygulanmamışsa (`git apply --reverse --check` başarısızsa) `git apply` ile uygular; `BUN_CONFIG_REGISTRY` yoksa `https://registry.yarnpkg.com` ile `"$MDK_BUN" install`; ardından `eklenti` adımını çalıştırır ve kullanıcının çalıştıracağı `claude mcp add --scope user TalkToFigma -- bun $MDK_TTF_DIR/src/talk_to_figma_mcp/server.ts` satırını basar. Bilinmeyen alt komut: kullanım metni, çıkış 2.
  - Kapı: `bash test/mdk-figma.test.sh` — ağ ve gerçek bun kullanmaz: geçici `MDK_TTF_DIR` içinde `src/socket.ts` ve `src/cursor_mcp_plugin/{code.js,ui.html,setcharacters.js}` taklitleri; `MDK_BUN` = `run` argümanıyla `sleep 300` yapan taklit betik; geçici `MDK_FIGMA_PID`. Doğrular: `durum` başta çıkış 3 + `çalışmıyor`; `start` çıkış 0 + `başlatıldı`, PID dosyası var ve süreç canlı; ikinci `start` `zaten çalışıyor`; `durum` 0 + `çalışıyor`; `stop` sonrası süreç ölü, PID dosyası yok, `durduruldu`; ikinci `stop` `çalışmıyor` ve 0; hemen ölen taklit bun (`exit 1`) ile `start` çıkış 1; `eklenti <geçici hedef>` üç dosyayı ve `manifest.json`'u koyar, manifest geçerli JSON ve `google-analytics` içermez, `allowedDomains` `ws://localhost:3055` içerir; `mdk-figma.sh xyz` çıkış 2.

## Faz 20 — Kapı üretimi özeti (2026-11-11)
Kullanıcı isteği: Modeller sekmesinde hangi model kaç kapı yazdı, kaçı kabul/reddedildi ve neden, kota sessizliği, ortalama süre. Veri anlık görüntüde (`kapiUretim`, adım 125) hazır, çizilmiyor.
- [x] 133. Modeller sekmesinde "Kapı üretimi" özeti (testi hangi model yazdı, kabul/ret nedeni, kota, ort. süre)
  - Etki: etki/kapi-uretim.html
  - Değer: 4
  - Persona: persona-tur/20261111-232708
  - Figma: https://www.figma.com/design/ov6dUo0vLvaZXGgBout9L2?node-id=65-24
  - Onay: evet
  - Ne: Persona turu (A/B/C): minimalist ve bakımcı C (yalnız rozet) dedi, dikkati dağınık kullanıcı A (ayrı tablo); kimse B'yi (kod başarısıyla aynı tablo) istemedi. Kullanıcı ret nedeni ve kotayı istediği için A seçildi, C'nin uyarısı alındı: az örnekte "sırayı henüz değiştirme". `panel/ciz.mjs:430-458` (`gorevModelleriHtml` hemen altına) `export function kapiUretimHtml(kapiUretim)`: boş/undefined/dizi değil → `<p class="bos">henüz kapı üretilmedi</p>`; değilse önce `<p class="not">kabul = sözdizimi temiz, kod yazılmadan kırmızı · kabul % kod başarısı değildir</p>`, sonra tablo; satırlar `deneme` azalan (eşitse model adı artan); sütunlar: model, deneme, kapı kabul (`<kabul> / <deneme> · %<Math.round>`; deneme 0 ise `—`), ret nedenleri (`nedenler` nesnesinden `<etiket> ×<sayı>`, `, ` ile; yoksa `—`; etiketler: `kapi_yesil`→"kod yazılmadan yeşil", `kapi_sozdizimi`→"sözdizimi bozuk", `kapi_eksik`→"dosya yazılmadı", `kapi_kapsam`→"başka dosyaya yazdı", bilinmeyen kod olduğu gibi), kota (`sessiz`), ort. sn (`ortSure` `Math.round`, null ise `—`); `deneme < 5` ise model hücresinde `<span class="rozet az-ornek">az örnek · sırayı henüz değiştirme</span>`. Tüm metinler `esc` ile. `panel/index.html`: 416 (`<p id="gorev-hata" …>`) sonrasına `<h2>Kapı üretimi</h2><section id="kapi-uretim"></section>`; 461 import satırına `kapiUretimHtml`; 467-468 yanına `const kapiUretimEl = document.getElementById('kapi-uretim');`; 720 (`gorevModelleriEl.innerHTML = …`) altına `kapiUretimEl.innerHTML = kapiUretimHtml(d.kapiUretim);`. CSS (`.rozet` ~73-82 yanına): `.rozet.az-ornek` turuncu açık zemin, koyu turuncu yazı.
  - Kapı: `node panel/kapi-uretim-ui.test.mjs` — `kapiUretimHtml([])`, `kapiUretimHtml(undefined)` ve `kapiUretimHtml(null)` → `henüz kapı üretilmedi`; girdi `[{model:'opencode/a',deneme:2,kabul:1,sessiz:1,nedenler:{kapi_yesil:1},ortSure:91.4},{model:'opencode/b<x>',deneme:6,kabul:6,sessiz:0,nedenler:{},ortSure:74}]` → b satırı a satırından önce gelir; `1 / 2 · %50`, `6 / 6 · %100`, `kod yazılmadan yeşil ×1`, `91`, `kabul % kod başarısı değildir` var; `az örnek` tam bir kez geçer (yalnız a satırında); `b&lt;x&gt;` var, `b<x>` yok; `nedenler:{zzz:2,kapi_eksik:1}` → `zzz ×2` ve `dosya yazılmadı ×1`; `deneme:0,kabul:0` → `—` içerir, `NaN` içermez; `ortSure:null` → `NaN` içermez. `panel/index.html` metninde `id="kapi-uretim"` öğesi `id="gorev-modelleri"` öğesinden sonra gelir ve `kapiUretimHtml(d.kapiUretim)` çağrısı vardır.

- [x] 134. Akış'ta adım durumu = akıştaki aşama: neyi beklediğini söyleyen rozet ve aşamaya göre ilerleme
  - Ne: Sorun: koşturucu `durum.json`'a `regresyon, persona, kapi_yaziliyor, calisiyor, gecti, kapi_hata, regresyon_kirmizi, ortam_hatasi, saglayici, kilit, eskale` yazıyor; panel yalnız `calisiyor`/`regresyon`u tanıyıp gerisini "bekliyor" %0 gösteriyor (adım 133 kapı yazılırken "bekliyor" göründü). Onay bekleyen adım da "bekliyor" diyor, neyi beklediği görünmüyor. `panel/ciz.mjs:38-51`: `adimDurumu` yerine `export function adimAsama(adim, simdi, etki)` → `{ sinif, etiket, yuzde }` (`sinif` ∈ `bitti, calisiyor, bekliyor, karar, hata, eskale`). Kural sırası: (1) `adim.bitti` → `bitti`, "bitti", 100. (2) `simdi && simdi.adim === adim.no` ise `simdi.durum`a göre: `regresyon`→calisiyor "ön regresyon" 45; `persona`→calisiyor "persona turu" 40; `kapi_yaziliyor`→calisiyor "kapı yazılıyor" 55; `calisiyor` ya da boş→calisiyor "kod yazılıyor" 75; `gecti`→bitti "bitti" 100; `eskale`→eskale "eskale" 100; `kapi_hata`→hata "kapı üretilemedi" 55; `regresyon_kirmizi`→hata "ön regresyon kırmızı" 45; `ortam_hatasi`→hata "ortam hatası" 75; `saglayici`→hata "sağlayıcı yanıt vermiyor" 75; `kilit`→hata "modeller kilitli" 75; bilinmeyen değer→calisiyor, etiket değerin kendisi, 50. (3) `etki` (o adımın etki kaydı: `{onay, figma, karar}`) varsa: `onay` true→bekliyor "sırada" 35; `figma` dolu→karar "adım onayı bekliyor" 30; `karar?.tur === 'onay'`→karar "Figma bekleniyor" 20; `karar?.tur === 'red'`→karar "taslak düzeltiliyor" 10; aksi→karar "taslak onayı bekliyor" 10. (4) aksi→bekliyor "sırada" 0. Null/eksik girdiler hata vermez. `ROZETLER` yerine `rozet(sinif, etiket)` metni `etiket`ten alır (`esc`); etiket yoksa eski eşleme (`calisiyor`→"çalışıyor" vb.) kalır. `akisTablosuHtml(plan, simdi, gecmis, incelemeler, etki = [])` (`ciz.mjs:265-310`): durum/ilerleme `adimAsama(a, simdi, etki.find(e => e.no === a.no))`'dan; satır sınıfı ve rozet `sinif`, çubuk genişliği ve `%` metni `yuzde`; model/deneme meta satırı `sinif === 'calisiyor'` iken `simdi`den (eskisi gibi). `drawerHtml` (`ciz.mjs:330-365`): `a.etiket` varsa rozet metni o, sınıf `a.sinif ?? eski hesap`. `panel/index.html`: 691 `akisTablosuHtml(…, sonD?.etki || [])`; `drawerAdimNesnesi` (541-563) `adimAsama`yı kullanır (`durum`, `sinif`, `etiket`, `yuzde` ondan; `calisiyor` = `sinif === 'calisiyor'`); 466 import satırına `adimAsama`; CSS 83 yanına `.rozet.karar` (turuncu açık zemin, koyu turuncu yazı) ve `.rozet.hata` (kırmızı açık zemin, koyu kırmızı yazı), açık ve koyu tema değişkenleriyle.
  - Kapı: `node panel/adim-asama.test.mjs` — `adimAsama` için tablodaki her durum: `{no:5,bitti:true}`→bitti/100; `simdi {adim:5,durum:'kapi_yaziliyor'}`→calisiyor, "kapı yazılıyor", 55; `regresyon`→45 "ön regresyon"; `calisiyor`→"kod yazılıyor" 75; `kapi_hata`→hata; `saglayici`→hata "sağlayıcı yanıt vermiyor"; `eskale`→eskale 100; `simdi.adim` başka adımken etki kuralları geçerli; etki `{onay:false,figma:null,karar:null}`→karar "taslak onayı bekliyor" 10; `karar:{tur:'onay'}`→"Figma bekleniyor" 20; `figma:'https://www.figma.com/design/k'`→"adım onayı bekliyor" 30; `onay:true`→bekliyor "sırada" 35; `karar:{tur:'red'}`→"taslak düzeltiliyor"; etki yok→"sırada" 0; `adimAsama(null, null, null)` ve `adimAsama({no:1}, undefined)` hata vermez. `akisTablosuHtml` iki adımlı planla (`simdi {adim:1,durum:'kapi_yaziliyor',model:'m',deneme:1}`, etki `[{no:2,onay:false,figma:'https://www.figma.com/design/k',karar:{tur:'onay'}}]`): 1. satırda `rozet calisiyor`, "kapı yazılıyor", `%55`, `width:55%` ve `m`; 2. satırda `rozet karar`, "adım onayı bekliyor", `%30`; etki parametresi verilmeden eski çağrı çökmez. `drawerHtml({no:3,baslik:'x',sinif:'hata',etiket:'kapı üretilemedi',yuzde:55}, null)` → `rozet hata` ve "kapı üretilemedi". `panel/index.html` metninde `adimAsama(` ve `.rozet.karar` geçer.

## Epic 21 — Geliştirme görünümü: Epic, Story ve persona tartışması (2026-11-14)
- Durum: gelistirme
Kullanıcı tarifi (Yalın Kip). Arayüzde Faz = Epic, Adım = Story. İş chat'ten gelir → Epic açılır → kullanıcı isterse personalar tartışıp çözümde anlaşır (tahmini story listesiyle) → kullanıcı panelde onaylar → ancak sonra story'ler yazılır ve koşar. Epic akışının sahibi metin kuralı değil `mdk-epic.mjs` komutudur. Epic alanları başlığın altında, ilk story'den önce: `- Durum: analiz|tasarim|gelistirme`, `- Tartışma: epic/<no>`, `- Etki:`, `- Figma:`, `- Onay: evet`. Tartışma kaydı `epic/<no>/{is.md,tartisma.json}` git'te. Kapsam dışı (ayrı Epic): personaların yeniden tasarımı, story bölme kuralı, panelden iş girişi, bash koşturucuların Node'a taşınması.
- [x] 135. Epic alanları ve statüsü: ayrıştırıcı + anlık görüntü
  - Ne: `panel/plan.mjs:19-63,88-93`: `## ` başlığında kategori nesnesi `{ ad, no, durum: null, tartisma: null, etki: null, figma: null, onay: false, adimlar: [] }` olur. `no`: başlık `Epic 21 — x` ya da `Faz 12.1 — x` biçimindeyse metin olarak `'21'` / `'12.1'`, aksi `null`. Alan satırları (`- Durum:`, `- Tartışma:`, `- Etki:`, `- Figma:`, `- Onay: evet`) kategori başlığından sonra ve o kategorinin ilk adımından önce gelirse (yani `adim === null` ve `kategori` varken) kategoriye yazılır: `durum` yalnız `analiz`, `tasarim`, `gelistirme` (başka değer `null`); `tartisma` yalnız `epic/` ile başlayan ve `..` içermeyen yol (aksi `null`); `figma` adımdaki kuralla aynı (yalnız figma.com, aksi `null`); `etki` kırpılmış metin; `onay` `true`. Bir adımın altındaki `- Durum:` / `- Tartışma:` yok sayılır; adım alanlarının bugünkü davranışı değişmez. Sondaki süzgeç: adımı olan YA DA `durum`'u `null` olmayan kategori kalır (adımsız Analiz Epic'i listede). `export function epicDurum(kat)`: adımı var ve hepsi `bitti` → `'tamamlandi'`; değilse `kat.durum` doluysa o; değilse adımı varsa `'gelistirme'`; yoksa `'analiz'`; `null`/eksik girdi `'analiz'`. `panel/durum.mjs:14,147-195`: `sonuc` başlangıcına `epikler: []`; plan varsa her kategori için (dosya sırasıyla) `{ no, ad, statu: epicDurum(k), biten, toplam, tartisma, etki, figma, onay, karar, alindi }`: `biten`/`toplam` adım sayıları; `tartisma` = `k.tartisma` yoksa `null`, varsa `{ yol: k.tartisma, durum }` (`durum` = `<dir>/<yol>/tartisma.json` içindeki `durum` alanı; dosya yok ya da bozuksa `null`); `karar` = `kararlar(dir)` içinde `epic === k.no` olan son kayıt (`k.no` `null` ise ya da kayıt yoksa `null`); `alindi` = `karar !== null && karar.ts <= isaret` (etki kaydındaki kuralla aynı).
  - Kapı: `node panel/epic-plan.test.mjs` — `parse()` fikstür metinle: `## Epic 22 — Müşteri` altında `- Durum: analiz`, `- Tartışma: epic/22`, `- Etki: etki/m.html`, `- Figma: https://www.figma.com/design/abc`, `- Onay: evet` ve hiç adım yok → kategori listede, `no === '22'`, `durum === 'analiz'`, `tartisma === 'epic/22'`, `etki === 'etki/m.html'`, `figma` o url, `onay === true`; `## Faz 12.1 — x` → `no === '12.1'`; `## Panel` → `no === null`; `- Durum: uydurma` → `durum === null`; `- Tartışma: ../x` ve `- Tartışma: baska/22` → `tartisma === null`; `- Figma: https://kotu.example.com/x` → `figma === null`; alanı da adımı da olmayan başlık listede yok; adım altındaki `- Etki: etki/a.html` adıma yazılır, kategorinin `etki`'si `null` kalır; adım altındaki `- Onay: evet` kategorinin `onay`'ını değiştirmez. `epicDurum`: tüm adımları biten → `tamamlandi` (durum `gelistirme` yazsa bile); `{durum:'tasarim', adimlar:[]}` → `tasarim`; durumsuz + açık adımlı → `gelistirme`; durumsuz + adımsız → `analiz`; `epicDurum(null)` → `analiz`. `snapshot()` geçici dizinde (PLAN.md + `epic/22/tartisma.json` içeriği `{"durum":"bitti"}` + `etki/kararlar.jsonl` içinde `{"ts":5,"epic":"22","tur":"onay","metin":""}` + `etki/.karar-okundu` içeriği `9`): `epikler` dizisinde Epic 22 kaydı `statu === 'analiz'`, `tartisma.durum === 'bitti'`, `karar.tur === 'onay'`, `alindi === true`, `biten === 0`, `toplam === 0`; `tartisma.json` bozuk JSON iken `tartisma.durum === null`; PLAN.md yokken `epikler` boş dizi ve hata yok.

- [ ] 136. Geliştirme sekmesi: Epic satırı + akordiyon story tablosu
  - Ne: `panel/ciz.mjs:300-338`: story satırı (`<tr class="adim-satir …" data-adim>`) üretimini `akisTablosuHtml` içinden bir yardımcıya al; `akisTablosuHtml`'in çıktısı ve imzası DEĞİŞMEZ. Altına `export function gelistirmeHtml(plan, simdi, gecmis, incelemeler, etki = [], epikler = [], acik = {})`: `plan` yoksa `<span class="bos">PLAN.md bulunamadı</span>`. Her kategori (Epic) için, `sira` = `plan.kategoriler` içindeki dizin: `<div class="epic-satir" data-epic="<sira>" tabindex="0" aria-expanded="true|false">` içinde `<span class="epic-ad">` (ad, `esc`), `<span class="epic-ilerleme">` (`<biten> / <toplam>`), `<span class="rozet epic-<statu>">` (metin: `analiz`→"Analiz", `tasarim`→"Tasarım", `gelistirme`→"Geliştirme", `tamamlandi`→"Tamamlandı") ve Epic'in `no`'su varsa `<button type="button" class="epic-detay" data-epic-no="<no>">Detay</button>`. Epic kaydı `epikler.find(e => e.ad === kat.ad)`; `statu` ondan, kayıt yoksa: adımı var ve hepsi bitti → `tamamlandi`, adımı var → `gelistirme`, yok → `analiz`. Uyarı: kayıt `tartisma?.durum === 'bitti' && !onay` ve statü `tamamlandi` değilse düğme sınıfı `epic-detay uyari`, metni `Detay · çözüm onayı bekliyor`; değilse Epic'in adımlarından `etki` dizisinde `!bitti && !onay` kaydı olan `n > 0` ise `epic-detay uyari`, `Detay · <n> story karar bekliyor`. Açık mı: `acik[sira]` boolean ise o, değilse statü `tamamlandi` değilse açık. Açık Epic'te satırın ardından `<div class="epic-govde">` içinde story tablosu (`akisTablosuHtml` ile aynı satırlar, yalnız o Epic'in adımları, yeni adım üstte, ilk sütun başlığı `Story`); adımsız Epic'te `<p class="bos">henüz story yok</p>`; kapalı Epic'te `epic-govde` hiç üretilmez. Sıra: statüsü `tamamlandi` olmayanlar önce, sonra tamamlananlar; her grupta dosyada sonra gelen üstte. `panel/ciz.mjs:534-562` `kpiHtml`: `akis` kartının adı `Geliştirme`, alt yazısı `biten story` (`data-sekme="akis"` aynı). `panel/index.html:397-399`: `<h2>Adımlar</h2>` → `<h2>Epic'ler</h2>`; `:458` import satırına `gelistirmeHtml` ekle (`akisTablosuHtml` adı import satırında KALIR); `:683-686` `planCiz` `gelistirmeHtml(sonPlan.plan, sonSimdi, sonPlan.gecmis, sonPlan.incelemeler, sonD?.etki || [], sonD?.epikler || [], epicAcik)` çağırır; `kategorilerEl` tıklamasında (`:579-582`) sıra: `.epic-detay` tıklaması burada işlenmez (138'de bağlanacak), `[data-adim]` tıklaması eskisi gibi `drawerAc`, aksi halde `.epic-satir` tıklaması `epicAcik[sira]`'yı o anki görünen durumun tersine çevirir ve `planCiz()`; Enter tuşu da aynı. CSS (`:338` yanına): `.epic-satir` tam genişlik esnek satır, imleç el, alt çizgi; `.rozet.epic-analiz/tasarim/gelistirme/tamamlandi` var olan rozet renk değişkenleriyle (sırayla karar, calisiyor, calisiyor, bitti); `.epic-detay.uyari` turuncu; `.epic-govde` sol girintili.
  - Kapı: `node panel/gelistirme.test.mjs` — `gelistirmeHtml` için plan: kategoriler `[{ad:'Eski <b>', adimlar:[{no:1,baslik:'A',bitti:true}]}, {ad:'Epic 21 — Yeni', no:'21', adimlar:[{no:2,baslik:'B',bitti:true},{no:3,baslik:'C',bitti:false}]}, {ad:'Epic 22 — Müşteri', no:'22', adimlar:[]}]`, epikler: `[{ad:'Eski <b>',no:null,statu:'tamamlandi'},{ad:'Epic 21 — Yeni',no:'21',statu:'gelistirme',tartisma:null,onay:false},{ad:'Epic 22 — Müşteri',no:'22',statu:'analiz',tartisma:{yol:'epic/22',durum:'bitti'},onay:false}]`. Beklenen: üç `epic-satir`; çıktıda sıra Epic 22, Epic 21, Eski (`data-epic="2"` `data-epic="1"`'den, o da `data-epic="0"`'dan önce); rozet metinleri `Analiz`, `Geliştirme`, `Tamamlandı` ilgili satırda; Epic 21 ilerlemesi `1 / 2`; Epic 22 düğmesinde `uyari` sınıfı ve `çözüm onayı bekliyor`, `data-epic-no="22"`; `no`'su olmayan Eski'de `epic-detay` yok; Epic 21 açık (`data-adim="3"` ve `data-adim="2"` var, 3 önce, başlıkta `Story`); Eski kapalı (`data-adim="1"` yok); Epic 22'de `henüz story yok`; `acik = {0:true, 1:false}` ile `data-adim="1"` var, `data-adim="3"` yok; `Eski &lt;b&gt;` var, `Eski <b>` yok. Epic 22 `onay:true` iken `uyari` yok. `etki = [{no:3,bitti:false,onay:false}]` ile Epic 21 düğmesinde `1 story karar bekliyor`. `epikler` boş verilince Epic 21 `Geliştirme`, Eski `Tamamlandı`, Epic 22 `Analiz`. `gelistirmeHtml(null)` → `PLAN.md bulunamadı`. `kpiHtml({plan})` çıktısında `Geliştirme` ve `biten story` var, `data-sekme="akis"` var. `panel/index.html` metni `gelistirmeHtml(`, `akisTablosuHtml` ve `epic-satir` içerir.

- [ ] 137. Epic kararı altyapısı: kuyruk, sunucu uçları, izleyici
  - Ne: `panel/karar.mjs:4-37`: girdi `no` (pozitif tam sayı) YA DA `epic` (boş olmayan, en çok 20 karakter, yalnız rakam ve nokta içeren metin) taşır; ikisi birden ya da hiçbiri → hata. Türler: `onay`, `red`, `yorum` ve yalnız `epic` ile geçerli `figma` (`no` ile `figma` → hata). Yazılan kayıt `no` ile `{ts,no,tur,metin}` (bugünkü gibi), `epic` ile `{ts,epic,tur,metin}`. `karar-bekle.mjs:28-44`: `karar.epic` varsa satır `epic <epic> <tur>` (metin varsa `epic <epic> <tur>: <metin>`), yoksa bugünkü `adım <no> …`. `panel/sunucu.mjs:122-195` `kararAl`: gövdede `epic` varsa adım araması yerine planda `no === girdi.epic` olan kategori aranır; yoksa ya da `epicDurum` `tamamlandi` ise 404 `Epic yok ya da tamamlanmış`; varsa `kararEkle`. `panel/sunucu.mjs:410-443` yanına `GET /api/epic?no=<no>`: planda o `no`'lu kategori yoksa ya da `tartisma`'sı yoksa 200 `{ no, tartisma: null }`; varsa `<kök>/<tartisma>/tartisma.json` okunur (yol güvenliği `/api/persona` ile aynı: mutlak ya da `..` içeren yol 400, realpath kök dışındaysa 400; dosya yok ya da JSON bozuksa `{ no, tartisma: null }`), 200 `{ no, tartisma: <nesne> }`.
  - Kapı: `node panel/epic-karar.test.mjs` — `kararEkle(kok, {epic:'22', tur:'onay'})` kaydı `{epic:'22',tur:'onay',metin:''}` alanlarıyla `etki/kararlar.jsonl`'a yazar; `{epic:'22', tur:'figma'}` kabul; `{no:5, tur:'figma'}`, `{epic:'22', no:5, tur:'onay'}`, `{tur:'onay'}`, `{epic:'', tur:'onay'}`, `{epic:'../x', tur:'onay'}`, `{epic:'22', tur:'red'}` (metinsiz) hata fırlatır; `{no:5, tur:'onay'}` bugünkü gibi çalışır. Sunucu (`baslat(dizin, 0)`; PLAN.md'de `## Epic 22 — M` + `- Durum: analiz` + `- Tartışma: epic/22`, ayrıca tüm adımları bitmiş `## Epic 20 — Eski`, ve `epic/22/tartisma.json`): `POST /api/karar` `{epic:'22',tur:'onay'}` → 200, dosyada satır; `{epic:'99',tur:'onay'}` → 404; `{epic:'20',tur:'onay'}` → 404; `GET /api/epic?no=22` → 200 ve `tartisma` nesnesi dosyadakiyle eşit; `GET /api/epic?no=99` → 200 `tartisma: null`; `tartisma.json` bozukken `tartisma: null`. `node karar-bekle.mjs <dizin> --bir-kez` çıktısı (çocuk süreçle): `{ts:1,epic:'22',tur:'figma',metin:''}` → `epic 22 figma`; `{ts:2,epic:'22',tur:'yorum',metin:'a\nb'}` → `epic 22 yorum: a b`; `{ts:3,no:5,tur:'onay',metin:''}` → `adım 5 onay`.

- [ ] 138. Epic çekmecesi: tartışma, çözüm, UI/UX etkisi, Figma'da çiz, karar
  - Ne: `panel/ciz.mjs` (`drawerHtml` altına): `export function epicDrawerHtml(epik, tartisma, izleyici = false)`. Başlık: `<span class="etiket">EPIC</span>`, ad, `id="drawer-kapat"` düğmesi, statü rozeti (136'daki metinler). Bölümler sırayla, her biri `<h3 class="drawer-bolum">`: (1) `TARTIŞMA`: `tartisma` yoksa `<p class="bos">bu Epic için persona tartışması yok</p>`; varsa `tartisma.durum === 'suruyor'` iken `<p class="not">tartışma sürüyor…</p>`, `'yetersiz'` iken `<p class="hata">tartışma tamamlanamadı (yeterli yanıt yok)</p>`; `tartisma.neden` doluysa `<p class="not">` içinde; her tur (`tartisma.turlar`: `{tur, ad, mesajlar:[{persona, model, metin}]}`) için `<h4>Tur <tur> · <ad></h4>` ve her mesaj `personaBalonlarHtml`'deki balon işaretlemesiyle (`persona-balon persona-a|b|c`, avatar baş harf, rol, metin; renk personanın `tartisma.personalar` içindeki sırasına göre, aynı persona her turda aynı renk). (2) `ÇÖZÜM`: `tartisma.cozum?.metin` yoksa `<p class="bos">henüz çözüm yok</p>`; varsa küçük çizici: `## başlık` → `<h4>`, `- ` / `* ` / `1. ` ile başlayan satırlar `<ul><li>`, diğer satırlar `<p>`; hepsi `esc` ile, ham HTML geçmez. (3) `UI/UX ETKİSİ`: `epik.etki` varsa `etkiKart`'taki önce/sonra kroki işaretlemesi (`/dosya?yol=…&goster=once|sonra`, `buyut` düğmeleri), yoksa `<p class="bos">taslak yok</p>`; `epik.figma` varsa `<p class="figma-bilgi">` içinde `Figma'da aç ↗` bağlantısı (`target="_blank" rel="noopener"`); statü `tamamlandi` değilse `<form class="epic-karar" data-epic="<no>">` içinde tek düğme `<button type="submit" name="tur" value="figma">Figma'da çiz</button>`. (4) `KARAR`: statü `tamamlandi` ise bölüm yok; `epik.onay` ise `<p class="karar-durum">çözüm onaylandı</p>`; `tartisma?.durum === 'bitti'` ise `<form class="epic-karar" data-epic="<no>">`: `textarea name="metin"` (maxlength 2000), düğmeler `Çözümü onayla` (`value="onay"`), `Reddet` (`red`), `Yorum` (`yorum`), ve `<p class="karar-durum">` içinde son kararın özeti (`kararDurum` ile aynı mantık: tür, saat, metin, "Claude aldı" / "Claude'a iletiliyor" / "kuyrukta"); aksi halde `<p class="bos">karar için önce tartışma bitmeli</p>`. `export function epicImza(epik, tartisma)`: `epik.statu`, `epik.onay`, `epik.figma`, `epik.etki`, `epik.karar?.ts`, `epik.alindi`, `tartisma?.durum`, toplam mesaj sayısı ve `tartisma?.cozum?.metin?.length`'ten kararlı metin; `null` girdiler hata vermez. `panel/index.html` (`drawerAc` yanına): `kategorilerEl` tıklamasında `.epic-detay` → `epicDrawerAc(no)`: `/api/epic?no=` çekilir, `sonD.epikler`'den `no`'su eşleşen kayıtla `epicDrawerHtml` çizilir, çekmece açılır (story çekmecesiyle aynı `#drawer`; `drawerAdim = null`, `drawerEpic = no`); `drawerEl`'de `form.epic-karar` gönderimi `POST /api/karar` `{ epic, tur, metin }` (var olan karar formu işleyicisinin hata/başarı gösterimi kalıbıyla; `figma` formunda metin yok); `ciz(d)` içinde `drawerEpic != null` ise `/api/epic` yeniden çekilir ve `epicImza` değiştiyse, `textarea[name=metin]` boşsa çekmece yeniden çizilir; `drawerKapat` `drawerEpic`'i de sıfırlar. Kısa CSS: `.drawer-ic h4`, `.epic-karar` düğme aralığı.
  - Kapı: `node panel/epic-drawer.test.mjs` — `epik = {no:'22', ad:'Epic 22 — M <x>', statu:'analiz', onay:false, etki:null, figma:null, karar:null, alindi:false}`. `epicDrawerHtml(epik, null)` → `persona tartışması yok`, `henüz çözüm yok`, `taslak yok`, `Figma'da çiz` var, `Çözümü onayla` yok, `M &lt;x&gt;` var. Süren tartışma `{durum:'suruyor', personalar:[{ad:'Ürün Sahibi'},{ad:'Mühendis'}], turlar:[{tur:1, ad:'Değerlendirme', mesajlar:[{persona:'Ürün Sahibi', model:'m', metin:'değer <script>alert(1)</script>'},{persona:'Mühendis', model:'m', metin:'risk'}]}]}` → `tartışma sürüyor`, `Tur 1`, `Değerlendirme`, iki `persona-balon`, `<script>` yok ve `&lt;script&gt;` var, `Çözümü onayla` yok. Biten tartışma (yukarıdaki + `durum:'bitti'`, tur 2'de Mühendis mesajı, `cozum:{metin:'## Çözüm\nTek ekran\n## Tahmini story listesi\n- Tablo\n- Form <b>'}`) → `<h4>` içinde `Çözüm` ve `Tahmini story listesi`, `<li>` içinde `Tablo`, `Form &lt;b&gt;` var, `Çözümü onayla`, `Reddet`, `Yorum` düğmeleri ve `data-epic="22"`; Mühendis'in iki turdaki balonu aynı renk sınıfını taşır. `epik.onay = true` → `çözüm onaylandı`, `Çözümü onayla` yok. `epik.figma = 'https://www.figma.com/design/a?x="1"'` → `Figma'da aç` bağlantısı, tırnak kaçışlı. `epik.etki = 'etki/m.html'` → `goster=once` ve `goster=sonra` içeren iki iframe. `statu:'tamamlandi'` → `Figma'da çiz` ve karar formu yok. `durum:'yetersiz'` → `tartışma tamamlanamadı`. `epicImza`: aynı girdi iki kez eşit; yeni mesaj eklenince, `durum` değişince, `epik.onay` / `epik.figma` / `epik.karar.ts` değişince farklı; yalnız `epik.ad` değişince eşit; `epicImza(null, null)` hata vermez. `panel/index.html` metni `epicDrawerHtml(`, `epicImza(`, `/api/epic` ve `epic-karar` içerir.

- [ ] 139. `epic-tartis.mjs`: personaların üç turlu tartışması
  - Ne: Yeni `epic-tartis.mjs` (~180 satır, yalnız Node yerleşikleri; `persona-takim-tur.mjs:1-43` kalıbı: `oc-sec.mjs` `ocSec()`, `--format json` çıktısından `type === 'text'` olaylarının `part.text`'i). Kullanım (proje kökünde): `node epic-tartis.mjs <no> [--persona "Ad1,Ad2"] [--neden "<metin>"]`. Girdi: `epic/<no>/is.md` (yoksa çıkış 2), `persona/takim.json` (`personalar: [{ad, optimize, korluk, soru}]`; yoksa/boşsa çıkış 2), modeller `PLAN.md`'deki `Görev persona:` satırı (virgülle; yoksa `Modeller:`; ikisi de yoksa çıkış 2). `--persona` verilirse yalnız adı listede geçen personalar (hiçbiri eşleşmezse çıkış 2). Her çağrı: `<oc> run -m <model> --format json --title epic-<no> <istem>`, stdin kapalı, `OPENCODE_LOG_LEVEL=error`, süre `EPIC_SURE` (varsayılan 240 sn; aşılırsa süreç öldürülür); yanıt boşsa aynı istem sıradaki modelle bir kez daha denenir (model sırası persona dizinine göre döndürülür). Tur 1 `Değerlendirme` (tüm personalar paralel, `spawn`): istem persona kartını (ad, optimize, körlük, soru) ve işi verir; "işi YALNIZ kendi merceğinle değerlendir: etki, gereksinim, endişe; en çok 120 kelime; kod ya da dosya değiştirme". Tur 2 `Tartışma` (tur 1'de geçerli yanıt veren personalar paralel): istem kendi tur-1 metnini ve DİĞER personaların tur-1 metinlerini (ad etiketli) içerir; "katıldığın, itiraz ettiğin ve fikrini değiştirdiğin noktayı yaz; en çok 120 kelime". Tur 3 `Uzlaşı` (tek çağrı, tarafsız moderatör): iş + iki turun tüm metinleri; yanıt tam şu başlıklarla istenir: `## Çözüm`, `## UI/UX etkisi`, `## Entegrasyon`, `## Anlaşmazlıklar ve açık sorular`, `## Tahmini story listesi`. Çıktı `epic/<no>/tartisma.json`, her yanıttan sonra yeniden yazılır: `{ epic: '<no>', is, neden, durum, personalar: [{ad}], turlar: [{ tur, ad, mesajlar: [{ persona, model, metin }] }], cozum: { model, metin } | null, ts }`; `durum` başta `suruyor`; tur 1'de geçerli (boş olmayan) yanıt 2'den azsa `yetersiz` yazılır ve çıkış 1 (tur 2 ve 3 koşmaz); tur 3 yanıtı boşsa `yetersiz` ve çıkış 1; aksi `bitti` ve çıkış 0. Boş yanıt veren personanın mesajı diziye eklenmez. Son satır olarak `epic/<no>/tartisma.json` yolunu basar.
  - Kapı: `node test/epic-tartis.test.mjs` — geçici dizinde `PLAN.md` (`Görev persona: m/bir, m/iki`), `persona/takim.json` (Ürün Sahibi, Mühendis, Eleştirmen), `epic/7/is.md`; `MDK_OPENCODE` = testin yazdığı taklit çalıştırılabilir betik: her çağrıda argümanlarını (model ve istem) bir günlük dosyasına ekler ve `{"type":"text","part":{"text":"YANIT <sayaç>"}}` satırı basar; ortam değişkeniyle "şu metni içeren istemde boş dön" ve "şu modelde boş dön" kipleri. Doğrular: olağan koşu çıkış 0, 7 çağrı (3+3+1), `tartisma.json` `durum === 'bitti'`, `turlar.length === 2` ve her turda 3 mesaj, `cozum.metin` dolu, `personalar` 3 ad, `is` is.md içeriği; tur 2 çağrılarının her birinin isteminde diğer iki personanın tur-1 yanıt metni var; tur 3 isteminde `## Tahmini story listesi` geçer; `--persona "Ürün Sahibi,Mühendis"` ile 5 çağrı ve `personalar.length === 2`; `--neden "x"` → `neden === 'x'`; `m/bir` boş dönerken her çağrı `m/iki` ile yeniden denenir ve koşu `bitti`; iki personanın tur-1 yanıtı her modelde boşken çıkış 1, `durum === 'yetersiz'`, tur 2 çağrısı yok; `epic/7/is.md` yokken çıkış 2; `--persona "Yok"` çıkış 2.

- [ ] 140. Koşturucu: çözümü onaylanmamış Epic'in story'si koşmaz
  - Ne: `mdk-adim.sh:93-96` (taslak onayı denetiminin hemen altına): adımın Epic bloğu = `$PLAN`'da adım satırından önceki son `## ` başlığından o başlığın ilk `- [` satırına kadar olan satırlar (awk, adım bloğu kalıbıyla). O blokta `^- Tartışma:` satırı varsa ve `^- Onay: evet` yoksa `echo "adım $N: Epic çözüm onayı bekliyor (panelden onayla; node mdk-epic.mjs karar <no> onay)"; exit 5`. Epic'te `- Tartışma:` yoksa ya da `- Onay: evet` varsa denetim geçer; başka hiçbir davranış değişmez. Üstteki çıkış kodu yorum satırına (`mdk-adim.sh:4`) "5 taslak ya da Epic çözüm onayı bekliyor" yaz.
  - Kapı: `bash test/epic-onay.test.sh` — `test/mdk-figma.test.sh` kalıbında (`kontrol` yardımcıları, geçici dizin, `trap` ile temizlik). Geçici git deposu: `.gitignore` (`.mdk-log/`, `durum.json`, `metrikler.jsonl`), `PLAN.md` (`Yürütücü: opencode`, `Modeller: m/a`, `## Epic 9 — Deneme`, `- Tartışma: epic/9`, `- [ ] 1. İş`, `  - Kapı: \`true\``), ilk commit; `MDK_OPENCODE` = çağrıldığında işaret dosyası yazan taklit betik; `MDK_ONKONTROL_YOK=1`, `MDK_METRIK`/`MDK_DURUM` geçici dosyalar. (a) onaysız: `mdk-adim.sh 1` çıkış 5, çıktıda `Epic çözüm onayı bekliyor`, işaret dosyası YOK, PLAN.md değişmemiş. (b) Epic bloğuna `- Onay: evet` ekleyip commit: çıkış 5 DEĞİL ve çıktıda `Epic çözüm onayı` yok. (c) `- Tartışma:` satırı hiç olmayan Epic: çıkış 5 değil. (d) `- Onay: evet` yalnız BAŞKA bir Epic'in bloğundayken (önceki `## Epic 8` altında) ve Epic 9'da `- Tartışma:` varken: çıkış 5.

- [ ] 141. `mdk-epic.mjs`: Epic akışının sahibi komut
  - Ne: Yeni `mdk-epic.mjs` (~170 satır, yalnız Node yerleşikleri). Okuma `panel/plan.mjs` `parse` + `epicDurum` ile; yazma `panel/gorev.mjs:32-56` `gorevModelYaz` kalıbıyla satır düzeyinde (yalnız ilgili Epic bloğu değişir, dosyanın geri kalanı bayt bayt aynı). Alan satırı Epic başlığının altına, var olan alan satırlarının sonuna eklenir; alan zaten varsa o satır değiştirilir. Her başarılı yazan komut `git add PLAN.md epic/<no>` + `git commit -qm "epic <no>: <komut>"` yapar (git deposu değilse commit atlanır). İzinsiz/hatalı çağrıda hiçbir dosyaya dokunmaz, nedeni stderr'e yazar, çıkış 1; kullanım hatası çıkış 2. Komutlar: `ac "<ad>" <is-dosyası>` → yeni no = plandaki en büyük tam sayı Epic/Faz no + 1; dosyada `## Sonraki iyileştirmeler` başlığı varsa onun hemen önüne, yoksa dosya sonuna `## Epic <no> — <ad>` + `- Durum: analiz` + boş satır ekler; `epic/<no>/is.md`'ye iş dosyasının içeriğini yazar; stdout'a `<no>` basar. `tartis <no> [--persona …] [--neden …]` → Epic yoksa ya da statüsü `analiz` değilse çıkış 1; `node <betik dizini>/epic-tartis.mjs <no> …`'yi (ortam `MDK_EPIC_TARTIS` verilmişse o betiği) argümanları aktararak koşar, çıktısını geçirir; çıkış 0 ise `- Tartışma: epic/<no>` yazar, değilse alan yazmadan aynı çıkış koduyla biter. `karar <no> onay` → Epic'in `tartisma`'sı yoksa ya da `epic/<no>/tartisma.json` `durum`'u `bitti` değilse çıkış 1; `- Onay: evet` ve `- Durum: tasarim` yazar. `gelistir <no>` → Epic'te en az bir adım yoksa çıkış 1; `tartisma` var ve `onay` yoksa çıkış 1; `- Durum: gelistirme` yazar. `figma <no> <url>` → url `https://www.figma.com/` ya da `https://figma.com/` ile başlamıyorsa çıkış 1; `- Figma: <url>` yazar. `durum [no]` → statüsü `tamamlandi` olmayan (ya da verilen) her Epic için tek satır: `Epic <no> · <statü> · sıradaki: <hamle>`; hamle: analiz + tartışma yok → `story yaz ya da tartis`; tartışma `bitti` + onaysız → `kullanıcı onayı bekleniyor`; statü `tasarim` → `story'leri yaz, sonra gelistir`; `gelistirme` → `story koştur (<ilk açık story no>)`; hiçbir dosya yazmaz.
  - Kapı: `node test/mdk-epic.test.mjs` — her vaka geçici git deposunda (ilk commit'li), betik çocuk süreçle koşar. PLAN.md fikstürü: üst ayarlar, `## Faz 20 — Eski` + bitmiş adım 1, `## Sonraki iyileştirmeler` + bir madde. `ac "Müşteri" is.txt` → çıkış 0, stdout `21`; PLAN.md'de `## Epic 21 — Müşteri` ve hemen altında `- Durum: analiz`, başlık `## Sonraki iyileştirmeler`'den ÖNCE; `epic/21/is.md` içeriği is.txt ile aynı; `git log -1` mesajı `epic 21` içerir ve çalışma ağacı temiz; eklenen blok dışındaki tüm satırlar değişmemiş. `durum` → `Epic 21 · analiz · sıradaki: story yaz ya da tartis`. `tartis 21` (`MDK_EPIC_TARTIS` = `epic/21/tartisma.json`'a `{"durum":"bitti"}` yazıp 0 dönen taklit betik) → çıkış 0, PLAN.md'de `- Tartışma: epic/21`; taklit 1 dönerse çıkış 1 ve `- Tartışma:` satırı yok. `karar 21 onay`: tartışma yokken çıkış 1 ve PLAN.md bayt bayt aynı; `tartisma.json` `durum: suruyor` iken çıkış 1; `bitti` iken çıkış 0, `- Onay: evet` ve `- Durum: tasarim` (tek `- Durum:` satırı kalır). `gelistir 21`: adımsızken çıkış 1; teste Epic 21 altına `- [ ] 2. İş` + `  - Kapı: \`true\`` ekleyip commit edince çıkış 0 ve `- Durum: gelistirme`; tartışmalı ama onaysız Epic'te çıkış 1. `figma 21 https://kotu.example.com/x` çıkış 1, dosya aynı; `figma 21 https://www.figma.com/design/a` çıkış 0 ve `- Figma:` satırı, ikinci kez başka url ile çağrılınca tek `- Figma:` satırı ve yeni url. Olmayan Epic (`karar 99 onay`) çıkış 1. `tartis` statüsü `gelistirme` olan Epic'te çıkış 1. Bilinmeyen komut çıkış 2.

- [ ] 142. Kurallar: Epic/Story adları, `mdk-epic.mjs` akışı, Figma'da kopya üzerinde çizim; story çekmecesi etiketi
  - Yürütücü: claude
  - Ne: `CLAUDE.md` Süreç + "Panelden karar" bölümleri, `esit/gorev-dagitimi.md`, `esit/ba-pm-bakis.SKILL.md`, PLAN.md `Biçim:` satırı; sonra `bash mdk-esitle.sh`. İçerik: Epic/Story adları ve Epic alanları; Epic işleri `mdk-epic.mjs` ile yapılır, sıradaki hamle `node mdk-epic.mjs durum`'dan okunur; yargı Claude'da (tartışma yalnız kullanıcı isteyince, persona seçimi ve gerekçesi, çözümü sınama, story'leri onaydan sonra yazma; `epic <no> red:`/`yorum:` → `is.md`'ye ekle, yeniden tartıştır ya da yanıtla); `epic <no> figma` → Talk to Figma ile ilgili çerçeveyi kopyala, orijinale dokunma, değişikliği kopyada yap, solda eski sağda yeni, `node mdk-epic.mjs figma <no> <url>`. `persona-takim-tur.mjs` yerine `epic-tartis.mjs` anılır. Ayrıca `panel/ciz.mjs` story çekmecesi etiketi `ADIM` → `STORY` ve `panel/drawer-ciz.test.mjs:13` beklentisi birlikte.
  - Kapı: `bash test/mdk-esitle.test.sh`
  - Kapı: `node panel/drawer-ciz.test.mjs`

## Sonraki iyileştirmeler
- Kapıları (testleri) belirleme biçimini iyileştir: şu an adım başına dar, tek komut. Hedef: yapılan geliştirmeyi kapsayan (başarı/hata/sınır durumu, kullanıcı senaryosu) net kapılar.
- Personalar (2026-10-27, adım 31-39 ve 58): `personalar.md` v2 üç alan, `persona-tur.sh` ile OpenCode'da ücretsiz modelle çalışıyor. Üç alan da gerçek kararla denendi (adım 36-38, 60-61); sessiz model 60 sn sonra atlanır (adım 59, `PERSONA_ILK`).
- Gözlem: adım 7 yaklaşık 730 bin token harcadı (diğerleri 40-140 bin); adım başına token bütçesi ve dar adım kuralı düşünülebilir.
