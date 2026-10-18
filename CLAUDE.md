# opencode-akis

Claude planlar, OpenCode (ücretsiz modellerle) geliştirir, kalite kapıdan geçerek garanti edilir. Bu proje hem bu sürecin aracı hem de kendi canlı paneli.

## Süreç (global kural: ~/.claude/CLAUDE.md)
- Plan yazarken `ba-pm-bakis` becerisini yükle (hipotez, iş değeri, akış, UI kararında personalardan farklı seçenekler, en fazla 3 soru).
- Yeni adımları `PLAN.md`'ye **9'dan devam eden numarayla** ekle; her adımda çalıştırılabilir `- Kapı:`. Kapı test dosyalarını (`*.test.mjs`) sen (Claude) yaz, OpenCode'a değiştirtme.
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

## Tuzaklar
- `opencode run` stdin kapalı (`</dev/null`) çalışmalı; yoksa `timeout` altında takılır.
- Süreç durdururken `pkill -f` kullanma (kendi kabuğunu da öldürür), PID ile öldür.
- VM'deki snap Firefox ekran görüntüsünü gizli dizine yazamaz; `--screenshot ~/x.png` kullan, sonra sil.
- Kapı testini commit etmeden önce kırmızı olduğunu doğrula; yürütücü "test mantıksız" derse haklı olabilir (örn. adım 23), kapı sahibi (Claude) testi düzeltir, kod teste uydurulmaz.
- Ücretsiz kota dolunca OpenCode çıkmadan sessizce bekler: `yanit_yok` (ILK sn) tespiti çıkış 6 verir. Kodcu alt ajanının commit trailer'ı "Haiku 5.5" yazabiliyor; yerel geçmiş, yeniden yazılmadı.
- UI işinde yalnızca kapılara güvenme: gerçek Firefox ekran görüntüsü al (geciktirici sarmalayıcı sayfa gerekir, yoksa canlı veri gelmeden çeker). Canlı paneli yeni kodla yeniden başlat (`bash op-panel.sh stop . 4747 && bash op-panel.sh start . 4747`), testler kendi sunucusunu kullanır.
- Panel yalnızca `127.0.0.1`'e bağlanır; VM'den dışarı port açma.
