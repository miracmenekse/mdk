import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';
import { radarHtml } from './ciz.mjs';

const kok = mkdtempSync(join(tmpdir(), 'radar-tara-'));
writeFileSync(join(kok, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
mkdirSync(join(kok, 'strateji'), { recursive: true });

const fakeBetik = join(kok, 'fake-radar.mjs');
const sayacDosyasi = join(kok, 'sayac.txt');
writeFileSync(fakeBetik, `import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const kok = process.argv[2] || process.cwd();
const strateji = join(kok, 'strateji');
mkdirSync(strateji, { recursive: true });
const sayac = process.env.MDK_RADAR_COUNTER;
function arttir() {
  let n = 0;
  try { n = Number(readFileSync(sayac, 'utf8')) || 0; } catch {}
  writeFileSync(sayac, String(n + 1));
}
await new Promise((r) => setTimeout(r, 300));
if (process.env.MDK_RADAR_FAIL === '1') {
  arttir();
  process.exit(1);
}
arttir();
writeFileSync(join(strateji, 'radar-sonuc.json'), JSON.stringify({
  ts: new Date().toISOString(),
  ilk: false,
  adaylar: [],
  degisenler: [],
  sonHata: null
}) + '\\n');
process.exit(0);
`);

process.env.MDK_RADAR_BETIK = fakeBetik;
process.env.MDK_RADAR_COUNTER = sayacDosyasi;

const radarJson = join(kok, 'strateji', 'radar.json');
const sonucJson = join(kok, 'strateji', 'radar-sonuc.json');

function uyu(ms) { return new Promise((r) => setTimeout(r, ms)); }
function sayac() { try { return Number(readFileSync(sayacDosyasi, 'utf8')) || 0; } catch { return 0; } }
function temizleSonuc() { rmSync(sonucJson, { force: true }); }
function eskiSonuc(gun) { writeFileSync(sonucJson, JSON.stringify({ ts: new Date(Date.now() - gun * 86400000).toISOString(), ilk: false, adaylar: [], degisenler: [], sonHata: null })); }

// 1) radar.json var, sonuc yok -> kendiliğinden tarama başlar
{
  writeFileSync(radarJson, JSON.stringify({ izle: [], esik: {} }));
  temizleSonuc();
  const once = sayac();
  const s = await baslat(kok, 0);
  const base = `http://127.0.0.1:${s.port}`;
  const r = await fetch(`${base}/api/radar`);
  assert.equal(r.status, 200);
  const v = await r.json();
  assert.equal(v.taraniyor, true, 'taraniyor true olmalı');
  await uyu(700);
  let son = null;
  for (let i = 0; i < 30; i++) {
    const rr = await fetch(`${base}/api/radar`);
    const vv = await rr.json();
    son = vv;
    if (vv.taraniyor === false) break;
    await uyu(100);
  }
  assert.equal(son.taraniyor, false, 'tarama bitince false olmalı');
  assert.equal(sayac(), once + 1, 'sayaç bir artmalı');
  assert.ok(son.sonuc && son.sonuc.ts, 'sonuc.ts olmalı');
  assert.ok(Date.now() - Date.parse(son.sonuc.ts) < 10000, 'ts taze olmalı');
  await s.kapat();
}

// 2a) 8 gün eski sonuc -> kendiliğinden başlar
{
  writeFileSync(radarJson, JSON.stringify({ izle: [], esik: {} }));
  temizleSonuc();
  eskiSonuc(8);
  const once = sayac();
  const s = await baslat(kok, 0);
  const base = `http://127.0.0.1:${s.port}`;
  const r = await fetch(`${base}/api/radar`);
  const v = await r.json();
  assert.equal(v.taraniyor, true, '8 gün eski -> taraniyor true');
  await uyu(700);
  let son = null;
  for (let i = 0; i < 30; i++) {
    const rr = await fetch(`${base}/api/radar`);
    const vv = await rr.json();
    son = vv;
    if (vv.taraniyor === false) break;
    await uyu(100);
  }
  assert.equal(sayac(), once + 1, 'sayaç bir artmalı');
  await s.kapat();
}

// 2b) 2 gün eski sonuc -> başlamaz
{
  writeFileSync(radarJson, JSON.stringify({ izle: [], esik: {} }));
  temizleSonuc();
  eskiSonuc(2);
  const once = sayac();
  const s = await baslat(kok, 0);
  const base = `http://127.0.0.1:${s.port}`;
  const r = await fetch(`${base}/api/radar`);
  const v = await r.json();
  assert.equal(v.taraniyor, false, '2 gün eski -> taraniyor false');
  await uyu(500);
  assert.equal(sayac(), once, 'sayaç artmamalı');
  await s.kapat();
}

// 3) POST /api/radar-tara -> basladi:true; bitmeden ikinci POST -> suruyor:true
{
  writeFileSync(radarJson, JSON.stringify({ izle: [], esik: {} }));
  temizleSonuc();
  const once = sayac();
  const s = await baslat(kok, 0);
  const base = `http://127.0.0.1:${s.port}`;
  const r1 = await fetch(`${base}/api/radar-tara`, { method: 'POST' });
  assert.equal(r1.status, 200);
  assert.deepEqual(await r1.json(), { basladi: true });
  const r2 = await fetch(`${base}/api/radar-tara`, { method: 'POST' });
  assert.equal(r2.status, 200);
  assert.deepEqual(await r2.json(), { basladi: false, suruyor: true });
  await uyu(700);
  assert.equal(sayac(), once + 1, 'sayaç yalnız bir artmalı');
  await s.kapat();
}

// 4) radar.json yokken GET kendiliğinden başlatmaz
{
  rmSync(radarJson, { force: true });
  temizleSonuc();
  const once = sayac();
  const s = await baslat(kok, 0);
  const base = `http://127.0.0.1:${s.port}`;
  const r = await fetch(`${base}/api/radar`);
  const v = await r.json();
  assert.equal(typeof v.taraniyor, 'boolean');
  assert.equal(v.taraniyor, false);
  await uyu(500);
  assert.equal(sayac(), once, 'sayaç artmamalı');
  await s.kapat();
  writeFileSync(radarJson, JSON.stringify({ izle: [], esik: {} }));
}

// 5) sahte betik hata verip sonuc yazmazsa ardışık iki GET'te sayaç yalnız 1 artar
{
  process.env.MDK_RADAR_FAIL = '1';
  writeFileSync(radarJson, JSON.stringify({ izle: [], esik: {} }));
  temizleSonuc();
  const once = sayac();
  const s = await baslat(kok, 0);
  const base = `http://127.0.0.1:${s.port}`;
  const r1 = await fetch(`${base}/api/radar`);
  const v1 = await r1.json();
  assert.equal(v1.taraniyor, true);
  await uyu(700);
  let son = null;
  for (let i = 0; i < 30; i++) {
    const rr = await fetch(`${base}/api/radar`);
    const vv = await rr.json();
    son = vv;
    if (vv.taraniyor === false) break;
    await uyu(100);
  }
  assert.equal(son.taraniyor, false, 'hata sonrası false olmalı');
  assert.equal(sayac(), once + 1, 'ilk tarama sayacı artmalı');
  const once2 = sayac();
  const r2 = await fetch(`${base}/api/radar`);
  const v2 = await r2.json();
  assert.equal(v2.taraniyor, false, 'soğuma süresinde taraniyor false');
  await uyu(500);
  assert.equal(sayac(), once2, 'ikinci GET tarama başlatmamalı');
  await s.kapat();
  delete process.env.MDK_RADAR_FAIL;
}

// 6) radarHtml düğme
{
  const h1 = radarHtml({ sonuc: null, isaretler: {}, taraniyor: false });
  assert.ok(h1.includes('<button type="button" id="radar-tara">Şimdi tara</button>'), 'Şimdi tara düğmesi yok');
  const h2 = radarHtml({ sonuc: null, isaretler: {}, taraniyor: true });
  assert.ok(h2.includes('id="radar-tara"'), 'düğme yok');
  assert.ok(h2.includes('disabled'), 'disabled yok');
  assert.ok(h2.includes('Taranıyor'), 'Taranıyor yok');
}

console.log('radar-tara.test ok');
