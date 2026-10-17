# opencode-akis

Claude planlar, OpenCode (ücretsiz modellerle) geliştirir, kalite kapıdan geçerek garanti edilir. Bu proje hem bu sürecin aracı hem de kendi canlı paneli.

## Süreç (global kural: ~/.claude/CLAUDE.md)
- Plan yazarken `ba-pm-bakis` becerisini yükle (hipotez, iş değeri, akış, UI kararında personalardan farklı seçenekler, en fazla 3 soru).
- Yeni adımları `PLAN.md`'ye **9'dan devam eden numarayla** ekle; her adımda çalıştırılabilir `- Kapı:`. Kapı test dosyalarını (`*.test.mjs`) sen (Claude) yaz, OpenCode'a değiştirtme.
- Çalıştırma: `./op-adim.sh <no>` (temiz git ağacı şart; önce planı ve kapıları commit et). Çıkış 2 = eskale → adımı `kodcu`ya ver. Sonunda diff'i plana karşı gözden geçir.
- İzleme: `node izle.mjs` (terminal), `node panel/sunucu.mjs . 4747` (panel; kullanıcı VS Code Ports sekmesinden 4747'yi yönlendirir).

## Durum (2026-10-17)
Adım 1-8 bitti: panel (ayrıştırıcı, durum, canlı sunucu, arayüz), etki taslağı + maliyet tahmini + etki sekmesi, `ba-pm-bakis` + `personalar.md`.

## Açık işler
- Panele "Geçmiş" bölümü (adım başına commit, değişen dosya, +/- satır) önerildi, onaylanmadı.
- Kapıları daha kapsayıcı yap (başarı/hata/sınır + kullanıcı senaryosu); personaları netleştir.
- Adım başına token bütçesi (adım 7 ~730 bin token harcadı, diğerleri 40-140 bin).
- Etki sekmesi gerçek bir etki adımıyla, `ba-pm-bakis` gerçek bir planla denenmedi.
- Panelin kullanıcının tarayıcısındaki görünümü doğrulanmadı.

## Tuzaklar
- `opencode run` stdin kapalı (`</dev/null`) çalışmalı; yoksa `timeout` altında takılır.
- Süreç durdururken `pkill -f` kullanma (kendi kabuğunu da öldürür), PID ile öldür.
- VM'deki snap Firefox ekran görüntüsünü gizli dizine yazamaz; `--screenshot ~/x.png` kullan, sonra sil.
- Panel yalnızca `127.0.0.1`'e bağlanır; VM'den dışarı port açma.
