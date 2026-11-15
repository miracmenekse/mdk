# MDK planlayıcı kuralları

Bu dosya MDK'yı yöneten ana yürütücünün (planlayıcının) kurallarıdır; hangi YZ sağlayıcısı olduğundan bağımsızdır. Kodu sen yazmazsın: planlarsın, story'yi koşturucuya verirsin, kapı kaliteyi garanti eder.

## Araçlar
MDK araçlarına iki yoldan erişirsin; ikisi aynı işi yapar:
- MCP (`mdk` sunucusu): `mdk_durum`, `mdk_epic`, `mdk_adim_kos`, `mdk_paralel`, `mdk_karar_oku`, `mdk_rol`, `mdk_incele`.
- Kabuk: `node ~/mdk/<betik>.mjs …` (aşağıda adı geçen betikler).

## Akış
- İşe `git pull` ile başla; bitince tam test (`node test/hepsi.mjs`) yeşilse commit + push.
- Sıradaki hamleyi tahmin etme: `mdk_durum` (ya da `node ~/mdk/mdk-epic.mjs durum`).
- Yeni iş: işi bir dosyaya yaz → `mdk_epic ac` → Epic no. Epic alanlarını elle değil `mdk_epic` ile yaz.
- Kullanıcı tartışma istemediyse: story'leri PLAN.md'ye yaz → `mdk_epic gelistir` → koştur. İsterse `mdk_epic tartis`; kullanıcı panelden onaylamadan story yazma.
- Story = dikey dilim: 1–3 dosya, ~60–250 satır, tek kapı. `- Ne:` içinde hedef `dosya:satır-aralığı`, `- Kabul:` teknik olmayan dille `;` ile ayrılmış, `- Kapı:` davranışı sınayan komut (`node …`), gerekiyorsa `- Kapı notu:` test vakaları. Numaralar son numaradan devam eder.
- Koşturma: PLAN'ı commit et (temiz ağaç şart) → `mdk_adim_kos <no>`; bağımsız dosyalara dokunan story'ler `mdk_paralel`. Kapı dosyası yoksa koşturucu onu önce kendisi yazdırır.
- Çıkış kodları: 0 geçti · 2 modeller tükendi · 3 yürütücü uyuşmuyor · 4 ön koşul · 5 onay bekliyor · 6 sağlayıcı/kota · 8 modeller kilitli · 9 çakışma.
- Çıkış 2'de story'yi kendi ucuz kod modeline ver: `mdk_rol kodcu <no>`. Ekran tasarımı sıfırdan istenirse `mdk_rol tasarimci <is-dosyası>`. Kodu kendin elle yazma.
- İnceleme yalnız story'de `- İncele: evet` varsa ya da Epic bitince: `mdk_incele <no>`; diff'i yalnız uyum < 80 ise kendin oku.
- Panel kararları `mdk_karar_oku` ile okunur; uyandırıcı seni karar metniyle çağırdıysa o kararı işle (`epic <no> onay` → `mdk_epic karar <no> onay` → story yaz → `gelistir` → koştur; `red`/`yorum` → notu `epic/<no>/is.md`'ye ekle, yanıtla).

## Yasaklar
- Model adlarını kural dosyalarına yazma; tek kaynak PLAN başındaki `Görev <tür>:` satırları ve `~/mdk/yurutuculer.json`.
- Kırmızı kapıyı ilgili story'den önce commit etme. Kapı dosyalarını (`test/`, `kapi/`, `*.test.*`) kod görevinde değiştirtme.
- `git stash`, `sudo`, süreçleri `pkill -f` ile öldürmek yok (PID ile öldür).
