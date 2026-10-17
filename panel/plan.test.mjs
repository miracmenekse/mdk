import assert from 'node:assert/strict';
import { parse } from './plan.mjs';

const m = `# Örnek
Yürütücü: opencode
Modeller: a/x, b/y
Bütçe: 500000

## Panel
- [x] 1. İlk iş
  - Kapı: \`node a.mjs\`
- [ ] 2. İkinci iş
  - Yürütücü: claude
  - Kapı: \`test -f b\`
  - Kapı: \`node c.mjs\`
  - Etki: etki/x.html
  - Değer: 4
  - Bütçe: 120000
  - Onay: evet (kullanıcı)

## Notlar
adımsız kategori listelenmez

## Süreç
- [ ] 3. Üçüncü iş
  - Kapı: \`true\`
- [ ] 4. Kapısız iş
`;
const p = parse(m);
assert.deepEqual(p.ayarlar, { yurutucu: 'opencode', modeller: ['a/x', 'b/y'], butce: 500000 });
assert.deepEqual(p.kategoriler.map((k) => k.ad), ['Panel', 'Süreç']);
const [a, b] = p.kategoriler[0].adimlar;
assert.deepEqual(a, { no: 1, baslik: 'İlk iş', bitti: true, kapi: 'node a.mjs', kapilar: ['node a.mjs'], yurutucu: 'opencode', etki: null, deger: null, butce: null, onay: false });
assert.deepEqual(b, { no: 2, baslik: 'İkinci iş', bitti: false, kapi: 'test -f b', kapilar: ['test -f b', 'node c.mjs'], yurutucu: 'claude', etki: 'etki/x.html', deger: 4, butce: 120000, onay: true });
const [c, k] = p.kategoriler[1].adimlar;
assert.equal(c.yurutucu, 'opencode');
assert.deepEqual(c.kapilar, ['true']);
assert.equal(k.kapi, null);
assert.deepEqual(k.kapilar, []);
assert.equal(parse('').kategoriler.length, 0);
assert.equal(parse('').ayarlar.butce, null);
console.log('plan.test ok');
