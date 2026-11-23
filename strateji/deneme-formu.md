# Aday araç deneme formu (G3)

**Orca kurulumu:** `brew install --cask stablyai/orca/orca`. Çıplak `brew install orca` başka bir ürün kurar, kullanma. Ya da https://orca.dev/download. Sonra Orca'da Ayarlar → General → Orca CLI ile `orca` komutunu kaydet.

Amaç: masa başı araştırmanın göremediğini görmek: araç gerçekten MDK'nın bir katmanının yerine geçer mi? Süre: araç başına **en çok 1 saat**. Aynı küçük iş her araçta yapılır ki karşılaştırma adil olsun.

**Deneme işi (sabit):** aşağıdaki "Deneme story'si". Aynı iş önce MDK'da (`node mdk-adim.mjs`), sonra Orca'da yapılır. Böylece iki araç doğrudan karşılaştırılır.

| Soru | Araç 1: | Araç 2: |
|---|---|---|
| Kurulum süresi (dk), terminal gerekti mi? | | |
| İşi hangi ajan/model yaptı, aboneliğimle mi çalıştı? | | |
| İş baştan sona kaç dakikada bitti? | | |
| Kabul şartını kontrol edebildi mi (test koştu mu, ben mi baktım)? | | |
| Bozulunca ne oldu: kendi düzeltti mi, kota yaktı mı? | | |
| Paralel iki iş verdim: çakıştı mı? | | |
| Ne kadar şey öğrenmem gerekti (1 az – 5 çok)? | | |
| MDK'da yapamadığım, bunda kolay olan ne? | | |
| Bunda olmayan, MDK'da olan ne (kapı, maliyet kaydı, Epic/Story)? | | |
| Tek cümlelik his: | | |

### Orca'ya özgü sorular (katmanlar.md'deki 6. ve 7. katman kararı bunlara bağlı)
| Soru | Sonuç |
|---|---|
| `orca orchestration worker-start` arayüz (GUI) kapalıyken de çalışıyor mu? (Belgeye göre hayır, açık uygulamayı yönetiyor; doğrula) | |
| `--agent opencode` (ve model seçimi) seçtiğim modeli gerçekten kullandı mı? | |
| İşçi `worker_done` dedikten sonra MDK kapısını (aşağıdaki kapı komutunu) Orca'ya dokunmadan koşabildim mi? | |
| Kullanım ekranı aboneliklerimi (Claude, Antigravity, OpenCode Go) gösterdi mi? | |

## Deneme story'si (gerçek, açık kusur)
- **Ne:** `mdk-hata.mjs`: `kota` sınıfında hata metni Go aylık kotasından geliyorsa (`go usage limit`, `gousagelimiterror`) ileti "Ücretsiz modelin bugünkü kullanım hakkı doldu" yerine aylık Go kotasının dolduğunu söylesin ve öneri "kota yenilenene kadar abonelik modellerine (Claude/Antigravity) geç" olsun. Ücretsiz günlük kota iletisi (`free usage limit`) aynen kalsın.
- **Kabul:** Go kota hatasında kullanıcı "bugünkü" değil "aylık Go kotası" iletisini görür; ücretsiz kota hatasında eski ileti değişmez; mevcut `test/mdk-hata*.test.mjs` testleri yeşil kalır.
- **Kapı:** `node --test test/mdk-hata.test.mjs test/mdk-hata-retry.test.mjs` + Go/ücretsiz ayrımını sınayan yeni vaka (MDK'da kapı modeli yazar; Orca'da aynı vakayı elle ekle).
- Not: Claude story'yi PLAN.md'ye ancak sen "denemeye başlıyorum" deyince ekler (temiz ağaç ve numara için).

Doldurduktan sonra Claude'a "deneme formu doldu" demen yeterli.
