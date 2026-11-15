import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const kok = mkdtempSync(join(tmpdir(), 'radar-betik-'));
const fakeGh = join(tmpdir(), `radar-betik-gh-${process.pid}.mjs`);
const sonucJson = join(kok, 'strateji', 'radar-sonuc.json');
let s = null;

function uyu(ms) { return new Promise((r) => setTimeout(r, ms)); }

try {
  mkdirSync(join(kok, 'strateji'), { recursive: true });
  writeFileSync(join(kok, 'strateji', 'radar.json'), JSON.stringify({ izle: [{ repo: 'a/b' }], esik: {} }) + '\n');
  writeFileSync(fakeGh, 'process.stdout.write(\'{"stargazers_count":5,"license":{"spdx_id":"MIT"},"pushed_at":"2026-11-01T00:00:00Z","description":"x"}\\n\');\nprocess.exit(0);\n');

  delete process.env.MDK_RADAR_BETIK;
  process.env.MDK_GH = fakeGh;

  s = await baslat(kok, 0);
  const base = `http://127.0.0.1:${s.port}`;

  const r1 = await fetch(`${base}/api/radar-tara`, { method: 'POST' });
  assert.equal(r1.status, 200);
  assert.deepEqual(await r1.json(), { basladi: true });

  let sonuc = null;
  for (let i = 0; i < 150; i++) {
    if (existsSync(sonucJson)) {
      try {
        const p = JSON.parse(readFileSync(sonucJson, 'utf8'));
        if (Array.isArray(p?.adaylar) && p.adaylar.length > 0) { sonuc = p; break; }
      } catch {}
    }
    await uyu(100);
  }
  assert.ok(sonuc, 'radar-sonuc.json 15 sn içinde oluşmalı');
  assert.equal(sonuc.adaylar[0].repo, 'a/b');
  assert.equal(sonuc.adaylar[0].yildiz, 5);

  let v = null;
  for (let i = 0; i < 50; i++) {
    const rr = await fetch(`${base}/api/radar`);
    const vv = await rr.json();
    v = vv;
    if (vv.taraniyor === false && vv.sonuc?.adaylar?.length === 1) break;
    await uyu(100);
  }
  assert.equal(v.taraniyor, false);
  assert.equal(v.sonuc.adaylar.length, 1);
} finally {
  try { if (s) await s.kapat(); } catch {}
  rmSync(kok, { recursive: true, force: true });
  rmSync(fakeGh, { force: true });
  delete process.env.MDK_GH;
  delete process.env.MDK_RADAR_BETIK;
}

console.log('radar-betik.test ok');
