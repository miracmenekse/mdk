import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tahmin } from './tahmin.mjs';
import { snapshot } from './durum.mjs';

// tahmin(satirlar, adimSayisi): geçen satırların token/maliyet medyanı x adım sayısı
const g = (token, maliyet, gecti = true) => ({ gecti, token, maliyet });
assert.deepEqual(tahmin([], 2), { token: 0, maliyet: 0, guven: 'dusuk' });
assert.deepEqual(tahmin([g(100, 1), g(300, 3), g(200, 2), g(999, 9, false)], 2), { token: 400, maliyet: 4, guven: 'orta' });
assert.equal(tahmin([g(1, 0), g(1, 0)], 1).guven, 'dusuk'); // güven: <3 geçen satır düşük, 3-9 orta, 10+ yüksek
assert.equal(tahmin(Array.from({ length: 3 }, () => g(1, 0)), 1).guven, 'orta');
assert.equal(tahmin(Array.from({ length: 10 }, () => g(1, 0)), 1).guven, 'yuksek');

// snapshot().etki: "Etki:" alanı olan adımlar, bitti alanıyla (adım 53)
const d = mkdtempSync(join(tmpdir(), 'etki-'));
writeFileSync(join(d, 'PLAN.md'), `Yürütücü: opencode
Modeller: a/x

## K
- [ ] 1. Raporu değiştir
  - Kapı: \`true\`
  - Etki: etki/rapor.html
  - Değer: 5
- [x] 2. Bitmiş
  - Kapı: \`true\`
  - Etki: etki/eski.html
- [ ] 3. Etkisiz
  - Kapı: \`true\`
`);
writeFileSync(join(d, 'metrikler.jsonl'), JSON.stringify({ model: 'a/x', deneme: 1, gecti: true, token: 1000, maliyet: 0, sure_sn: 5 }) + '\n');
const e = snapshot(d).etki;
assert.equal(e.length, 2);
assert.deepEqual(e[0], { no: 1, baslik: 'Raporu değiştir', dosya: 'etki/rapor.html', deger: 5, bitti: false, tahmin: { token: 1000, maliyet: 0, guven: 'dusuk' } });
assert.equal(e[1].no, 2);
assert.equal(e[1].bitti, true);
assert.equal(e[1].dosya, 'etki/eski.html');
console.log('etki.test ok');
