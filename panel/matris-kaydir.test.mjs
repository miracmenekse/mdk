// Kapı (adım 49): matris kendi içinde yatay kaydırılır, model sütunu yapışkan. Kullanım: node panel/matris-kaydir.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matrisHtml } from './ciz.mjs';

const adimlar = Array.from({ length: 40 }, (_, i) => i + 1);
const hucreler = Object.fromEntries(adimlar.map((n) => [n, { durum: 'ilk', deneme: 1, sure: 5 }]));
const h = matrisHtml({ adimlar, modeller: [{ yurutucu: 'kodcu', model: 'fable', hucreler }] });

// tablo kaydırma kabının içinde, lejant dışında
const m = h.match(/^<div class="kaydir"><table class="matris">[\s\S]*<\/table><\/div>(.*)$/);
assert.ok(m, 'tablo <div class="kaydir"> içinde olmalı: ' + h.slice(0, 80));
assert.ok(m[1].includes('class="lejant"'), 'lejant kaydırma kabının dışında kalır');
assert.ok(h.includes('<th>40</th>'), 'tüm sütunlar çizilir');
// boş durum değişmez
assert.equal(matrisHtml({ adimlar: [], modeller: [] }), '<span class="bos">metrik yok</span>');

const css = readFileSync(new URL('./index.html', import.meta.url), 'utf8').replace(/\s+/g, ' ');
const kural = (sec) => css.match(new RegExp(sec.replace(/[.]/g, '\\.') + ' ?\\{([^}]*)\\}'))?.[1] || '';
assert.match(kural('.kaydir'), /overflow-x: ?auto/, '.kaydir { overflow-x: auto }');
const st = css.match(/table\.matris th\.model ?\{[^}]*position: ?sticky[^}]*\}/)?.[0];
assert.ok(st, 'model sütunu sticky');
assert.match(st, /left: ?0/, 'left: 0');
assert.match(st, /background: ?var\(--kart\)/, 'opak arka plan (kayan hücreler altında kalır)');
console.log('matris-kaydir.test ok');
