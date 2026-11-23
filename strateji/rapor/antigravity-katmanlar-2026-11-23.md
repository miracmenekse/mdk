Bağımsız inceleme; [kullanilamazlik.md](file:///Users/mirac/mdk/strateji/kullanilamazlik.md), [ozet.md](file:///Users/mirac/mdk/strateji/teknik/ozet.md), [konum.md](file:///Users/mirac/mdk/strateji/konum.md) ve [akis.md](file:///Users/mirac/mdk/docs/akis.md) belgeleri ile 2026 itibarıyla güncel açık kaynak ekosistemi temel alınarak hazırlanmıştır.

**Kısa yanıt:** Evet, özellikle **6. (koşu/worktree)** ve **7. (pano)** katmanlarda tekerlek yeniden icat ediliyor; üretim kodunun **%66'sı** (5.972 / 8.977 satır) herkesin çözdüğü bu iki katmanda. Buna karşın MDK'nın çekirdek tezi (değiştirilemez test kapısı + ucuzdan pahalıya model merdiveni + insan onaylı şartname) pazarda tek paket olarak hâlâ boşlukta.

---

## 1. 9 Katman İçin 2026 Hazır Araç Haritası ve Karar Tablosu

*Not: Yıldız sayıları 2026 web aramalarından derlenmiştir; kesin son sürüm numaraları her depo için ayrı kontrol edilmediğinden "doğrulanmadı" olarak işaretlenmiştir.*

| # | Katman | Hazır Aday(lar) + Bağlantı | Olgunluk (Yıldız / Son Sürüm) | Lisans | Karar Önerisi | Gerekçe | Değiştirme Maliyeti |
|---|---|---|---|---|---|---|---|
| 1 | **İstek / Şartname** | [GitHub Spec Kit](https://github.com/github/spec-kit), [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Spec Kit ~84k–90k★; OpenSpec ~75k★ *(son sürüm: doğrulanmadı)* | MIT (ikisi de) | **SAR** | Şartname biçimini standartlaştırmak için Spec Kit/OpenSpec şablonları alınabilir; ancak MDK'nın `Kabul` + `Kapı` sözleşmesi ve teknik olmayan kullanıcıya dönük onay dili ince bir sarmalayıcıyla korunmalı. | Düşük |
| 2 | **Parçalama / Planlama** | [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD), [Task Master AI](https://github.com/eyaltoledano/claude-task-master) | BMAD ~55k★; Task Master ~28k★ *(son sürüm: doğrulanmadı)* | BMAD: MIT (marka korumalı); Task Master: MIT + Commons Clause | **SAR** | Task Master'ın Commons Clause lisansı ticarileşme hedefiyle ([konum.md](file:///Users/mirac/mdk/strateji/konum.md)) çakışır. BMAD'ın bağımsız paralel persona fikri alınır, ancak uzlaşı + `PLAN.md` story üretimi MDK'ya özgü kalmalı. | Orta |
| 3 | **Yürütücü (Agent Harness)** | [OpenCode](https://github.com/anomalyco/opencode), [Claude Code](https://github.com/anthropics/claude-code) / [Agent SDK](https://github.com/anthropics/claude-agent-sdk-python), [ACP](https://github.com/agentclientprotocol/agent-client-protocol), [Antigravity](https://antigravity.google/) | OpenCode ~225k★; Claude Code ~154k★; Agent SDK ~32k★; ACP ~4.7k★ *(Antigravity yıldız/sürüm: doğrulanmadı)* | OpenCode: MIT; ACP: Apache-2.0; Claude/Antigravity: Ticari/Özel | **HAZIR AL + ACP İLE SAR** | Hiçbir harness sıfırdan yazılmamalı. Teknoloji bağımsızlığı için yürütücü adaptörlerini tek tek kodlamak yerine JSON-RPC tabanlı **ACP** arayüzü benimsenmeli; OpenCode (`opencode acp`) bunu doğrudan destekliyor. | Orta |
| 4 | **Model Yönlendirme / Yedek / Kota** | [LiteLLM](https://github.com/BerriAI/litellm), [Portkey Gateway](https://github.com/Portkey-AI/gateway), [OpenRouter](https://openrouter.ai/) | LiteLLM ~63k★; Portkey ~13.4k★ *(son sürüm: doğrulanmadı)* | LiteLLM: MIT (çekirdek) + Enterprise; Portkey: MIT; OpenRouter: SaaS (%5,5 kredi ücreti, BYOK ücretsiz kota içi) | **HAZIR AL** | `Retry-After`, sağlayıcı hatası sınıflandırma ve model fallback ([ozet.md](file:///Users/mirac/mdk/strateji/teknik/ozet.md) #1) çözümü olgun. Yerel/Node uyumu için Portkey Gateway (TypeScript) veya bulutta OpenRouter/LiteLLM kullanıp `mdk-hata.mjs` içindeki özel mantık silinmeli. | Düşük |
| 5 | **Kalite Kapısı (Test + Hakem)** | [Lefthook](https://github.com/evilmartians/lefthook), [PR-Agent](https://github.com/The-PR-Agent/pr-agent), [Promptfoo](https://github.com/promptfoo/promptfoo) | Lefthook ~9k★; PR-Agent ~16.5k★; Promptfoo ~26k–28k★ *(son sürüm: doğrulanmadı)* | Lefthook/Promptfoo: MIT; PR-Agent: Apache-2.0 | **KENDİN YAZ** | MDK'nın asıl farkı burada: önce kırmızı test commit'i, test dosyasına kurcalama koruması, kapı sonrası regresyon ve ucuzdan pahalıya eskale. Hazır araçlar bunu tek döngüde vermiyor; kod da küçük (622 satır). | Yüksek (çekirdek değer) |
| 6 | **Koşu Düzeni / Durum / Worktree** | [Orca](https://github.com/stablyai/orca), [Vibe Kanban](https://github.com/BloopAI/vibe-kanban), [n8n](https://github.com/n8n-io/n8n), [Temporal](https://github.com/temporalio/temporal), GitHub Actions | Orca ~132k★; Vibe Kanban ~28k★; n8n ~211k★; Temporal ~24.6k★ *(son sürüm: doğrulanmadı)* | Orca: MIT; Vibe Kanban: Apache-2.0; Temporal: MIT; n8n: SUL (kaynak-erişilebilir, kısıtlı) | **HAZIR AL** | n8n (SUL lisansı, görsel webhook odaklı) ve Temporal (ağır sunucu yükü) kişisel yerel geliştirme için yanlış. Worktree + paralel ajan yönetimi için **Orca** veya **Vibe Kanban** doğrudan bu sorunu çözüyor; `mdk-paralel`/`mdk-dagit` yükünü kaldırır. | Orta-Yüksek |
| 7 | **Pano Arayüzü** | [Vibe Kanban](https://github.com/BloopAI/vibe-kanban), [Orca](https://github.com/stablyai/orca), [Plane](https://github.com/makeplane/plane) | Vibe Kanban ~28k★; Orca ~132k★; Plane ~62k★ *(son sürüm: doğrulanmadı)* | Vibe Kanban: Apache-2.0; Orca: MIT; Plane: AGPL-3.0 | **HAZIR AL** | `panel/*.mjs` 4.487 satırla tüm bakım yükünün yarısı. Plane (AGPL + ağır) gereksiz. Ajan-odaklı yerel pano için Vibe Kanban (Apache-2.0) veya Orca (MIT) seçilmeli; özel onay ekranı gerekirse mevcut panel 10 kat küçültülüp sadece "onay kartı"na indirgenmeli. | Orta |
| 8 | **Maliyet / Metrik** | [ccusage](https://github.com/ryoppippi/ccusage), [Langfuse](https://github.com/langfuse/langfuse) | ccusage ~19.5k★; Langfuse ~37k★ *(son sürüm: doğrulanmadı)* | ccusage: MIT; Langfuse: MIT (çekirdek) + EE | **HAZIR AL + İNCE SAR** | `panel/claude.mjs` yalnız Claude oturumlarını okuyor. `ccusage` zaten Claude Code, OpenCode, Codex ve Gemini yerel loglarını tek yerde topluyor. MDK yalnız story-başına `metrikler.jsonl` (164 satır) eşlemesini tutmalı. | Düşük |
| 9 | **Kural Eşitleme** | [AGENTS.md](https://agents.md/), [Ruler](https://github.com/intellectronica/ruler), [Rulesync](https://github.com/dyoshikawa/rulesync) | Ruler ~3k★ *(Rulesync yıldız/sürüm: doğrulanmadı; AGENTS.md: Linux Foundation AAIF standardı)* | Ruler/Rulesync: MIT | **HAZIR AL** | `AGENTS.md` 2026'da fiili standart oldu. `mdk-esitle.mjs` (49 satır) yerine kökte `AGENTS.md` + araç-özel dağılım için `ruler` veya `rulesync` kullanmak sıfır bakım maliyeti sağlar. | Düşük |

---

## 2. Kritik Soruların Yanıtları

### (a) MDK'nın gerçekten farklı olduğu yer neresi?
[kullanilamazlik.md](file:///Users/mirac/mdk/strateji/kullanilamazlik.md) ve [ozet.md](file:///Users/mirac/mdk/strateji/teknik/ozet.md) verileri net bir ayrım gösteriyor: MDK'nın benzersiz değeri **yalnızca ~1.750 satırlık çekirdekte**:
1. **Kurcalanamaz zorunlu test kapısı + regresyon:** Model testi yazıp geçemez; kırmızı test önce kilitlenir, kod yazılırken kapı dosyasına dokunulursa işlem iptal edilir.
2. **Ekonomik eskale merdiveni:** İşi önce ucuz/hızlı yürütücüye verip, deterministik kapı kırıldığında bağlamla birlikte üst modele tırmandırma ("ölüm döngüsünü" kesen mekanizma).
3. **Sözleşme odaklı insan onayı (`Kabul` + `Kapı`):** Teknik olmayan veya yarı teknik kullanıcının kodu değil, beklenen davranışı onaylaması.

Orca, Vibe Kanban, Aider ve Dyad bu üçlüyü tek akışta birleştirmiyor. Geri kalan her şey (worktree kilidi, retry-after, depo haritası, 4.500 satırlık pano) emtia hâline gelmiş durumda.

### (b) En çok bakım yükü olan katmanı neyle değiştirmeli?
Açık ara en büyük yük **Katman 7 (Panel: 4.487 satır, %50 kod, 80+ test, 113 commit)** ve ona yapışık **Katman 6 (Koşu/Worktree: 1.485 satır)**.

**Somut öneri:**
- **Kısa vade (kişisel kullanım):** Özel paneli (`panel/ciz.mjs`, `panel/sunucu.mjs`) dondurup silin; paralel ajan + worktree + görev panosu için **[Vibe Kanban](https://github.com/BloopAI/vibe-kanban)** (Apache-2.0, ticari dostu) veya **[Orca](https://github.com/stablyai/orca)** (MIT) kullanın. Maliyet/token takibini `panel/claude.mjs` yerine **[ccusage](https://github.com/ryoppippi/ccusage)** ile alın.
- **MDK'nın yeni rolü:** MDK bir "monolitik uygulama + web sunucusu" değil, Vibe Kanban/Orca'nın her kartta çalıştırdığı **ince bir CLI/MCP kalite kapısı motoru** (`mdk-kapi` + `mdk-eskale` + `metrikler.jsonl`) olmalı. Böylece kod tabanı ~9.000 satırdan ~2.000 satıra iner ve bakım yükü %75 düşer.

### (c) Ücretsiz-kota bağımlılığını çözecek pratik maliyet politikası
[kullanilamazlik.md](file:///Users/mirac/mdk/strateji/kullanilamazlik.md) gösteriyor ki başarısızlıkların ana kaynağı yazılım hatası değil **ücretsiz kota tükenmesi (42 olay)** ve **adım başına aşırı bağlam (55k–110k+ token)**. Çözüm, ücretsiz modelleri ana akıştan çıkarıp eldeki 4 aboneliği **rol ve pencere bazlı** orkestre etmektir:

| Rol / İş Türü | Birincil Abonelik | Yedek (Failover) | Politika / Sınır |
|---|---|---|---|
| **1. Planlama, Şartname, Mimari & Zor Eskale** | **Claude Pro** ($20/ay; [5 saatlik kayan pencere + haftalık tavan](https://claude.com/)) | **Google AI Pro / Antigravity** ($19,99/ay; [5 saatlik yenileme + haftalık tavan](https://antigravity.google/)) | İki abonelik birbirinin 5 saatlik penceresini dengeler. Biri 429/limit verdiğinde beklemeden diğerine geçilir (ortak `AGENTS.md` sayesinde bağlam kaybı olmaz). |
| **2. Rutin Story Kodlama & Kapı Yazımı** | **OpenCode Go** ($10/ay; [aylık havuz, 5 saatte %20 / haftada %50 hız sınırı](https://opencode.ai/)) | **OpenRouter** (BYOK veya $5–10/ay emniyet kredisi, [otomatik sağlayıcı failover](https://openrouter.ai/)) | En çok 2 deneme. 2 denemede kapı geçilmezse ucuz modelde ısrar etme, doğrudan Rol 1'e eskale et. |
| **3. Salt-Okuma İnceleme, Radar, Hızlı Hakem, Autocomplete** | **GitHub Copilot Öğrenci** ($0; sınırsız autocomplete + [ayda 200 AI kredisi, otomatik model seçimi](https://github.com/education/students)) | **Antigravity Bireysel/Pro** (Gemini Flash havuzu) | `mdk-radar`, diff ön-inceleme ve küçük dosya taramaları buraya alınır; pahalı 5 saatlik Claude/Go pencereleri tüketilmez. |
| **4. Ücretsiz API Modelleri** | **Ana akışta YASAK** | — | Yalnızca acil olmayan yan işler (persona taslakları, deney). Ana story akışında kota hatasında `yanit_yok` beklenmez. |

**Politikanın işlemesi için 3 zorunlu kural:**
1. **Bağlam diyeti:** Her `opencode run` adımında 55–110k token yakmak OpenCode Go'nun 5 saatlik %20 kotasını hızla bitirir. Adım başına bağlam tavanı (ör. ≤35k token) ve oturum yenileme zorunlu olmalı.
2. **Fail-fast yönlendirme:** Kota/402/429 hatasında beklemek yerine [Portkey Gateway](https://github.com/Portkey-AI/gateway) veya [OpenRouter](https://openrouter.ai/) üzerinden anında sıradaki aboneliğe/krediye geçilmeli.
3. **Gerçek maliyet muhasebesi:** `0,56 $` gibi yanıltıcı API rakamları yerine `ccusage` ile tüm aboneliklerin (Claude + Antigravity + OpenCode + Copilot) eşdeğer token tüketimi tek yerde ölçülmeli.
