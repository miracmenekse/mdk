# Gemini Deep Research istemleri

Kullanım: gemini.google.com → Deep Research → istemi yapıştır. Çıkan raporu "Dokümanlar'a aktar" ile kaydet, Gemini Notebook'ta "mdk pazar" not defterine ekle. Raporu `strateji/rapor/` altına da koy (md ya da pdf); Claude oradan okuyup `rakipler.md` ve `konum.md`'yi günceller.

## İstem 1 — Ticari rakipler ve ödeme isteği

```
Teknik olmayan kişilerin yapay zekâyla yazılım geliştirmesini sağlayan ticari ürünleri araştır (Lovable, Bolt, Replit Agent, v0, Base44, Dyad ve 2026'da çıkan benzerleri).
Her ürün için: hedef kitle, fiyat modeli (abonelik, kredi, token), kullanıcı sayısı ya da gelir (varsa), son 6 ayda eklenen büyük özellikler.
Ayrıca Reddit, Trustpilot, Hacker News ve X'teki kullanıcı şikâyetlerini topla ve türüne göre say: maliyetin öngörülememesi, ajanın kendi hatasını düzeltirken kredi yakması, üretilen kodun bakımının yapılamaması, kilitlenme (lock-in), güvenlik.
Soru: Kullanıcının zaten ödediği yapay zekâ aboneliklerini (Claude Pro, Google AI, GitHub Copilot) ve ücretsiz modelleri kullanan, yerelde çalışan, her işi otomatik testten geçirmeden bitmiş saymayan bir ürün için pazarda boşluk var mı? Bu boşluğu dolduran ürün var mı?
Çıktı: karşılaştırma tablosu, şikâyet türlerinin sıklığı, boşluk değerlendirmesi. Her iddiaya kaynak ver; doğrulayamadığını "doğrulanamadı" diye işaretle. Türkçe yaz.
```

## İstem 2 — Açık kaynak benzerler

```
GitHub'da yapay zekâ kodlama ajanlarını planlayan, yöneten ve denetleyen açık kaynak projeleri araştır. Dört grup: (1) şartname güdümlü geliştirme (spec-kit, OpenSpec, BMAD-METHOD, get-shit-done, Task Master), (2) ajan orkestrasyonu ve kanban panoları (vibe-kanban, ruflo, agent-kanban, ai-agent-board), (3) maliyet için model yönlendirme (claude-code-router, opencode-orchestrator-kit), (4) yerel uygulama üreticiler (dyad, bolt.diy).
Her proje için: ne yaptığı, kimin için olduğu (geliştirici mi, teknik olmayan mı), kurulum zorluğu, lisans, son 3 aydaki etkinlik, arkasında şirket ya da gelir modeli var mı.
Özellikle şunları yapan projeleri ara: (a) işi ucuz/ücretsiz modele yazdırıp başarısız olunca pahalı modele yükselten, (b) her adımı otomatik test "kapısından" geçiren, (c) teknik olmayan kişi için görsel panel sunan, (d) kararları yapay persona tartışmasıyla veren. Bu dördünü birlikte yapan var mı?
Çıktı: tablo + "en yakın 5 proje" + her birinden öğrenilecek şey. Depo bağlantılarını ver. Türkçe yaz.
```

## İstem 3 — Akademik ve sektör araştırması

```
2025-2026 arasında yayımlanan akademik makaleleri ve sektör raporlarını araştır (arXiv, ACM, IEEE, CHI, ICSE, FSE; ayrıca Anthropic, Google, Microsoft, GitHub araştırma yazıları):
1. Teknik olmayan kişilerin yapay zekâyla yazılım geliştirmesi ("vibe coding", "end-user programming with LLMs"): nerede takılıyorlar, hangi arayüzler bilişsel yükü azaltıyor?
2. Çok ajanlı yazılım geliştirme ve rol bazlı ajanlar (MetaGPT, ChatDev sonrası): ölçülmüş faydası var mı?
3. Test güdümlü ajan geliştirme: testin "kapı" olarak kullanılması kaliteyi ne kadar artırıyor?
4. Model basamaklandırma (ucuz modelden pahalıya yükseltme, "LLM cascade/routing"): maliyet tasarrufu ölçümleri.
5. İnsan-ajan etkileşiminde bilişsel yük ve onay yorgunluğu.
Her başlık için en önemli 3-5 çalışma: bulgu, yöntem, örneklem, sınırlılık. Sonunda: bu bulgulara göre teknik olmayan kullanıcıya yönelik bir geliştirme aracının tasarımında kanıtla desteklenen 10 ilke. Kaynak bağlantısı ver; hakemli olmayanı belirt. Türkçe yaz.
```

## Haftalık kısa istem (radar)

```
Son 7 günde yapay zekâ ile yazılım geliştirme araçlarında ne değişti? Yeni çıkan ürün, büyük sürüm, fiyat değişikliği, kapanan ürün, yeni açık kaynak proje (500+ yıldız), önemli makale. Yalnız teknik olmayan kullanıcıya, maliyet düşürmeye ya da ajan denetimine dokunanları al. En fazla 10 madde, her biri bir cümle + bağlantı. Türkçe yaz.
```
