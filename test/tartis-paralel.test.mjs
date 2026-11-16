import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT = resolve('epic-tartis.mjs');
const PERSONALAR = [
  { ad: 'Ürün Sahibi', optimize: 'değer', korluk: 'kör1', soru: 'soru1' },
  { ad: 'Mühendis', optimize: 'teknik', korluk: 'kör2', soru: 'soru2' },
  { ad: 'Eleştirmen', optimize: 'risk', korluk: 'kör3', soru: 'soru3' },
];

function fakeYaz(dir) {
  const p = join(dir, 'fake-opencode.mjs');
  writeFileSync(
    p,
    `#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.env.STUB_DIR;
const args = process.argv.slice(2);
let model = '';
for (let i = 0; i < args.length; i++) if (args[i] === '-m') model = args[i + 1];
const istem = args.length ? args[args.length - 1] : '';
const cfile = join(dir, 'counter');
let n = 0;
try { n = parseInt(readFileSync(cfile, 'utf8'), 10) || 0; } catch {}
n += 1;
writeFileSync(cfile, String(n));
appendFileSync(join(dir, 'calls.log'), JSON.stringify({ model: model, istem: istem, sira: n, ts: Date.now() }) + '\\n');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
console.log(JSON.stringify({ type: 'text', part: { text: 'YANIT ' + n } }));
`
  );
  chmodSync(p, 0o755);
}

function hazirla(dir, isIcerik) {
  mkdirSync(join(dir, 'persona'), { recursive: true });
  mkdirSync(join(dir, 'epic', '7'), { recursive: true });
  writeFileSync(join(dir, 'PLAN.md'), 'Görev persona: m/bir, m/iki\n\n- [ ] 1. İş\n');
  writeFileSync(join(dir, 'persona', 'takim.json'), JSON.stringify({ personalar: PERSONALAR }, null, 2));
  if (isIcerik !== null) writeFileSync(join(dir, 'epic', '7', 'is.md'), isIcerik);
  fakeYaz(dir);
}

function kos(dir, args, extra) {
  const env = { ...process.env, MDK_OPENCODE: join(dir, 'fake-opencode.mjs'), STUB_DIR: dir, EPIC_SURE: '20' };
  delete env.EPIC_BOS_MODEL;
  delete env.EPIC_BOS_METIN;
  delete env.EPIC_BOS_SIRA;
  if (extra) Object.assign(env, extra);
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, env: env, encoding: 'utf8', timeout: 60000 });
}

function cagrilari(dir) {
  const p = join(dir, 'calls.log');
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(function (l) { return JSON.parse(l); });
}

{
  const d = mkdtempSync(join(tmpdir(), 'tartis-paralel-'));
  hazirla(d, 'is icerigi 7');
  const r = kos(d, ['7']);
  assert.equal(r.status, 0, r.stderr + '\n' + r.stdout);

  const calls = cagrilari(d);
  const tur1Calls = calls.filter((c) => !c.istem.includes('katıldığın') && !c.istem.includes('Tarafsız moderatör'));
  assert.equal(tur1Calls.length, 3, 'Tur 1 için 3 çağrı olmalı');

  const ts1 = tur1Calls.map((c) => c.ts);
  const fark1 = Math.max(...ts1) - Math.min(...ts1);
  assert.ok(fark1 < 1000, `Tur 1 ts farkı < 1000 ms olmalı, fark=${fark1}`);

  const tur2Calls = calls.filter((c) => c.istem.includes('katıldığın'));
  assert.equal(tur2Calls.length, 3, 'Tur 2 için 3 çağrı olmalı');
  assert.ok(tur2Calls[1].ts - tur2Calls[0].ts >= 1400, 'Tur 2 1->2 ts farkı >= 1400 ms olmalı');
  assert.ok(tur2Calls[2].ts - tur2Calls[1].ts >= 1400, 'Tur 2 2->3 ts farkı >= 1400 ms olmalı');

  const tj = JSON.parse(readFileSync(join(d, 'epic', '7', 'tartisma.json'), 'utf8'));
  assert.deepEqual(
    tj.turlar[0].mesajlar.map((m) => m.persona),
    ['Ürün Sahibi', 'Mühendis', 'Eleştirmen'],
    'Tur 1 mesajları persona sırasıyla yazılmalı'
  );
}

console.log('tartis-paralel.test ok');
