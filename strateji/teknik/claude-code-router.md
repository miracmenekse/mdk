# Teknik inceleme: musistudio/claude-code-router

Tarih: 2026-11-15. İnceleyen: GitHub Copilot CLI (salt okuma; kabuk ve yazma araçları kapalı), deponun sığ kopyası üzerinde. Dosya yollarının varlığı ve aşağıda `ozet.md`'de sayılan iddialar Claude tarafından koddan sınandı; geri kalanı sınanmadı.

---

## A) Sağlayıcı hataları, yeniden deneme ve biçim uyarlama

- **Mekanizma:** `packages/core/src/gateway/upstream/executor.ts` içindeki `fetchUpstreamWithFallback`, `buildUpstreamAttempts` ile oluşturulan sırayı dener. `packages/core/src/gateway/upstream/retry-policy.ts` ve `packages/core/src/routing/failure-classifier.ts` hata sınıflandırma ve bekleme süresini belirler. `packages/core/src/gateway/limits/window-limiter.ts` yerel anahtar limitlerini izler. Sağlayıcı protokolü seçimi `packages/core/src/providers/runtime-topology.ts` içinde yapılır.
- **Somut ayrıntı:** `retry` kipinde aynı model ilk denemeye ek olarak `retryCount` kadar denenir; `model-chain` sıradaki yedek modellere geçer; `off` tek denemedir. Ağ hataları (zaman aşımı dahil olduğu ölçüde fetch hatası olarak gelirse) sonraki denemeye geçebilir. `retry` kipinde HTTP 408, 409, 429 ve 5xx; `model-chain` kipinde tüm 4xx/5xx geçiş tetikler. Gecikme `Retry-After` varsa en çok 60 sn, yoksa 1 sn’den başlayıp 30 sn’de sınırlanan üstel beklemedir. Varsayılan `API_TIMEOUT_MS` 600.000 ms. 2xx boş yanıtı bu fallback döngüsünün ayrıca başarısız saydığı doğrulanamadı; döngü HTTP durumu/ağ hatasına bakıyor. Yerel limitler rpm/rph/rpd, tpm/tph/tpd, ipm/iph/ipd ve özel pencere limitlerini destekliyor. Protokol dönüştürme ana işi `@the-next-ai/ai-gateway` bağımlılığına bırakılmış; CCR’nin kendi `protocol-adapter.ts` dosyası Gemini modelini URL yolu ile istek gövdesi arasında uyarlıyor, genel OpenAI/Anthropic/Gemini dönüşümünün iç ayrıntıları doğrulanamadı.
- **mdk’ye taşınabilir:** Deneme planını, hata sınıfına bağlı geçişi ve sınırlandırılmış beklemeyi ayrı politika olarak kullan — **orta**.

## B) İstek yönlendirme ve token eşiği

- **Mekanizma:** `packages/core/src/gateway/claude-code-router-plugin.ts` içindeki `resolveConfiguredRouteDecision` politikaları sıralar; `packages/core/src/routing/policy-engine.ts` ilk eşleşen kararı döndürür. `routeRequest` token sayısını gerektiğinde tembelce hesaplar. `packages/core/src/routing/token-estimator.ts` tahmini yapar.
- **Somut ayrıntı:** İstek gövdesindeki tanınan model genellikle korunur; özel yönlendirici, alt ajan/profile kuralları ve sıralı kullanıcı kuralları da seçim veya yeniden yazma yapabilir. Token tahmini mesaj, sistem ve araç içeriğini sayar; ASCII kelime/noktalama parçaları ile CJK karakterlerini 1,15 katsayısıyla yaklaşıklar, gerçek tokenizer değildir. Kural betikleri `input.tokenCount` görebilir; kurallarda yerleşik token-eşiği koşulu bulunmadı. AçıkRouter indirim eklentisi model seçmekten ziyade sağlayıcı uç noktalarını tahmini maliyet/kazanca göre seçer (`openrouter-discount-provider-router.ts`).
- **mdk’ye taşınabilir:** Basit kuralları önce çalıştırıp gerektiğinde betik tabanlı kararı kullan; token eşiği için tahminin belirsiz olduğunu kullanıcıya göster — **orta**.

## C) Yapılandırma ve teknik olmayan kullanıcı arayüzü

- **Mekanizma:** `packages/ui/src/pages/home/components/onboarding.tsx` sağlayıcı/ajan kurulum adımlarını; `routing.tsx` hata davranışını ve sıralı yedekleri; `providers.tsx` sağlayıcı formunu sunar. Navigasyon `layout.tsx` içinde Kurulum/İzleme/Gelişmiş olarak gruplanmış. Yapılandırma yolu `docs/.../configuration-file.md`’de belgeleniyor.
- **Somut ayrıntı:** UI; sağlayıcı şablonu, model keşfi, bağlantı testi, kimlik bilgisi havuzu ve yönlendirme kuralı düzenleyicisi sağlar. Temel yapılandırma SQLite veritabanında saklanır; eski JSON yalnızca geçiş kaynağıdır. İleri ayarlar ve betik kuralları teknik bilgi gerektiriyor.
- **mdk’ye taşınabilir:** Önce çalışan başlangıç akışı verip ayrıntıları isteğe bağlı gelişmiş ayarlara sakla — **küçük**.

**mdk’nin alması gereken en değerli 3 fikir:** Hata türüne göre farklı fallback politikası; fallback denemelerini ve sonucu görünür/loglanabilir kılmak; kurulum sihirbazı ile gelişmiş ayarları ayırmak.

**mdk’ye göre zayıf/eksik:** Depoda “adım test kapısından geçmeden tamamlanmaz” yaklaşımı veya OpenCode CLI adım yürütme döngüsü yok. Yerel web paneli/izleme var, ancak mdk’deki gibi görev-adım-kapı durum makinesi ve yapay persona tartışması doğrulanamadı. Token eşiği yönlendirmesi yerleşik değil; tahmin yalnızca betiklere sunuluyor.

**Lisans:** `LICENSE` MIT. Fikirleri serbestçe uyarlayabilirsiniz; kodu kopyalama/değiştirme/dağıtma da mümkün, ancak lisans ve telif bildirimi kopyalanan kodun tüm kopyalarında veya önemli bölümlerinde korunmalı.

Depoda `packages/core/src/gateway/internal/shared.ts` içinde kodlama ajanlarına yönelik talimat metinleri gördüm; uygulamadım, yalnızca rapor ediyorum.

