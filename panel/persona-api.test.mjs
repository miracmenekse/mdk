// Adım 94 kapısı: GET /api/persona?adim=<no>
// Adımın `- Persona:` yolundaki persona-tur/<zaman>/ozet.md okunur.
// Yol kök dışına çıkarsa (symlink dahil) 400; persona yoksa/dosya yoksa ozet:null.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const d = mkdtempSync(join(tmpdir(), 'persona-api-'));
const dis = mkdtempSync(join(tmpdir(), 'persona-dis-')); // kök dışı gizli alan

// persona turu olan adım (1), persona satırı olmayan adım (2), ozet.md'si olmayan adım (3)
writeFileSync(join(d, 'PLAN.md'),
  'Yürütücü: opencode\nModeller: a/x\n\n## K\n' +
  '- [ ] 1. Personalı iş\n  - Kapı: `true`\n  - Persona: persona-tur/t1\n' +
  '- [ ] 2. Personasız iş\n  - Kapı: `true`\n' +
  '- [ ] 3. Ozetsiz persona\n  - Kapı: `true`\n  - Persona: persona-tur/t3\n' +
  '- [ ] 4. Kaçış denemesi\n  - Kapı: `true`\n  - Persona: persona-tur/evil\n');

mkdirSync(join(d, 'persona-tur', 't1'), { recursive: true });
writeFileSync(join(d, 'persona-tur', 't1', 'ozet.md'), '# Persona turu\n\n## Ürün Sahibi\nMetin.\n');
mkdirSync(join(d, 'persona-tur', 't3'), { recursive: true }); // klasör var, ozet.md yok
// kök dışına symlink + orada gizli ozet.md
writeFileSync(join(dis, 'ozet.md'), 'GIZLI-SIZINTI');
symlinkSync(dis, join(d, 'persona-tur', 'evil'));

const s = await baslat(d, 0);
const kok = `http://127.0.0.1:${s.port}`;

// 1) geçerli persona → ozet metni döner
const r1 = await fetch(`${kok}/api/persona?adim=1`);
assert.equal(r1.status, 200, 'geçerli persona 200 olmalı');
const j1 = await r1.json();
assert.equal(j1.adim, 1);
assert.match(j1.ozet, /Ürün Sahibi/, 'ozet.md içeriği dönmeli');

// 2) persona satırı olmayan adım → ozet null
const j2 = await (await fetch(`${kok}/api/persona?adim=2`)).json();
assert.equal(j2.ozet, null, 'persona yoksa ozet null');

// 3) persona var ama ozet.md yok → ozet null
const j3 = await (await fetch(`${kok}/api/persona?adim=3`)).json();
assert.equal(j3.ozet, null, 'ozet.md yoksa null');

// 4) kök dışına symlink ile kaçış → 400, gizli içerik SIZMAZ
const r4 = await fetch(`${kok}/api/persona?adim=4`);
assert.equal(r4.status, 400, 'kök dışı yol 400 olmalı');
const t4 = await r4.text();
assert.ok(!t4.includes('GIZLI-SIZINTI'), 'kök dışı içerik sızmamalı');

await s.kapat();
console.log('persona-api.test ok');
