// Adım 106 kapısı: Depo sekmesinde "Testleri çalıştır" butonu + sonuç + /api/test POST.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const d = mkdtempSync(join(tmpdir(), 'test-ui-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const s = await baslat(d, 0);
const h = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
await s.kapat();

assert.ok(/id="sekme-depo"[\s\S]*id="test-calistir"/.test(h), 'Depo sekmesinde test butonu');
assert.ok(h.includes('Testleri çalıştır'), 'buton metni');
assert.ok(h.includes('id="test-sonuc"'), 'sonuç alanı');
assert.ok(h.includes("fetch('/api/test'") && /method:\s*'POST'/.test(h), '/api/test POST çağrısı');
assert.ok(h.includes('disabled'), 'koşarken buton kilitlenir');
console.log('test-ui.test ok');
