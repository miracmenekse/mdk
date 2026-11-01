# MDK Paneli - "Akış" sekmesi tasarımı (v3 uygulanır)

Bu belge Figma'daki "Akış" sekmesi tasarımının kodlanabilir kararlarını içerir.
Hedef: `~/mdk/panel/index.html` + `~/mdk/panel/ciz.mjs`. Mevcut CSS değişkenleri ve sınıf
adları KORUNUR. Açık tema esas alınır (panelin gerçek görsel dili). Renkler hex, ölçüler px.
Sayılar tr-TR biçimi.

> **GÜNCEL KARAR (v3):** Kullanıcı v2'yi gördü, 3 karar verdi. Kod **v3 · 720px**'e göre
> yazılır (bkz. "## 7. v3"). Aşağıdaki 2-6. bölümler v2 (geniş düzen) içindir; v3 farkları
> ve bağlayıcı kararlar 7. bölümde. Çelişki olursa 7. bölüm geçerlidir.

Figma dosyası: fileKey `ov6dUo0vLvaZXGgBout9L2`
- v1 (dokunulmadı): node `11:8355` "Akış sekmesi v1", 1476x694, x=1734 y=-1424
- v2 (dokunulmadı): node `12:1512` "Akış sekmesi v2", 1476x691, x=1734 y=-680
  (alt düğümler: KPI şeridi, Şu an hero `13:1512`, Adımlar tablosu `15:1513`)
- v3 (GÜNCEL, uygulanacak olan): node `18:1512` "Akış sekmesi v3 · 720px",
  720x716, x=3260 y=-680 (Şu an hero + Adımlar tablosu `20:1513`).
  **Kod bu v3'e göre yazılır** (kullanıcı kararı); v2 geniş düzen yalnız referans.

---

## 1. Tasarım dili (mevcut panelden, DEĞİŞTİRME)

CSS değişkenleri (`:root`, açık tema) `index.html` içinde zaten var; v2 bunları kullanır:

| Değişken | Hex (açık) | Kullanım |
|---|---|---|
| `--zemin` | `#F6F7F9` | sayfa arka planı |
| `--kart` | `#FFFFFF` | kart/tablo arka planı |
| `--metin` | `#1C2128` | ana metin |
| `--soluk` | `#5B6572` | ikincil/yardımcı metin, başlık etiketi |
| `--cizgi` | `#DDE1E6` | kenarlık, satır ayracı |
| `--vurgu` | `#2563EB` | mavi vurgu (çalışıyor, aktif, ilerleme dolgusu) |
| `--vurgu-metin` | `#1D4ED8` | mavi metin (aktif sekme, link) |
| `--maliyet` | `#EF4444` | kırmızı (maliyet, bildirim rozeti) |
| `--bos` | `#9CA3AF` | boş/placeholder metin (italik) |

Durum rozeti renkleri (mevcut `--rozet-*`, açık tema). Renk TEK BAŞINA anlam taşımaz;
her rozet NOKTA + TÜRKÇE METİN içerir (erişilebilirlik):

| Durum | Zemin | Metin | Nokta |
|---|---|---|---|
| bitti | `#DCFCE7` | `#166534` | `#166534` |
| çalışıyor | `#DBEAFE` | `#1D4ED8` | `#1D4ED8` |
| bekliyor | `#E5E7EB` | `#4B5563` | `#4B5563` |
| eskale | `#FEF3C7` | `#92400E` | `#92400E` |

Koyu tema karşılıkları `index.html` `@media (prefers-color-scheme: dark)` bloğunda
zaten tanımlı; v2'de yeni eklenen öğeler (bildirim rozeti, ilerleme çubuğu, geçen süre)
için de aşağıdaki koyu tema değerleri eklenecek.

### Tipografi (px)
Font yığını (mevcut): `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
Model adları: `ui-monospace, SFMono-Regular, Menlo, monospace` (mevcut `.model`).
(Figma mockup'ında Inter ile temsil edildi; kodda yukarıdaki yığın kalır.)

| Rol | Boyut / Kalınlık |
|---|---|
| KPI büyük sayı (`.kpi-kutu b`) | 20px / 600, `tabular-nums` |
| KPI etiket (`.kpi-kutu .etiket`) | 12px / 400, `--soluk` |
| Bölüm başlığı (`h2`) | 13px / 600, UPPERCASE, `letter-spacing .06em`, `--soluk` |
| Hero adım başlığı | 16px / 600 |
| Gövde / tablo hücresi (`td`) | 13px / 400 |
| Tablo başlığı (`th`) | 12px / 600, `--soluk` |
| Yardımcı (`.adim-alt`, `.soluk`) | 12px / 400, `--soluk` |
| Model (`.model`) | 13px / 400, monospace |

### Boşluk / ızgara (8px taban)
- Sayfa iç boşluğu: 24px (dar ekran ≤520px: 14px, mevcut `main` padding).
- Bölümler arası dikey boşluk: 16px.
- Kart iç boşluğu: 12px 14px (mevcut `.kart`).
- KPI kartları arası: 16px (geniş düzen); dar ekran ≤520px: 6px (mevcut).
- Köşe yarıçapı: kart/tablo 10px; rozet ve ilerleme çubuğu (track + dolgu) 999px (pill).
- Kenarlık: her yerde 1px `--cizgi`.

### Genişlik ve tablo sütunları (ÖNEMLİ)
- v2 geniş masaüstü düzenidir (ana makine 1920x1200). Mevcut `main { max-width: 720px }`
  dar kalır; Akış sekmesi için genişlik **1180px**'e çıkar (`main` ya da `#sekme-akis`
  için `max-width: 1180px`). Tablo yine de kendi içinde kaydırılabilir kalır (mevcut
  `table { display: block; overflow-x: auto }`), böylece ≤520px'de yatay taşma olmaz.
- Tablo sütun genişlikleri (px): Adım = esner (`width:auto`, kalan alanı alır),
  İlerleme 200, Yürütücü 290, Durum 130, Süre/Saat 150, Deneme 90 (sağa yaslı),
  Token 120 (sağa yaslı). (Figma'da uygulanan ölçüler.)

---

## 2. Ekran: Akış sekmesi (v2)

Dikey sıra (yukarıdan aşağı): **(A) KPI şeridi → (B) "Şu an" hero kartı → (C) "Adımlar" tablosu.**
BA/PM önceliği: "şu an ne çalışıyor ve ne durumda" en görünür yerde → hero kartı KPI'nın
hemen altında, tam genişlik ve mavi vurgulu.

### (A) KPI şeridi — bölüm navigasyonu + metrik + bildirim
- Kapsayıcı: `.kpi`, `display:grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap:16px`.
  Dar ekran (`max-width:520px`): `repeat(3, ...)`, gap 6px (mevcut davranış).
- 5 eşit genişlik kart = 5 sekme: **Depo, Akış, Modeller, Etki, Araştırma**.
- Her kart `.kpi-kutu` (beyaz, 1px `--cizgi`, 10px yarıçap, 12px 14px padding):
  - Üst satır: bölüm adı (`.etiket`, 12px `--soluk`) + sağ üstte **bildirim rozeti**.
  - Büyük sayı (`b`, 20px/600, tabular-nums) = o sekmenin ana metriği.
  - Alt satır (opsiyonel): metrik adı (`.etiket`, 12px `--soluk`).
- **Aktif kart (Akış):** çerçeve rengi `--vurgu`; içerik kaymasın diye 1px→2px kenarlık
  yerine `box-shadow: inset 0 0 0 2px var(--vurgu)` (border yine 1px `--cizgi`), etiket
  rengi `--vurgu-metin`. Mevcut `.sekmeler button[aria-selected]` mantığının kart karşılığı.

- **Kartların davranışı (KARAR):** 5 KPI kartı, mevcut `.sekmeler` tab çubuğunun YERİNE
  geçer — her kart tıklanabilir (`role="tab"`, `data-sekme="depo|akis|modeller|etki|arastirma"`,
  `aria-selected`). Yani kart = sekme düğmesi + metrik + bildirim. Ayrı bir tab çubuğu olmaz.
  - **Depo kartı:** git deposu yoksa gizli (mevcut Depo sekmesi `hidden` davranışı aynen).
  - Mevcut `kpiHtml`'deki metrikler (biten adım, ilk denemede geçme, token, ödenen,
    Claude tahmini) kaybolmaz: Akış kartının büyük sayısı "biten adım" olur; ödenen/
    Claude/token ölçümleri Modeller ve Etki sekmelerinin İÇİNDE (ikincil şerit) gösterilir.
    (AÇIK KARAR — aşağıdaki "Açık kararlar"a bakın.)

Kartların metrikleri (öneri — kodda gerçek snapshot'tan beslenir):
| Kart | Büyük sayı | Metrik adı | Bildirim rozeti (yeni öğe) |
|---|---|---|---|
| Depo | `26` | bekleyen commit | 2 |
| Akış (aktif) | `4 / 5` | biten adım | 0 (gizli) |
| Modeller | `4` | etkin model | 1 |
| Etki | `5` | etki kaydı | 3 |
| Araştırma | `2` | araştırma notu | 0 (gizli) |

**Bildirim rozeti mantığı (yorum 1):**
- Rozet = o sekmede SON GÖRÜLDÜĞÜNDEN BERİ eklenen YENİ öğe sayısı (okunmamış sayacı).
- Sınıf: `.kpi-rozet`. Konum: kartın sağ üstü (`position:absolute; top:8px; right:8px`
  veya etiket satırında sağa yaslı). Boyut: min 20px daire, yükseklik 20px, yatay
  padding 6px (çift haneli sayıda genişler), 999px yarıçap.
- Renk: zemin `#EF4444` (`--maliyet`), metin `#FFFFFF`, 12px/600, `tabular-nums`.
- **Sayı 0 ise rozet GÖSTERİLMEZ** (DOM'dan çıkar / `hidden`). "5" sabiti kullanılmaz;
  gerçek, birbirinden farklı küçük sayılar. 99'dan büyükse "99+".
- **Aktif sekmenin (Akış) rozeti her zaman 0 → gizli** (kullanıcı o sekmeye bakıyor).
- Koyu tema: zemin `#EF4444` kalır, metin `#FFFFFF`.
- **Veri kaynağı (yeni öğe sayacı):** her sekmenin güncel öğe sayısı snapshot'tan gelir
  (Depo=yeni commit, Modeller=yeni metrik satırı, Etki=yeni taslak, Araştırma=yeni not).
  Sekme açıldığında o sekmenin o anki sayısı `localStorage['mdk-okundu-<data-sekme>']`'e
  yazılır; rozet = `güncel − okunan` (negatifse 0). Böylece rozet "son bakıştan beri
  eklenen" sayısını gösterir, kullanıcı sekmeye girince sıfırlanır.

### (B) "Şu an" hero kartı — en görünür öğe
- Kapsayıcı: `#simdi` kartı (mevcut), v2'de tam genişlik + sol kenarda 3px `--vurgu`
  renkli şerit (çalışırken) → `border-left: 3px solid var(--vurgu)`.
- İçerik düzeni (yatay, `.ana` esnek sarmalı): sol blokta büyük **durum rozeti**
  (`.rozet.calisiyor` = "çalışıyor", nokta + metin), sonra alanlar:
  `adım` / `model` / `deneme` / ve **geçen süre**.
- **Geçen süre göstergesi (yorum 2):** çalışan adımda bitiş saati yerine CANLI geçen
  süre. Mevcut `ciz.mjs` `gecenSure(ts, simdiMs)` + `<b id="sure">` zaten var; v2'de
  BELİRGİNLEŞTİRİLİR: alan etiketi "geçen süre", değer 14-16px/600 `--vurgu-metin`,
  SOLUNDA 6px mavi (`--vurgu`) nokta (animasyon yok, sade). Biçim mevcut `gecenSure`
  çıktısıyla aynı: `12 dk 3 sn` (dakika altında yalnız `X sn`). Her saniye güncellenir
  (mevcut `id="sure"` tazeleme). Figma'da sıfır-dolgulu "12 dk 03 sn" gösterildi; KODDA
  mevcut biçim (`12 dk 3 sn`) KORUNUR.
- Adımın ilerleme çubuğu hero içinde tam genişlik (track `#E5E7EB`, dolgu `--vurgu`).
- Alanlar: `.alan` (dikey), `.etiket` (12px `--soluk`) üstte, değer `b` (14px/600) altta;
  `model` değeri `.model` (monospace).
- Örnek içerik: durum "çalışıyor" · adım "92 Panelde ön regresyon durumu" ·
  model `opencode-go/glm-5.3-flash` · deneme 2 · geçen süre "12 dk 03 sn" · ilerleme %55 ·
  başlangıç 14:03.

### (C) "Adımlar" tablosu
- Başlık: `h2` "ADIMLAR" (13px/600 uppercase, `--soluk`).
- Tablo: mevcut `table` (beyaz, 1px `--cizgi`, 10px yarıçap). `th` 12px/600 `--soluk`,
  alt çizgi 1px `--cizgi`; satırlar arası 1px `--cizgi` ayraç; son satırda ayraç yok.
- Hücre padding: 8px 10px (mevcut). `td.sayi` tabular-nums, sağa yaslı sayılar.
- Sütunlar (soldan sağa):
  1. **Adım** — no (`.no`, `--soluk`, tabular-nums, min 2ch) + ad (`.baslik`). Örn "92" + "Panelde ön regresyon durumu".
  2. **İlerleme** — ilerleme çubuğu (genişlik ~120px, yükseklik 6px, track `#E5E7EB`, dolgu `--vurgu`, 999px) + sağda % (tabular-nums, 13px). bitti=%100, bekliyor=%0.
  3. **Yürütücü** — `.model` (monospace, 13px), min 14ch, sarılabilir.
  4. **Durum** — `.rozet` (nokta + Türkçe metin): bitti / çalışıyor / bekliyor / eskale.
  5. **Süre / Saat** — bitti/eskale: "14:03 → 14:09"; **çalışıyor satırında bitiş yerine geçen süre "12 dk"** (vurgu-metin); bekliyor: "—".
  6. **Deneme** — `td.sayi`, tabular-nums. bekliyor: "—".
  7. **Token** — `td.sayi`, tr-TR (örn "12.400"). bekliyor: "—".
- **"çalışıyor" satırı vurgusu:** satır zemini `#F2F7FF` (çok hafif mavi); adım adı
  600 kalınlık, Süre sütununda geçen süre `--vurgu-metin`. Sınıf `tr.calisiyor`.
  (Figma'da sol kenar çizgisi YOK; tint + durum rozeti vurguyu taşır. Mevcut
  `ul.adimlar li.calisiyor` liste karşılığı; tabloda sol kenar eklenmez.)
- **bitti satırı:** `.no` ve `.baslik` `--soluk` (mevcut `li.bitti` davranışı) — tamamlanan
  işler görsel olarak geri çekilir.
- Hover: satır zemini `#F6F7F9` (`--zemin`), `cursor` değişmez.

Örnek satırlar. 88-92 = PLAN.md'deki GERÇEK adım adları. UYARI: gerçekte 88-92'nin
hepsi `bitti`; çalışıyor/bekliyor durumları ve 93-94 satırları ile tüm süre/token/deneme
değerleri DURUM GÖSTERİMİ için örnektir (canlı panelde snapshot'tan gelir). Kodlarken
veriyi uydurma; bu satırlar yalnız 4 durumun ve düzenin nasıl görüneceğini gösterir.
| Adım | İlerleme | Yürütücü | Durum | Süre/Saat | Deneme | Token |
|---|---|---|---|---|---|---|
| 88 Gerçek deneme ve ölçüm | %100 | opencode-go/glm-5.3-flash | bitti | 13:40 → 13:46 | 1 | 12.400 |
| 89 Model tablosu: kota deneme sayılmaz | %100 | opencode-go/deepseek-v4.1-flash | bitti | 13:47 → 13:58 | 2 | 28.900 |
| 90 Adım geçmişi: kota ayrı gösterilir | %100 | kodcu/haiku | eskale | 13:59 → 14:00 | 3 | 9.100 |
| 91 Hızlı ön kontrol ve regresyon durumu | %100 | opencode-go/gemini-4-argon | bitti | 14:01 → 14:02 | 1 | 7.265 |
| 92 Panelde ön regresyon durumu | %55 | opencode-go/glm-5.3-flash | çalışıyor | 12 dk | 2 | 5.120 |
| 93 (sıradaki adım) | %0 | — | bekliyor | — | — | — |
| 94 (sıradaki adım) | %0 | — | bekliyor | — | — | — |

İlerleme verisi kaynağı: adımın tahmini ilerlemesi `panel/tahmin.mjs` + `durum.json`
(biten deneme oranı); bitti=%100, bekliyor=%0, çalışıyor=anlık tahmin.

---

## 3. Durumlar (her ekran)

- **Boş (veri yok / boşta):** Hero kartı → `<span class="bos">boşta</span>` (italik, `--bos`).
  KPI büyük sayıları "—". Tablo → "Henüz adım yok" (`.bos`, italik). Bildirim rozetleri gizli.
- **Yükleniyor:** KPI sayıları ve hücreler yerine 12px yüksekliğinde iskelet (skeleton)
  blokları, `#E5E7EB` zemin, 4px yarıçap; hero kartında "yükleniyor…" (`--soluk`).
- **Hata:** Üstte tam genişlik uyarı şeridi: zemin `#FEF3C7`, metin `#92400E`, 1px
  `#FCD34D`, 10px yarıçap; metin "Veri alınamadı — son görüntü gösteriliyor".
  (eskale rozeti renk ailesiyle tutarlı.)

---

## 4. Yeni öğeler için koyu tema değerleri (eklenecek)
- `.kpi-rozet`: zemin `#EF4444`, metin `#FFFFFF` (her iki tema).
- İlerleme çubuğu track: açık `#E5E7EB` / koyu `#2C333A`; dolgu `--vurgu` (değişken).
- `tr.calisiyor` zemini: açık `#F2F7FF` / koyu `#172A4D`.
- Hata şeridi: açık (yukarıda) / koyu zemin `#3A2E12`, metin `#FCD34D`, çizgi `#92400E`.

---

## 5. v1 → v2 farkları
1. **Tema birliği:** v1 koyu dış kapsayıcı + mavi degrade kartlar → v2 panelle tutarlı
   AÇIK tema, düz beyaz kartlar, tek mavi vurgu (`--vurgu #2563EB`). Aşırı degrade/gölge yok.
2. **Gerçek veri:** Sahte SaaS markaları (Catalog, Circooles…) → gerçek MDK adımları
   (88-94), gerçek model adları (opencode-go/glm-5.3-flash vb.).
3. **Durumlar Türkçe + anlamlı:** "Active" (hepsi aynı) → bitti/çalışıyor/bekliyor/eskale,
   nokta + metin, duruma göre farklı satırlar.
4. **Bildirim rozeti düzeltildi:** her kartta sabit kırmızı "5" → yeni öğe sayacı,
   farklı sayılar, 0'da gizli.
5. **"Şu an" hero kartı eklendi:** v1'de yoktu; v2'de en görünür öğe (çalışan adım + canlı
   geçen süre + ilerleme). BA/PM: en çok bakılan bilgi en üstte.
6. **Geçen süre göstergesi:** çalışan satırda/hero'da bitiş yerine canlı "12 dk" (yorum 2).
7. **KPI anlamı:** rastgele "7.265" + "+11.01%" → her kart bir sekme, gerçek metrik,
   tr-TR sayı biçimi (7.265, %11,01), aktif sekme vurgulu.
8. **Hizalama:** 8px ızgara, eşit KPI kartları, hizalı tablo sütunları, tabular-nums sayılar.

---

## 5.5 Açık kararlar (kodlamadan önce kullanıcıya sor)

1. **Liste → tablo geçişi.** Mevcut Akış sekmesi `planHtml` ile kategoriye göre GRUPLU
   `ul.adimlar` çizer: `details.kat` ile açılır/kapanır gruplar, satıra tıklayınca açılan
   deneme ayrıntıları (`.deneme` satırları: hangi model, ✓/✕, sn, token) ve "sadece
   sorunlu" süzgeci. v2 bunları düz tabloya indirger. KARAR GEREK: (a) kategori grup
   başlık satırları tabloda korunsun mu (ör. tam genişlik ayraç satır)? (b) satıra
   tıklayınca deneme ayrıntıları açılan satır (expand) kalsın mı? (c) "sadece sorunlu"
   süzgeci tablo üstüne taşınsın mı? Öneri: grupları koru (ayraç satır), deneme
   ayrıntısı satır genişletmesi kalsın, süzgeç tablonun üstünde düğme.
2. **Yer değiştiren metrikler.** Eski `kpiHtml`: biten adım, ilk denemede geçme, token,
   ödenen, Claude (tahmin). v2'de üst şerit sekme kartlarına dönüşünce bu 5 sayı nereye?
   Öneri: Akış kartı = biten adım; ilk denemede geçme Akış kartının alt metriği; token/
   ödenen/Claude Modeller ve Etki sekmeleri içinde ikincil şerit. Onay gerek.
3. **Panel genişliği.** Akış sekmesi 1180px'e genişletilsin mi, yoksa 720px dar düzende
   tablo kaydırmalı mı kalsın? (v2 geniş düzen varsayıyor.)

## 6. Bitti ölçütleri

**KPI şeridi**
- [ ] 5 eşit genişlik kart, isimler Depo/Akış/Modeller/Etki/Araştırma.
- [ ] Aktif kart (Akış) mavi vurguyla ayırt ediliyor.
- [ ] Bildirim rozeti sağ üstte, kırmızı, 0'da gizli, en az bir kart 0 (gizli) görünüyor.
- [ ] Büyük sayılar tabular-nums, tr-TR biçimi.

**Şu an hero kartı**
- [ ] Çalışan adım, model (monospace), deneme, ilerleme ve CANLI geçen süre görünüyor.
- [ ] Geçen süre her saniye güncelleniyor (`id="sure"`), bitiş saati yerine.
- [ ] Boşta durumunda "boşta" (italik) gösteriliyor, çökme yok.
- [ ] Sol kenarda mavi vurgu şeridi.

**Adımlar tablosu**
- [ ] 7 sütun: Adım / İlerleme / Yürütücü / Durum / Süre-Saat / Deneme / Token.
- [ ] Durum rozetleri nokta + Türkçe metin; renk tek başına anlam taşımıyor.
- [ ] "çalışıyor" satırı hafif mavi zemin + sol mavi kenar; bitiş yerine geçen süre.
- [ ] bitti satırları soluk; bekliyor satırları "—".
- [ ] Sayılar (token, deneme, %) tabular-nums, tr-TR.
- [ ] Başlık satırı belirgin, satır ayraçları 1px `--cizgi`, son satırda ayraç yok.

**Genel**
- [ ] Yalnızca mevcut CSS değişkenleri ve sınıf adları + bu belgedeki yeni sınıflar
      (`.kpi-rozet`, `tr.calisiyor`, ilerleme çubuğu) kullanılıyor.
- [ ] Açık ve koyu tema tutarlı render oluyor.
- [ ] 1920px geniş ve 520px dar ekranda yatay taşma yok.

---

## 7. v3 · 720px — UYGULANACAK TASARIM (bağlayıcı)

Figma: node `18:1512` "Akış sekmesi v3 · 720px" (720x716, tablo `20:1513`).
Kullanıcının v2 üzerine verdiği 3 karar. Bölüm 1'deki renk/tip/rozet dili aynen geçerli;
yalnızca düzen ve kapsam değişir. Tema/vurgu/rozet/gerçek veri/durumlar/geçen süre korunur.

### Karar 1 — Genişlik 720px, yatay kaydırma YOK
- Tüm Akış sayfası panelin gerçek **720px** genişliğine kurulur (mevcut `main{max-width:720px}`
  korunur; v2'nin 1180px önerisi İPTAL). Sayfa iç boşluğu 14px → içerik 692px.
- Tablo bu dara sığar: **3 sütun** (7 değil). İkincil bilgiler (yürütücü, deneme, süre/saat,
  token) ayrı sütun değil; adım adının ALTINDA tek satır küçük metne indirilir (`.adim-alt`,
  11px, `--soluk`). Mevcut `ul.adimlar` `.adim-ust`/`.adim-alt` diline birebir uyar.
- `table{display:block;overflow-x:auto}` kalsa da 3 sütun 692px'e sığdığı için **yatay
  kaydırma oluşmaz**.

Sütunlar (px, inner 692):
| Sütun | Genişlik | İçerik |
|---|---|---|
| Adım | esner (`auto`, ~456px) | 1. satır: no (`.no`, 22px, `--soluk`) + ad (`.baslik`). 2. satır: `.adim-alt` → "model · N deneme · 13:40 → 13:46 · 12.400 token" |
| İlerleme | 132 | ilerleme çubuğu (FILL, 6px, 999px) + `%NN` (12px) |
| Durum | 104 | `.rozet` (nokta + Türkçe metin) |

- **Meta satırı (`.adim-alt`) ayracı:** " · " ile ayrılmış parçalar. bekliyor satırında "—".
- **çalışıyor satırında** meta "… · 12 dk · …" (geçen süre) ve meta metni `--vurgu-metin`
  rengiyle; satır zemini `#F2F7FF`, adım adı 600. Bitiş saati yerine geçen süre (yorum 2).
- bitti satırı: no + ad `--soluk` (mevcut `li.bitti`).

### Karar 2 — KPI kartı = SEKME (ayrı sekme çubuğu YOK)
- Üstteki 5 kart (Depo/Akış/Modeller/Etki/Araştırma) **aynı zamanda sekme düğmeleridir**;
  mevcut `.sekmeler` tab çubuğu KALDIRILIR. Her kart `role="tab"`, `data-sekme="…"`,
  `aria-selected`; tıklanınca ilgili sekme açılır (mevcut sekme JS'i kartlara bağlanır).
- Kart tıklanabilir görünür: `cursor:pointer`, hover'da hafif zemin (`--zemin`).
- **Aktif kart (Akış):** çerçeve `--vurgu` 2px (`box-shadow: inset 0 0 0 2px var(--vurgu)`,
  kayma olmasın), zemin çok hafif mavi `#EFF4FF`, etiket `--vurgu-metin`.
- 720px'e 5 kart tek sırada sığar (grid `repeat(5,minmax(0,1fr))`, gap 8px; kart ~132px).
  Çok dar ekranda (≤520px) `repeat(3,…)` ile 2 sıraya sarar (mevcut davranış) — hepsi
  tek bakışta görünür.
- Kart içi: etiket (12px) + sağ üstte bildirim rozeti (`.kpi-rozet`, 0'da gizli) + büyük
  sayı (18px/600) + metrik adı (11px `--soluk`).
- **Finansal metrikler bu sayfada YOK:** eski `kpiHtml`'deki ödenen / Claude (tahmin) /
  token KPI'ları Akış sayfasına KONMAZ (kullanıcı kararı). Onlar ilgili sekmelerin
  (Modeller/Etki) kendi içinde kalır; bu tasarımın kapsamı dışında.

### Karar 3 — Bu sekme SADECE akış
- Yalnızca iki blok: **(1) "Şu an çalışıyor" hero kartı** (canlı geçen süre, `id="sure"`) +
  **(2) düz adımlar tablosu** (yukarıdaki 3 sütun).
- Gruplu plan davranışları bu sayfaya EKLENMEZ: kategori grupları (`details.kat`), satır
  genişletme / deneme ayrıntısı, "sadece sorunlu" süzgeci YOK. (Bunlar istenirse başka
  sekmede; şimdi yapılmaz.)
- Diğer sekmelerin (Depo/Modeller/Etki/Araştırma) içi bu işte tasarlanmaz.

### v2 → v3 farkları (özet)
1. Genişlik 1476 → **720px**; tüm düzen dar panele yeniden kuruldu.
2. Tablo 7 sütun → **3 sütun**; yürütücü/deneme/süre/token adım altında `.adim-alt` meta satırı.
3. KPI kartları = sekme düğmeleri; ayrı tab çubuğu yok; finansal KPI'lar kaldırıldı.
4. Kapsam daraltıldı: yalnız hero + düz tablo; grup/süzgeç/genişletme yok.
5. Korunanlar: açık tema, `--vurgu #2563EB`, yeni-öğe rozeti (0'da gizli), gerçek MDK
   adımları (88-92) + model adları, durumlar (bitti/çalışıyor/bekliyor/eskale), geçen süre.

### v3 bitti ölçütleri
- [ ] Sayfa 720px'e sığar, hiçbir ekranda yatay kaydırma yok.
- [ ] 5 kart tek sırada, tıklanabilir sekme görünümünde; Akış aktif ve vurgulu.
- [ ] Bildirim rozetleri: farklı sayılar, 0'da gizli (Akış ve Araştırma gizli), aktif sekme 0.
- [ ] Finansal KPI (ödenen/Claude/token) bu sayfada görünmüyor.
- [ ] Hero: çalışan adım + model + deneme + ilerleme + CANLI geçen süre (`id="sure"`, saniyede).
- [ ] Tablo 3 sütun; yürütücü/deneme/süre/token adım altında tek meta satırında.
- [ ] Durum rozetleri nokta + Türkçe metin; çalışıyor satırı hafif mavi + geçen süre.
- [ ] Grup/süzgeç/satır-genişletme YOK.

---

## 8. Modeller v2 · grafikler (grafik ağırlıklı Modeller sayfası)

Kullanıcı Modeller sayfasını grafik ağırlıklı istedi (esin: Dashdark X). AÇIK tema korunur
(v3 ile tutarlı); Dashdark'tan yalnız grafik DEGRADE dolguları (magenta→mavi→cyan) ve
halka/çubuk biçimleri alınır. Koyu tema YOK. Mockup HTML + inline SVG olarak kuruldu,
Figma'ya capture ile aktarıldı.

- Figma: **node `34:1313`** (GÜNCEL, birleşik kart; yeni sayfa, capture ile). Birleştirme
  öncesi iki-kartlı sürüm `32:1313` olarak duruyor (değiştirilmedi). İstenen ad "MDK paneli
  modeller v2 · grafik" her iki capture çerçevesine de ELLE verilmeli (capture varsayılan
  adında; rename use_figma kota sınırına takıldı). Mevcut "MDK paneli modeller" DEĞİŞMEDİ.
- Mockup kaynağı (repo'ya dokunulmadı): `scratchpad/modeller_v2.html` (+ üretici `gen.py`),
  tam boy PNG `scratchpad/modeller_v2.html.png`.

### Genişlik
- **720px** (v3 ile tutarlı; mevcut `main{max-width:720px}`). İç boşluk 14px → içerik 692px.
  Mevcut "MDK paneli modeller.svg" de 720 genişlikte; 1120 düzen GEREKSİZ, reddedildi.

### Açık tema renkleri (metin/zemin)
- Zemin `#F6F7F9`, kart `#FFFFFF`, metin `#1C2128`, soluk `#5B6572`, çizgi `#DDE1E6`,
  vurgu `#2563EB`, vurgu-metin `#1D4ED8`, rozet (bildirim) `#EF4444`.
- **Kural:** Degrade yalnız GRAFİK İŞARETLERİNDE (halka yayları, çubuklar, lejant noktaları,
  bölünmüş çubuk). Tüm sayı/etiket/eksen yazıları `--metin` ya da `--soluk`; cyan/magenta
  METİN KULLANILMAZ (açık temada okunmaz). Sayılar tr-TR (`7,3 M`, `%17`, `52.000`).

### Degrade renk durakları (magenta→mavi→cyan)
- magenta `#E537C9`, mavi `#2563EB`, cyan `#22D3EE` (cyan koyu ucu `#06B6D4`).
- Lejant noktaları: OpenCode = cyan `#06B6D4`, Claude = mavi `#2563EB`.

### Grafikler ve veri eşlemesi
1. **TOKEN PAYI VE MALIYET — TEK BİRLEŞİK KART** (halka + maliyet rakamları).
   - Kullanıcı kararı: eski ayrı "TOKEN PAYI" halka kartı ile "MALIYET DENGESI" kartı
     aynı %17/%83 bölünmesini gösterdiği için MÜKERRERDİ → tek kartta birleştirildi.
     Kart başlığı: "TOKEN PAYI VE MALIYET". İç düzen 2 sütun (`.birlesik`, grid 260px/1fr):
   - **Sol:** degrade halka. Veri: OpenCode 1,3 M + Claude 6 M = **7,3 M** toplam token,
     pay **%17 / %83**. Biçim: 2 yaylı halka, r=80 sw=20, uçlar yuvarlak, üstten başlar.
     Claude yayı `#E537C9→#2563EB`; OpenCode yayı `#22D3EE→#06B6D4`. Orta: `7,3 M` +
     "toplam token". Altında lejant: OpenCode %17 (cyan) / Claude %83 (mavi).
   - **Sağ:** maliyet rakamları — OpenCode (ücretsiz) 1,3 M token · liste fiyatıyla ~$6,40
     (kaçınılan, tahmin) / Claude 6 M token · fiyat yok / "token'ların %17'i ücretsiz modelde"
     (vurgu-metin). Ayrı %17/%83 BÖLÜNMÜŞ ÇUBUK YOK (halka zaten payı gösteriyor; mükerrer).
2. **MODEL BAŞINA TOKEN — degrade çubuk (dikey).**
   - Veri: MODELLER metrik tablosundaki **toplam token** sütunu (tek kaynak): glm-5.3-flash
     52.000, deepseek-v4.1-flash 48.000, gemini-4-argon 9.000, haiku 30.000.
   - Her model bir çubuk; DİKEY degrade (alt magenta `#E537C9` → orta mavi `#2563EB` →
     üst cyan `#22D3EE`). Üstte değer (tr-TR), altta model adı; glm/deepseek altında
     küçük "cache %91 / %90" ipucu (önbellek baskınlığı notu).
   - **Neden yığılmış değil:** gerçek token'da cache (~1 M) giriş/çıkışı ezip çıkış
     segmentini <1px yapıyordu. Kural: **4px'ten küçük görünür segment olmaz**; bu yüzden
     tek değer çubuğu + cache ipucu seçildi. (Yığılmış kırılım istenirse ayrı bir "etkin
     token" grafiği gerekir; şimdilik yok.)
   - Not: MODELLER "token" (52.000…) ile GERÇEK TOKEN kırılımı (giriş/çıkış/cache) AYRI
     kaynaklardır (metrikler vs OpenCode DB); bir grafik = bir kaynak, alt başlıkta yazılı.
   (Not: eski 3. grafik "MALIYET DENGESI" ayrı kartı ve bölünmüş çubuğu KALDIRILDI;
   içeriği 1. maddedeki birleşik kartın sağ tarafına taşındı.)

### KPI kartları (= sekmeler)
- 4 kart: **Depo / Akış / Modeller / Araştırma** (mevcut Modeller sayfasındaki gibi; Etki
  kartı bu sayfada yok — AÇIK SORU, aşağıda). Kart = sekme düğmesi (`role="tab"`), v3 ile
  aynı stil. **Aktif kart = Modeller** (bu sayfa); aktif kartın rozeti gizli (aktif-sekme
  kuralı). Rozetler: Depo 2, Akış 1, Modeller gizli(aktif), Araştırma gizli(0).
- Metrikler: Depo 26 bekleyen commit · Akış 4/5 biten adım · Modeller 4 etkin model ·
  Araştırma 2 araştırma notu.
- **Finansal KPI yok** (ödenen/Claude tahmini bu sayfada değil; v3 kararıyla tutarlı).

### Detay tablolar (grafiklerin ALTINDA)
- **MODELLER · ayrıntı:** yürütücü · model(mono) · deneme · ilk geçme · uyum % · token ·
  maliyet · ort. süre · veri(`● ölçüldü` yeşil rozet). 4 satır (glm/deepseek/gemini/haiku).
  12px font, dar padding (9 sütun 692px'e sığar).
- **GERÇEK TOKEN (bu proje):** model(mono) · mesaj · giriş · çıkış · cache · tok/sn. YALNIZ
  2 satır (glm, deepseek) — gerçek OpenCode DB ölçümü yalnız bu ikisinde var.

### Bitti ölçütleri (Modeller v2)
- [ ] Açık tema; degrade yalnız grafik işaretlerinde, yazılar metin/soluk renkte.
- [ ] 2 grafik kartı: (a) TOKEN PAYI VE MALIYET birleşik kart (7,3 M halka %17/%83 + maliyet
      rakamları, ayrı bölünmüş çubuk YOK), (b) MODEL BAŞINA TOKEN çubukları — degrade.
- [ ] Hiçbir grafik segmenti 4px'ten küçük görünmüyor.
- [ ] 4 KPI kartı sekme görünümünde; Modeller aktif, rozeti gizli.
- [ ] Grafikler üstte, MODELLER + GERÇEK TOKEN detay tabloları altta.
- [ ] 720px'e sığıyor, yatay kaydırma yok.

### Açık sorular
1. **Etki kartı:** v3 Akış'ta 5 kart (… Etki …) vardı; Modeller sayfasında 4 kart
   (Etki yok). Etki kartı burada da olmalı mı, yoksa Modeller sayfasında gizli mi? (Mevcut
   Modeller mockup'ında yoktu; aynen korundu.)
2. **gemini/haiku gerçek token kırılımı yok:** GERÇEK TOKEN tablosu yalnız glm+deepseek.
   Model başına token çubuğu bu yüzden "toplam token" (metrik) kaynağını kullanıyor.
3. **Kaynak çerçeve hatası:** mevcut "MDK paneli modeller" çerçevesinde AKTİF kart Akış
   görünüyor (Modeller=1 rozetli); doğrusu bu sayfada aktif kart Modeller olmalı — v2'de
   düzeltildi.
4. **Frame adı:** capture kota sınırı yüzünden "MDK paneli modeller v2 · grafik" adı elle
   verilmeli (node 32:1313).
