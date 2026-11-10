// Kapı üretim satırları (tur=kapi) ayrı özetlenir; model tablosuna, geçmişe ve matrise karışmaz.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshot } from './durum.mjs';

const d = mkdtempSync(join(tmpdir(), 'kapi-uretim-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `node x.test.mjs`\n');
assert.deepEqual(snapshot(d).kapiUretim, []);   // metrik yokken boş

const kapi = (o) => JSON.stringify({ tur: 'kapi', ts: 1, adim: 1, yurutucu: 'opencode', model: 'k/a', gorev: 'kapi', deneme: 1, gecti: false, sure_sn: 40, token: 100, neden: null, ...o });
writeFileSync(join(d, 'metrikler.jsonl'), [
  kapi({ neden: 'kapi_sozdizimi' }),
  kapi({ neden: 'kapi_yesil', sure_sn: 20 }),
  kapi({ gecti: true, sure_sn: 60 }),
  kapi({ neden: 'yanit_yok', sure_sn: 75 }),                 // sessizlik deneme sayılmaz, süreye girmez
  kapi({ model: 'k/b', gecti: true, sure_sn: 10 }),
  JSON.stringify({ ts: 2, adim: 1, yurutucu: 'opencode', model: 'a/x', gorev: 'kod', deneme: 1, gecti: true, sure_sn: 30, token: 500, neden: null }),
].join('\n') + '\n');

const s = snapshot(d);
assert.deepEqual(s.kapiUretim, [
  { model: 'k/a', deneme: 3, kabul: 1, sessiz: 1, nedenler: { kapi_sozdizimi: 1, kapi_yesil: 1 }, ortSure: 40 },
  { model: 'k/b', deneme: 1, kabul: 1, sessiz: 0, nedenler: {}, ortSure: 10 },
]);
// kapı satırları kod istatistiğini kirletmez
assert.deepEqual(s.modeller.map((m) => `${m.model}:${m.deneme}:${m.gecen}`), ['a/x:1:1']);
assert.deepEqual(s.matris.modeller.map((m) => m.model), ['a/x']);
assert.equal(s.gecmis.find((g) => g.no === 1).denemeler.length, 1);
console.log('kapi-uretim.test ok');
