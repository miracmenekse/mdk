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
- Yalnızca Node yerleşik modülleri; bağımlılık yok, ağ yok, dış CDN yok. ES modül (`.mjs`). Tek ağ istisnası: `mdk-radar.mjs` `gh api` çağırır (Epic 27); panel, testler ve diğer koşturucular ağa çıkmaz.
- `*.test.mjs` dosyaları Claude'un yazdığı kapılardır: DEĞİŞTİRME, sadece geçir.
- Panel sunucusu yalnızca `127.0.0.1`'e bağlanır.
- Proje kökü = çalışma dizini; yollar buna göre.

Biçim: `PLAN.md` adımları (arayüzde Story) `- [ ] N. Başlık` satırıdır; altındaki `- Kapı:`, `- Yürütücü:`, `- Etki:`, `- Değer:` satırları alanlardır. `## Epic <no> — <ad>` başlığı bir Epic'tir (eski `## Faz …` başlıkları da Epic sayılır); başlığın altında, ilk adımdan önce Epic alanları gelir: `- Durum: analiz|tasarim|gelistirme`, `- Tartışma: epic/<no>`, `- Etki:`, `- Figma:`, `- Onay: evet`. Epic alanlarını elle değil `node mdk-epic.mjs` ile yaz.

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
  - Kapı: `node test/ios-kabuk.test.mjs`
- [ ] 115. Bağlantı yok ekranı ve kendiliğinden yeniden deneme
  - Yürütücü: kodcu
  - Etki: etki/ios-kabuk.html
  - Değer: 4
  - Ne: Yükleme başarısızsa (`didFail`, `didFailProvisionalNavigation`, 5xx) yerel ekran: "Mac'e ulaşılamıyor", "Mac uyuyor ya da panel kapalı", Yeniden dene, Adresi değiştir. Bu ekrandayken 5 sn'de bir dener, olunca panele geçer. WebContent süreci ölürse yeniden yükler.
  - Kapı: `node test/ios-hata.test.mjs`
- [ ] 116. İlk açılış adres ekranı
  - Yürütücü: kodcu
  - Etki: etki/ios-kabuk.html
  - Değer: 4
  - Ne: `ios/MDK/PanelAdresi.swift`: `enum PanelAdresi { static func cozumle(_ s: String) -> URL? }`, çıplak ad https olur; düz http yalnız 127.0.0.1/localhost için; sondaki `/` atılır, ad küçük harf. Kayıtlı adres yoksa yerel form (alan + Bağlan, geçersizse satır içi uyarı), `panelAdresi`'ne yazar. Hata ekranındaki Adresi değiştir bu forma döner. `MDK_PANEL_URL` varken form açılmaz; varsayılan adres fallback'i kalkar.
  - Kapı: `node test/ios-adres.test.mjs && node test/ios-kabuk.test.mjs`
- [ ] 117. Öne dönünce bayat paneli yenile
  - Yürütücü: kodcu
  - Ne: `ios/MDK/YenilemeKarari.swift`: `enum YenilemeKarari { static func gerekli(ayrilma: Date?, donus: Date) -> Bool }`, 120 sn ve üzeri ayrılıkta `true`. `scenePhase` arka plana geçişte zamanı tutar, dönüşte gerekliyse WebView yeniden yükler. Kısa ayrılık yazılan yorumu silmez.
  - Kapı: `node test/ios-yenile.test.mjs && node test/ios-kabuk.test.mjs`
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

- [x] 136. Geliştirme sekmesi: Epic satırı + akordiyon story tablosu
  - Ne: `panel/ciz.mjs:300-338`: story satırı (`<tr class="adim-satir …" data-adim>`) üretimini `akisTablosuHtml` içinden bir yardımcıya al; `akisTablosuHtml`'in çıktısı ve imzası DEĞİŞMEZ. Altına `export function gelistirmeHtml(plan, simdi, gecmis, incelemeler, etki = [], epikler = [], acik = {})`: `plan` yoksa `<span class="bos">PLAN.md bulunamadı</span>`. Her kategori (Epic) için, `sira` = `plan.kategoriler` içindeki dizin: `<div class="epic-satir" data-epic="<sira>" tabindex="0" aria-expanded="true|false">` içinde `<span class="epic-ad">` (ad, `esc`), `<span class="epic-ilerleme">` (`<biten> / <toplam>`), `<span class="rozet epic-<statu>">` (metin: `analiz`→"Analiz", `tasarim`→"Tasarım", `gelistirme`→"Geliştirme", `tamamlandi`→"Tamamlandı") ve Epic'in `no`'su varsa `<button type="button" class="epic-detay" data-epic-no="<no>">Detay</button>`. Epic kaydı `epikler.find(e => e.ad === kat.ad)`; `statu` ondan, kayıt yoksa: adımı var ve hepsi bitti → `tamamlandi`, adımı var → `gelistirme`, yok → `analiz`. Uyarı: kayıt `tartisma?.durum === 'bitti' && !onay` ve statü `tamamlandi` değilse düğme sınıfı `epic-detay uyari`, metni `Detay · çözüm onayı bekliyor`; değilse Epic'in adımlarından `etki` dizisinde `!bitti && !onay` kaydı olan `n > 0` ise `epic-detay uyari`, `Detay · <n> story karar bekliyor`. Açık mı: `acik[sira]` boolean ise o, değilse statü `tamamlandi` değilse açık. Açık Epic'te satırın ardından `<div class="epic-govde">` içinde story tablosu (`akisTablosuHtml` ile aynı satırlar, yalnız o Epic'in adımları, yeni adım üstte, ilk sütun başlığı `Story`); adımsız Epic'te `<p class="bos">henüz story yok</p>`; kapalı Epic'te `epic-govde` hiç üretilmez. Sıra: statüsü `tamamlandi` olmayanlar önce, sonra tamamlananlar; her grupta dosyada sonra gelen üstte. `panel/ciz.mjs:534-562` `kpiHtml`: `akis` kartının adı `Geliştirme`, alt yazısı `biten story` (`data-sekme="akis"` aynı). `panel/index.html:397-399`: `<h2>Adımlar</h2>` → `<h2>Epic'ler</h2>`; `:458` import satırına `gelistirmeHtml` ekle (`akisTablosuHtml` adı import satırında KALIR); `:683-686` `planCiz` `gelistirmeHtml(sonPlan.plan, sonSimdi, sonPlan.gecmis, sonPlan.incelemeler, sonD?.etki || [], sonD?.epikler || [], epicAcik)` çağırır; `kategorilerEl` tıklamasında (`:579-582`) sıra: `.epic-detay` tıklaması burada işlenmez (138'de bağlanacak), `[data-adim]` tıklaması eskisi gibi `drawerAc`, aksi halde `.epic-satir` tıklaması `epicAcik[sira]`'yı o anki görünen durumun tersine çevirir ve `planCiz()`; Enter tuşu da aynı. CSS (`:338` yanına): `.epic-satir` tam genişlik esnek satır, imleç el, alt çizgi; `.rozet.epic-analiz/tasarim/gelistirme/tamamlandi` var olan rozet renk değişkenleriyle (sırayla karar, calisiyor, calisiyor, bitti); `.epic-detay.uyari` turuncu; `.epic-govde` sol girintili.
  - Kapı: `node panel/gelistirme.test.mjs` — `gelistirmeHtml` için plan: kategoriler `[{ad:'Eski <b>', adimlar:[{no:1,baslik:'A',bitti:true}]}, {ad:'Epic 21 — Yeni', no:'21', adimlar:[{no:2,baslik:'B',bitti:true},{no:3,baslik:'C',bitti:false}]}, {ad:'Epic 22 — Müşteri', no:'22', adimlar:[]}]`, epikler: `[{ad:'Eski <b>',no:null,statu:'tamamlandi'},{ad:'Epic 21 — Yeni',no:'21',statu:'gelistirme',tartisma:null,onay:false},{ad:'Epic 22 — Müşteri',no:'22',statu:'analiz',tartisma:{yol:'epic/22',durum:'bitti'},onay:false}]`. Beklenen: üç `epic-satir`; çıktıda sıra Epic 22, Epic 21, Eski (`data-epic="2"` `data-epic="1"`'den, o da `data-epic="0"`'dan önce); rozet metinleri `Analiz`, `Geliştirme`, `Tamamlandı` ilgili satırda; Epic 21 ilerlemesi `1 / 2`; Epic 22 düğmesinde `uyari` sınıfı ve `çözüm onayı bekliyor`, `data-epic-no="22"`; `no`'su olmayan Eski'de `epic-detay` yok; Epic 21 açık (`data-adim="3"` ve `data-adim="2"` var, 3 önce, başlıkta `Story`); Eski kapalı (`data-adim="1"` yok); Epic 22'de `henüz story yok`; `acik = {0:true, 1:false}` ile `data-adim="1"` var, `data-adim="3"` yok; `Eski &lt;b&gt;` var, `Eski <b>` yok. Epic 22 `onay:true` iken `uyari` yok. `etki = [{no:3,bitti:false,onay:false}]` ile Epic 21 düğmesinde `1 story karar bekliyor`. `epikler` boş verilince Epic 21 `Geliştirme`, Eski `Tamamlandı`, Epic 22 `Analiz`. `gelistirmeHtml(null)` → `PLAN.md bulunamadı`. `kpiHtml({plan})` çıktısında `Geliştirme` ve `biten story` var, `data-sekme="akis"` var. `panel/index.html` metni `gelistirmeHtml(`, `akisTablosuHtml` ve `epic-satir` içerir.

- [x] 137. Epic kararı altyapısı: kuyruk, sunucu uçları, izleyici
  - Ne: `panel/karar.mjs:4-37`: girdi `no` (pozitif tam sayı) YA DA `epic` (boş olmayan, en çok 20 karakter, yalnız rakam ve nokta içeren metin) taşır; ikisi birden ya da hiçbiri → hata. Türler: `onay`, `red`, `yorum` ve yalnız `epic` ile geçerli `figma` (`no` ile `figma` → hata). Yazılan kayıt `no` ile `{ts,no,tur,metin}` (bugünkü gibi), `epic` ile `{ts,epic,tur,metin}`. `karar-bekle.mjs:28-44`: `karar.epic` varsa satır `epic <epic> <tur>` (metin varsa `epic <epic> <tur>: <metin>`), yoksa bugünkü `adım <no> …`. `panel/sunucu.mjs:122-195` `kararAl`: gövdede `epic` varsa adım araması yerine planda `no === girdi.epic` olan kategori aranır; yoksa ya da `epicDurum` `tamamlandi` ise 404 `Epic yok ya da tamamlanmış`; varsa `kararEkle`. `panel/sunucu.mjs:410-443` yanına `GET /api/epic?no=<no>`: planda o `no`'lu kategori yoksa ya da `tartisma`'sı yoksa 200 `{ no, tartisma: null }`; varsa `<kök>/<tartisma>/tartisma.json` okunur (yol güvenliği `/api/persona` ile aynı: mutlak ya da `..` içeren yol 400, realpath kök dışındaysa 400; dosya yok ya da JSON bozuksa `{ no, tartisma: null }`), 200 `{ no, tartisma: <nesne> }`.
  - Kapı: `node panel/epic-karar.test.mjs` — `kararEkle(kok, {epic:'22', tur:'onay'})` kaydı `{epic:'22',tur:'onay',metin:''}` alanlarıyla `etki/kararlar.jsonl`'a yazar; `{epic:'22', tur:'figma'}` kabul; `{no:5, tur:'figma'}`, `{epic:'22', no:5, tur:'onay'}`, `{tur:'onay'}`, `{epic:'', tur:'onay'}`, `{epic:'../x', tur:'onay'}`, `{epic:'22', tur:'red'}` (metinsiz) hata fırlatır; `{no:5, tur:'onay'}` bugünkü gibi çalışır. Sunucu (`baslat(dizin, 0)`; PLAN.md'de `## Epic 22 — M` + `- Durum: analiz` + `- Tartışma: epic/22`, ayrıca tüm adımları bitmiş `## Epic 20 — Eski`, ve `epic/22/tartisma.json`): `POST /api/karar` `{epic:'22',tur:'onay'}` → 200, dosyada satır; `{epic:'99',tur:'onay'}` → 404; `{epic:'20',tur:'onay'}` → 404; `GET /api/epic?no=22` → 200 ve `tartisma` nesnesi dosyadakiyle eşit; `GET /api/epic?no=99` → 200 `tartisma: null`; `tartisma.json` bozukken `tartisma: null`. `node karar-bekle.mjs <dizin> --bir-kez` çıktısı (çocuk süreçle): `{ts:1,epic:'22',tur:'figma',metin:''}` → `epic 22 figma`; `{ts:2,epic:'22',tur:'yorum',metin:'a\nb'}` → `epic 22 yorum: a b`; `{ts:3,no:5,tur:'onay',metin:''}` → `adım 5 onay`.

- [x] 138. Epic çekmecesi: tartışma, çözüm, UI/UX etkisi, Figma'da çiz, karar
  - Ne: `panel/ciz.mjs` (`drawerHtml` altına): `export function epicDrawerHtml(epik, tartisma, izleyici = false)`. Başlık: `<span class="etiket">EPIC</span>`, ad, `id="drawer-kapat"` düğmesi, statü rozeti (136'daki metinler). Bölümler sırayla, her biri `<h3 class="drawer-bolum">`: (1) `TARTIŞMA`: `tartisma` yoksa `<p class="bos">bu Epic için persona tartışması yok</p>`; varsa `tartisma.durum === 'suruyor'` iken `<p class="not">tartışma sürüyor…</p>`, `'yetersiz'` iken `<p class="hata">tartışma tamamlanamadı (yeterli yanıt yok)</p>`; `tartisma.neden` doluysa `<p class="not">` içinde; her tur (`tartisma.turlar`: `{tur, ad, mesajlar:[{persona, model, metin}]}`) için `<h4>Tur <tur> · <ad></h4>` ve her mesaj `personaBalonlarHtml`'deki balon işaretlemesiyle (`persona-balon persona-a|b|c`, avatar baş harf, rol, metin; renk personanın `tartisma.personalar` içindeki sırasına göre, aynı persona her turda aynı renk). (2) `ÇÖZÜM`: `tartisma.cozum?.metin` yoksa `<p class="bos">henüz çözüm yok</p>`; varsa küçük çizici: `## başlık` → `<h4>`, `- ` / `* ` / `1. ` ile başlayan satırlar `<ul><li>`, diğer satırlar `<p>`; hepsi `esc` ile, ham HTML geçmez. (3) `UI/UX ETKİSİ`: `epik.etki` varsa `etkiKart`'taki önce/sonra kroki işaretlemesi (`/dosya?yol=…&goster=once|sonra`, `buyut` düğmeleri), yoksa `<p class="bos">taslak yok</p>`; `epik.figma` varsa `<p class="figma-bilgi">` içinde `Figma'da aç ↗` bağlantısı (`target="_blank" rel="noopener"`); statü `tamamlandi` değilse `<form class="epic-karar" data-epic="<no>">` içinde tek düğme `<button type="submit" name="tur" value="figma">Figma'da çiz</button>`. (4) `KARAR`: statü `tamamlandi` ise bölüm yok; `epik.onay` ise `<p class="karar-durum">çözüm onaylandı</p>`; `tartisma?.durum === 'bitti'` ise `<form class="epic-karar" data-epic="<no>">`: `textarea name="metin"` (maxlength 2000), düğmeler `Çözümü onayla` (`value="onay"`), `Reddet` (`red`), `Yorum` (`yorum`), ve `<p class="karar-durum">` içinde son kararın özeti (`kararDurum` ile aynı mantık: tür, saat, metin, "Claude aldı" / "Claude'a iletiliyor" / "kuyrukta"); aksi halde `<p class="bos">karar için önce tartışma bitmeli</p>`. `export function epicImza(epik, tartisma)`: `epik.statu`, `epik.onay`, `epik.figma`, `epik.etki`, `epik.karar?.ts`, `epik.alindi`, `tartisma?.durum`, toplam mesaj sayısı ve `tartisma?.cozum?.metin?.length`'ten kararlı metin; `null` girdiler hata vermez. `panel/index.html` (`drawerAc` yanına): `kategorilerEl` tıklamasında `.epic-detay` → `epicDrawerAc(no)`: `/api/epic?no=` çekilir, `sonD.epikler`'den `no`'su eşleşen kayıtla `epicDrawerHtml` çizilir, çekmece açılır (story çekmecesiyle aynı `#drawer`; `drawerAdim = null`, `drawerEpic = no`); `drawerEl`'de `form.epic-karar` gönderimi `POST /api/karar` `{ epic, tur, metin }` (var olan karar formu işleyicisinin hata/başarı gösterimi kalıbıyla; `figma` formunda metin yok); `ciz(d)` içinde `drawerEpic != null` ise `/api/epic` yeniden çekilir ve `epicImza` değiştiyse, `textarea[name=metin]` boşsa çekmece yeniden çizilir; `drawerKapat` `drawerEpic`'i de sıfırlar. Kısa CSS: `.drawer-ic h4`, `.epic-karar` düğme aralığı.
  - Kapı: `node panel/epic-drawer.test.mjs` — `epik = {no:'22', ad:'Epic 22 — M <x>', statu:'analiz', onay:false, etki:null, figma:null, karar:null, alindi:false}`. `epicDrawerHtml(epik, null)` → `persona tartışması yok`, `henüz çözüm yok`, `taslak yok`, `Figma'da çiz` var, `Çözümü onayla` yok, `M &lt;x&gt;` var. Süren tartışma `{durum:'suruyor', personalar:[{ad:'Ürün Sahibi'},{ad:'Mühendis'}], turlar:[{tur:1, ad:'Değerlendirme', mesajlar:[{persona:'Ürün Sahibi', model:'m', metin:'değer <script>alert(1)</script>'},{persona:'Mühendis', model:'m', metin:'risk'}]}]}` → `tartışma sürüyor`, `Tur 1`, `Değerlendirme`, iki `persona-balon`, `<script>` yok ve `&lt;script&gt;` var, `Çözümü onayla` yok. Biten tartışma (yukarıdaki + `durum:'bitti'`, tur 2'de Mühendis mesajı, `cozum:{metin:'## Çözüm\nTek ekran\n## Tahmini story listesi\n- Tablo\n- Form <b>'}`) → `<h4>` içinde `Çözüm` ve `Tahmini story listesi`, `<li>` içinde `Tablo`, `Form &lt;b&gt;` var, `Çözümü onayla`, `Reddet`, `Yorum` düğmeleri ve `data-epic="22"`; Mühendis'in iki turdaki balonu aynı renk sınıfını taşır. `epik.onay = true` → `çözüm onaylandı`, `Çözümü onayla` yok. `epik.figma = 'https://www.figma.com/design/a?x="1"'` → `Figma'da aç` bağlantısı, tırnak kaçışlı. `epik.etki = 'etki/m.html'` → `goster=once` ve `goster=sonra` içeren iki iframe. `statu:'tamamlandi'` → `Figma'da çiz` ve karar formu yok. `durum:'yetersiz'` → `tartışma tamamlanamadı`. `epicImza`: aynı girdi iki kez eşit; yeni mesaj eklenince, `durum` değişince, `epik.onay` / `epik.figma` / `epik.karar.ts` değişince farklı; yalnız `epik.ad` değişince eşit; `epicImza(null, null)` hata vermez. `panel/index.html` metni `epicDrawerHtml(`, `epicImza(`, `/api/epic` ve `epic-karar` içerir.

- [x] 139. `epic-tartis.mjs`: personaların üç turlu tartışması
  - Ne: Yeni `epic-tartis.mjs` (~180 satır, yalnız Node yerleşikleri; `persona-takim-tur.mjs:1-43` kalıbı: `oc-sec.mjs` `ocSec()`, `--format json` çıktısından `type === 'text'` olaylarının `part.text`'i). Kullanım (proje kökünde): `node epic-tartis.mjs <no> [--persona "Ad1,Ad2"] [--neden "<metin>"]`. Girdi: `epic/<no>/is.md` (yoksa çıkış 2), `persona/takim.json` (`personalar: [{ad, optimize, korluk, soru}]`; yoksa/boşsa çıkış 2), modeller `PLAN.md`'deki `Görev persona:` satırı (virgülle; yoksa `Modeller:`; ikisi de yoksa çıkış 2). `--persona` verilirse yalnız adı listede geçen personalar (hiçbiri eşleşmezse çıkış 2). Her çağrı: `<oc> run -m <model> --format json --title epic-<no> <istem>`, stdin kapalı, `OPENCODE_LOG_LEVEL=error`, süre `EPIC_SURE` (varsayılan 240 sn; aşılırsa süreç öldürülür); yanıt boşsa aynı istem sıradaki modelle bir kez daha denenir (model sırası persona dizinine göre döndürülür). Tur 1 `Değerlendirme` (tüm personalar paralel, `spawn`): istem persona kartını (ad, optimize, körlük, soru) ve işi verir; "işi YALNIZ kendi merceğinle değerlendir: etki, gereksinim, endişe; en çok 120 kelime; kod ya da dosya değiştirme". Tur 2 `Tartışma` (tur 1'de geçerli yanıt veren personalar paralel): istem kendi tur-1 metnini ve DİĞER personaların tur-1 metinlerini (ad etiketli) içerir; "katıldığın, itiraz ettiğin ve fikrini değiştirdiğin noktayı yaz; en çok 120 kelime". Tur 3 `Uzlaşı` (tek çağrı, tarafsız moderatör): iş + iki turun tüm metinleri; yanıt tam şu başlıklarla istenir: `## Çözüm`, `## UI/UX etkisi`, `## Entegrasyon`, `## Anlaşmazlıklar ve açık sorular`, `## Tahmini story listesi`. Çıktı `epic/<no>/tartisma.json`, her yanıttan sonra yeniden yazılır: `{ epic: '<no>', is, neden, durum, personalar: [{ad}], turlar: [{ tur, ad, mesajlar: [{ persona, model, metin }] }], cozum: { model, metin } | null, ts }`; `durum` başta `suruyor`; tur 1'de geçerli (boş olmayan) yanıt 2'den azsa `yetersiz` yazılır ve çıkış 1 (tur 2 ve 3 koşmaz); tur 3 yanıtı boşsa `yetersiz` ve çıkış 1; aksi `bitti` ve çıkış 0. Boş yanıt veren personanın mesajı diziye eklenmez. Son satır olarak `epic/<no>/tartisma.json` yolunu basar.
  - Kapı: `node test/epic-tartis.test.mjs` — geçici dizinde `PLAN.md` (`Görev persona: m/bir, m/iki`), `persona/takim.json` (Ürün Sahibi, Mühendis, Eleştirmen), `epic/7/is.md`; `MDK_OPENCODE` = testin yazdığı taklit çalıştırılabilir betik: her çağrıda argümanlarını (model ve istem) bir günlük dosyasına ekler ve `{"type":"text","part":{"text":"YANIT <sayaç>"}}` satırı basar; ortam değişkeniyle "şu metni içeren istemde boş dön" ve "şu modelde boş dön" kipleri. Doğrular: olağan koşu çıkış 0, 7 çağrı (3+3+1), `tartisma.json` `durum === 'bitti'`, `turlar.length === 2` ve her turda 3 mesaj, `cozum.metin` dolu, `personalar` 3 ad, `is` is.md içeriği; tur 2 çağrılarının her birinin isteminde diğer iki personanın tur-1 yanıt metni var; tur 3 isteminde `## Tahmini story listesi` geçer; `--persona "Ürün Sahibi,Mühendis"` ile 5 çağrı ve `personalar.length === 2`; `--neden "x"` → `neden === 'x'`; `m/bir` boş dönerken her çağrı `m/iki` ile yeniden denenir ve koşu `bitti`; iki personanın tur-1 yanıtı her modelde boşken çıkış 1, `durum === 'yetersiz'`, tur 2 çağrısı yok; `epic/7/is.md` yokken çıkış 2; `--persona "Yok"` çıkış 2.

- [x] 140. Koşturucu: çözümü onaylanmamış Epic'in story'si koşmaz
  - Ne: `mdk-adim.sh:93-96` (taslak onayı denetiminin hemen altına): adımın Epic bloğu = `$PLAN`'da adım satırından önceki son `## ` başlığından o başlığın ilk `- [` satırına kadar olan satırlar (awk, adım bloğu kalıbıyla). O blokta `^- Tartışma:` satırı varsa ve `^- Onay: evet` yoksa `echo "adım $N: Epic çözüm onayı bekliyor (panelden onayla; node mdk-epic.mjs karar <no> onay)"; exit 5`. Epic'te `- Tartışma:` yoksa ya da `- Onay: evet` varsa denetim geçer; başka hiçbir davranış değişmez. Üstteki çıkış kodu yorum satırına (`mdk-adim.sh:4`) "5 taslak ya da Epic çözüm onayı bekliyor" yaz.
  - Kapı: `bash test/epic-onay.test.sh` — `test/mdk-figma.test.sh` kalıbında (`kontrol` yardımcıları, geçici dizin, `trap` ile temizlik). Geçici git deposu: `.gitignore` (`.mdk-log/`, `durum.json`, `metrikler.jsonl`), `PLAN.md` (`Yürütücü: opencode`, `Modeller: m/a`, `## Epic 9 — Deneme`, `- Tartışma: epic/9`, `- [ ] 1. İş`, `  - Kapı: \`true\``), ilk commit; `MDK_OPENCODE` = çağrıldığında işaret dosyası yazan taklit betik; `MDK_ONKONTROL_YOK=1`, `MDK_METRIK`/`MDK_DURUM` geçici dosyalar. (a) onaysız: `mdk-adim.sh 1` çıkış 5, çıktıda `Epic çözüm onayı bekliyor`, işaret dosyası YOK, PLAN.md değişmemiş. (b) Epic bloğuna `- Onay: evet` ekleyip commit: çıkış 5 DEĞİL ve çıktıda `Epic çözüm onayı` yok. (c) `- Tartışma:` satırı hiç olmayan Epic: çıkış 5 değil. (d) `- Onay: evet` yalnız BAŞKA bir Epic'in bloğundayken (önceki `## Epic 8` altında) ve Epic 9'da `- Tartışma:` varken: çıkış 5.

- [x] 141. `mdk-epic.mjs`: Epic akışının sahibi komut
  - Ne: Yeni `mdk-epic.mjs` (~170 satır, yalnız Node yerleşikleri). Okuma `panel/plan.mjs` `parse` + `epicDurum` ile; yazma `panel/gorev.mjs:32-56` `gorevModelYaz` kalıbıyla satır düzeyinde (yalnız ilgili Epic bloğu değişir, dosyanın geri kalanı bayt bayt aynı). Alan satırı Epic başlığının altına, var olan alan satırlarının sonuna eklenir; alan zaten varsa o satır değiştirilir. Her başarılı yazan komut `git add PLAN.md epic/<no>` + `git commit -qm "epic <no>: <komut>"` yapar (git deposu değilse commit atlanır). İzinsiz/hatalı çağrıda hiçbir dosyaya dokunmaz, nedeni stderr'e yazar, çıkış 1; kullanım hatası çıkış 2. Komutlar: `ac "<ad>" <is-dosyası>` → yeni no = plandaki en büyük tam sayı Epic/Faz no + 1; dosyada `## Sonraki iyileştirmeler` başlığı varsa onun hemen önüne, yoksa dosya sonuna `## Epic <no> — <ad>` + `- Durum: analiz` + boş satır ekler; `epic/<no>/is.md`'ye iş dosyasının içeriğini yazar; stdout'a `<no>` basar. `tartis <no> [--persona …] [--neden …]` → Epic yoksa ya da statüsü `analiz` değilse çıkış 1; `node <betik dizini>/epic-tartis.mjs <no> …`'yi (ortam `MDK_EPIC_TARTIS` verilmişse o betiği) argümanları aktararak koşar, çıktısını geçirir; çıkış 0 ise `- Tartışma: epic/<no>` yazar, değilse alan yazmadan aynı çıkış koduyla biter. `karar <no> onay` → Epic'in `tartisma`'sı yoksa ya da `epic/<no>/tartisma.json` `durum`'u `bitti` değilse çıkış 1; `- Onay: evet` ve `- Durum: tasarim` yazar. `gelistir <no>` → Epic'te en az bir adım yoksa çıkış 1; `tartisma` var ve `onay` yoksa çıkış 1; `- Durum: gelistirme` yazar. `figma <no> <url>` → url `https://www.figma.com/` ya da `https://figma.com/` ile başlamıyorsa çıkış 1; `- Figma: <url>` yazar. `durum [no]` → statüsü `tamamlandi` olmayan (ya da verilen) her Epic için tek satır: `Epic <no> · <statü> · sıradaki: <hamle>`; hamle: analiz + tartışma yok → `story yaz ya da tartis`; tartışma `bitti` + onaysız → `kullanıcı onayı bekleniyor`; statü `tasarim` → `story'leri yaz, sonra gelistir`; `gelistirme` → `story koştur (<ilk açık story no>)`; hiçbir dosya yazmaz.
  - Kapı: `node test/mdk-epic.test.mjs` — her vaka geçici git deposunda (ilk commit'li), betik çocuk süreçle koşar. PLAN.md fikstürü: üst ayarlar, `## Faz 20 — Eski` + bitmiş adım 1, `## Sonraki iyileştirmeler` + bir madde. `ac "Müşteri" is.txt` → çıkış 0, stdout `21`; PLAN.md'de `## Epic 21 — Müşteri` ve hemen altında `- Durum: analiz`, başlık `## Sonraki iyileştirmeler`'den ÖNCE; `epic/21/is.md` içeriği is.txt ile aynı; `git log -1` mesajı `epic 21` içerir ve çalışma ağacı temiz; eklenen blok dışındaki tüm satırlar değişmemiş. `durum` → `Epic 21 · analiz · sıradaki: story yaz ya da tartis`. `tartis 21` (`MDK_EPIC_TARTIS` = `epic/21/tartisma.json`'a `{"durum":"bitti"}` yazıp 0 dönen taklit betik) → çıkış 0, PLAN.md'de `- Tartışma: epic/21`; taklit 1 dönerse çıkış 1 ve `- Tartışma:` satırı yok. `karar 21 onay`: tartışma yokken çıkış 1 ve PLAN.md bayt bayt aynı; `tartisma.json` `durum: suruyor` iken çıkış 1; `bitti` iken çıkış 0, `- Onay: evet` ve `- Durum: tasarim` (tek `- Durum:` satırı kalır). `gelistir 21`: adımsızken çıkış 1; teste Epic 21 altına `- [ ] 2. İş` + `  - Kapı: \`true\`` ekleyip commit edince çıkış 0 ve `- Durum: gelistirme`; tartışmalı ama onaysız Epic'te çıkış 1. `figma 21 https://kotu.example.com/x` çıkış 1, dosya aynı; `figma 21 https://www.figma.com/design/a` çıkış 0 ve `- Figma:` satırı, ikinci kez başka url ile çağrılınca tek `- Figma:` satırı ve yeni url. Olmayan Epic (`karar 99 onay`) çıkış 1. `tartis` statüsü `gelistirme` olan Epic'te çıkış 1. Bilinmeyen komut çıkış 2.

- [x] 142. Kurallar: Epic/Story adları, `mdk-epic.mjs` akışı, Figma'da kopya üzerinde çizim; story çekmecesi etiketi
  - Yürütücü: claude
  - Ne: `CLAUDE.md` Süreç + "Panelden karar" bölümleri, `esit/gorev-dagitimi.md`, `esit/ba-pm-bakis.SKILL.md`, PLAN.md `Biçim:` satırı; sonra `bash mdk-esitle.sh`. İçerik: Epic/Story adları ve Epic alanları; Epic işleri `mdk-epic.mjs` ile yapılır, sıradaki hamle `node mdk-epic.mjs durum`'dan okunur; yargı Claude'da (tartışma yalnız kullanıcı isteyince, persona seçimi ve gerekçesi, çözümü sınama, story'leri onaydan sonra yazma; `epic <no> red:`/`yorum:` → `is.md`'ye ekle, yeniden tartıştır ya da yanıtla); `epic <no> figma` → Talk to Figma ile ilgili çerçeveyi kopyala, orijinale dokunma, değişikliği kopyada yap, solda eski sağda yeni, `node mdk-epic.mjs figma <no> <url>`. `persona-takim-tur.mjs` yerine `epic-tartis.mjs` anılır. Ayrıca `panel/ciz.mjs` story çekmecesi etiketi `ADIM` → `STORY` ve `panel/drawer-ciz.test.mjs:13` beklentisi birlikte.
  - Kapı: `bash test/mdk-esitle.test.sh`
  - Kapı: `node panel/drawer-ciz.test.mjs`

## Epic 22 — Persona takımı yeniden tasarımı
- Durum: gelistirme
Kullanıcı tarifi (Yalın Kip, tartışma yok). `persona/takim.json`'daki eski 3 persona (Ürün Sahibi, Mühendis, Eleştirmen) silinir; yerine MDK'ya özgü 4 persona gelir. `personalar.md` düşünme kartları değişmez.
- [x] 143. Yeni persona takımı: Bilişsel Yük Bekçisi, Geliştirme Yöneticisi, Ürün Yöneticisi, UI/UX Uzmanı
  - Yürütücü: claude
  - Ne: `persona/takim.json:1-23` tamamen yeniden yazıldı (veri; panel de bu dosyayı yazar). Bilişsel Yük Bekçisi tüm iş akışındaki zihinsel yükle (kural, bayrak, ad, adım sayısı), UI/UX Uzmanı ekrandaki etkileşim ve görselle ilgilenir.
  - Kapı: `node -e "const t=require('./persona/takim.json');const a=t.personalar.map(p=>p.ad);require('assert').deepStrictEqual(a,['Bilişsel Yük Bekçisi','Geliştirme Yöneticisi','Ürün Yöneticisi','UI/UX Uzmanı']);for(const p of t.personalar)for(const k of ['optimize','korluk','soru'])require('assert').ok(p[k]&&p[k].length>20,p.ad+' '+k)"`

- [x] 144. Panelde 4. persona rengi (persona-d)
  - Ne: `panel/ciz.mjs:257,276,502`: üç `renkler` dizisinin sonuna `'persona-d'` ekle (`['persona-a', 'persona-b', 'persona-c', 'persona-d']`). `panel/index.html:401`: `.persona-c` satırının altına `.persona-d .avatar { background: #d97706; } .persona-d .metin { background: #fdf3e3; color: #6b3d06; }`; `panel/index.html:406`: koyu tema bloğunda `.persona-c .metin` satırının altına `  :root:not([data-theme="light"]) .persona-d .metin { background: #3a2a12; color: #f6dfbd; }`.
  - Kapı: `node -e "import('./panel/ciz.mjs').then(m=>{const A=require('assert');const h=m.personaTakimHtml({personalar:[{ad:'A'},{ad:'B'},{ad:'C'},{ad:'D'},{ad:'E'}]});A.ok(h.includes('persona-kart persona-d'));A.ok(h.includes('persona-kart persona-a\" data-index=\"4\"'));const b=m.personaBalonlarHtml('## A\n\nx\n\n## B\n\nx\n\n## C\n\nx\n\n## D\n\nx');A.ok(b.includes('persona-balon persona-d'));const c=require('fs').readFileSync('panel/index.html','utf8');A.ok(c.includes('.persona-d .avatar'));A.ok(/data-theme=\"light\"\]\) \.persona-d \.metin/.test(c))})"`

## Epic 23 — Persona ekleme ve güncelleme
- Durum: gelistirme
- Tartışma: epic/23
- Etki: etki/persona-duzenle.html
- Onay: evet
- Figma: https://www.figma.com/design/ov6dUo0vLvaZXGgBout9L2?node-id=87-2
Tartışmanın ilk dilimi 3 story'ye indirildi (kroki ve Figma onaylı). Sonraya: örtüşme uyarısı, yorumların tartışmaya girmesi, model taslağı, Epic başına panelden persona seçimi.
- [x] 146. Persona takımı doğrulaması: sunucu reddeder, panel hatayı gösterip geri alır
  - Ne: Yeni `panel/persona.mjs` (~70 satır, yalnız saf fonksiyonlar, Node ve tarayıcıda çalışır): `export function takimDenetle(girdi)` → `{ tamam: true, takim }` ya da `{ tamam: false, hata: '<tek cümle>' }`. Kurallar: girdi nesne ve `personalar` dizi (en çok 12); her persona nesne; `ad` kırpılmış 1–60 karakter (boşsa hata `Ad boş olamaz.`); `optimize` kırpılmış 1–400 (boşsa `"<ad>" için optimize eder boş olamaz.`); `korluk`, `soru` isteğe bağlı, kırpılmış en çok 400 (yoksa `''`); `yorumlar` varsa dizi olarak aynen korunur; ad tekrarı büyük/küçük harf duyarsız (`toLocaleLowerCase('tr')`, kırpılmış) → `"<ad>" adı takımda zaten var.`; `proje` gibi diğer üst alanlar korunur; dönen `takim` kırpılmış değerleri taşır. `export function adCakisir(takim, ad, haric = -1)`: `haric` indeksi dışında aynı ad (aynı karşılaştırma) varsa true. `panel/sunucu.mjs`: `/ciz.mjs` servisinin (≈571) yanına aynı biçimde `/persona.mjs`; `personaTakimAl` içinde (≈270-280) JSON.parse'tan sonra `takimDenetle`; başarısızsa `hata(yanit, 400, sonuc.hata)` ve dosyaya yazılmaz, başarılıysa `sonuc.takim` yazılır. `panel/index.html`: `<h2>Persona takımı</h2>` (≈474) altına `<p id="persona-durum" class="persona-durum" role="status"></p>`; `personaKaydet` (≈951-957) `async`, önceki takımı saklar, durum `kaydediliyor…`; yanıt 200 → `✓ kaydedildi`; değilse önceki takıma döner, `personaCiz()`, yanıttaki `hata` metnini `hata` sınıfıyla gösterir; ağ hatasında aynı geri dönüş ve `panel sunucusuna ulaşılamadı`; `true/false` döndürür. CSS: `.persona-durum` küçük soluk yazı, `.persona-durum.hata` `var(--maliyet)`.
  - Kapı: `node panel/persona-dogrula.test.mjs` — `takimDenetle`: geçerli iki persona → `tamam` ve adlar kırpılmış (`'  A  '` → `'A'`), `yorumlar` ve `proje` korunur, eksik `korluk` `''` olur; `ad: '  '` → hata `Ad boş olamaz.`; `optimize` boş → hata `optimize` içerir; `'Ürün'` ile `'ürün '` → hata `zaten var` içerir; `personalar` dizi değil / 13 persona / ad 61 karakter → `tamam:false`. `adCakisir({personalar:[{ad:'A'},{ad:'B'}]}, ' a ')` true, `(…, 'a', 0)` false, `(…, 'C')` false. Sunucu (`baslat(geçici, 0)`, `persona/takim.json` bir personalı): yinelenen adlı POST → 400, gövde `hata` `zaten var` içerir, dosya değişmemiş; geçerli POST (`ad: ' B '`) → 200 ve dosyada `B`; `GET /persona.mjs` → 200 ve `takimDenetle` içerir. `GET /` HTML'i `id="persona-durum"` içerir.

- [x] 147. Persona kartında yerinde düzenleme
  - Ne: `panel/ciz.mjs:271-298` `personaTakimHtml(takim, duzenlenen = -1)`: her kart başlığında `sil`'den önce `<button type="button" class="persona-duzenle" data-index="i">düzenle</button>`. `i === duzenlenen` olan kart ek sınıf `duzenleniyor` alır, adın yanına ` · düzenleniyor`; gövde ve yorum formu yerine `<form class="persona-duzenle-form" data-index="i">`: dört etiketli alan, her etikette ad + küçük açıklama (`Ad` · `rolün kısa adı`, `Optimize eder` · `en çok neyi gözetir`, `Körlüğü` · `bilerek neyi kaçırır`, `Sorusu` · `her işe soracağı tek soru`); `<input name="ad" maxlength="60" required value="…">`, `<textarea name="optimize|korluk|soru" maxlength="400">…</textarea>` (değerler kaçışlı; `optimize` required); `<p class="persona-hata" role="alert"></p>`; `Kaydet` (submit) ve `<button type="button" class="persona-vazgec">Vazgeç</button>` ve `sıra, renk ve yorumlar korunur` notu; mevcut yorum notları görünmeye devam eder. Yeni sınıf adlarında `persona-kart` alt dizesi geçmesin (`persona-takim.test.mjs` kart sayısını bu dizeyle sayar). `panel/index.html` (≈946-990): `let duzenlenen = -1`; `personaCiz` bunu geçirir; `.persona-duzenle` → `duzenlenen = i`, çiz, `input[name=ad]` odak; `.persona-vazgec` → `-1`, çiz; `.persona-duzenle-form` submit → `adCakisir(sonPersonaTakim, ad, i)` (`/persona.mjs`'den import) true ise mesaj `"<ad>" adı takımda zaten var.` `.persona-hata`'ya yazılır, kaydedilmez; değilse aynı indekste `{ ...eski, ad, optimize, korluk, soru }` (yorumlar korunur) ile `await personaKaydet(...)`; `true` ise `duzenlenen = -1` ve çiz; `false` ise form açık kalır. Yoklamadaki yeniden çizim (≈842) `duzenlenen !== -1` iken atlanır (yazılan metin silinmesin). CSS: `.persona-duzenle` (vurgu çerçeveli küçük hap), `.duzenleniyor` (vurgu kenarlık), form alanları panel girdileriyle aynı stil, `.persona-hata` `var(--maliyet)`.
  - Kapı: `node panel/persona-duzenle.test.mjs` — üç personalı takım (biri `yorumlar:[{metin:'not1'}]`, biri `korluk:'a "b" <c>'`). `personaTakimHtml(t)`: 3 `persona-duzenle"` düğmesi, `persona-duzenle-form` yok. `personaTakimHtml(t, 1)`: tam bir `persona-duzenle-form` ve `data-index="1"` taşır; `duzenleniyor` bir kez; `persona-kart` alt dizesi tam 3 kez; form içinde `name="ad"` değeri ikinci personanın adı; `Vazgeç`, `rolün kısa adı`, `bilerek neyi kaçırır`, `sıra, renk ve yorumlar korunur` var; kaçış: `<c>` ham geçmez, `&lt;c&gt;` var ve `value=` içinde ham `"` kırılmaz (`&quot;`); `personaTakimHtml(t, 0)` ilk kartta `not1` görünmeye devam eder. `GET /` HTML'i `persona-duzenle-form`, `persona-vazgec`, `duzenlenen` ve `/persona.mjs` içerir. `node panel/persona-takim.test.mjs` hâlâ geçer.

- [x] 148. Silmede geri al, açıklamalı ekleme formu, boş takım
  - Ne: `panel/persona.mjs`'ye: `export function personaSil(takim, i)` → `{ takim: <i'siz kopya>, geri: { persona, index: i } }` (girdi değişmez; geçersiz i → `null`); `export function personaGeriEkle(takim, geri)` → `geri.persona`'yı `geri.index`'e (liste kısaldıysa sona) ekleyen kopya; aynı ad artık varsa `null`. `panel/index.html`: sil tıklaması `personaSil` + `personaKaydet`; başarılıysa `<div id="persona-geri" class="persona-geri" role="status">` içinde `"<ad>" silindi.` + `<button type="button">Geri al</button>` 8 sn görünür (yeni silme süreyi yeniler); Geri al → `personaGeriEkle` + kaydet, çubuk gizlenir. Ekle formu (≈477-483) yeniden: başlık `Yeni persona`, 2×2 ızgara, her alan `<label>` ile ad + açıklama (147'deki metinler) ve örnekli placeholder (`ör. Güvenlik Denetçisi`, `ör. veri kaybı ve yetki riskini azaltmak`, `ör. kullanım kolaylığını`, `ör. Yanlış giderse geri alınır mı?`); `ad` ve `optimize` required, alanlar textarea değil input; `adCakisir` true ise formdaki `.persona-hata`'ya mesaj, kaydetmez; form yalnız kayıt başarılıysa sıfırlanır. `panel/ciz.mjs` `personaTakimHtml` boş takımda `<span class="bos">henüz persona yok — aşağıdaki formdan ekle</span>`. CSS: `.persona-geri` (`--rozet-karar-z/m` renkleri, sağda altı çizili Geri al), form ızgarası, `#sekme-persona :focus-visible { outline: 2px solid var(--vurgu); outline-offset: 2px; }`.
  - Kapı: `node panel/persona-geri.test.mjs` — `personaSil({proje:'x',personalar:[A,B,C]}, 1)` → takımda A,C, `geri.index === 1`, `geri.persona` B (yorumlarıyla), girdi takım hâlâ 3; `personaSil(t, 5)` → `null`; `personaGeriEkle({personalar:[A,C]}, {persona:B,index:1})` → A,B,C ve `proje` korunur; `index: 9` → sona; takımda B zaten varsa `null`. `personaTakimHtml({personalar:[]})` `henüz persona yok` içerir. `GET /` HTML'i `id="persona-geri"`, `Geri al`, `Yeni persona`, `rolün kısa adı`, `ör. Güvenlik Denetçisi`, `personaGeriEkle` ve `:focus-visible` içerir. `node panel/persona-takim.test.mjs` hâlâ geçer.

- [x] 149. Persona düzenleme cilası: tasarımla hizalama ve düzenleme sırasında güvenli indeks
  - Ne: Claude'un tarayıcı denetiminde bulunanlar (inceleme modelleri yanıtsızdı). `panel/ciz.mjs:273-310` (`personaTakimHtml`): düzenlenen kartın başlığında `düzenle` ve `sil` düğmeleri çizilmez; `<p class="persona-hata" role="alert">` `Ad` alanının hemen altına taşınır (form sonunda değil); `optimize`, `korluk`, `soru` textarea'ları `rows="3"`. `panel/index.html` CSS (≈151-170): `.persona-kart .avatar` yuvarlak 30px rozet (`.persona-balon .avatar` ile aynı kurallar: `width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff`). `panel/persona.mjs`'ye `export function duzenKaydir(duzenlenen, olay)`: `duzenlenen === -1` → `-1`; `olay.silinen === duzenlenen` → `-1`; `olay.silinen < duzenlenen` → `duzenlenen - 1`; `olay.eklenen <= duzenlenen` → `duzenlenen + 1`; aksi hâlde aynen. `panel/index.html` (≈1041-1078): sil başarılıysa `duzenlenen = duzenKaydir(duzenlenen, { silinen: i })` ve `personaCiz()`; Geri al başarılıysa `duzenKaydir(duzenlenen, { eklenen: geri.index })` ve çiz (düzenlenen kart hep aynı persona kalır). Düzenleme formu submit (≈1080-1099): kayıt `false` dönerse (sunucu reddi) form yeniden çizildikten sonra kullanıcının yazdığı dört değer forma geri yazılır ve `#persona-durum` metni formdaki `.persona-hata`'ya da yazılır (yazılan metin kaybolmaz).
  - Kapı: `node panel/persona-cila.test.mjs` — `duzenKaydir`: `(-1,{silinen:0})` → -1; `(2,{silinen:2})` → -1; `(2,{silinen:0})` → 1; `(2,{silinen:3})` → 2; `(2,{eklenen:1})` → 3; `(2,{eklenen:2})` → 3; `(2,{eklenen:4})` → 2. `personaTakimHtml(t, 1)` (üç persona): `persona-sil` tam 2 kez, `persona-duzenle"` (düğme sınıfı) tam 2 kez; formda `persona-hata` dizgesi `name="ad"`'dan sonra ve `name="optimize"`'dan önce gelir; `rows="3"` tam 3 kez. `personaTakimHtml(t)`: `persona-sil` 3 kez. `GET /` HTML'i `.persona-kart .avatar` ve `duzenKaydir` içerir. `node panel/persona-duzenle.test.mjs`, `node panel/persona-geri.test.mjs` ve `node panel/persona-takim.test.mjs` hâlâ geçer.

## Epic 24 — Çekmecede çözüme ve krokiye yorum
- Durum: gelistirme
- Etki: etki/epic-yorum.html
Kullanıcı tarifi (Yalın Kip, tartışma yok). Çözüm onaylanınca yorum kutusu kalkıyor; krokiye yorum yeri yok. Kroki onayı = Figma tetikleme. Sunucuda yeni karar türü yok (`yorum`, `figma` yeter).
- [x] 145. Epic çekmecesi: krokiye yorum + onay, onaydan sonra da çözüme yorum
  - Ne: `panel/ciz.mjs:564-586` (`epicDrawerHtml` UI/UX ETKİSİ sonu ve KARAR bölümü). (a) UI/UX ETKİSİ: `statu !== 'tamamlandi'` iken; `e.etki` varsa form `<form class="epic-karar" data-epic="…" data-bolum="kroki" data-onek="kroki: ">` içinde `<textarea name="metin" rows="2" maxlength="2000" placeholder="krokiye not">`, `<button type="submit" name="tur" value="figma">Krokiyi onayla → Figma'da çiz</button>`, `<button type="submit" name="tur" value="yorum">Yorum</button>`, `<p class="karar-durum"></p>`; `e.etki` yoksa bugünkü gibi yalnız `Figma'da çiz` düğmeli form (`data-bolum="kroki"`, textarea yok). (b) KARAR: `e.onay` iken `çözüm onaylandı` yazısının altına `<form class="epic-karar" data-epic="…" data-bolum="cozum">` textarea (placeholder `çözüme not (onayı değiştirmez)`) + yalnız `Yorum` düğmesi + `<p class="karar-durum"></p>`; onaysız-bitti formu `data-bolum="cozum"` alır, başka değişiklik yok. `panel/index.html:768-808` (Epic karar gönderimi): metin `textarea ? textarea.value : ''`; `form.dataset.onek` varsa ve metin boş değilse metnin başına eklenir; `canli()` seçicisi `form.epic-karar[data-epic="${epic}"][data-bolum="${form.dataset.bolum}"]` olur (iki form birbirinin durum satırını ezmesin).
  - Kapı: `node -e "import('./panel/ciz.mjs').then(m=>{const A=require('assert');const fs=require('fs');const t={durum:'bitti',personalar:[],turlar:[],cozum:{metin:'## Çözüm\nx'}};const e={no:'22',ad:'E',statu:'tasarim',onay:true,etki:'etki/m.html',figma:null,karar:null,alindi:false};const h=m.epicDrawerHtml(e,t);const say=(s,x)=>s.split(x).length-1;A.ok(h.includes('çözüm onaylandı'));A.ok(!h.includes('Çözümü onayla'));A.equal(say(h,'value=\"yorum\"'),2);A.ok(h.includes('data-bolum=\"kroki\"'));A.ok(h.includes('data-bolum=\"cozum\"'));A.ok(h.includes('data-onek=\"kroki: \"'));A.ok(h.includes('Krokiyi onayla'));const h2=m.epicDrawerHtml({...e,etki:null},t);A.ok(!h2.includes('Krokiyi onayla'));A.ok(h2.includes('Figma\'da çiz'));A.equal(say(h2,'value=\"yorum\"'),1);const h3=m.epicDrawerHtml({...e,onay:false},t);A.ok(h3.includes('Çözümü onayla'));A.equal(say(h3,'value=\"yorum\"'),2);const h4=m.epicDrawerHtml({...e,statu:'tamamlandi'},t);A.equal(say(h4,'value=\"yorum\"'),0);const ix=fs.readFileSync('panel/index.html','utf8');A.ok(ix.includes('dataset.onek'));A.ok(ix.includes('data-bolum='))})"`

## Epic 25 — Bash koşturucuların Node'a taşınması (Windows)
- Durum: gelistirme
Kullanıcı tarifi (Yalın Kip, tartışma yok). Ortak kalıp (her story'de geçerli): betik aynı argüman, stdout/stderr metni ve çıkış koduyla `<ad>.mjs` olur (ESM, yalnız `node:` modülleri, bağımlılık yok); `<ad>.sh` dosyasının tüm içeriği iki satıra iner: `#!/usr/bin/env bash` + `exec node "$(cd "$(dirname "$0")" && pwd)/<ad>.mjs" "$@"`. Yeni `.mjs` hiçbir yerde `bash`, `sh`, `grep`, `sed`, `awk`, `setsid`, `nohup`, `pkill`, `flock`, `cat`, `cp` çağırmaz (`child_process` yalnız `git`, `node`, opencode/cursor/bun ikilisi ve kapı/regresyon komutları için); metin işleme JS ile, dosya işlemleri `node:fs` ile. Arka plan süreç: `spawn(cmd,args,{detached:true,stdio:['ignore',out,err]})` + `unref()` (setsid nohup yerine). Canlılık: `try{process.kill(pid,0);return true}catch{return false}`. Süreç ağacını öldürme: POSIX'te `process.kill(-pid,'SIGTERM'|'SIGKILL')`, `process.platform==='win32'` iken `spawnSync('taskkill',['/T','/F','/PID',String(pid)])`. Kapsam dışı: `test/*.sh`, `test/hepsi.sh` (Windows'ta Git Bash ile koşar).
- [x] 150. mdk-esitle ve mdk-panel Node'a
  - Ne: `mdk-esitle.sh:1-34` → yeni `mdk-esitle.mjs`: `esit/AGENTS.md`, `esit/opencode.jsonc`, `esit/ba-pm-bakis.SKILL.md` kopyaları ve `~/.claude/CLAUDE.md` "## Görev dağıtımı" bölümü değişimi aynı; ev dizini `MDK_ESITLE_EV || os.homedir()`; `MDK_ESITLE_EV` verilmişse `mdk-esitle tamam (deneme evi: <ev>)` basıp çıkar; değilse zombi oturum temizliği (aynı sqlite sorgusu, `node:sqlite` doğrudan içe aktarılır, `MDK_OPENCODE` ya da `~/.local/opt/opencode-v2/node_modules/.bin/opencode` varsa her `ses_` kimliği için `<oc> api POST /api/session/<id>/interrupt`, hatalar yutulur) ve aynı son mesaj. `mdk-panel.sh:1-54` → yeni `mdk-panel.mjs`: `start|stop|durum [dizin] [port]`, PID dosyası `<dizin>/.mdk-log/panel.pid`, start'ta `panel/sunucu.mjs` (betiğin klasörüne göre) `process.execPath` ile detached başlatılır, stdout+stderr `<dizin>/.mdk-log/panel.log`'a, 400 ms sonra canlı değilse PID dosyası silinip log son 2 satırla stderr'e `başlatılamadı (port <p> dolu olabilir): …` ve çıkış 1; mesajlar ve çıkış kodları (durum: 0/1, bilinmeyen: kullanım + 2) aynı; stop en çok 2 sn (20×100 ms) bekler. İki `.sh` yönlendiriciye iner (Epic ortak kalıbı).
  - Kapı: `bash test/mdk-esitle.test.sh && bash test/mdk-panel.test.sh && node test/tasima-esitle-panel.test.mjs`
  - Kapı notu (test/tasima-esitle-panel.test.mjs): `.mjs`'leri doğrudan `node` ile, PATH yalnız `node` sembolik bağı içeren geçici bir klasör olacak şekilde koşturur (Windows vekili: bash/grep/sed yoksa da çalışmalı); esitle `MDK_ESITLE_EV` geçici evde dört hedef dosyayı oluşturur ve CLAUDE.md'nin üst kısmını korur; panel boş port üzerinde start→durum(0)→`/api/durum` yanıtı→ikinci start "zaten çalışıyor"→stop→durum(1), bilinmeyen komut çıkış 2; iki `.sh` dosyası 3 satırdan kısa ve `.mjs`'e `exec` eder.
- [x] 151. mdk-figma Node'a (WSL kalıntısı temizliği)
  - Ne: `mdk-figma.sh:1-101` → yeni `mdk-figma.mjs`: `start|stop|durum|eklenti [hedef]|kur`, ortam (`MDK_TTF_DIR`, `MDK_BUN`, `MDK_FIGMA_PID`, `MDK_FIGMA_PORT`), mesajlar ve çıkış kodları (durum çalışmıyorsa 3, bilinmeyen 2) aynı; start `$MDK_BUN run src/socket.ts`'i `$MDK_TTF_DIR` içinde detached başlatır, log PID klasöründe `socket.log`, 500 ms canlılık denetimi. `eklenti`: hedef verilmezse `path.join(os.homedir(),'talk-to-figma-eklenti')` (`/mnt/c`, `cmd.exe`, `wslpath` dalları kaldırılır; VM kullanılmıyor), `code.js ui.html setcharacters.js` + `figma/eklenti-manifest.json`→`manifest.json` kopyalanır (`fs.copyFileSync`), manifest'in mutlak yolu `path.resolve` ile basılır. `kur`: `git clone` + `git checkout ddd90f3` (yalnız dizin yoksa), `git apply --reverse --check` başarısızsa `git apply` (spawnSync `git`, cwd TTF), `BUN_CONFIG_REGISTRY` varsayılanıyla `bun install`, sonra eklenti ve `claude mcp add …` satırı. `.sh` yönlendiriciye iner. `test/mdk-figma.test.sh:103-104` wslpath dalı Mac'te zaten koşmaz; dokunma.
  - Kapı: `bash test/mdk-figma.test.sh && node test/tasima-figma.test.mjs`
  - Kapı notu (test/tasima-figma.test.mjs): PATH yalnız `node` bağı + sahte `bun` (kendini 30 sn uyutan node betiği) içeren klasörle `.mjs` doğrudan koşar; geçici `MDK_TTF_DIR`/`MDK_FIGMA_PID` ile start→durum 0→stop→durum 3; `eklenti <geçici hedef>` dört dosyayı kopyalayıp basılan yolun var olan `manifest.json` olduğunu; hedefsiz `eklenti` geçici `HOME` altında `talk-to-figma-eklenti` klasörünü kullandığını; bilinmeyen komut 2 döndüğünü doğrular.
- [x] 152. Ortak koşturucu kitaplığı: mdk-ortak.mjs
  - Ne: yeni `mdk-ortak.mjs` (yalnız dışa aktarım, yan etkisiz), bash betiklerindeki tekrarlı parçaların JS karşılığı: `adimBlogu(planMetni,n)` (`mdk-adim.sh:39-43` awk: `- [ ]`/`- [x]` N. satırından sonraki `- [` ya da `## ` satırına kadar, yoksa ''); `epicBlogu(planMetni,n)` (`mdk-adim.sh:100-105`: adımın üstündeki son `## ` başlığından ilk `- [` satırına kadarki metin); `planSatiri(metin,ad)` (`^<ad>: (.*)` ilk eşleşme, yoksa null); `modelListesi(satir)` (boşlukları atıp virgülle böler, boşları atar); `opencodeSec(dir)` (`MDK_OPENCODE || ` `oc-sec.mjs` çıktısı); `olaylariTopla(logYolu)` (`mdk-adim.sh:139-147` `topla` mantığı → `{token,maliyet,etkin,istek}`); `metinAyikla(logYolu)` (`type==='text'` olaylarının `part.text` birleşimi); `oturumKimligi(logYolu)` (ilk `"sessionID":"ses_…"`); `oturumKapat(oc,log,baslik)` ve `zombiTemizle(oc)` (`mdk-adim.sh:17-34`, aynı sqlite sorguları, `node:sqlite`, hatalar yutulur); `agacOldur(pid,sinyal)` (Epic ortak kalıbı, hata yutulur); `kos({komut,args,cwd,env,log,ilk,sure,poll,durdur})` → Promise `{kod,neden}`: süreci detached başlatır (stdin kapalı, stdout `log`'a, stderr `log+'.err'`'e), her `poll` ms'de: log boşken `ilk` sn dolduysa `yanit_yok`, `sure` sn dolduysa `sure`, isteğe bağlı `durdur()` bir neden dönerse o neden; neden çıkınca TERM, 2 sn sonra KILL ağaca; `kilitAl(dizin,model)` / `kilitBirak(k)`: dosya adı `model.replaceAll('/','_')`, `fs.openSync(…,'wx')` ile oluşturup içine PID yazar; dosya varsa ve içindeki PID canlı değilse silip yeniden dener; alınamazsa null (flock yerine; süreç çökerse sonraki koşu bayat kilidi temizler).
  - Kapı: `node test/mdk-ortak.test.mjs`
  - Kapı notu: örnek PLAN metniyle adimBlogu/epicBlogu/planSatiri/modelListesi sınır durumları (son adım, `[x]`, olmayan no); sahte jsonl ile olaylariTopla (v1 step_finish, v2 step_start, cursor result) ve metinAyikla; `kos` ile `node -e "setTimeout(()=>{},9e3)"` → `ilk:1` iken `yanit_yok` ve süreç ölü, çıktı yazan hızlı süreç → neden null kod 0; kilitAl aynı modele ikinci kez null, kilitBirak sonrası alınır, içinde ölü PID olan kilit dosyası alınabilir.
- [x] 153. mdk-incele Node'a
  - Ne: `mdk-incele.sh:1-93` → yeni `mdk-incele.mjs`, `mdk-ortak.mjs` kullanır (`adimBlogu`, `planSatiri`, `modelListesi`, `kos`, `metinAyikla`, `oturumKapat`, `opencodeSec`). Argüman `<no> [plan]`, ortam `POLL`, `ILK`, `SURE`, istem metni, `git log -1 --format=%H --grep "^adım N: "` + `git show`, `--agent plan`, UYUM ayrıştırması (ilk satır `^UYUM: \d+$`, ≤100), ilk 5 boş olmayan maddeyi `;` ile birleştirme, sınıf eşikleri, `mdk-kayit.mjs` çağrısı (`process.execPath`), tüm mesajlar ve çıkış kodları (0/2/4) aynı. `.sh` yönlendiriciye iner.
  - Kapı: `bash test/mdk-incele.test.sh && node test/tasima-incele.test.mjs`
  - Kapı notu (test/tasima-incele.test.mjs): PATH yalnız `node` + `git` bağları ve node ile yazılmış sahte `opencode` (`-m` modeline göre `UYUM: 85` metin olayı ya da biçimsiz yanıt üretir) içeren klasörle, geçici git deposunda `node mdk-incele.mjs 1` koşar: geçerli yanıtta çıkış 0 + `metrikler.jsonl`'de inceleme kaydı; ilk model biçimsiz ikinci geçerli → yedek modele geçiş mesajı; ikisi de biçimsiz → 2; commit yok → 4.
- [x] 154. persona-tur Node'a
  - Ne: `persona-tur.sh:1-111` → yeni `persona-tur.mjs`, `mdk-ortak.mjs` kullanır. Argümanlar `<alan> <soru> <kart>...`, ortam (`PERSONA_SURE`, `PERSONA_ILK`, `PERSONA_MODELLER`, `PERSONALAR`, `PLAN`), `blok()` başlık bloğu ayrıştırması (`persona-tur.sh:19-23` awk), kart denetimleri ve hata mesajları (çıkış 2), `cursor/*` modellerin atlanması, çıktı dizini `persona-tur/YYYYMMDD-HHMMSS` (çakışırsa `-2`, `-3`…; `fs.mkdirSync` atomik), dosya adı kuralı, kartlar `Promise.all` ile paralel, kart başına 2 deneme (sıradaki modelle), `sessiz`/`sure`/`gecerli`/`gecersiz` durumları, token (db'den ya da step_finish), `<n>-<ad>.md`/`.jsonl`/`.err` dosyaları, `ozet.md` biçimi, son satırda dizin, çıkış 0/1 kuralı aynı. `.sh` yönlendiriciye iner.
  - Kapı: `bash test/persona-tur.test.sh && bash test/persona-gorev.test.sh && node test/tasima-persona.test.mjs`
  - Kapı notu (test/tasima-persona.test.mjs): PATH yalnız `node` bağı + node ile yazılmış sahte `opencode` içeren klasörle, geçici dizinde örnek `personalar.md` ve `PLAN.md` ile `node persona-tur.mjs` koşar: iki kart geçerli (`Seçenek A` içeren yanıt) → çıkış 0, ozet.md iki kartı listeler; olmayan alan → 2; bir kart sessiz (`PERSONA_ILK=1`) diğeri geçerli → çıkış 1 ve sessiz kartın durumu `sessiz`.
- [x] 155. mdk-adim kapı üretimi ve izinler modülü
  - Ne: yeni `mdk-adim-kapi.mjs`, `mdk-adim.sh:149-163` (`izin_kur`) ve `mdk-adim.sh:209-270` (otomatik kapı üretimi) karşılığı: `izinYapilandirmasi(tur,kapilar,eksik,sade)` → `OPENCODE_CONFIG_CONTENT` JSON metni (aynı kurallar); `eksikKapilar(kapilar,kok)` (aynı regex, `kapi/derle.sh` hariç, sıralı tekil, diskte olmayanlar); `async kapiUret(ctx)`: `ctx` = `{n, blok, kapilar, planMetni, kurallar, projeKural, cp, logd, calistir, yazDurum, yazMetrik, selfDir}`; `Görev kapi:` modellerini sırayla dener, sonuç nedenleri (`kapi_eksik`, `kapi_kapsam`, `kapi_sozdizimi` [`node --check` / `bash -n`], `kapi_yesil`) ve `tur:"kapi"` metrik satırı aynı; başarıda `kapi-denetle.mjs --dosya` uyarısını basar, `adım N kapısı: <dosyalar> (<model>)` commit'i atar ve yeni HEAD'i döner; başarısızlıkta eksik dosyaları silip `git reset --hard <cp>` + `git clean -fdq`; hiçbiri geçmezse `null`. Kapı komutları kabukta koşar: POSIX'te `spawnSync('bash',['-c',k])`, Windows'ta `bash` PATH'te varsa o, yoksa `{shell:true}`. Bu story mdk-adim.sh'i değiştirmez.
  - Kapı: `node test/mdk-adim-kapi.test.mjs`
  - Kapı notu: izinYapilandirmasi kod/kapı türünde edit/bash kurallarını ve kapıda geçen `test/hepsi.sh`'in yasaklanmadığını; eksikKapilar'ın var olan dosyayı ve `kapi/derle.sh`'i atladığını; kapiUret'in sahte `calistir` (dosyayı yazan / başka dosyaya da dokunan / sözdizimi bozuk yazan / yeşil test yazan) ile geçici git deposunda sırasıyla başarı+commit, `kapi_kapsam`, `kapi_sozdizimi`, `kapi_yesil` ürettiğini ve başarısızlıkta ağacın temizlendiğini doğrular.
- [x] 156. mdk-adim ana koşturucusu Node'a
  - Ne: `mdk-adim.sh:1-382` → yeni `mdk-adim.mjs`; `mdk-ortak.mjs` ve `mdk-adim-kapi.mjs` kullanır, kalan akış (`mdk-adim.sh:35-148,164-208,271-382`) birebir: argümanlar, ortam değişkenleri (`DENEME SURE POLL ILK ONCE MDK_* HEPSI_HIZLI`), tüm mesajlar, metrik/durum JSON alanları ve çıkış kodları (0/2/3/4/5/6/8). Donmuş kopya: `MDK_DONMUS` yoksa `mdk-adim.mjs`, `mdk-ortak.mjs`, `mdk-adim-kapi.mjs` `.mdk-log/donmus/` altına kopyalanır ve `MDK_DONMUS=1 MDK_SELF_DIR=<asıl klasör>` ile oradan `process.execPath` ile çalıştırılıp çıkış kodu aktarılır (`yurutucu-kurallar.md`, `oc-sec.mjs`, `kapi-denetle.mjs`, `persona-takim-tur.mjs`, `mdk-incele.mjs` `MDK_SELF_DIR`'den). Model çalıştırma `kos()` ile (kota kalıbı `durdur()` içinde, bütçe denetimi aynı); cursor dalı ve `.cursor/cli.json` + `info/exclude` aynı. Kilit `kilitAl/kilitBirak` (`MDK_KILIT`, `MDK_KILIT_BEKLE`, `MDK_KILIT_TAVAN`). Regresyon `bash test/hepsi.sh` (bu kapsam dışı test betiği olduğu için kabuk çağrısı serbest), kapılar 155'teki kabuk kuralıyla. `sed -i` yerine PLAN metni JS ile değiştirilip yazılır; `git diff --numstat` toplamı JS ile. `İncele: evet` → `mdk-incele.mjs`. `kapi/` imzası `fs` ile (yol+boyut+mtime değil, içerik özeti `crypto` sha1). `.sh` yönlendiriciye iner. Not (kapı sahibi Claude, koşudan önce): `test/mdk-adim.test.sh:60-65` `c_donmus` vakası yeni donmuş kopyaya göre güncellenir.
  - Kapı: `bash test/mdk-adim.test.sh && bash test/mdk-hiz.test.sh && node test/tasima-adim.test.mjs`
  - Kapı notu (test/tasima-adim.test.mjs): PATH yalnız `node` + `git` bağları ve node ile yazılmış sahte `opencode` içeren klasörle, geçici git deposunda (`MDK_ONKONTROL_YOK=1`, `MDK_KILIT` geçici) `node mdk-adim.mjs 1` koşar: geçen adım → 0, PLAN'da `[x]`, `adım 1:` commit'i, metrik satırı; kapısı hep kırmızı tek model → 2; `- Etki:` var `Onay` yok → 5; `.mdk-log/donmus/mdk-adim.mjs` oluşur.
- [x] 157. mdk-paralel Node'a
  - Ne: `mdk-paralel.sh:1-81` → yeni `mdk-paralel.mjs`: argüman/kirli ağaç denetimi (4), sayısal sıralama, `git worktree prune/remove/add -q -B mdk/<n> <wt> HEAD`, her adım `MDK_PLAN_DOKUNMA=1 MDK_METRIK=<ana>/metrikler.jsonl MDK_DURUM=<ana>/durum.json` ile `node <self>/mdk-adim.mjs <n>` (worktree cwd'sinde, paralel, log `.mdk-log/paralel-<n>.log`), model adı metrikler.jsonl'in koşu öncesi satır sayısından sonraki `"adim":<n>,` satırından; numara sırasıyla `git rev-list --reverse HEAD..mdk/<n>` + `git cherry-pick`, çakışmada `--abort` ve dur; PLAN `[x]` işareti JS ile + `adım <n>: [x] işaretlendi (paralel)` commit'i; worktree temizliği; aynı markdown tablo ve çıkış kodları (0/2/9/4). `.sh` yönlendiriciye iner.
  - Kapı: `bash test/mdk-paralel.test.sh && node test/tasima-paralel.test.mjs`
  - Kapı notu (test/tasima-paralel.test.mjs): PATH yalnız `node` + `git` bağları ve sahte `opencode` ile, geçici depoda farklı dosyalara dokunan iki adım `node mdk-paralel.mjs 1 2` → 0, ikisi de `[x]`, tabloda iki satır; aynı dosyaya çakışan iki adım → 9; argümansız → 4.
- [x] 158. Başvurular Node komutlarına
  - Ne: koşturucu çağrıları `bash <ad>.sh`/`./<ad>.sh` yerine `node <ad>.mjs` olur (test betikleri ve `test/hepsi.sh` hariç): `CLAUDE.md`, `esit/gorev-dagitimi.md`, `esit/AGENTS.md`, `esit/ba-pm-bakis.SKILL.md`, `yurutucu-kurallar.md`, `kapi-denetle.mjs:3` yorumu. Tarihçe dosyaları (`docs/gunluk.md`, `PLAN-ARSIV.md`, `personalar.md` karar günlüğü) ve PLAN.md'deki eski adımlar değişmez. `.sh` yönlendiricilerin Mac'te durmaya devam ettiğini CLAUDE.md "İzleme" satırına bir cümleyle yaz.
  - Kapı: `node -e "const fs=require('fs'),A=require('assert');for(const f of ['CLAUDE.md','esit/gorev-dagitimi.md','esit/AGENTS.md','esit/ba-pm-bakis.SKILL.md','yurutucu-kurallar.md']){const s=fs.readFileSync(f,'utf8');A.ok(!/(mdk-adim|mdk-paralel|mdk-incele|persona-tur|mdk-panel|mdk-figma|mdk-esitle)\.sh/.test(s),f)};A.ok(fs.readFileSync('CLAUDE.md','utf8').includes('node mdk-adim.mjs'))"`

## Epic 26 — Test betiklerinin Node'a taşınması
- Durum: gelistirme
Kullanıcı tarifi ("geri kalanı da dönüştür"; Yalın Kip). Kullanıcının "Claude ile yap" talimatıyla Claude elle yazdı (tek seferlik; varsayılan yürütücü kuralı değişmedi). Bu story'ler kayıt içindir, koşturucudan geçmedi.
- [x] 159. Test altyapısı Node'a
  - Ne: `test/hepsi.sh` → `test/hepsi.mjs` (bekleyen kapı atlama aynı; paralel 8 + süreç/süre hassas testler sırayla; `HEPSI_HIZLI=1` uzun koşturucu testlerini atlar; iOS ve `hepsi-hizli` dışarıda). Ortak `test/yardim.mjs` (geçici git deposu, `.mjs` sahte opencode, koşturma, metrik, yetim denetimi). `mdk-ortak.mjs` `komutHazirla`: komut `.mjs/.js` ise node ile; `mdk-figma`/`mdk-esitle` aynı. `kabukKos`: bash yoksa cmd. `mdk-adim` regresyonu ve panel "Testleri koş" `test/hepsi.mjs` (yoksa eski `hepsi.sh`). İzinler `hepsi.mjs`/`mdk-adim.test.mjs`'i de yasaklar.
  - Kapı: `node test/hepsi-hizli.test.mjs`
- [x] 160. Koşturucu testleri Node'a
  - Ne: `test/mdk-adim.test.mjs` (39 vaka, kapılar `node -e` ile; kilit vakaları sabit 1 sn yerine A'nın kilidini bekler), `test/mdk-hiz.test.mjs`, `test/epic-onay.test.mjs`.
  - Kapı: `node test/mdk-adim.test.mjs && node test/mdk-hiz.test.mjs && node test/epic-onay.test.mjs`
- [x] 161. Persona, inceleme ve paralel testleri Node'a
  - Ne: `test/persona-ortak.mjs` + `test/persona-tur.test.mjs` + `test/persona-gorev.test.mjs`, `test/mdk-incele.test.mjs`, `test/mdk-paralel.test.mjs` (paralellik sınırı Node açılışı için <8 sn).
  - Kapı: `node test/persona-tur.test.mjs && node test/persona-gorev.test.mjs && node test/mdk-incele.test.mjs && node test/mdk-paralel.test.mjs`
- [x] 162. Panel, eşitleme, Figma ve iOS testleri Node'a
  - Ne: `test/mdk-panel.test.mjs` (curl yerine fetch), `test/mdk-esitle.test.mjs`, `test/mdk-figma.test.mjs` (sahte bun `.mjs`), `test/ios-ortak.mjs` + `test/ios-{adres,yenile,kabuk,hata}.test.mjs` (yalnız macOS; `ios/` ana dalda olmadığı için koşturulmadı).
  - Kapı: `node test/mdk-panel.test.mjs && node test/mdk-esitle.test.mjs && node test/mdk-figma.test.mjs`
- [x] 163. Bash testleri kaldırıldı, başvurular güncellendi
  - Ne: `test/*.test.sh`, `test/ios-ortak.sh`, `test/hepsi.sh` silindi; bitmemiş adımların (114-117) iOS kapıları `node test/ios-*.test.mjs`; `CLAUDE.md`, `esit/*`, `yurutucu-kurallar.md` yeni adlarla; `mdk-esitle` koşuldu.
  - Kapı: `node test/hepsi.mjs`

## Epic 27 — Pazar radarı
- Durum: gelistirme
- Tartışma: epic/27
- Etki: etki/pazar-radari.html
- Onay: evet
- Figma: https://www.figma.com/design/ov6dUo0vLvaZXGgBout9L2/mdk-paneli?node-id=96-30
Tartışma + Claude sınaması `epic/27/is.md`'de. Radar yeni sekme değil: Araştırma sekmesinin en üstünde "Bu hafta" şeridi. Veri: `strateji/radar.json` (izleme listesi, eşikler, ürün tanımı; hazır), `strateji/radar-sonuc.json` (tarama çıktısı), `strateji/radar-isaret.json` (işaretler).
- [x] 164. Radar taraması ve haftalık fark
  - Ne: yeni `mdk-radar.mjs` (~150 satır, yalnız Node yerleşikleri; `mdk-ortak.mjs:10` `komutHazirla` kullanılır). Kullanım `node mdk-radar.mjs [kök=.]`. `<kök>/strateji/radar.json` okunur: `{ esik: { sicramaYuzde, sicramaMutlak, durmusGun }, izle: [{ repo, grup }] }`. Her `repo` için `gh api repos/<repo>` koşulur (ikili: `MDK_GH` ortam değişkeni, yoksa `gh`; `.mjs` ise `komutHazirla` ile node'la; çağrı başına 20 sn süre sınırı, stdin kapalı). Yanıttan `stargazers_count`, `license.spdx_id`, `pushed_at`, `description` alınır → aday `{ repo, grup, yildiz, lisans, son (YYYY-AA-GG), aciklama, kaynak: 'api' }`. Tek depo hata verirse (çıkış≠0 ya da bozuk JSON) o aday `{ repo, grup, hata: 'alinamadi' }` olur, tarama sürer. Dışa aktarılan saf işlev `farkBul(oncekiAdaylar, simdikiAdaylar, esik, simdiMs)` → `[{ repo, tur, fark }]`: önceki listede hiç olmayan depo `tur:'yeni'`; yıldızı öncekine göre `sicramaYuzde`% ya da `sicramaMutlak` ve fazlası artan `tur:'sicradi'`, `fark:'+N yıldız (%Y)'`; `son` tarihi `durmusGun` günden eski olup önceki taramada eski olmayan `tur:'durdu'`, `fark:'N gündür güncellenmedi'`; hatalı aday hiçbir türe girmez; önceki liste boş/yoksa sonuç `[]` (ilk tarama karşılaştırmasızdır). Çıktı `<kök>/strateji/radar-sonuc.json`: `{ ts (ISO), ilk (bool), adaylar, degisenler, onceki: { ts, adaylar } }` (onceki = bir önceki dosyanın `ts` ve `adaylar`'ı; ilk taramada `null`). Tüm depolar hata verirse ya da `gh` hiç çalıştırılamazsa var olan dosyanın `adaylar/degisenler/onceki/ts` alanları korunur, yalnız `sonHata: { ts, ileti }` eklenir/güncellenir (dosya yoksa `{ adaylar: [], degisenler: [], sonHata }` yazılır) ve çıkış 1; başarıda `sonHata` silinir, stdout'a `radar: N aday, M değişiklik` basılır, çıkış 0. `radar.json` yoksa stderr'e ileti, çıkış 2. Betik doğrudan çalıştırıldığında koşar, `import` edildiğinde koşmaz.
  - Kapı: `node test/radar.test.mjs`
  - Kapı notu (test/radar.test.mjs): geçici klasörde `strateji/radar.json` (3 depo) ve sahte `gh` (`.mjs`; `process.argv`'deki `repos/<ad>`'a göre hazır JSON basar ya da çıkış 1 verir) yazılır, `MDK_GH` ile verilir; ağa çıkılmaz. Vakalar: (1) ilk tarama: çıkış 0, `ilk:true`, `degisenler` boş, adaylarda yıldız/lisans/son/aciklama sahte yanıttaki değerlerle aynı ve `kaynak:'api'`; (2) ikinci tarama, sahte yanıt değişmiş: yıldızı 1000→1300 olan `sicradi`, 1000→1100 olan değişmez, `radar.json`'a yeni eklenen depo `yeni`, `pushed_at`'i 200 gün önceye çekilen `durdu`, `onceki.adaylar` ilk taramanın adaylarıdır; (3) bir depo çıkış 1: o aday `hata:'alinamadi'`, diğerleri dolu, çıkış 0; (4) tüm depolar çıkış 1: çıkış 1, önceki `adaylar` aynen durur, `sonHata.ileti` dolu; ardından başarılı tarama `sonHata`'yı siler; (5) `radar.json` yok: çıkış 2; (6) `farkBul` doğrudan: mutlak eşik (+500) yüzde eşiğinin altında kalsa da `sicradi` üretir, önceki boşken `[]`.
- [x] 165. Değişenlere "senin için" cümlesi
  - Ne: `mdk-radar.mjs` (164'te yazılan dosyanın tamamı). Tarama ve `farkBul`'dan sonra, `degisenler` boş değilse ve `MDK_RADAR_OZETSIZ=1` verilmemişse her değişen için bir cümle üretilir: `<kök>/PLAN.md` başındaki `Görev arastirma:` satırı (`mdk-ortak.mjs:40` `planSatiri`, `:46` `modelListesi`) modelleri verir; opencode ikilisi `oc-sec.mjs` `ocSec()`; çağrı `<oc> run -m <model> --format json --title radar <istem>` (stdin kapalı, 90 sn süre sınırı, `OPENCODE_LOG_LEVEL=error`), yanıt metni `mdk-ortak.mjs:75` `metinAyikla` ya da `type:'text'` olaylarından toplanır. İstem: `radar.json`'daki `urun` metni + deponun adı, grubu, açıklaması ve değişiklik türü/farkı; istenen: "Bu değişiklik ürün sahibi için ne anlama geliyor? Tek Türkçe cümle, en çok 160 karakter, sayı yazma." Yanıtın ilk satırı kırpılıp 200 karakterde kesilerek `degisenler[i].not`'a yazılır. İlk model boş/başarısızsa sıradaki model denenir; hepsi başarısızsa ya da PLAN'da satır yoksa `not: null` kalır ve tarama yine çıkış 0 verir. Modelin yanıtı `yildiz`, `lisans`, `son`, `fark` alanlarını hiçbir koşulda değiştirmez. stdout satırına `, K özet` eklenir.
  - Kapı: `node test/radar-ozet.test.mjs`
  - Kapı notu (test/radar-ozet.test.mjs): `test/yardim.mjs` `stub()` ile sahte opencode (`MDK_OPENCODE`) ve sahte `gh` (`MDK_GH`); geçici kökte `PLAN.md` (`Görev arastirma: m/bir, m/iki`) ve `strateji/radar.json` (`urun` dolu). İki tarama koşulur ki değişen olsun. Vakalar: (1) sahte opencode `metin('Rakip hızla büyüyor; kurulumuna bak.')` basar: değişenin `not`'u bu cümledir, modele giden istemde `urun` metni ve depo adı geçer; (2) sahte opencode yanıtta "yıldız 999999" yazsa da adayın `yildiz` değeri sahte `gh`'nin verdiği sayıdır; (3) ilk model boş metin, ikinci model cümle döndürür: `not` ikinci modelin cümlesi, `modeller.log`'da iki model sırayla; (4) opencode çıkış 1: `not` null, çıkış 0, adaylar dolu; (5) `MDK_RADAR_OZETSIZ=1`: opencode hiç çağrılmaz (sayaç dosyası yok); (6) değişen yokken (ilk tarama) opencode çağrılmaz.
- [x] 166. Araştırma sekmesinde "Bu hafta" şeridi
  - Ne: `panel/sunucu.mjs:420-429` (`/api/arastirma` yanına) yeni `GET /api/radar`: `<kök>/strateji/radar-sonuc.json` + `<kök>/strateji/radar-isaret.json` okunur, `{ sonuc, isaretler }` döner; dosya yok/bozuksa `{ sonuc: null, isaretler: {} }`. `panel/ciz.mjs:1116-1161` (`arastirmaHtml` üstüne) yeni dışa aktarılan `radarHtml(veri, simdiMs = Date.now())`: `sonuc` null → `<div class="radar bos">Henüz tarama yok</div>`; aksi halde başlık `Bu hafta · N değişiklik` (N = işareti olmayan değişen sayısı; 0 ise `Bu hafta sakin`; `sonuc.ilk` ise `İlk tarama yapıldı · K aday izleniyor`), yanında `son tarama: <goreli(ts)>` (`ciz.mjs:1163` `goreli`); `sonuc.sonHata` varsa `<p class="radar-hata">Son tarama başarısız (<goreli>) · gösterilen: <ts tarihi></p>`. Her işaretsiz değişen bir `<details class="radar-satir" data-repo="…">`: `<summary>` içinde tür rozeti (`yeni`/`sıçradı`/`durdu`; renk dışında metinle), depo adı ve varsa `Senin için: <not>` cümlesi (not yoksa `fark` metni); gövdede `★ yıldız · lisans · son · fark` + `<span class="kaynak">kaynak: GitHub API</span>` + GitHub bağlantısı (`target=_blank rel="noopener noreferrer"`). Altında `<details class="radar-izlenen"><summary>İzlenenler (K)</summary>` grup başlıklarıyla tüm adayların tek satırlık listesi (hatalı aday `alınamadı` rozetiyle). Tüm metinler `esc` ile kaçışlanır. `panel/index.html:495-499`: `#arastirma`'dan önce `<section id="radar"></section>`; var olan süzgeç + `#arastirma` bölümü `<details><summary>Eski araştırma notu</summary>…</details>` içine alınır. `panel/index.html:1168-1190`: `fetch('/api/radar')` sonucu `radarEl.innerHTML = radarHtml(v)`; `panel/index.html:540` içe aktarmaya `radarHtml` eklenir; `panel/ciz.mjs:807` Araştırma KPI kartı: `kpiHtml`'e üçüncü parametre `radar` gelir, kartın değeri işaretsiz değişen sayısı (radar yoksa eski `adaylar` sayısı), alt yazı `bu hafta değişen`; `index.html`'deki `kpiHtml(sonD, araVeri)` çağrıları `kpiHtml(sonD, araVeri, radarVeri)` olur. Stil `panel/index.html:344-356` yanına: `.radar` kenarlıklı kutu, `.radar-satir summary` tıklanabilir, rozetler var olan `.rozet` sınıfıyla.
  - Kapı: `node panel/radar.test.mjs`
  - Kapı notu (panel/radar.test.mjs): `radarHtml` doğrudan içe aktarılır. Vakalar: (1) `sonuc:null` → "Henüz tarama yok"; (2) 3 değişenli sonuç → "3 değişiklik", üç `radar-satir`, her birinde tür metni ve `Senin için:` cümlesi, "kaynak: GitHub API"; (3) biri `isaretler`'de işaretli → "2 değişiklik", o depo şeritte yok ama İzlenenler'de var; (4) `degisenler:[]` ve `ilk:false` → "Bu hafta sakin"; (5) `ilk:true` → "İlk tarama yapıldı"; (6) `sonHata` → "Son tarama başarısız" ve adaylar yine listelenir; (7) `not:null` → `fark` metni görünür, "Senin için" yok; (8) açıklamada `<script>` olan aday kaçışlanmış çıkar; (9) `baslat()` ile geçici kökte sunucu: dosyalar yokken `GET /api/radar` → `{sonuc:null,isaretler:{}}`, dosyalar yazılınca içerikleri döner; (10) `kpiHtml(snap, null, {sonuc:{degisenler:[…2 öğe], adaylar:[]}, isaretler:{}})` çıktısında Araştırma kartı `2` ve "bu hafta değişen" içerir.
- [x] 167. Değişeni işaretle: izle / incele / geç
  - Ne: `panel/sunucu.mjs:376-389` (POST uçları yanına) yeni `POST /api/radar-isaret`, gövde `{ repo, isaret }`: `isaret` yalnız `izle|incele|gec`, `repo` `radar-sonuc.json`'un `adaylar`'ında olmalı (değilse 400), gövde 2 KB'ı aşarsa 413; `<kök>/strateji/radar-isaret.json` `{ "<repo>": { isaret, ts, tarama: <sonuc.ts> } }` olarak güncellenir (geçici dosya + `renameSync`), yanıt `{ tamam: true }`. `GET /api/radar` (166) yalnız `tarama === sonuc.ts` olan işaretleri "bu haftanın işareti" sayar: yanıtta `isaretler` bu süzülmüş nesnedir (yeni taramada aynı depo yeniden değişirse şeride geri döner). `panel/ciz.mjs` `radarHtml` satır gövdesine `<div class="radar-eylem">` içinde üç `<button type="button" data-isaret="izle|incele|gec">` (`İzle`, `İncele`, `Geç`) eklenir; İzlenenler listesinde işaretli deponun yanında işaret rozeti görünür. `panel/index.html` radar bölümü: `#radar` üzerinde tıklama delegasyonu → `fetch('/api/radar-isaret', POST)` → başarıda `/api/radar` yeniden çekilip şerit ve KPI kartı yeniden çizilir; hata olursa satırda `kaydedilemedi` yazısı.
  - Kapı: `node panel/radar-isaret.test.mjs`
  - Kapı notu (panel/radar-isaret.test.mjs): `baslat()` ile geçici kökte sunucu, `strateji/radar-sonuc.json` (ts T1, 2 değişen). Vakalar: (1) geçerli POST → 200, dosyada `{isaret:'izle', tarama:T1}`; `GET /api/radar` `isaretler`'de o depo var; (2) `isaret:'sil'` → 400, dosya değişmez; (3) listede olmayan repo → 400; (4) 3 KB gövde → 413; (5) `radar-sonuc.json` `ts` T2 yapılınca `GET /api/radar` `isaretler` boş döner (eski işaret bu haftaya sayılmaz) ama dosyadaki kayıt durur; (6) `radarHtml` çıktısında işaretsiz satırda üç `data-isaret` düğmesi var; işaretli depo şeritte yok, İzlenenler'de işaret rozetiyle var.
- [x] 168. Şimdi tara ve haftalık kendiliğinden tarama
  - Ne: `panel/sunucu.mjs` (`baslat` içi, 166-167'nin uçları yanına): yeni `POST /api/radar-tara` → `mdk-radar.mjs` (sunucu dosyasının üst klasöründeki; ikili `process.execPath`, `cwd` = kök, `MDK_RADAR_BETIK` ortam değişkeni verilmişse o yol) arka planda başlatılır, yanıt `{ basladi: true }`; zaten koşuyorsa `{ basladi: false, suruyor: true }` (aynı anda tek tarama). `GET /api/radar` yanıtına `taraniyor` (bool) eklenir. Aynı uçta: `strateji/radar.json` var, tarama koşmuyor ve (`radar-sonuc.json` yok ya da `ts` 7 günden eski) ise tarama kendiliğinden başlatılır ve yanıtta `taraniyor:true` döner; son denemeden (başarılı ya da başarısız) sonra 1 saat geçmeden yeniden kendiliğinden başlatılmaz. `panel/ciz.mjs` `radarHtml(veri)`: başlığa `<button type="button" id="radar-tara">Şimdi tara</button>`; `veri.taraniyor` ise düğme `disabled` ve metin `Taranıyor…`; boş durumda da düğme görünür. `panel/index.html` radar bölümü: düğme tıklaması → `POST /api/radar-tara`; `taraniyor` iken `/api/radar` 3 sn'de bir yeniden çekilir, bitince şerit ve KPI kartı yeniden çizilir.
  - Kapı: `node panel/radar-tara.test.mjs`
  - Kapı notu (panel/radar-tara.test.mjs): `MDK_RADAR_BETIK` sahte betik (`.mjs`; 300 ms bekler, `strateji/radar-sonuc.json`'a taze `ts` yazar, bir sayaç dosyası artırır); ağa çıkılmaz. Vakalar: (1) `radar.json` var, sonuç yok: `GET /api/radar` → `taraniyor:true`, kısa süre sonra sayaç 1 ve `taraniyor:false`, `sonuc.ts` taze; (2) sonuç 8 gün eski → kendiliğinden başlar; 2 gün eski → başlamaz (sayaç artmaz); (3) `POST /api/radar-tara` → `basladi:true`; bitmeden ikinci POST → `basladi:false, suruyor:true`, sayaç yalnız 1 artar; (4) `radar.json` yokken GET kendiliğinden başlatmaz; (5) sahte betik çıkış 1 verip sonuç yazmazsa ardışık iki GET'te sayaç yalnız 1 artar (1 saat bekleme); (6) `radarHtml({sonuc:null,isaretler:{},taraniyor:false})` "Şimdi tara" düğmesi içerir; `taraniyor:true` iken düğme `disabled` ve "Taranıyor".
- [x] 169. Radar betiği panelin kendi klasöründen çalışsın
  - Ne: `panel/sunucu.mjs:404-407` (`radarBetik`). Bugün varsayılan yol `join(kok, 'mdk-radar.mjs')`: panel başka bir projeyi (kökte `mdk-radar.mjs` olmayan) izlerken "Şimdi tara" hiçbir şey yapmaz. Varsayılan yol sunucu dosyasının üst klasöründeki betik olmalı: `join(fileURLToPath(new URL('..', import.meta.url)), 'mdk-radar.mjs')` (`fileURLToPath` zaten içe aktarılı, satır 7). `MDK_RADAR_BETIK` verilmişse o yol kullanılmaya devam eder; betiğe argüman olarak `kok` verilmesi ve `cwd: kok` aynı kalır. Başka davranış değişmez.
  - Kapı: `node panel/radar-betik.test.mjs`
  - Kapı notu (panel/radar-betik.test.mjs): `MDK_RADAR_BETIK` VERİLMEZ (varsa silinir). Geçici kök klasörde yalnız `strateji/radar.json` (1 depo: `a/b`) vardır, kökte `mdk-radar.mjs` YOKTUR. `MDK_GH` geçici klasördeki sahte `gh` `.mjs` dosyasıdır (stdout'a `{"stargazers_count":5,"license":{"spdx_id":"MIT"},"pushed_at":"2026-11-01T00:00:00Z","description":"x"}` basar, çıkış 0); ağa çıkılmaz. `panel/sunucu.mjs` `baslat(kok, 0)` ile başlatılır (dönüş değerinden port ve kapatma, `panel/radar-tara.test.mjs`'deki kullanım örnek alınır). `POST /api/radar-tara` → `basladi:true`; en çok 15 sn içinde `<kök>/strateji/radar-sonuc.json` oluşur, `adaylar[0].repo === 'a/b'` ve `yildiz === 5`; `GET /api/radar` `taraniyor:false` ve `sonuc.adaylar.length === 1` döner. Sunucu kapatılır, süreç asılı kalmaz.

## Epic 28 — Sağlayıcı hataları: türüne göre davran, sade dille söyle
- Durum: gelistirme
Yalın kip (tartışma yok). Ayrıntı `epic/28/is.md`. Sözleşme: koşturucu nedeni yazar (`metrikler.jsonl` ve `durum.json` içinde `neden`), sade ileti tek yerde üretilir (`mdk-hata.mjs` `iletiBul`), panel onu gösterir.
- [x] 170. Hata sınıflandırıcı ve sade ileti sözlüğü
  - Ne: yeni `mdk-hata.mjs` (~110 satır, yalnız Node yerleşikleri, yan etkisiz; yalnız `gunlukHatasi` dosya okur). Dışa aktarılanlar: (1) `hataSinifla(metin)` → hata yoksa/boş metinde `null`, yoksa `{ tur, gecici }`. `tur` ve örnek kalıplar (büyük-küçük harf duyarsız), öncelik sırasıyla: `kota` (`Free usage limit`, `Go usage limit`, `GoUsageLimitError`, `provider.quota`, `insufficient_quota`, `quota exceeded`) → `kimlik` (`401`, `403`, `invalid api key`, `unauthorized`, `authentication`) → `model_yok` (`model not found`, `ProviderModelNotFoundError`, `unknown model`, `no such model`) → `oran` (`429`, `rate limit`, `too many requests`) → `sunucu` (`500|502|503|504|529` sözcük olarak, `overloaded`, `service unavailable`, `bad gateway`, `internal server error`) → `ag` (`ENOTFOUND`, `ECONNRESET`, `ECONNREFUSED`, `ETIMEDOUT`, `EAI_AGAIN`, `fetch failed`, `socket hang up`) → hiçbiri uymazsa `bilinmeyen`. `gecici` yalnız `oran|sunucu|ag` için `true`. (2) `gunlukHatasi(logYolu)`: `<log>` dosyasında `"type":"error"` içeren satırlar JSON ayrıştırılır (`error.name` + `error.data.message`; ayrışmazsa satırın kendisi), her biri `hataSinifla`'dan geçer; ardından `<log>.err` metni. Dönen: ilk bilinen (bilinmeyen olmayan) sınıf; yalnız bilinmeyen hata olayı varsa `{ tur: 'bilinmeyen', gecici: false }`; hata olayı yok ve `.err` bilinen kalıp içermiyorsa `null`. Dosya yoksa `null`, atmaz. Modelin yazdığı düz metin (`"type":"text"` olayları) asla sınıflanmaz. (3) `bekleMs(tekrar, tabanMs = 5000, tavanMs = 60000)` = `min(tavanMs, tabanMs * 3 ** (tekrar - 1))`. (4) `iletiBul(durum, neden)` → `{ ileti, oneri }` ya da `null`: `neden` şunlardan biriyse ona göre: `kota`, `oran`, `sunucu`, `ag`, `kimlik`, `model_yok`, `yanit_yok`, `butce`, `sure`, `kapi`, `regresyon`, `kurcalama`, `sorun`; `neden` yok/bilinmiyorsa `durum`'a göre: `eskale`, `saglayici`, `kilit`, `kapi_hata`, `ortam_hatasi`, `regresyon_kirmizi`; ikisi de bilinmiyorsa `null`. İletiler Türkçe, teknik olmayan kişiye: `ileti` ne olduğunu (örn. kota: "Ücretsiz modelin bugünkü kullanım hakkı doldu."), `oneri` ne yapılacağını (örn. "Birkaç saat sonra yeniden dene ya da Modeller sekmesinden başka bir model seç.") söyler; her biri tek cümle, en çok 160 karakter.
  - Kapı: `node test/mdk-hata.test.mjs`
  - Kapı notu (test/mdk-hata.test.mjs): `mdk-hata.mjs` doğrudan içe aktarılır; geçici klasörde günlük dosyaları yazılır. Vakalar: (1) `hataSinifla`: `'429 Too Many Requests'`→`oran` gecici true; `'GoUsageLimitError: Go usage limit reached'`→`kota` gecici false; `'429 quota exceeded'`→`kota` (öncelik); `'Invalid API key'`→`kimlik`; `'ProviderModelNotFoundError'`→`model_yok`; `'503 Service Unavailable'` ve `'Overloaded'`→`sunucu` gecici true; `'fetch failed: ECONNRESET'`→`ag` gecici true; `'Failed to execute statement'`→`bilinmeyen` gecici false; `''` ve `null`→`null`; `'port 5000 açıldı'`→`bilinmeyen` (5000 sunucu sayılmaz). (2) `gunlukHatasi`: günlükte `{"type":"error","error":{"name":"APIError","data":{"message":"rate limit exceeded"}}}` satırı → `oran`; günlükte yalnız `{"type":"text","part":{"type":"text","text":"429 rate limit hatasını düzelttim"}}` → `null`; günlük boş, `.err` içinde `Free usage limit` → `kota`; yalnız `UnknownError`/`Failed to execute statement` hata olayı → `bilinmeyen`; olmayan yol → `null`. (3) `bekleMs(1)`=5000, `bekleMs(2)`=15000, `bekleMs(3)`=45000, `bekleMs(4)`=60000, `bekleMs(2, 100, 250)`=250. (4) `iletiBul`: on üç nedenin ve altı durumun her biri için `ileti` ve `oneri` boş olmayan, en çok 160 karakterlik dizgedir; on üç nedenin `ileti`'leri birbirinden farklıdır; `iletiBul('saglayici', 'kota')` `iletiBul('', 'kota')` ile aynıdır (neden önceliklidir); `iletiBul('calisiyor', null)` ve `iletiBul('x', 'y')` → `null`; hiçbir ileti/öneri `429`, `stderr`, `JSON`, `exit` sözcüklerini içermez.
- [x] 171. Koşturucu: geçici hatada bekleyip yeniden dene, kalıcıda sıradaki modele geç
  - Ne: `mdk-adim.mjs:9` (içe aktarma: `./mdk-hata.mjs`'ten `gunlukHatasi`, `iletiBul`, `bekleMs`), `:88` (`yazDurum`'a isteğe bağlı 4. parametre `neden`; verilirse `durum.json`'a `neden` alanı yazılır, verilmezse alan yoktur), `:152-171` (`calistir`), `:196-290` (deneme döngüsü ve çıkış iletileri). Davranış: (a) `calistir` içinde mevcut kota denetimlerinden sonra `neden` hâlâ boşsa ve yürütücü opencode ise `gunlukHatasi(log)` çağrılır; sonuç `oran|sunucu|ag|kimlik|model_yok|kota` ise `neden` o tür olur; `bilinmeyen` ya da `null` ise bugünkü akış sürer (kapı koşar). (b) Döngüde `neden` `oran|sunucu|ag` ise: bu model için geçici tekrar sayacı `MDK_GECICI_TEKRAR` (varsayılan 2) sınırının altındaysa sayaç artar, metrik yazılır (`neden` türle), `sifirla()` çağrılır, `bekleMs(sayaç, MDK_GECICI_BEKLE_MS ortam değişkeni ya da 5000)` kadar beklenir ve AYNI model AYNI deneme numarasıyla yeniden koşar (deneme hakkı tüketilmez); sınır dolduysa `kota` gibi davranılır: sıradaki modele geçilir. Sayaç her modelde sıfırdan başlar. (c) `kimlik|model_yok`: yeniden denenmez, hemen sıradaki modele geçilir. (d) Bu altı tür sağlayıcı sorunudur: `SAGLAYICI` bayrağını düşürmez (eskale modelleri denenmez); tüm modeller sağlayıcı sorunuyla tükenirse çıkış 6, `durum.json` `durum:'saglayici'` ve `neden:` son görülen tür; çıktıya `iletiBul('saglayici', neden)`'in `ileti` ve `oneri` metni basılır. (e) Mevcut `kota`/`yanit_yok`/`butce`/`sorun`/`kapi`/`regresyon` davranışı ve çıkış kodları değişmez. Süreç öldürme (`kos`, `oturumKapat`) ve `sifirla`'nın kendisi değişmez.
  - Kapı: `node test/mdk-adim-hata.test.mjs && node test/mdk-adim.test.mjs`
  - Kapı notu (test/mdk-adim-hata.test.mjs): `test/mdk-adim.test.mjs:1-28` ile aynı kurulum (`test/yardim.mjs`: `depo`, `stub`, `kos`, `metrikler`, `denetci`; ortam `STUB_DIR`, `MDK_OPENCODE`, `POLL:'1'`, `DENEME:'1'`, `SURE:'30'`, `MDK_KILIT`), ayrıca `MDK_GECICI_BEKLE_MS:'50'`. Sahte opencode hata olayını `olay({ type: 'error', error: { name: 'APIError', data: { message: '<ileti>' } } })` ile basar. Kapı `cikti.txt` var mı diye bakar. Vakalar: (1) geçici sonra başarı: 1. çağrıda `'429 Too Many Requests'` hatası, 2. çağrıda `cikti.txt` yazılır, tek model `m/a`, `DENEME=1` → çıkış 0, `modeller.log` = `m/a,m/a`, metriklerde `neden` sırası `oran,-`, `gecti` `false,true`, ikisinin `deneme` değeri 1; (2) hep geçici: her çağrı `'503 Service Unavailable'`, modeller `m/a, m/b`, PLAN'da `Görev eskale: m/e`, `MDK_GECICI_TEKRAR=1` → çıkış 6, `modeller.log` = `m/a,m/a,m/b,m/b` (`m/e` yok), `durum.json` `durum` `saglayici` ve `neden` `sunucu`, çıktı `iletiBul('saglayici','sunucu').ileti` metnini içerir, çalışma ağacı temiz; (3) kalıcı: `m/a` `'Invalid API key'` hatası verir, `m/b` `cikti.txt` yazar → çıkış 0, `modeller.log` = `m/a,m/b`, metrik `neden` sırası `kimlik,-`; (4) bilinmeyen hata engellemez: çağrı `'Failed to execute statement'` hata olayı basar VE `cikti.txt` yazar → çıkış 0, tek çağrı; (5) bekleme: `MDK_GECICI_BEKLE_MS=1200`, 1. çağrı `'rate limit'`, 2. çağrı başarı → çıkış 0 ve koşu süresi en az 1,2 sn; (6) model metni sınıflanmaz: çağrı `metin('429 rate limit hatasını düzelttim')` basar ve `cikti.txt` yazar → çıkış 0, tek çağrı.
- [x] 172. Panelde sade ileti ve önerilen adım
  - Ne: `panel/durum.mjs:20-26` (`simdi` okunduktan sonra): `../mdk-hata.mjs`'ten `iletiBul` içe aktarılır; `simdi.durum` `calisiyor|regresyon|persona|kapi_yaziliyor|gecti` DEĞİLSE `simdi.aciklama = iletiBul(simdi.durum, neden)` (null ise alan eklenmez); `neden` = `simdi.neden`, yoksa `<kök>/metrikler.jsonl`'de `adim === simdi.adim` olan son kaydın `neden`'i. `panel/ciz.mjs:5` (`DURUM_ETIKET`'e eksikler: `kilit`, `kapi_hata`, `ortam_hatasi`, `kapi_yaziliyor`, `persona` Türkçe etiketleri) ve `:100-114` (`suAnHtml`): `simdi.aciklama` varsa `.ana` bloğunun ardına `<div class="aciklama"><b>{ileti}</b><span>{oneri}</span></div>` eklenir (ikisi de `esc` ile kaçırılır); yoksa hiçbir şey eklenmez. `panel/index.html` (stil bloğu, `.ana` kuralının yanına): `.aciklama` için sade uyarı kutusu stili (mevcut renk değişkenleriyle; yeni renk tanımlama). `ciz.mjs` tarayıcıda da yüklenir: `mdk-hata.mjs`'i `ciz.mjs`'ten içe AKTARMA.
  - Kapı: `node panel/aciklama.test.mjs`
  - Kapı notu (panel/aciklama.test.mjs): `snapshot` (`panel/durum.mjs`), `suAnHtml` (`panel/ciz.mjs`) ve `iletiBul` (`mdk-hata.mjs`) içe aktarılır; geçici klasörde `PLAN.md` (tek adımlı), `durum.json`, `metrikler.jsonl` yazılır. Vakalar: (1) `durum.json` `{adim:1,durum:'saglayici',neden:'kota'}` → `snapshot().simdi.aciklama` `iletiBul('saglayici','kota')` ile derin eşit; (2) `durum:'eskale'`, `neden` yok, metriklerde adım 1'in son kaydı `neden:'kapi'` (öncesinde `neden:'sure'` kaydı ve başka adımın `neden:'kota'` kaydı var) → `aciklama` `iletiBul('eskale','kapi')` ile eşit; (3) `durum:'calisiyor'` ve `durum:'gecti'` → `aciklama` alanı yok; (4) `durum.json` yok → `simdi` null, atmaz; (5) `suAnHtml({ adim:1, baslik:'İş', durum:'saglayici', ts, aciklama:{ ileti:'A <b> mesaj', oneri:'B öneri' } }, ts)` çıktısında `class="aciklama"` bir kez geçer, `A &lt;b&gt; mesaj` ve `B öneri` vardır, ham `<b> mesaj` yoktur; (6) `aciklama`'sız aynı çağrıda `class="aciklama"` yoktur; (7) `suAnHtml({ ...durum:'kilit' })` ve `'kapi_hata'` çıktısında durum alanı ham anahtar (`kilit`, `kapi_hata`) değil Türkçe etikettir.

## Epic 29 — Koşturucu denetimleri: story boyutu ve başarısız test özeti
- Durum: analiz
Yalın kip. Ayrıntı `epic/29/is.md`. Engelleme yok: boyut yalnız uyarır.
- [ ] 173. Başarısız testin özünü ayıkla, story boyutunu ölç
  - Ne: yeni `mdk-denetim.mjs` (~90 satır, saf, yan etkisiz) + `mdk-adim.mjs`. (1) `hataOzeti(metin, sinir = 1500)`: kapı çıktısından başarısız iddiayı ayıklar. Sırayla toplanır: `BAŞARISIZ` içeren satırlar (en çok 5); `AssertionError` içeren ilk satır ve ardından gelen, boş satıra ya da `    at ` ile başlayan satıra kadar olan satırlar (en çok 20; `+ actual - expected` farkı burada kalır); bulunamazsa `Error` ile biten sözcük + `:` içeren ilk satır (`TypeError: …`, `SyntaxError: …`, `Error: …`); `node:` ya da `node_modules` içermeyen ilk yığın satırı (`at … dosya:satır:sütun`). Toplanan parçalar satır sonuyla birleştirilir, `sinir` karakteri aşarsa baştan `sinir` karakter alınır. Hiçbir parça bulunamazsa (ya da metin boşsa) metnin son `sinir` karakteri döner (bugünkü davranış). (2) `boyutDenetle({ dosya, satir })` (`satir` = eklenen + silinen): `satir < 60` → `{ tur: 'kucuk', ileti }`; `satir > 250` ya da `dosya > 3` → `{ tur: 'buyuk', ileti }`; arası `null`. `ileti` Türkçe tek cümle, ölçülen sayıları ve sınırı içerir. (3) `mdk-adim.mjs:19` `MODULLER` listesine `mdk-denetim.mjs` eklenir ve `:25`'teki `mdk-hata.mjs` içe aktarması gibi (dosya yoksa bugünkü davranışa düşen yedekle) içe aktarılır; `:284` kapı/kurcalama ipucu `sonBayt(kapiLog, 1500)` yerine `hataOzeti(oku(kapiLog), 1500)` kullanır (ipucu başlığı "Kapı çıktısından başarısız iddia:" olur); `:260` metrik kaydına `boyut` alanı eklenir: deneme geçtiyse `boyutDenetle`'nin `tur`'u ya da `null`, geçmediyse `null`; adım geçtiğinde boyut sınır dışıysa "geçti" satırından önce `UYARI: story boyutu: <ileti>` basılır (çıkış kodu yine 0).
  - Kapı: `node test/mdk-denetim.test.mjs && node test/mdk-adim.test.mjs`
  - Kapı notu (test/mdk-denetim.test.mjs): iki bölüm. Bölüm A, `mdk-denetim.mjs` doğrudan: (1) 3000 karakterlik dolgu satırlarının ORTASINDA gerçek Node çıktısı (`AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` + boş olmayan `+ actual - expected`, `+ 'a'`, `- 'b'` satırları + `    at Object.<anonymous> (/x/panel/ornek.test.mjs:12:8)` + `    at node:internal/main:1:1`) ve sonda 2000 karakter dolgu → `hataOzeti` çıktısı `AssertionError`, `+ 'a'`, `- 'b'` ve `ornek.test.mjs:12:8` içerir, `node:internal` içermez, uzunluğu ≤ 1500; aynı metnin son 1500 karakteri `AssertionError` İÇERMEZ (ayıklamanın kuyruktan iyi olduğunun kanıtı); (2) `· vaka\nBAŞARISIZ [vaka]: çıkış 0\n…` → `BAŞARISIZ [vaka]: çıkış 0` içerir; (3) `TypeError: x is not a function\n    at f (/x/a.mjs:3:1)` → ikisini de içerir; (4) tanınmayan 4000 karakterlik metin → metnin son 1500 karakterine eşit; (5) `''` → `''`; (6) `hataOzeti(metin, 200)` uzunluğu ≤ 200. `boyutDenetle`: `{dosya:1,satir:10}`→`kucuk`; `{dosya:2,satir:60}`→`null`; `{dosya:3,satir:250}`→`null`; `{dosya:2,satir:251}`→`buyuk`; `{dosya:4,satir:100}`→`buyuk`; iletiler boş olmayan dizge ve ölçülen satır sayısını içerir. Bölüm B, koşturucu (`test/mdk-adim.test.mjs:1-28` kurulumu, `test/yardim.mjs` `depo`/`stub`/`kos`/`metrikler`): (7) sahte opencode yalnız `cikti.txt` (1 satır) yazar, kapı o dosyanın varlığı → çıkış 0, çıktıda `UYARI: story boyutu` var, metrikte `boyut` `kucuk`; (8) sahte opencode 100 satırlık `cikti.txt` yazar → çıkış 0, `UYARI: story boyutu` yok, metrikte `boyut` `null`; (9) kapı `node kapi.mjs` (depoda hazır; ilk 2500 karakter dolgu basar, sonra `assert.equal(oku('cikti.txt'), 'dogru')` ile `AssertionError` atar), `DENEME=2`, sahte opencode 1. çağrıda `yanlis`, 2. çağrıda `dogru` yazar → çıkış 0 ve 2. çağrının istemi (`istem-2.txt`) `AssertionError` sözcüğünü içerir.

## Epic 30 — Kapıyı sade dille göster ve onaylat
- Durum: analiz

## Epic 31 — Maliyet ve deneme göstergesi
- Durum: analiz

## Epic 32 — Rol → model profilleri
- Durum: analiz

## Epic 33 — Yapılacaklar listesi ve panelden iş girişi
- Durum: analiz

## Epic 34 — Bağlam bütçesi
- Durum: analiz

## Epic 35 — Persona tartışmasında bağımsız ilk görüş
- Durum: analiz

## Epic 36 — Yalıtılmış test ve geri alınabilir adım
- Durum: analiz

## Epic 37 — Terminalsiz kurulum
- Durum: analiz

## Epic 38 — Hakem (judge) modeliyle geçti / geçmedi
- Durum: analiz

## Sonraki iyileştirmeler
- **Yapılacaklar Epic'lere çevrildi (kullanıcı kararı, 2026-11-15).** Sıra mantığı: önce koşturucunun güvenilirliği (boşa giden deneme), sonra kullanıcının gördüğü güven ekranları, sonra iş girişi, en sonda büyük mimari işler ve kurulum. Eski madde numaraları parantezde.
  - Epic 28 Sağlayıcı hataları (8+9) → Epic 29 Koşturucu denetimleri (6+12) → Epic 30 Kapıyı sade dille göster (1) → Epic 31 Maliyet ve deneme göstergesi (3) → Epic 32 Rol → model profilleri (10) → Epic 33 Yapılacaklar listesi ve panelden iş girişi (4+5) → Epic 34 Bağlam bütçesi (13) → Epic 35 Persona bağımsız ilk görüş (14) → Epic 36 Yalıtılmış test ve geri alma (15) → Epic 37 Terminalsiz kurulum (2+11; Windows denemesi 7 bu Epic'in elle adımı).
  - Park: depo haritası (16). Tree-sitter gerektirir, "bağımlılık yok" kuralına ters; Epic 34 (bağlam bütçesi) sonuçlarına göre yeniden bakılır.
  - Lisans: agent-kanban ve `dyad/src/pro` FSL; bunlardan yalnız fikir alınır, kod alınmaz.
  - 2026-11-14 listesinden tamamlananlar (kayıt için): personaların yeniden tasarımı (Epic 22-23), bash koşturucuların ve testlerin Node'a taşınması (Epic 25-26).
  - Bilinen kusur (Epic 27): Araştırma sekmesine geçince "Eski araştırma notu" kendiliğinden açılıyor; tarayıcı `#arastirma` adres parçasının hedefi `<details>` içinde olduğu için onu açıyor. Çözüm: içteki `section` kimliğini değiştirmek (`panel/arastirma.test.mjs:70` ve `panel/sekme.test.mjs:55` de güncellenir).
  - Teknik inceleme yapıldı (2026-11-15, Copilot CLI kuruldu): altı depo `strateji/teknik/` altında, sıralı fikir listesi `strateji/teknik/ozet.md`. İlk iki fikir Epic 28 oldu.
- Kapıları (testleri) belirleme biçimini iyileştir: şu an adım başına dar, tek komut. Hedef: yapılan geliştirmeyi kapsayan (başarı/hata/sınır durumu, kullanıcı senaryosu) net kapılar.
- Personalar (2026-10-27, adım 31-39 ve 58): `personalar.md` v2 üç alan, `persona-tur.sh` ile OpenCode'da ücretsiz modelle çalışıyor. Üç alan da gerçek kararla denendi (adım 36-38, 60-61); sessiz model 60 sn sonra atlanır (adım 59, `PERSONA_ILK`).
- Gözlem: adım 7 yaklaşık 730 bin token harcadı (diğerleri 40-140 bin); adım başına token bütçesi ve dar adım kuralı düşünülebilir.
