# MDK (MM Development Kit)

Amaç: Claude planlar, OpenCode (ücretsiz modellerle) geliştirir; kalite kapıdan geçerek garanti edilir.
Bu plan bu aracın kendi canlı kontrol panelini ve etki görünümünü yapar.

Yürütücü: opencode
Modeller: opencode-go/glm-5.3-flash, opencode-go/glm-5.3, opencode-go/deepseek-v4.1-flash
Görev kod: opencode-go/glm-5.3-flash, opencode-go/glm-5.3, opencode-go/deepseek-v4.1-flash
Görev tasarim: opencode-go/glm-5.3-flash, opencode-go/mimo-v2.6-pro
Görev persona: opencode-go/gpt-6-luna, opencode-go/beam-free
Görev kapi: opencode-go/gemini-4-argon, opencode-go/gpt-5.6-luna
Görev inceleme: opencode-go/gemini-4-argon, opencode-go/gpt-5.6-luna
Görev eskale: opencode-go/qwen3.8-max, opencode-go/glm-5.3
Görev mekanik: opencode-go/mimo-v2.6-flash
Görev arastirma: opencode-go/glm-5.3-flash

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
  - Ne: `panel/plan.mjs` dosyasına `export function parse(text)` yaz. Dönüş: `{ ayarlar: { yurutucu, modeller: [..] }, kategoriler: [{ ad, adimlar: [{ no, baslik, bitti, kapi, yurutucu, etki, deger }] }] }`.
  - `## Ad` satırı yeni kategoridir; adımı olmayan kategori listelenmez. `- [x]` bitti demektir. `no` sayıdır, `deger` sayıdır, yoksa `null`. Adımın `yurutucu`'su yoksa dosyanın üstündeki `Yürütücü:` değeri gelir. `Modeller:` virgülle ayrılır, kırpılır.
  - Kapı: `node panel/plan.test.mjs`

- [x] 2. Durum birleştirici
  - Ne: `panel/durum.mjs` dosyasına `export function snapshot(dir)` yaz. `dir` içindeki `PLAN.md` (parse ile), `durum.json` ve `metrikler.jsonl` dosyalarını okuyup `{ plan, simdi, modeller, etki: [] }` döner. Dosya yoksa `simdi: null`, `modeller: []`. `metrikler.jsonl`'da bozuk satırlar atlanır. `modeller` her model için `{ model, deneme, gecen, ilkDenemeOrani, token, maliyet, ortSure }` verir (`ilkDenemeOrani` = `deneme===1` satırlarının geçme oranı; `ortSure` = `sure_sn` ortalaması). `plan.mjs`'in `parse` fonksiyonunu kullan. `etki` alanı adım 6'da doldurulur, şimdilik `[]`.
  - Kapı: `node panel/durum.test.mjs`

- [x] 3. Canlı sunucu
  - Ne: `panel/sunucu.mjs` dosyasına `export async function baslat(dir, port)` yaz; `{ port, kapat() }` döner (`port` 0 ise boş port; yalnızca `127.0.0.1`). Rotalar: `GET /api/durum` → `snapshot(dir)` JSON; `GET /olay` → SSE (`text/event-stream`): bağlanınca hemen `data: <snapshot json>\n\n`, sonra `dir` içindeki `PLAN.md`, `durum.json`, `metrikler.jsonl` değişince (fs.watch, ~150 ms debounce) yenisi; `GET /` → `panel/index.html` (dosya yoksa 404). `kapat()` açık SSE bağlantılarını da kapatır (`server.closeAllConnections()`). Dosya doğrudan çalıştırılırsa (`node panel/sunucu.mjs [dizin] [port]`, varsayılan `.` ve `4747`) başlatıp adresi yazdırır.
  - Kapı: `node panel/sunucu.test.mjs`

- [x] 4. Arayüz
  - Ne: `panel/index.html` yaz, tek dosya, satır içi CSS/JS, açık/koyu temaya uyumlu (`prefers-color-scheme`), telefon genişliğinde taşmaz. Bölümler: `id="simdi"` ("şu an" kartı: adım, model, deneme, durum, geçen süre; `simdi` null ise "boşta"), `id="kategoriler"` (kategori başlıkları altında adımlar, durum rozetiyle: bitti / çalışıyor / bekliyor / eskale), `id="modeller"` (model tablosu: deneme, ilk denemede geçme %, token, maliyet, ortalama süre). `new EventSource('/olay')` ile canlı güncellenir; bağlantı kopunca "bağlantı yok" gösterir. Sade, okunaklı bir iç araç paneli görünümü hedefle.
  - Kapı: `node panel/arayuz.test.mjs`

## Etki görünümü
- [x] 5. Etki taslağı örneği
  - Ne: `etki/ORNEK.html` yaz: gri tonlu, düşük çözünürlüklü "önce / sonra" kroki. İki `<svg>`: `id="once"` ve `id="sonra"`; sonrada değişen bölgeler `class="degisen"` ile renkli vurgulanır. Script yok, 6000 karakterden kısa. Bir örnek ekran seç (ör. basit bir rapor sayfasına filtre eklenmesi).
  - Kapı: `node etki/ornek.test.mjs`

- [x] 6. Maliyet tahmini ve etki listesi
  - Ne: `panel/tahmin.mjs` → `export function tahmin(satirlar, adimSayisi)`: `gecti===true` satırların `token` ve `maliyet` medyanı × `adimSayisi` → `{ token, maliyet, guven }`; geçen satır <3 `'dusuk'`, 3-9 `'orta'`, 10+ `'yuksek'`; hiç yoksa `{ token: 0, maliyet: 0, guven: 'dusuk' }`. `panel/durum.mjs`'in `snapshot`'ında `etki`'yi doldur: bitmemiş ve `etki` alanı olan adımlar için `{ no, baslik, dosya, deger, tahmin: tahmin(metrikSatirlari, 1) }`.
  - Kapı: `node panel/etki.test.mjs && node panel/durum.test.mjs`

- [x] 7. Etki sekmesi
  - Ne: `panel/index.html` içine `id="etki"` bölümü ekle: her etki adımı için başlık, değer (1-5 yıldız/çubuk), tahmini token ve maliyet (güven rozetiyle), "değer / maliyet" göstergesi (basit yatay çubuk). Taslak dosyası (`dosya`) panelde `<iframe>` ile (sunucu `GET /dosya?yol=etki/...` ile proje içi `.html` dosyasını verir; `..` ve mutlak yol reddedilir) önce/sonra yan yana gösterilir. Sunucuda bu rotayı `panel/sunucu.mjs`'e ekle.
  - Kapı: `node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`

## Süreç
- [x] 8. BA/PM bakışı becerisi
  - Yürütücü: claude
  - Ne: `~/.claude/skills/ba-pm-bakis/SKILL.md` ve proje içinde `personalar.md`: plan yazarken problem+hipotez, iş değeri, akış/kullanım kolaylığı, risk bölümleri; UI/akış kararlarında bağımsız bakışlarla (kullanıcı, farklı personalar, benchmark) seçenek üretme ve karşılaştırma tablosu; en fazla 3 soru, varsayılanlı.
  - Kapı: `test -f ~/.claude/skills/ba-pm-bakis/SKILL.md && test -f personalar.md`

## Karar notu: Geçmiş görünümü (ba-pm-bakis ile üretildi, 2026-10-17)
Hipotez: "Ücretsiz model işi kaliteyle yaptı mı, nerede zorlandı, plana uygun mu?" sorusu, adım başına geçmiş (deneme, neden, commit, Claude incelemesi) görününce açmadan yanıtlanır.
Başarı ölçütü: kullanıcı panele bakınca 0 tıkta sorunlu adımları, en çok 1 tıkta nedenini görür.
Beş bağımsız bakış (4 persona + benchmark) 8 seçenek verdi:

| # | Seçenek | Kaynak | Tık | Değer | Maliyet | Risk |
|---|---|---|---|---|---|---|
| 1 | Hüküm şeridi + açılır satır | BA/PM A | 0 / 1 | kalite sorusu tek bakışta | orta | tek rozet ayrıntıyı gizler |
| 2 | Adım zaman çizelgesi kartları (hepsi açık) | BA/PM B | 0 ama kaydırma | hikâye tam okunur | düşük-orta | uzun sayfa, log görünümüne kayar |
| 3 | Denetim izi, satır içi açılır | denetçi A | 2 | hiçbir deneme gizlenmez | orta | uzun sayfa; özet şerit başarısızı küçük gösterir |
| 4 | "Dikkat" bloğu + tam tablo | denetçi B | 1 / 2 | sorunlular açmadan görünür | orta | eşik yanlışsa yanlış güven |
| 5 | Sapma çizelgesi satıra gömülü, ayrı Geçmiş bölümü yok | minimalist A | 0 / 1 | sorun bir bakışta | düşük | mobilde semboller okunmaz |
| 6 | Sorunlu adımlar özet cümle + kartlar | minimalist B | 1 | sayılar ve istisnalar | düşük | sorunsuz görünende gizli zayıflık |
| 7 | Satır içi `<details>` | geliştirici A | 1 / adım | bağlam yanında | en düşük | genel bakış yok |
| 8 | Rozetli özet, sorunlular otomatik açık | geliştirici B | 0 / 1 | açmadan cevap; saf fonksiyon test edilir | düşük | eşik tek sabit olmalı |

Benchmark (kaynaklı): GitHub Actions başarısız adımı otomatik açık getirir (docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/monitoring-workflows/using-workflow-run-logs); Jenkins Blue Ocean kırılan adımın logunu 0 ek tıkla gösterir (jenkins.io/doc/book/blueocean/pipeline-run-details/); Buildkite yeniden denemeleri varsayılan gizler, genişletilince gösterir, geçmişi saklar (buildkite.com/docs/pipelines/configure/retry); Temporal olay satırı seçilince ayrıntı açar (docs.temporal.io/web-ui). Argo Workflows: doğrulanamadı.
Yakınsama: tüm bakışlar "özet satır + açılır ayrıntı, sorunlu açık" desenine geldi. Gerçek ayrım iki yerde: (a) ayrı bölüm mü, satıra gömülü mü (kullanıcının "Geçmiş bölümü" önerisinden farklı yaklaşım: 5), (b) her şey açık zaman çizelgesi (2).
Karar: 5 + 8 + 6'nın birleşimi: ayrı bölüm yok, her adım satırına özet ve `<details>` gömülür; sorunlu adım açık gelir; üstte tek cümlelik hüküm ve "sadece sorunlu" süzgeci. Riskleri azaltan kurallar: (1) incelenmemiş adım asla "uyumlu" görünmez, gri "incelenmedi" der; (2) `+/−` satır sayısı özette görünür (sorunsuz görünen büyük diff gizlenmez); (3) ayrıntıda başarısız denemeler dahil hiçbir deneme gizlenmez; (4) "sorunlu" eşiği tek sabit ve testli.
Taslak: etki/gecmis.html. Uygulama maliyeti tahmini: bir veri adımı (~60-140k token) + bir arayüz adımı (adım 7 gibi yüksek olabilir, bütçeli).

## Çalıştırıcı sertleştirme
Not (2026-10-17): Parti A'da ücretsiz modeller "Rate limit exceeded" verdi; çalıştırıcı bunu 6 × 900 sn "kapı geçmedi" sandı (0 token, boş günlük). Bu adımlar eskale edildi, `kodcu` yapar. Yanıt vermeme tespiti adım 11'e eklendi.
- [x] 9. Çoklu kapı
  - Yürütücü: kodcu
  - Ne: `mdk-adim.sh`: bir adımda birden fazla `- Kapı: \`...\`` satırı olabilir. Hepsi sırayla çalışır, ilk başarısız olanda durur ve o kapının çıktısı `$log.kapi` dosyasına yazılır; hepsi 0 verirse adım geçer. Şu an `grep -m1` yalnızca ilkini alıyor. Hiç Kapı satırı yoksa mevcut davranış kalır (çıkış 4). Betikteki donmuş kopya ve kurcalama kontrolü bloklarına dokunma.
  - Kapı: `bash test/mdk-adim.test.sh temel coklu`

- [x] 10. Taslak onayı zorunluluğu
  - Yürütücü: kodcu
  - Ne: `mdk-adim.sh`: adım bloğunda `- Etki:` satırı varsa ve `- Onay: evet` satırı yoksa, opencode'u HİÇ çağırmadan `adım N taslak onayı bekliyor: PLAN.md'ye "- Onay: evet" ekle` yazıp çıkış kodu 5 ile çık. Kontrol, git ağacı kontrollerinden sonra, deneme döngüsünden önce yapılır.
  - Kapı: `bash test/mdk-adim.test.sh temel coklu onay`

- [x] 11. Süreç grubu, süre sınırı ve başarısızlık nedeni
  - Yürütücü: kodcu
  - Ne: `mdk-adim.sh`: `timeout` yerine `opencode run` komutunu `setsid ... </dev/null >"$log" 2>"$log.err" &` ile arka planda başlat, `pid=$!` al. Her `POLL` saniyede (ortam değişkeni, varsayılan 3) `kill -0 $pid` ile kontrol et; `SURE` saniyeyi aşarsa süreç grubunu öldür: `kill -TERM -- -$pid`, 2 sn sonra `kill -KILL -- -$pid`. Süreç bitince `wait $pid` yap; bitişte grupta (`pgrep -g $pid`) yetim süreç kalmadığından emin ol, kalmışsa KILL. Metrik satırına `neden` alanı ekle: başarılıysa `null`; değilse `"sure"` (süre aşımı), `"kurcalama"` ya da `"kapi"` (öncelik bu sırada). Başarısızlık mesajına nedeni yaz. Ayrıca sağlayıcı sessizliği: `ILK` (ortam değişkeni, varsayılan 90) saniye içinde günlüğe (`$log`) hiç olay yazılmazsa (dosya boş) süreç grubunu aynı şekilde öldür, `neden` = `"yanit_yok"`, o modelin kalan denemelerini atla ve sıradaki modele geç (sessiz modeli yeniden denemek boşuna; ücretsiz kota dolunca OpenCode çıkmadan sessizce bekliyor). Tüm modeller `yanit_yok` ile biterse çıkış kodu 6 (eskale 2 değil), durum `"saglayici"`, mesaj "sağlayıcı yanıt vermiyor". Başlık satırındaki çıkış kodu açıklamasına 6'yı ekle.
  - Kapı: `bash test/mdk-adim.test.sh temel coklu onay neden sure yanit_yok`

- [x] 12. Token bütçesi
  - Yürütücü: kodcu
  - Ne: `mdk-adim.sh`: adım bloğunda `- Bütçe: N` (token) ya da dosyanın başında `Bütçe: N` satırı varsa (adım satırı önceliklidir), bekleme döngüsünde her turda günlükteki `step_finish` olaylarının `part.tokens.total` toplamını (mevcut `topla` fonksiyonu) hesapla; N'yi aşarsa süreç grubunu aynı şekilde öldür ve `neden` alanına `"butce"` yaz. Bütçe yoksa kontrol yapma. Kontrol adım sınırında olduğundan tek adım bütçeyi biraz aşabilir; bunu betikte `# ponytail:` yorumuyla not et.
  - Kapı: `bash test/mdk-adim.test.sh temel coklu onay neden sure yanit_yok butce butce_ok`

- [x] 13. SORUN.md ve model sırası
  - Yürütücü: kodcu
  - Ne: `mdk-adim.sh`: (1) Deneme bitince depo kökünde `SORUN.md` varsa onu `.mdk-log/sorun-N-<epoch>.md` olarak kopyala, kapı geçse bile denemeyi başarısız say (`neden: "sorun"`), bir sonraki denemenin `ipucu`na `SORUN.md` içeriğini ekle, sonra mevcut geri alma akışı (reset + clean) çalışsın. (2) `ONCE=<model>` ortam değişkeni verilirse ve model `Modeller` listesindeyse onu listenin başına al; listede yoksa yok say.
  - Kapı: `bash test/mdk-adim.test.sh temel coklu onay neden sure yanit_yok butce butce_ok sorun once`

## Veri ve araçlar
Not (2026-10-17): ücretsiz kota hâlâ dolu (3 modelde 45 sn sessizlik); adım 14-20 `kodcu` ile yapılır, parti C öncesi kota yeniden yoklanır. Kapı testleri her adımın başında `kodcu` tarafından verilen dosyalardan depoya kopyalanır.
- [x] 14. Ayrıştırıcıda çoklu kapı, bütçe ve onay
  - Ne: `panel/plan.mjs` `parse`: adım nesnesine `kapilar` (tüm `- Kapı:` komutları, dizi), `butce` (sayı ya da `null`) ve `onay` (`- Onay: evet` ile başlayan satır varsa `true`) ekle; `kapi` = `kapilar[0] ?? null` olarak kalır. `ayarlar`'a `butce` (dosya başındaki `Bütçe:` satırı, yoksa `null`) ekle.
  - Kapı: `node panel/plan.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 15. Kayıt aracı (kodcu satırları ve inceleme sonucu)
  - Ne: Proje kökünde `mdk-kayit.mjs`. Kullanım 1: `node mdk-kayit.mjs <adım> --yurutucu kodcu|claude|opencode --model <ad> --gecti true|false [--sure <sn>] [--token <n>] [--deneme <n>] [--neden <metin>] [--dizin <d>]` → `<dizin>/metrikler.jsonl` dosyasına `{ts, adim, yurutucu, model, deneme (varsayılan 1), gecti, sure_sn, token, maliyet: 0, neden}` satırı ekler. Kullanım 2: `node mdk-kayit.mjs <adım> --inceleme uyumlu|kismen|uyumsuz [--not "<metin>"] [--dizin <d>]` → `{tur: "inceleme", ts, adim, inceleme, not}` ekler. Eksik ya da geçersiz değerde kullanımı stderr'e yazıp çıkış 2 ile dur (dosyaya yazma). Varsayılan dizin `.`. Yalnızca Node yerleşik modülleri.
  - Kapı: `node test/kayit.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 16. Durum: yürütücü bazlı model tablosu ve incelemeler
  - Ne: `panel/durum.mjs`: (a) `tur === 'inceleme'` satırları deneme istatistiğine girmez; (b) `modeller` `yurutucu`+`model` çiftine göre gruplanır (`yurutucu` alanı yoksa `'opencode'` say), sıralama yürütücü sonra model; her öğe `{ yurutucu, model, deneme, gecen, ilkDenemeOrani, token, maliyet, ortSure, uyum }`. `uyum`: grubun en az bir `gecti: true` satırı olan adımları içinde, son inceleme sonucu `uyumlu` olanların, incelemesi olan adımlara oranı (hiç incelenmiş adım yoksa `null`); (c) `snapshot()` sonucuna `incelemeler` ekle: `{ [adim]: { inceleme, not, ts } }`, her adımın SON inceleme satırı.
  - Kapı: `node panel/durum.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 17. Geçmiş verisi
  - Ne: `panel/gecmis.mjs` → `export function gecmis(dir, satirlar)`: adım numarasına göre artan dizi; her öğe `{ no, denemeler: [{ yurutucu, model, deneme, gecti, neden, sure_sn, token }], commit: { sha, mesaj, tarih, dosya, eklenen, silinen } | null, inceleme: { inceleme, not } | null }`. Denemeler `tur` alanı olmayan metrik satırlarından, inceleme `tur === 'inceleme'` satırlarının sonuncusundan gelir. Commit: `child_process.execFileSync('git', ['log', '--format=@%h%x09%cI%x09%s', '--numstat'], { cwd: dir })` çıktısından mesajı `^adım (\d+):` ile eşleşen, adım başına EN YENİ commit (`sha` 7 karakter; `dosya`, `eklenen`, `silinen` numstat toplamı). git yoksa ya da hata verirse `commit: null`. `snapshot()` sonucuna `gecmis: gecmis(dir, satirlar)` ekle.
  - Kapı: `node panel/gecmis.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 18. Karşılaştırma tablosu
  - Ne: Proje kökünde `karsilastir.mjs`: `export function tablo(modeller)` hizalı metin tablosu döndürür (sütunlar: `yürütücü`, `model`, `deneme`, `ilk%`, `ort.sn`, `token`, `uyum%`; `uyum` null ise `-`); `modeller` boşsa `metrik yok`. Doğrudan çalıştırılırsa (`node karsilastir.mjs [dizin]`, varsayılan `.`) `snapshot(dizin).modeller` ile tabloyu yazdırır.
  - Kapı: `node test/karsilastir.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 19. Panel başlat/durdur betiği
  - Ne: `mdk-panel.sh start|stop|durum [dizin] [port]` (dizin varsayılan `.`, port 4747). `start`: `setsid nohup node <bu betiğin dizini>/panel/sunucu.mjs <dizin> <port> >"<dizin>/.mdk-log/panel.log" 2>&1 &` ile başlat, pid'i `<dizin>/.mdk-log/panel.pid` dosyasına yaz; pid dosyasındaki süreç yaşıyorsa "zaten çalışıyor" yaz, çıkış 0. `stop`: pid'e `kill`, pid dosyasını sil; yoksa "çalışmıyor", çıkış 0. `durum`: çalışıyorsa `çalışıyor pid=<n> http://127.0.0.1:<port>` yazıp 0, değilse `çalışmıyor` yazıp 1. `pkill -f` KULLANMA.
  - Kapı: `bash test/mdk-panel.test.sh`
  - Kapı: `bash test/hepsi.sh`

- [x] 20. Kapı denetleyici
  - Ne: Proje kökünde `kapi-denetle.mjs`: `export function denetle(planMetni)` → `[{ no, seviye: 'HATA'|'UYARI'|'BİLGİ', mesaj }]`; `panel/plan.mjs` `parse` kullan. Kural: bitmemiş ve yürütücüsü `opencode` olan her adım için: kapısı yoksa HATA; hiçbir kapı bir test dosyası ya da betik çalıştırmıyorsa (`/\.test\.|(^|[ \/])test\/|npm test|node --test/` ile eşleşen kapı yok) UYARI ("kapı yalnızca varlık kontrolü olabilir"); `etki` var ve `onay` yok ise BİLGİ ("taslak onayı bekliyor"). Doğrudan çalıştırılırsa (`node kapi-denetle.mjs [PLAN.md]`) her bulguyu `adım N: SEVİYE: mesaj` satırı olarak yazdırır, hiç bulgu yoksa `kapılar tamam`; HATA varsa çıkış 1, aksi halde 0.
  - Kapı: `node test/kapi-denetle.test.mjs`
  - Kapı: `bash test/hepsi.sh`

## Panel arayüzü
- [x] 21. Çizim modülü ve ekran görüntüsü hataları
  - Ne: `panel/index.html` içindeki çizim fonksiyonlarını `panel/ciz.mjs` ES modülüne taşı. Saf fonksiyonlar (HTML string döndürür, DOM'a dokunmaz): `suAnHtml(simdi, simdiMs)`, `planHtml(plan, simdi)`, `modellerHtml(modeller)`, `etkiHtml(etki)`. `panel/sunucu.mjs`'e `GET /ciz.mjs` rotası ekle (`text/javascript; charset=utf-8`, yalnızca bu dosya). `index.html` `<script type="module">` ile `import { ... } from '/ciz.mjs'` kullanır; DOM'a yazma ve `EventSource` kalır, bölüm kimlikleri (`simdi`, `kategoriler`, `modeller`, `etki`) değişmez. Düzelt: (1) "Şu an" kartında etiket ve değer yapışık görünüyor ("adımEtki sekmesi"): etiket küçük ve ayrı satırda, değer altında; (2) durum etiketi Türkçe: `gecti` → `geçti`, `calisiyor` → `çalışıyor`, `eskale` → `eskale`; (3) süre sayacı yalnızca `durum === 'calisiyor'` iken `geçen süre` gösterir ve `index.html`'deki `setInterval` yalnızca o durumda çalışır; diğer durumlarda `ts` değerinden `bitiş: SS:DD:SN` (yerel saat) gösterilir; (4) yürütücüsü `opencode` olmayan bitmemiş adım `eskale` değil `bekliyor` rozeti alır ve yürütücü adı satırda görünür; `eskale` rozeti yalnızca `simdi.durum === 'eskale' && simdi.adim === adım.no` iken verilir.
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `node panel/arayuz.test.mjs`
  - Kapı: `node panel/sunucu.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 22. Adım geçmişi görünümü
  - Etki: etki/gecmis.html
  - Onay: evet (kullanıcının 2026-10-17 "tamamını yap, bitene kadar durma" talimatına dayanır; taslak etki/gecmis.html teslim turunda kullanıcı tarafından gözden geçirilecek)
  - Değer: 5
  - Ne: `panel/ciz.mjs`: `planHtml(plan, simdi, gecmis, incelemeler)` her adım satırının altına özet satırı ve yerel `<details>` ekler (taslak: `etki/gecmis.html`). Özet satırı: `K. denemede geçti` (K = ilk `gecti: true` denemenin `deneme` değeri; hiç geçmediyse `geçmedi (N deneme)`), inceleme rozeti (`uyumlu`, `kısmen`, `uyumsuz`; inceleme yoksa gri `incelenmedi`), `+E/−S`, commit kısa kodu; commit yoksa o parça yazılmaz. `<details>` içi: commit mesajı ve dosya sayısı; tüm denemeler (model, ✓/✕, neden, süre, token; başarısız dahil hiçbiri gizlenmez); inceleme notu. `export function sorunluMu(gecmisAdim, inceleme)`: ilk geçen deneme `deneme > 1` ise ya da hiç geçmediyse ya da inceleme `kismen`/`uyumsuz` ise `true`; eşik `export const SORUNLU_INCELEMELER = ['kismen', 'uyumsuz']` tek sabit olsun. Sorunlu adımın `<details>`'i `open` gelir. Listenin üstünde `id="hukum"` tek cümle: `N adım: A uyumlu, B kısmen, C uyumsuz, D incelenmedi · K ilk denemede geçti` (yalnızca metriği olan adımlar sayılır) ve `<input type="checkbox" id="sadece-sorunlu">` işaretliyse sorunsuz adım satırları `hidden` olur (`index.html` içinde küçük bir olay dinleyicisi; işaret durumu yeni veri gelince korunur). `index.html` `planHtml`'e `d.gecmis` ve `d.incelemeler` verir. Tüm metinler HTML'de kaçışlanır (`esc`).
  - Kapı: `node panel/gecmis-ui.test.mjs`
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 23. Model tablosu ve etki çubuğu
  - Ne: `panel/ciz.mjs`: `modellerHtml`: sütunlar `yürütücü`, `model`, `deneme`, `ilk denemede geçme %`, `uyum %` (`null` ise `—`), `token`, `ort. süre`; `maliyet` sütunu yalnızca toplam maliyet 0'dan büyükse gösterilir (ücretsiz modelde $0 gürültüdür). `etkiHtml`: "değer / maliyet" çubuğu iki ayrı etiketli çubuk olur: değer (`değer/5`) ve tahmini token (`token / en büyük token`); metinde `~N token`, para yalnızca `maliyet > 0` ise yazılır; güven rozeti kalır.
  - Kapı: `node panel/modeller-ui.test.mjs`
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `bash test/hepsi.sh`

## Ekran görüntüsünden bulunanlar (2026-10-17, gerçek tarayıcı)
Kapılar bunları yakalamamıştı; gerçek Firefox görüntüsünde çıktı.

- [x] 27. Adım satırı düzeni
  - Yürütücü: kodcu
  - Ne: `panel/ciz.mjs` `planHtml`: her adım `<li>` içinde iki bölüm: `<div class="adim-ust">` (no, başlık, rozet) ve hemen ardından `<div class="adim-alt">` (yürütücü adı ve kapı komutu, küçük gri, uzun komutu kırar). `panel/index.html` CSS: `ul.adimlar li` artık doğrudan flex değil; `.adim-ust { display: flex; ... }` içinde `.baslik { flex: 1 }`; `.adim-alt { ...; overflow-wrap: anywhere }`. Görsel stil (kenarlık, rozet renkleri, boşluklar) korunur. Mevcut `panel/ciz.test.mjs` geçmeye devam eder.
  - Kapı: `node panel/duzen.test.mjs`
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 28. Kayıt aracı durum.json'u günceller
  - Yürütücü: kodcu
  - Ne: `mdk-kayit.mjs`: çalıştırma kaydı (`--yurutucu ... --gecti ...`) yazıldığında `<dizin>/durum.json` da yazılır: `{ adim, baslik, model, deneme, durum, ts: Date.now() }`; `durum` = `gecti` (gecti true) ya da `eskale` (gecti false); `baslik` `<dizin>/PLAN.md` içindeki `- [ ] N. Başlık` ya da `- [x] N. Başlık` satırından alınır, PLAN.md ya da satır yoksa `null`. `--inceleme` kaydı `durum.json`'a dokunmaz. Hatalı kullanımda (çıkış 2) hiçbir dosya yazılmaz.
  - Kapı: `node test/kayit-durum.test.mjs`
  - Kapı: `node test/kayit.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 29. Açık ayrıntılar canlı güncellemede korunur
  - Yürütücü: kodcu
  - Ne: `panel/ciz.mjs` `planHtml(plan, simdi, gecmis, incelemeler, acik)`: 5. parametre `{ [adımNo]: true|false }` (yoksa `{}`) her adımın `<details>` varsayılanını (sorunlu = açık) ezer; `<details>` etiketi `data-no="<adım no>"` taşır. `panel/index.html`: kullanıcı bir `<details>`'i açıp kapatınca (`toggle` olayı, `data-no` olan öğelerde) tercih bir nesnede tutulur ve her çizimde `planHtml`'in 5. argümanı olarak verilir. Mevcut testler geçmeye devam eder.
  - Kapı: `node panel/acik.test.mjs`
  - Kapı: `node panel/gecmis-ui.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 30. Etki taslağı: önce ve sonra ayrı gösterilir
  - Yürütücü: kodcu
  - Ne: Gerçek tarayıcıda etki sekmesinin "önce" ve "sonra" kutularının ikisi de taslağın tamamını gösteriyordu (`#once`/`#sonra` bağlantısı yalnızca kaydırır). `panel/sunucu.mjs` `/dosya`: isteğe bağlı `goster=once|sonra` parametresi; verilirse yanıtın `<head>` kapanışından önce şu kural eklenir: `body > figure { display: none } body > figure:has(#<bölüm>) { display: block }` (bölümü olmayanlar gizlenir, içerik silinmez); `goster` yoksa dosya aynen döner; başka değer 400. Yol koruması aynen kalır. `panel/ciz.mjs` `etkiHtml`: iframe adresleri `#once`/`#sonra` yerine `&goster=once` ve `&goster=sonra` kullanır.
  - Kapı: `node panel/etki-goster.test.mjs`
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `node panel/sunucu.test.mjs`
  - Kapı: `bash test/hepsi.sh`

## Süreç (Claude)
- [x] 24. İnceleme kayıtları ve karşılaştırma verisi
  - Yürütücü: claude
  - Ne: Her partiden sonra Claude diff'i plana karşı inceler, sonucu `node mdk-kayit.mjs <adım> --inceleme ...` ile kaydeder; eskale olan adımı `kodcu`'ya verir ve sonucunu `mdk-kayit.mjs --yurutucu kodcu` ile kaydeder; bazı adımlarda `ONCE=` ile 2. ve 3. model denenir.
  - Kapı: `test "$(grep -c '"tur":"inceleme"' metrikler.jsonl)" -ge 10`

- [x] 25. Personaları ve süreç belgelerini güncelle
  - Yürütücü: claude
  - Ne: Geçmiş kararının gözleminden `personalar.md`'yi rafine et (çıktı biçimi, "diğerlerinin önermeyeceği seçenek" şartı); `ba-pm-bakis` becerisini, proje `CLAUDE.md`'sini ve bellek notlarını güncelle.
  - Kapı: `grep -q 'Çıktı biçimi' personalar.md && grep -q 'önermeyeceği' personalar.md`

- [x] 26. Uçtan uca doğrulama
  - Yürütücü: claude
  - Ne: Tüm kapılar yeşil, panel yeniden başlatılmış ve gerçek veriyle ekran görüntüsünde kontrol edilmiş, kullanıcı için uygulama turu hazır.
  - Kapı: `bash test/hepsi.sh && node kapi-denetle.mjs`

## Personalar v2: iş alanına göre kart paketleri
Problem ve hipotez: Geçmiş görünümü kararında 4 persona 8 seçenek verdi ama hepsi tek eksende toplandı; seçilen yön minimalist ve geliştirici kartlarından geldi, "saha kullanıcısı" ve "ilk kez kullanan" hiç çağrılmadı (bu ürünün kullanıcısı port yönlendirmeli panele bakan tek bir BA/PM). `personalar.md` kendi kuralıyla da çelişiyor: kullanıcının bakışı alt ajana verilmez diyor, ama "BA/PM A/B" alt ajan olarak çağrıldı. Hiçbir kartın değer katıp katmadığı ölçülmüyor. Hipotez: iş alanına (proje geliştirme, sunum, araştırma) göre paketlenmiş, az sayıda kart ve ölçülen bir karar günlüğü, genel kart setinden daha ayrışık seçenek verir; çürürse "az kart" yoluna (benchmark + kapıyı kandıran mercek) düşülür.
Başarı ölçütü (taban: 8 seçenek, 1 gerçek eksen, 6 kartın 2'si kullanılmamış): her denemede ≥2 ayrışma ekseni; denendi işaretli alanda kullanılmayan kart ya kullanılır ya silinir; deneme başına ≤60k token.
Akış: iş türü → alan seç → o alandan 3 kart → "hangi eksende ayrışırsınız?" turu → seçenek tablosu. Alan yoksa aynı kart biçiminde yeni alan taslağı yazılır, `Durum: denenmemiş` olur.
Riskler: LLM çıktısı her seferinde değişir, 2 deneme kanıt değil gözlemdir; sunum ve araştırma alanları ilk gerçek kullanıma kadar denenmemiş kalır (sahte görevle token yakılmaz); denetçi yapıyı doğrular, içeriğin kalitesini denemeler gösterir.
Aşamalar: Faz 1 (adım 31-36) kartlara karar verir. Faz 2 (adım 37-38) aynı bakışları kapı yazmaya ve plan bölmeye bağlar. Adım 39 belgeleri kapatır.
Not: bu adımlar UI'a dokunmaz, `Etki:`/`Onay:` yok. Adım 31 dışındakiler Claude'undur.

### Faz 1: kartlar
- [x] 31. Persona denetçisi
  - Ne: Proje köküne `persona-denetle.mjs` yaz; `kapi-denetle.mjs` ile aynı kalıp. `export function denetle(metin)` bulgu dizisi döner (`{ ad, seviye, mesaj }`, seviye `'HATA'|'UYARI'`); `export function sayim(metin)` `{ 'alan/kart': { kullanim, kazanma } }` döner. Biçim: `## Alan: <ad>` bir alan başlatır (başka her `## ` başlığı alanı bitirir); alan içinde `Durum: <değer>` satırı ve `### <kart adı>` kartları; kart satırları `- **<alan adı>:** <değer>`. Zorunlu kart alanları: `Optimize eder`, `Sorusu`, `Körlüğü`, `Ne zaman`, `Ayrışma ekseni`. `## Karar günlüğü` altındaki tablo satırları (başlık ve `---` ayırıcı satırı atlanır; sütunlar `Tarih | Alan | Karar | Kartlar | Eksen | Kazanan`; `Kartlar` ve `Kazanan` virgülle ayrılır). Kurallar (ad: HATA, aksi belirtilmedikçe): alanda <3 kart (ad = alan adı); `Durum` `denendi` ya da `denenmemiş` değil (ad = alan); `Durum: denendi` ama alan için günlük satırı yok (ad = alan); karttaki zorunlu alan yok ya da boş (ad = kart; eksik alan başına bir bulgu); yinelenen kart adı, ikinci ve sonraki geçiş (ad = kart); günlük satırı: alan yok, kart o alanda yok, `Eksen` boş, `Kazanan` kartlarda yok ve `benchmark`/`sentez` değil (ad = `günlük N`, N tablodaki 1 tabanlı sıra, sorun başına bir bulgu); alanda >5 kart UYARI (ad = alan); `Durum: denendi` alanında hiç kullanılmayan kart UYARI (ad = kart). Hiç `## Alan:` yoksa (boş dosya dahil) tek bulgu `{ ad: 'dosya', seviye: 'HATA' }`. `sayim`: `kullanim` = kartın `Kartlar` sütununda geçtiği günlük satırı sayısı; `kazanma` = `Kazanan` sütununda (ve o satırın `Kartlar`ında) geçtiği satır sayısı. Komut satırı: `node persona-denetle.mjs [dosya] [--sayim]` (varsayılan dosya `personalar.md`; `--` ile başlayan argüman dosya adı sayılmaz, yani `node persona-denetle.mjs --sayim` bulunulan dizindeki `personalar.md`'yi okur); her bulguyu `<ad>: <SEVİYE>: <mesaj>` satırı yazar, hiç bulgu yoksa `personalar tamam`; `--sayim` ile ek olarak her kart için `<alan>/<kart>: kullanım N, kazanma M` satırı yazar; HATA varsa ya da dosya okunamıyorsa çıkış 1, aksi halde 0.
  - Kapı: `node test/persona-denetle.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 32. Kart biçimi ve proje-gelistirme paketi
  - Yürütücü: claude
  - Ne: `personalar.md`'yi v2 biçimine çevir. `## Ortak`: çıktı biçimi, benchmark yöntemi, ayırt edicilik şartı, sentez kuralı ("Senin bakışın" kartı kalkar; Claude'un sentez merceği olur, alt ajana verilmez, kullanıcı önerisi alt ajana gitmez). `## Alan: proje-gelistirme` (`Durum: denenmemiş`), 5 kart: Minimalist ürün tasarımcısı, Bakımı yapacak geliştirici, Denetçi / güvenlik (eski kartlardan rafine), Kapıyı kandıran yürütücü (yeni: "ücretsiz model bu kapıyı işi yapmadan nasıl geçer?"), Dikkati dağınık kullanıcı (saha kullanıcısı ve ilk kez kullananın birleşimi: "10 saniyede ne olduğunu anlıyor mu?"). Her kartta 5 alan dolu; `Ne zaman` hangi karar türünde çağrıldığını, `Ayrışma ekseni` hangi eksende ayrıştığını yazar.
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `test "$(node persona-denetle.mjs --sayim | grep -c '^proje-gelistirme/')" -ge 4`
  - Kapı: `node persona-denetle.mjs --sayim | grep -q 'proje-gelistirme/Kapıyı kandıran yürütücü'`
  - Kapı: `! grep -q 'Acelesi olan saha' personalar.md`

- [x] 33. Sunum paketi
  - Yürütücü: claude
  - Ne: `## Alan: sunum` (`Durum: denenmemiş`), 3-4 kart; sunum hazırlama (NexusOS / Ar-Ge mentör sunumu: `nexusos-sunum` becerisiyle uyumlu) için: ilk kez dinleyen, şüpheci jüri/mentör ("kanıt nerede?"), sunumu yapan anlatıcı ("süreye sığar mı, akıcı mı?"), gerekirse sadeleştirici. Kart adları dosyada tekil, 5 alan dolu.
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `test "$(node persona-denetle.mjs --sayim | grep -c '^sunum/')" -ge 3`

- [x] 34. Araştırma paketi
  - Yürütücü: claude
  - Ne: `## Alan: arastirma` (`Durum: denenmemiş`), 3-4 kart; bir konuyu derinlemesine araştırmak için: şüpheci hakem ("kaynak ne, çelişen kanıt var mı?"), karşıt görüş avukatı, uygulayıcı ("bu bilgiyle ne yaparım?"), kapsam bekçisi ("soru yanlış çerçevelenmiş olabilir; aranmayan ne?"). `Ortak` bölümündeki "doğrulanamadı yaz, uydurma" kuralı bu alanda da geçerlidir.
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `test "$(node persona-denetle.mjs --sayim | grep -c '^arastirma/')" -ge 3`

- [x] 35. Karar günlüğü ve seçim kuralı
  - Yürütücü: claude
  - Ne: `## Karar günlüğü` tablosu; Geçmiş görünümü kararı geriye dönük girilir (alan `proje-gelistirme`, kartlar: Minimalist ürün tasarımcısı, Bakımı yapacak geliştirici, Denetçi / güvenlik; eksen "ayrı bölüm mü / satıra gömülü mü"; kazanan: Minimalist ürün tasarımcısı, Bakımı yapacak geliştirici; BA/PM A/B ve benchmark kart dışı not olarak eksen sütununa değil karar sütununa yazılır). `Ortak`'a "Seçim kuralı" ekle: iş türüne göre alan seç, alandan 3 kart seç ve en az biri karşı çıkan olsun, alt ajanlardan önce "hangi eksende ayrışırsınız?" turu, her kararda günlüğe satır, alan yoksa yeni alan taslağı (`denenmemiş`). Bu adım sonunda `proje-gelistirme` hâlâ `denenmemiş`tir (Geçmiş kararı eski kartlarla alındı).
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `node persona-denetle.mjs --sayim | grep -q 'proje-gelistirme/Minimalist ürün tasarımcısı: kullanım 1, kazanma 1'`
  - Kapı: `node persona-denetle.mjs --sayim | grep -q 'proje-gelistirme/Denetçi / güvenlik: kullanım 1, kazanma 0'`
  - Kapı: `grep -q 'Seçim kuralı' personalar.md`

- [x] 36. Canlı deneme 1: UI ve akış kararı
  - Yürütücü: claude
  - Ne: (2026-10-27 güncellendi: 58 bittikten sonra 2. tur `persona-tur.sh` ile, Claude alt ajanı kullanılmadan; 1. tur notu aşağıda.) Proje `CLAUDE.md`'deki iki panel eksiğinden biri (model tablosu `yanit_yok`'u model hatası sayıyor; adım satırı planın yürütücüsünü yazıyor, gerçekte işi yapanı değil) için `proje-gelistirme` paketiyle karar al: önce ekseni sor, 3 kart, tek tablo, öneri. Önce eşiği kontrol et: karar `ba-pm-bakis`in "küçük kararda alt ajan kullanma" kuralına göre alt ajanı hak etmiyorsa diğer eksiği seç. Alt ajanlar `sonnet` ile, toplam ≤60k token. PLAN.md'ye `## Karar notu: Persona denemesi 1` yaz (eksenler `;` ile, seçenek tablosu, `Harcanan token: Nk`, `Sonuç: doğrulandı|çürüdü` satırı; ölçüt: ≥2 eksen), günlüğe satır ekle, `proje-gelistirme` `Durum: denendi` yap. Sonuç `çürüdü` çıkarsa dur ve kullanıcıya "az kart" yolunu sor.
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `grep -q 'Durum: denendi' personalar.md`
  - Kapı: `test "$(grep -c '^| 2026-' personalar.md)" -ge 2`
  - Kapı: `grep -Eq '^Sonuç: (doğrulandı|çürüdü)' PLAN.md`
  - Kapı: `grep -Eq 'Harcanan token: [0-9]+k' PLAN.md`

### Faz 2: kapı ve plan bölme
Faz 2'nin kapsamı adım 36'nın sonucuna bağlıdır; 36 `çürüdü` çıkarsa 37-38 yeniden planlanır.

- [x] 37. Kapı yazımı: geçmişe karşı deneme
  - Yürütücü: claude
  - Ne: "Kapıyı kandıran yürütücü" kartını üç geçmiş kapıya uygula: adım 8 (`test -f ... && test -f ...`), adım 25 (`grep -q ... && grep -q ...`), adım 23 (kapı testindeki hatalı beklenti). Her kapı için kart, "boş ya da taslak dosyayla bu kapı geçer mi?" sorusunu yanıtlar ve bir güçlendirme önerir; Claude gerçek boşluk olup olmadığını kendi okumasıyla doğrular. `## Karar notu: Persona denemesi 2` altında kapı başına satır tablosu; `Boşluk bulunan kapı: N/3`; `Sonuç: doğrulandı` ölçütü ≥2/3. Günlüğe satır ekle. ≤60k token. Çıkan kural `ba-pm-bakis`in "Kapılar" bölümüne eklenecek biçimde bir cümleye indirilir (kodda değişiklik bu adımda yok).
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `grep -Eq 'Boşluk bulunan kapı: [0-3]/3' PLAN.md`
  - Kapı: `test "$(grep -c '^Sonuç: ' PLAN.md)" -ge 2`

- [x] 38. Plan bölme: geçmişe karşı deneme
  - Yürütücü: claude
  - Ne: Metriklerde sorunlu üç adımı karşılaştır: adım 9 (6 deneme), adım 7 (~730k token), adım 22 (3 deneme). "Bakımı yapacak geliştirici" kartının sorusuyla ("bu en ucuz hangi yolla doğru çalışır, tek başına yenebilir mi?") bu adımların bölünüp bölünmeyeceğine ve bir bölme ölçütüne (örn. adım başına dosya sayısı, kapı sayısı, bütçe) karar ver; ölçütü `metrikler.jsonl`'daki diğer adımlara uygulayıp yanlış alarm sayısını yaz. `## Karar notu: Persona denemesi 3`; `Sonuç: doğrulandı|çürüdü`. Ölçüt `kapi-denetle.mjs`e UYARI kuralı olacaksa bunun için ayrı, kapılı bir adım açılır (bu adımda kod yok).
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `test "$(grep -c '^Sonuç: ' PLAN.md)" -ge 3`
  - Kapı: `grep -q '^## Karar notu: Persona denemesi 3' PLAN.md`

- [x] 39. Belgeler ve bellek
  - Yürütücü: claude
  - Ne: `~/.claude/skills/ba-pm-bakis/SKILL.md`: iş türüne göre alan seçimi, seçim kuralı, `persona-denetle.mjs` çağrısı, Faz 2 sonuçlarından kapı ve plan bölme kuralı. Proje `CLAUDE.md`: "9'dan devam eden numarayla" notunu "son adım numarasından devam" yap, durum bölümüne personalar v2'yi ekle. PLAN.md "Sonraki iyileştirmeler" altındaki persona maddesini güncelle. Bellek: `mdk-kapi-iyilestirme` ve `mdk-durum` notlarını güncelle; sunum ve araştırma alanları ilk gerçek kullanımda `denendi` olacak diye not düş.
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `! grep -q "9'dan devam" CLAUDE.md`
  - Kapı: `grep -q 'persona-denetle' ~/.claude/skills/ba-pm-bakis/SKILL.md`
  - Kapı: `bash test/hepsi.sh`

### Faz 3: panel araştırma sekmesi (2026-10-18)
GitHub'da panel için altlık/örnek olacak projeler araştırıldı; sonuç `arastirma/arastirma.json` (kapı dosyası gibi davran, DEĞİŞTİRME). Hipotez: kullanıcı adayları, rolleri (altlık/örnek/yan yana/izle/kullanma) ve önerilen birleşimleri panelden okuyup hangisini yapacağına karar verebilir. Birleşimlerin kendisi (telemetri, tasarruf kartı, matris...) bu adımın kapsamı DEĞİL.

- [x] 40. Araştırma sekmesi
  - Ne: (1) `panel/sunucu.mjs`: `GET /api/arastirma` → `<dir>/arastirma/arastirma.json` içeriğini JSON verir; dosya yoksa ya da JSON bozuksa `{"adaylar":[],"birlesimler":[]}` (200). (2) `panel/ciz.mjs`: `export function arastirmaHtml(veri, suz = {})` saf fonksiyon; `veri` null/boş ise "Araştırma verisi yok" metni. Üstte `not` ve `oneri` metni; "Birleşim önerileri" kartları (ad, parçalar, ne, neden, panelde, efor S/M/L, değer 1-5, risk); "Adaylar" tablosu/kartları: repo (`https://github.com/<repo>` bağlantısı, `target="_blank" rel="noopener noreferrer"`), kategori, yıldız (`null` ise "—", "null" yazma), lisans, son push, dil, rol rozeti, ne, alınacak, risk, kanıt (`doğrulanamadı` belirgin). `suz.kategori` verilirse yalnız o kategorideki adaylar listelenir, birleşimler her zaman görünür. Tüm metin `esc` ile kaçışlanır. (3) `panel/index.html`: `<h2>Araştırma</h2><section id="arastirma">`, sayfa açılışında bir kez `fetch('/api/arastirma')`, kategori süzgeci düğmeleri (Tümü + veri içindeki kategoriler), `arastirmaHtml`'i `/ciz.mjs` içinden içe aktar. Dış kaynak (CDN) yok, mevcut CSS değişkenleri ve açık/koyu tema korunur, telefon genişliğinde taşma olmaz.
  - Kapı: `node panel/arastirma.test.mjs`
  - Kapı: `node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 41. Güven etiketli sayılar (model tablosu)
  - Problem ve hipotez: kota sessizliği (`neden: "yanit_yok"`) modele %0 başarı yazıyor, ölçülmemiş süre/token 0 sayılıp ortalamayı bozuyor; okuyan kişi model hakkında yanlış karar verir (örn. "space-bunny hep başarısız"). Hipotez: sayının yanına güven etiketi ve sağlayıcı sessizliğinin ayrı sayımı konursa model karşılaştırması yanlış okunmaz, "kanıt nerede?" sorusuna tabloyla cevap verilir. Başarı ölçütü: gerçek metriklerde hiçbir modelde sessizlik yüzünden 0%/0.0 sn görünmez.
  - Etki: etki/guven.html
  - Onay: evet
  - Değer: 4
  - Ne: (1) `panel/durum.mjs` `modeller` öğelerine iki alan ekle, mevcut alanlar kalır: `sessiz` (o modelin `neden === 'yanit_yok'` satır sayısı) ve `etiket`. `yanit_yok` satırları `deneme`, `gecen`, `ilkDenemeOrani`, `token`, `maliyet`, `ortSure` hesabına HİÇ girmez. `ilkDenemeOrani`: gerçek `deneme === 1` satırı yoksa `null` (0 değil). `ortSure`: yalnızca sayısal `sure_sn` olan gerçek satırların ortalaması, hiç yoksa `null`. `token`: sayısal `token` olan gerçek satırların toplamı, hiç yoksa `null`. `etiket` önceliği: gerçek satırların hepsinde süre ve token yoksa ya da gerçek satır yoksa `'veri-yok'`; yoksa herhangi bir gerçek satırda `tahmini === true` ise `'tahmin'`; yoksa bazı gerçek satırlarda süre ya da token `null` ise `'kismi'`; yoksa `'olculdu'`. (2) `panel/ciz.mjs` `modellerHtml`: deneme hücresinde `sessiz > 0` ise "N sessiz" notu; `null` değerler (`ilkDenemeOrani`, `token`, `ortSure`) `—` yazar; her satırda `<span class="guven <etiket>">` ile etiket metni (`olculdu` → "ölçüldü", `kismi` → "kısmi", `tahmin` → "tahmin", `veri-yok` → "veri yok") ve `title` açıklaması; son sütun başlığı "veri". `etiket`/`sessiz` alanı olmayan eski biçim çökmez. Tüm metin `esc` ile kaçışlanır. (3) `panel/index.html`: `.guven.olculdu`, `.guven.kismi`, `.guven.tahmin`, `.guven.veri-yok` CSS kuralları (mevcut `--rozet-*` değişkenleri, açık/koyu tema; renk tek başına anlam taşımaz, metin de var).
  - Kapı: `node panel/guven.test.mjs`
  - Kapı: `node panel/durum.test.mjs && node panel/modeller-ui.test.mjs && node panel/arayuz.test.mjs etki`
  - Kapı: `bash test/hepsi.sh`

## Karar notu: Persona denemesi 1 (adım 36; 1. tur Claude alt ajanlarıyla yarım, 2. tur OpenCode ile tamam)
Karar: adım satırı planlanan yürütücüyü yazıyor, gerçekte işi yapanı değil (adım 9: opencode 6 kez kaldı, kodcu geçti; 22: 3 başarısız sonra kodcu; 40: 1 başarısız sonra kodcu). `yanit_yok` sorunu adım 41'de zaten planlı olduğu için bu eksik seçildi. Kartlar: Dikkati dağınık kullanıcı, Bakımı yapacak geliştirici, Denetçi / güvenlik (karşı çıkan). Sonnet, araçsız.
Ayrışma eksenleri (seçim kuralı 3. madde, seçenek turundan önce):
- Dikkati dağınık kullanıcı: satır tek hüküm mü söylesin (gerçekte kim bitirdi), her denemenin dökümü mü; ayrıntı isteyene saklı.
- Bakımı yapacak geliştirici: tek `metrikler.jsonl` okumasıyla ucuza türetilen "son geçen yürütücü" mü, her satırda ayrı hesaplanıp test edilecek "deneme geçmişi" mi.
- Denetçi / güvenlik: planlanan yürütücüyü tek başına göstermek mi (gerçeği yansıtmaz, geri izlenemez), fiilî yürütücü ve deneme geçmişini satırda kayıtlı tutmak mı (izlenebilir, kalabalık).
Gözlem: üç eksen biçimsel olarak ayrı (yoğunluk, türetme maliyeti, izlenebilirlik) ama üçü de aynı yöne bakıyor: planlanan yerine fiilî yürütücü, ayrıntı açılır bölümde. Bu "güvenli taban"; gerçek karar noktası ayrıntının (başarısız deneme sayısı ve modeller) satırda rozetle mi, yalnızca açılır bölümde mi görüneceği.
Harcanan token (yalnızca 1. tur): 107k (3 alt ajan x ~35,8k; ajan başına sabit yük, görev metni birkaç yüz token). Onaylı sınır tur başına 60k idi; yalnızca bu tur sınırı aştı. Seçenek turu (2. tur) başlatılmadı.
Karar bekliyor: bu sabit yük yüzünden `general-purpose` alt ajan başına 60k sınırına yalnızca 1 ajan sığar; 3 kartlı bağımsız tur yaklaşık 107k tutar.

2. tur (2026-10-27, `persona-tur.sh`, kullanıcı kararı: her persona OpenCode'da ayrı oturumda ücretsiz modelle): aynı soru, aynı 3 kart. Dikkati dağınık kullanıcı: deepseek ve glm süre aşımı (kota sessizliği), yanıt yok. Bakımı yapacak geliştirici ve Denetçi / güvenlik: beam-free, geçerli biçimde 2'şer seçenek.
Eksenler: tanı değeri mi uygulama maliyeti mi (geliştirici); plan ile gerçek ayrımı izlenebilir mi, satır sürtünmesiz mi (denetçi).
| Seçenek | Kaynak | Satırda | Ayrıntıda | Değer | Risk |
|---|---|---|---|---|---|
| A | geliştirici | son bitiren yürütücü | sayı + modeller | tek kelime, ucuz | tanı için her satırı açmak gerekir |
| B | geliştirici | "kodcu (yedek)" yalnız fark varsa | deneme sayısı | yedek tek bakışta belli | hangi modelin kaç kez kaldığı gizli |
| C | denetçi | son bitiren + "N. deneme" | tüm başarısızlar | kim bitirdi + ne kadar zorlandı | satırda ek alan |
| D | denetçi | planlanan yürütücü | gerçekleşen + denemeler | plan/gerçek ayrımı | satır yanıltıcı |
Öneri: C; adım 42'de zaten bu yönde uygulandı (satırda "N. denemede geçti" ve gerçek yürütücü, ayrıntıda tüm denemeler). Tur, 1. turla aynı tabana vardı; yeni seçenek B (yalnız farkta "yedek" etiketi).
Harcanan token: 0k Claude (ücretsiz modellerde 35k; Claude yalnız birleştirdi), süre ~10 dk (süre aşımı kartı bekletti).
Sonuç: doğrulandı (≥2 eksen; Claude maliyeti 107k → 0). Not: 3 karttan 1'i kota yüzünden düştü; kota sessizken tur ~10 dk sürer, `PERSONA_SURE` kısaltılabilir.

## Karar notu: Persona denemesi 2 (adım 37, 2026-10-27, persona-tur.sh)
Karar: "Kapıyı kandıran yürütücü" kartı üç geçmiş kapıya ayrı ayrı (3 paralel tek kartlı tur, beam-free) soruldu: boş/taslak dosyayla geçer mi, nasıl güçlenir. Claude her kapıyı scratchpad'de sahte çözümle sınadı.
| Kapı | Kart: taslakla geçer mi | Claude sınaması | Kartın önerisi | Boşluk bulundu mu |
|---|---|---|---|---|
| 8: `test -f A && test -f B` | evet | boş iki dosyayla geçti | zorunlu başlıklar ve yapı işaretleri (Seçenek A —, tablo) grep | evet |
| 25: `grep -q 'Çıktı biçimi' && grep -q 'önermeyeceği'` | hayır (yanlış) | tek satırlık taslakla geçti | dosya dolu + `persona-denetle.mjs` sıfır çıkış + belgelerde geçiş | kaçırdı (öneri yine de boşluğu kapatıyor) |
| 23: `modeller-ui.test.mjs`, `'50%'` sayısı | evet | sabit metin döndüren sahte `modellerHtml` bu iddiayı geçti | model satırına göre ayrı iddia: a/x'te iki 50%, sonnet'te 100% ve — | evet; önerisi gerçek düzeltmeyle aynı (sonnet `ilkDenemeOrani: 1`) |
Boşluk bulunan kapı: 2/3
Çıkan kural (ba-pm-bakis "Kapılar" için): Kapı yalnız varlık (`test -f`) ya da tek sözcük (`grep -q`) ölçüyorsa taslak geçer; işin davranışını çalıştıran bir komut (test ya da denetleyici) ekle ve iddiaları sabit metinle taklit edilemeyecek, satıra özgü farklı değerlerle kur.
Harcanan token: 0k Claude (ücretsiz modellerde 255k: 18k + 141k + 95k), süre ~6 dk.
Sonuç: doğrulandı (2/3 ≥ 2/3). Not: kart 25'te "hayır" dedi; kartın evet/hayır hükmü değil, önerdiği güçlendirme ve Claude'un sınaması güvenilir.

## Karar notu: Persona denemesi 3 (adım 38, 2026-10-27, persona-tur.sh)
Karar: plan yazılırken "bu adım bölünmeli" uyarısı verecek ölçüt. Kart: Bakımı yapacak geliştirici (beam-free, 27k token).
Önce veri: planın varsaydığı sorunlu adımlar yanlış seçilmiş. Adım 9'un 6 ve adım 22'nin 3 başarısız denemesi tamamen kota sessizliği (`yanit_yok`); büyüklükle ilgisi yok. 9-30 arasında ücretsiz model hiç gerçekten çalışmadı. Adım 7 ilk denemede geçti ama 730k token harcadı. Bu yüzden ölçüt, ücretsiz modelin gerçekten çalıştığı 25 adımda (1-7, 31, 40-44, 47-58; 45-46 doğrudan kodcu) sınandı. Sorunlu = en az 1 gerçek başarısız deneme: 4, 40, 41, 43, 44, 48, 58 (7 adım).
| Seçenek | Kaynak | Eşik | Yakalanan | Yanlış alarm | Kaçan |
|---|---|---|---|---|---|
| A | geliştirici | kapı ≥ 2 | 6/7 | 4 (31, 42, 47, 57) | 4 |
| B | geliştirici | kapı ≥ 2 ve (dosya ≥ 3 ya da Ne ≥ 1000 karakter) | 5/7 | 3 (31, 42, 47) | 4, 43 |
| C | sentez | Ne ≥ 1000 karakter | 5/7 | 3 (31, 47, 54) | 4, 43 |
| D | sentez | dosya ≥ 5 | 3/7 | 1 (47) | 4, 41, 43, 58 |
Claude doğrulaması: kartın yakalanan ve yanlış alarm sayıları yeniden hesaplandı ve doğru çıktı; kart yalnız adım 4'ü sorunlu saymamıştı (6/7 yerine 6/6 yazdı). En iyi seçenek (B ya da C) uyarıların yaklaşık %60'ında haklı; taban oran %28. Kapı sayısı döngüsel bir işaret: büyük adıma zaten daha çok kapı yazılıyor. Sorunlu 4 ve 43 küçük adımlar; onları büyüklük değil kapının kendisi zorladı.
Öneri: `kapi-denetle.mjs`e UYARI kuralı açılmaz (yanlış alarm, yakalanan sayısına yakın). `ba-pm-bakis`e yalnız yazım ipucu girer: "Ne" metni 1000 karakteri geçen ya da 5+ dosyaya dokunan adımı yazarken bölmeyi düşün; asıl güvence mdk-adim.sh'in bütçe ve kodcu devridir.
Harcanan token: 0k Claude (ücretsiz modelde 27k), süre ~4 dk.
Sonuç: çürüdü (plandaki varsayım çürüdü: 9 ve 22 büyüklük yüzünden değil kota yüzünden zorlandı, ve UYARI'ya değecek isabette bir ölçüt yok; persona akışı ise çalıştı).

## Karar notu: Persona denemesi 4 (adım 60, 2026-10-27, persona-tur.sh, alan: arastirma)
Karar: araştırmada açık kalan iki birleşim (Adım panosu, Isı haritası + sparkline) yapılsın mı, araştırma kapansın mı. Kartlar: Uygulayıcı, Kapsam bekçisi, Karşıt görüş avukatı (karşı çıkan). İlk turda karşıt avukat nemotron ve deepseek'te sessiz kaldı (adım 59'un erken atlaması iki modeli 60'ar sn'de geçti); kart beam ile tek başına yeniden koşuldu.
Eksenler: eylem değeri, yarın ne değişir (Uygulayıcı); kapsam doygunluğu mu, kaçan görünüm mü (Kapsam bekçisi); örneklem trend için yeterli mi (Karşıt görüş avukatı).
| Seçenek | Kaynak | Ne | Değer | Risk |
|---|---|---|---|---|
| A | üç kart | araştırmayı kapat, efor açık işlere | 6/8 birleşim yapıldı, kalan ikisi 3/5 | küçük bir görsel değer kaçabilir |
| B | Uygulayıcı, Kapsam bekçisi | ısı haritası + sparkline (küçük efor) | model seçimi için süre eğilimi | veri az, boş kalır |
| C | (önerilmedi) | Kanban panosu | "akış nerede" tek bakışta | ikinci görünümün bakımı; ihtiyacı liste karşılıyor |
Claude doğrulaması: Kapsam bekçisinin "6 günde 62 satır, ısı haritası dolu görünür" iddiası yanlış: 6 gün 11 günlük aralığa dağılmış, takvim ısı haritası çoğunlukla boş. Süre eğilimi için ölçüm sayısı beam 4, nemotron 2, flint 2 (yalnız deepseek 16, glm 9): eğilim çizgisi anlamsız. Karşıt avukatın örneklem itirazı veriyle doğrulandı.
Öneri: A. Araştırma kapanır; `arastirma.json` değişmez. B, ölçülen deneme sayısı model başına ~20'yi geçince yeniden açılabilir.
Harcanan token: 0k Claude (ücretsiz modelde 56k), süre ~6 dk.
Sonuç: doğrulandı (3 geçerli kart, 3 ayrı eksen; üçü aynı sonuca vardı, güvenli taban. Kartlardan biri sayısal iddiada yanıldı, Claude sınaması yakaladı.)

## Karar notu: Persona denemesi 5 (adım 61, 2026-10-27, persona-tur.sh, alan: sunum)
Karar: NexusOS mentör showcase sayfasının bölüm sırası ve kapsamı (şu an 8 bölüm: kıvılcım, problem, yön, dünyada ne var, showcase, çıktılar, demo, sonraki adımlar). Kartlar: İlk kez dinleyen, Şüpheci mentör, Sadeleştirici (karşı çıkan). Şüpheci mentör ilk turda sessiz modele düştü, beam ile yeniden koşuldu.
Eksenler: terim ve akış ilk kez görene anlaşılır mı (İlk kez dinleyen); iddia kanıttan önce mi gelir (Şüpheci mentör); ne silinirse mesaj aynı kalır (Sadeleştirici).
| Seçenek | Kaynak | Sıra (bölüm sayısı) | Değer | Risk |
|---|---|---|---|---|
| A | İlk kez dinleyen | problem → yön (8 kart tek bölüm) → demo → çıktılar özeti (6) | akış ve kanıt erken | uzman dinleyici sıkılır |
| B | İlk kez dinleyen | kıvılcım+problem birleşir; rakipler+demolar tek "dünya ve biz" (6) | terimler ilk kullanımda tanımlı | aynı |
| C | Şüpheci mentör | demo 2. bölüm; kıvılcım+problem tek paragraf; showcase+çıktılar birleşir (6) | iddia hemen kanıtlanır | motivasyon zayıflar |
| D | Şüpheci mentör | sonraki adımlar çıkar, kanıtsız vaat yok (5) | budanmış anlatı | mentörden yön isteme fırsatı kaybolur |
| E | Sadeleştirici | problem → canlı demo → yön ve çıktılar; kıvılcım+dünya+showcase tek özet (5) | mentör ilk dakikada ürünü görür | "neden farklı" kanıtsız kalabilir |
| F | Sadeleştirici | sıra aynı; yön 8→3 kart, dünya+showcase tek cümle, sonraki adımlar 2 madde (6) | bilişsel yük azalır | 8 rakip, 8 yetenek kanıtı silinir |
Yakınsama: üç kart da demoyu öne alıyor (3/3) ve kıvılcımı problemle birleştiriyor (3/3); rakip vitrini ile bizim çıktılar tek bölüm (2/3). Ayrışan eksen "sonraki adımlar": mentör (D) çıkarıyor, diğerleri kısaltıyor.
Öneri (sentez, BA/PM merceği): 5 bölüm: 1) Problem (kıvılcım tek cümle) 2) Canlı demo Ç1-Ç3 3) Dünya ve biz (rakip kartları ve bizim kartlar aynı biçimde, fark cümlesiyle) 4) Yön (3 kart görünür, 8'i açılır) 5) Sonraki adımlar + mentörden istenen karar. Sonraki adımlar çıkmaz: mentör toplantısının iş değeri, hocadan yön almaktır (D'nin körlüğü). NexusOS dosyaları değişmedi; karar kullanıcının.
Harcanan token: 0k Claude (ücretsiz modelde 55k), süre ~6 dk.
Sonuç: doğrulandı (3 geçerli kart, 3 ayrı eksen; 6 seçenek, mentör kartı diğerlerinin önermediği "sonraki adımları çıkar" seçeneğini getirdi.)

- [x] 42. Adım geçmişinde güven: sessizlik ayrı, gerçek yürütücü
  - Problem ve hipotez: adım geçmişi (Adımlar bölümü) Modeller tablosunda düzelttiğimiz hatayı hâlâ taşıyor: kota sessizliği "✕ yanit_yok · 62 sn · 0 token" yazıyor, eksik süre/token 0 görünüyor, adım satırı işi kodcu yapmış olsa da planın `Yürütücü`'sünü (opencode) yazıyor. Hipotez: bunlar düzelirse "bu adımı kim yaptı, model gerçekten başarısız mı?" sorusu panelden doğru okunur. Başarı ölçütü: devralınan adımda "kodcu (plan: opencode)", sessiz denemeler başarısızlık gibi görünmez. UI'a dokunur ama yeni ekran yok: adım 41'in onaylı davranışının geçmiş görünümüne uzantısıdır (taslak yok).
  - Bütçe: 300000
  - Ne: `panel/ciz.mjs` içinde (`panel/gecmis.mjs` ve `panel/durum.mjs` değişmez): (1) Adım satırındaki yürütücü: o adımın geçmişinde `gecti === true` olan ilk denemenin `yurutucu`'su işi yapandır; plandakinden farklıysa `<gerçek> (plan: <plandaki>)` yaz, aynıysa ya da geçmiş/geçen deneme yoksa plandakini yaz. (2) `ozetHtml`: `neden === 'yanit_yok'` denemeler "gerçek deneme" sayılmaz; gerçek deneme varsa mevcut özet ("N. denemede geçti" / "geçmedi (K deneme)", K yalnız gerçek denemeler) ve sessiz varsa " · N sessiz"; yalnız sessiz deneme varsa özet "sağlayıcı sessiz (N)". (3) `ayrintiHtml`: sessiz deneme satırı `<div class="deneme sessiz">` ve "<deneme>. <model> ○ sağlayıcı yanıt vermedi" (✕, süre ve token yok); diğer satırlarda `sure_sn`/`token` `null` ise "—" (0 değil): "— sn · — token". (4) `sorunluMu`: sessiz denemeler yok sayılır (yalnız sessiz deneme = sorunlu değil; gerçek deneme kuralları aynı). Tüm metin `esc` ile kaçışlanır; mevcut `gecmis-ui.test.mjs` geçmeye devam eder.
  - Kapı: `node panel/gecmis-guven.test.mjs`
  - Kapı: `node panel/gecmis-ui.test.mjs && node panel/guven.test.mjs && node panel/modeller-ui.test.mjs`
  - Kapı: `bash test/hepsi.sh`

### Faz 4: panelin tamamlanması (2026-10-19)
Hipotez: panel "şu an ne oluyor, kim ne kadar harcıyor, hangi model nerede zorlandı" sorularına tek yerden, güven etiketiyle cevap verirse model seçimi ve sunum kararları panelden alınır. Başarı ölçütü: gerçek token ve tasarruf görünür, model × adım matrisi okunur, bölümler sekmelerde bulunur. Kapsam dışı (bilinçli): ısı haritası, Kanban, Claude oturumu yan yana (kullanıcı makinesinde kurulum), 7g/30g aralık düğmeleri (veri günde birkaç satır).

- [x] 43. "Sadece sorunlu" süzgeci çalışmamış adımları gizlemesin
  - Bütçe: 300000
  - Ne: `panel/ciz.mjs` `planHtml`: her `<li>`'ye `data-sorunsuz` ekle: geçmişi olan (g var) ve `sorunluMu` false ise `"1"`, diğer tüm durumlarda (çalışmamış/geçmişsiz adım dahil) `"0"`; mevcut `data-sorunlu` kalır. `panel/index.html` `filtreUygula`: gizleme koşulu `sadeceSorunlu && li.dataset.sorunsuz === '1'`. Karar: "sadece sorunlu" yalnız sorunsuz tamamlanmış adımları gizler; bekleyen adımlar görünür kalır.
  - Kapı: `node panel/suzgec.test.mjs`
  - Kapı: `node panel/gecmis-ui.test.mjs && node panel/gecmis-guven.test.mjs && node panel/arayuz.test.mjs etki`

- [x] 44. Gerçek token ve tasarruf kartı (opencode.db)
  - Problem ve hipotez: panel yalnız çalıştırıcının ölçtüğü sayıları gösteriyor; OpenCode'un gerçek token kırılımı (giriş, çıkış, reasoning, cache), hızı ve "ücretli olsaydı ne tutardı" yok. Hipotez: bu kart "ücretsiz modelle kaliteyi kaybetmeden" iddiasının maliyet tarafını tek sayıyla gösterir.
  - Etki: etki/telemetri.html
  - Onay: evet
  - Değer: 5
  - Bütçe: 300000
  - Ne: (1) Yeni `panel/telemetri.mjs`: `export function telemetri(dbYolu, fiyat)` → `{ var, modeller, toplam, tasarruf }`. `node:sqlite` `DatabaseSync(dbYolu, { readOnly: true })` ile `message` tablosunu okur (hiç yazma yok); `data` sütunu JSON, yalnız `role === 'assistant'` ve `tokens` olanlar, bozuk JSON satırı atlanır. Model anahtarı `providerID/modelID`. Modelde: `mesaj`, `giris` (tokens.input), `cikis` (output), `akil` (reasoning), `cacheOkuma` (cache.read), `cacheYazma` (cache.write), `toplam` (bu beşinin toplamı), `toksn` (cikis toplamı / süre toplamı sn, süre = time.completed − time.created ms/1000 yalnız ikisi de olan mesajlar; hiç yoksa `null`, reasoning hariç), `maliyet` (data.cost toplamı). `modeller` toplam token azalan sırada. `toplam`: aynı alanların tüm modellerdeki toplamı (+`mesaj`). `tasarruf`: `fiyat?.referans` içinde `giris`, `cikis`, `cacheOkuma`, `cacheYazma` sayıları hepsi varsa `{ referans: ad, listeFiyati, odenen, tutar }`, değilse `null`; `listeFiyati` = (giris·g + (cikis+akil)·c + cacheOkuma·co + cacheYazma·cy) / 1e6 tüm token toplamları üzerinden, `odenen` = toplam maliyet, `tutar` = listeFiyati − odenen. Veritabanı yoksa/açılmazsa/`message` tablosu yoksa `{ var: false, modeller: [], toplam: null, tasarruf: null }` (asla çökmez). (2) `panel/durum.mjs` `snapshot`: `telemetri` alanı; yol `process.env.OPENCODE_DB` ya da `~/.local/share/opencode/opencode.db`; fiyat `<dir>/fiyat.json` (yoksa/bozuksa `null`). (3) `panel/ciz.mjs`: `export function telemetriHtml(t)`: üstte kart "Tasarruf (tahmin): N token · liste fiyatıyla ~$X · ödenen $Y" (tutar sayıları `para` ile; `tasarruf` null ise "referans fiyat girilmedi"), altında tablo: model, mesaj, giriş, çıkış, cache, tok/sn (`null` → `—`); `t` null/`var` false ise "OpenCode veritabanı bulunamadı". Tüm metin `esc`. (4) `panel/index.html`: Modeller bölümünün altına `<h2>Gerçek token</h2><section id="telemetri">`, `telemetriHtml` ile her anlık görüntüde çizilir, mevcut CSS değişkenleri, açık/koyu tema.
  - Kapı: `node panel/telemetri.test.mjs`
  - Kapı: `node panel/durum.test.mjs && node panel/guven.test.mjs && node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`

- [x] 45. Model × adım matrisi
  - Problem ve hipotez: "hangi model hangi adımda zorlandı" yalnız terminalde (`karsilastir.mjs`). Hipotez: matris, model sırasını (`Modeller:`) veriyle değiştirme kararını bir bakışta destekler.
  - Etki: etki/matris.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Ne: (1) `panel/durum.mjs` `snapshot`: `matris: { adimlar, modeller }`. `adimlar`: `tur !== 'inceleme'` ve sayısal `adim`'li metrik satırlarındaki adım numaraları, artan, tekil. `modeller`: `{ yurutucu, model, hucreler }` yürütücü sonra model sırasıyla (`yurutucu` yoksa `opencode`). `hucreler[adım]` yalnız o model o adımı denediyse: `neden === 'yanit_yok'` satırları gerçek deneme sayılmaz; gerçek denemelerden biri geçtiyse `{ durum: 'ilk' (geçen deneme 1) | 'cok' (geçen deneme >1), deneme: geçen denemenin numarası, sure: o satırın sure_sn'i ya da null }`; gerçek deneme var ama geçen yoksa `{ durum: 'kaldi', deneme: gerçek deneme sayısı, sure: null }`; yalnız sessiz satır varsa `{ durum: 'sessiz', deneme: 0, sure: null }`. Veri yoksa `{ adimlar: [], modeller: [] }`. (2) `panel/ciz.mjs`: `export function matrisHtml(m)` tablo: başlıkta adım numaraları (`<th>`), satır başlığı `yurutucu/model`, hücre `<td class="hucre ilk|cok|kaldi|sessiz|bos" title="…">` metni `✓1`, `✓N`, `✕N`, `○`, boş; `title` deneme ve süreyi söyler; altta açıklama satırı ("✓N = N. denemede geçti · ✕ = geçmedi · ○ = yalnız kota sessizliği"); veri yoksa "metrik yok"; `esc`. (3) `panel/index.html`: Modeller bölümünün altına `<h2>Model × adım</h2><section id="matris">`, `matrisHtml` ile çizilir; `.hucre.ilk`, `.hucre.cok`, `.hucre.kaldi`, `.hucre.sessiz` CSS kuralları (mevcut `--rozet-*` değişkenleri; renk tek başına anlam taşımaz, simge de var), tablo geniş olursa yatay kayar.
  - Kapı: `node panel/matris.test.mjs`
  - Kapı: `node panel/durum.test.mjs && node panel/guven.test.mjs && node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`

- [x] 46. KPI şeridi ve sekmeler
  - Problem ve hipotez: panel tek uzun sayfa (Şu an, Adımlar, Modeller, Gerçek token, Model × adım, Etki, Araştırma); Etki ve Araştırma kaydırmadan bulunmuyor. Hipotez: üstte dört sayılık şerit ve dört sekme, ilk bakışta durumu verir ve bölümleri bulmayı kolaylaştırır.
  - Etki: etki/sekmeler.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Ne: (1) `panel/ciz.mjs`: `export function kpiHtml(snap)` dört kutu: `id="kpi-biten"` "bitenAdım / toplamAdım" (plan adımlarından; plan yoksa `—`), `id="kpi-ilk"` ilk denemede geçme % = `gecmis` içinde gerçek (yanit_yok olmayan) denemesi olan adımların kaçında geçen ilk deneme `deneme === 1` (hiç adım yoksa `—`; Math.round, "%50" biçimi), `id="kpi-token"`: `snap.telemetri.var` ise `telemetri.toplam.toplam` etiketi "gerçek token", değilse `snap.modeller` token toplamı (yalnız sayısal olanlar) etiketi "ölçülen token"; ≥1e6 → "4,1 M" (tr-TR, en çok 1 ondalık), ≥1e3 → "N k", yoksa tam sayı; `id="kpi-odenen"`: telemetri varsa `toplam.maliyet`, yoksa `modeller` maliyet toplamı, `para` ile. `snap` null/eksik çökmez, bilinmeyen `—`. `esc`. (2) `panel/index.html`: üstte `<section id="kpi">` (kpiHtml, her anlık görüntüde); altında `role="tablist"` içinde dört `role="tab"` düğme `data-sekme="akis|modeller|etki|arastirma"` (etiketler Akış, Modeller, Etki, Araştırma), `aria-selected`; içerik `role="tabpanel"` `id="sekme-<ad>"`: akis = `#simdi` + `#kategoriler` (+ "Şu an"/"Adımlar" başlıkları), modeller = `#modeller`, `#telemetri`, `#matris`, etki = `#etki`, arastirma = `#arastirma`. Seçili sekme `location.hash`'te saklanır (açılışta okunur, değişince yazılır, geçersizse akis), yalnız seçili panel görünür (`hidden`). KPI kutuları yan yana, dar ekranda (`@media (max-width: …)`) 2×2 ızgara, yatay taşma yok. Mevcut `id`'ler ve çizim fonksiyonları değişmez.
  - Kapı: `node panel/sekme.test.mjs`
  - Kapı: `node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs && node panel/arastirma.test.mjs && node panel/telemetri.test.mjs && node panel/matris.test.mjs`
  - Kapı: `bash test/hepsi.sh`
  - Not: `bash test/hepsi.sh` yalnız bu son adımda kapıdır; 44-46'nın kırmızı kapı testleri aynı depoda durduğu için önceki adımlarda hepsi.sh geçemez.

- [x] 47. Claude harcaması (Claude Code oturum dosyalarından)
  - Problem ve hipotez: KPI'daki "ödenen $0" yalnız OpenCode; planlama (ana oturum) ve `kodcu` (alt ajan) Claude token'ı hiçbir yerde yok. Hipotez: Claude harcaması görününce "ücretsiz modelle kaliteyi kaybetmeden" iddiası dürüst kapanır: OpenCode tasarrufu ile Claude maliyeti yan yana okunur. Başarı ölçütü: panelde Claude token'ı ve (fiyat biliniyorsa) tahmini maliyeti, ana oturum / alt ajan ayrımıyla görünür; fiyatı bilinmeyen model için maliyet uydurulmaz.
  - Etki: etki/claude.html
  - Onay: evet
  - Değer: 5
  - Bütçe: 300000
  - Ne: (1) Yeni `panel/claude.mjs`: `export function claudeKullanim(projeDizini, fiyat, kok = process.env.CLAUDE_PROJECTS || ~/.claude/projects)` → `{ var, modeller, toplam, ilk, son }`. `<kok>/*/*.jsonl` ve `<kok>/*/*/subagents/*.jsonl` dosyalarını satır satır okur (yalnız okuma; bozuk satır atlanır). Yalnız `type === 'assistant'`, `message.usage` ve `message.model` olan, `message.model !== '<synthetic>'` ve `cwd` değeri `projeDizini` ya da altı olan satırlar. Aynı `message.id` birden çok satırda gelir (içerik bloğu başına): id başına tek sayım, `output_tokens` en büyük olan satır. Alanlar: `giris` (input_tokens), `cikis` (output_tokens), `cacheOkuma` (cache_read_input_tokens), `cacheYazma` (cache_creation_input_tokens). Alt ajan dosyası ya da `isSidechain === true` satırı "altajan", diğerleri "ana". Modelde `{ model, mesaj, giris, cikis, cacheOkuma, cacheYazma, toplam, maliyet }`; `maliyet` = `fiyat.claude[model]` içinde `giris, cikis, cacheOkuma, cacheYazma` (USD/1M token) hepsi varsa (giris·g + cikis·c + cacheOkuma·o + cacheYazma·y)/1e6, yoksa `null`. `modeller` toplam azalan. `toplam`: `{ mesaj, toplam, ana, altajan, maliyet, fiyatsiz }`: `maliyet` yalnız fiyatı bilinen modellerin toplamı (hiç yoksa `null`, 0 değil), `fiyatsiz` fiyatı olmayan model adları. `ilk`/`son`: en eski/yeni `timestamp`'in `YYYY-MM-DD`'i. Hiç satır/klasör yoksa `{ var: false, modeller: [], toplam: null, ilk: null, son: null }`. Büyük dizin (gerçekte ~400 MB) her anlık görüntüde yeniden okunmasın: dosya başına `path+size+mtime` anahtarlı modül içi önbellek; dosya büyürse yalnız o dosya yeniden okunur. (2) `panel/durum.mjs` `snapshot`: `claude` alanı; proje dizini = `snapshot`'a verilen `dir` (mutlak yol); fiyat `fiyat.json`'dan (`claude` anahtarı). (3) `panel/ciz.mjs`: `export function claudeHtml(c)`: "Claude harcaması (tahmin, API karşılığı)" kartı: tarih aralığı, toplam token (ana / alt ajan payı %), toplam maliyet "~$X (en az, fiyatı bilinmeyen model dahil değil)" fiyatsız varsa; "abonelikteyseniz gerçek fatura farklı olabilir" notu; tablo model, mesaj, giriş, çıkış, cache, maliyet (`null` → "fiyat yok"); veri yoksa "Claude oturum verisi bulunamadı". `kpiHtml`: beşinci kutu `id="kpi-claude"` "Claude (tahmin)": maliyet varsa "~$X" (fiyatsız varsa " en az"), yoksa token toplamı ya da `—`. (4) `panel/index.html`: `<h2>Claude harcaması</h2><section id="claude">` Modeller sekmesinde (Model × adım'ın altında), her anlık görüntüde `claudeHtml`; KPI ızgarası 5 kutuya uyar (geniş ekranda 5, dar ekranda 2 sütun). (5) `fiyat.json`: `claude` bölümüne yalnız doğrulanabilen fiyat: `claude-sonnet-5-5` (2 / 10 / 0.2 / 2.5, kaynak models.dev neon, tahmin). `claude-opus-5-5` fiyatı doğrulanamadı, EKLEME.
  - Kapı: `node panel/claude.test.mjs`
  - Kapı: `node panel/sekme.test.mjs && node panel/telemetri.test.mjs && node panel/durum.test.mjs && node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`
  - Kapı: `bash test/hepsi.sh`

### Faz 5: proje durumu paneli (dbeaver-mm, 2026-10-22)
Hipotez: kullanıcı dbeaver-mm'in durumunu ("son kullanıcılar hangi sürümde, yayımlanmamış ne var, Windows derlemesi geçti mi, VM kopyasında yarım iş var mı") bugün terminal ve GitHub arasında topluyor; tek panelde ilk bakışta görürse kontrol tek adıma iner ve yarım iş/kırık derleme unutulmaz. Başarı ölçütü: `mdk-panel.sh start ~/projects/dbeaver-mm 4748` açılınca bu dört soru kaydırmadan cevaplanır; ağ yoksa panel düşmez, "son bilinen veri" der. Kapsam dışı: GitHub'a yazma (etiket, release, push), ana makinedeki kurulu sürümü okumak (VM'den erişim yok).
Seçenekler: (A) yalnız yeni "Depo" sekmesi; (B, seçildi 2026-10-22) A + üstte depo şeridi ve git deposu olan projede açılış sekmesi Depo — bir adım uzun ama "genel durum" sorusunu ilk bakışta cevaplar; (C) panel yerine `durum.sh` terminal özeti — en ucuz ama iki yere bakılır.

- [x] 48. Depo durumu (sürüm, yayımlanmamış K'ler, CI, yerel) ve projeye süzülmüş token
  - Problem ve hipotez: yukarıda (Faz 5). Ayrıca Gerçek token kartı tüm OpenCode oturumlarını sayıyor; dbeaver-mm panelinde mdk'in token'ı görünüyor.
  - Etki: etki/depo.html
  - Onay: evet
  - Değer: 5
  - Bütçe: 300000
  - Ne: (1) Yeni `panel/depo.mjs`: `export async function depo(dir, { calistir } = {})` → `{ var, surum, yayimlanmamis, ci, yerel, sonK, hata, ts }`. `calistir(komut, argumanlar)` → `Promise<{ kod, cikti }>`; varsayılanı `node:child_process` `execFile` ile `cwd: dir`, 20 sn zaman aşımı, hiç reddetmez (hata → `{ kod: 1, cikti: hata metni }`). Hiçbir durumda fırlatmaz: `calistir` fırlatırsa ya da `git rev-parse --is-inside-work-tree` kod≠0 ise `{ var: false }`. Komutlar (sırası serbest): `git remote get-url origin` (https ya da `git@github.com:` biçiminden `sahip/depo`); `git describe --tags --abbrev=0 origin/main` → `surum` (kod≠0 → `null`); `surum` varsa `git log <surum>..origin/main --format=%h%x09%cI%x09%s` → `yayimlanmamis: [{ kisa, tarih, mesaj }]`, yoksa `null`; `git log -10 origin/main --format=%h%x09%cI%x09%s` → `sonK`; `git rev-parse --abbrev-ref HEAD` → `yerel.dal`; `git rev-list --left-right --count HEAD...origin/main` → `yerel.ileri`, `yerel.geri` (sayı); `git --no-optional-locks status --porcelain` → `yerel.degisik` (satır başı boşluğu KIRPILMADAN, yol = `satir.slice(3)`; boş satır atlanır). `ci`: origin GitHub ise `gh run list -R <sahip/depo> -L 5 --json workflowName,displayTitle,status,conclusion,headBranch,createdAt,url` JSON dizisi; gh kod≠0 ya da JSON bozuksa `ci: null` ve `hata` = kısa neden; aksi `hata: null`. `ts` = `Date.now()`. `depo()` fetch YAPMAZ. (2) `panel/sunucu.mjs`: `baslat(dir, port, { calistir } = {})`; `listen`'dan önce `depo(kok, { calistir })` beklenir (ilk `/api/durum` dolu gelir); sonra 60 sn'de bir `depo()`; `depo.var` ise açılışta beklemeden ve 5 dk'da bir `calistir('git', ['fetch', '-q', 'origin'])` ardından `depo()`; sonuç her geldiğinde SSE gönderilir. `/api/durum` ve SSE gövdesi `{ ...snapshot(kok), depo }` (`snapshot()` senkron ve ağsız kalır). Zamanlayıcılar `kapat()`'ta durur, `unref()` edilir. (3) `panel/telemetri.mjs`: `telemetri(dbYolu, fiyat, dizin)`; `dizin` verilmiş ve `session` tablosu varsa yalnız `session.directory === dizin` ya da `startsWith(dizin + path.sep)` olan oturumların mesajları (`/a/proje-duman` `/a/proje`'ye sayılmaz) ve `kapsam: 'proje'`; aksi halde (dizin yok ya da `session` tablosu yok) tümü ve `kapsam: 'tum'`. Dönüşteki mevcut alanlar değişmez. `panel/durum.mjs` proje dizinini üçüncü argüman olarak verir. (4) `panel/ciz.mjs`: `export function depoSeritHtml(d)`: `d` null ya da `var` false ise `''`; dört kutu `id="kpi-surum"` (son sürüm ya da `—`), `kpi-yayimlanmamis` ("N K", `null` ise `—`), `kpi-ci` (`ci` içinde `workflowName === 'windows-release'` olan ilk koşu; `status !== 'completed'` → "… sürüyor", `conclusion === 'success'` → "✓ geçti", diğer → "✕ <conclusion>"; yoksa `—`), `kpi-yerel` ("N dosya · ↑i ↓g"). `export function depoHtml(d)`: null/`var` false ise `''`; bölüm başlıkları "Yayımlanmamış (<surum> → origin/main)", "GitHub Actions", "Yerel", "Son K commit'leri"; commit satırı kısa hash, mesaj, göreli tarih ("3 gün önce", "5 dk önce"); koşu satırı simge, iş akışı, başlık, dal, `<a href="url" rel="noopener" target="_blank">`; `hata` varsa "GitHub'a ulaşılamadı: <hata>". `telemetriHtml`: `kapsam === 'proje'` ise başlık notu "(bu proje)", değilse "(tüm projeler)". Tüm metin `esc`; hiçbir çıktıda `null`/`undefined`/`NaN` görünmez. (5) `panel/index.html`: `import`'a `depoSeritHtml, depoHtml`; KPI şeridinin üstünde `<section id="depo-serit">`; sekme düğmelerinde ilk sırada `data-sekme="depo"` "Depo", paneli `id="sekme-depo"` içinde `<section id="depo">`; `SEKMELER`'e eklenir; adreste geçerli sekme yoksa açılış sekmesi depo verisi varsa (`d.depo?.var`) Depo, yoksa Akış (ilk veri gelince bir kez karar verilir); depo yoksa Depo düğmesi gizlenir. Mevcut CSS değişkenleri, dar ekranda 2×2.
  - Kapı: `node panel/depo.test.mjs`
  - Kapı: `node panel/sekme.test.mjs && node panel/telemetri.test.mjs && node panel/durum.test.mjs && node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs && node panel/matris.test.mjs`
  - Not: `bash test/hepsi.sh` 47'nin kırmızı kapısı yüzünden şu an kırmızı; 47 bitmeden 48'e kapı olarak konmaz.

### Faz 6: panel iyileştirme (2026-10-26)
Problem ve hipotez: panelin her sekmesi gerçek veriyle ekran görüntüsünden incelendi; beş görünür kusur (matris kesik, Etki sekmesi boş, anlamsız depo kutuları, tutarsız sayılar, dar ekranda dokuz kutu) ve dört eksik (açık adımlar en altta, tasarruf ile Claude maliyeti ayrı, araştırmada yapılanlar yapılacak gibi, depo listesi tekrar) bulundu; kullanıcı ayrıca etki krokilerinin tıklanınca büyümesini istedi. Hipotez: bunlar giderilince panel "ne bitti, ne sırada, neye mal oldu" sorularını kaydırmadan ve yanlış okunmadan cevaplar. Başarı ölçütü: adım sonunda iki panelin (4747, 4748) yeni ekran görüntülerinde bu dokuz maddenin hiçbiri görülmez.
Kullanıcı kararı (2026-10-26): kapsam tümü; Akış için "açıklar üstte, bitenler katlı" (alternatif "sıradaki iş kartı" seçilmedi); yürütücü opencode.
Ortak kural: `<details>` kullanan her yeni öğenin açık/kapalı durumu SSE ile gelen her yeniden çizimde korunur (mevcut `acikTercih` deseni). Kapılar adım çalıştırılmadan hemen önce yazılır, kırmızı doğrulanır, commit edilir; `bash test/hepsi.sh` yalnız son adımın kapısıdır.

- [x] 49. Matris yatay kaydırma
  - Problem ve hipotez: Model × adım matrisinde 31 ve 40-48 sütunları kart dışına taşıyor, kaydırılamıyor; son adımlar ve kodcu/fable satırı boş görünüyor.
  - Etki: etki/matris-kaydir.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Ne: (1) `panel/ciz.mjs` `matrisHtml`: tablo `<div class="kaydir">` içine alınır (lejant dışarıda kalır); boş durum metni değişmez. (2) `panel/index.html`: `.kaydir { overflow-x: auto; }`; `table.matris th.model { position: sticky; left: 0; background: var(--kart); z-index: 1; }` (satır etiketi kaydırırken görünür kalır).
  - Kapı: `node panel/matris-kaydir.test.mjs && node panel/matris.test.mjs`

- [x] 50. Sayı biçimi ve hüküm etiketi
  - Problem ve hipotez: para "$21.76" (İngilizce ondalık), token "9,7 M" (Türkçe); Adımlar başlığı "29 adım" derken KPI "44 / 48" diyor, 29'un ne olduğu yazmıyor.
  - Etki: etki/sayi-bicimi.html
  - Onay: evet
  - Değer: 2
  - Bütçe: 300000
  - Ne: (1) `panel/ciz.mjs` `para(n)`: tr-TR ondalık virgül, binlik nokta: n ≥ 1 → `$` + 2 ondalık ("$21,76", "$1.234,50"); 0 < n < 1 → 4 ondalık ("$0,2500"); diğer → "$0". `toLocaleString('tr-TR', { minimumFractionDigits, maximumFractionDigits })`. (2) `hukumHtml`: "N adım:" yerine "N ölçülen adım:" (gerisi aynı).
  - Kapı: `node panel/sayi-bicimi.test.mjs && node panel/modeller-ui.test.mjs && node panel/gecmis-ui.test.mjs`

- [x] 51. Depo: yalnız anlamlı kutular, tekrarsız commit listesi
  - Problem ve hipotez: sürüm etiketi ve CI olmayan projede (mdk) dört kutudan üçü "—"; "Windows derlemesi" dbeaver-mm'e özgü. "Son K commit'leri" yayımlanmamış listesini tekrar ediyor.
  - Etki: etki/depo-sade.html
  - Onay: evet
  - Değer: 3
  - Bütçe: 300000
  - Ne: (1) `panel/ciz.mjs` `depoSeritHtml`: `kpi-surum` ve `kpi-yayimlanmamis` yalnız `d.surum` varsa; `kpi-ci` yalnız `windows-release` koşusu bulunursa; `kpi-yerel` her zaman. Hiç kutu kalmazsa (olmaz, yerel hep var) yine `<div class="kpi">`. (2) `panel/depo.mjs`: `sonK` komutu `git log -10 <surum ya da origin/main> --format=%h%x09%cI%x09%s` (sürüm varsa yayımlanmış son 10 commit). (3) `depoHtml`: son bölüm başlığı sürüm varsa "<surum> ile yayımlananlar", yoksa "Son commit'ler". dbeaver-mm biçimi (sürüm + windows-release koşusu) dört kutu göstermeye devam eder.
  - Kapı: `node panel/depo-sade.test.mjs && node panel/depo.test.mjs`

- [x] 52. Dar ekran: sıkı KPI ve tek satır sekme
  - Problem ve hipotez: 400 px genişlikte KPI kutuları bir ekranı dolduruyor, sekmeler iki satıra kırılıyor.
  - Etki: etki/dar-ekran.html
  - Onay: evet
  - Değer: 3
  - Bütçe: 300000
  - Ne: `panel/index.html` yalnız CSS: `@media (max-width: 520px)` içinde `.kpi` 3 sütun, `gap: 6px`; `.kpi-kutu` `padding: 6px 8px`; `.kpi-kutu b` `font-size: 15px`; `.kpi-kutu .etiket` `font-size: 11px`; `.sekmeler` `flex-wrap: nowrap; overflow-x: auto;` ve düğmeler `white-space: nowrap; flex: none`. Geniş ekran kuralları değişmez.
  - Kapı: `node panel/dar-ekran.test.mjs && node panel/sekme.test.mjs`

- [x] 53. Etki sekmesi: biten adımların taslakları
  - Problem ve hipotez: biten adımların taslakları hiç görünmüyor; onay bekleyen yokken sekme "etki adımı yok" diyor ve kullanıcı taslak yok sanıyor.
  - Etki: etki/etki-gecmis.html
  - Onay: evet
  - Değer: 3
  - Bütçe: 300000
  - Ne: (1) `panel/durum.mjs`: `etki` listesine biten ve `etki` alanı olan adımlar da girer, `bitti: true` alanıyla (açıklar `bitti: false`); mevcut alanlar ve tahmin aynı. (2) `panel/ciz.mjs` `etkiHtml(etki, { gecmisAcik = false } = {})`: önce açık adımların kartları (mevcut biçim); açık yoksa `<span class="bos">onay bekleyen taslak yok</span>`; biten varsa ardından `<details class="etki-gecmis"` (gecmisAcik ise ` open`) `><summary>Biten adımların taslakları (N)</summary>` içinde aynı kartlar, adım no azalan. `etki` boş ya da null → yalnız "onay bekleyen taslak yok". (3) `panel/index.html`: `details.etki-gecmis` toggle'ı bir değişkende tutulur, her çizimde `etkiHtml(d.etki, { gecmisAcik })`.
  - Kapı: `node panel/etki-gecmis.test.mjs && node panel/etki.test.mjs && node panel/arayuz.test.mjs etki`

- [x] 54. Akış: açık adımlar üstte, biten bölümler katlı
  - Problem ve hipotez: 48 adımın 44'ü bitti; açık adımlar (36-39, yeni adımlar) uzun listenin altında kalıyor. Hipotez: tamamı biten bölümler katlanınca açık iş ilk ekranda görünür.
  - Etki: etki/akis-katli.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Ne: (1) `panel/ciz.mjs` `planHtml(plan, simdi, gecmis, incelemeler, acik = {}, secenek = {})`: en az bir bitmemiş adımı olan bölümler önce (kendi sıralarında), tüm adımları bitmiş bölümler sonra. Tamamı bitmiş bölüm `<details class="kat" data-kat="<ad (esc)>" data-varsayilan="1|0">` (varsayılan açıklık; ardından ` open` gerekiyorsa) içinde, `<summary>` bölüm adı + "N/N bitti" + içinde sorunlu adım varsa " · K sorunlu"; içerik bugünkü `ul.adimlar`. Açık mı: `acik['kat:' + ad]` boolean ise o; değilse `secenek.sadeceSorunlu` ve bölümde sorunlu adım varsa açık; aksi kapalı. Bitmemiş adımı olan bölüm bugünkü gibi düz `<h2>`. Adım `<details data-no>` davranışı değişmez. (2) `panel/index.html`: `details[data-kat]` toggle'ı `acikTercih['kat:' + ad]`'a yazılır (adım tercihiyle aynı nesne); tercih yalnız `data-varsayilan`'dan farklıysa saklanır (aynıysa silinir); plan çizimi `function planCiz()` içine alınır (`planHtml(..., acikTercih, { sadeceSorunlu })`), "sadece sorunlu" değişince `planCiz()` çağrılır.
  - Kapı: `node panel/akis-katli.test.mjs && node panel/gecmis-ui.test.mjs && node panel/suzgec.test.mjs && node panel/ciz.test.mjs`

- [x] 55. Maliyet dengesi kartı
  - Problem ve hipotez: OpenCode tasarrufu (Gerçek token kartı) ile Claude harcaması (47) ayrı kartlarda; "ücretsiz modelle kaliteyi kaybetmeden" iddiası tek bakışta okunmuyor. Hipotez: ikisi yan yana, önce ölçülen token sonra tahmini para, okununca süreç maliyeti dürüstçe görülür.
  - Etki: etki/denge.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Ne: (1) `panel/ciz.mjs` `export function dengeHtml(tel, cl)`: iki sütunlu kart `<div class="kart denge">`: "OpenCode (ücretsiz)" ve "Claude". Her sütunda önce token (`kisa`), sonra para: OpenCode için `tel.tasarruf.listeFiyati` varsa "liste fiyatıyla ~$X (kaçınılan, tahmin)", Claude için `cl.toplam.maliyet` sayıysa "~$Y" ve `fiyatsiz` doluysa " en az (fiyatsız: <adlar>)", yoksa "fiyat yok". Altında ölçülen tek oran: "token'ların %Z'si ücretsiz modelde" (Z = OpenCode / (OpenCode + Claude) token, ikisi de varsa; Math.round). Para farkı ya da kat oranı YAZILMAZ (Claude tutarı alt sınır). Bir taraf yoksa o sütun "veri yok", oran satırı yok; ikisi de yoksa `''`. Tüm metin `esc`. (2) `panel/index.html`: Modeller sekmesinin en üstünde `<h2>Maliyet dengesi</h2><section id="denge">`, her çizimde `dengeHtml(d.telemetri, d.claude)`; iki sütun dar ekranda alt alta.
  - Kapı: `node panel/denge.test.mjs`

- [x] 56. Araştırma: yapılan önerilere rozet
  - Problem ve hipotez: sekiz birleşim önerisinin altısı yapıldı ama hâlâ yapılacak gibi görünüyor.
  - Etki: etki/arastirma-yapildi.html
  - Onay: evet
  - Değer: 2
  - Bütçe: 300000
  - Ne: (1) `arastirma/arastirma.json`: yapılan birleşimlere `adim` (sayı) alanı kapı commit'inde Claude tarafından eklenir (telemetri 44, tasarruf 44, matris 45, Claude yan yana 47, görsel dil 46, güven etiketi 41). (2) `panel/ciz.mjs` `arastirmaHtml`: birleşimde `adim` sayıysa efor rozeti yerine `<span class="rozet bitti">yapıldı · adım N</span>`; yapılmamışlar önce, yapılanlar sonra (her grup kendi sırasında); başlık "Birleşim önerileri (A açık, Y yapıldı)".
  - Kapı: `node panel/arastirma-yapildi.test.mjs && node panel/arastirma.test.mjs`

- [x] 57. Etki krokisi tıklanınca büyür
  - Problem ve hipotez: önce/sonra krokileri kart içinde küçük; ayrıntı okunmuyor (kullanıcı isteği, 2026-10-26).
  - Etki: etki/kroki-buyut.html
  - Onay: evet
  - Değer: 4
  - Bütçe: 300000
  - Ne: (1) `panel/ciz.mjs` `etkiHtml`: her kroki kutusunda iframe'in üstünde saydam `<button type="button" class="buyut" data-src="<iframe src'si>" aria-label="önce taslağını büyüt">` (sonra için "sonra taslağını büyüt"); `data-src` `esc`. (2) `panel/index.html`: tek `<dialog id="buyuk">` içinde kapat düğmesi ve `<iframe>` (92vw × 88vh); `.buyut` tıklanınca iframe `src` = `data-src`, `showModal()`; Esc (yerleşik), kapat düğmesi ve arka plana tıklama kapatır, kapanınca iframe `src` boşaltılır. CSS: kroki kutusu `position: relative`, `.buyut { position: absolute; inset: 0; background: transparent; border: 0; cursor: zoom-in; }`, `.buyut:focus-visible { outline: 2px solid var(--vurgu); }`; `#buyuk iframe { width: 92vw; height: 88vh; }`.
  - Kapı: `node panel/kroki-buyut.test.mjs && node panel/etki-gecmis.test.mjs`
  - Kapı: `bash test/hepsi.sh`

### Faz 7: persona turu OpenCode'da (2026-10-27)
Problem ve hipotez: adım 36'nın 1. turu her persona için bir Claude alt ajanı açtı ve 107k Claude token'ı harcadı (ajan başına ~36k sabit yük); bu yüzden durdu. Kullanıcı kararı (2026-10-27): her persona OpenCode'da ayrı bir oturumda, ücretsiz bir modelle çalışır; Claude yalnız kısa çıktıları birleştirir. Hipotez: Claude maliyeti tur başına ~0'a iner, personalar her karar için ucuzca çağrılabilir; farklı modeller bağımsızlığı artırır. Başarı ölçütü: 3 kartlı bir tur Claude token'ı harcamadan ≤10 dk'da en az 2 geçerli yanıt verir; adım 36 bu betikle tamamlanır.
Riskler: ücretsiz model biçime uymayabilir (çıktıda "Seçenek A" yoksa yanıt geçersiz sayılır, sıradaki model denenir); `plan` ajanı salt-okunurdur, persona dosya değiştiremez.

- [x] 58. Persona turu betiği
  - Değer: 4
  - Bütçe: 300000
  - Ne: Proje köküne `persona-tur.sh` (bash; `mdk-adim.sh` ile aynı üslup). Kullanım: `persona-tur.sh <alan> <soru-dosyası> "<kart 1>" "<kart 2>" ["<kart 3>" ...]`. (1) `personalar.md` (değişken `PERSONALAR`, varsayılan `./personalar.md`) içinden `## Alan: <alan>` bölümündeki `### <kart>` bloğu (bir sonraki `### ` ya da `## ` başlığına kadar) ve `## Ortak` altındaki `### Çıktı biçimi` ile `### Ayırt edicilik şartı` blokları alınır. Alan ya da kart yoksa stderr'e neden, çıkış 2, hiçbir dosya yazılmaz; argüman eksikse kullanım satırı, çıkış 2. (2) Modeller `PLAN.md`'deki `Modeller:` satırından (değişken `PLAN`, varsayılan `./PLAN.md`; `PERSONA_MODELLER` virgüllü listeyle ezer). Kart i (0'dan) ilk denemede `modeller[i % n]` ile, geçersiz yanıtta sıradaki modelle (`modeller[(i+1) % n]`) bir kez daha koşar. (3) Her kart paralel, stdin kapalı: `opencode run --agent plan -m <model> --format json "<istem>"`; istem = "Sen şu personasın:" + kart bloğu + ortak iki blok + "Problem:" + soru dosyasının içeriği + "Kod ya da dosya değiştirme; yalnız yukarıdaki biçimde yanıt ver." Kullanıcının önerisi ve diğer kartlar isteme girmez. Süre sınırı `PERSONA_SURE` sn (varsayılan 300): aşan süreç öldürülür (`setsid` + grup), yanıt geçersiz sayılır. (4) Yanıt metni json olaylarında `type === "text"` olanların `part.text`'i birleştirilerek alınır; geçerli = metinde `Seçenek A` geçer. Token = `step_finish` `part.tokens.total` toplamı. (5) Çıktı `persona-tur/<YYYYMMDD-HHMMSS>/` altında (dizin varsa sonuna `-2`, `-3`… eklenir; eski turun dosyaları karışmaz): kart başına `<i+1>-<kart adı: küçük harf, harf/rakam dışı her dizi tek tire, baş/son tire yok>.md` (başlık `# <kart>`, `Model: <model>`, `Token: <n>`, `Durum: gecerli|gecersiz|sure`, ardından yanıt metni), ham olaylar `<aynı ad>.jsonl`, ve `ozet.md`: alan, soru, kart başına tek satır `- <kart> · <model> · <durum> · <token> token`, ardından geçerli yanıtların metni. Son satırda dizin yolu stdout'a yazılır. (6) Çıkış: en az 2 geçerli yanıt ya da tek kartlı turda 1 geçerli → 0, aksi 1. `.gitignore`'a `persona-tur/`.
  - Kapı: `bash test/persona-tur.test.sh`
  - Kapı: `node persona-denetle.mjs`

### Faz 8: persona turunu bitirme (2026-10-27)
Problem ve hipotez: kota dolu model persona turunda hiç çıktı vermiyor ve kart `PERSONA_SURE` (300 sn) dolana dek bekliyor; adım 36'da bir kart bu yüzden düştü, tur 10 dk sürdü. Ölçüm: sessiz deneme 0 bayt yazar, yanıt veren model ilk saniyelerde `step_start` olayı yazar. Hipotez: ilk olay N saniyede gelmezse model atlanırsa tur kısalır ve kart düşmez. Ayrıca `sunum` ve `arastirma` alanları hiç gerçek işte denenmedi; gerçek birer kararla denenince kartların ayrıştığı ya da ayrışmadığı görülür. Başarı ölçütü: sessiz modelde kart ~60 sn içinde sıradaki modele geçer; iki alan `Durum: denendi`.

- [x] 59. Persona turunda sessiz modeli erken atla
  - Değer: 3
  - Bütçe: 300000
  - Ne: `persona-tur.sh` `kart_kos` bekleme döngüsü: yeni değişken `ILK=${PERSONA_ILK:-60}` (saniye; `SURE` satırının altında, aynı yorum üslubuyla). Deneme dosyası (`$f.deneme`) boşken (`[ ! -s "$f.deneme" ]`) geçen süre `ILK`'ya ulaşırsa süreç grubu `SURE`'deki gibi `kill -KILL -- -"$pid"` ile öldürülür ve `durum=sessiz` olur; sonra mevcut akışla sıradaki modelle bir kez daha denenir (geçersiz/süre gibi). Dosyada çıktı varsa `ILK` uygulanmaz, yalnız `SURE` geçerlidir. `SURE` kontrolü ve `durum=sure` aynen kalır. `ozet.md` satırında durum `sessiz` yazılır (mevcut kod bunu zaten durum alanından yazar). Kullanım yorumuna `PERSONA_ILK` eklenir. Başka dosya değişmez.
  - Kapı: `bash test/persona-tur.test.sh`
  - Kapı: `bash test/hepsi.sh`

- [x] 60. Araştırma alanını gerçek kararla dene
  - Yürütücü: claude
  - Ne: Karar: `arastirma/arastirma.json`'da açık kalan iki birleşim (Adım panosu, Isı haritası ve sparkline) yapılsın mı, hangisi önce, yoksa araştırma kapansın mı. `arastirma` alanından 3 kartla (Uygulayıcı, Karşıt görüş avukatı, Kapsam bekçisi; karşı çıkan Karşıt görüş avukatı) `persona-tur.sh` turu. Claude kartların iddialarını `metrikler.jsonl` ve panel koduyla sınar. `## Karar notu: Persona denemesi 4` (seçenek tablosu, `Harcanan token: Nk`, `Sonuç:` satırı; ölçüt ≥2 geçerli kart ve ≥2 farklı eksen). Günlüğe satır, `arastirma` alanı `Durum: denendi`. `arastirma.json` değişmez; yapılacak bir birleşim çıkarsa yeni adım olarak önerilir, kullanıcı onayına kalır.
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `grep -A1 '^## Alan: arastirma' personalar.md | grep -q 'Durum: denendi'`
  - Kapı: `grep -q '^## Karar notu: Persona denemesi 4' PLAN.md`

- [x] 61. Sunum alanını gerçek kararla dene
  - Yürütücü: claude
  - Ne: Karar: NexusOS mentör showcase sayfasının bölüm sırası (`~/NexusOS/sunum/sunum-verisi.md` §1 Hikâye: kıvılcım, problem, yön, dünyada ne var, showcase, çıktılar, demo, sonraki adımlar); demo erken mi geç mi, hangi bölüm birleşir ya da çıkar. `sunum` alanından 3 kartla (İlk kez dinleyen, Şüpheci mentör, Sadeleştirici; karşı çıkan Sadeleştirici) `persona-tur.sh` turu. `## Karar notu: Persona denemesi 5` (aynı biçim ve ölçüt). Günlüğe satır, `sunum` alanı `Durum: denendi`. NexusOS dosyaları değişmez; öneri kullanıcıya sunulur, karar onundur.
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `grep -A1 '^## Alan: sunum' personalar.md | grep -q 'Durum: denendi'`
  - Kapı: `grep -q '^## Karar notu: Persona denemesi 5' PLAN.md`

- [x] 62. Ücretsiz kota dolunca modeli hemen bırak
  - Değer: 4
  - Bütçe: 300000
  - Ne: `mdk-adim.sh`. Kota dolunca opencode "Free usage limit reached" hatasını yalnızca kendi log'una yazıp sessizce yeniden dener; şimdi bu durum `ILK` (90 sn) sonra `yanit_yok` oluyor. (1) `opencode run` satırına `--print-logs --log-level ERROR` ekle (hata satırı böylece stderr'e, yani mevcut `"$log.err"` dosyasına düşer; stdout JSON'u değişmez). (2) Bekleme döngüsünde `yanit_yok` kontrolünden ÖNCE: `grep -q "Free usage limit" "$log.err"` ise `neden=kota` (süreç grubu diğer nedenlerdeki gibi öldürülür). (3) `kota` da `yanit_yok` gibi davranır: `SAGLAYICI`'yi 0 yapmaz ve aynı modeli yeniden denemeden sıradaki modele geçer (mevcut `[ "$neden" = yanit_yok ]` iki satırını `yanit_yok`|`kota` kapsayacak biçimde genişlet). (4) Tüm modeller `yanit_yok`/`kota` ise mevcut çıkış 6 korunur; mesaj kota görüldüyse "ücretsiz kota dolu" ifadesini içerir (ör. bir `kota_goruldu=1` değişkeniyle). Eskale (çıkış 2) yapılmaz. Başka dosya değişmez.
  - Kapı: `bash test/mdk-adim.test.sh kota`
  - Kapı: `bash test/hepsi.sh`

### Faz 9: panelden taslak kararı (2026-10-28)
Problem ve hipotez: kullanıcı etki taslağını panelde görüyor ama onay/red/yorumu CLI sohbetine yazmak zorunda; iki pencere arasında gidip geliyor ve taslak onayı akışı tıkanıyor. Hipotez: karar panelden bir tıkla bir dosyaya (etki/kararlar.jsonl) düşer, açık Claude oturumu bu dosyayı Monitor ile izler; kullanıcı CLI'a hiç yazmadan onay → adım yürütülür, red/yorum → taslak düzeltilir. Persona turu (`persona-tur/20261028-113106`, 3/3 geçerli): üç kart da dosya kuyruğunda birleşti; ayrışan eksenler (1) "kuyrukta mı, Claude aldı mı" açıkça görünmeli, (2) PLAN.md'yi panel değil Claude yazmalı (çoklu yazıcı çakışması, mdk-adim kurcalama tespiti). Kullanıcı kararı: dosya + Claude izler; red ve yorum ayrı tür.
Başarı ölçütü: kullanıcı bir taslağı yalnız panelden onaylar ve adım CLI'a yazmadan başlar; red notuyla gönderilen taslak Claude tarafından düzeltilip panelde yenilenir. Kart her zaman üç durumdan birini söyler: Claude aldı / Claude'a iletiliyor / kuyrukta (oturum açılınca işlenir).
Akış: kart → (isteğe bağlı) not → Onayla | Reddet | Yorum (1-2 tık). Hata: kart altında kırmızı tek satır, yazılan not silinmez. Güvenlik: sunucu yalnız `127.0.0.1`; POST yalnız `application/json` (başka sitenin basit form isteği reddedilir), Host yerel olmalı, Origin varsa Host ile aynı olmalı.
Dosyalar (hepsi `.gitignore`): `etki/kararlar.jsonl` (her satır `{"ts","no","tur","metin"}`), `etki/.karar-okundu` (Claude'un aldığı son `ts`), `etki/.karar-izleyici` (izleyen `karar-bekle.mjs` sürecinin pid'i).

- [x] 63. Karar modülü
  - Değer: 3
  - Bütçe: 300000
  - Ne: Yeni `panel/karar.mjs` (yalnız `node:fs`, `node:path`). `export function kararEkle(kok, girdi, simdi = Date.now())`: `girdi` nesne olmalı; `no` pozitif tam sayı (`Number.isInteger`, `> 0`; metin "63" kabul edilmez); `tur` `'onay' | 'red' | 'yorum'`; `metin` verilmezse `''`, verilirse string olmalı, `trim()` edilir, en çok 2000 karakter; `red` ve `yorum`da kırpılmış metin boş olamaz. Geçersizse Türkçe mesajlı `Error` fırlatır ve dosyaya dokunmaz. Geçerliyse `{ ts: simdi, no, tur, metin }` nesnesini (bu anahtar sırasıyla) `join(kok, 'etki', 'kararlar.jsonl')` dosyasına `JSON.stringify(...) + '\n'` olarak ekler (`mkdirSync(..., { recursive: true })`, `appendFileSync`) ve nesneyi döner. `export function kararlar(kok)`: dosya yoksa `[]`; satır satır `JSON.parse`, bozuk/boş satırı atlar; dosya sırasıyla dizi döner. Başka dosya değişmez.
  - Kapı: `node panel/karar.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 64. Sunucuda karar rotası
  - Değer: 4
  - Bütçe: 300000
  - Ne: `panel/sunucu.mjs`. `if (istek.method !== 'GET')` bloğundan ÖNCE: `istek.method === 'POST' && pathname === '/api/karar'` ise ayrı bir işleve (aynı dosyada, ör. `kararAl(istek, yanit)`) git; diğer GET dışı istekler (OPTIONS dahil) 405 kalır. Sıra ve kodlar: (1) `Host` başlığının ana bilgisayar kısmı `127.0.0.1` ya da `localhost` değilse 403; `Origin` başlığı varsa ve `http://<Host başlığı>` değilse 403. (2) `content-type` `application/json` ile başlamıyorsa 415. (3) Gövde 4096 baytı geçerse 413: yanıtı hemen yaz, kalan gövdeyi `istek.resume()` ile boşalt, soketi kapatma (`destroy` yok; istemci ECONNRESET almasın). (4) `JSON.parse` hatasında 400. (5) Plan (`parse(readFileSync(join(kok,'PLAN.md')))`, `panel/plan.mjs`) içinde `no`'lu adım yoksa, `etki`'si yoksa ya da `bitti` ise 404. (6) `kararEkle(kok, girdi)` (`panel/karar.mjs`) hata fırlatırsa 400. Başarıda 200 `{"tamam":true,"karar":{...}}` ve `planla()` çağrılır (SSE). Ayrıca panel yeniden çizilsin diye `etki/` dizini de izlenir: başlangıçta `mkdirSync(join(kok,'etki'), { recursive: true })` (try içinde), ikinci bir `watch(join(kok,'etki'), () => planla())` (try içinde; `kapat()`'ta o da kapanır). 413 dışındaki hatalarda gövde `{"hata":"<Türkçe neden>"}`, `content-type: application/json; charset=utf-8`. PLAN.md'ye yazılmaz. Başka dosya değişmez.
  - Kapı: `node panel/karar-sunucu.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 65. Karar izleyici betiği
  - Değer: 4
  - Bütçe: 300000
  - Ne: Yeni `karar-bekle.mjs` (proje kökünde, yalnız `node:` modülleri; `kararlar()` için `./panel/karar.mjs`'yi içe aktar). Kullanım yorumu: `node karar-bekle.mjs [dizin] [--bir-kez]` (dizin = `--` ile başlamayan ilk argüman, yoksa `.`); Claude oturumu bunu Monitor ile çalıştırır. İşaret `etki/.karar-okundu` (tek sayı; yoksa ya da bozuksa 0). Okunmamış = `ts > işaret` olan kararlar, dosya sırasıyla; her biri için stdout'a tek satır: metin boşsa `adım <no> <tur>`, değilse `adım <no> <tur>: <metin>` (metindeki `\r?\n` dizileri tek boşluk); basınca işareti görülen en büyük `ts`'ye yazar. `--bir-kez`: bir kez yap, çık (0), pid dosyası yazma. Aksi hâlde: başta `etki/.karar-izleyici`'ye `process.pid` yaz (`mkdirSync` recursive), bir kez tara, sonra her 1 sn tara (`setInterval`); `SIGTERM`/`SIGINT`'te pid dosyasını sil ve çık (0). Başka dosya değişmez.
  - Kapı: `node test/karar-bekle.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 66. Durumda karar bilgisi
  - Değer: 3
  - Bütçe: 300000
  - Ne: `panel/durum.mjs`. `kararlar(dir)` (`./karar.mjs`) bir kez okunur; `etki/.karar-okundu` sayısı (yoksa/bozuksa 0). `sonuc.etki.push` nesnesine üç alan: `onay: !!a.onay`, `karar`: bu adımın (`no` eşit) EN SON (dosyada en sonda) kararı ya da `null`, `alindi`: `karar !== null && karar.ts <= işaret`. Yeni `sonuc.kararIzleyici`: `etki/.karar-izleyici` içeriği pozitif tam sayı pid ise ve `process.kill(pid, 0)` hata vermiyorsa `true`, aksi hâlde `false` (dosya yok, bozuk, süreç yok). Plan yoksa da `kararIzleyici` alanı olur. Başka dosya değişmez (`panel/etki.test.mjs` yeni alanları zaten bekliyor).
  - Kapı: `node panel/karar-durum.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 67. Etki kartında karar formu
  - Değer: 4
  - Bütçe: 300000
  - Etki: etki/etki-karar.html
  - Onay: evet
  - Ne: `panel/ciz.mjs`. `etkiHtml(etki, { gecmisAcik = false, izleyici = false } = {})`; `izleyici` `etkiKart`'a geçer. `etkiKart` sonuna (`.kroki`'den sonra, kart kapanmadan): `e.bitti` ise hiçbir şey; `e.onay` ise `<p class="karar-durum">onaylandı</p>` (form yok); aksi hâlde `<form class="karar" data-no="${no}">` içinde `<textarea name="metin" rows="2" maxlength="2000" placeholder="not (red ve yorumda zorunlu)"></textarea>`, üç düğme tam şu biçimde: `<button type="submit" name="tur" value="onay">Onayla</button>`, `value="red">Reddet</button>`, `value="yorum">Yorum</button>`, sonra `<p class="karar-durum">…</p>`. Durum satırı: `e.karar` yoksa boş; varsa `son karar: <tur> · <saat tr-TR SS:DD> · "<metin>"` (metin boşsa tırnaklı kısım yok, `esc` ile kaçışlı) ve ardından `— Claude aldı` (`e.alindi`), değilse `— Claude'a iletiliyor` (`izleyici`), değilse `— kuyrukta, Claude oturumu açılınca işlenir`. Başka dosya değişmez.
  - Kapı: `node panel/karar-ciz.test.mjs`
  - Kapı: `node panel/ciz.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 68. Panelde karar gönderimi
  - Değer: 4
  - Bütçe: 300000
  - Ne: `panel/index.html`. (1) Çizim: `etkiEl.innerHTML = etkiHtml(d.etki, { gecmisAcik, izleyici: d.kararIzleyici })`; bu satırdan hemen önce `etkiEl.querySelectorAll('form.karar textarea')` değerlerini formun `data-no`'suna göre bir nesneye sakla, hemen sonra aynı `data-no`'lu yeni textarea'lara geri yaz (odaktaki alanın odağını ve imleç yerini de geri ver), böylece SSE güncellemesi yazılan notu silmez. (2) `etkiEl.addEventListener('submit', async (e) => { ... })`: `e.target.closest('form.karar')` değilse çık; `e.preventDefault()`; `tur = e.submitter.value`, `no = Number(form.dataset.no)`, `metin = textarea.value`; formdaki düğmeler `disabled = true`, `.karar-durum`'a "gönderiliyor…"; `fetch('/api/karar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ no, tur, metin }) })`; yanıt `ok` ise textarea temizlenir, durum "gönderildi"; değilse yanıtın `.hata` alanı (JSON değilse HTTP kodu) `.karar-durum`'a hata sınıfıyla yazılır, not silinmez; ağ hatası `catch` ile "panel sunucusuna ulaşılamadı"; `finally` düğmeler `disabled = false`. (3) CSS: `form.karar { … }` (textarea tam genişlik, düğmeler yan yana, dar ekranda sarar) ve `.karar-durum { … }` (küçük, soluk; hata için ayrı renk sınıfı, mevcut değişkenlerle). Başka dosya değişmez.
  - Kapı: `node panel/karar-ui.test.mjs`
  - Kapı: `node panel/arayuz.test.mjs etki`
  - Kapı: `bash test/hepsi.sh`

- [x] 69. Claude tarafı: kararı izle ve işle
  - Yürütücü: claude
  - Ne: `CLAUDE.md`'ye "Panelden karar" bölümü: Etki taslağı onay bekleyen bir adım varken Claude `node karar-bekle.mjs` komutunu Monitor ile başlatır (`timeout_ms` en çok 30 dk; süre dolunca yeniden kurar, arada kart "kuyrukta" görünür ve karar kaybolmaz); oturum başında önce `node karar-bekle.mjs --bir-kez` ile kuyrukta kalanları alır. Gelen satıra göre: `onay` → adımın altına `- Onay: evet` yaz, commit et, `./mdk-adim.sh <no>`; `red` → nota göre etki taslağını düzelt, kullanıcıya tek satır bildir (panel kartı yenilenir); `yorum` → soruysa yanıtla, istekse taslağı düzelt; onaylamaz. `ba-pm-bakis` §4'e "karar panelden gelir" notu. Uçtan uca deneme: geçici bir taslaklı adımla panelden red ve onay gönder, Monitor bildirimini ve kart durumunu (kuyrukta → iletiliyor → Claude aldı) Firefox ekran görüntüsüyle doğrula; geçici adımı sil.
  - Kapı: `grep -q '^## Panelden karar' CLAUDE.md`
  - Kapı: `bash test/hepsi.sh`

### Faz 10: MDK, yürütücü performansı ve maliyeti (2026-10-28)
Problem ve hipotez: Ücretsiz yürütücülerde sürenin %81'i başarısız denemelerde geçiyor (adım 63-68: koşu başına ~13 istek, bağlamı şişiren komut çıktıları, plan çelişkisinde zincirin 5 modeli boşuna denemesi). OpenRouter'da kısıt token değil istek (50/gün, tüm ücretsiz modellerde ortak). Hipotez: Claude'un plan yazarken zaten okuduğu bağlamı adıma koymak ve modelin araç döngüsünü kısaltmak (L1 editör modu, L2 bağlam paketi, L3 sessiz kapı, L4 sade agent, L5 hızlı bırakma) kaliteyi düşürmeden istek ve süreyi azaltır.
Başarı ölçütü: aynı geçmiş adımlarda (63, 64, 66, 67 ve bir dbeaver-mm K) taban yola göre istek sayısı ve etkin token en az yarıya iner, geçme oranı düşmez, Claude diff incelemesi plana uyumlu der. Ölçümler panelde Model × adım matrisinde (deney satırları, hücrede token ve istek) görünür.
Kullanıcı kararları (2026-10-28): proje adı her yerde MDK (yapıldı; depo miracmenekse/mdk). Push öncesi token'sız statik regresyon (tüm kapılar); Claude çıktıyı okur, yeşilse push, kırmızıysa geri bildirimle geliştiren modele düzeltme. Süre tavanı net ve kısa, ama arkada çalışan bir süreci (derleme, test) kesmez. Sağlayıcılar (OpenCode, OpenRouter) ayrı; aynı anda birden çok model farklı süreçlerde kullanılabilir; boş model yoksa kullanıcıdan onay alınıp haiku.

- [x] 70. Metrikte istek sayısı ve deney etiketi
  - Değer: 4
  - Bütçe: 300000
  - Ne: `mdk-adim.sh`. (1) `topla` dördüncü değer olarak `step_finish` olay sayısını (istek) döner; okuyan iki `read -r` satırı buna uyarlanır. (2) Metrik ve durum dosyası yolu ortamdan: `METRIK=${MDK_METRIK:-metrikler.jsonl}`, `DURUM=${MDK_DURUM:-durum.json}`; `yaz_metrik` ve `yaz_durum` bunlara yazar (deney koşusu worktree'den ana deponun dosyalarına yazabilsin, panel canlı görsün). (3) Metrik satırına `"istek":<sayı>` ve `"deney":` alanı: `MDK_DENEY` boş değilse JSON dizesi, boşsa `null`; `yaz_durum`'un yazdığı nesneye de `deney` (boşsa null). Değer JSON için kaçışlanır (node `JSON.stringify` ile). Başka davranış değişmez.
  - Kapı: `bash test/mdk-adim.test.sh deney temel`
  - Kapı: `bash test/hepsi.sh`

- [x] 71. Matriste token, istek ve deney satırları
  - Değer: 5
  - Bütçe: 300000
  - Ne: `panel/durum.mjs` `matris()`: satır anahtarı yürütücü + model + `deney` (yoksa ayrı satır değil; satır nesnesine `deney: s.deney ?? null`). Her hücreye `token` (hücredeki TÜM satırların `etkin ?? token ?? 0` toplamı) ve `istek` (satırlarda `istek` sayısı varsa toplamı, hiçbiri yoksa `null`). `panel/ciz.mjs` `matrisHtml`: satır adı deney varsa `model · deney` (kaçışlı); hücre metninde simgenin altında küçük `<small>` ile kısa token: 1000 ve üstü `tr-TR` tek ondalıklı `k` (42500 → `42,5k`), altı olduğu gibi; `title` sonuna `· <token tr-TR> token` ve istek biliniyorsa `· <n> istek`. Lejant'a "alttaki sayı = harcanan etkin token" eklenir. CSS: hücredeki `small` blok, küçük, soluk (mevcut değişkenler). Başka dosya değişmez.
  - Kapı: `node panel/matris-token.test.mjs`
  - Kapı: `node panel/matris.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 72. OpenCode v2'ye geçiş
  - Değer: 5
  - Bütçe: 400000
  - Ne: v1 (1.19.3) ücretsiz modelleri desteklemiyor (#59387); v2 2.2.0 `~/.local/opt/opencode-v2/node_modules/.bin/opencode` adresinde kurulu. (1) `mdk-adim.sh`: ikili `OC=${MDK_OPENCODE:-$HOME/.local/opt/opencode-v2/node_modules/.bin/opencode}` (testler `MDK_OPENCODE=opencode` ile sahte ikiliyi çağırır). Çağrı `setsid "$OC" run --standalone -m ... --title ... --format json --print-logs` (`--log-level` bayrağı kalkar; v2'de süzmüyor), ortamda `OPENCODE_LOG_LEVEL=error`. (2) İzin yapılandırması (`IZIN`, `MDK_SADE` dalı dahil): `"bash"` anahtarı yanında aynı kurallarla `"shell"` anahtarı (v2 adı) ve `"external_directory":"deny"` (v2'de varsayılan allow). (3) `topla`: v2'de `tokens.total` yok; token = `total` varsa o, yoksa `input+output+reasoning+cache.read+cache.write`; etkin = token − cache.read; istek = `max(step_start sayısı, step_finish sayısı)` (v2'de son adımın step_finish'i gelmez). (4) Kota: "Free usage limit" metni stderr log'unda YA DA stdout jsonl'ında (v2 `{"type":"error",...}` olayı) görülürse neden=kota. (5) `panel/telemetri.mjs`: veritabanında `session_v2` ve `session_message` tabloları varsa onlardan oku (session_v2.directory ile proje süzgeci, alt dizin dahil; `type='assistant'` satırlarının `data`'sında `model.{providerID,id}` → `providerID/id`, `tokens`, `time.created/completed`, `cost`; bozuk JSON atlanır); o zaman v1 `message` tablosu okunmaz. v2 tabloları yoksa eski yol aynen. Döndürülen nesnenin biçimi değişmez. `persona-tur.sh` bu adımda değişmez (Claude uyarlar).
  - Kapı: `bash test/mdk-adim.test.sh v2 v1_token v2_kota temel kota deney`
  - Kapı: `node panel/telemetri-v2.test.mjs`
  - Kapı: `bash test/hepsi.sh`

Sonraki adımlar (kapıları sırası gelince yazılır; ölçüm sırası L1 önce, çünkü en az istek harcar):
- 73. Deney koşturucu `deney.sh <proje> <adım> <varyant>`: adımın commit'inden önceki duruma worktree, varyantla koşu (`MDK_DENEY`, `MDK_METRIK`/`MDK_DURUM` ana depoya), sonuç diff'i Claude incelemesine saklanır.
- 74. L5 hızlı bırakma: SORUN.md / plan çelişkisi zinciri durdurur (çıkış 7, Claude'a döner); stderr/jsonl hataları sınıflanır (`kota`, `model_yok`, `hiz_siniri`), mesaj metriğe yazılır; panel "şu an" kartında son eylem, son hata, zincir özeti.
- 75. Süre tavanı: olay gelmezse ve opencode'un çocuk süreci (derleme/test) yoksa 120 sn'de kes; toplam tavan 15 dk, dolarken çocuk süreç çalışıyorsa bitmesini bekle (en çok +5 dk); panelde geri sayım.
- 76. L3 sessiz kapı + L4 sade agent (özel agent, kısa istem, yalnız read/edit/bash/grep); taban ile karşılaştırma.
- 77. L1 editör modu: araçsız tek istek, ara/değiştir blokları, betik uygular, kapı; kalırsa kapı özetiyle bir tekrar.
- 78. Model havuzu: model başına kilit (aynı model iki süreçte değil), boş model yoksa çıkış 8 → Claude kullanıcıdan haiku onayı ister. (2026-10-29: OpenRouter kalktı, sayaç düştü; kilit 84'te.)
- 79. Push öncesi regresyon: `mdk-push.sh` tüm kapıları (dbeaver-mm'de `kapi/hepsi.sh` + değişen plugin testleri) koşar, özet dosyası yazar; Claude okur: yeşil → push; kırmızı → düşen kapı çıktısıyla geliştiren modele düzeltme adımı.
- 80. Plan alanı `- Değişen davranış:`: emekliye ayrılan kapılar burada; yazılmayan her eski kapı geçmek zorunda.

## Karar notu: görev türüne göre model (2026-10-29)
Kullanıcı kararı: OpenCode Go alındı; yalnız OpenCode (`opencode-go/*`) kullanılır. OpenRouter kaldırıldı (78'deki OpenRouter sayacı düşer), GitHub şimdilik kapalı. Paralel yapılabilen işler ayrı oturumlarda koşar.
Kaynak: OpenRouter `GET /api/v1/benchmarks` (as_of 2026-10-29): AA intelligence/coding/agentic, GPQA, tau-bench airline, Design Arena Elo (website+uicomponent+dataviz). Maliyet: OpenRouter $/1M (3 girdi : 1 çıktı). `iceman-contributor-free` veride yok.
Ölçüt: ağırlıklı fayda (0-1, ağırlığın yarısından azına verisi olan elenir). Zor: fayda − 0,05·log2(fiyat/medyan 0,9$). Orta: aynı, ceza 0,15. Kolay: faydası ≥0,5 olan en ucuz.

| Görev | Zorluk | 1. model | Yedek |
|---|---|---|---|
| Kod yazma | orta | glm-5.3-flash | glm-5.3 |
| Tasarım (UI, kroki) | orta | glm-5.3-flash | mimo-v2.6-pro |
| Persona | kolay | gpt-6-luna (ölçüldü: adım 36 sorusu 3/3 geçerli, ~9k token/kart, 14 sn) | beam-free |
| Kapı (test) yazma | zor | gemini-4-argon | gpt-5.6-luna |
| Kod inceleme | zor | gemini-4-argon | gpt-5.6-luna |
| Eskale / zor hata | zor | qwen3.8-max | glm-5.3 |
| Mekanik küçük iş | kolay | mimo-v2.6-flash | claude-haiku-5-5 |
| Görsel doğrulama (görüntü girdisi şart) | orta | claude-haiku-5-5 | glm-5.3-flash |
| Kısa araştırma | orta | glm-5.3-flash | claude-haiku-5-5 |
| Derin araştırma | zor | Gemini Deep Research (kullanıcı elle, Google AI Pro) | gemini-4-argon |
| Belge yazımı | orta | claude-haiku-5-5 | qwen3.7-plus |
| Log/metrik özeti | kolay | claude-haiku-5-5 | minimax-m3 |

- Çalıştırma yeri (kullanıcı kararı): `claude-*` modeller OpenCode'dan değil Claude hesabından (Claude Code alt ajanı, ör. `kodcu` = haiku) çalışır; diğerleri `opencode-go/*`. Haiku satırları (persona, görsel doğrulama, belge, log özeti) böylece Go limitini yemez, Claude hesabının limitini yer. Persona için eski kural ("Claude alt ajanı kullanılmaz", 2026-10-27) bu kararla değişir.
- Google AI Pro OpenCode'a bağlanamaz (Haziran 2026'dan beri kişisel hesap OAuth'u kapalı, 3. taraf kullanım kural dışı); yalnız Gemini uygulaması/NotebookLM'de elle. Derin araştırmada Claude soruyu hazırlar, kullanıcı Deep Research'te koşar, raporu verir; Claude özeti `arastirma/arastirma.json`'a işler. Kısa araştırma (tek soru, birkaç kaynak) Go modeliyle.
- Bunlar benchmark puanı, bizim işte ölçülmedi: 73 (deney koşturucu) ile her görevde 1. model yedeğe karşı denenir. Gemini-4-argon görev başına pahalı (tau 0,50$): Go limitini hızlı yerse yedeğe geç. Gemini-4-argon'un kod endeksi yok (kapı puanı yalnız GPQA+zekâ). mimo-v2.6-flash'ın mekanik puanı yalnız tau-bench'e dayanır.
- Yoklama (2026-10-29, `opencode-go/<model>` tek istek): listedeki tüm modeller yanıt verdi. Elenen: `muse-spark-*-contributor` (istek verisiyle eğitir; workspace Privacy'de izin ister, özel kod için açılmaz), `mimo-v2.5-pro` (kullanımdan kalktı → mimo-v2.6-pro). Kapı ve inceleme yedeği, kodu yazan glm'den bağımsız olsun diye gpt-5.6-luna.

### Faz 11: görev türüne göre model ve paralel oturum (2026-10-29)
Problem ve hipotez: tek `Modeller:` zinciri her işe aynı modelleri sırayla deniyor; kapıyı ve incelemeyi kodu yazanla aynı model ailesi yapabiliyor, işler sırayla koştuğu için bekleme uzun. Hipotez: görev türüne göre model (karar notu "görev türüne göre model") ve bağımsız adımların paralel koşması, ilk denemede geçme oranını düşürmeden adım başına süreyi ve Claude token'ını azaltır.
Başarı ölçütü: Faz 11 sonrası 5 adımlık bir dilimde (a) ilk denemede geçme ≥ Faz 9-10 ortalaması, (b) iki bağımsız adım paralel koşunca toplam süre sıralıdan ≥%30 kısa, (c) her adımın metriğinde `gorev` alanı dolu.
Akış: Claude adıma `- Görev: <tür>` yazar (yoksa `kod`); `./mdk-adim.sh <no>` o türün modellerini dener. Paralel: `./mdk-paralel.sh <no> <no>...`. Hata/boş durum: tanımsız tür → çıkış 4 ve geçerli türlerin listesi; kilitli model → sıradaki.
Riskler: Go kullanım sınırı yayımlanmamış (paralel koşu çabuk tüketebilir; 74'teki `kota` sınıflaması burada da geçerli). gemini-4-argon pahalı; kapı/incelemede yedeğe düşme oranı izlenmeli. Çalıştırıcıya dokunan adımlar `kodcu`nun (beceri kuralı).

- [x] 81. Görev satırları ve Modeller temizliği
  - Yürütücü: claude
  - Ne: PLAN.md başında `Modeller:` → `opencode-go/glm-5.3-flash, opencode-go/glm-5.3` (eski free/OpenRouter/cursor adları çıkar). Altına her tür için bir satır, karar notundaki tablodan (yalnız Go modelleri; `claude-*` satırı yazılmaz, o türler Claude alt ajanında): `Görev kod: opencode-go/glm-5.3-flash, opencode-go/glm-5.3, opencode-go/deepseek-v4.1-flash` (deepseek: Faz 6'da 9/9 ilk denemede, ölçülmüş yedek), `Görev tasarim: …`, `Görev persona: opencode-go/gpt-6-luna, opencode-go/beam-free`, `Görev kapi: opencode-go/gemini-4-argon, opencode-go/gpt-5.6-luna`, `Görev inceleme: …`, `Görev eskale: opencode-go/qwen3.8-max, opencode-go/glm-5.3`, `Görev mekanik: opencode-go/mimo-v2.6-flash`, `Görev arastirma: opencode-go/glm-5.3-flash`. demo-akis/PLAN.md ve dbeaver-mm `Modeller:` satırları aynı biçime (dbeaver-mm kendi commit akışıyla: doğrudan main). Sonra `test/hepsi.sh` yeşil olmalı (mdk-adim HEAD'de yeşil ister). `opencode-go/` önekiyle bir gerçek `mdk-adim` duman koşusu: önek `yurm`/kota sınıflamasını bozmuyor mu.
  - Kapı: `! grep -nE '^Modeller:.*(openrouter|-free|cursor/)' PLAN.md && grep -cE '^Görev [a-z]+: opencode-go/' PLAN.md | grep -qx 8`

- [x] 82. mdk-adim: adımın görev türüne göre model zinciri
  - Yürütücü: kodcu
  - Ne: `mdk-adim.sh`. Adım bloğunda `- Görev: <tür>` (yoksa `kod`). Model listesi önceliği: adımda `- Modeller:` > dosyada `Görev <tür>:` > `Modeller:`. Tür için satır yoksa ve tür `kod` değilse çıkış 4, mesajda PLAN'daki türler. Metrik satırına `"gorev":"<tür>"`. `ONCE` aynen çalışır. Cursor ve OpenRouter'a özgü dallar silinmez (ölü ama zararsız).
  - Kapı: `bash test/mdk-adim.test.sh gorev` (Claude yazar: tür satırı seçilir; adım `Modeller:`'i öne geçer; tanımsız tür çıkış 4 + liste; tür yoksa kod; metrikte gorev)

- [x] 83. persona-tur: varsayılan model `Görev persona:`
  - Yürütücü: kodcu
  - Ne: `persona-tur.sh`: `PERSONA_MODELLER` yoksa PLAN'daki `Görev persona:` satırı, o da yoksa `Modeller:`.
  - Kapı: `bash test/persona-gorev.test.sh` (Claude yazar; persona-tur.test.sh vaka süzmediği için ayrı dosya)

- [x] 84. Model kilidi
  - Yürütücü: kodcu
  - Ne: `mdk-adim.sh`: bir modeli denemeden önce `~/.cache/mdk/kilit/<model>` üzerinde `flock -n`; kilitliyse `neden: kilitli` ile sıradakine (deneme sayılmaz, metriğe yazılmaz). Tüm modeller kilitliyse 30 sn bekle, en çok 10 dk, sonra çıkış 8. Kilit süreç ölünce kendiliğinden bırakılır (flock fd); dosya adında `/` → `_`. Test için ortam: `MDK_KILIT` (kilit dizini, varsayılan `~/.cache/mdk/kilit`), `MDK_KILIT_BEKLE` (sn, varsayılan 30), `MDK_KILIT_TAVAN` (sn, varsayılan 600). Ayrıca `MDK_PLAN_DOKUNMA=1` ise geçen adımda PLAN.md'deki `[x]` işaretlenmez (paralel koşuda bitişik satır çakışmasın; işaretlemeyi 85 ana dalda yapar).
  - Kapı: `bash test/mdk-adim.test.sh kilit_bekle kilit_ikinci kilit_tavan plan_dokunma` (iki koşu aynı tek modelle: ikincisi bekler; iki modelle: ikinci koşu ikinci modeli alır)

- [ ] 85. Paralel koşturucu
  - Yürütücü: opencode
  - Görev: kod
  - Ne: Yeni `mdk-paralel.sh <no> <no>...`: her adım için `git worktree add ../.mdk-wt/<proje>-<no> -b mdk/<no>`; içinde `MDK_PLAN_DOKUNMA=1 mdk-adim.sh <no>` (`MDK_METRIK`/`MDK_DURUM` ana depoya; `durum.json`'da son yazan kazanır, panelde adımlar arasında gidip gelebilir, kabul); hepsi bitince geçenleri numara sırasıyla ana dala `git cherry-pick`, ardından ana dalda `[x]` işaretle ve commit; çakışmada durur, `--abort`, o adımı ve dalı raporlar (çıkış 9), diğerleri işlenmiş kalır. Biten worktree silinir, dal kalır. Özet tablo (her adım bir satır, `| <no> | <model> | <sonuç> | <sn> |`). `mdk-adim.sh` bu betiğin kendi dizininden çağrılır (worktree'deki kopyadan değil). Çıkış: 0 hepsi işlendi | 2 en az bir adım geçmedi (geçenler yine işlenir) | 9 çakışma | 4 argüman yok ya da ağaç kirli. Ortam (`MDK_KILIT*`, `POLL`, `DENEME`, `SURE`, `PATH`) alt koşulara aynen geçer.
  - Kapı: `bash test/mdk-paralel.test.sh`

- [ ] 86. Go modeliyle inceleme
  - Yürütücü: opencode
  - Görev: kod
  - Ne: Yeni `mdk-incele.sh <no>`: adım metni + o adımın commit diff'i (mdk-adim commit konusu `adım <no>: …`; `git log --grep "^adım <no>:"` bulamazsa çıkış 4, HEAD'e düşmez) `Görev inceleme:` modeline plan ajanıyla (salt okunur) verilir; istenen çıktı ilk satırda `UYUM: <0-100>` + en çok 5 madde (model çağrısı `opencode run --format json -m <model> --agent plan <istem>`, yanıt v2 `text` olaylarından). Sonuç `node mdk-kayit.mjs <no> --inceleme uyumlu|kismen|uyumsuz --not "UYUM <n>: <maddeler>"` ile yazılır (≥80 uyumlu, 50-79 kismen, <50 uyumsuz); `UYUM: <n>` satırı stdout'a da basılır; çıktı biçimi bozuksa yedek model, o da bozuksa çıkış 2. Claude yalnız uyum < 80 ise diff'i kendisi okur.
  - Kapı: `bash test/mdk-incele.test.sh`

- [ ] 87. Kurallar ve belgeler
  - Yürütücü: claude
  - Ne: `CLAUDE.md` (mdk) ve global `~/.claude/CLAUDE.md` "Görev dağıtımı": OpenCode Go, `- Görev:` alanı, `mdk-paralel.sh`, `mdk-incele.sh`; `claude-*` türler (görsel doğrulama, belge, log özeti) Claude alt ajanında; derin araştırma Gemini Deep Research (kullanıcı elle). `ba-pm-bakis` SKILL.md: persona OpenCode'da `Görev persona:` modeliyle ("ücretsiz model" ifadesi düzeltilir).
  - Kapı: `grep -q 'Görev persona' ~/.claude/skills/ba-pm-bakis/SKILL.md && grep -q 'mdk-paralel' CLAUDE.md && ! grep -q 'ücretsiz modelle' ~/.claude/skills/ba-pm-bakis/SKILL.md`

- [ ] 88. Gerçek deneme ve ölçüm
  - Yürütücü: claude
  - Ne: Claude, ayrı dosyalara dokunan iki küçük Go adımı tam yazar (Ne + Kapı; 73-80 tek satırlık taslak, 74 ve 75 çalıştırıcıya dokunduğu için kodcu'nun, uygun değil) ve `mdk-paralel.sh` ile koşar; her birini `mdk-incele.sh` ile incele. 85 ve 86'nın kendi metrikleri de (a) ölçütüne girer. Başarı ölçütünü (a-c) metriklerden hesapla, karar notunun altına yaz; görev tablosunda ölçülen satırları "ölçüldü" diye işaretle.
  - Kapı: `grep -q 'Faz 11 ölçümü' PLAN.md`

Sonraya bırakılan: panelde görev rozeti ve model tablosunda görev sütunu (metrikte `gorev` alanı 82'de birikir; veri 5+ adıma ulaşınca etki taslağıyla açılır).

## Sonraki iyileştirmeler
- Kapıları (testleri) belirleme biçimini iyileştir: şu an adım başına dar, tek komut. Hedef: yapılan geliştirmeyi kapsayan (başarı/hata/sınır durumu, kullanıcı senaryosu) net kapılar.
- Personalar (2026-10-27, adım 31-39 ve 58): `personalar.md` v2 üç alan, `persona-tur.sh` ile OpenCode'da ücretsiz modelle çalışıyor. Üç alan da gerçek kararla denendi (adım 36-38, 60-61); sessiz model 60 sn sonra atlanır (adım 59, `PERSONA_ILK`).
- Gözlem: adım 7 yaklaşık 730 bin token harcadı (diğerleri 40-140 bin); adım başına token bütçesi ve dar adım kuralı düşünülebilir.
