import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshot } from './durum.mjs';

const d = mkdtempSync(join(tmpdir(), 'durum-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n- [ ] 2. İş2\n  - Kapı: `true`\n');

let s = snapshot(d); // metrik ve durum dosyası yokken de çalışmalı
assert.equal(s.simdi, null);
assert.deepEqual(s.modeller, []);
assert.deepEqual(s.incelemeler, {});
assert.equal(s.plan.kategoriler[0].adimlar.length, 2);

writeFileSync(join(d, 'durum.json'), JSON.stringify({ adim: 1, baslik: 'İş', model: 'a/x', deneme: 1, durum: 'calisiyor', ts: 1 }));
const satir = (o) => JSON.stringify({ ts: 1, adim: 1, yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, sure_sn: 10, token: 100, maliyet: 0, eklenen: 1, silinen: 0, dosya: 1, ...o });
writeFileSync(join(d, 'metrikler.jsonl'), [
  satir({}),                                                   // a/x adım 1 d1 geçti
  satir({ gecti: false, sure_sn: 20, token: 300, adim: 2 }),   // a/x adım 2 d1 kaldı
  'bozuk satır, atlanmalı',
  satir({ deneme: 2, sure_sn: 30, token: 200, adim: 2 }),      // a/x adım 2 d2 geçti
  satir({ model: 'b/y', gecti: false, adim: 1 }),              // b/y adım 1 d1 kaldı
  JSON.stringify({ tur: 'inceleme', adim: 1, inceleme: 'uyumlu', not: 'iyi', ts: 1 }),
  JSON.stringify({ tur: 'inceleme', adim: 1, inceleme: 'kismen', not: 'son söz', ts: 2 }),
  JSON.stringify({ tur: 'inceleme', adim: 2, inceleme: 'uyumlu', ts: 3 }),
  satir({ yurutucu: 'kodcu', model: 'sonnet', adim: 2, sure_sn: 50, token: 0 }),
].join('\n') + '\n');

s = snapshot(d);
assert.equal(s.simdi.durum, 'calisiyor');
// yürütücü sonra model sırasıyla; inceleme satırları deneme sayılmaz
assert.deepEqual(s.modeller, [
  { yurutucu: 'kodcu', model: 'sonnet', deneme: 1, gecen: 1, ilkDenemeOrani: 1, token: 0, maliyet: 0, ortSure: 50, uyum: 1, sessiz: 0, etiket: 'olculdu' },
  { yurutucu: 'opencode', model: 'a/x', deneme: 3, gecen: 2, ilkDenemeOrani: 0.5, token: 600, maliyet: 0, ortSure: 20, uyum: 0.5, sessiz: 0, etiket: 'olculdu' },
  { yurutucu: 'opencode', model: 'b/y', deneme: 1, gecen: 0, ilkDenemeOrani: 0, token: 100, maliyet: 0, ortSure: 10, uyum: null, sessiz: 0, etiket: 'olculdu' },
]);
assert.equal(s.incelemeler[1].inceleme, 'kismen'); // son inceleme geçerli
assert.equal(s.incelemeler[1].not, 'son söz');
assert.equal(s.incelemeler[2].inceleme, 'uyumlu');

// eski satırlar (yurutucu / tur alanı yok) opencode sayılır
writeFileSync(join(d, 'metrikler.jsonl'), JSON.stringify({ ts: 1, adim: 1, model: 'a/x', deneme: 1, gecti: true, sure_sn: 5, token: 10, maliyet: 0 }) + '\n');
assert.equal(snapshot(d).modeller[0].yurutucu, 'opencode');
console.log('durum.test ok');
