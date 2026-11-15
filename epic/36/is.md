# Yalıtılmış test ve geri alınabilir adım

Kaynak: yapılacaklar 15 (dyad).

## Problem ve hipotez
Koşturucu çalışma ağacının kendisinde çalışıyor; temiz ağaç şartı ve reset yüzünden koşu sırasında depoya dokunulamıyor. Hipotez: denemeyi git worktree'de koşturmak ve her geçen adımı etiketlemek hem paralelliği hem "geri al"ı güvenli kılar.

## Kapsam
Deneme worktree'de; geçince ana dala alınır; adım başına checkpoint etiketi; panelde "bu adımı geri al".

## Not
`mdk-adim.mjs`'in reset/süreç çekirdeğine dokunur: bu Epic'in çekirdek story'leri opencode'a verilmez (kural).
