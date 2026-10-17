// Kullanım: node panel/arayuz.test.mjs [etki]
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const d = mkdtempSync(join(tmpdir(), 'arayuz-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const s = await baslat(d, 0);
const kok = `http://127.0.0.1:${s.port}`;
const r = await fetch(`${kok}/`);
assert.equal(r.status, 200);
assert.match(r.headers.get('content-type'), /text\/html/);
const h = await r.text();
for (const id of ['simdi', 'kategoriler', 'modeller']) assert.ok(h.includes(`id="${id}"`), `#${id} yok`);
if (process.argv[2] === 'etki') assert.ok(h.includes('id="etki"'), '#etki yok');
assert.ok(h.includes('EventSource'), 'canlı güncelleme (EventSource) yok');
assert.ok(/<script[^>]*type="module"/.test(h), 'sayfa ES modülü olarak çizim modülünü kullanmalı');
assert.ok(h.includes('/ciz.mjs'), 'çizim modülü /ciz.mjs içe aktarılmalı');
assert.ok(!/https?:\/\/(?!127\.0\.0\.1|localhost)/.test(h.replace(/xmlns="[^"]*"/g, '')), 'dış kaynağa bağımlılık olmamalı');

// çizim modülü sunulur
const m = await fetch(`${kok}/ciz.mjs`);
assert.equal(m.status, 200);
assert.match(m.headers.get('content-type'), /javascript/);
const kod = await m.text();
for (const f of ['suAnHtml', 'planHtml', 'modellerHtml', 'etkiHtml']) assert.ok(kod.includes(`export function ${f}`), `${f} dışa aktarılmamış`);
await s.kapat();
console.log('arayuz.test ok');
