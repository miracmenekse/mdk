// Kapı: model × adım matrisi. Kullanım: node panel/matris.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshot } from './durum.mjs';
import { matrisHtml } from './ciz.mjs';
import { baslat } from './sunucu.mjs';

const d = mkdtempSync(join(tmpdir(), 'matris-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const sat = (o) => JSON.stringify({ ts: 1, adim: 1, yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, sure_sn: 10, token: 100, maliyet: 0, ...o });
writeFileSync(join(d, 'metrikler.jsonl'), [
  sat({}),                                                                   // a/x adım 1: ilk denemede geçti
  sat({ adim: 2, gecti: false, neden: 'kapi', sure_sn: 20 }), sat({ adim: 2, deneme: 2, sure_sn: 30 }), // adım 2: 2. denemede geçti
  sat({ adim: 3, gecti: false, neden: 'kapi' }), sat({ adim: 3, deneme: 2, gecti: false, neden: 'sure' }), // adım 3: kaldı (2 gerçek deneme)
  sat({ model: 'b/y', gecti: false, neden: 'yanit_yok', sure_sn: 900, token: 0 }),                       // b/y adım 1: yalnız sessiz
  sat({ model: 'b/y', adim: 3, gecti: false, neden: 'yanit_yok' }), sat({ model: 'b/y', adim: 3, deneme: 2 }), // b/y adım 3: sessiz + gerçek geçti (2. deneme)
  sat({ yurutucu: 'kodcu', model: 'kodcu', adim: 2, sure_sn: null, token: null }),
  JSON.stringify({ tur: 'inceleme', adim: 9, inceleme: 'uyumlu', ts: 1 }),     // inceleme satırı adım sayılmaz
  'bozuk',
].join('\n') + '\n');

const m = snapshot(d).matris;
assert.deepEqual(m.adimlar, [1, 2, 3], 'adımlar sıralı, inceleme satırı ve bozuk satır sayılmaz');
const sat_ = (yur, model) => m.modeller.find((x) => x.yurutucu === yur && x.model === model);
assert.deepEqual(m.modeller.map((x) => `${x.yurutucu}/${x.model}`), ['kodcu/kodcu', 'opencode/a/x', 'opencode/b/y'], 'yürütücü, sonra model sırası');
const ax = sat_('opencode', 'a/x').hucreler;
const ozet = (h) => ({ durum: h.durum, deneme: h.deneme, sure: h.sure });   // adım 71: hücrede token/istek de var
assert.deepEqual(ozet(ax[1]), { durum: 'ilk', deneme: 1, sure: 10 });
assert.deepEqual(ozet(ax[2]), { durum: 'cok', deneme: 2, sure: 30 }, 'geçen denemenin numarası ve süresi');
assert.deepEqual(ozet(ax[3]), { durum: 'kaldi', deneme: 2, sure: null }, 'kalan hücrede deneme = gerçek deneme sayısı');
const by = sat_('opencode', 'b/y').hucreler;
assert.equal(by[1].durum, 'sessiz'); assert.equal(by[1].deneme, 0);
assert.equal(by[3].durum, 'cok', 'sessiz satır sayılmaz: gerçek deneme 2. denemede geçti');
assert.equal(by[2], undefined, 'denenmeyen hücre yok');
assert.equal(sat_('kodcu', 'kodcu').hucreler[2].sure, null, 'süre yoksa null');
assert.deepEqual(snapshot(mkdtempSync(join(tmpdir(), 'matris-bos-'))).matris, { adimlar: [], modeller: [] });

// çizim
const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const h = matrisHtml(m);
assert.ok(h.includes('hucre ilk') && h.includes('hucre cok') && h.includes('hucre kaldi') && h.includes('hucre sessiz') && h.includes('hucre bos'));
const t = duz(h);
for (const s of ['✓1', '✓2', '✕2', '○', 'opencode/a/x', 'kodcu']) assert.ok(t.includes(s), `matriste ${s} yok`);
assert.ok(/<th[^>]*>\s*1\s*<\/th>/.test(h) && /<th[^>]*>\s*3\s*<\/th>/.test(h), 'adım numaraları başlıkta');
assert.ok(h.includes('title='), 'hücrede ayrıntı (title): süre ve deneme');
assert.ok(/açıklama|✓N/.test(duz(h)), 'simge açıklaması (lejant) olmalı');
assert.ok(!h.includes('undefined') && !h.includes('NaN') && !h.includes('null'));
assert.ok(duz(matrisHtml({ adimlar: [], modeller: [] })).includes('metrik yok'));
assert.ok(duz(matrisHtml(null)).includes('metrik yok'));
assert.ok(!matrisHtml({ adimlar: [1], modeller: [{ yurutucu: 'o', model: '<b>x</b>', hucreler: {} }] }).includes('<b>x</b>'), 'kaçışlanmalı');

// sayfa
const s = await baslat(d, 0);
const sayfa = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
assert.ok(sayfa.includes('id="matris"') && sayfa.includes('matrisHtml'));
assert.ok(/\.hucre\.ilk/.test(sayfa) && /\.hucre\.kaldi/.test(sayfa) && /\.hucre\.sessiz/.test(sayfa), 'hücre CSS kuralları (renk + simge birlikte)');
await s.kapat();
console.log('matris.test ok');
