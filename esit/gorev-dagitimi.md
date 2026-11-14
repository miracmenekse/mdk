## Görev dağıtımı (modeller)

- Plan modunda yapılan planı onaylanınca proje kökünde PLAN.md'ye yaz: işleri aşırı küçük mikro-adımlara BÖLME; 1 tam dikey özellik dilimi = 1 adım (1–3 dosya, ~60–250 satır değişiklik, 1 kapı). Yalnızca farklı dosyalarda paralel (`mdk-paralel.sh`) koşabilecek işleri veya 250+ satırı aşan işleri böl. Her adımda değiştirilecek dosya ve satır aralığını (`dosya:bas-bit`) `Ne:` içine yaz.
- Varsayılan yürütücü her zaman `Yürütücü: opencode`'dur (UI, sunucu, betik dahil). Adımlara peşinen `Yürütücü: kodcu` yazma.
  - `opencode`: kodu ve kapı test dosyasını kendin elle yazma, `kodcu`ya da verme. PLAN.md'ye yalnızca adımın `Ne:` tanımını ve `- Kapı:` komutunu yaz, commit et ve proje kökünde `~/mdk/mdk-adim.sh <no>` çalıştır:
    - Kapı test dosyası (`*.test.mjs` / `test/*.test.sh` / `kapi/*`) diskte yoksa `mdk-adim.sh` önce PLAN başındaki `Görev kapi:` modelleriyle testi yazdırır (sözdizimi temiz ve mevcut kodda kırmızı olmalı; yalnız kaynak metni arayan kapıya UYARI basar, o zaman `Kapı:` metnini davranışa göre netleştir), ardından `Görev <tür>:` modelleriyle kodu yazdırır. Adım kapısından sonra hızlı regresyonu da koşar; kırılırsa deneme başarısızdır. Küçük işlerde ayrı dosya yerine tek satırlık `node -e "... assert ..."` kapısı yaz.
    - `Görev kod:` modelleri geçemezse `mdk-adim.sh` otomatik olarak önce PLAN başındaki `Görev eskale:` modellerini dener; `kodcu`ya (Haiku) YALNIZCA `mdk-adim.sh` çıkış 2 (tüm modeller + eskale tükendi) verdiğinde devret.
    - Model adlarını kurallara yazma: tek kaynak PLAN.md başındaki `Görev <tür>:` satırlarıdır (panelden de değişir).
    - Bağımsız (farklı dosyalara dokunan) adımları paralel koştur: `~/mdk/mdk-paralel.sh <no> <no>...`.
    - Her adımdan sonra tek tek `mdk-incele.sh` ÇALIŞTIRMA; yalnız adımda `- İncele: evet` varsa ya da bir Faz bittiğinde son adımda `~/mdk/mdk-incele.sh <no>` çalıştır; diff'i yalnız uyum < 80 ise kendin oku.
  - **Epic / Story:** Faz = Epic, Adım = Story. Epic açma, tartıştırma, onay işleme ve statü değişimi elle değil `node ~/mdk/mdk-epic.mjs` ile yapılır (`ac`, `tartis`, `karar`, `gelistir`, `figma`); sıradaki hamle `node ~/mdk/mdk-epic.mjs durum`'dan okunur. Persona tartışması yalnız kullanıcı isteyince; tartışılan Epic'te kullanıcı panelden onaylamadan story yazma.
  - **Yalın Kip vs. BA/PM & Persona Kipi:**
    - Kullanıcı işi doğrudan tarif ettiğinde veya Faz içi alt adımlarda persona turu (`persona-tur.sh`), benchmark araması ve etki krokisi (`etki/*.html`) ÇALIŞTIRMA; doğrudan PLAN.md'ye yazıp `mdk-adim.sh` başlat.
    - BA/PM bakışı, persona turu ve etki krokisi YALNIZCA: (1) sıfırdan yeni bir Faz / büyük mimari-ekran kararı başlarken Faz başına 1 kez, YA DA (2) kullanıcı açıkça istediğinde / adıma `- Persona: sor`, `- Etki: etki/<ad>.html`, `- İncele: evet` bayrağı eklendiğinde çalışır.
- Ekran/arayüz tasarımı sıfırdan istenirse `tasarimci` alt ajanına ver (tasarim.md'ye yazar), kodlamasını yine `opencode` yapar.
- Genel sohbet ve soru-cevap için alt ajan kullanma.
