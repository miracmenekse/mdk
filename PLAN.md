# opencode-akis

Amaç: Claude planlar, OpenCode (ücretsiz modellerle) geliştirir; kalite kapıdan geçerek garanti edilir.
Bu plan bu aracın kendi canlı kontrol panelini ve etki görünümünü yapar.

Yürütücü: opencode
Modeller: opencode/deepseek-v4.1-flash-free, opencode/beam-free, opencode/nemotron-3-ultra-free, opencode/space-bunny-free, opencode/glm-5.3-flash-free, opencode/longcat-2.5-preview-free

Bütçe: 1000000

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
  - Ne: `op-adim.sh`: bir adımda birden fazla `- Kapı: \`...\`` satırı olabilir. Hepsi sırayla çalışır, ilk başarısız olanda durur ve o kapının çıktısı `$log.kapi` dosyasına yazılır; hepsi 0 verirse adım geçer. Şu an `grep -m1` yalnızca ilkini alıyor. Hiç Kapı satırı yoksa mevcut davranış kalır (çıkış 4). Betikteki donmuş kopya ve kurcalama kontrolü bloklarına dokunma.
  - Kapı: `bash test/op-adim.test.sh temel coklu`

- [x] 10. Taslak onayı zorunluluğu
  - Yürütücü: kodcu
  - Ne: `op-adim.sh`: adım bloğunda `- Etki:` satırı varsa ve `- Onay: evet` satırı yoksa, opencode'u HİÇ çağırmadan `adım N taslak onayı bekliyor: PLAN.md'ye "- Onay: evet" ekle` yazıp çıkış kodu 5 ile çık. Kontrol, git ağacı kontrollerinden sonra, deneme döngüsünden önce yapılır.
  - Kapı: `bash test/op-adim.test.sh temel coklu onay`

- [x] 11. Süreç grubu, süre sınırı ve başarısızlık nedeni
  - Yürütücü: kodcu
  - Ne: `op-adim.sh`: `timeout` yerine `opencode run` komutunu `setsid ... </dev/null >"$log" 2>"$log.err" &` ile arka planda başlat, `pid=$!` al. Her `POLL` saniyede (ortam değişkeni, varsayılan 3) `kill -0 $pid` ile kontrol et; `SURE` saniyeyi aşarsa süreç grubunu öldür: `kill -TERM -- -$pid`, 2 sn sonra `kill -KILL -- -$pid`. Süreç bitince `wait $pid` yap; bitişte grupta (`pgrep -g $pid`) yetim süreç kalmadığından emin ol, kalmışsa KILL. Metrik satırına `neden` alanı ekle: başarılıysa `null`; değilse `"sure"` (süre aşımı), `"kurcalama"` ya da `"kapi"` (öncelik bu sırada). Başarısızlık mesajına nedeni yaz. Ayrıca sağlayıcı sessizliği: `ILK` (ortam değişkeni, varsayılan 90) saniye içinde günlüğe (`$log`) hiç olay yazılmazsa (dosya boş) süreç grubunu aynı şekilde öldür, `neden` = `"yanit_yok"`, o modelin kalan denemelerini atla ve sıradaki modele geç (sessiz modeli yeniden denemek boşuna; ücretsiz kota dolunca OpenCode çıkmadan sessizce bekliyor). Tüm modeller `yanit_yok` ile biterse çıkış kodu 6 (eskale 2 değil), durum `"saglayici"`, mesaj "sağlayıcı yanıt vermiyor". Başlık satırındaki çıkış kodu açıklamasına 6'yı ekle.
  - Kapı: `bash test/op-adim.test.sh temel coklu onay neden sure yanit_yok`

- [x] 12. Token bütçesi
  - Yürütücü: kodcu
  - Ne: `op-adim.sh`: adım bloğunda `- Bütçe: N` (token) ya da dosyanın başında `Bütçe: N` satırı varsa (adım satırı önceliklidir), bekleme döngüsünde her turda günlükteki `step_finish` olaylarının `part.tokens.total` toplamını (mevcut `topla` fonksiyonu) hesapla; N'yi aşarsa süreç grubunu aynı şekilde öldür ve `neden` alanına `"butce"` yaz. Bütçe yoksa kontrol yapma. Kontrol adım sınırında olduğundan tek adım bütçeyi biraz aşabilir; bunu betikte `# ponytail:` yorumuyla not et.
  - Kapı: `bash test/op-adim.test.sh temel coklu onay neden sure yanit_yok butce butce_ok`

- [x] 13. SORUN.md ve model sırası
  - Yürütücü: kodcu
  - Ne: `op-adim.sh`: (1) Deneme bitince depo kökünde `SORUN.md` varsa onu `.op-log/sorun-N-<epoch>.md` olarak kopyala, kapı geçse bile denemeyi başarısız say (`neden: "sorun"`), bir sonraki denemenin `ipucu`na `SORUN.md` içeriğini ekle, sonra mevcut geri alma akışı (reset + clean) çalışsın. (2) `ONCE=<model>` ortam değişkeni verilirse ve model `Modeller` listesindeyse onu listenin başına al; listede yoksa yok say.
  - Kapı: `bash test/op-adim.test.sh temel coklu onay neden sure yanit_yok butce butce_ok sorun once`

## Veri ve araçlar
Not (2026-10-17): ücretsiz kota hâlâ dolu (3 modelde 45 sn sessizlik); adım 14-20 `kodcu` ile yapılır, parti C öncesi kota yeniden yoklanır. Kapı testleri her adımın başında `kodcu` tarafından verilen dosyalardan depoya kopyalanır.
- [x] 14. Ayrıştırıcıda çoklu kapı, bütçe ve onay
  - Ne: `panel/plan.mjs` `parse`: adım nesnesine `kapilar` (tüm `- Kapı:` komutları, dizi), `butce` (sayı ya da `null`) ve `onay` (`- Onay: evet` ile başlayan satır varsa `true`) ekle; `kapi` = `kapilar[0] ?? null` olarak kalır. `ayarlar`'a `butce` (dosya başındaki `Bütçe:` satırı, yoksa `null`) ekle.
  - Kapı: `node panel/plan.test.mjs`
  - Kapı: `bash test/hepsi.sh`

- [x] 15. Kayıt aracı (kodcu satırları ve inceleme sonucu)
  - Ne: Proje kökünde `op-kayit.mjs`. Kullanım 1: `node op-kayit.mjs <adım> --yurutucu kodcu|claude|opencode --model <ad> --gecti true|false [--sure <sn>] [--token <n>] [--deneme <n>] [--neden <metin>] [--dizin <d>]` → `<dizin>/metrikler.jsonl` dosyasına `{ts, adim, yurutucu, model, deneme (varsayılan 1), gecti, sure_sn, token, maliyet: 0, neden}` satırı ekler. Kullanım 2: `node op-kayit.mjs <adım> --inceleme uyumlu|kismen|uyumsuz [--not "<metin>"] [--dizin <d>]` → `{tur: "inceleme", ts, adim, inceleme, not}` ekler. Eksik ya da geçersiz değerde kullanımı stderr'e yazıp çıkış 2 ile dur (dosyaya yazma). Varsayılan dizin `.`. Yalnızca Node yerleşik modülleri.
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
  - Ne: `op-panel.sh start|stop|durum [dizin] [port]` (dizin varsayılan `.`, port 4747). `start`: `setsid nohup node <bu betiğin dizini>/panel/sunucu.mjs <dizin> <port> >"<dizin>/.op-log/panel.log" 2>&1 &` ile başlat, pid'i `<dizin>/.op-log/panel.pid` dosyasına yaz; pid dosyasındaki süreç yaşıyorsa "zaten çalışıyor" yaz, çıkış 0. `stop`: pid'e `kill`, pid dosyasını sil; yoksa "çalışmıyor", çıkış 0. `durum`: çalışıyorsa `çalışıyor pid=<n> http://127.0.0.1:<port>` yazıp 0, değilse `çalışmıyor` yazıp 1. `pkill -f` KULLANMA.
  - Kapı: `bash test/op-panel.test.sh`
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
  - Ne: `op-kayit.mjs`: çalıştırma kaydı (`--yurutucu ... --gecti ...`) yazıldığında `<dizin>/durum.json` da yazılır: `{ adim, baslik, model, deneme, durum, ts: Date.now() }`; `durum` = `gecti` (gecti true) ya da `eskale` (gecti false); `baslik` `<dizin>/PLAN.md` içindeki `- [ ] N. Başlık` ya da `- [x] N. Başlık` satırından alınır, PLAN.md ya da satır yoksa `null`. `--inceleme` kaydı `durum.json`'a dokunmaz. Hatalı kullanımda (çıkış 2) hiçbir dosya yazılmaz.
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
  - Ne: Her partiden sonra Claude diff'i plana karşı inceler, sonucu `node op-kayit.mjs <adım> --inceleme ...` ile kaydeder; eskale olan adımı `kodcu`'ya verir ve sonucunu `op-kayit.mjs --yurutucu kodcu` ile kaydeder; bazı adımlarda `ONCE=` ile 2. ve 3. model denenir.
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

- [ ] 36. Canlı deneme 1: UI ve akış kararı
  - Yürütücü: claude
  - Ne: Proje `CLAUDE.md`'deki iki panel eksiğinden biri (model tablosu `yanit_yok`'u model hatası sayıyor; adım satırı planın yürütücüsünü yazıyor, gerçekte işi yapanı değil) için `proje-gelistirme` paketiyle karar al: önce ekseni sor, 3 kart, tek tablo, öneri. Önce eşiği kontrol et: karar `ba-pm-bakis`in "küçük kararda alt ajan kullanma" kuralına göre alt ajanı hak etmiyorsa diğer eksiği seç. Alt ajanlar `sonnet` ile, toplam ≤60k token. PLAN.md'ye `## Karar notu: Persona denemesi 1` yaz (eksenler `;` ile, seçenek tablosu, `Harcanan token: Nk`, `Sonuç: doğrulandı|çürüdü` satırı; ölçüt: ≥2 eksen), günlüğe satır ekle, `proje-gelistirme` `Durum: denendi` yap. Sonuç `çürüdü` çıkarsa dur ve kullanıcıya "az kart" yolunu sor.
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `grep -q 'Durum: denendi' personalar.md`
  - Kapı: `test "$(grep -c '^| 2026-' personalar.md)" -ge 2`
  - Kapı: `grep -Eq '^Sonuç: (doğrulandı|çürüdü)' PLAN.md`
  - Kapı: `grep -Eq 'Harcanan token: [0-9]+k' PLAN.md`

### Faz 2: kapı ve plan bölme
Faz 2'nin kapsamı adım 36'nın sonucuna bağlıdır; 36 `çürüdü` çıkarsa 37-38 yeniden planlanır.

- [ ] 37. Kapı yazımı: geçmişe karşı deneme
  - Yürütücü: claude
  - Ne: "Kapıyı kandıran yürütücü" kartını üç geçmiş kapıya uygula: adım 8 (`test -f ... && test -f ...`), adım 25 (`grep -q ... && grep -q ...`), adım 23 (kapı testindeki hatalı beklenti). Her kapı için kart, "boş ya da taslak dosyayla bu kapı geçer mi?" sorusunu yanıtlar ve bir güçlendirme önerir; Claude gerçek boşluk olup olmadığını kendi okumasıyla doğrular. `## Karar notu: Persona denemesi 2` altında kapı başına satır tablosu; `Boşluk bulunan kapı: N/3`; `Sonuç: doğrulandı` ölçütü ≥2/3. Günlüğe satır ekle. ≤60k token. Çıkan kural `ba-pm-bakis`in "Kapılar" bölümüne eklenecek biçimde bir cümleye indirilir (kodda değişiklik bu adımda yok).
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `grep -Eq 'Boşluk bulunan kapı: [0-3]/3' PLAN.md`
  - Kapı: `test "$(grep -c '^Sonuç: ' PLAN.md)" -ge 2`

- [ ] 38. Plan bölme: geçmişe karşı deneme
  - Yürütücü: claude
  - Ne: Metriklerde sorunlu üç adımı karşılaştır: adım 9 (6 deneme), adım 7 (~730k token), adım 22 (3 deneme). "Bakımı yapacak geliştirici" kartının sorusuyla ("bu en ucuz hangi yolla doğru çalışır, tek başına yenebilir mi?") bu adımların bölünüp bölünmeyeceğine ve bir bölme ölçütüne (örn. adım başına dosya sayısı, kapı sayısı, bütçe) karar ver; ölçütü `metrikler.jsonl`'daki diğer adımlara uygulayıp yanlış alarm sayısını yaz. `## Karar notu: Persona denemesi 3`; `Sonuç: doğrulandı|çürüdü`. Ölçüt `kapi-denetle.mjs`e UYARI kuralı olacaksa bunun için ayrı, kapılı bir adım açılır (bu adımda kod yok).
  - Kapı: `node persona-denetle.mjs`
  - Kapı: `test "$(grep -c '^Sonuç: ' PLAN.md)" -ge 3`
  - Kapı: `grep -q '^## Karar notu: Persona denemesi 3' PLAN.md`

- [ ] 39. Belgeler ve bellek
  - Yürütücü: claude
  - Ne: `~/.claude/skills/ba-pm-bakis/SKILL.md`: iş türüne göre alan seçimi, seçim kuralı, `persona-denetle.mjs` çağrısı, Faz 2 sonuçlarından kapı ve plan bölme kuralı. Proje `CLAUDE.md`: "9'dan devam eden numarayla" notunu "son adım numarasından devam" yap, durum bölümüne personalar v2'yi ekle. PLAN.md "Sonraki iyileştirmeler" altındaki persona maddesini güncelle. Bellek: `opencode-akis-kapi-iyilestirme` ve `opencode-akis-durum` notlarını güncelle; sunum ve araştırma alanları ilk gerçek kullanımda `denendi` olacak diye not düş.
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

## Karar notu: Persona denemesi 1 (adım 36, 1. tur; yarım, kullanıcı kararı bekliyor)
Karar: adım satırı planlanan yürütücüyü yazıyor, gerçekte işi yapanı değil (adım 9: opencode 6 kez kaldı, kodcu geçti; 22: 3 başarısız sonra kodcu; 40: 1 başarısız sonra kodcu). `yanit_yok` sorunu adım 41'de zaten planlı olduğu için bu eksik seçildi. Kartlar: Dikkati dağınık kullanıcı, Bakımı yapacak geliştirici, Denetçi / güvenlik (karşı çıkan). Sonnet, araçsız.
Ayrışma eksenleri (seçim kuralı 3. madde, seçenek turundan önce):
- Dikkati dağınık kullanıcı: satır tek hüküm mü söylesin (gerçekte kim bitirdi), her denemenin dökümü mü; ayrıntı isteyene saklı.
- Bakımı yapacak geliştirici: tek `metrikler.jsonl` okumasıyla ucuza türetilen "son geçen yürütücü" mü, her satırda ayrı hesaplanıp test edilecek "deneme geçmişi" mi.
- Denetçi / güvenlik: planlanan yürütücüyü tek başına göstermek mi (gerçeği yansıtmaz, geri izlenemez), fiilî yürütücü ve deneme geçmişini satırda kayıtlı tutmak mı (izlenebilir, kalabalık).
Gözlem: üç eksen biçimsel olarak ayrı (yoğunluk, türetme maliyeti, izlenebilirlik) ama üçü de aynı yöne bakıyor: planlanan yerine fiilî yürütücü, ayrıntı açılır bölümde. Bu "güvenli taban"; gerçek karar noktası ayrıntının (başarısız deneme sayısı ve modeller) satırda rozetle mi, yalnızca açılır bölümde mi görüneceği.
Harcanan token (yalnızca 1. tur): 107k (3 alt ajan x ~35,8k; ajan başına sabit yük, görev metni birkaç yüz token). Onaylı sınır tur başına 60k idi; yalnızca bu tur sınırı aştı. Seçenek turu (2. tur) başlatılmadı.
Karar bekliyor: bu sabit yük yüzünden `general-purpose` alt ajan başına 60k sınırına yalnızca 1 ajan sığar; 3 kartlı bağımsız tur yaklaşık 107k tutar.

- [ ] 42. Adım geçmişinde güven: sessizlik ayrı, gerçek yürütücü
  - Problem ve hipotez: adım geçmişi (Adımlar bölümü) Modeller tablosunda düzelttiğimiz hatayı hâlâ taşıyor: kota sessizliği "✕ yanit_yok · 62 sn · 0 token" yazıyor, eksik süre/token 0 görünüyor, adım satırı işi kodcu yapmış olsa da planın `Yürütücü`'sünü (opencode) yazıyor. Hipotez: bunlar düzelirse "bu adımı kim yaptı, model gerçekten başarısız mı?" sorusu panelden doğru okunur. Başarı ölçütü: devralınan adımda "kodcu (plan: opencode)", sessiz denemeler başarısızlık gibi görünmez. UI'a dokunur ama yeni ekran yok: adım 41'in onaylı davranışının geçmiş görünümüne uzantısıdır (taslak yok).
  - Bütçe: 1000000
  - Ne: `panel/ciz.mjs` içinde (`panel/gecmis.mjs` ve `panel/durum.mjs` değişmez): (1) Adım satırındaki yürütücü: o adımın geçmişinde `gecti === true` olan ilk denemenin `yurutucu`'su işi yapandır; plandakinden farklıysa `<gerçek> (plan: <plandaki>)` yaz, aynıysa ya da geçmiş/geçen deneme yoksa plandakini yaz. (2) `ozetHtml`: `neden === 'yanit_yok'` denemeler "gerçek deneme" sayılmaz; gerçek deneme varsa mevcut özet ("N. denemede geçti" / "geçmedi (K deneme)", K yalnız gerçek denemeler) ve sessiz varsa " · N sessiz"; yalnız sessiz deneme varsa özet "sağlayıcı sessiz (N)". (3) `ayrintiHtml`: sessiz deneme satırı `<div class="deneme sessiz">` ve "<deneme>. <model> ○ sağlayıcı yanıt vermedi" (✕, süre ve token yok); diğer satırlarda `sure_sn`/`token` `null` ise "—" (0 değil): "— sn · — token". (4) `sorunluMu`: sessiz denemeler yok sayılır (yalnız sessiz deneme = sorunlu değil; gerçek deneme kuralları aynı). Tüm metin `esc` ile kaçışlanır; mevcut `gecmis-ui.test.mjs` geçmeye devam eder.
  - Kapı: `node panel/gecmis-guven.test.mjs`
  - Kapı: `node panel/gecmis-ui.test.mjs && node panel/guven.test.mjs && node panel/modeller-ui.test.mjs`
  - Kapı: `bash test/hepsi.sh`

## Sonraki iyileştirmeler
- Kapıları (testleri) belirleme biçimini iyileştir: şu an adım başına dar, tek komut. Hedef: yapılan geliştirmeyi kapsayan (başarı/hata/sınır durumu, kullanıcı senaryosu) net kapılar.
- Düşünme personalarını (fikir üreten alt ajanlar) net tanımla ve ayırt edilir tut; `personalar.md` ilk sürüm, deneyerek rafine edilecek.
- Gözlem: adım 7 yaklaşık 730 bin token harcadı (diğerleri 40-140 bin); adım başına token bütçesi ve dar adım kuralı düşünülebilir.
