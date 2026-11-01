// Adım 109 kapısı: Persona sekmesi (5. kart) + düzenle/sil/ekle/yorum UI.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';
import { kpiHtml } from './ciz.mjs';

const d = mkdtempSync(join(tmpdir(), 'persona-ui-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
mkdirSync(join(d, 'persona'));
writeFileSync(join(d, 'persona', 'takim.json'), JSON.stringify({ personalar: [{ ad: 'A', optimize: 'o', korluk: 'k', soru: 's' }] }));
const s = await baslat(d, 0);
const h = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
await s.kapat();

assert.ok(h.includes('id="sekme-persona"'), 'Persona sekme paneli');
assert.ok(h.includes('id="persona-takim"'), 'persona takım bölümü');
assert.ok(h.includes('id="persona-ekle"'), 'persona ekle formu');
assert.ok(h.includes('personaTakimHtml'), 'personaTakimHtml render edilmeli');
assert.ok(h.includes('/api/persona-takim') && /method:\s*'POST'/.test(h), 'kaydet POST /api/persona-takim');
assert.ok(h.includes('persona-sil') && h.includes('persona-yorum'), 'sil + yorum kontrolleri');
assert.ok(/SEKMELER = \[[^\]]*'persona'/.test(h), 'SEKMELER persona içermeli');

// 5. KPI kartı: Persona sekmesi
const kpi = kpiHtml({ personaTakim: { personalar: [{ ad: 'A' }, { ad: 'B' }] }, plan: null, gecmis: [], modeller: [] });
assert.ok(/role="tab"[^>]*data-sekme="persona"/.test(kpi), 'Persona KPI kartı (sekme)');
assert.ok(kpi.includes('takım üyesi'), 'Persona kart alt etiketi');

console.log('persona-ui.test ok');
