# Epic 52 Uygulama Planı: Uygulama Planlarının MDK Panelinde Görüntülenmesi

## Hedef
Hazırlanan teknik uygulama planlarının (`epic/<no>/plan.md` ve `epic/<no>/is.md`) doğrudan MDK panelinde (**Geliştirme → Epic → Detay** çekmecesinde) zengin biçimli olarak okunabilmesi ve onaylanabilmesi.

## Bileşenler ve Değişiklikler

### 1. Sunucu Uç Noktası (`panel/sunucu.mjs`)
- `GET /api/epic?no=<no>` uç noktası `tartisma.json` okumasının yanı sıra `epic/<no>/plan.md` ve `epic/<no>/is.md` dosyalarını da güvenli yol denetimiyle (`realpathSync` kök içinde kalarak) okur.
- Yanıt nesnesine `plan` (`epic/<no>/plan.md` içeriği ya da `null`) ve `is` (`epic/<no>/is.md` içeriği ya da `null`) alanları eklenir.

### 2. Çekmece Çizimi ve Etkileşim (`panel/ciz.mjs` & `panel/index.html`)
- `epicDrawerHtml(epik, tartisma, izleyici, guncellenen, hizliAtlama)` fonksiyonunda:
  - `planMetni = tartisma?.plan || epik?.plan || tartisma?.is || epik?.is || null` kontrol edilir.
  - `planMetni` varsa bölüm navigasyonuna (`drawer-gosterge`) **Plan** sekmesi eklenir ve çekmece içinde `<h3 class="drawer-bolum">UYGULAMA PLANI</h3>` başlığı altında `cozumHtml(planMetni)` ile biçimli olarak çizilir.
  - **KARAR** bölümünde `tartisma?.durum === 'bitti' || Boolean(planMetni)` koşuluyla yalın kipteki planlar için de onay/red/yorum formu gösterilir.
- `epicImza(epik, tartisma)` fonksiyonuna `planMetni` uzunluğu eklenerek canlı güncelleme desteklenir.
- `panel/index.html` içinde `/api/epic` yanıtından dönen `plan` ve `is` alanları `kayit` / `tartisma` nesnesine aktarılır.

## Doğrulama
- `node test/epic-plan-gorunum.test.mjs`
