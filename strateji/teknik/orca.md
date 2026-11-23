 ● Copilot Fusion selected GPT-6 Luna because it was the best choice out of the models available in
   your plan.

 ✗ Shell Check repositor… Permission to run this tool was denied due to the following rules: `shell`
   git status --short --branch

 / Search "**/package.json" 29 files found

 / Search "**/*README*" 55 files found

 / Search "LICENSE*" 6 files found

 / Search "*" 34004 files found

 {} Read package.json too large, not read

 ● Read LICENSE 21 lines read

 MD Read README.md L1:200 (200 lines read)

 / Search "src/**/*{mcp,cli,plugin}*" 1402 files found

 / Search "src/main/**/*{worktree,orchestrat,agent,provider,usage,token,quota}*" 1800 files found

 / Search "orchestrat|worker agent|worktree create|merge.*worktree" (docs/site/src, … 66 files found

 / Search "MCP server|mcp.*tool|JSON-RPC|HTTP.*API|CLI command|usage.*token|cost es… 149 files found

 / Search "src/main/cli/**/*{orchestrat,worktree,worker,agent}*" No matches found

 / Search "src/main/{bots,git/worktrees,providers}/**/*{orchestrat,worker,merge,lock… 11 files found

 / Search "docs/site/src/content/docs/{cli,model,bots}/**" No matches found

 / Search ""bin"|"scripts"|"orca"" (package.json) 14 lines found

 / Search "orchestration|worker|worktree|merge|acceptance criteria|test gate" in *.… 417 files found

 / Search "docs/site/src/**/*{cli,orchestration,worktree,bots}*" No matches found

 / Search "docs/site/**/*{orchestration,worktrees,cli}*.md*" 5 files found

 / Search "src/cli/**/*" 535 files found

 TS Read src/cli/specs/orchestration-gate-specs.ts 30 lines read

 TS Read src/cli/specs/orchestration.ts 281 lines read

 TS Read src/cli/specs/worktree-create.ts 74 lines read

 TS Read src/cli/specs/index.ts 98 lines read

 MX Read docs/site/content/docs/cli/orchestration.mdx 221 lines read

 MX Read docs/site/content/docs/model/worktrees.mdx 148 lines read

 / Search "MCP server|mcp server|MCP tools|Model Context Protocol|external.*API|REST … 8 lines found

 / Search "src/main/cli/specs/*mcp*" No matches found

 / Search "docs/site/content/docs/bots/*.mdx" No matches found

 / Search "docs/site/content/docs/plugins/*.mdx" No matches found

 / Search "docs/site/content/docs/cli/overview.mdx" 1 file found

 MX Read docs/site/content/docs/cli/overview.mdx 127 lines read

 TS Read src/main/claude/structured/launch/claude-structured-provider-fallback.ts 279 lines read

 TS Read src/main/claude/structured/journal/claude-usage-limits.ts 252 lines read

 TS Read src/main/bots/bot-item-usage-limit-wait.ts 243 lines read

 TS Read src/main/usage/reporting/token-usage/agent-token-usage-reporter.ts 198 lines read

 / Search "MCP server|mcp-server|MCP tools|rest|HTTP API|WebSocket" (docs/site/conte… 51 lines found

 TS Read src/main/cli/index.ts Path does not exist

 / Search "sequential|fallback|rate limit|usage limit|model fallback|OpenCode" in *.… 16 lines found

 / Search "src/renderer/src/**/*{usage,token,cost}*" 107 files found

 / Search "src/main/**/*{usage,cost,quota}*.ts" 140 files found

 / Search "docs/site/content/docs/**/*{usage,token,cost,model}*.mdx" 1 file found

 MX Read docs/site/content/docs/agents/usage-tracking.mdx 55 lines read

 MX Read docs/site/content/docs/cli/skills.mdx L165:205 (17 lines read)

 TS Read src/cli/runtime/connection/transport.ts 272 lines read

 TS Read src/main/codex-usage/codex-usage-cost-estimate.ts 54 lines read

 / Search "docs/site/content/docs/**/*plugin*.mdx" No matches found

 / Search "src/main/runtime/rpc/methods/**/*orchestrat*" 7 files found

 TS Read src/cli/orchestration/workers/worker-launch-handler.ts 159 lines read

 TS Read src/main/git/worktrees/creation/worktree-preparation-lock.ts 158 lines read

 TS Read src/cli/specs/orchestration-worker-specs.ts 203 lines read

 TS Read src/main/runtime/rpc/methods/orchestration/orchestration.ts 34 lines read

 / Search "test command|test gate|gate.*test|run tests|setup hook|merge" (docs/site/c… 4 lines found

 / Search "docs/site/content/docs/**/plugin*.mdx" No matches found

**Sonuç:** MDK, Orca’yı özellikle worktree, ajan çalıştırma, paralel görev takibi ve yerel arayüz katmanlarında kullanabilir. Fakat MDK’nın “Story ancak test geçerse tamamlanır; başarısızsa sonraki modele geç; işleri sırayla birleştir” akışı Orca’da hazır bir uçtan uca politika olarak doğrulanamadı. En uygun yaklaşım, Orca CLI’sini kullanan ince bir MDK adaptörü; test ve model geçiş kurallarını MDK’da tutmak.

**1) Depo ne yapıyor?** Orca, ajan CLI’larını bir IDE içinde çalıştırıyor; Git worktree’leri yönetiyor ve çoklu ajan görevlerini koordine ediyor. `docs/site/content/docs/cli/orchestration.mdx` Run/Task/Dispatch, worker, mesaj ve karar kapılarını; `src/cli/specs/orchestration.ts` ile `src/cli/specs/orchestration-worker-specs.ts` bunların CLI komutlarını tanımlıyor. `src/main/git/worktrees/creation/worktree-preparation-lock.ts` içindeki `lockWorktreePreparation()` worktree hazırlığı için kilit sağlıyor. `docs/site/content/docs/model/worktrees.mdx` GUI’de worktree oluşturma, çalışma, inceleme ve gönderme akışını açıklıyor.

**2) MDK katmanlarıyla eşleşme**

| Katman | Karşılık |
|---|---|
| Yürütücü adaptörleri | **Evet, kısmen.** Orca çok sayıda ajanı destekliyor; worker `--agent` ile OpenCode’u seçebilir. OpenCode’da model seçimi mevcut worktree, doğrulanmış CLI ve model uygunluğu koşullarına bağlı (`src/cli/specs/orchestration-worker-specs.ts`). |
| Model/kota | **Kısmen.** Bazı ajanlarda çalıştırma başına model seçimi; sağlayıcı hesabı ve kota kullanımı takibi var. Merkezi kota tahsisi veya hata sonrası otomatik “sonraki modele geç” akışı doğrulanamadı. |
| Test kapısı | **Bulunamadı.** `gate-create`/`gate-resolve`, test sonucu değil koordinatör kararı bekletiyor. `worker_done` işçinin bildirimine dayanıyor; zorunlu test komutu çalıştırma şartı görünmüyor (`docs/site/content/docs/cli/orchestration.mdx`). |
| Worktree/paralellik/birleştirme | **Worktree ve paralel worker: evet.** `worker-start` yeni worktree açabiliyor. **Sıraya alınmış otomatik birleştirme: doğrulanamadı.** `merge_ready` bir mesaj türü; sıralı merge kuyruğu olduğuna tek başına kanıt değil. |
| Pano | **Kısmen.** Orca’nın masaüstü GUI’si worktree’leri, ajanları ve diff incelemesini gösteriyor. MDK’nın istediği ayrı Kanban/koşu panosu doğrulanamadı. |
| Maliyet kaydı | **Kısmen/evet.** Sağlayıcı bazlı kullanım görünümü, token geçmişi ve worktree ilişkilendirmesi mevcut; `src/main/codex-usage/codex-usage-cost-estimate.ts` içindeki `estimateCostUsd()` tahmin yapıyor. Dokümantasyon, fiyatın yerel tabloya dayandığını ve sağlayıcı faturası olmadığını belirtiyor (`docs/site/content/docs/agents/usage-tracking.mdx`). |

**3) Dışarıdan programla sürme:** **CLI var:** `package.json` içindeki `orca` binary’si; işlevler `src/cli/specs/` altında tanımlı. **API:** CLI, `src/cli/runtime/connection/transport.ts` içindeki `sendRequest()` ile kimlik doğrulamalı yerel runtime taşımasını kullanıyor; bunun desteklenen, kararlı bir genel API olduğu doğrulanamadı. **MCP:** `docs/site/content/docs/cli/skills.mdx` MCP’yi ajanlara harici araç sunma olarak anlatıyor; Orca’yı MCP üzerinden kontrol etme sunucusu doğrulanamadı. **Eklenti:** `src/cli/specs/plugin.ts` ve `src/main/ipc/plugins/plugins.ts` eklenti altyapısını işaret ediyor; eklentinin tam görev-orkestrasyon adaptörü olduğu doğrulanamadı.

**4) Eksikler ve öneri:** MDK, Epic/Story ve kabul şartı üretimini, test kapısını, başarısızlıkta model değiştirmeyi ve sıralı merge politikasını kendisi işletmeli; Orca CLI’siyle worktree/worker başlatıp sonuçları izlemeli. **5) Lisans:** `LICENSE` — MIT.

