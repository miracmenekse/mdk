# Hakem (judge) modeliyle geçti / geçmedi

Kaynak: kullanıcı isteği (2026-11-15). İlgili: Epic 30 (kapıyı sade dille göster), `strateji/rapor/ozet-2026-11-15.md` (en büyük iç risk: kapıyı modelin yazması).

## Problem ve hipotez
Bugün "geçti" kararını yalnız kapı komutunun çıkış kodu veriyor. Kapıyı da kodu da ücretsiz model yazdığı için zayıf ya da yanlış kapı yeşil yanabiliyor. Hipotez: kodu yazan modelden farklı bir hakem model, story tanımını (`Ne:`, `Kapı notu`), kapı testini ve diff'i okuyup "geçti / geçmedi + gerekçe" hükmü verirse, testin kaçırdığı uyumsuzluklar yakalanır.

## Bugünkü durum
- `mdk-incele.mjs` benzer bir inceleme yapıyor ama yalnız Faz sonunda, sonuç bağlayıcı değil ve iki inceleme modeli Epic 27'de biçimi bozuk çıktı verdi.
- Kapı üretiminde yalnız "sözdizimi temiz + mevcut kodda kırmızı" denetleniyor; kapının `Kapı notu`ndaki vakaları kapsayıp kapsamadığına bakılmıyor.

## Kapsam (taslak)
1. PLAN başına `Görev hakem:` satırı; hakem, kodu yazan modelden farklı olmalı.
2. Kapı hakemi: üretilen test `Kapı notu`ndaki vakaları kapsıyor mu → geçti / geçmedi + eksik vaka listesi.
3. Sonuç hakemi: kapı yeşilken diff story'yi karşılıyor mu → geçti / geçmedi + gerekçe; "geçmedi" ise deneme başarısız sayılır ve gerekçe sıradaki denemeye ipucu olur.
4. Panelde story kartında hakem hükmü ve gerekçesi sade dille.

## Başarı ölçütü
Bilerek zayıf yazılmış bir kapıyla yeşil olan story, hakem tarafından "geçmedi" diye işaretlenir; hakem çıktısı bozuksa koşu durmaz (hüküm "bilinmiyor" sayılır).

## Riskler ve açık sorular
- Ücretsiz hakem modelin yanlış "geçmedi" demesi denemeleri boşa harcatır: ilk sürümde hüküm bağlayıcı mı, yalnız uyarı mı? Varsayılan öneri: önce uyarı, ölçüm sonrası bağlayıcı.
- Ek model çağrısı = ek süre ve kota.
- `mdk-incele.mjs` ile örtüşme: hakem onun yerini mi alır, onu mu kullanır?
