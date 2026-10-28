// Kapı (adım 53): Etki sekmesinde biten adımların taslakları katlı; boş durum metni. Kullanım: node panel/etki-gecmis.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { etkiHtml } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const e = (no, bitti) => ({ no, baslik: `İş ${no}`, dosya: `etki/${no}.html`, deger: 3, bitti, tahmin: { token: 1000, maliyet: 0, guven: 'orta' } });

// boş / null
for (const x of [[], null, undefined]) {
  const h = etkiHtml(x);
  assert.ok(duz(h).includes('onay bekleyen taslak yok'), 'boş durum metni');
  assert.ok(!h.includes('etki-gecmis') && !h.includes('etki adımı yok'));
}
// yalnız açık: eski biçim, details yok
let h = etkiHtml([e(5, false)]);
assert.ok(h.includes('İş 5') && !h.includes('etki-gecmis') && !duz(h).includes('onay bekleyen taslak yok'));
// bitti alanı olmayan öğe açık sayılır (geriye uyum)
assert.ok(!etkiHtml([{ ...e(6), bitti: undefined }]).includes('etki-gecmis'));

// yalnız biten: boş metin + kapalı details, adım no azalan
h = etkiHtml([e(2, true), e(9, true), e(4, true)]);
assert.ok(duz(h).includes('onay bekleyen taslak yok'));
const m = h.match(/<details class="etki-gecmis"( open)?><summary>([^<]*)<\/summary>([\s\S]*)<\/details>/);
assert.ok(m, 'details.etki-gecmis yok: ' + h.slice(0, 200));
assert.equal(m[1], undefined, 'varsayılan kapalı');
assert.equal(m[2].trim(), 'Biten adımların taslakları (3)');
const sira = [...m[3].matchAll(/İş (\d+)/g)].map((x) => +x[1]);
assert.deepEqual(sira, [9, 4, 2], 'adım no azalan');
assert.ok(m[3].includes('<iframe'), 'aynı kart (kroki) içeride');

// karışık: açık önce, biten details içinde; açık durum korunur
h = etkiHtml([e(1, true), e(7, false)], { gecmisAcik: true });
assert.ok(h.indexOf('İş 7') < h.indexOf('etki-gecmis'), 'açık adım önce');
assert.ok(h.includes('<details class="etki-gecmis" open>'), 'gecmisAcik → open');
assert.ok(!h.split('etki-gecmis')[0].includes('İş 1'), 'biten adım açıkların arasında değil');

// sayfa: toggle durumu tutulur ve çizime verilir
const sayfa = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.match(sayfa, /etkiHtml\(d\.etki, \{ gecmisAcik[,} ]/);
assert.ok(/etki-gecmis/.test(sayfa.split('<script')[1] || ''), 'toggle dinleyicisi details.etki-gecmis için');
console.log('etki-gecmis.test ok');
