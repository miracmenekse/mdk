# Epic 54 Uygulama Planı: Yalıtılmış Çalışma Alanı ve Temiz Geri Alma

## Hedef
Adım ve test koşularının `PLAN.md` üzerinden (`Yalıtım: evet` / `- Yalıtım: evet`) veya `MDK_YALITIM=1` ile yalıtılmış bir git worktree kopyasında çalıştırılması ve başarısız denemelerde günlük dosyaları korunarak temiz geri alınması.

## Değişiklikler
- `mdk-ortak.mjs`: `yalitimEtkinMi(planMetni, adimBlok, env)` ve `temizGeriAl(kok, hedefCommit)` saf/yardımcı işlevleri.
- `mdk-adim.mjs`: `YALITIM_ETKIN` kontrolüyle adım veya plan bazında yalıtılmış çalışma alanının devreye alınması.

## Doğrulama
- `node test/yalitim-alan.test.mjs`
- `node test/adim-yalitim.test.mjs`
