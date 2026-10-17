import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tablo } from '../karsilastir.mjs';

assert.equal(tablo([]), 'metrik yok');

const modeller = [
  { yurutucu: 'opencode', model: 'a/x', deneme: 3, gecen: 2, ilkDenemeOrani: 0.5, token: 600, maliyet: 0, ortSure: 20, uyum: 0.5 },
  { yurutucu: 'kodcu', model: 'sonnet', deneme: 1, gecen: 1, ilkDenemeOrani: 1, token: 0, maliyet: 0, ortSure: 50, uyum: null },
];
const satirlar = tablo(modeller).split('\n').filter(Boolean);
for (const sutun of ['yürütücü', 'model', 'deneme', 'ilk%', 'ort.sn', 'token', 'uyum%']) assert.ok(satirlar[0].includes(sutun), `başlıkta ${sutun} yok`);
const ax = satirlar.find((s) => s.includes('a/x'));
assert.ok(ax.includes('opencode') && ax.includes('50') && ax.includes('600') && ax.includes('20'));
const sn = satirlar.find((s) => s.includes('sonnet'));
assert.ok(sn.includes('kodcu') && sn.includes('100') && sn.trimEnd().endsWith('-'), 'uyum null ise son sütun "-" olmalı');

// komut satırı
const KOMUT = fileURLToPath(new URL('../karsilastir.mjs', import.meta.url));
const bos = mkdtempSync(join(tmpdir(), 'kars-'));
let r = spawnSync(process.execPath, [KOMUT, bos], { encoding: 'utf8' });
assert.equal(r.status, 0, r.stderr);
assert.match(r.stdout, /metrik yok/);
writeFileSync(join(bos, 'metrikler.jsonl'), JSON.stringify({ ts: 1, adim: 1, yurutucu: 'kodcu', model: 'sonnet', deneme: 1, gecti: true, sure_sn: 5, token: 7, maliyet: 0 }) + '\n');
r = spawnSync(process.execPath, [KOMUT, bos], { encoding: 'utf8' });
assert.equal(r.status, 0, r.stderr);
assert.match(r.stdout, /sonnet/);
console.log('karsilastir.test ok');
