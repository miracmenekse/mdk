# Koşturucu denetimleri: story boyutu ve başarısız test özeti

Kaynak: yapılacaklar 6 + 12 (Aider, dyad).

## Problem ve hipotez
(a) "1 story = 1 dikey dilim (1–3 dosya, ~60–250 satır)" kuralı yalnız metinde; koşturucu çok küçük ya da çok büyük story'de uyarmıyor. (b) Kapı kırmızı kalınca sıradaki denemeye günlüğün son 1500 baytı ham veriliyor; asıl başarısız iddia çoğu zaman bunun dışında kalıyor. Hipotez: boyut uyarısı boşa açılış maliyetini, ayıklanmış hata özeti deneme sayısını düşürür.

## Kapsam
1. Story bittiğinde değişen dosya/satır sayısını ölç, sınır dışındaysa `UYARI` bas ve metriğe yaz (engelleme yok).
2. Kapı çıktısından başarısız iddiayı (AssertionError, beklenen/gelen, dosya:satır, ilk yığın satırı) ayıklayan saf işlev; ipucu olarak bu verilir, bulunamazsa bugünkü kuyruk.

## Başarı ölçütü
Kırmızı kapıdan sonraki denemede modele giden ipucu başarısız iddianın metnini içerir; sınır dışı story metrikte işaretlidir.
