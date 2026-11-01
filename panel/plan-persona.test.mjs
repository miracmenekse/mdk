// Adım 93 kapısı: PLAN.md ayrıştırıcıda `- Persona: <yol>` alanı.
// Kural: yalnız satır varsa `adim.persona` atanır; `persona-tur/` ile başlamayan
// ya da `..` içeren yol `null`; Persona satırı yoksa `persona` anahtarı hiç yok.
import assert from 'node:assert/strict';
import { parse } from './plan.mjs';

const m = `## Panel
- [ ] 1. Geçerli persona yolu
  - Kapı: \`true\`
  - Persona: persona-tur/20261101-120000
- [ ] 2. Kök dışı yol
  - Kapı: \`true\`
  - Persona: /etc/passwd
- [ ] 3. Üst dizin kaçışı
  - Kapı: \`true\`
  - Persona: persona-tur/../gizli
- [ ] 4. Persona yok
  - Kapı: \`true\`
`;

const p = parse(m);
const [a, b, c, d] = p.kategoriler[0].adimlar;

// geçerli yol aynen gelir
assert.equal(a.persona, 'persona-tur/20261101-120000', 'geçerli persona yolu atanmalı');
// kök dışı mutlak yol reddedilir
assert.equal(b.persona, null, 'persona-tur/ ile başlamayan yol null olmalı');
// üst dizin kaçışı reddedilir
assert.equal(c.persona, null, '.. içeren yol null olmalı');
// Persona satırı olmayan adımda anahtar hiç bulunmamalı (mevcut plan.test.mjs bozulmasın)
assert.ok(!('persona' in d), 'Persona satırı yoksa persona anahtarı olmamalı');

console.log('plan-persona.test ok');
