// Kapı (adım 154): persona-tur.mjs bash/grep/sed olmadan çalışır (Windows vekili: PATH'te yalnız node ve sahte opencode).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = resolve(fileURLToPath(import.meta.url), '..', '..');
const TUR = join(KOK, 'persona-tur.mjs');
const T = mkdtempSync(join(tmpdir(), 'tasima-persona-'));
const BIN = join(T, 'bin'); mkdirSync(BIN);
symlinkSync(process.execPath, join(BIN, 'node'));
// sahte opencode: istemde SESSIZ geçen kart hiç yazmadan bekler; diğerleri geçerli yanıt verir
writeFileSync(join(BIN, 'opencode'), `#!/usr/bin/env node
const istem=process.argv[process.argv.length-1];
if (istem.includes('SESSIZ')) setTimeout(()=>{},30000);
else console.log(JSON.stringify({type:'text',part:{type:'text',text:'Seçenek A — tamam'}}));
`);
chmodSync(join(BIN, 'opencode'), 0o755);

function proje() {
  const P = mkdtempSync(join(T, 'p-'));
  writeFileSync(join(P, 'PLAN.md'), 'Yürütücü: opencode\nModeller: m/bir, m/iki\n');
  writeFileSync(join(P, 'personalar.md'), '# P\n## Ortak\n### Çıktı biçimi (x)\nBICIM\n### Ayırt edicilik şartı\nAYIRT\n## Alan: dev\n### Kart Bir\n- soru BIR\n### Kart İki\n- soru IKI\n### Kart Sessiz\n- SESSIZ\n');
  writeFileSync(join(P, 'soru.md'), 'Problem metni\n');
  return P;
}
const kos = (P, args, ek = {}) => spawnSync(process.execPath, [TUR, ...args], { cwd: P, encoding: 'utf8', timeout: 60000, env: { HOME: T, PATH: BIN, MDK_OPENCODE: 'opencode', OPENCODE_DB: join(T, 'yok.db'), PERSONA_SURE: '20', ...ek } });
const dizin = (P) => join(P, 'persona-tur', readdirSync(join(P, 'persona-tur'))[0]);

try {
  let P = proje();
  let r = kos(P, ['dev', 'soru.md', 'Kart Bir', 'Kart İki']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const oz = readFileSync(join(dizin(P), 'ozet.md'), 'utf8');
  assert.match(oz, /Kart Bir · m\/bir · gecerli/);
  assert.match(oz, /Kart İki · m\/iki · gecerli/);
  assert.equal(resolve(P, r.stdout.trim().split('\n').pop()), dizin(P));

  P = proje();
  r = kos(P, ['yok', 'soru.md', 'Kart Bir']);
  assert.equal(r.status, 2, r.stdout + r.stderr);

  P = proje();
  const t0 = Date.now();
  r = kos(P, ['dev', 'soru.md', 'Kart Bir', 'Kart Sessiz'], { PERSONA_ILK: '1' });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.ok(Date.now() - t0 < 20000, 'sessiz kart erken bırakılır');
  const md = readdirSync(dizin(P)).find((f) => /^2-kart-sessiz\.md$/.test(f));
  assert.ok(md, 'sessiz kartın .md dosyası');
  assert.match(readFileSync(join(dizin(P), md), 'utf8'), /^Durum: sessiz$/m);

  assert.match(readFileSync(join(KOK, 'persona-tur.sh'), 'utf8'), /exec node .*persona-tur\.mjs/);
} finally { rmSync(T, { recursive: true, force: true }); }
console.log('tasima-persona.test ok');
