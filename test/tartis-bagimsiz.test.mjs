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
appendFileSync(join(dir, 'calls.log'), JSON.stringify({ model: model, istem: istem, sira: n, ts: Date.now() }) + '\\n');
const bosModeller = (process.env.EPIC_BOS_MODEL || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
const bosMetinler = (process.env.EPIC_BOS_METIN || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
const bosSiralar = (process.env.EPIC_BOS_SIRA || '').split(',').map(function (s) { return parseInt(s.trim(), 10); }).filter(function (x) { return !isNaN(x); });
const bos = bosModeller.indexOf(model) >= 0 ||
  bosMetinler.some(function (m) { return istem.indexOf(m) >= 0; }) ||
  bosSiralar.indexOf(n) >= 0;
if (!bos) console.log(JSON.stringify({ type: 'text', part: { text: 'YANIT ' + n } }));
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
  const env = { ...process.env, MDK_OPENCODE: join(dir, 'fake-opencode.mjs'), STUB_DIR: dir, EPIC_SURE: '10' };
  delete env.EPIC_BOS_MODEL;
  delete env.EPIC_BOS_METIN;
  delete env.EPIC_BOS_SIRA;
  if (extra) Object.assign(env, extra);
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, env: env, encoding: 'utf8', timeout: 30000 });
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

// Vaka (1), (2), (4): Olağan akış
{
  const d = mkdtempSync(join(tmpdir(), 'tartis-bagimsiz-'));
  hazirla(d, 'is icerigi 7');
  const r = kos(d, ['7']);
  assert.equal(r.status, 0, r.stderr + '\n' + r.stdout);

  const calls = cagrilari(d);
  assert.ok(calls.length >= 7, 'en az 7 çağrı yapılmalı');

  // (1) Tur 1 bağımsızlığı: ilk 3 çağrının her birinde istem yalnız o personanın kendi adını içerir,
  // diğer iki personanın adını ve YANIT metinlerini İÇERMEZ ve 'Bağımsız ilk görüş' ibaresini içerir
  const adlar = ['Ürün Sahibi', 'Mühendis', 'Eleştirmen'];
  const tur1Calls = calls.slice(0, 3);
  assert.equal(tur1Calls.length, 3, 'Tur 1 için 3 çağrı olmalı');

  const bulunanPersonalar = [];
  for (let i = 0; i < 3; i++) {
    const c = tur1Calls[i];
    const eslesenAdlar = adlar.filter((ad) => c.istem.includes(ad));
    assert.equal(eslesenAdlar.length, 1, `Tur 1 çağrı ${i + 1} yalnız bir personanın adını içermeli`);
    const kendiAdi = eslesenAdlar[0];
    bulunanPersonalar.push(kendiAdi);

    const digerleri = adlar.filter((ad) => ad !== kendiAdi);
    for (const diger of digerleri) {
      assert.ok(!c.istem.includes(diger), `Tur 1 çağrı ${i + 1} (${kendiAdi}) diğer persona ${diger} adını içermemeli`);
    }
    assert.ok(!c.istem.includes('YANIT'), `Tur 1 çağrı ${i + 1} (${kendiAdi}) YANIT metinlerini içermemeli`);
    assert.ok(c.istem.includes('Bağımsız ilk görüş'), `Tur 1 çağrı ${i + 1} (${kendiAdi}) 'Bağımsız ilk görüş' ibaresini içermeli`);
  }
  assert.equal(new Set(bulunanPersonalar).size, 3, 'Tur 1 üç farklı personayı da kapsamalı');

  // (2) Tur 2 ardışıklığı: katıldığın içeren 3 çağrı (tur2Calls) sırayla yapılmıştır:
  // tur2Calls[0].istem YANIT 1, YANIT 2, YANIT 3 içerir ama YANIT 4 içermez;
  // tur2Calls[1].istem hem Tur 1 yanıtlarını hem de 1. personanın Tur 2 yanıtını (Ürün Sahibi: YANIT 4) içerir;
  // tur2Calls[2].istem hem Ürün Sahibi: YANIT 4 hem Mühendis: YANIT 5 içerir
  const tur2Calls = calls.filter((c) => c.istem.includes('katıldığın'));
  assert.equal(tur2Calls.length, 3, 'Tur 2 için 3 çağrı olmalı');

  assert.ok(tur2Calls[0].sira < tur2Calls[1].sira && tur2Calls[1].sira < tur2Calls[2].sira, 'Tur 2 çağrıları sırayla yapılmalı');
  assert.equal(tur2Calls[0].sira, 4, 'Tur 2 1. çağrı sırası 4 olmalı');
  assert.equal(tur2Calls[1].sira, 5, 'Tur 2 2. çağrı sırası 5 olmalı');
  assert.equal(tur2Calls[2].sira, 6, 'Tur 2 3. çağrı sırası 6 olmalı');

  // tur2Calls[0]: Tur 1 yanıtlarını içerir, YANIT 4 içermez
  assert.ok(tur2Calls[0].istem.includes('YANIT 1'), 'tur2Calls[0] YANIT 1 içermeli');
  assert.ok(tur2Calls[0].istem.includes('YANIT 2'), 'tur2Calls[0] YANIT 2 içermeli');
  assert.ok(tur2Calls[0].istem.includes('YANIT 3'), 'tur2Calls[0] YANIT 3 içermeli');
  assert.ok(!tur2Calls[0].istem.includes('YANIT 4'), 'tur2Calls[0] YANIT 4 içermemeli');

  // tur2Calls[1]: hem Tur 1 yanıtlarını hem Ürün Sahibi: YANIT 4 içerir, YANIT 5 içermez
  assert.ok(tur2Calls[1].istem.includes('YANIT 1'), 'tur2Calls[1] YANIT 1 içermeli');
  assert.ok(tur2Calls[1].istem.includes('YANIT 2'), 'tur2Calls[1] YANIT 2 içermeli');
  assert.ok(tur2Calls[1].istem.includes('YANIT 3'), 'tur2Calls[1] YANIT 3 içermeli');
  assert.ok(tur2Calls[1].istem.includes('Ürün Sahibi: YANIT 4'), 'tur2Calls[1] Ürün Sahibi: YANIT 4 içermeli');
  assert.ok(!tur2Calls[1].istem.includes('YANIT 5'), 'tur2Calls[1] YANIT 5 içermemeli');

  // tur2Calls[2]: hem Ürün Sahibi: YANIT 4 hem Mühendis: YANIT 5 içerir
  assert.ok(tur2Calls[2].istem.includes('Ürün Sahibi: YANIT 4'), 'tur2Calls[2] Ürün Sahibi: YANIT 4 içermeli');
  assert.ok(tur2Calls[2].istem.includes('Mühendis: YANIT 5'), 'tur2Calls[2] Mühendis: YANIT 5 içermeli');
  assert.ok(!tur2Calls[2].istem.includes('YANIT 6'), 'tur2Calls[2] YANIT 6 içermemeli');

  // (4) Tur 3 istemi (## Tahmini story listesi içeren çağrı) Görüş ayrılıklarını ve üç personanın adını
  // (Ürün Sahibi, Mühendis, Eleştirmen) içerir; tartisma.json durum === 'bitti' ve turlar.length === 2
  const tur3Calls = calls.filter((c) => c.istem.includes('## Tahmini story listesi'));
  assert.equal(tur3Calls.length, 1, 'Tur 3 için 1 çağrı olmalı');
  assert.ok(tur3Calls[0].istem.includes('Görüş ayrılıklarını'), 'Tur 3 istemi "Görüş ayrılıklarını" içermeli');
  assert.ok(tur3Calls[0].istem.includes('Ürün Sahibi, Mühendis, Eleştirmen'), 'Tur 3 istemi üç personanın adını içermeli');

  const tj = JSON.parse(readFileSync(join(d, 'epic', '7', 'tartisma.json'), 'utf8'));
  assert.equal(tj.durum, 'bitti', 'tartisma.json durum bitti olmalı');
  assert.equal(tj.turlar.length, 2, 'tartisma.json turlar.length 2 olmalı');
}

// (3) Tur 2'de 1. persona boş yanıt döndürürse (EPIC_BOS_METIN ya da çağrı no 4-5 boş),
// 2. personanın Tur 2 isteminde boş persona yer almaz, 3. personanın Tur 2 isteminde yalnız 2. personanın Tur 2 yanıtı yer alır
{
  const d = mkdtempSync(join(tmpdir(), 'tartis-bagimsiz-bos-'));
  hazirla(d, 'is icerigi 7');
  const r = kos(d, ['7'], { EPIC_BOS_SIRA: '4,5' });
  assert.equal(r.status, 0, r.stderr + '\n' + r.stdout);

  const calls = cagrilari(d);
  const tur2Calls = calls.filter((c) => c.istem.includes('katıldığın'));

  // 1. persona (Ürün Sahibi) boş döndüğü için
  // 2. persona (Mühendis) Tur 2 çağrısı:
  const p2Tur2 = tur2Calls.find((c) => c.istem.includes('Sen "Mühendis" personasısın'));
  assert.ok(p2Tur2, '2. personanın (Mühendis) Tur 2 çağrısı bulunmalı');
  // 2. personanın Tur 2 isteminde boş persona yer almaz:
  assert.ok(!p2Tur2.istem.includes('Tur 2 (Tartışma — senden önceki yanıtlar)'), '2. personanın Tur 2 isteminde Tur 2 blok olmamalı');
  assert.ok(!p2Tur2.istem.includes('Ürün Sahibi: YANIT'), '2. personanın Tur 2 isteminde Ürün Sahibi yer almamalı');

  // 3. persona (Eleştirmen) Tur 2 çağrısı:
  const p3Tur2 = tur2Calls.find((c) => c.istem.includes('Sen "Eleştirmen" personasısın'));
  assert.ok(p3Tur2, '3. personanın (Eleştirmen) Tur 2 çağrısı bulunmalı');
  // 3. personanın Tur 2 isteminde yalnız 2. personanın Tur 2 yanıtı yer alır:
  assert.ok(p3Tur2.istem.includes('Mühendis: YANIT 6'), '3. personanın Tur 2 isteminde 2. personanın (Mühendis) Tur 2 yanıtı yer almalı');
  assert.ok(!p3Tur2.istem.includes('Ürün Sahibi: YANIT'), '3. personanın Tur 2 isteminde 1. personanın yanıtı yer almamalı');

  const tj = JSON.parse(readFileSync(join(d, 'epic', '7', 'tartisma.json'), 'utf8'));
  assert.equal(tj.durum, 'bitti', 'tartisma.json durum bitti olmalı');
  assert.equal(tj.turlar[1].mesajlar.length, 2, 'Tur 2 mesajlar 2 adet olmalı');
  assert.deepEqual(tj.turlar[1].mesajlar.map((m) => m.persona), ['Mühendis', 'Eleştirmen']);
}

console.log('tartis-bagimsiz.test ok');
