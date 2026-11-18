# Epic 53 — Başarısız test çıktısının ayıklanarak modele yapılandırılmış geri bildirim olarak verilmesi

## Amaç
Koşturucu denemesi başarısız olduğunda komut ve test çıktısının ayıklanıp gereksiz gürültüden arındırılarak sonraki denemeye yüksek kaliteli hata tanısı (ipucu) olarak sunulması.

## Kapsam
1. `mdk-denetim.mjs`: `yapilandirilmisTani(metin, { komut, sinir })` saf işlevi (ANSI kodlarının temizlenmesi, `komut`, `hataTuru`, `konum`, `ozet` ve yapılandırılmış `geriBildirim` metninin üretilmesi).
2. `mdk-adim.mjs`: Başarısız kapı komutunun izlenmesi ve sonraki deneme ipucunda `yapilandirilmisTani` çıktısının kullanılması.
