# MDK katman kararı: neyi kendimiz yazalım, neyi hazır alalım?

Tarih: 2026-11-23. **Durum: TASLAK. Kullanıcı kararı (G4) bekleniyor.** Girdiler:
- `kullanilamazlik.md` (iç denetim)
- `teknik/orca.md`, `teknik/spec-kit.md` (Copilot; ana iddialar koddan sınandı)
- `rapor/antigravity-katmanlar-2026-11-23.md` (Antigravity'nin bağımsız görüşü)
- web taraması, `gh api` (yıldız ve lisans bugün çekildi)

Henüz gelmeyenler: Gemini Deep Research İstem 4 (G1), NotebookLM (G2), elle deneme (G3). Bunlar gelince tablo güncellenir.

## Soru ve kısa yanıt
**"Amerika'yı yeniden mi keşfediyoruz?"** Kısmen evet:
- MDK'nın iki katmanı (koşu düzeni ve panel) başkalarının olgun biçimde çözdüğü işler. Üretim kodunun ~%66'sı (5.972 / 8.977 satır) bu iki katmanda ve bakım yükünün çoğu buradan geliyor.
- Son dört story (222, 224, 225, 226) hazır çözümleri sıfırdan yeniden yazdı.

**Ama asıl sorun bu değil.** Story'lerin yalnız ~%18'i tasarlandığı gibi (ucuz model + kapı) bitti. Kullanılamazlığın birinci nedeni ücretsiz kotaya dayanmak. Bu, araç değiştirerek değil, **maliyet politikası** değiştirerek çözülür.

## Karar kuralı (değişmez)
- Hazır araç katmanı karşılıyorsa ve düşük maliyeti ya da teknik olmayan kullanıcı deneyimini bozmuyorsa, **hazır al ya da sar**.
- **Kendimiz yazarız** yalnız farkı yaratan katmanda.
- Hazır alınan her şey MDK'nın kendi sözleşmesinin arkasında durur. Araç değişince yalnız adaptör değişir.

## n8n, "harness", Orca: üçü aynı şey değil
| Ad | Ne | MDK'da hangi katman | Sonuç |
|---|---|---|---|
| **n8n** | Genel iş akışı otomasyonu (webhook, entegrasyon); lisansı SUL (kaynağı açık ama kısıtlı) | 6, ama kod üretmez | MDK'nın rakibi değil. İleride "panelden iş gelsin, Slack'e haber gitsin" gibi yan işler için kullanılabilir. |
| **"Harness"** | Ürün değil, 2026'da yerleşen bir kavram ([Fowler](https://martinfowler.com/articles/harness-engineering.html), [Osmani](https://addyosmani.com/blog/agent-harness-engineering/)): ajanın çevresindeki kurallar, testler ve kapılar. Harness.io ise ayrı bir CI/CD ürünü. | 3 (satıcının harness'ı: Claude Code, OpenCode, agy) + 5 (kullanıcının harness'ı: kapı, kural) | **MDK'nın kapı sistemi tam olarak "kullanıcı tarafı harness".** Fark yaratan bu, adı artık var. |
| **Orca** ([stablyai/orca](https://github.com/stablyai/orca)) | 134 bin★, MIT. Masaüstü uygulaması: her ajan ayrı git worktree'de, paralel; CLI ile sürülür; kullanım/kota takibi var | 3 + 6 + 7 | MDK'nın koşu ve panel katmanının en güçlü hazır adayı. Kapı ve model merdiveni yok. |

## Katman tablosu
Değiştirme maliyeti şu soruyu yanıtlar: "bu araç yarın bırakılırsa ne kadar iş çıkar?"

| # | Katman | MDK bugün (satır) | Hazır aday | Karar | Değiştirme maliyeti |
|---|---|---|---|---|---|
| 1 | İstek, şartname (Epic/Story/`Kabul`) | `mdk-epic` vb. (967, 2. katmanla birlikte) | [spec-kit](https://github.com/github/spec-kit) 151 bin★ MIT, OpenSpec | **KENDİMİZ (biçim) + standarda uyum.** Kabul satırı spec-kit'in "Acceptance Scenarios" alanına eşlenebilir (Copilot, `templates/spec-template.md`). Şimdilik biçimi değiştirme, yalnız dışa aktarılabilir tut. | düşük |
| 2 | Parçalama, persona | `epic-tartis`, `persona-*` | BMAD, Task Master (Commons Clause; ticarileşmeye engel) | **DONDUR.** Persona tartışması nadir kullanılıyor; yeni yatırım yapma. | düşük |
| 3 | Yürütücü (satıcının harness'ı) | `mdk-uyandir`, `mdk-mcp`, `yurutuculer.json` (556) | Claude Code, OpenCode, agy; ortak protokol [ACP](https://github.com/agentclientprotocol/agent-client-protocol) (Apache-2.0; `agy acp` bu Mac'te var) | **HAZIR AL + tek adaptör.** Her ajan için ayrı bayrak listesi yerine hedef ACP. Önce `agy acp` ve `opencode acp` ile denenmeli (doğrulanmadı). | orta |
| 4 | Model yönlendirme, yedek, kota | `mdk-hata`, `mdk-karar` + `mdk-adim` içi (346+) | LiteLLM 64 bin★, OpenRouter, claude-code-router | **POLİTİKA KENDİMİZ, MEKANİZMA HAZIR.** Yeniden deneme / Retry-After kodu bir daha yazılmaz. Ama asıl kazanç araçtan değil, aşağıdaki maliyet politikasından gelir. | düşük |
| 5 | Kalite kapısı (kapı, kurcalama koruması, regresyon, eskale) | `mdk-adim-kapi`, `kapi-denetle`, `mdk-hakem`, `mdk-incele` (622) | Hazırda tek döngüde yok. Orca'nın `gate-create`'i insan kararı bekler, test koşmaz. spec-kit'te test isteğe bağlı. | **KENDİMİZ. Çekirdek değer burası.** | — |
| 6 | Koşu düzeni, paralel, worktree, kilit, birleştirme | `mdk-adim`, `mdk-ortak`, `mdk-paralel`, `mdk-dagit` (1.485) | **Orca** (`orca orchestration worker-start --worktree new-child --agent opencode`, `--retry-of`); vibe-kanban (şirket kapandı, pano kaldırıldı, riskli); Temporal ve n8n bu iş için ağır | **DENEMEYE BAĞLI (G3).** Orca denemesi geçerse paralel, worktree ve kilit işi Orca'ya devredilir. MDK yalnız "bu story'yi şu ajanla başlat, bitince kapıyı koş" der. Geçmezse bu katmana yeni özellik eklenmez, yalnız hata düzeltilir. | orta-yüksek |
| 7 | Panel | `panel/*.mjs` (4.487) | Orca'nın arayüzü (worktree, diff, kullanım); vibe-kanban önerilmez | **DONDUR ve KÜÇÜLT.** Panelde yalnız MDK'ya özgü olan kalır: Epic/Story durumu, onay kartı, kapı sonucu, story başına maliyet. Worktree, diff ve ajan izleme Orca'ya bırakılır. | orta |
| 8 | Maliyet, metrik | `mdk-kayit`, `karsilastir` (164) | ccusage (Claude/OpenCode/Codex yerel kayıtları; OpenCode ve agy desteği doğrulanmadı), Orca kullanım takibi | **KENDİMİZ (story başına kayıt) + HAZIR (abonelik tüketimi).** Bugünkü 0,56 $ yanıltıcı; Claude ve agy tüketimi ölçülmüyor. | düşük |
| 9 | Kural eşitleme | `mdk-esitle`, `esit/` (49) | [AGENTS.md](https://agents.md/) standardı; ruler/rulesync | **HAZIR STANDART.** Kök kural `AGENTS.md`. Eşitleme betiği küçük, şimdilik kalsın. | düşük |

## Hedef mimari: ince çekirdek + adaptörler
```
İş kullanıcısı ──► [ Ekran: istek, onay, sonuç, maliyet ]        ← KENDİMİZ (küçük)
                        │
                  [ MDK ÇEKİRDEĞİ: sözleşme ]                      ← KENDİMİZ (~1.500-2.000 satır hedef)
                   Story + Kabul → Kapı (kırmızı→yeşil, kurcalama koruması)
                   → Eskale politikası → Story başına maliyet kaydı
                        │  (adaptör arayüzü: başlat / durum / bitti / kullanım)
     ┌──────────────────┼────────────────────┐
 [Koşu: Orca CLI]  [Ajan: ACP → claude/opencode/agy]  [Model: abonelik + LiteLLM/OpenRouter]   ← HAZIR, değişebilir
```
Teknolojiden bağımsızlığın ölçütü **"Claude çıktı" tatbikatıdır** (açık iş, `mdk-ikili-yurutucu` belleği). Planlayıcı ya da yürütücü değişince yalnız adaptör ve profil değişmeli, çekirdek ve ekran aynı kalmalı.

## Maliyet politikası (kullanılamazlığın birinci nedeni)
Antigravity'nin önerisini Claude süzdü. Abonelik sınır rakamları doğrulanmadı.
1. **Ücretsiz modeller ana akıştan çıkar.** Yalnız deney ve yan iş (persona taslağı, radar) için kalır. Kota bitince `yanit_yok` beklenmez, hemen sıradaki kaynağa geçilir.
2. **Rutin story kodu:** OpenCode Go (aylık havuz), en çok 2 deneme. Geçmezse ucuz modelde ısrar edilmez.
3. **Eskale, planlama ve zor iş:** Claude Pro ve Antigravity, birinin penceresi dolunca öteki. İkisi de bu Mac'te headless çalışıyor.
4. **Salt okuma (inceleme, radar, depo incelemesi):** Copilot öğrenci kredisi.
5. **Ölç:** abonelik tüketimi de story başına kayda girsin. Yoksa "düşük maliyet" iddiası kanıtlanamaz.

## Yeni iş kuralı (öneri; onaylanırsa `CLAUDE.md`'ye girer)
Her yeni Epic açılmadan önce şu sorulur: "Bu iş hangi katmanda? O katman tabloda HAZIR ya da DONDUR mu?" Öyleyse Epic yazılmaz. Yerine adaptör ya da politika işi açılır. 222, 224, 225 ve 226 bu kuralla açılmazdı.

## Aday Epic'ler (sırayla; hiçbiri onaysız açılmaz)
1. **Maliyet politikası.** Ücretsiz modeller ana akıştan çıkar, Görev satırları abonelik rollerine göre yeniden dizilir, abonelik tüketimi kayda girer. En büyük kullanılabilirlik kazancı, küçük iş.
2. **Orca denemesi (G3) → koşu adaptörü.** Deneme geçerse `mdk-adim` Orca üzerinden bir story koşturur. Kabul: aynı story Orca worktree'sinde başlar, MDK kapısı geçer, metrik yazılır.
3. **ACP yürütücü adaptörü + "Claude çıktı" tatbikatı.** agy planlayıcı, ACP üzerinden yürütücü. Kabul: bir Epic Claude'a hiç dokunmadan biter.
4. **Panel dondurma ve küçültme.** Orca'ya devredilen ekranlar kaldırılır.

## Güncelleme yolu (teknoloji değişince)
- Epic 27 radarı yalnız proje izlemesin, **katman başına aday** izlesin: bu tablodaki adayların sürüm, lisans ve kapanma durumu. vibe-kanban'ın kapanması tam bu riskin örneği.
- Bir aday değişince tabloda yalnız o satır güncellenir. Adaptör arayüzü sabit kaldığı sürece çekirdek değişmez.

## Kaynaklar
- [stablyai/orca](https://github.com/stablyai/orca); orchestration CLI (`docs/site/content/docs/cli/orchestration.mdx`, koddan okundu)
- [Fowler: Harness engineering](https://martinfowler.com/articles/harness-engineering.html), [Osmani: Agent harness engineering](https://addyosmani.com/blog/agent-harness-engineering/)
- [n8n: build with AI](https://docs.n8n.io/connect/workflow-sdk/build-with-ai)
- [vibe-kanban kapanış](https://vibekanban.com/blog/shutdown)
- [OpenRouter vs LiteLLM](https://openrouter.ai/blog/insights/openrouter-vs-litellm/)
- [ACP](https://zed.dev/acp), [ACP deposu](https://github.com/agentclientprotocol/agent-client-protocol)
- [spec-kit](https://github.com/github/spec-kit)

Antigravity raporundaki düzeltmeler:
- spec-kit yıldızı ~85 bin denmiş, `gh api`'ye göre 151 bin.
- Pano için vibe-kanban önerilmiş, ama pano özelliği Nisan 2026'da kaldırıldı.
- Abonelik sınır rakamları doğrulanmadı.
