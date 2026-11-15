# Teknik inceleme: Aider-AI/aider

Tarih: 2026-11-15. İnceleyen: GitHub Copilot CLI (salt okuma; kabuk ve yazma araçları kapalı), deponun sığ kopyası üzerinde. Soru: mdk'nin sağlayıcı, test döngüsü ve bağlam sorunlarını Aider nasıl çözüyor, alınacak fikir var mı?

**Claude'un sınaması:** yeniden deneme sayıları koddan doğrulandı (`aider/models.py:26` `RETRY_TIMEOUT = 60`, `:1045` `retry_delay = 0.125`, `:1073` ikiye katlama; aynısı `aider/coders/base_coder.py:1449-1471`). Copilot'un kaçırdığı: "sabit otomatik deneme sayısı yok" diyor, oysa `aider/coders/base_coder.py:101` `max_reflections = 3` var (model kendi hatasını en çok 3 tur düzeltir). Diğer iddialar tek tek sınanmadı.

---

Aider bu üç problemi **tek bir iş-adımı planlayıcısı olarak çözmüyor**: model yükseltme zinciri ve her adım için zorunlu test kapısı mdk’ye özgü; Aider’da sağlayıcı yeniden denemeleri, isteğe bağlı otomatik test ve bağlam seçimi ayrı mekanizmalar.

### A) Sağlayıcı sorunları
- **Mekanizma:** `aider/models.py` → `Model.simple_send_with_retries`; `aider/coders/base_coder.py` → `send`. Hata sınıfları ve tekrar edilebilirlik `aider/exceptions.py` → `LiteLLMExceptions.get_ex_info` içinde sınıflandırılıyor.
- **Somut ayrıntı:** İki çağrı yolunda da baştaki `0.125` saniye gecikme her denemede ikiye katlanıyor; 60 saniye eşiği aşılınca yeniden deneme kesiliyor. Uyku süreleri `.25, .5, 1, 2, 4, 8, 16, 32` saniye; toplam yaklaşık 64 saniye. Rate limit, timeout, bağlantı/API, sunucu hataları çoğunlukla yeniden denenir; kimlik doğrulama, `NotFoundError` ve bağlam sınırı gibi durumlar genellikle denenmez. Yetersiz kredi içeren belirli `APIError` yeniden denenmez. İstek zaman aşımı varsayılanı 600 saniye. Boş yanıt `simple_send_with_retries` içinde `None` olur; tekrar denenmez. `send` yolundaki hata ve bekleme kullanıcıya gösterilir; model/sağlayıcı zinciriyle otomatik yükseltme doğrulanamadı. OpenRouter model bilgisi 24 saatlik önbellekten (`aider/openrouter.py` → `OpenRouterModelManager`), genel model bilgisi de 24 saatlik önbellek/LiteLLM’den (`aider/models.py` → `ModelInfoManager`) geliyor; bunlar çağrı sırasında model fallback’i sağlamaz.
- **mdk’ye taşıma:** Hata sınıfı başına açık retry politikası ve sınırlı üstel bekleme yararlı; model kademelendirmeyi ayrıca eklemek gerekir. **Zorluk: orta.**

### B) Test döngüsü
- **Mekanizma:** `aider/commands.py` → `Commands.cmd_test`, `cmd_run`; otomatik test tetikleme `aider/coders/base_coder.py` → `run_shell_commands`.
- **Somut ayrıntı:** Test komutu yalnız kod değişikliği sonrası `auto_test` açıksa çalışır. Başarıda çıktı sohbete eklenmez; başarısızlıkta birleştirilmiş komut çıktısı, kesme/özet olmadan `prompts.run_output` ile tam olarak eklenir. Modelden düzeltme için kullanıcı onayı istenir; sabit otomatik deneme sayısı yoktur. Testi geçmek için testleri değiştirmeyi veya zayıflatmayı engelleyen bir mekanizma doğrulanamadı.
- **mdk’ye taşıma:** Tam çıktıyı sınırlı/ayıklanmış hata raporuna dönüştürüp deneme sayısını kapı düzeyinde belirlemek uygun olur. **Zorluk: orta.**

### C) Bağlam
- **Mekanizma:** `aider/repomap.py` → `get_tags_raw`, `get_ranked_tags`, `get_ranked_tags_map_uncached`, `render_tree`; bağlamı kurma `aider/coders/base_coder.py` → `get_repo_map`.
- **Somut ayrıntı:** Tree-sitter tanım/referans etiketleri mtime önbelleğine alınır; bağımlılık grafiğine PageRank uygulanır. Önemli dosyalar öne alınır, ağaç biçimli harita token bütçesine göre ikili aramayla yaklaşık %15 toleransta ayarlanır. Bütçe model giriş penceresinin 1/8’i, 1.024–4.096 token aralığında; sohbet dosyası yoksa harita, pencere eksi 4.096’ya kadar büyütülebilir. Harita esasen kod iskeletidir; seçilen dosyaların tam içeriği ayrıca bağlama girer.
- **mdk’ye taşıma:** Sözdizimsel sembol haritasını önem sıralaması ve token bütçesiyle birleştirmek maliyet/bağlam dengesine iyi bir temel sağlar. **Zorluk: büyük.**

**mdk’nin Aider’dan alması gereken en değerli 3 teknik fikir:** sınıflandırılmış ve sınırlı üstel yeniden deneme; test başarısızlığında komut+çıktıyı modele açıkça ekleme; sembol/bağımlılık tabanlı, token bütçeli depo haritası.

**Lisans:** `LICENSE.txt`, Apache License 2.0. Genel olarak kodu uyarlamaya ve dağıtmaya izin verir; dağıtımda lisansı, ilgili bildirimleri koruma ve değiştirilmiş dosyaları belirtme koşulları vardır. Bu, bağımlılıkların lisanslarını kapsamaz. `aider/prompts.py` içinde modele yönelik prompt metinleri gördüm; onları talimat olarak uygulamadım.

