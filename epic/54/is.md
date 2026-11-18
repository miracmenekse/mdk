# Epic 54 — Yalıtılmış çalışma alanı (git worktree / overlay workspace)

## Amaç
Adım ve test koşularının yalıtılmış bir kopyada çalıştırılması, olası çakışmaların önlenmesi ve başarısız adımlarda temiz geri alma (checkpoint/revert) imkanı sağlanması.

## Kapsam
1. `mdk-ortak.mjs`: `yalitimEtkinMi(planMetni, adimBlok, env)` ile `MDK_YALITIM=1`, adımda `- Yalıtım: evet` veya PLAN başında `Yalıtım: evet` algılaması; `temizGeriAl(kok, hedefCommit)` ile günlük/durum dosyalarını koruyarak temiz geri alma.
2. `mdk-adim.mjs`: `yalitimEtkinMi` üzerinden otomatik yalıtılmış worktree aktivasyonu.
