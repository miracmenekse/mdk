// Kapı (adım 89): model tablosu `kota` satırlarını deneme saymaz, sessiz sayar. Kullanım: node panel/kota-model.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshot } from './durum.mjs';

const d = mkdtempSync(join(tmpdir(), 'kota-model-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const satir = (o) => JSON.stringify({ ts: 1, adim: 1, yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, sure_sn: 10, token: 100, maliyet: 0, ...o });
writeFileSync(join(d, 'metrikler.jsonl'), [
  satir({ model: 'kot', gecti: false, sure_sn: 7, token: 0, neden: 'kota' }),
  satir({ model: 'kot', deneme: 2, sure_sn: 31, token: 3100 }),
  satir({ model: 'kot', adim: 2, gecti: false, sure_sn: 9, token: 0, neden: 'kota' }),
  satir({ model: 'ses', gecti: false, sure_sn: 900, token: 0, neden: 'yanit_yok' }),
  satir({ model: 'gen', gecti: false, sure_sn: 44, token: 440, neden: 'kapi' }),
].join('\n') + '\n');

const s = snapshot(d);
const bul = (m) => s.modeller.find((x) => x.model === m);
const kot = bul('kot');
assert.equal(kot.deneme, 1, 'kota satırı deneme sayılmamalı');
assert.equal(kot.gecen, 1);
assert.equal(kot.sessiz, 2, 'kota satırları sessiz sayılmalı');
assert.equal(kot.token, 3100, 'kota satırı token toplamına girmemeli');
assert.equal(kot.ortSure, 31, 'kota satırı süre ortalamasına girmemeli');
assert.equal(bul('ses').sessiz, 1, 'yanit_yok yine sessiz');
assert.equal(bul('ses').deneme, 0);
assert.equal(bul('gen').deneme, 1, 'kapi gerçek deneme');
assert.equal(bul('gen').sessiz, 0);
console.log('kota-model ok');
