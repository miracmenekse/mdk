import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KAYIT = fileURLToPath(new URL('../op-kayit.mjs', import.meta.url));
const kos = (args, cwd) => spawnSync(process.execPath, [KAYIT, ...args], { cwd, encoding: 'utf8' });
const satirlar = (d) => readFileSync(join(d, 'metrikler.jsonl'), 'utf8').trim().split('\n').map((s) => JSON.parse(s));

const d = mkdtempSync(join(tmpdir(), 'kayit-'));

let r = kos(['3', '--yurutucu', 'kodcu', '--model', 'sonnet', '--gecti', 'true', '--sure', '42', '--token', '1234', '--dizin', d]);
assert.equal(r.status, 0, r.stderr);
let [k] = satirlar(d);
assert.equal(k.adim, 3);
assert.equal(k.yurutucu, 'kodcu');
assert.equal(k.model, 'sonnet');
assert.equal(k.deneme, 1);
assert.equal(k.gecti, true);
assert.equal(k.sure_sn, 42);
assert.equal(k.token, 1234);
assert.equal(k.maliyet, 0);
assert.equal(k.neden ?? null, null);
assert.equal(typeof k.ts, 'number');

r = kos(['3', '--yurutucu', 'opencode', '--model', 'm/a', '--gecti', 'false', '--deneme', '2', '--neden', 'kapi', '--dizin', d]);
assert.equal(r.status, 0, r.stderr);
assert.deepEqual([satirlar(d)[1].deneme, satirlar(d)[1].gecti, satirlar(d)[1].neden], [2, false, 'kapi']);

r = kos(['3', '--inceleme', 'kismen', '--not', 'dar kapı', '--dizin', d]);
assert.equal(r.status, 0, r.stderr);
const i = satirlar(d)[2];
assert.equal(i.tur, 'inceleme');
assert.equal(i.adim, 3);
assert.equal(i.inceleme, 'kismen');
assert.equal(i.not, 'dar kapı');
assert.equal(typeof i.ts, 'number');
assert.equal(satirlar(d).length, 3); // eklenir, üzerine yazmaz

// hatalı kullanım: stderr'e yazar, çıkış 2, dosyaya yazmaz
for (const args of [
  ['3', '--inceleme', 'harika', '--dizin', d],
  ['3', '--dizin', d],
  ['x', '--inceleme', 'uyumlu', '--dizin', d],
  ['3', '--yurutucu', 'kodcu', '--model', 'sonnet', '--gecti', 'belki', '--dizin', d],
  ['3', '--yurutucu', 'bilinmeyen', '--model', 'sonnet', '--gecti', 'true', '--dizin', d],
  ['3', '--yurutucu', 'kodcu', '--gecti', 'true', '--dizin', d],
]) {
  r = kos(args);
  assert.equal(r.status, 2, `çıkış 2 beklenirdi: ${args.join(' ')}`);
  assert.ok(r.stderr.length > 0, 'kullanım stderr\'e yazılmalı');
}
assert.equal(satirlar(d).length, 3);

// varsayılan dizin: çalışma dizini
const d2 = mkdtempSync(join(tmpdir(), 'kayit2-'));
r = kos(['4', '--inceleme', 'uyumlu'], d2);
assert.equal(r.status, 0, r.stderr);
assert.ok(existsSync(join(d2, 'metrikler.jsonl')));
assert.equal(satirlar(d2)[0].inceleme, 'uyumlu');
console.log('kayit.test ok');
