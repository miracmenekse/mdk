# Katman raporu: 9 (+1) katman, "en iyisi miyiz?", her acıya bir aksiyon

Tarih: 2026-11-23. Bu sayfa planın "İncelenecek katmanlar" bölümünde istenen raporun kendisidir. Ayrıntı ve kaynaklar:
- `katmanlar.md` (karar gerekçesi, raporlardan sonra değişenler)
- `kullanilamazlik.md` (acıların kanıtı)
- `teknik/orca.md` (Orca incelemesi)

Her katman için yedi alan var: istenen beş alan (MDK'daki karşılığı, hazır araçlar, karar, değiştirme maliyeti, kullanılamazlığa katkısı) ve iki ek: "En iyisi miyiz?" ve "Orca'dan alınacak mantık".

**"En iyisi miyiz?" ölçeği:**
- **önde**: hazırda bu düzeyde yapan yok
- **eşit**: benzer düzeyde
- **geride**: hazır araçlar daha olgun

## Orca hakkında
- Lisansı **MIT** (`LICENSE`, Copyright 2026 Lovecast Inc.). MIT kodu kullanmaya, değiştirmeye, satmaya izin verir. Tek şartı telif ve izin bildirimini korumak.
- Kullanıcı kararı (2026-11-23): **Orca'ya bağlanmıyoruz, mantığını alıyoruz.** Ama "yeniden icat etme" riskine karşı yalnız aşağıda acı noktasına bağlanan dört mantık alınır, fazlası değil. Kod kopyalanırsa dosyanın başına MIT bildirimi eklenir.
- G3 denemesi yine yararlı: mantığı almadan önce Orca'da nasıl hissettirdiğini görmek için.

---

## 1. İstek alma ve şartname
- **MDK'da:** Epic/Story, `- Kabul:` satırı, `mdk-epic.mjs ac`.
- **Hazır:** spec-kit (151 bin★, MIT), OpenSpec (MIT), Kiro (ticari). Kategori: şartname güdümlü geliştirme.
- **Karar:** kendimiz, biçim olarak. Kabul satırı sade dilli **davranış senaryolarına** dönüşür (Epic 1). spec-kit'in "Acceptance Scenarios" alanına eşlenebilir tutulur.
- **Değiştirme maliyeti:** düşük. Hepsi düz Markdown.
- **Kullanılamazlığa katkısı:** düşük.
- **En iyisi miyiz?** **Geride.** spec-kit ve OpenSpec daha olgun ve standart. Bizim tek farkımız kabulün kullanıcıya sade dille onaylatılması, o da henüz yapılmadı.
- **Orca'dan:** yok.

## 2. Parçalama, planlama, persona tartışması
- **MDK'da:** `mdk-epic.mjs`, `epic-tartis.mjs`, `persona-*` (967 satır, 1. katmanla birlikte).
- **Hazır:** BMAD (MIT), Task Master (MIT + Commons Clause), Beads (MIT).
- **Karar:** **dondur.** Ardışık işte çoklu ajan başarıyı %39-70 düşürüyor ([Google Research + MIT](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)).
- **Değiştirme maliyeti:** düşük.
- **Kullanılamazlığa katkısı:** düşük (nadir kullanılıyor).
- **En iyisi miyiz?** **Geride**, üstelik yöntem bilimsel olarak zayıf.
- **Orca'dan:** yok.

## 3. Yürütücü (ajan çerçevesi, "harness")
- **MDK'da:** `mdk-uyandir`, `mdk-mcp`, `yurutuculer.json` (556 satır; her ajan için ayrı bayrak listesi).
- **Hazır:** Claude Code, OpenCode, agy; ortak protokol ACP (Apache-2.0, `agy acp` var); AGENTS.md.
- **Karar:** ajanları hazır al, tek adaptör yaz. Hedef ACP (Epic 3).
- **Değiştirme maliyeti:** orta.
- **Kullanılamazlığa katkısı:** orta. agy bayrakları elle düzeltilmeli; Windows'ta `.exe` yolu gerekiyor.
- **En iyisi miyiz?** **Geride.** Orca ~20 ajanı tek arayüzle sürüyor.
- **Orca'dan:** yok (ACP daha standart).

## 4. Model yönlendirme, yedek model, kota
- **MDK'da:** `Görev` satırları, eskale, `mdk-hata.mjs`, story 222 (Retry-After).
- **Hazır:** LiteLLM, OpenRouter, claude-code-router.
- **Karar:** politika kendimiz. Mekanizmayı bir daha yazmayız. Model merdiveni yerine **story başına sabit model**, çünkü her model geçişinde önbellek sıfırlanıyor (Epic 1b).
- **Değiştirme maliyeti:** düşük.
- **Kullanılamazlığa katkısı:** **en yüksek.** Kota dolması, sessiz bekleme ve değişken ücretsiz model listesi.
- **En iyisi miyiz?** **Geride.** Merdiven fikrimiz de raporlara göre ekonomik değil.
- **Orca'dan (A): kota bekleme durumu.** Orca'da bir işin tüm işçileri kota sınırında durunca iş "bekliyor, en erken şu saatte devam" durumuna geçer. Zamanlayıcı her dakika bakar ve sınır kalkınca işi kendiliğinden sürdürür (`src/main/bots/bot-item-usage-limit-wait.ts`). Bizdeki karşılığı: çıkış 6 / `yanit_yok` yerine "Go kotası şu tarihte açılıyor, iş sırada" ve kendiliğinden devam.
- **Orca'dan (B): kota iletisinden yenilenme saatini okumak.** Claude kotası dolunca tür bilgisi vermiyor, düz cümle yazıyor; Orca saati bu cümleden çıkarıyor (`src/main/claude/structured/journal/claude-usage-limits.ts`). Bizde `mdk-hata.mjs`'ye eklenir.

## 5. Kalite kapısı
- **MDK'da:** kapı (önce kırmızı), kurcalama koruması, kapı sonrası regresyon, `mdk-hakem.mjs`, `mdk-incele.mjs` (622 satır).
- **Hazır:** CI, Promptfoo/DeepEval (eval), PR-Agent (inceleme), Semgrep/Gitleaks (deterministik). Hiçbiri bu döngüyü tek parça yapmıyor.
- **Karar:** **kendimiz. Çekirdek burası.**
- **Değiştirme maliyeti:** yok (çekirdek).
- **Kullanılamazlığa katkısı:** orta. Zayıf kapılar, `kapi_kapsam` yanlış alarmı, kırmızı kapı tuzağı, yavaş hakem.
- **En iyisi miyiz?** **Önde, ama zayıf yerli.** Bütünleşik döngüyü başka yapan yok. Ama:
  - Kapıyı model yazıyor. İnsan testiyle başarı %94, ajanın kendi testiyle %70 ([TDFlow](https://arxiv.org/abs/2510.23761)).
  - Kapı ve kod aynı modellerde (deepseek, beam).
  - Lint ve güvenlik taraması gibi deterministik sensörler yok.

  Bunları kapatırsak gerçekten en iyisi oluruz (Epic 1, 1b).
- **Orca'dan:** yok. Orca'nın `gate-create`'i test koşmaz, yalnız insan kararı bekler.

## 6. Koşu düzeni, paralel, worktree, kilit
- **MDK'da:** `mdk-adim`, `mdk-ortak`, `mdk-paralel`, `mdk-dagit`, kilit (1.485 satır; en çok değişen ikinci katman).
- **Hazır:** Orca (MIT), OpenHands, Temporal, GitHub Actions; n8n (iş akışı, ağır, SUL lisans); vibe-kanban (kapandı).
- **Karar:** Orca'nın mantığını al (kullanıcı kararı). Yeni özellik yok, yalnız aşağıdaki iki mantık.
- **Değiştirme maliyeti:** orta.
- **Kullanılamazlığa katkısı:** **yüksek.**
  - Koşturucu hataları: 615 commit'in 28'i düzeltme.
  - Aynı ağaçta çakışan koşular.
  - Windows'ta henüz gerçek koşu yok.
- **En iyisi miyiz?** **Geride.** Orca'da şunlar var: SSH ile uzak worktree, yeniden deneme zinciri (`--retry-of`), koordinatör/işçi mesajlaşması, üç işletim sistemi.
- **Orca'dan (C): doğrulanan worktree hazırlık kilidi.** Kilit alınır, hazırlık sonunda "kilit hâlâ benim mi, dizin hâlâ özgün mü?" diye yeniden doğrulanır (`src/main/git/worktrees/creation/worktree-preparation-lock.ts`). Bizdeki bayat kilit ve çakışma hatalarına karşılık gelir.
- **Orca'dan (D): koordinatör/işçi sözleşmesi.** İşçi işi bitince açıkça `worker_done` der, iş kimliğiyle izlenir, yeniden deneme öncekine bağlanır (`docs/site/content/docs/cli/orchestration.mdx`). Bizde `mdk-adim` çıktısını "bitti / soru / takıldı" iletilerine çevirir ve canlı görünürlüğün de temeli olur.

## 7. Panel
- **MDK'da:** `panel/*.mjs` (4.487 satır; kodun yarısı, en çok değişen katman).
- **Hazır:** Orca'nın arayüzü, Linear/Plane (iş panosu). Kanban ve diff görüntüsü sıradan iş.
- **Karar:** **dondur, küçült, yönü değiştir.** Kalan tek ekran "niyet doğrulama": istek, senaryolar, kapı sonucu, maliyet, onay (Epic 4).
- **Değiştirme maliyeti:** orta.
- **Kullanılamazlığa katkısı:** orta. Bakım yükü ve kullanıcıya düşen bilişsel yük.
- **En iyisi miyiz?** Genel pano olarak **geride**. Niyet doğrulama ekranında hazırda kimse yok, dört rapor da bunu boşluk diyor. Ama biz de henüz yapmadık. Fırsat burada.
- **Orca'dan:** (D) üzerine canlı "işçi şu anda ne yapıyor" satırı.

## 8. Maliyet ve metrik
- **MDK'da:** `metrikler.jsonl`, `mdk-kayit`, `karsilastir` (164 satır).
- **Hazır:** ccusage, Claude Code OpenTelemetry, Langfuse; Orca'nın hesap kotası ekranı.
- **Karar:** story başına kayıt kendimiz; abonelik tüketimi hazırdan okunur.
- **Değiştirme maliyeti:** düşük.
- **Kullanılamazlığa katkısı:** düşük, ama **yanıltıcı.** 0,56 $ görünüyor; Claude ve agy tüketimi ölçülmüyor.
- **En iyisi miyiz?** **Geride.** Maliyeti story'ye ve kapı sonucuna bağlamak bize özgü, ama yarım.
- **Orca'dan:** hesap başına "%42 kullanıldı, şu saatte yenilenir" göstergesi (A ve B ile birlikte gelir).

## 9. Kural eşitleme
- **MDK'da:** `esit/`, `mdk-esitle.mjs` (49 satır).
- **Hazır:** AGENTS.md (standart), rulesync, ruler.
- **Karar:** standarda uy, betik küçük olduğu için kalsın.
- **Değiştirme maliyeti:** düşük.
- **Kullanılamazlığa katkısı:** düşük.
- **En iyisi miyiz?** **Eşit.**
- **Orca'dan:** yok.

## 10. Görünürlük ve bağlam (sonradan eklendi; kullanıcının asıl derdi)
- **MDK'da:** `panel/claude.mjs` Claude oturumlarını okuyor, ama ana ve alt ajan ayrımını ve bağlam boyunu göstermiyor.
- **Hazır:** Orca (canlı sohbet ve terminal), Claude Code OpenTelemetry, ccusage.
- **Karar:** ölçümü panele küçük bir ek olarak koy. Asıl kazanç bağlam diyetinden gelir (Epic 0).
- **Değiştirme maliyeti:** düşük.
- **Kullanılamazlığa katkısı:** **yüksek.** Ana yürütücü istek başına ~213k bağlam taşıyor ve Claude kotasını eritiyor. `PLAN.md` tek başına ~72k.
- **En iyisi miyiz?** **Geride.**
- **Orca'dan:** (D).

---

## "Biz en iyisi miyiz?" özeti
- **Önde olduğumuz tek katman: 5, kalite kapısı.** O da iki zayıf noktayla: kapıyı model yazıyor, kapı ve kod aynı modelde.
- Fırsat olan ama henüz boş katman: 7'nin niyet doğrulama ekranı.
- **Geri kalan sekiz katmanda gerideyiz.**

Bu bir başarısızlık değil, doğal sonuç: bu katmanlar artık herkesin işi. Kural şu olmalı: geride olduğumuz katmana yatırım yapma, önde olduğun katmanı güçlendir.

## Acı noktası → aksiyon (eksik var mı?)
| # | Acı noktası (kanıt: `kullanilamazlik.md`) | Aksiyon | Durum |
|---|---|---|---|
| a1 | Ücretsiz ve Go kotası doluyor, iş duruyor ya da Claude'a dönüyor | Epic 1b (ücretsiz modeller ana akıştan çıkar, abonelik rolleri) + Orca (A) kota bekleme ve kendiliğinden devam | aksiyon var |
| a2 | Sessiz bekleme (çıkış 6, `yanit_yok`) | Story 222 yaptı (Retry-After). Kalan: Orca (A) + (B), yenilenme saatini göster ve sıraya al | kısmen var |
| a3 | Ücretsiz model listesi değişiyor | Epic 1b (ana akışta yalnız abonelik modelleri) | aksiyon var |
| a4 | `opencode run` başına 55-110k sabit bağlam | **Aksiyon yoktu.** Epic 0'a eklenir: yürütücü istemini küçült, story'ye yalnız ilgili dosya aralığını ver (MDK_SADE işe yaramadı) | **yeni eklendi** |
| a5 | Hakem yavaş (180 sn) | Epic 1b: hakem hızlı ve farklı aileden bir modele (ör. Copilot) | aksiyon var |
| b1 | Koşturucu hataları | Orca (C) + (D) mantığı; "katman kontrolü" kuralı (yeni özellik yok) | aksiyon var |
| b2 | Aynı ağaçta çakışma | Orca (C) | aksiyon var |
| b3 | Windows'ta hiç gerçek koşu yok | **Aksiyon yoktu.** Elle iş: PC'de `git pull` → `node test/hepsi.mjs` (adımlar `CLAUDE.md`'de) | **yeni eklendi (kullanıcı)** |
| b4 | Hazır çözümleri yeniden yazmak (222, 224, 225, 226) | "Katman kontrolü" kuralı (`CLAUDE.md`'ye; onay bekliyor) | aksiyon var, onay bekliyor |
| b5 | Panel bakım yükü | Epic 4 | aksiyon var |
| b6 | Ürünün kendi bilişsel yükü (9 çıkış kodu, ortam değişkenleri, iki aşamalı Figma onayı, uzun `CLAUDE.md`) | Kısmen Epic 1 (yalnız senaryo onayı) ve Epic 4. **Eksik:** Figma onayını isteğe bağlı yapmak, kullanıcıya hiç çıkış kodu göstermemek | **yeni eklendi (Epic 4'e)** |
| c1 | Ana yürütücü çok token yiyor (istek başına ~213k) | Epic 0 bağlam diyeti | aksiyon var |
| c2 | Ajanların nasıl konuştuğunu canlı görememek | Orca (D) + panelde canlı satır (Epic 4 içinde) | aksiyon var |
| c3 | Kapıyı model yazıyor (TDFlow riski) | Epic 1 senaryo kapısı | aksiyon var |
| c4 | Claude'a bağımlılık | Epic 3 (ACP + "Claude çıktı" tatbikatı) | aksiyon var |

## Güncel yapılacaklar (sıra ve kim)
| Sıra | İş | Çözdüğü acılar | Kim |
|---|---|---|---|
| 0 | Epic 0: bağlam diyeti. `PLAN.md`'yi Epic başına böl, planlayıcı yalnız ilgili Epic'i okusun, yürütücü istemi küçülsün | c1, a4 | Claude planlar, yürütücü yazar |
| 1 | Epic 1: senaryo kapısı | c3, b6 | " |
| 1b | Epic 1b: maliyet politikası + Orca (A)(B) kota bekleme | a1, a2, a3, a5 | " |
| 2 | Epic 2: Orca mantığı (C)(D): kilit doğrulama, bitti/soru/takıldı sözleşmesi | b1, b2, c2 | " |
| 3 | Epic 3: ACP + "Claude çıktı" | c4 | " |
| 4 | Epic 4: panel küçült, niyet doğrulama ekranı, canlı satır, Figma onayı isteğe bağlı | b5, b6, c2 | " |
| — | Windows'ta ilk gerçek koşu | b3 | **kullanıcı (elle)** |
| — | Orca'yı 1 saat dene (`deneme-formu.md`) | (C)(D) mantığını almadan önce | **kullanıcı (elle)** |
| — | "Katman kontrolü" kuralı | b4 | kullanıcı onayı → Claude `CLAUDE.md`'ye yazar |
