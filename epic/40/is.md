# Graph bağlamı ile nokta atışı geliştirme (graphify)

## Problem
Kod ve kapı yazan ucuz modeller, adımın dokunacağı dosya/fonksiyonu bulmak için repoyu kendileri tarıyor: token harcanıyor, bazen yanlış yere yazıyorlar ya da kapıda davranış yerine kaynak metni test ediyorlar.

## Hedef
`graphify` (yerel, LLM'siz AST graph'ı) adımın `Ne:` metnine göre küçük bir bağlam dilimi (ilgili dosya, fonksiyon, satır) üretir; koşturucu bu dilimi kod ve kapı istemine ekler. İsteğe bağlıdır (`MDK_GRAF=1`), ölçülür (`MDK_DENEY` + metrikte `graf`).

## Kararlar (kullanıcı, 2026-11-16)
- `graphify-out/` git'e girmez (`.gitignore`); graph her adımdan önce `graphify update .` ile tazelenir (~3 sn, LLM yok).
- Çıktı klasörü git'ten gizlenmemişse graph kullanılmaz (temiz ağaç / `git add -A` kirlenmesin).
- graphify yoksa ya da hata verirse adım bugünkü gibi graph'sız koşar; graph hiçbir zaman adımı düşürmez.
- Yürütücü kurallarına (`yurutucu-kurallar.md`) graph'tan söz edilmez; bağlam yalnız istem dilimiyle gider (yürütücüden bağımsız).

## Başarı ölçütü
Aynı tür adımlarda `MDK_GRAF=1 MDK_DENEY=graf` koşuları ile graph'sız koşular `karsilastir.mjs`'de karşılaştırılır: ilk deneme oranı ve token.
