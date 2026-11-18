# Epic 52 — Uygulama planlarının MDK panelinde görüntülenmesi

## Amaç
Hazırlanan teknik uygulama planlarının (`epic/<no>/plan.md` ve `epic/<no>/is.md`) MDK panelinde Epic Detay çekmecesinde biçimli olarak gösterilmesi ve onaylanabilmesi.

## Kapsam
1. `panel/sunucu.mjs`: `GET /api/epic?no=<no>` uç noktasının `tartisma.json` yanı sıra `epic/<no>/plan.md` ve `epic/<no>/is.md` dosyalarını (yol güvenliği kontrolüyle) okuyup `{ no, tartisma, plan, is }` olarak döndürmesi.
2. `panel/ciz.mjs` & `panel/index.html`:
   - `epicDrawerHtml` içinde `plan` veya `is` metni varsa **UYGULAMA PLANI** bölümünün (`cozumHtml` ile biçimlendirilmiş olarak) çizilmesi.
   - Yalın kipte (persona tartışması olmasa bile) `plan` veya `is` metni mevcutsa **KARAR** bölümünde çözüm/plan onay formunun aktif olması.
   - `epicImza` imzasına `plan` ve `is` uzunluklarının eklenmesi.
