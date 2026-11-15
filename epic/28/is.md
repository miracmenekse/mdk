# Sağlayıcı hataları: türüne göre davran, sade dille söyle

Kaynak: yapılacaklar 8 + 9 (`strateji/teknik/ozet.md` 1-2; claude-code-router, Aider, dyad).

## Problem ve hipotez
Model sağlayıcısı hata verdiğinde koşturucu yalnız iki şeyi tanıyor: kota bitti ve hiç yanıt yok. Geçici hatalar (oran sınırı, 5xx, ağ kopması) kalıcı hata gibi işleniyor; kullanıcı panelde "neden durdu, ne yapmalıyım" sorusunun cevabını görmüyor. Hipotez: hatayı türüne ayırıp geçici olanı kısa bekleyip yeniden denemek boşa giden denemeyi azaltır; sade ileti + önerilen adım teknik olmayan kullanıcının takılmasını önler.

## Bugünkü durum (kod okundu, 2026-11-15)
- `mdk-adim.mjs`: `KOTA` düzenli ifadesi + `yanit_yok`; ikisinde de beklemeden sıradaki modele geçer, eskale etmez, hepsi tükenirse çıkış 6. Bu doğru ve kalır.
- Eksik: geçici hata sınıfı, kimlik/model yok sınıfı, denemenin nedeninin sade dille kaydı, panelde ileti.
- `metrikler.jsonl` (67 kayıt): 6 kota, 2 süre, 2 regresyon. Gerçek günlüklerde tek hata olayı biçimi: `{"type":"error","error":{"name":"UnknownError","data":{"message":"…"}}}`.

## Kapsam
1. Saf sınıflandırıcı modül (`mdk-hata.mjs`): günlük metni → `{ tur, gecici, bekleMs, ileti, oneri }`.
2. Koşturucuya bağlama: geçici hatada aynı modeli sınırlı sayıda, artan beklemeyle yeniden dene; kalıcıda beklemeden sıradaki model; her deneme nedeniyle metriğe ve duruma yazılır.
3. Panel: koşan/duran story'de sade ileti ve önerilen adım.

## Başarı ölçütü
Kota/anahtar/ağ/oran sınırı durumlarının her biri panelde ayrı, sade bir cümle ve bir öneriyle görünür; geçici hata yüzünden model atlanmaz.

## Riskler
Gerçek hata metni örneği az; sınıflandırıcı tanımadığı hatayı "bilinmeyen" sayıp bugünkü davranışı korumalı.
