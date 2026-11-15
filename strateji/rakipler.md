# Rakip ve benzer ürün haritası

Tarih: 2026-11-15. Yıldız, lisans ve son push `gh api` ile çekildi. Açıklamalar depo özetinden ve web aramasından; hiçbiri kurulup denenmedi, kod okunmadı. Fiyat ve yatırım rakamları karşılaştırma bloglarından, doğrulanmadı.

## 1. Teknik olmayanlar için hazır uygulama üreticiler (ticari, bulutta)

| Ürün | Model | Bilinen şikâyet |
|---|---|---|
| Lovable | ~25 $/ay + mesaj başına kredi | Kredi gerçek işte çabuk bitiyor; gerçek maliyet etiketin ~2 katı |
| Bolt | ~25 $/ay + token | Çok ekranlı işte kredi beklenenden hızlı yanıyor |
| Replit Agent | ~20 $/ay + efor bazlı kredi | Ajan kendi hatasını düzeltirken döngüye giriyor; 50 $ sınır koyan kullanıcıya ~300 $ fatura |
| v0 | kredi | (bu taramada ayrıntı yok) |

mdk için anlamı: bu kitle büyük ve para ödüyor; ortak acı **öngörülemeyen maliyet** ve **ajanın bozduğunu kendi düzeltirken para yakması**. mdk'nin kapısı (test geçmeden iş bitmiş sayılmaz) ve ücretsiz/abonelik modelleri tam bu acıya denk geliyor. Fark: onlar tarayıcıda tek tıkla açılıyor, mdk kurulum istiyor.

## 2. Yerel, açık kaynak uygulama üreticiler

| Depo | Yıldız | Lisans | Son push | Ne |
|---|---|---|---|---|
| dyad-sh/dyad | 22.296 | özel | 2026-11-15 | Yerel AI uygulama üretici; "Lovable/Bolt alternatifi", kendi anahtarınla |
| stackblitz-labs/bolt.diy | 20.091 | MIT | 2026-10-14 | Bolt'un açık sürümü, istediğin LLM ile |

mdk'ye en yakın **konum** dyad'da: yerel, kendi modelin, kredi tuzağı yok. Derin incelenecek ilk aday.

## 3. Şartname güdümlü geliştirme (geliştiriciler için, terminalde)

| Depo | Yıldız | Lisans | Son push | Ne |
|---|---|---|---|---|
| github/spec-kit | 149.843 | MIT | 2026-11-12 | Şartname → plan → görev araç seti; 30+ ajanla çalışır |
| Fission-AI/OpenSpec | 74.887 | MIT | 2026-11-14 | Hafif, değişiklik bazlı şartname |
| gsd-build/get-shit-done | 64.134 | MIT | 2026-05-31 | Claude Code için meta-istem + şartname sistemi |
| bmad-code-org/BMAD-METHOD | 55.387 | özel | 2026-11-15 | Rol bazlı ajan personaları (PM, mimar…) ile çevik yöntem |
| eyaltoledano/claude-task-master | 28.360 | MIT+Commons | 2026-04-28 | PRD'yi bağımlılıklı görevlere böler |
| Kiro (AWS) | ticari | — | — | Şartname güdümlü IDE |

mdk için anlamı: "planla → böl → koştur" fikri artık standart ve çok kalabalık; **burada fark yaratılamaz**. BMAD'in personaları mdk'nin persona takımıyla aynı fikir. Ortak eleştiri: küçük iş için ağır.

## 4. Ajan orkestrasyonu ve pano (geliştiriciler için)

| Depo | Yıldız | Lisans | Son push | Ne |
|---|---|---|---|---|
| ruvnet/ruflo (eski claude-flow) | 81.762 | MIT | 2026-11-14 | Çok ajanlı sürü |
| code-yeongyu/oh-my-openagent | 70.916 | özel | 2026-11-15 | OpenCode ajan paketi |
| musistudio/claude-code-router | 38.156 | MIT | 2026-10-10 | İstekleri modeller arasında yönlendirir (maliyet) |
| BloopAI/vibe-kanban | 28.694 | Apache-2.0 | 2026-11-15 | Kanban panosunda paralel ajan; şirket kapandı, yerel sürüm yaşıyor |
| saltbo/agent-kanban | 505 | — | 2026-11-13 | Ajan öncelikli görev panosu |
| agnusdei1207/opencode-orchestrator | 283 | MIT | 2026-10-29 | OpenCode orkestrasyon eklentisi |
| DanWahlin/ai-agent-board | 72 | MIT | 2026-09-19 | Copilot, Claude Code, Codex, OpenCode'a iş dağıtan pano |
| augmentedmike/helloam-agentic-kanban | 16 | — | 2026-11-05 | **Kapılı durum geçişli** kanban |
| NicoGenti/opencode-orchestrator-kit | 9 | MIT | 2026-11-15 | **Maliyet bilinçli** OpenCode orkestrasyonu, doğru modele yönlendirme |

mdk için anlamı: pano + paralel ajan da kalabalık. Son iki küçük depo mdk'nin iki çekirdek fikrini (kapı, maliyet yönlendirme) ayrı ayrı yapıyor; ikisi de çok küçük. Liste kaynağı: andyrewlee/awesome-agent-orchestrators (2.430 yıldız) — radar için hazır besleme.

## Sonuç (hipotez, doğrulanmadı)

Taranan ürünlerin hiçbiri şu üçünü birlikte yapmıyor:
1. Teknik olmayan kişi için ekran öncelikli (2. ve 1. grup yapıyor, 3-4 yapmıyor)
2. Kişinin zaten ödediği abonelik + ücretsiz modellerle, öngörülebilir maliyet (yalnız router ve küçük kit'ler)
3. Kapı: test geçmeden iş bitmiş sayılmaz (yalnız küçük bir depo)

Boşluk gerçek olabilir ya da yalnızca bu taramanın yüzeyselliğinden kaynaklanabilir. `istemler.md`'deki üç derin araştırma bunu sınar.

## Kaynaklar
- https://www.vibecodingacademy.ai/blog/lovable-vs-bolt-vs-replit-comparison-2026
- https://getcreatr.com/ai-app-builder-pricing-comparison-2026
- https://tech-insider.org/replit-vs-lovable-vs-bolt-new-2026/
- https://www.augmentcode.com/tools/best-spec-driven-development-tools
- https://uvik.net/spec-driven-development-benchmark/
- https://github.com/andyrewlee/awesome-agent-orchestrators
- https://ai-deck.app/blog/vibe-kanban/
