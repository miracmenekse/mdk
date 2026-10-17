import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshot } from './durum.mjs';

const d = mkdtempSync(join(tmpdir(), 'durum-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');

let s = snapshot(d); // metrik ve durum dosyası yokken de çalışmalı
assert.equal(s.simdi, null);
assert.deepEqual(s.modeller, []);
assert.equal(s.plan.kategoriler[0].adimlar.length, 1);

writeFileSync(join(d, 'durum.json'), JSON.stringify({ adim: 1, baslik: 'İş', model: 'a/x', deneme: 1, durum: 'calisiyor', ts: 1 }));
const satir = (o) => JSON.stringify({ ts: 1, adim: 1, yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, sure_sn: 10, token: 100, maliyet: 0, eklenen: 1, silinen: 0, dosya: 1, ...o });
writeFileSync(join(d, 'metrikler.jsonl'), [
  satir({}),
  satir({ gecti: false, sure_sn: 20, token: 300 }),
  'bozuk satır, atlanmalı',
  satir({ deneme: 2, sure_sn: 30, token: 200 }),
  satir({ model: 'b/y', gecti: false }),
].join('\n') + '\n');

s = snapshot(d);
assert.equal(s.simdi.durum, 'calisiyor');
assert.deepEqual(s.modeller.find((m) => m.model === 'a/x'),
  { model: 'a/x', deneme: 3, gecen: 2, ilkDenemeOrani: 0.5, token: 600, maliyet: 0, ortSure: 20 });
assert.equal(s.modeller.find((m) => m.model === 'b/y').ilkDenemeOrani, 0);
console.log('durum.test ok');
