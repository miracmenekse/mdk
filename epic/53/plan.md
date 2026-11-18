# Epic 53 Uygulama Planı: Başarısız Test Çıktısının Yapılandırılmış Geri Bildirim Olarak Verilmesi

## Hedef
Başarısız denemelerde kapı/test çıktısındaki ANSI renk kodlarını ve gürültüyü temizleyerek `Komut`, `Hata Türü`, `Konum` ve `Detay` alanlarından oluşan yapılandırılmış bir tanı bloğunu sonraki denemeye ipucu olarak vermek.

## Değişiklikler
- `mdk-denetim.mjs`: `yapilandirilmisTani(metin, { komut = '', sinir = 1500 })` işlevi dışa aktarılır.
- `mdk-adim.mjs`: Kırılan kapı komutu `basarisizKapiKomutu` olarak saklanır ve `yapilandirilmisTani` ile üretilen `geriBildirim` isteme eklenir.

## Doğrulama
- `node test/yapilandirilmis-tani.test.mjs`
- `node test/mdk-denetim.test.mjs`
