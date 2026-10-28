import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { denetle } from '../kapi-denetle.mjs';

const plan = `Yürütücü: opencode
Modeller: a/x

## K
- [x] 1. Bitmiş kapısız
- [ ] 2. Kapısız
- [ ] 3. Zayıf
  - Kapı: \`test -f a.txt\`
  - Kapı: \`ls panel\`
- [ ] 4. Güçlü
  - Kapı: \`node panel/x.test.mjs\`
- [ ] 5. Betik
  - Kapı: \`bash test/mdk-adim.test.sh temel\`
- [ ] 6. Başka yürütücü
  - Yürütücü: claude
  - Kapı: \`true\`
- [ ] 7. Etki onaysız
  - Kapı: \`node test/a.test.mjs\`
  - Etki: etki/a.html
- [ ] 8. Etki onaylı
  - Kapı: \`node test/a.test.mjs\`
  - Etki: etki/a.html
  - Onay: evet
- [ ] 9. Çoklu karışık
  - Kapı: \`test -f a.txt\`
  - Kapı: \`node --test panel/\`
`;
const b = denetle(plan);
assert.deepEqual(b.map((x) => `${x.no}:${x.seviye}`).sort(), ['2:HATA', '3:UYARI', '7:BİLGİ']);
assert.ok(b.every((x) => typeof x.mesaj === 'string' && x.mesaj.length > 0));
assert.deepEqual(denetle(''), []);

// komut satırı
const KOMUT = fileURLToPath(new URL('../kapi-denetle.mjs', import.meta.url));
const d = mkdtempSync(join(tmpdir(), 'kd-'));
writeFileSync(join(d, 'KOTU.md'), plan);
let r = spawnSync(process.execPath, [KOMUT, join(d, 'KOTU.md')], { encoding: 'utf8' });
assert.equal(r.status, 1, 'HATA varsa çıkış 1');
assert.match(r.stdout, /adım 2: HATA/);
assert.match(r.stdout, /adım 3: UYARI/);
writeFileSync(join(d, 'IYI.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İyi\n  - Kapı: `node panel/x.test.mjs`\n');
r = spawnSync(process.execPath, [KOMUT, join(d, 'IYI.md')], { encoding: 'utf8' });
assert.equal(r.status, 0, r.stderr);
assert.match(r.stdout, /kapılar tamam/);
console.log('kapi-denetle.test ok');
