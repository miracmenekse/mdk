import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';
import { etkiHtml } from './ciz.mjs';

// Gerçek tarayıcıda "önce" ve "sonra" kutularının ikisi de tam sayfayı gösteriyordu (#once yalnızca kaydırır).
// Çözüm: /dosya?yol=...&goster=once|sonra yanıtına, yalnızca ilgili <svg id> figürünü bırakan <style> eklenir.
const d = mkdtempSync(join(tmpdir(), 'goster-'));
mkdirSync(join(d, 'etki'));
const taslak = '<!doctype html><html><head><title>t</title></head><body><figure><svg id="once"></svg></figure><figure><svg id="sonra"></svg></figure></body></html>';
writeFileSync(join(d, 'etki', 'a.html'), taslak);
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const s = await baslat(d, 0);
const kok = `http://127.0.0.1:${s.port}`;

for (const [bolum, diger] of [['once', 'sonra'], ['sonra', 'once']]) {
  const r = await fetch(`${kok}/dosya?yol=etki/a.html&goster=${bolum}`);
  assert.equal(r.status, 200);
  const h = await r.text();
  assert.ok(h.includes('<style'), 'yanıta stil eklenmeli');
  assert.ok(h.includes(`#${bolum}`) && h.includes('display'), 'yalnız istenen bölümü gösteren kural olmalı');
  assert.ok(h.includes(`svg id="${bolum}"`) && h.includes(`svg id="${diger}"`), 'özgün içerik silinmemeli (yalnız gizlenir)');
  assert.ok(h.indexOf('<style') < h.indexOf('</head>'), 'stil <head> içine eklenmeli');
}

// goster verilmezse özgün dosya aynen gelir; geçersiz değer reddedilir; yol koruması sürer
assert.equal(await (await fetch(`${kok}/dosya?yol=etki/a.html`)).text(), taslak);
assert.equal((await fetch(`${kok}/dosya?yol=etki/a.html&goster=baska`)).status, 400);
assert.equal((await fetch(`${kok}/dosya?yol=../x.html&goster=once`)).status, 400);
await s.kapat();

// etkiHtml: iframe adresleri #hash değil goster parametresi kullanır
const e = { no: 1, baslik: 'Rapor', dosya: 'etki/r.html', deger: 5, tahmin: { token: 1000, maliyet: 0, guven: 'dusuk' } };
const h = etkiHtml([e]);
assert.ok(h.includes('goster=once') && h.includes('goster=sonra'), 'iframe adresleri goster=once/sonra taşımalı');
assert.ok(!h.includes('#once') && !h.includes('#sonra'), 'hash ile "ayırma" kalmamalı');
console.log('etki-goster.test ok');
