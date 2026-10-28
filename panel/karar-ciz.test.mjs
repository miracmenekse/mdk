// Kapı (adım 67): ciz.mjs etkiKart — açık adımda karar formu ve son karar durumu.
import assert from 'node:assert/strict';
import { etkiHtml } from './ciz.mjs';

const kart = (o) => ({ no: 31, baslik: 'Rapor', dosya: 'etki/r.html', deger: 3, bitti: false, onay: false, karar: null, alindi: false, tahmin: { token: 1000, maliyet: 0, guven: 'dusuk' }, ...o });
const duz = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// kararsız açık adım: form, not kutusu, üç tür düğmesi; data-no adım numarası
let h = etkiHtml([kart({ no: 31 })]);
assert.match(h, /<form class="karar" data-no="31"/);
assert.match(h, /<textarea name="metin"[^>]*maxlength="2000"/);
for (const [tur, ad] of [['onay', 'Onayla'], ['red', 'Reddet'], ['yorum', 'Yorum']]) {
  assert.match(h, new RegExp(`<button type="submit" name="tur" value="${tur}"[^>]*>${ad}</button>`), `${tur} düğmesi`);
}
assert.match(h, /class="karar-durum"/, 'durum satırı yeri (JS yazar) her formda olmalı');
assert.ok(!/son karar/.test(duz(h)), 'karar yokken "son karar" yazılmaz');

// son karar: tür, metin (kaçışlı) ve iletim durumu üç hâlde
const k = { ts: Date.UTC(2026, 9, 28, 9, 5), no: 32, tur: 'red', metin: '<b>sağa</b> al' };
const alindi = duz(etkiHtml([kart({ no: 32, karar: k, alindi: true })], { izleyici: false }));
assert.match(alindi, /son karar: red/);
assert.ok(alindi.includes('&lt;b&gt;sağa&lt;/b&gt; al'), 'metin kaçışlı');
assert.match(alindi, /Claude aldı/);
const iletiliyor = duz(etkiHtml([kart({ no: 32, karar: k, alindi: false })], { izleyici: true }));
assert.match(iletiliyor, /Claude'a iletiliyor/);
assert.ok(!/kuyrukta/.test(iletiliyor));
const kuyruk = duz(etkiHtml([kart({ no: 32, karar: k, alindi: false })], { izleyici: false }));
assert.match(kuyruk, /kuyrukta/);
assert.match(kuyruk, /oturum/);
assert.ok(!/Claude aldı|iletiliyor/.test(kuyruk));

// onaylı adım: form yok, "onaylandı"; biten adım: form yok
h = etkiHtml([kart({ no: 33, onay: true })]);
assert.ok(!h.includes('<form'), 'onaylı adımda form olmamalı');
assert.match(duz(h), /onaylandı/);
h = etkiHtml([kart({ no: 34, bitti: true })], { gecmisAcik: true });
assert.ok(!h.includes('<form'), 'biten adımda form olmamalı');

// iki açık kart: her form kendi numarasıyla
h = etkiHtml([kart({ no: 35 }), kart({ no: 36, baslik: 'İkinci' })]);
assert.deepEqual([...h.matchAll(/data-no="(\d+)"/g)].map((m) => m[1]), ['35', '36']);
console.log('karar-ciz.test ok');
