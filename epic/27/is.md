# Pazar radarı

## Problem ve hipotez
İş tarafını yöneten kullanıcı rakip, benzer açık kaynak ve yeni araştırma takibini yapmıyor; ürün dışarıya bakmadan gelişiyor. Hipotez: haftalık otomatik tarama + panelde tek ekran, bu takibi haftada 15 dakikaya indirir ve yol haritası kararlarını kanıta bağlar.

## İş değeri / başarı ölçütü
- Haftada bir, elle komut yazmadan güncel aday listesi oluşur.
- Kullanıcı panelde yeni/değişen adayları görür, "izle / incele / geç" diye işaretler.
- 4 hafta sonra en az bir Epic kararı radardaki bir bulguya dayanır.

## Kapsam
- `mdk-radar.mjs`: `strateji/radar.json`'daki sorgu ve izleme listesini `gh api` ile tarar (yıldız, lisans, son push, açıklama); önceki taramayla farkı çıkarır (yeni depo, yıldız sıçraması, durmuş proje). Özetleme `Görev arastirma:` modeliyle. Ağ yalnız bu betikte.
- Panelde "Pazar" sekmesi: aday tablosu (gruplu), haftalık fark, `strateji/konum.md` özeti, Deep Research istemini kopyala düğmesi.
- Dayanak: `strateji/rakipler.md`, `strateji/konum.md`, `strateji/istemler.md` (2026-11-15).

## Akış
Kullanıcı paneli açar → Pazar sekmesi → bu haftanın farkı en üstte. Boş durumda: "henüz tarama yok" + tarama başlat düğmesi. gh yoksa ya da ağ hatasında: son başarılı taramayı tarihiyle gösterir.

## Riskler ve açık sorular
- PLAN kuralı "ağ yok": radar betiği istisna, kuralda açıkça yazılmalı.
- Ücretsiz model özetleri uydurabilir: sayılar yalnız API'den, model yalnız açıklama özetler.
- Sekme sayısı artıyor (bilişsel yük): Pazar ayrı sekme mi, Geliştirme içinde bölüm mü — kroki ile karar.
