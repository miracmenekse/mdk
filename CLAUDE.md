# MDK (MM Development Kit)

Claude planlar, OpenCode ücretsiz modellerle geliştirir, kalite kapıdan geçerek garanti edilir. Bu proje hem bu sürecin aracı hem de kendi canlı paneli.

Bu dosya yalnız **güncel kuralları** tutar ve kısa kalır. Ölçümler, kararların gerekçesi ve tarihçe `docs/gunluk.md`'de (otomatik yüklenmez; "neden böyle" diye gerekirse oku). Yeni ölçüm/tarihçe notunu buraya değil oraya yaz.

## Kim neyi okur
- **Claude (planlayan):** bu dosya + `~/.claude/CLAUDE.md` + `ba-pm-bakis` becerisi.
- **Yürütücü (opencode/cursor):** `yurutucu-kurallar.md` (koşturucu isteme ekler) + PLAN başındaki `Kurallar` bloğu + adım metni. Bu dosyayı ve `~/.claude/skills`'i GÖRMEZ (`OPENCODE_DISABLE_CLAUDE_CODE=1`). Yürütücünün bilmesi gereken proje bilgisi varsa proje köküne `AGENTS.md` yaz, buraya değil.
- **Kural kaynakları tek yerde:** genel kurallar `esit/` altında, `bash mdk-esitle.sh` onları `~/.config/opencode` ve `~/.claude`'a kurar. Kuralı hedefte değil `esit/`'te değiştir. Model adlarını hiçbir kural dosyasına yazma: tek kaynak PLAN.md başındaki `Görev <tür>:` satırları.

## Süreç
- **Adlar:** arayüzde Faz = **Epic**, Adım = **Story**. Dosya biçimi ve koşturucu aynı (`- [ ] N.`, `mdk-adim.sh <no>`). Epic statüsü: Analiz → Tasarım → Geliştirme → Tamamlandı (tüm story'ler bitince kendiliğinden).
- **Epic akışının sahibi `mdk-epic.mjs`** (kural değil kod; yanlış sırayı reddeder, kendi değişikliğini commit eder). Sıradaki hamleyi tahmin etme: `node mdk-epic.mjs durum`.
  - İş gelince: işi bir dosyaya yaz, `node mdk-epic.mjs ac "<ad>" <dosya>` → Epic no.
  - Kullanıcı tartışma istemediyse (varsayılan): story'leri yaz, `node mdk-epic.mjs gelistir <no>`, koştur.
  - Kullanıcı "tartıştır / personalara sor" derse: `node mdk-epic.mjs tartis <no> [--persona "Ad1,Ad2" --neden "<gerekçe>"]` (takım `persona/takim.json`; işe ilgisiz personayı çıkar, gerekçeyi yaz). Çözümü kendin sına (sayısal ve evet/hayır hükmüne güvenme). Tartışma tahmini story listesi üretir; **onay gelmeden story yazma** (koşturucu da çıkış 5 verir).
  - **Tartışma biter bitmez, işin arayüze etkisi varsa ilk çıktı önce/sonra etki krokisidir:** `etki/<ad>.html` (`etki/ORNEK.html` kalıbı: `svg#once` + `svg#sonra`, değişen bölge `degisen`), Epic bloğuna `- Etki: etki/<ad>.html`, commit. Çekmecenin "UI/UX ETKİSİ" bölümü bunu gösterir. **Figma'ya bu aşamada dokunma:** Figma yalnız kullanıcı krokiyi onaylayınca ya da "Figma'da çiz" deyince üretilir.
  - `epic <no> onay` gelince: `node mdk-epic.mjs karar <no> onay` → story'leri yaz → `gelistir <no>` → koştur.
- **Yalın Kip (varsayılan):** kullanıcının doğrudan tarif ettiği işte ve Faz içi adımlarda persona turu, benchmark, etki krokisi yok. `ba-pm-bakis` yalnız yeni Faz başında 1 kez ya da kullanıcı isteyince.
- **Adım = dikey dilim:** 1–3 dosya, ~60–250 satır, 1 kapı. `Ne:` satırına hedef `dosya:satır-aralığı` yaz. Yeni adımları son numaradan devam ettir.
- **Çalıştırma:** planı commit et (temiz ağaç şart), `./mdk-adim.sh <no>`. Sırayla şunları yapar:
  1. Ön regresyon (`HEPSI_HIZLI=1 test/hepsi.sh`); kırmızıysa çıkış 4.
  2. Kapı dosyası diskte yoksa `Görev kapi:` modeline yazdırır. Kabul şartı: yalnız istenen dosya, sözdizimi temiz, kod yazılmadan kırmızı. `UYARI: zayıf kapı` basarsa `Kapı:` metnini davranışa göre netleştir.
  3. `Görev <tür>:` modelleriyle kodu yazdırır (adımda `- Görev:` yoksa `kod`; adımdaki `- Modeller:` önce gelir).
  4. Adım kapısı + **kapı sonrası hızlı regresyon**; biri kırmızıysa deneme başarısız, çıktı sonraki denemeye ipucu.
  5. Modeller tükenirse `Görev eskale:`; o da tükenirse çıkış 2 → ancak o zaman `kodcu`.
- **Çıkış kodları:** 0 geçti · 2 eskale · 3 adım opencode'un değil · 4 ön koşul (kirli ağaç, kırmızı regresyon, kapı üretilemedi, ortam hatası) · 5 taslak ya da Epic çözüm onayı bekliyor · 6 sağlayıcı sessiz/kota · 8 modeller kilitli.
- **Paralel:** ayrı dosyalara dokunan adımlar `./mdk-paralel.sh <no> <no>...` (çıkış 9 = çakışma).
- **İnceleme:** yalnız `- İncele: evet` olan adımda ya da Faz sonunda `./mdk-incele.sh <no>`; diff'i yalnız uyum < 80 ise kendin oku.
- **İzleme:** `bash mdk-panel.sh start . 4747`, `bash mdk-figma.sh start` (Figma aktarıcısı; yeni makinede önce `bash mdk-figma.sh kur`), `node izle.mjs`, `node karsilastir.mjs` (model tablosu + kapı üretim özeti).
- **Push öncesi:** tam `bash test/hepsi.sh` yeşil olmalı (~3 dk).

## Koşturucunun zorladıkları (kural metnine güvenme, bunlar izinde)
- Kod görevinde `PLAN.md`, `test/*`, `kapi/*`, `*.test.*` yazılamaz; kapı görevinde yalnız eksik kapı dosyası yazılır.
- `test/hepsi.sh`, tam `mdk-adim.test.sh` (adımın kendi kapısında geçmiyorsa), `git push`, `git stash`, `sudo` koşulamaz.
- Kabukla dolanma hâlâ mümkün; koşu sonrası kurcalama tespiti bu yüzden duruyor.
- Ortam: `DENEME` (2), `SURE` (600), `ILK` (75), `ONCE=<model>`, `MDK_SADE=1` (deneysel, token azaltmadı), `MDK_CLAUDE_KURAL=1` (yalıtımı kapatır), `MDK_ONKONTROL_YOK=1`.

## Tuzaklar
- Kırmızı bir kapıyı ilgili adımdan önce commit etme; `hepsi.sh` yalnız bitmemiş adımların kapı dosyalarını atlar. Var olan test dosyasına vaka eklerken varsayılan listeye koyma, adım bitince ekle.
- Yürütücü "test mantıksız" derse (SORUN.md) haklı olabilir: kapı sahibi kapıyı düzeltir, kod teste uydurulmaz.
- İlk kez kullanılan kapıyı gerçek ortamda (koşturucu içinden) bir kez dene.
- UI işinde yalnız kapıya güvenme: gerçek tarayıcıda ekran görüntüsü al; canlı paneli yeni kodla yeniden başlat (`bash mdk-panel.sh stop . 4747 && bash mdk-panel.sh start . 4747`).
- `opencode run` stdin kapalı çalışmalı. Süreç durdururken `pkill -f` kullanma, PID ile öldür.
- Ücretsiz kota dolunca OpenCode sessizce bekler (`yanit_yok`, çıkış 6); paralel koşu kotayı çabuk bitirir. Ücretsiz model listesi değişkendir.
- Panel yalnız `127.0.0.1`'e bağlanır. PLAN.md'ye panel yalnız `Görev` satırını yazar; adımları yalnız Claude yazar.
- `metrikler.jsonl` git'te değil, makineye özgü (yalnız bu Mac'te birikir). Model sırasını veriyle değiştirmeden önce örnek sayısına bak (`node karsilastir.mjs`).

## Panelden karar (etki taslağı onayı)
- Oturum başında ve taslak yazınca: `node karar-bekle.mjs --bir-kez`, sonra Monitor ile `node karar-bekle.mjs` (`timeout_ms` 1800000).
- `adım <no> onay` iki aşamalıdır; aşamayı adımda `- Figma:` satırının varlığı belirler:
  1. **Taslak onayı** (adımda `- Figma:` yok): Figma'daki panel tasarımının ("mdk paneli", `ov6dUo0vLvaZXGgBout9L2`) ilgili çerçevesini **Talk to Figma** ile kopyalayıp değişikliği kopyada yap, eskiyle yan yana koy (kotasız): `bash mdk-figma.sh durum` (gerekirse `start`), kullanıcıdan Figma'da "Talk to Figma (MDK, analitiksiz)" eklentisini açıp Connect demesini ve kanal adını iste, `join_channel`. Çerçeveler otomatik yerleşimli: koordinat değil sıra önemli (`set_parent` + `index`); var olan başlığı `clone_node` ile kopyalayıp metnini değiştir; Türkçe büyük harfli başlığı doğrudan büyük yaz (UPPER dönüşümü "İ"yi bozar). Sonucu `export_node_as_image` ile kontrol et. Adıma `- Figma: <değişen çerçevenin node-id'li url'i>` yaz, commit et. Panel "Figma güncellendi · Figma'da aç" gösterir, düğme "Adımı onayla" olur. Resmi Figma MCP (`use_figma`) Starter+View'da ayda 20 çağrı: yalnız Talk to Figma çalışmıyorsa kullan; o da yoksa `generate_figma_design` (HTML yakalama, kotadan muaf) ile yeni sayfa.
  2. **Adım onayı** (adımda `- Figma:` var): adıma `- Onay: evet`, commit, `./mdk-adim.sh <no>`.
- **Epic kararları** (`epic <no> <tür>`; panelde Epic satırındaki Detay çekmecesinden gelir):
  - `onay` → yukarıdaki akış. `red: <not>` / `yorum: <not>` → notu `epic/<no>/is.md`'ye ekle; yeniden tartıştır ya da yanıtla; onay sayılmaz.
  - `figma` ("Figma'da çiz") → Talk to Figma ile ilgili çerçeveyi/sayfayı `clone_node` ile kopyala, **orijinale dokunma**, değişikliği kopyada yap, solda eski sağda yeni yan yana yerleştir; `node mdk-epic.mjs figma <no> <url>`. Story düzeyindeki taslak onayında da artık orijinal güncellenmez, aynı kopya kuralı geçerlidir.
  UI'ı etkilemeyen adımda `- Figma:` beklenmez; ilk `onay` doğrudan adım onayıdır. `red: <not>` → `etki/` taslağını düzelt. `yorum:` → yanıtla ya da düzelt; onay sayılmaz.

## Açık işler
- Faz 16 (iPhone kabuğu, 114–119) bekliyor.
- Karar şeridi en küçük numaralı bekleyeni gösteriyor: Faz 16 (115/116) taslakları bekledikçe yeni adım (ör. 133) şeritte görünmez; çekmeceye Akış satırından ulaşılır.
- Talk to Figma `export_node_as_image` bu makinede yanıt vermiyor (eklenti hiç `imageData` döndürmedi; diğer komutlar çalışıyor). Figma kontrolü şimdilik düğüm geometrisiyle + kullanıcının gözüyle.
- Cursor kota mesajı hâlâ tahmini regex; gerçek mesaj görülünce daralt.
- Otomatik model sıralama: önce yeterli ölçüm birikmeli (model başına ≥ 10 gerçek deneme).
- Claude'un planlama token'ı ölçülmüyor.
