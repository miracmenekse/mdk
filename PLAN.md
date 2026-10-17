# opencode-akis

Amaç: Claude planlar, OpenCode (ücretsiz modellerle) geliştirir; kalite kapıdan geçerek garanti edilir.
Bu plan bu aracın kendi canlı kontrol panelini ve etki görünümünü yapar.

Yürütücü: opencode
Modeller: opencode/glm-5.3-flash-free, opencode/deepseek-v4.1-flash-free, opencode/mimo-v2.6-flash-free

Kurallar (tüm adımlar için):
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

- [ ] 4. Arayüz
  - Ne: `panel/index.html` yaz, tek dosya, satır içi CSS/JS, açık/koyu temaya uyumlu (`prefers-color-scheme`), telefon genişliğinde taşmaz. Bölümler: `id="simdi"` ("şu an" kartı: adım, model, deneme, durum, geçen süre; `simdi` null ise "boşta"), `id="kategoriler"` (kategori başlıkları altında adımlar, durum rozetiyle: bitti / çalışıyor / bekliyor / eskale), `id="modeller"` (model tablosu: deneme, ilk denemede geçme %, token, maliyet, ortalama süre). `new EventSource('/olay')` ile canlı güncellenir; bağlantı kopunca "bağlantı yok" gösterir. Sade, okunaklı bir iç araç paneli görünümü hedefle.
  - Kapı: `node panel/arayuz.test.mjs`

## Etki görünümü
- [ ] 5. Etki taslağı örneği
  - Ne: `etki/ORNEK.html` yaz: gri tonlu, düşük çözünürlüklü "önce / sonra" kroki. İki `<svg>`: `id="once"` ve `id="sonra"`; sonrada değişen bölgeler `class="degisen"` ile renkli vurgulanır. Script yok, 6000 karakterden kısa. Bir örnek ekran seç (ör. basit bir rapor sayfasına filtre eklenmesi).
  - Kapı: `node etki/ornek.test.mjs`

- [ ] 6. Maliyet tahmini ve etki listesi
  - Ne: `panel/tahmin.mjs` → `export function tahmin(satirlar, adimSayisi)`: `gecti===true` satırların `token` ve `maliyet` medyanı × `adimSayisi` → `{ token, maliyet, guven }`; geçen satır <3 `'dusuk'`, 3-9 `'orta'`, 10+ `'yuksek'`; hiç yoksa `{ token: 0, maliyet: 0, guven: 'dusuk' }`. `panel/durum.mjs`'in `snapshot`'ında `etki`'yi doldur: bitmemiş ve `etki` alanı olan adımlar için `{ no, baslik, dosya, deger, tahmin: tahmin(metrikSatirlari, 1) }`.
  - Kapı: `node panel/etki.test.mjs && node panel/durum.test.mjs`

- [ ] 7. Etki sekmesi
  - Ne: `panel/index.html` içine `id="etki"` bölümü ekle: her etki adımı için başlık, değer (1-5 yıldız/çubuk), tahmini token ve maliyet (güven rozetiyle), "değer / maliyet" göstergesi (basit yatay çubuk). Taslak dosyası (`dosya`) panelde `<iframe>` ile (sunucu `GET /dosya?yol=etki/...` ile proje içi `.html` dosyasını verir; `..` ve mutlak yol reddedilir) önce/sonra yan yana gösterilir. Sunucuda bu rotayı `panel/sunucu.mjs`'e ekle.
  - Kapı: `node panel/arayuz.test.mjs etki && node panel/sunucu.test.mjs`

## Süreç
- [ ] 8. BA/PM bakışı becerisi
  - Yürütücü: claude
  - Ne: `~/.claude/skills/ba-pm-bakis/SKILL.md` ve proje içinde `personalar.md`: plan yazarken problem+hipotez, iş değeri, akış/kullanım kolaylığı, risk bölümleri; UI/akış kararlarında bağımsız bakışlarla (kullanıcı, farklı personalar, benchmark) seçenek üretme ve karşılaştırma tablosu; en fazla 3 soru, varsayılanlı.
  - Kapı: `test -f ~/.claude/skills/ba-pm-bakis/SKILL.md && test -f personalar.md`
