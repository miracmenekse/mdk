# Persona ekleme ve mevcut personayı güncelleme

Hedef: MDK kullanıcısı (Geliştirme Yöneticisi) persona takımına (`persona/takim.json`) yeni persona ekleyebilsin ve mevcut bir personayı güncelleyebilsin. Takım Epic tartışmalarında (`mdk-epic.mjs tartis`, 3 tur: Değerlendirme → Tartışma → Uzlaşı) ve adımdaki `- Persona: sor` turunda kullanılır; personanın alanları `ad`, `optimize` (optimize ettiği), `korluk` (bilerek göz ardı ettiği), `soru` (mercek sorusu), isteğe bağlı `yorumlar`.

Bugünkü durum (panel, "Persona" sekmesi):
- Her persona bir kart: ad + avatar, optimize/körlüğü/sorusu salt okunur, "sil" düğmesi (onaysız, anında), yorum kutusu (yorumlar karta eklenir ama tartışmada hiçbir yerde kullanılmıyor).
- Altta tek satırlık "Persona ekle" formu: 4 düz metin kutusu (ad zorunlu, optimize zorunlu, körlük ve soru isteğe bağlı). Doğrulama, örnek, yinelenen ad denetimi yok.
- Kayıt: tüm takım JSON'u `POST /api/persona-takim` ile dosyaya yazılır (sunucu şema denetlemiyor). Hata olursa kullanıcıya gösterilmiyor.
- Mevcut personayı DÜZENLEME yok: değiştirmek için silip yeniden eklemek gerekiyor (sıra ve renk değişir, yorumlar kaybolur).
- Personalar kaynağını/gerekçesini tutmuyor; iyi bir persona yazmak (net körlük, ayrışan soru) kullanıcıya bırakılmış.

Açık sorular: düzenleme kartın içinde mi (yerinde) yoksa ayrı bir form/çekmece mi; ekleme sırasında Claude/model taslak önersin mi (rol adından optimize/körlük/soru doldurma); yeni personanın diğerleriyle örtüşmesi (aynı ekseni optimize etmesi) nasıl fark edilir; silme geri alınabilir mi; personalar Epic başına seçilebilir mi (şu an `--persona` ile yalnız komut satırında); yorumlar tartışmaya girsin mi.
Kısıtlar: panel tek kullanıcılı, 127.0.0.1; adımlar ücretsiz modellerle koşturulur (dar dilimler); panel düz HTML+JS (çerçeve yok).
