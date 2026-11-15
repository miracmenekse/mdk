# Teknik inceleme özeti: başkaları neyi bizden iyi çözmüş?

Tarih: 2026-11-15. Altı depo GitHub Copilot CLI ile salt okuma kipinde incelendi (depo başına bir sayfa bu klasörde). Soru pazar değil teknik: mdk'nin sorunlu alanlarında alınabilecek çözüm var mı?

**Sınama (Claude):** Copilot'un verdiği dosya yolları var. Koddan doğrulananlar: Aider yeniden deneme sayıları (`aider/models.py:26,1045,1073`); claude-code-router bekleme sabitleri (`retry-policy.ts:5-7`: 1 sn taban, 30 sn tavan, Retry-After en çok 60 sn); agent-kanban kendi işini onaylama yasağı (`taskReviewDecisionAuthority.ts:14`); agent-kanban ve `dyad/src/pro` lisansı FSL. Copilot'un bir yanlışı yakalandı (Aider'da "deneme sınırı yok" dedi; `max_reflections = 3` var). Diğer ayrıntılar sınanmadı: bir fikri Epic'e çevirmeden önce ilgili dosya okunmalı.

## Alınmaya değer fikirler (öncelik sırasıyla)

| # | Fikir | Kimden | mdk'de çözdüğü sorun | Zorluk | Lisans |
|---|---|---|---|---|---|
| 1 | **Sağlayıcı hatasını sınıflandır, türüne göre davran**: oran sınırı/zaman aşımı/5xx → sınırlı üstel bekleme ile aynı modeli yeniden dene (`Retry-After`'a uy); kimlik/kota bitti/model yok → beklemeden sıradaki modele geç; her denemeyi ve nedenini kaydet | claude-code-router, Aider, dyad | Ücretsiz kota dolunca OpenCode sessizce bekliyor (`yanit_yok`, çıkış 6); bugün tek ayrım "sessiz kaldı mı" | orta | MIT / Apache-2.0 |
| 2 | **Hata iletisini eyleme çevir**: "anahtar geçersiz", "kota doldu, şu saatte açılır", "ağ yok" ayrı iletiler ve her birinde önerilen adım | dyad (`classifyValidationError`) | Teknik olmayan kullanıcı çıkış kodundan ne yapacağını anlamıyor | küçük/orta | Apache-2.0 |
| 3 | **Rol → model katmanı profilleri**: model adını adıma değil role (hızlı/kod/inceleme/akıl yürütme) bağla; hazır profil ("yalnız ücretsiz", "Claude Pro'm var") seç | opencode-orchestrator-kit (`tiers.ts`) | `Görev <tür>:` satırları elle sıralı liste; abonelik seçme ekranı yok | küçük | MIT |
| 4 | **Kurulum sihirbazı + yönetilen çalışma zamanı**: önce çalışan başlangıç akışı, gelişmiş ayarlar ayrı; Node'u uygulamanın indirip sağlama toplamıyla doğrulaması | claude-code-router (onboarding), dyad (`managed_node.ts`) | Terminalsiz kurulum (ertelenenler listesinde 2. madde) | büyük | MIT / Apache-2.0 |
| 5 | **Başarısız test çıktısını ayıklayıp geri ver**: komut + çıktı açıkça modele; uzun çıktı kırpılmış hata raporuna | Aider (`cmd_test`), dyad (yapılandırılmış tanı) | Deneme başarısız olunca sonraki denemeye verilen ipucunun kalitesi | orta | Apache-2.0 |
| 6 | **Ajan başına bağlam bütçesi**: rol başına en çok N dosya / satır; evre başına bağlam yenileme; durum dosyada | opencode-orchestrator-kit (`context-budget.ts`), BMAD (ihtiyaç olunca yükle) | Adım başına ~100k token sabit yük; adım 7'de 730k token | orta | MIT |
| 7 | **Persona tartışmasında bağımsız ilk görüş**: ilk tur paralel ve birbirini görmeden, yanıt turu ardışık; karar insanda | BMAD (party mode) | `epic-tartis.mjs` turlarının birbirini etkilemesi | orta | MIT (BMAD adı marka) |
| 8 | **Testi yalıtılmış kopyada koştur** (git worktree) ve her adımı geri alınabilir checkpoint yap | dyad (`git_overlay_workspace.ts`, `revertVersionHandler`) | Paralel koşuda çakışma (çıkış 9); geri alma | orta/büyük | Apache-2.0 |
| 9 | **Depo haritası**: sembol/bağımlılık haritası, önem sıralı, token bütçeli | Aider (`repomap.py`) | Modelin dosya aramakla istek harcaması; bugün `Ne:` satırına elle dosya:satır yazılıyor | büyük (tree-sitter bağımlılığı, "bağımlılık yok" kuralına ters) | Apache-2.0 |

Öneri: 1 ve 2 birlikte tek Epic ("sağlayıcı hataları"); en sık yaşanan gerçek sorun ve kullanıcıya en görünür olan. 3, ertelenen "abonelik seçme" fikrine temel olur.

## mdk'nin onlardan iyi yaptığı (incelenen altı depoda yok ya da doğrulanamadı)
- **Zorunlu test kapısı + ucuzdan pahalıya model merdiveni**: altısında da yok. Aider testi isteğe bağlı koşar; orchestrator-kit yalnız tek adımlık inceleme yükseltmesi yapar.
- **Kapı dosyasını koruma** (model testi değiştirerek geçemez): Aider'da engel yok.
- **Bağımlılıksız yerel panel**: dyad Electron, agent-kanban Cloudflare'e bağlı, CCR'nin arayüzü var ama görev/kapı durumu yok.
- **Persona tartışmasından çözüm ve story listesi çıkarma**: BMAD tartıştırır ama uzlaşı üretmez.

## Lisans uyarısı
- **agent-kanban** ve **`dyad/src/pro`**: FSL-1.1 — "rakip kullanım"da kod almak yasak; mdk benzer işlevli sayılabilir. Bu ikisinden **yalnız fikir al, kod alma**.
- MIT / Apache-2.0 olanlardan kod alınırsa lisans ve telif bildirimi korunmalı.

## Maliyet ve yöntem
Depo başına Copilot ile ~1 dakika, ilk inceleme 0,66 AI kredisi. Yöntem: sığ klon → `copilot -p <istem> --deny-tool shell --deny-tool write`; istem mdk'nin sorunlu alanlarını ve "dosya/işlev adı ver, emin değilsen doğrulanamadı yaz" şartını içerir. Radar bir depoyu "değişti" diye işaretlediğinde aynı yöntemle yeniden incelenebilir.
