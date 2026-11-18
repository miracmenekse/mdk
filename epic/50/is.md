# Epic 50 — Yapılacaklar listesindeki işlerin silinebilmesi

## Amaç
Paneldeki "Yapılacaklar" listesine eklenmiş bir işin gerektiğinde listeden silinebilmesi.

## Kapsam
1. `panel/yapilacak.mjs`: `yapilacakSil(liste, id)` saf işlevi (id yoksa hata, varsa filtrelenmiş yeni liste döner).
2. `panel/sunucu.mjs`: `POST /api/yapilacak` uç noktasına `islem: 'sil'` desteği (`yapilacaklar.json` güncellenir ve `yapılacak: sil #<id>` commit'i atılır).
3. `panel/ciz.mjs`: `yapilacaklarHtml` içinde açık ve bitmiş işler için sil düğmesi (`dugme('sil', '', 'sil')`).
4. `panel/index.html`: `.yap-islem` dinleyicisinde `sil` işlemi yönlendirmesi ve sil düğmesi stili.
