import assert from 'node:assert/strict';
import { parse } from './plan.mjs';

const m = `# Örnek
Yürütücü: opencode
Modeller: a/x, b/y

## Panel
- [x] 1. İlk iş
  - Kapı: \`node a.mjs\`
- [ ] 2. İkinci iş
  - Yürütücü: claude
  - Kapı: \`test -f b\`
  - Etki: etki/x.html
  - Değer: 4

## Notlar
adımsız kategori listelenmez

## Süreç
- [ ] 3. Üçüncü iş
  - Kapı: \`true\`
`;
const p = parse(m);
assert.equal(p.ayarlar.yurutucu, 'opencode');
assert.deepEqual(p.ayarlar.modeller, ['a/x', 'b/y']);
assert.deepEqual(p.kategoriler.map((k) => k.ad), ['Panel', 'Süreç']);
const [a, b] = p.kategoriler[0].adimlar;
assert.deepEqual(a, { no: 1, baslik: 'İlk iş', bitti: true, kapi: 'node a.mjs', yurutucu: 'opencode', etki: null, deger: null });
assert.deepEqual(b, { no: 2, baslik: 'İkinci iş', bitti: false, kapi: 'test -f b', yurutucu: 'claude', etki: 'etki/x.html', deger: 4 });
assert.equal(p.kategoriler[1].adimlar[0].yurutucu, 'opencode');
assert.equal(parse('').kategoriler.length, 0);
console.log('plan.test ok');
