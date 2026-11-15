# Sağlayıcıdan bağımsız ana yürütücü

## Problem
Planlayıcı rolü Claude Code'a sıkı bağlı: kurallar `~/.claude`'da, karar izleme Claude'un Monitor aracında, kodcu/tasarımcı Claude alt ajanı, Figma Claude'un MCP bağlantısında. Claude çıkıp yerine başka bir ana yürütücü (X, ör. Antigravity `agy`) gelirse sistemi yönetemez.

## Hedef
"Claude çıktı, yerine X geldi": X, MDK'ya bir MCP sunucusu + ince kural dosyasıyla bağlanır ve sistemi Claude gibi yönetir. İki ana yürütücü (Claude + OpenCode, Antigravity + agy) aynı projede Epic düzeyinde paralel çalışabilir.

## Kararlar (kullanıcı, 2026-11-15)
- MCP sunucusu ortak çekirdek; sağlayıcı başına ince skill/plugin. Uyandırma headless CLI ile (MCP modeli uyandıramaz).
- Ucuz kod modeli ana yürütücünün yeteneğidir: kodcu/tasarımcı o ana yürütücünün kendi modelleri. Model adı kural dosyasına yazılmaz (`yurutuculer.json` yapılandırmadır).
- Paralelliği deterministik dağıtıcı yönetir (kira, dosya çakışması, sıralı birleştirme).
- Karar modeli: hakem kalıbı genelleştirilir; ilk iki tür başarısızlık sınıflandırma ve panel yorumu yönlendirme.
- Başka projeler: MDK global araç; projede yalnız veri; MDK dosyaları projenin git'ine girer (dbeaver-mm dahil, kullanıcı kabul etti); panel proje başına.
- Planlayıcı kuralları `AGENTS.md`'ye DEĞİL `.mdk/planlayici.md`'ye yazılır: OpenCode yürütücüsü `AGENTS.md`'yi okur, planlayıcı kuralları ona sızmasın.

## Başarı ölçütü
`claude` PATH'ten gizliyken boş bir deneme projesinde kurulumdan push'a bir Epic yalnız `agy` ile yürür (elle tatbikat; `agy` kurulunca).
