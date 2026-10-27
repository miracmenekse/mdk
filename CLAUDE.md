# opencode-akis

Claude planlar, OpenCode (ücretsiz modellerle) geliştirir, kalite kapıdan geçerek garanti edilir. Bu proje hem bu sürecin aracı hem de kendi canlı paneli.

## Süreç (global kural: ~/.claude/CLAUDE.md)
- Plan yazarken `ba-pm-bakis` becerisini yükle (hipotez, iş değeri, akış, UI kararında personalardan farklı seçenekler, en fazla 3 soru).
- Yeni adımları `PLAN.md`'ye **son adım numarasından devam ederek** ekle; her adımda çalıştırılabilir `- Kapı:`. Kapı test dosyalarını (`*.test.mjs`) sen (Claude) yaz, OpenCode'a değiştirtme.
- Çalıştırma: `./op-adim.sh <no>` (temiz git ağacı şart; önce planı ve kapıları commit et). Çıkış 2 = eskale → adımı `kodcu`ya ver. Sonunda diff'i plana karşı gözden geçir.
- İzleme: `node izle.mjs` (terminal), `bash op-panel.sh start . 4747` (panel; kullanıcı VS Code Ports sekmesinden 4747'yi yönlendirir).

## Durum (2026-10-17, gün sonu)
Adım 1-29 bitti. Panel: ayrıştırıcı, durum, canlı sunucu, çizim modülü (`panel/ciz.mjs`, saf fonksiyonlar), adım geçmişi (özet satır + açılır ayrıntı, sorunlu açık, "sadece sorunlu" süzgeci), model/yürütücü tablosu, etki sekmesi. Araçlar: `op-adim.sh` (çoklu kapı, kurcalama tespiti, donmuş kopya, süre/token bütçesi, `yanit_yok`, taslak onayı), `op-kayit.mjs` (kodcu satırı + inceleme kaydı, `durum.json` günceller), `karsilastir.mjs`, `kapi-denetle.mjs`, `op-panel.sh start|stop|durum`, `izle.mjs`.
Gerçek OpenCode işi yalnızca adım 1-7'de oldu (glm-5.3-flash-free, ilk denemede %75). Sonra ücretsiz kota doldu ("Rate limit exceeded", 3 modelde de sessizlik); adım 9-29'u `kodcu` yaptı. Kota açılınca `ONCE=<model> ./op-adim.sh <no>` ile model karşılaştırması yapılmalı.

## Açık işler
- 2026-10-18: ücretsiz kota AÇILDI (10 modelden 9'u basit isteğe 8-13 sn'de yanıt verdi; `nemotron-3.5-lightning-free` 45 sn'de yanıt vermedi). Planlardaki `Modeller:` satırı yalnız 3 modeli kullanıyor; geri kalanları da dene. Basit "tamam" yoklaması kaliteyi göstermez, gerçek adımla karşılaştır.
- Ücretsiz kota açılınca: gerçek OpenCode ile küçük adımlar, 2. ve 3. model karşılaştırması (şu an 0 veri).
- Kapıları daha kapsayıcı yap; kapı denetleyici yalnız "test dosyası çalıştırıyor mu"ya bakıyor.
- "Sadece sorunlu" süzgeci henüz çalışmamış adımları da gizliyor (karar gerekebilir).
- Claude'un planlama token'ı ölçülmüyor (aday: claude-view / claude-monitor; doğrulanmadı). OpenCode oturum tekrarı için aday: opencode-observability (yan yana, eklentisiz).
- Metrikte 22/23 ve 27/28 aynı süre/token'ı paylaşıyor (kodcu tek çağrıda iki adım yaptı, bölünmüş tahmin).
- Etki sekmesi gerçek bir etki adımıyla denendi mi: adım 22 `Etki:` taşıyordu ama panelin etki bölümü bitmiş adımları listelemiyor; etki sekmesi hâlâ gerçek bekleyen etki adımıyla görülmedi.
- Panel: model tablosu `neden: yanit_yok` satırlarını model başarısızlığı gibi sayıyor (kota sessizliği %0 görünüyor); adım satırı planın `Yürütücü`'sünü yazıyor, gerçekte işi `kodcu` yapmış olsa bile (demo bunu gösterdi).

## Model seçimi ön yoklaması (2026-10-18, kaba; kesin ölçüm değil)
- İki küçük görev (saf fonksiyon + hazır test; kenar durumlu bash betiği), 10 ücretsiz model, 10 paralel süreç. Görev 1: 8/10 geçti (`big-pickle` bir kez kaldı, görev 2'de geçti; `nemotron-3.5-lightning` 300 sn'de bitmedi). Görev 2: 9/9 geçti. Doğrulukta ayrım çıkmadı; ayıran şey süre ve token: `deepseek-v4.1-flash` 16-27 sn, `space-bunny` 16-33 sn, `nemotron-3-ultra` 505k token (kota yiyici), `mimo` 56-121 sn (yavaş).
- Paralel 10 istekte throttle görülmedi. Bir `opencode run` en küçük görevde bile ~55-110k token (sistem istemi). Günlük limit resmi belgede yok: kaynaklar 200 (opencode Go SSS) ile 450-766 istek/gün (tek kullanıcı ölçümü) arasında; sıfırlama UTC 00:00; ayrıca per-IP/kısa süreli sınır olabilir. Ücretsiz liste "sınırlı süreli", modeller değişir.
- `Modeller:` = glm (gerçek adımda 7/8), deepseek-v4.1-flash, space-bunny, beam. `mimo` yavaşlığı, `lightning` sessizliği yüzünden çıkarıldı. Kolay görevler doygun: ayrım için gerçek zor adımlar (çok dosyalı taşıma, UI) `ONCE=<model>` ile koşulup `karsilastir.mjs` ile okunacak.
- `kodcu` alt ajanı artık `fable` (en yetkin Claude); eskale işleri buna gider.

## Adım 31 model karşılaştırması (2026-10-18, gerçek zor adım, n=1-2, gürültülü)
Her model ayrı git worktree'de, `DENEME=1`, tek modelli plan kopyasıyla koşuldu. Kapı 1 = `persona-denetle.test.mjs`, kapı 2 = `bash test/hepsi.sh`.
- **Çalıştırıcı hatası bulundu ve düzeltildi (e61e11c):** `op-adim.sh` kapıları `OP_DONMUS=1` ile çalıştırıyordu; kapı 2'deki `op-adim.test.sh` bunu devralıp `donmus` vakasında düşüyordu. Yani bu kapı hiçbir model için geçemezdi; ilk dört koşu bu yüzden kapı 2'de eledi. Ders: ilk kez çalıştırılan kapıyı gerçek ortamda (çalıştırıcı içinden) bir kez dene.
- Kapı 1 sonuçları (iki koşu): deepseek-v4.1-flash 2/2 (236-238 sn; 644k/192k token), space-bunny 2/2 (293-345 sn; 608k/796k), glm-5.3-flash 1/2 (ikincisi 600 sn sınırında kesildi; 270k/571k), beam 1/2 (ilk koşuda koda düz metin sızdırdı, sözdizimi hatası; 425k).
- Düzeltilmiş çalıştırıcıyla tam geçen tek koşu: **beam-free**, 275 sn, 587k token; diff'i plana karşı gözden geçirildi, uyumlu. Commit `bench/adim31-beam` dalında (068beaa), ana dala alınmadı. Diğer üç model o koşuda `yanit_yok` verdi.
- Token farkı büyük: aynı model aynı adımda 192k ile 796k arasında harcadı; `Bütçe: 600000` sınırda, adım başına bütçe gevşetilebilir ya da adım bölünmeli.
- **Kota gözlemi:** art arda ~20 koşudan sonra 10 modelden 6'sı 60 sn'de sessizdi (glm, deepseek, space-bunny, mimo, super-vl, big-pickle); yanıt verenler beam, longcat, nemotron-ultra, lightning (49 sn). Kullanım miktarı sessizliği açıklamıyor (mimo/big-pickle az kullanıldı, beam çok kullanıldı): model başına kısa süreli hız sınırı ya da sağlayıcı kapasitesi olabilir. Paralel koşu yüklemeyi hızlandırıyor ama kotayı da çabuk bitiriyor; modelleri art arda, aralıklı koş.
- **Geniş sınırla (1M bütçe, 900 sn; a8e65af'ten, ayrı worktree) iki kapıdan da geçenler:** nemotron-3-ultra 239 sn / 971k token; longcat-2.5-preview 628 sn / 578k token. 600k/600 sn'de ikisi de kapıya ulaşmadan elendi (bütçe / süre): dar sınır modelleri haksız eliyordu.
- **Zor adımda ölçülemeyenler:** nemotron-3.5-super-vl ve big-pickle `yanit_yok` verdi (kota sessizliği, kalite sonucu değil); lightning denenmedi (kolay görevde 300 sn'de bitmedi, yoklamada 49 sn'de yanıt).
- **Özet (adım 31, n=1-2):** hız: nemotron-ultra 239 sn ≈ deepseek 236 sn < beam 275 sn < space-bunny 293-345 sn < glm 360-600 sn < longcat 628 sn. Token: longcat/beam/glm 270-590k, deepseek 192-644k, space-bunny 608-796k, nemotron-ultra 602-971k. Kapı 2'yi (düzeltilmiş çalıştırıcıyla) geçmiş doğrulananlar: beam, nemotron-ultra, longcat; deepseek ve space-bunny yalnız kapı 1'i 2/2 geçti, düzeltme sonrası kota sessizliğine takıldı.
- **Seçim (karar: kullanıcı, 2026-10-19, model seçimi kapandı):** modeller benzer çıktı veriyor; `Modeller:` sırası = **ilk üç: deepseek, beam, nemotron-ultra**; yedekler: space-bunny, glm, longcat. `op-adim.sh` listeyi sırayla dener: model 2 denemede geçemezse ya da kota/sessizlik (`yanit_yok`) olursa sıradakine geçer, yani ilk üçün limiti bitince yedekler otomatik devreye girer. `Bütçe` 1000000. Süre varsayılanı 600 sn; longcat 628 sn sürdü, o devreye girince `SURE=900` ver. super-vl, big-pickle, lightning listede yok (ölçülemedi); gerekirse sona eklenir. Sıra veriyle değişir (en az 3 koşuluk ölçüm yok).
- Doğrulanacak: deepseek ve space-bunny'nin kapı 2 geçişi, super-vl, big-pickle ve lightning'in zor adımdaki sonucu (kota açılınca, art arda).

## Tuzaklar
- `opencode run` stdin kapalı (`</dev/null`) çalışmalı; yoksa `timeout` altında takılır.
- Süreç durdururken `pkill -f` kullanma (kendi kabuğunu da öldürür), PID ile öldür.
- VM'deki snap Firefox ekran görüntüsünü gizli dizine yazamaz; `--screenshot ~/x.png` kullan, sonra sil.
- Kapı testini commit etmeden önce kırmızı olduğunu doğrula; yürütücü "test mantıksız" derse haklı olabilir (örn. adım 23), kapı sahibi (Claude) testi düzeltir, kod teste uydurulmaz.
- Ücretsiz kota dolunca OpenCode çıkmadan sessizce bekler: `yanit_yok` (ILK sn) tespiti çıkış 6 verir. Kodcu alt ajanının commit trailer'ı "Haiku 5.5" yazabiliyor; yerel geçmiş, yeniden yazılmadı.
- UI işinde yalnızca kapılara güvenme: gerçek Firefox ekran görüntüsü al (geciktirici sarmalayıcı sayfa gerekir, yoksa canlı veri gelmeden çeker). Canlı paneli yeni kodla yeniden başlat (`bash op-panel.sh stop . 4747 && bash op-panel.sh start . 4747`), testler kendi sunucusunu kullanır.
- Panel yalnızca `127.0.0.1`'e bağlanır; VM'den dışarı port açma.

## 2026-10-23: bütçe model başına, liste güncellendi
- `op-adim.sh`: `Bütçe` artık model başına (önce adım toplamıydı ve ilk model aşınca diğer modeller hiç denenmeden eskale oluyordu: adım 48, dbeaver-mm K70/K71). Aşan model bırakılır, sıradaki kendi bütçesiyle başlar; `kodcu`ya yalnız tüm modeller tükenince gidilir. Test: `c_butce_model`.
- `space-bunny` ve `longcat` artık ücretsiz listede yok, çıkarıldı; yeni `flint-40b-free` eklendi (henüz ölçülmedi).

## 2026-10-23: token verimliliği araştırması (deepseek ve glm ilk iki model)
- Ölçüm (dbeaver-mm K74, deepseek): ~1M token'ın ~965k'sı önbellekten yeniden okunan bağlam (cache read), üretilen ~13k. Token ≈ adım sayısı × bağlam boyu (~65-80k). Bütçe toplamı saydığı için modeller iş bitmeden kesiliyordu.
- Karar: bütçe artık **etkin token** (toplam − cache read) ile ölçülür; `Bütçe: 300000` (K73 geçen koşularda etkin 96-133k). Her metrik satırında `etkin` alanı var.
- `OP_SADE=1` (deneysel, varsayılan kapalı): `compaction.auto/prune`, `tool_output` 300 satır/20 KB, `experimental.batch_tool`, "PLAN.md'yi okuma, grep -n ile bul, aralık oku" ipucu. K73 ölçümü (n=1, c372e2b6a'dan worktree): deepseek sade 1,09M toplam/103k etkin/285 sn (önceki sade-dışı koşu 891k/225 sn); glm sade 1,90M/133k/500 sn, 37 adım; glm sade-dışı 1,22M/96k/444 sn, 22 adım. Prune hiç tetiklenmedi (bağlam ~70k, pencere dolmuyor), batch_tool kullanılmadı, ipucu glm'yi çok sayıda küçük edit'e itti. Sonuç: bu ayarlar token azaltmadı.
- Sıradaki aday (ölçülmedi): adım sayısını azaltmak — adım metnine ilgili dosyaların satır aralıklarını (Claude'un zaten okuduğu) koymak; büyük adımları tek dosyalık adımlara bölmek.

## 2026-10-27: personalar v2
`personalar.md` üç alan (proje-gelistirme `denendi`; sunum ve arastirma ilk gerçek kullanımda `denendi` olacak), biçim denetimi `node persona-denetle.mjs`. Persona turu Claude alt ajanında değil OpenCode'da: `./persona-tur.sh <alan> <soru> "<kart>"...` (her kart ayrı ücretsiz model oturumu, Claude token'ı ~0). Faz 2 sonucu (PLAN karar notları 2-3): `test -f`/`grep -q` kapılar taslakla geçer, davranışı çalıştıran kapı yaz; adım bölme için otomatik UYARI yok (ölçüt isabetsiz; 9/22'nin zorluğu kota sessizliğiydi).
