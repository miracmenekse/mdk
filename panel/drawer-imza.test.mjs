// Adım 130 kapısı: açık adım çekmecesi canlı güncellenir.
// drawerImza(adim, etki): adımın persona/bitti ve etki kaydının figma/onay/bitti/karar.ts/alindi
// alanlarından kararlı bir imza metni üretir.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawerImza } from './ciz.mjs';

// aynı girdi → aynı imza
const adim = { persona: 'persona-tur/x', bitti: false, baslik: 'A' };
const etki = { figma: null, onay: false, bitti: false, karar: null, alindi: false };
assert.strictEqual(drawerImza(adim, etki), drawerImza(adim, etki), 'aynı girdi → aynı imza');

// persona null → 'persona-tur/x' değişince farklı
const aPersonaNull = { persona: null, bitti: false, baslik: 'A' };
const aPersonaTur = { persona: 'persona-tur/x', bitti: false, baslik: 'A' };
assert.notStrictEqual(
  drawerImza(aPersonaNull, etki),
  drawerImza(aPersonaTur, etki),
  'persona değişince imza değişir',
);

// etki figma null → url değişince farklı
const eFigmaNull = { figma: null, onay: false, bitti: false, karar: null, alindi: false };
const eFigmaUrl = { figma: 'https://www.figma.com/design/abc', onay: false, bitti: false, karar: null, alindi: false };
assert.notStrictEqual(
  drawerImza(adim, eFigmaNull),
  drawerImza(adim, eFigmaUrl),
  'figma değişince imza değişir',
);

// onay false → true değişince farklı
const eOnayFalse = { figma: null, onay: false, bitti: false, karar: null, alindi: false };
const eOnayTrue = { figma: null, onay: true, bitti: false, karar: null, alindi: false };
assert.notStrictEqual(
  drawerImza(adim, eOnayFalse),
  drawerImza(adim, eOnayTrue),
  'onay değişince imza değişir',
);

// karar null → {ts:5} değişince farklı
const eKararNull = { figma: null, onay: false, bitti: false, karar: null, alindi: false };
const eKararTs = { figma: null, onay: false, bitti: false, karar: { ts: 5 }, alindi: false };
assert.notStrictEqual(
  drawerImza(adim, eKararNull),
  drawerImza(adim, eKararTs),
  'karar.ts değişince imza değişir',
);

// yalnız baslik değişince eşit
const aBaslik1 = { persona: 'persona-tur/x', bitti: false, baslik: 'A' };
const aBaslik2 = { persona: 'persona-tur/x', bitti: false, baslik: 'B' };
assert.strictEqual(
  drawerImza(aBaslik1, etki),
  drawerImza(aBaslik2, etki),
  'yalnız baslik değişince imza aynı kalmalı',
);

// eksik/null girdiler hata vermez
assert.doesNotThrow(() => drawerImza(null, null));
assert.doesNotThrow(() => drawerImza({ no: 1 }, undefined));

// index.html canlı güncelleme kanıtı
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(html.includes('drawerImza('), 'index.html drawerImza çağrısı içermeli');
assert.ok(html.includes('textarea[name=metin]'), 'index.html textarea[name=metin] denetimi içermeli');

console.log('drawer-imza.test ok');