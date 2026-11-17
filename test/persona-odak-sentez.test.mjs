// Kapı (adım 215): Odak persona ayrıştırma ve tartışma sentezinde ağırlıklı karar motoru
// Kullanım: node test/persona-odak-sentez.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse } from '../panel/plan.mjs';
import { snapshot } from '../panel/durum.mjs';

const SCRIPT = resolve('epic-tartis.mjs');

// 1. PLAN.md Ayrıştırma (panel/plan.mjs)
const planMetni = `
# MDK
## Epic 10 — Odak Testi
- Durum: gelistirme
- Odak-persona: Bilişsel Yük Bekçisi
- [ ] 1. Test adımı
  - Odak-persona: Geliştirme Yöneticisi
`;
const parsed = parse(planMetni);
assert.equal(parsed.kategoriler[0].odakPersona, 'Bilişsel Yük Bekçisi', 'kategori odakPersona ayrıştırılmalı');
assert.equal(parsed.kategoriler[0].adimlar[0].odakPersona, 'Geliştirme Yöneticisi', 'adım odakPersona ayrıştırılmalı');

// 2. Snapshot Aktarımı (panel/durum.mjs)
const d = mkdtempSync(join(tmpdir(), 'odak-sentez-'));
writeFileSync(join(d, 'PLAN.md'), planMetni);
const snap = snapshot(d);
const epikObj = snap.epikler.find((e) => String(e.no) === '10');
assert.ok(epikObj, 'Epic 10 bulunmalı');
assert.equal(epikObj.odakPersona, 'Bilişsel Yük Bekçisi', 'snapshot içine odakPersona aktarılmalı');

// 3. epic-tartis.mjs --odak Parametresi ve Moderatör İstem Doğrulaması
function fakeYaz(dir) {
  const p = join(dir, 'fake-opencode.mjs');
  writeFileSync(p, `#!/usr/bin/env node
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.env.STUB_DIR;
const args = process.argv.slice(2);
let model = '';
for (let i = 0; i < args.length; i++) if (args[i] === '-m') model = args[i + 1];
const istem = args.length ? args[args.length - 1] : '';
const cfile = join(dir, 'counter');
let n = 0;
try { n = parseInt(readFileSync(cfile, 'utf8'), 10) || 0; } catch {}
n += 1;
writeFileSync(cfile, String(n));
appendFileSync(join(dir, 'calls.log'), JSON.stringify({ model: model, istem: istem, argv: args }) + '\\n');
console.log(JSON.stringify({ type: 'text', part: { text: 'YANIT ' + n } }));
`);
  chmodSync(p, 0o755);
}

const dir = mkdtempSync(join(tmpdir(), 'odak-tartis-'));
mkdirSync(join(dir, 'persona'), { recursive: true });
mkdirSync(join(dir, 'epic', '9'), { recursive: true });
writeFileSync(join(dir, 'PLAN.md'), 'Görev persona: m/bir, m/iki\n## Epic 9 — Test\n- Odak-persona: Bilişsel Yük Bekçisi\n');
writeFileSync(join(dir, 'persona', 'takim.json'), JSON.stringify({
  personalar: [
    { ad: 'Bilişsel Yük Bekçisi', optimize: 'bilişsel', korluk: 'kör1', soru: 'soru1' },
    { ad: 'Geliştirme Yöneticisi', optimize: 'hız', korluk: 'kör2', soru: 'soru2' },
  ],
}, null, 2));
writeFileSync(join(dir, 'epic', '9', 'is.md'), '# Örnek iş metni');
fakeYaz(dir);

const env = { ...process.env, MDK_OPENCODE: join(dir, 'fake-opencode.mjs'), STUB_DIR: dir, EPIC_SURE: '10' };

// 3a. --odak argümanıyla çağırma
const res = spawnSync(process.execPath, [SCRIPT, '9', '--odak', 'Bilişsel Yük Bekçisi'], {
  cwd: dir,
  env,
  encoding: 'utf8',
  timeout: 15000,
});
assert.equal(res.status, 0, `epic-tartis çıkışı 0 olmalı: ${res.stderr || res.stdout}`);

const tartisma = JSON.parse(readFileSync(join(dir, 'epic', '9', 'tartisma.json'), 'utf8'));
assert.ok(tartisma.odak, 'tartisma.json içinde odak bilgisi bulunmalı');
assert.equal(tartisma.odak.ad, 'Bilişsel Yük Bekçisi');
assert.equal(tartisma.odak.carpan, 3);

// 3b. Moderatör isteminde (Tur 3) odak ve emniyet katmanı kontrolü
const calls = readFileSync(join(dir, 'calls.log'), 'utf8').trim().split('\n').map(JSON.parse);
const tur3Call = calls[calls.length - 1];
assert.ok(tur3Call.istem.includes('Bilişsel Yük Bekçisi'), 'tur 3 isteminde odak persona geçmeli');
assert.ok(tur3Call.istem.includes('×3') || tur3Call.istem.includes('3 kat') || tur3Call.istem.includes('ağırlık: 3') || tur3Call.istem.includes('çarpan: 3'), 'tur 3 isteminde 3 kat çarpan geçmeli');
assert.ok(tur3Call.istem.includes('emniyet') || tur3Call.istem.includes('kırmızı kapı') || tur3Call.istem.includes('kota'), 'tur 3 isteminde bastırılamaz emniyet uyarısı yer almalı');

// 3c. Bilinmeyen/geçersiz odak persona verildiğinde varsayılan ağırlıkla devam etmeli
const resGecersiz = spawnSync(process.execPath, [SCRIPT, '9', '--odak', 'Bilinmeyen'], {
  cwd: dir,
  env,
  encoding: 'utf8',
  timeout: 15000,
});
assert.equal(resGecersiz.status, 0, 'geçersiz odakta sistem çökmeyip varsayılanla devam etmeli');

console.log('persona-odak-sentez.test ok');
