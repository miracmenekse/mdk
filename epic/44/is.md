# Tam sayfa Epic detayında hızlı kaydırmayla bölüm atlama

Kullanıcı (2026-11-16): Tam sayfa Epic detayında çok hızlı kaydırınca bir sonraki ya da önceki bölüme atlasın. Normal kaydırma bugünkü gibi serbest kalsın.

Bölüm sırası: Tur 1 → Tur 2 → Çözüm → UI/UX Etkisi (sonra Karar). Hızlı aşağı kaydırma sonraki bölümün başına, hızlı yukarı kaydırma öncekine götürür.

Ayar: bölüm atlama açılıp kapatılabilsin ve "ne kadar hızlı" eşiği seçilebilsin (ör. düşük / orta / yüksek). Seçim kalıcı olsun.

Yanlışlıkla atlama olmasın: fare tekerleği, dokunmatik yüzey (eylemsizlikli kaydırma) ve telefonda parmakla kaydırma farklı davranır. Bir metin kutusuna yazarken (alan odaktayken) atlama olmasın.

Hangi bölümde olunduğu küçük bir göstergeyle belli olsun.

Bağlam: tam sayfa görünüm `#drawer.tam-sayfa` (`panel/index.html`), bölümler `panel/ciz.mjs` `epicDrawerHtml` içinde başlıklarla (TARTIŞMA, ÇÖZÜM, UI/UX ETKİSİ, KARAR) çiziliyor. Ayarın nerede saklanacağı (localStorage mı, sunucu tarafı profil mi) ve ayar düğmesinin nerede duracağı tartışılmalı.
