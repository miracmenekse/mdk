// Adım 108 kapısı: durum personaTakim içerir; POST /api/persona-takim dosyaya yazar.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const d = mkdtempSync(join(tmpdir(), 'persona-api2-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
mkdirSync(join(d, 'persona'));
writeFileSync(join(d, 'persona', 'takim.json'), JSON.stringify({ personalar: [{ ad: 'A', optimize: 'o', korluk: 'k', soru: 's' }] }));

const s = await baslat(d, 0);
const kok = `http://127.0.0.1:${s.port}`;

// durum personaTakim içerir
const durum = await (await fetch(`${kok}/api/durum`)).json();
assert.ok(durum.personaTakim && durum.personaTakim.personalar[0].ad === 'A', 'durumda personaTakim olmalı');

// POST yeni takımı dosyaya yazar
const yeni = { personalar: [{ ad: 'B', optimize: 'o2', korluk: 'k2', soru: 's2' }] };
const r = await fetch(`${kok}/api/persona-takim`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(yeni) });
assert.equal(r.status, 200, 'kaydetme 200');
assert.equal(JSON.parse(readFileSync(join(d, 'persona', 'takim.json'), 'utf8')).personalar[0].ad, 'B', 'takim.json güncellendi');

// geçersiz JSON 400
const r2 = await fetch(`${kok}/api/persona-takim`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bozuk' });
assert.equal(r2.status, 400, 'geçersiz JSON 400');

await s.kapat();
console.log('persona-api2.test ok');
