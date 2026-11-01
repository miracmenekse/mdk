// Adım 99 kapısı: kpiHtml 4 tıklanabilir sekme-kartı (Depo/Akış/Modeller/Araştırma), Etki yok.
// Rozet = dikkat gerektiren sayısı (Depo: değişen dosya; Akış: sorunlu adım; Modeller: sorunlu model;
// Araştırma: 0→gizli). Her kart role="tab" + data-sekme.
import assert from 'node:assert/strict';
import { kpiHtml } from './ciz.mjs';

const snap = {
  plan: { kategoriler: [{ adimlar: [{ no: 1, bitti: true }, { no: 2, bitti: false }] }] },
  gecmis: [{ no: 1, denemeler: [{ deneme: 2, gecti: true, model: 'a', neden: null }] }], // 2. denemede → sorunlu
  incelemeler: {},
  modeller: [
    { model: 'x', yurutucu: 'o', uyum: 1, sessiz: 0, token: 1 },
    { model: 'y', yurutucu: 'o', uyum: 0.5, sessiz: 0, token: 1 }, // uyum<1 → sorunlu
  ],
  depo: { var: true, yerel: { ileri: 26, geri: 0, degisik: ['a.js', 'b.js'] } },
};
const ara = { adaylar: [{}, {}] };
const h = kpiHtml(snap, ara);

// 4 kart, Etki yok
for (const s of ['depo', 'akis', 'modeller', 'arastirma']) {
  assert.ok(new RegExp(`data-sekme="${s}"`).test(h), `${s} kartı yok`);
}
assert.ok(!/data-sekme="etki"/.test(h), 'Etki kartı olmamalı');
assert.equal((h.match(/role="tab"/g) || []).length, 4, '4 sekme kartı');
assert.ok(h.includes('role="tablist"'), 'tablist kapsayıcı');

// değerler
assert.ok(h.includes('26'), 'Depo bekleyen commit = 26');
assert.ok(h.includes('1 / 2'), 'Akış biten/toplam = 1 / 2');

// dikkat rozetleri (depo değişen=2, akış sorunlu=1, modeller sorunlu=1)
assert.ok((h.match(/kpi-rozet/g) || []).length >= 3, 'dikkat rozetleri görünmeli');

// Araştırma rozetsiz (dikkat 0 → gizli)
const ar = h.slice(h.indexOf('data-sekme="arastirma"'));
assert.ok(!ar.slice(0, ar.indexOf('</button>')).includes('kpi-rozet'), 'Araştırma rozetsiz');

console.log('kpi-sekme.test ok');
