---
name: ba-pm-bakis
description: YALNIZCA yeni bir Faz (büyük mimari/ekran kararı) başlarken Faz başına 1 kez ya da kullanıcı açıkça "persona çalıştır / alternatif üret / BA-PM bakışı / kroki çiz" dediğinde yükle. Kullanıcının doğrudan tarif ettiği işlerde ve Faz içi alt adımlarda YÜKLEME.
---

# BA/PM bakışı (Koşullu: Faz Başında 1 Kez veya Kullanıcı İsteğiyle)

**NE ZAMAN ÇALIŞIR / NE ZAMAN ATLANIR:**
- **ATLA (Doğrudan Kip — Varsayılan):** Kullanıcı ne istediğini doğrudan tarif ettiyse, mevcut bir ekrana/modüle özellik ekleniyorsa veya Faz içi alt adımlar yazılıyorsa persona turu, benchmark, hipotez tablosu ve `etki/*.html` krokisi **YAPMA**. Doğrudan `PLAN.md`'ye adımı yaz ve `mdk-adim.sh` başlat.
- **ÇALIŞTIR (Derin Kip):** Yalnızca (a) sıfırdan yeni bir Faz / büyük mimari veya ekran tasarımı başlarken **Faz başına 1 kez**, ya da (b) kullanıcı sohbette açıkça istediğinde / adıma `- Persona: sor`, `- Etki: etki/<ad>.html`, `- İncele: evet` bayrağı koyduğunda çalıştır.

## 1. Yeni Faz başında (kısa, 1-3 satır her biri; alt adımlarda tekrarlama)
- **Problem ve hipotez:** Kim hangi sorunu yaşıyor? Neyi doğru varsayıyoruz? Bu iş hangi varsayımı doğrular ya da çürütür?
- **İş değeri / başarı ölçütü:** Bittiğinde hangi iş sonucu değişmiş olacak, nasıl anlaşılır?
- **Akış ve kullanım kolaylığı:** Kullanıcı kaç adımda amacına varır? Hata ve boş durumda ne görür?
- **Riskler ve açık sorular.**

## 2. Kapılar ve Adım Boyutu (kalite + hız)
Her adımın kapısı çalıştırılabilir olsun (çıkış kodu 0).
- **Kapıları OpenCode Üretir (Claude Elle Yazmaz):**
  - Claude `PLAN.md`'ye yalnız adımın `Ne:` açıklamasını (hedef `dosya:satır-aralığı` ile) ve `- Kapı:` komutunu yazar; test dosyasını elle yazmaz.
  - `mdk-adim.sh <no>` çalıştığında test dosyası (`*.test.mjs`, `test/*.test.sh`, `kapi/*`) diskte yoksa önce PLAN başındaki `Görev kapi:` modelleriyle test dosyasını üretir, sözdizimini ve mevcut kodda KIRMIZI olduğunu doğrular (kod yazılmadan yeşil ya da sözdizimi bozuk kapı reddedilir), ardından `Görev kod:` modeliyle kodu yazdırır. Adım kapısı geçince hızlı regresyon (`HEPSI_HIZLI=1 test/hepsi.sh`) da koşar; kırılırsa deneme başarısızdır.
  - `Kapı:` metnini davranış üzerinden yaz (hangi girdi → hangi çıktı; başarı, hata, sınır durumu). "dosyada şu metin geçer" türü iddia zayıf kapıdır: koşturucu `UYARI: zayıf kapı` basarsa `Kapı:` metnini düzelt.
  - Küçük/mekanik adımlarda ayrı test dosyası açmak yerine tek satırlık `node -e "import assert from 'node:assert/strict'; ..."` kapısı veya mevcut test dosyası kullanılır.
- **Adım Boyutu ("Dikey Özellik Dilimi" Kuralı):**
  - İşleri aşırı küçük mikro-adımlara (1 satır, 20 satır) **BÖLME**; her adım ~90 sn açılış ve ~100k token sabit yük taşır.
  - **1 adım = 1 tam dikey dilim (1–3 dosya, ~60–250 satır değişiklik, 1 kapı).** Aynı dosyaya (`ciz.mjs`, `sunucu.mjs`) dokunan ardışık değişiklikleri tek adımda birleştir.
  - Bir işi yalnızca **(a)** farklı dosyalara dokunduğu için `mdk-paralel.sh` ile gerçekten paralel koşabilecekse veya **(b)** 250+ satırı aşıyorsa böl.
  - Adımın `Ne:` satırına Claude'un zaten bildiği hedef dosya ve satır aralığını (`panel/sunucu.mjs:190-245` gibi) mutlaka yaz ki model dosya aramakla istek harcamasın.
- **Yürütücü ve Eskale:**
  - Varsayılan yürütücü her zaman `opencode`'dur. `mdk-adim.sh` içinde `Görev kod:` modelleri geçemezse betik otomatik olarak PLAN başındaki `Görev eskale:` modellerini dener; `kodcu`ya (Haiku) yalnız çıkış 2 dönerse gidilir.
  - Yalnız `mdk-adim.sh`'in süreç öldürme/reset çekirdeğine dokunan adımlar `kodcu`/Claude'undur; diğer tüm kod ve test adımları `opencode`'da koşar.

## 2.5 Epic tartışması (kullanıcı "tartıştır / personalara sor" dediğinde)
Bir işin kapsamı ve çözümü tartışılacaksa kart turu yerine Epic tartışması: `node ~/mdk/mdk-epic.mjs tartis <no>` (proje takımı `persona/takim.json`; üç tur: değerlendirme, tartışma, uzlaşı). Çıktı panelde Epic çekmecesinde görünür ve tahmini story listesi içerir. Çözümü kendin sına; kullanıcı panelden onaylamadan story yazma. Aşağıdaki kart turu (`persona-tur.sh`) tek bir tasarım kararında seçenek üretmek içindir.

## 3. UI / akış kararında seçenek üret (Yalnız Faz başında veya `- Persona: sor` istendiğinde)
Karar büyük bir Faz kararıysa veya kullanıcı "personalara sor / alternatif üret" dediyse:
1. `personalar.md`'den (yoksa `~/mdk/personalar.md`) iş türüne göre alan seç: `proje-gelistirme`, `sunum`, `arastirma`; uymuyorsa aynı kart biçiminde yeni alan taslağı yaz. Alandan 3 kart seç, en az biri karşı çıkan (seçim kuralı dosyada). Dosyayı değiştirince `node persona-denetle.mjs` (mdk kökünde) ile biçimi denetle.
2. Personaları Claude alt ajanında DEĞİL, OpenCode'da PLAN'daki `Görev persona:` modeliyle, her kart ayrı oturumda çalıştır: soruyu bir dosyaya yaz, sonra `~/mdk/persona-tur.sh <alan> <soru-dosyası> "<kart 1>" "<kart 2>" "<kart 3>"` ya da adımın altına `- Persona: sor` ekleyerek `mdk-adim.sh`'in otomatik koşturmasını sağla.
3. Kartın sayısal ya da evet/hayır hükmüne güvenme; kendin sına.
4. Benchmark: yalnızca sıfırdan yeni bir Faz tasarımında benzer 3 ürünü web aramasıyla bul, kaynak ver; bulunamazsa "doğrulanamadı" yaz.
5. Tek tablo: **Seçenek | Adım sayısı | Kullanıcıya değer | Uygulama maliyeti (token) | Risk | Kaynak/Persona**.
6. Kural: en az bir seçenek kullanıcının önerisinden **yaklaşım olarak** farklı olsun. Öneri ver ve nedenini tek cümleyle söyle.
7. Kararı `personalar.md` "Karar günlüğü"ne satır olarak yaz; alan ilk kez kullanıldıysa `Durum: denendi` yap.

## 4. Etki taslağı (Yalnız yeni ekran Fazında veya kullanıcı `- Etki:` istediğinde)
Küçük UI değişikliklerinde kroki çizme. Yalnızca yeni bir ekran/düzen Fazında veya kullanıcı istediğinde gri tonlu "önce/sonra" kroki hazırla (`etki/<özellik>.html`). Adıma `- Etki: etki/<özellik>.html` ve `- Değer: 1-5` ekle; karar panelin Etki kartından gelir (`etki/kararlar.jsonl`); taslağı yazınca `node ~/mdk/karar-bekle.mjs <proje>`'yi Monitor ile izle.

## 5. Kullanıcıya sorma
En fazla 3 soru, her birinin önerilen varsayılanı olsun. Yanıt gelmezse varsayılanla ilerle. Karar kullanıcıya ait değilse sorma.

## 6. Teslimde
Raporu "ne yapıldı" yerine "hipotez ve iş değeri açısından ne değişti, neyi doğruladı/çürüttü" diye yaz.
