// Kapı (adım 66): durum.mjs — etki kayıtlarına onay, son karar, alındı bilgisi; izleyici canlı mı.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshot } from './durum.mjs';

const d = mkdtempSync(join(tmpdir(), 'karar-durum-'));
mkdirSync(join(d, 'etki'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n' +
  '- [ ] 21. Onaylı\n  - Etki: etki/a.html\n  - Onay: evet\n  - Kapı: `true`\n' +
  '- [ ] 22. Kararlı\n  - Etki: etki/b.html\n  - Kapı: `true`\n' +
  '- [ ] 23. Kararsız\n  - Etki: etki/c.html\n  - Kapı: `true`\n');
const satir = (k) => JSON.stringify(k) + '\n';
writeFileSync(join(d, 'etki', 'kararlar.jsonl'),
  satir({ ts: 100, no: 22, tur: 'yorum', metin: 'ilk' }) +
  satir({ ts: 300, no: 99, tur: 'red', metin: 'başka adım' }) +
  satir({ ts: 500, no: 22, tur: 'red', metin: 'son söz' }));

const bul = (s, no) => s.etki.find((e) => e.no === no);

// işaret yok: hiçbir karar alınmamış; izleyici yok
let s = snapshot(d);
assert.equal(bul(s, 21).onay, true);
assert.equal(bul(s, 22).onay, false);
assert.deepEqual(bul(s, 22).karar, { ts: 500, no: 22, tur: 'red', metin: 'son söz' }, 'adımın EN SON kararı');
assert.equal(bul(s, 22).alindi, false);
assert.equal(bul(s, 23).karar, null);
assert.equal(bul(s, 23).alindi, false);
assert.equal(s.kararIzleyici, false);

// işaret son karardan önce: alınmadı; sonra/eşit: alındı
writeFileSync(join(d, 'etki', '.karar-okundu'), '499\n');
assert.equal(bul(snapshot(d), 22).alindi, false);
writeFileSync(join(d, 'etki', '.karar-okundu'), '500\n');
assert.equal(bul(snapshot(d), 22).alindi, true);

// izleyici: pid dosyasındaki süreç yaşıyorsa true, ölüyse/bozuksa false
writeFileSync(join(d, 'etki', '.karar-izleyici'), `${process.pid}\n`);
assert.equal(snapshot(d).kararIzleyici, true);
writeFileSync(join(d, 'etki', '.karar-izleyici'), '2147480000\n');
assert.equal(snapshot(d).kararIzleyici, false);
writeFileSync(join(d, 'etki', '.karar-izleyici'), 'abc');
assert.equal(snapshot(d).kararIzleyici, false);

// kararlar dosyası bozuk satırlıysa ya da yoksa düşmez
writeFileSync(join(d, 'etki', 'kararlar.jsonl'), '{bozuk\n');
assert.equal(bul(snapshot(d), 22).karar, null);
rmSync(join(d, 'etki', 'kararlar.jsonl'));
assert.equal(bul(snapshot(d), 22).karar, null);
console.log('karar-durum.test ok');
