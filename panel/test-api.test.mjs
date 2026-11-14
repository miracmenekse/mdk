// Adım 105 kapısı: POST /api/test → node test/hepsi.mjs koşar (yoksa bash test/hepsi.sh), { gecti, cikti } döndürür.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const kur = (icerik, ad = 'hepsi.mjs') => {
  const d = mkdtempSync(join(tmpdir(), 'test-api-'));
  writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `node -e "0"`\n');
  mkdirSync(join(d, 'test'));
  writeFileSync(join(d, 'test', ad), icerik);
  return d;
};

// geçen testler → gecti true, çıktı döner
let s = await baslat(kur('console.log("hepsi ok");\n'), 0);
let r = await fetch(`http://127.0.0.1:${s.port}/api/test`, { method: 'POST' });
assert.equal(r.status, 200);
let j = await r.json();
assert.equal(j.gecti, true, 'geçen testlerde gecti true');
assert.ok(j.cikti.includes('hepsi ok'), 'çıktı dönmeli');
await s.kapat();

// başarısız testler → gecti false, hata çıktısı döner
s = await baslat(kur('console.error("BAŞARISIZ: x"); process.exit(1);\n'), 0);
j = await (await fetch(`http://127.0.0.1:${s.port}/api/test`, { method: 'POST' })).json();
assert.equal(j.gecti, false, 'başarısızda gecti false');
assert.ok(j.cikti.includes('BAŞARISIZ'), 'hata çıktısı (stderr dahil) dönmeli');
await s.kapat();

// eski projeler: hepsi.mjs yoksa bash test/hepsi.sh (bash gerekir; Windows'ta atlanır)
if (process.platform !== 'win32') {
  s = await baslat(kur('#!/usr/bin/env bash\necho "eski ok"\n', 'hepsi.sh'), 0);
  j = await (await fetch(`http://127.0.0.1:${s.port}/api/test`, { method: 'POST' })).json();
  assert.equal(j.gecti, true, 'hepsi.sh yedeği');
  assert.ok(j.cikti.includes('eski ok'), 'hepsi.sh çıktısı');
  await s.kapat();
}

// yalnız POST; GET 405
s = await baslat(kur('console.log("ok");\n'), 0);
assert.equal((await fetch(`http://127.0.0.1:${s.port}/api/test`)).status, 405, 'GET 405');
await s.kapat();

console.log('test-api.test ok');
