# MDK neden bazen kullanılamaz oluyor? (iç denetim)

Tarih: 2026-11-23. Kaynaklar: `metrikler.jsonl` (170 satır, yalnız bu Mac), `PLAN.md`, `git log` (615 commit, 2026-10-17'den beri), `docs/gunluk.md`, bellek notları. Bu sayfa `strateji/katmanlar.md` karar belgesinin girdisidir.

## 1. Rakamlar

| Ölçü | Değer | Kaynak |
|---|---|---|
| Biten story | 226 | `PLAN.md` `- [x]` |
| Story'yi kim bitirdi (git: her story'nin son `adım N:` commit'indeki yürütücü etiketi; tüm makineler) | opencode **74-85** (paralel koşular dahil), kodcu 40, agy 21, claude 9, etiketsiz 27; 40 story'nin kendi commit'i yok (toplu Epic commit'i) | `git log` |
| Tasarlandığı gibi biten story (ucuz/ücretsiz model + kapı) | **~%33-38** (74-85 / 226) | yukarıdaki sayım |
| Metrik kaydı olan story (yalnız bu Mac, story 104'ten sonra) | 64; bunların 41'ini opencode bitirdi | `metrikler.jsonl` |
| Opencode denemelerinde başarı | 67/107 (%63) | metrik |
| Başarısızlık nedeni: kota | 42 satır (ilki 2026-11-14) | metrik `neden` |
| Başarısızlık nedeni: kapı/regresyon/süre/sorun | 9 + 5 + 5 + 5 | metrik `neden` |
| Kayıtlı model maliyeti | 0,56 $ | metrik `maliyet` (Claude planlama token'ı ölçülmüyor) |
| Story süresi | medyan 115 sn, p90 312 sn | metrik |

**Ana bulgu:** MDK'nın vaadi "ucuz model yazar, kapı garanti eder". Git kayıtlarına göre bu vaat bitenlerin ~üçte birinde (%33-38) gerçekleşti. Geri kalan üçte ikiyi Claude, Haiku (kodcu) ya da Antigravity yazdı; yani asıl işi abonelik kotası taşıdı. Metrik dosyası yalnız koşturucudan geçen story'leri kaydeder (64 story, bunların 41'i opencode, ~%64); elle yazılanlar oraya hiç düşmez, bu yüzden tek başına oranı abartır. Not: ilk sürümde 41 yanlışlıkla 226'ya bölünüp "%18" yazılmıştı; düzeltildi. 0,56 $'lık görünür maliyet bu yüzden yanıltıcı.

## 2. Kullanılamazlık nedenleri, iki gruba ayrılmış

### (a) Ucuz ya da ücretsiz model güvenilmezliği: maliyet-kullanılabilirlik ödünleşimi
Bunlar kendi kodumuzu düzeltmekle bitmez, çünkü seçilen kaynağın doğasından gelir.
1. **Kota dolması.** Ücretsiz günlük kota (2026-10-17, 11-15) ve Go aylık kota (11-09, 11-15) birkaç kez doldu. Kanıt: `gunluk.md` "Durum (2026-10-17)" bölümü, bellek notu `mdk-sonraki-isler`, metrikte 42 `kota` satırı. Sonuç: her seferinde iş Claude'a döndü ya da durdu.
2. **Sessiz bekleme ve kısa süreli hız sınırı.** ~20 koşudan sonra 10 modelden 6'sı sessizleşti. Kanıt: `gunluk.md` "Adım 31", çıkış 6 / `yanit_yok`.
3. **Değişken model listesi.** Ücretsiz modeller kaldırılıp ekleniyor (space-bunny, longcat çıktı). Kanıt: `gunluk.md` 2026-10-23.
4. **Model başına aşırı bağlam.** Bir `opencode run` en küçük işte bile 55-110k token harcıyor. Aynı model aynı adımda 192k ile 796k arasında harcadı. Kanıt: `gunluk.md` "ön yoklama" ve "Adım 31".
5. **Yavaş hakem modelleri** (180 sn'de bitmeyebiliyor). Kanıt: bellek notu `mdk-sonraki-isler`.

### (b) Kendi yazdığımız katmanların kusurları: yeniden keşfetme maliyeti
Bunlar hazır bir araçta zaten çözülmüş olabilecek sorunlar.
1. **Koşturucu hataları.** Örnekler: `MDK_DONMUS` kapıyı her model için geçilmez yaptı (e61e11c); kırmızı kapının önceden commit edilmesi bir adımı 7 denemede düşürdü (`gunluk.md` 2026-10-28); bütçenin toplamla sayılması modelleri haksız eledi (2026-10-23); `kapi_kapsam` yanlış alarmı. 615 commit'in 28'i düzeltme.
2. **Aynı ağaçta çakışan koşular.** Bunun için kilit, worktree ve `mdk-dagit.mjs` yazıldı. Kanıt: bellek notu "ders" ve Epic 40 ağaç kilidi.
3. **Windows'a taşıma.** bash'ten Node'a geçiş iki Epic sürdü (25-26), ama Windows'ta hâlâ gerçek koşu yok.
4. **Başkalarının çözdüğünü yeniden yazmak, 11-15'ten beri sürüyor.** `teknik/ozet.md`'de "alınabilir" denen fikirler sıfırdan yazıldı:
   - Story 222: Retry-After, `claude-code-router`'ın aynısı.
   - Story 224: yapılandırılmış tanı, dyad'ın aynısı.
   - Story 225: worktree yalıtımı, dyad'ın aynısı.
   - Story 226: "sıfır bağımlılıklı depo haritası", Aider `repomap`'in aynısı.

   Bu dört story, kullanıcının "optimize edilmişi yeniden optimize ediyoruz" kaygısının somut kanıtı.
5. **Panel bakım yükü.**
   - Üretim kodunun yarısı panelde: 4.487 / 8.977 satır.
   - Son 60 günde en çok değişen dosyalar `panel/ciz.mjs` (80 commit, 1.655 satır) ve `panel/sunucu.mjs` (33 commit, 1.324 satır).
   - Panel testi 80'den fazla dosya.
6. **Bilişsel yük ürünün kendisinde.** Dokuz çıkış kodu, ortam değişkenleri, Figma onay akışının iki aşaması ve `CLAUDE.md`'nin uzunluğu var. Panel kullanıcının işini azaltmak için var, ama MDK'yı kullanmak için önce MDK'yı öğrenmek gerekiyor.

## 3. Katman envanteri (C2)

| Katman | Dosyalar (örnek) | Satır | 60 günde değişim |
|---|---|---|---|
| 1-2 İstek, şartname, planlama, persona | `mdk-epic`, `epic-tartis`, `persona-*`, `mdk-rol` | 967 | düşük-orta |
| 3 Yürütücü adaptörleri | `mdk-uyandir`, `mdk-mcp`, `mdk-ana`, `mdk-kur`, `yurutuculer.json` | 556 | düşük |
| 4 Model, kota, hata | `mdk-hata`, `mdk-karar` (+ `mdk-adim` içinde) | 346+ | orta |
| 5 Kalite kapısı | `mdk-adim-kapi`, `kapi-denetle`, `mdk-hakem`, `mdk-incele`, `mdk-denetim` | 622 | orta |
| 6 Koşu ve durum | `mdk-adim` (24), `mdk-ortak` (13), `mdk-paralel`, `mdk-dagit`, `mdk-geri-al` | 1.485 | **yüksek** |
| 7 Panel | `panel/*.mjs` | 4.487 | **çok yüksek** |
| 8 Metrik | `mdk-kayit`, `karsilastir`, `izle` | 164 | düşük |
| 9 Kural eşitleme | `mdk-esitle`, `esit/` | 49 | düşük |
| Ek: radar, Figma | `mdk-radar`, `mdk-figma` | 301 | düşük |

Testler: 85 + 80'den fazla test dosyası, ayrı.

## 4. Sonuç (katmanlar.md'ye girdi)
- Kullanılamazlığın **en büyük tek nedeni (a1): ücretsiz kotaya dayanmak.** Hangi aracı seçersek seçelim, ucuz model gücü değişmezse bu sürer. Çözüm araç değiştirmek değil, maliyet politikasını değiştirmek: hangi işin hangi kotaya gideceğini ve kota bitince ne olacağını baştan belirlemek.
- **İkinci neden (b): bakım yükü 6. ve 7. katmanlarda toplanıyor.** Bunlar "herkesin yaptığı" katmanlar (koşu düzeni, çakışma, yeniden deneme, pano). Hazır alma adayları en çok burada aranmalı.
- Farkı yaratan, ve az kodla duran katmanlar şunlar: 1 (sözleşme: Kabul), 5 (kapı) ve 8 (maliyet kaydı). Bu, hipotezi destekliyor.
