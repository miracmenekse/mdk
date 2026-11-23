 ● Copilot Fusion selected GPT-6 Luna because it was the best choice out of the models available in
   your plan.

 / Search "worktree|OpenCode|MCP|mcp|token|cost|quota|parallel|executor|plugin|API|… 100 files found

 / Search "src/**/*.py" 308 files found

 / Search "**/*{mcp,cli,workflow,agent,integration,task,template}*" 162 files found

 / Search "*" 1069 files found

 ✗ Shell Check worktree … Permission to run this tool was denied due to the following rules: `shell`
   git status --short && printf '\nRoot entries:\n' && ls -a

 MD Read README.md L1:180 (180 lines read)

 MD Read docs/overview/core.md 181 lines read

 MD Read docs/reference/agentic-sdd.md 158 lines read

 YM Read workflows/speckit/workflow.yml 80 lines read

 MD Read docs/overview/mcp.md 140 lines read

 MD Read docs/integrations/opencode.md 61 lines read

 MD Read design/workflow-step.md 157 lines read

 TM Read pyproject.toml 98 lines read

 MD Read design/integration.md too large, not read

 MD Read docs/workflows/api.md L1:220 (220 lines read)

 MD Read docs/workflow-steps/types.md L1:220 (220 lines read)

 MD Read docs/workflows/cli.md 346 lines read

 ● Read LICENSE 21 lines read

 MD Read templates/spec-template.md 131 lines read

 MD Read templates/tasks-template.md 252 lines read

 / Search "git worktree|worktree|dashboard|token usage|token count|cost tracking|quo… 51 lines found

 MD Read docs/how-to/spec-of-specs.md 171 lines read

 PY Read src/specify_cli/integrations/opencode/__init__.py 494 lines read

 PY Read src/specify_cli/workflows/step/gate/__init__.py 375 lines read

 PY Read src/specify_cli/workflows/step/fan_out/__init__.py 105 lines read

 PY Read src/specify_cli/mcp_server/server.py L1:220 (100 lines read)

 / Search "fan-out|concurrency|max_concurrency|parallel" (docs/workflow-steps/types.… 33 lines found

**Sonuç:** Spec Kit, MDK’nın **şartname → plan → görev → ajanla uygulama** bölümünü karşılayabilir; fakat MDK’nın koşu orkestrasyonu, test zorunluluğu, worktree/merge yönetimi, pano ve maliyet katmanının yerine geçmez. En uygun kullanım, Spec Kit’i iş tanımı ve ajan komutları için kullanıp bu eksik katmanları MDK’da tutan ince bir adaptördür.

1. **Depo ne yapıyor?** `README.md` süreçleri üç grupta tanıtıyor: yerleşik SDD, ayrıca kurulabilen bug-fix ve idea-assessment süreçleri, bir de özelleştirilebilir workflow’lar. SDD’de `/speckit.specify` gereksinim ve kullanıcı hikâyeleri; `/speckit.plan` teknik tasarım; `/speckit.tasks` bağımlılık sıralı görevler üretir; `/speckit.implement` uygular, `/speckit.converge` eksikleri kontrol eder (`docs/reference/agentic-sdd.md`). Süreç tanımı ve koşu yürütümü `workflows/`, genişletilebilir entegrasyonlar `src/specify_cli/integrations/` altındadır.

2. **MDK katmanlarıyla eşleşme:**
   - **Yürütücü adaptörleri:** Var. `src/specify_cli/integrations/opencode/__init__.py` dâhil birçok ajan entegrasyonu ve workflow `command`/`prompt` adımları var. Workflow adımı `model` parametresi alabilir.
   - **Model/kota:** Kısmi. Belirli bir modeli seçip ajana iletebilir; **otomatik ucuz model seçimi, kota izleme veya hata sonrası sıradaki modele geçiş** doğrulanamadı.
   - **Test kapısı:** Kısmi. `shell` adımı test komutu çalıştırabilir; `gate` insan onayı/ret kapısıdır (`src/specify_cli/workflows/step/gate/__init__.py`). Ancak her story için testin zorunlu çalışıp geçmesini sağlayan varsayılan bir kapı yok; `templates/tasks-template.md` test görevlerini isteğe bağlı sayıyor.
   - **Worktree/paralellik/merge:** Yerleşik worktree, kilit ve sırayla birleştirme yok. `fan-out` sınırlı eşzamanlı adım çalıştırabiliyor (`src/specify_cli/workflows/step/fan_out/__init__.py`), ama kendi başına worktree izolasyonu veya merge yapmaz. `docs/how-to/spec-of-specs.md` bağımsız parçaları paralel geliştirmek için worktree’leri öneriyor; bunları yönetmiyor.
   - **Pano:** Yerleşik yerel/web pano doğrulanamadı. CLI koşu durumu sunar; `specify workflow status [<run_id>]` listeleme ve JSON çıktı sağlar. Topluluk kataloğundaki pano/eklenti referansları çekirdeğe dâhil değil.
   - **Maliyet kaydı:** Token ve para maliyetini kaydetme doğrulanamadı. Adım çıktısını yakalama ve koşu durumunu saklama, kullanım/maliyet muhasebesi değildir.

3. **Programla sürülebilir mi?** CLI evet: `specify workflow run <source> --json`, `resume`, `status --json` ve `definition --json` otomasyona uygun yüzeyler (`docs/workflows/cli.md`). Yerel YAML workflow çalıştırılabilir. Eklenti olarak Python workflow adımı eklenebilir (`design/workflow-step.md`). MCP var ama deneysel, stdio ve salt-okunur; workflow çalıştırma/kurma sunmuyor (`src/specify_cli/mcp_server/server.py`, `docs/overview/mcp.md`). Genel HTTP API doğrulanamadı.

4. **Epic/Story/Kabul eşlemesi:** Uygun. Epic’i `docs/how-to/spec-of-specs.md` içindeki manuel roadmap’e; Story’leri `templates/spec-template.md` içindeki öncelikli kullanıcı hikâyelerine; kabul şartlarını **Acceptance Scenarios** ve ölçülebilir gereksinimlere eşleyin. `templates/tasks-template.md`, görevleri `[US1]` gibi hikâyelere bağlar. Roadmap’ten alt şartnameye izlenebilirlik metinle tutulur; MDK formatından otomatik içe aktarma doğrulanamadı. Spec Kit ajan bağımsız bir süreç/şartname aracı olarak tasarlanmış; fakat uygulama için desteklenen ajan entegrasyonlarından birini çalıştırır.

5. **Lisans:** Depo kök `LICENSE` dosyasında **MIT**.

