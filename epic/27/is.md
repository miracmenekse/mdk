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

## Hedef kitle (karar, 2026-11-15)
Yarı teknik, bütçesi dar kişi (öğrenci, serbest çalışan; terminal açabilir ama kod yazmaz). Radar ekranını okuyan kişi işin business tarafını yöneten kullanıcıdır; teknik depo ayrıntısı değil "bu benim ürünüm için ne anlama geliyor" sorusunun cevabını arar.

## Claude'un sınaması (2026-11-15, tartışma sonrası)
- **Sekme mi bölüm mü:** ikisi de değil. Panelde zaten `Araştırma` sekmesi var (18 Ekim taraması, `arastirma/arastirma.json`); personalar bunu bilmiyordu. Radar o sekmenin en üstüne "Bu hafta" şeridi olarak girer: sekme sayısı artmaz, Geliştirme akışına yük binmez.
- **Kapsam kırpması:** tahmini story 6 (ölçüm çizgesi + kesme taahhüdü) v1 dışı; 4 hafta sonra elle bakılır. 1+2 tek story.
- **Eşikler:** sıçrama = bir önceki taramaya göre yıldız +%20 ya da +500; durmuş = 90 gündür push yok.
- **Depolama:** `strateji/radar.json` (izleme listesi + sorgular), `strateji/radar-sonuc.json` (son tarama + önceki), `strateji/radar-isaret.json` (izle/incele/geç); üçü de git'te (iki makine).
- **Tetikleme:** panel açılışında son tarama 7 günden eskiyse arka planda başlar; ayrıca "Şimdi tara" düğmesi. Zamanlanmış görev yok.
- **Ön-seçim:** değişmeyen adaya hiçbir şey sorulmaz; yalnız "Bu hafta" şeridindekiler çekmecede işaretlenir.
