# Teknik inceleme: NicoGenti/opencode-orchestrator-kit

Tarih: 2026-11-15. İnceleyen: GitHub Copilot CLI (salt okuma; kabuk ve yazma araçları kapalı), deponun sığ kopyası üzerinde. Dosya yollarının varlığı ve aşağıda `ozet.md`'de sayılan iddialar Claude tarafından koddan sınandı; geri kalanı sınanmadı.

---

## A) Zorluğa göre model seçimi

- **Mekanizma:** `agents/orchestrator.md` içindeki “Routing” tablosu işi uzman rolüne göre yönlendiriyor; bu, zorluğa göre otomatik model seçimi değil. Her ajanın `model` alanındaki tier, `plugin/src/index.ts` içindeki `setup()` → `resolveTierMap()` ve `registerAgent()` ile gerçek modele çevriliyor. Kurallar `plugin/src/tiers.ts` içindeki `resolveTierMapForConfig()` işlevinde.
- **Somut ayrıntı:** Beş tier var: `TIER_FAST`, `TIER_REASONING`, `TIER_CODE`, `TIER_REVIEW`, `TIER_ROUTER`. İsteğe bağlı fallback’ler tek adım: `ROUTER→REASONING`, `REVIEW→CODE`. Hazır profiller somut modelleri sabitliyor; örneğin `opencode-go-free` profilinde reasoning/router için `beam-free`, kod için `minimax-m3.1-flash-free`. Sayısal zorluk puanı/eşiği yok. `agents/planner.md` iş boyutunu XS (<1 saat), S (1–2 saat) olarak sınıflandırıp daha büyük işleri bölüyor.
- **mdk’ye taşıma:** Uzman rolü × model tier eşlemesini profil üzerinden yapılandırma fikri taşınabilir; **küçük**.

## B) OpenCode çağrısı, bağlam ve sürdürme

- **Mekanizma:** `plugin/src/index.ts` içindeki `setup()` ajanları OpenCode 2 plugin API’sine kaydediyor. `ctx.session.prompt()` ve `ctx.session.switchAgent()` komut istemlerini mevcut oturuma iletiyor; bir `opencode` alt süreci başlatan uygulama kodu **doğrulanamadı** (repoda böyle bir çağrı yok). `agents/orchestrator.md` alt ajanları `subagent` aracıyla çalıştırmayı tarif ediyor.
- **Somut ayrıntı:** Her devir 9 bölümlü görev tanımı kullanıyor. `docs/ARCHITECTURE.md` bağlamı evre başına yenilemeyi ve `.context/progress.md` için yaklaşık **3.000 token** arşiv eşiğini anlatıyor. `scripts/context-budget.ts` JSON manifesti denetliyor: `explorer` için 8 dosya/300 çıkarılmış satır/400 satır dosya; `planner` 2 dosya/1 evre; `developer-fixer` 5 dosya/1 evre. Token tahmini `ceil(karakter/4)`; limitler varsayılan olarak zorunlu değil. `agents/orchestrator.md` aynı sınırlı işin yinelemelerinde `sessionID`’yi yeniden kullanmayı, yeni/hassas işte temiz oturum açmayı tarif ediyor. Kalıcı devam plan dosyaları ve güncel durum kaydıyla sağlanıyor; yarıda kalmış model çağrısını otomatik sürdürme **doğrulanamadı**.
- **mdk’ye taşıma:** Küçük görev özeti + evre başına bağlam sınırı + dosyada kalıcı durum üçlüsü taşınabilir; **orta**.

## C) Başarısızlıkta yükseltme ve maliyet

- **Mekanizma:** `agents/orchestrator.md` doğrulama raporunu ister ve başarısız işi aynı uzmana en çok iki kez yeniden dağıtmayı tarif eder; **başarısız testte daha pahalı modele kademeli geçiş yok**. `agents/comprehension-coach.md` içindeki retry, kod kapısı değil, geliştiricinin değişikliği anlama değerlendirmesidir.
- **Somut ayrıntı:** Anlama değerlendirmesi bir ipucu/yeniden denemeyle sınırlı. Belirsizlik, güvenlik-kritik yol veya mimari karar durumunda `TIER_REVIEW`’a **tek** yükseltme yapılabilir; zincirleme yükseltme yok. `command/research-mode.md` ölçüm kaydında `input_tokens`, `output_tokens`, `tokens_source: estimated|exact`, yeniden deneme ve ajan çağrısı alanları var. Maliyet doları hesaplama yok; `README.md` ölçüm örneği OpenCode oturum veritabanındaki girdi/çıktı/cache token sayaçlarını kullanıyor.
- **mdk’ye taşıma:** Kapı başarısızlığını sınırlı yeniden deneme ve açık yükseltme politikasıyla kaydetme fikri taşınabilir; **orta**.

## Sonuç

**mdk’nin alması gereken en değerli 3 fikir:** (1) uzman rolüne bağlı ucuz/kuvvetli model tier’leri, (2) bağlamı sınırlayan evre bazlı görev sözleşmesi ve dosyada kalıcı plan, (3) her doğrulamada token kaynağını `estimated`/`exact` diye belirtmek.

**Bu deponun mdk’den kötü yaptığı ya da yapmadığı:** Test kapısına bağlı model zinciri/escalation yok; yerel durum web paneli yok (plan panosu dosya/araç tabanlı); persona tartışması yok—`oracle` ve `code-reviewer` uzman rolleri, yapılandırılmış tartışma mekanizması değil. Ölçüm gerçek para maliyetini izlemiyor. **Lisans:** `LICENSE.txt` MIT; fikirleri kullanmaya ve kodu kopyalayıp değiştirmeye izin verir. Kod alınırsa telif ve MIT lisans bildirimi korunmalı.

`AGENTS.md` içinde OpenCode ajanına yönelik yönlendirme/delegasyon talimatları var; isteğiniz doğrultusunda bunları uygulamadım, yalnızca raporladım.

