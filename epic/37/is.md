# Terminalsiz kurulum

Kaynak: yapılacaklar 2 + 11 + 7 (claude-code-router, dyad). Ticarileşme kapısının ilk şartı (`strateji/konum.md`).

## Problem ve hipotez
Rakipler tek tıkla açılıyor; mdk Node, git, opencode ve terminal istiyor. Hipotez: kurulum sihirbazı (eksikleri bulur, Node'u indirip doğrular, paneli açar) hedef kitlenin ilk engelini kaldırır.

## Kapsam
1. Ön koşul denetimi ve sade rapor (Node, git, opencode, gh).
2. Çift tıklanır başlatıcı (macOS `.command`, Windows `.cmd`) → paneli açar.
3. Panelde ilk açılış sihirbazı.
4. Windows PC'de gerçek deneme (elle; kullanıcının makinesi): `node test/hepsi.mjs`, `MDK_OPENCODE`, `MDK_BASH`.

## Not
Ağdan indirme "ağ yok" kuralına ikinci istisna olur; Epic başlarken karar.
