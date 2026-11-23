# Orca (stablyai/orca) teknik inceleme

Tarih: 2026-11-23. GitHub Copilot CLI, salt okuma, sığ klon. Claude sınaması: `orca orchestration worker-start`, `gate-create`, `--retry-of` `docs/site/content/docs/cli/orchestration.mdx` içinde var; lisans MIT (`LICENSE`).

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

