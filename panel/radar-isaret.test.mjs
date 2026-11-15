// Kapı (adım 167): POST /api/radar-isaret + GET /api/radar süzme + radarHtml eylem/rozet.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';
import { radarHtml } from './ciz.mjs';

const simdiMs = 1_700_000_000_000;
const T1 = 1_700_000_000;
const T2 = 1_700_000_001;

const adaylar = [
  { repo: 'a/one', grup: 'g1', yildiz: 10, lisans: 'MIT', son: '2026-01-01', aciklama: 'desc1' },
  { repo: 'b/two', grup: 'g2', yildiz: 20, lisans: 'Apache-2.0', son: '2026-02-02', aciklama: 'desc2' },
];
const degisenler = [
  { repo: 'a/one', tur: 'yeni', not: 'Cümle bir' },
  { repo: 'b/two', tur: 'sicradi', fark: '+5 yıldız (%50)', not: 'Cümle iki' },
];

const d = mkdtempSync(join(tmpdir(), 'radar-isaret-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
mkdirSync(join(d, 'strateji'), { recursive: true });
const sonucPath = join(d, 'strateji', 'radar-sonuc.json');
const isaretPath = join(d, 'strateji', 'radar-isaret.json');
const sonuc = { ts: T1, ilk: false, adaylar, degisenler, sonHata: null };
writeFileSync(sonucPath, JSON.stringify(sonuc));

const s = await baslat(d, 0);
const kok = `http://127.0.0.1:${s.port}`;

async function post(govde) {
  const r = await fetch(`${kok}/api/radar-isaret`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof govde === 'string' ? govde : JSON.stringify(govde),
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
}

// 1) geçerli POST
{
  const r = await post({ repo: 'a/one', isaret: 'izle' });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(r.json, { tamam: true }, r.text);
  const dosya = JSON.parse(readFileSync(isaretPath, 'utf8'));
  assert.equal(dosya['a/one'].isaret, 'izle');
  assert.equal(dosya['a/one'].tarama, T1);
  const gr = await fetch(`${kok}/api/radar`);
  assert.equal(gr.status, 200);
  const v = await gr.json();
  assert.ok(v.isaretler['a/one'], 'GET isaretlerde depo yok');
  assert.equal(v.isaretler['a/one'].isaret, 'izle');
}

// 2) isaret:'sil' → 400, dosya değişmez
{
  const once = readFileSync(isaretPath, 'utf8');
  const r = await post({ repo: 'a/one', isaret: 'sil' });
  assert.equal(r.status, 400, r.text);
  assert.equal(readFileSync(isaretPath, 'utf8'), once, 'dosya değişmemeli');
}

// 3) listede olmayan repo → 400
{
  const once = readFileSync(isaretPath, 'utf8');
  const r = await post({ repo: 'z/yok', isaret: 'izle' });
  assert.equal(r.status, 400, r.text);
  assert.equal(readFileSync(isaretPath, 'utf8'), once, 'dosya değişmemeli');
}

// 4) 3 KB gövde → 413
{
  const once = readFileSync(isaretPath, 'utf8');
  const buyuk = JSON.stringify({ repo: 'a/one', isaret: 'izle', pad: 'x'.repeat(3000) });
  const r = await post(buyuk);
  assert.equal(r.status, 413, r.text);
  assert.equal(readFileSync(isaretPath, 'utf8'), once, 'dosya değişmemeli');
}

// 5) sonuc.ts T2 → GET isaretler boş; dosyadaki kayıt durur
{
  const guncel = { ...sonuc, ts: T2 };
  writeFileSync(sonucPath, JSON.stringify(guncel));
  const gr = await fetch(`${kok}/api/radar`);
  assert.equal(gr.status, 200);
  const v = await gr.json();
  assert.deepEqual(v.isaretler, {}, 'eski işaret bu haftaya sayılmamalı');
  const dosya = JSON.parse(readFileSync(isaretPath, 'utf8'));
  assert.ok(dosya['a/one'], 'dosyadaki kayıt durmalı');
}

// 6) radarHtml: işaretsiz satırda 3 düğme; işaretli şeritte yok, İzlenenler'de rozet
{
  const veri = { sonuc, isaretler: { 'b/two': { isaret: 'izle', ts: simdiMs, tarama: sonuc.ts } } };
  const h = radarHtml(veri, simdiMs);
  assert.equal((h.match(/class="radar-satir"/g) || []).length, 1, 'şerit sayısı yanlış');
  assert.ok(!h.includes('<details class="radar-satir" data-repo="b/two">'), 'işaretli şeritte olmamalı');
  assert.ok(h.includes('<div class="radar-eylem">'), 'radar-eylem yok');
  assert.equal((h.match(/data-isaret=/g) || []).length, 3, '3 data-isaret olmalı');
  assert.ok(h.includes('data-isaret="izle"'));
  assert.ok(h.includes('data-isaret="incele"'));
  assert.ok(h.includes('data-isaret="gec"'));
  assert.ok(h.includes('İzle') && h.includes('İncele') && h.includes('Geç'));
  const izl = h.slice(h.indexOf('radar-izlenen'));
  assert.ok(izl.includes('b/two'), 'işaretli İzlenenlerde olmalı');
  assert.ok(izl.includes('rozet'), 'işaret rozeti yok');
}

await s.kapat();
console.log('radar-isaret.test ok');
