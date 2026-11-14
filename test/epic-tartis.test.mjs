import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
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
  writeFileSync(p, `#!/usr/bin/env node
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
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
appendFileSync(join(dir, 'calls.log'), JSON.stringify({ model: model, istem: istem, argv: args }) + '\\n');
const bosModeller = (process.env.EPIC_BOS_MODEL || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
const bosMetinler = (process.env.EPIC_BOS_METIN || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
const bos = bosModeller.indexOf(model) >= 0 || bosMetinler.some(function (m) { return istem.indexOf(m) >= 0; });
if (!bos) console.log(JSON.stringify({ type: 'text', part: { text: 'YANIT ' + n } }));
`);
  chmodSync(p, 0o755);
}

function hazirla(dir, isIcerik) {
  mkdirSync(join(dir, 'persona'), { recursive: true });
  mkdirSync(join(dir, 'epic', '7'), { recursive: true });
  writeFileSync(join(dir, 'PLAN.md'), 'Görev persona: m/bir, m/iki\n');
  writeFileSync(join(dir, 'persona', 'takim.json'), JSON.stringify({ personalar: PERSONALAR }, null, 2));
  if (isIcerik !== null) writeFileSync(join(dir, 'epic', '7', 'is.md'), isIcerik);
  fakeYaz(dir);
}

function kos(dir, args, extra) {
  const env = { ...process.env, MDK_OPENCODE: join(dir, 'fake-opencode.mjs'), STUB_DIR: dir, EPIC_SURE: '10' };
  delete env.EPIC_BOS_MODEL;
  delete env.EPIC_BOS_METIN;
  if (extra) Object.assign(env, extra);
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, env: env, encoding: 'utf8', timeout: 30000 });
}

function cagrilari(dir) {
  const p = join(dir, 'calls.log');
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map(function (l) { return JSON.parse(l); });
}

// olağan koşu
{
  const d = mkdtempSync(join(tmpdir(), 'epic-tartis-'));
  hazirla(d, 'is icerigi 7');
  const r = kos(d, ['7']);
  assert.equal(r.status, 0, r.stderr + '\n' + r.stdout);
  const tj = JSON.parse(readFileSync(join(d, 'epic', '7', 'tartisma.json'), 'utf8'));
  assert.equal(tj.durum, 'bitti');
  assert.equal(tj.turlar.length, 2);
  assert.equal(tj.turlar[0].mesajlar.length, 3);
  assert.equal(tj.turlar[1].mesajlar.length, 3);
  assert.ok(tj.cozum && tj.cozum.metin, 'cozum.metin dolu olmalı');
  assert.equal(tj.personalar.length, 3);
  assert.deepEqual(tj.personalar.map(function (p) { return p.ad; }), PERSONALAR.map(function (p) { return p.ad; }));
  assert.equal(tj.is.trim(), 'is icerigi 7');
  const calls = cagrilari(d);
  assert.equal(calls.length, 7, '7 çağrı olmalı');
  const tur1Metinler = tj.turlar[0].mesajlar.map(function (m) { return m.metin; });
  const tur2 = calls.filter(function (c) { return c.istem.indexOf('katıldığın') >= 0; });
  assert.equal(tur2.length, 3, 'tur 2 çağrı sayısı');
  for (const c of tur2) for (const m of tur1Metinler) assert.ok(c.istem.indexOf(m) >= 0, 'tur2 isteminde tur1 metni yok');
  const tur3 = calls.filter(function (c) { return c.istem.indexOf('## Tahmini story listesi') >= 0; });
  assert.equal(tur3.length, 1, 'tur 3 çağrı sayısı');
  const satirlar = r.stdout.trim().split('\n');
  assert.equal(satirlar[satirlar.length - 1], 'epic/7/tartisma.json');
}

// --persona filtresi
{
  const d = mkdtempSync(join(tmpdir(), 'epic-tartis-'));
  hazirla(d, 'is icerigi 7');
  const r = kos(d, ['7', '--persona', 'Ürün Sahibi,Mühendis']);
  assert.equal(r.status, 0, r.stderr + '\n' + r.stdout);
  const tj = JSON.parse(readFileSync(join(d, 'epic', '7', 'tartisma.json'), 'utf8'));
  assert.equal(tj.personalar.length, 2);
  assert.equal(tj.turlar[0].mesajlar.length, 2);
  assert.equal(tj.turlar[1].mesajlar.length, 2);
  assert.equal(cagrilari(d).length, 5);
}

// --neden
{
  const d = mkdtempSync(join(tmpdir(), 'epic-tartis-'));
  hazirla(d, 'is icerigi 7');
  const r = kos(d, ['7', '--neden', 'x']);
  assert.equal(r.status, 0, r.stderr + '\n' + r.stdout);
  const tj = JSON.parse(readFileSync(join(d, 'epic', '7', 'tartisma.json'), 'utf8'));
  assert.equal(tj.neden, 'x');
}

// m/bir boş dönerken yeniden deneme
{
  const d = mkdtempSync(join(tmpdir(), 'epic-tartis-'));
  hazirla(d, 'is icerigi 7');
  const r = kos(d, ['7'], { EPIC_BOS_MODEL: 'm/bir' });
  assert.equal(r.status, 0, r.stderr + '\n' + r.stdout);
  const tj = JSON.parse(readFileSync(join(d, 'epic', '7', 'tartisma.json'), 'utf8'));
  assert.equal(tj.durum, 'bitti');
}

// iki personanın tur-1 yanıtı her modelde boş
{
  const d = mkdtempSync(join(tmpdir(), 'epic-tartis-'));
  hazirla(d, 'is icerigi 7');
  const r = kos(d, ['7'], { EPIC_BOS_METIN: 'Ürün Sahibi,Mühendis' });
  assert.equal(r.status, 1, r.stderr + '\n' + r.stdout);
  const tj = JSON.parse(readFileSync(join(d, 'epic', '7', 'tartisma.json'), 'utf8'));
  assert.equal(tj.durum, 'yetersiz');
  assert.ok(!cagrilari(d).some(function (c) { return c.istem.indexOf('katıldığın') >= 0; }), 'tur 2 çağrısı olmamalı');
}

// is.md yok
{
  const d = mkdtempSync(join(tmpdir(), 'epic-tartis-'));
  hazirla(d, null);
  const r = kos(d, ['7']);
  assert.equal(r.status, 2, r.stderr + '\n' + r.stdout);
}

// --persona Yok
{
  const d = mkdtempSync(join(tmpdir(), 'epic-tartis-'));
  hazirla(d, 'is icerigi 7');
  const r = kos(d, ['7', '--persona', 'Yok']);
  assert.equal(r.status, 2, r.stderr + '\n' + r.stdout);
}

console.log('epic-tartis.test ok');
