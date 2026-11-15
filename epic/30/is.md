# Kapıyı sade dille göster ve onaylat

Kaynak: yapılacaklar 1 (`strateji/rapor/ozet-2026-11-15.md`: en büyük iç risk kapıyı modelin yazması).

## Problem ve hipotez
Kapı testini model yazıyor; kullanıcı neyin sınandığını görmüyor. Hipotez: story koşmadan önce "bu iş bitti sayılması için şunlar doğru olmalı" listesini panelde göstermek, yanlış ya da zayıf kapıyı kod yazılmadan yakalatır.

## Kapsam
1. Kapı üretilince test vakalarından sade dille madde listesi çıkar (`Kapı notu` + üretilen testin vaka adları).
2. Panelde story kartında liste; isteğe bağlı "onaylamadan koşma" anahtarı (varsayılan kapalı: akışı yavaşlatmasın).

## Başarı ölçütü
Kullanıcı, kod yazılmadan önce story'nin kabul ölçütlerini teknik terim olmadan okuyabilir.

## Açık soru
Onay zorunlu mu olsun? Varsayılan: hayır, yalnız gösterim; kullanıcı panelden açabilir.
