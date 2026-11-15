import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshot } from './durum.mjs';
import { harcamaHtml, drawerHtml } from './ciz.mjs';

const denemeler3 = [
  { deneme: 1, model: 'm/a', gecti: false, neden: 'kota', sure_sn: 5, token: 0 },
  { deneme: 1, model: 'm/b', gecti: false, neden: 'kapi', sure_sn: 70, token: 40000 },
  { deneme: 2, model: 'm/b', gecti: true, neden: null, sure_sn: 65, token: 61500 },
];

// (1)
const h1 = harcamaHtml([], { deneme: 9, butce: 300000 });
assert.ok(h1.includes('henüz denenmedi'));
assert.ok(h1.includes('En çok 9 deneme'));
assert.ok(h1.includes('300.000'));

// (2)
const h2 = harcamaHtml(undefined, null);
assert.ok(h2.includes('henüz denenmedi'));
assert.ok(!h2.includes('En çok'));

// (3)
const h3 = harcamaHtml(denemeler3, { deneme: 9, butce: 300000 });
assert.ok(h3.includes('2 deneme'));
assert.ok(h3.includes('2 dk 20 sn'));
assert.ok(h3.includes('101.500'));
assert.ok(h3.includes('kabul testinden geçemedi'));
assert.ok(h3.includes('modelin kullanım hakkı dolmuştu'));
assert.ok(!h3.includes('>kapi<'));
assert.ok(!h3.includes(' kapi '));
assert.equal((h3.match(/harcama-deneme/g) || []).length, 3);
assert.equal((h3.match(/✓/g) || []).length, 1);
assert.ok((h3.match(/✕/g) || []).length >= 1);

// (4)
const h4 = harcamaHtml([{ deneme: 1, model: 'm/x', gecti: false, neden: '<x>', sure_sn: 1, token: 1 }], null);
assert.ok(h4.includes('&lt;x&gt;'));

// (5)
const h5 = drawerHtml({ no: 1, baslik: 'İş', kabul: ['a'], denemeler: denemeler3, sinir: { deneme: 9, butce: null } });
const iKabul = h5.indexOf('BU İŞ NE ZAMAN BİTMİŞ SAYILIR');
const iHarcama = h5.indexOf('HARCAMA');
const iPersona = h5.indexOf('PERSONA DÜŞÜNCELERİ');
assert.ok(iKabul !== -1 && iHarcama !== -1 && iPersona !== -1);
assert.ok(iKabul < iHarcama && iHarcama < iPersona);
assert.ok(!h5.includes('Bir model en çok'));

// (6)
const r1 = mkdtempSync(join(tmpdir(), 'harcama-'));
writeFileSync(join(r1, 'PLAN.md'), 'Yürütücü: opencode\nGörev kod: a/1, a/2, a/3\nGörev eskale: e/1, e/2\nBütçe: 250000\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
assert.deepEqual(snapshot(r1).sinir, { deneme: 8, butce: 250000 });

const r2 = mkdtempSync(join(tmpdir(), 'harcama-'));
writeFileSync(join(r2, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/1, a/2\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
assert.deepEqual(snapshot(r2).sinir, { deneme: 4, butce: null });

const r3 = mkdtempSync(join(tmpdir(), 'harcama-'));
assert.deepEqual(snapshot(r3).sinir, { deneme: 0, butce: null });

console.log('harcama.test ok');
