# Teknik inceleme: bmad-code-org/BMAD-METHOD

Tarih: 2026-11-15. İnceleyen: GitHub Copilot CLI (salt okuma; kabuk ve yazma araçları kapalı), deponun sığ kopyası üzerinde. Dosya yollarının varlığı ve aşağıda `ozet.md`'de sayılan iddialar Claude tarafından koddan sınandı; geri kalanı sınanmadı.

---

## A) Persona/rol dosyaları ve bağlam

- **Mekanizma:** Agent kimliği ve çalışma kuralları `skills/method/bmad-agent-dev/SKILL.md` içinde; özelleştirilebilir alanlar `skills/method/bmad-agent-po/customize.toml` gibi dosyalarda `[agent]` altında. `config_utils.py::load_customization` temel, takım ve kullanıcı TOML’lerini birleştiriyor: tablolar derin birleştirilir, `code`/`id` ile anahtarlanan tablo dizilerinde eşleşen kayıt değiştirilir. `roster.py::collect` ve `resolve_party.py::build_collective` yüklü agent’ları, misafirleri ve özel personaları topluyor.
- **Somut ayrıntı:** Agent yönergeleri Markdown; rol/persona ve menüler TOML. `persistent_facts` yazı veya `file:` yolu/globu olabilir. `bmad-agent-dev/SKILL.md`, önce ticket’ı tam okumayı, `sources` içeriğinin ticket’ta özetlendiğini ve `companions` dosyalarını yalnız ihtiyaç varsa açmayı söyler. `bmad-party-mode/scripts/resolve_party.py::group_menu` menüde yalnız grup adı/sayısını verir; `group_detail` seçilen grubun persona ayrıntılarını ve sahne yönergesini yükler.
- **mdk’ye taşıma:** Rol tanımını, takım/kullanıcı override’larını ve ihtiyaca göre bağlam yüklemeyi ayrı katmanlar yap — **orta**.

## B) El değiştirme, tartışma, uzlaşı

- **Mekanizma:** `skills/core-tools/bmad-party-mode/SKILL.md` akışı yönlendirir; gerçek tur protokolü `references/mode-subagent.md` ve `mode-auto.md` içinde. `resolve_party.py::build_collective` üyeleri kurar, `group_detail` aktif grubu çözer. Bunlar agent runtime’ı değil, orkestratörün izleyeceği yönergeler.
- **Somut ayrıntı:** `session` tek modelle tüm sesleri canlandırır; `auto` yalnız bağımsız düşüncenin fark yaratacağı turlarda agent çağırır; `subagent` her esas turda persona başına agent çalıştırır. İlk görüşler paralel, yanıt/rebuttal isteniyorsa ardışık; her üyeye oda konuşmasının tamamı verilir. Agent-team kalıcıdır ve Claude Code’a özgü. **Oylama/eşik/otomatik uzlaşı yok:** Anti-Consensus Club açıkça kararın insanda kaldığını söyler.
- **mdk’ye taşıma:** Tur bağlamını herkese eşit verip, bağımsız görüşleri ve ardından yanıtları ayrı aşamalara böl — **orta**.

## C) Story, kabul ölçütleri ve kalite kapıları

- **Mekanizma:** `skills/method/bmad-agent-po/assets/ticket-template.md` story biçimini; `references/ticket.md` oluşturma/refine kurallarını; `references/validate-checks.md` ticket/set/tree denetimlerini tanımlar. `tickets.py::load_tree`, `cmd_next`, `cmd_find` ağacı ve uygun işleri çözer. `skills/method/bmad-build/plan-template.md`, uygulama planı ve doğrulama komutlarını tutar; `step-03-implement.md` doğrulamayı, `step-04-review.md` inceleme ve düzeltme akışını yürütür.
- **Somut ayrıntı:** Story frontmatter’ında YAML alanları (`id`, `type`, `parent`, `sources`, `companions`, `after`, `refined`, `risk`); ölçütler `Requirements` altında Given/When/Then biçiminde, kural ve hata yolunu belirterek yazılır. Plan komutları başarısızsa iş bitmemiş sayılır; review düzeltmeleri sonrası doğrulama yeniden koşar. Intent/plan loopback sınırı **5**, aşılırsa durur. `tickets.py` için PyYAML `>=6.0.2,<7` gerekir; setup Python 3.11+ (`tomllib`), Node/npm ve Git Skills CLI için gerekir.
- **mdk’ye taşıma:** Story ölçütlerini çalıştırılabilir plan kapısına bağla; hata, engel ve yeniden deneme durumlarını makinece okunur tut — **orta**. Bu depoda senin tarif ettiğin model-merdiveni retry mekanizması **yok**; retry sayısı aynı/sonraki model seçimiyle bağlı değil.

## D) Kurulum ve araç uyarlaması

- **Mekanizma:** `docs/start/install-bmad.md` kurulumu Skills CLI ile yapar; `setup.py::materialize_bmad` ve `stage_bmad` `_bmad/` çalışma zamanını hazırlayıp atomikçe yerleştirir. `docs/reference/skills-and-agents.md` araçlara göre skill dizinlerini listeler.
- **Somut ayrıntı:** Claude Code `.claude/skills/`; Cursor, Windsurf, Codex ve çoğu araç `.agents/skills/` kullanır. Copilot için repo `.github/copilot-instructions.md` yönergelerinden söz eder ama skills dizini uyarlaması tabloda doğrulanamadı. OpenCode için doğrudan destek/özel adaptör depoda **doğrulanamadı**. `agent-team` yalnız Claude Code; diğer party modları harness yeteneğine bağlı ve yoksa düşüş yapar.
- **mdk’ye taşıma:** Ortak tanımları koruyup araç başına küçük adaptör ve açık yetenek/fallback bildirimi kullan — **orta**.

**mdk’nin alması gereken en değerli 3 fikir:** bağlamı seçime kadar yüklememek; plan/ticket durumunu dosyada makinece okunur saklamak; her işi gereksinim, test komutu ve inceleme kanıtına bağlamak.

**BMAD’nin mdk’den kötü yaptığı veya yapmadığı:** Node.js bağımlılıksız değil; pahalı/ucuz model basamaklandırması ve başarısız testte modele göre tekrar politikası yok; yerel durum paneli yok; tartışmadan otomatik uzlaşı çıkarmıyor.

**Lisans:** `LICENSE` MIT. Kod alıp değiştirmek/dağıtmak mümkün; lisans ve telif bildirimi kopyalanan kısımlarda korunmalı. Marka bildirimi BMAD adlarının kullanım hakkını ayrıca vermiyor.

