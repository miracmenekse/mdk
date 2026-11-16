# Tam sayfa Epic detayında hızlı kaydırmayla bölüm atlama

Kullanıcı (2026-11-16): Tam sayfa açılan Epic detayında kaydırma (scroll) yaptığımda bölüm atlamalı, ama yalnız çok hızlı kaydırdığımda. Normal kaydırma bugünkü gibi serbest kalmalı.

Bölüm sırası: Tur 1 (Değerlendirme) → Tur 2 (Tartışma) → Çözüm → UI/UX Etkisi (sonra Karar). Hızlı aşağı kaydırma bir sonraki bölümün başına, hızlı yukarı kaydırma bir öncekine götürür.

Ayar gerekli: bölüm atlama açılıp kapatılabilmeli ve "ne kadar hızlı" eşiği ayarlanabilmeli (ör. hassasiyet: düşük / orta / yüksek). Ayar kalıcı olmalı.

Dikkat: fare tekerleği, dokunmatik yüzey (trackpad, eylemsizlikli kaydırma) ve telefonda dokunmayla kaydırma farklı davranır; yanlışlıkla atlama olmamalı, metin kutusuna yazarken ya da bir alan odaktayken atlama olmamalı. Hangi bölümde olunduğu küçük bir göstergeyle belli olabilir.

Bağlam: tam sayfa görünüm `#drawer.tam-sayfa` (`panel/index.html`), bölümler `panel/ciz.mjs` `epicDrawerHtml` içinde başlıklarla (TARTIŞMA, ÇÖZÜM, UI/UX ETKİSİ, KARAR) çiziliyor.
