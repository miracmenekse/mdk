import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse, epicDurum } from './plan.mjs';
import { snapshot } from './durum.mjs';

// Kategori alanları: Epic başlığı + alanlar, adım yok ama listede kalır
const m = `## Epic 22 — Müşteri
- Durum: analiz
- Tartışma: epic/22
- Etki: etki/m.html
- Figma: https://www.figma.com/design/abc
- Onay: evet

## Başlık
`;
const p = parse(m);
const epic = p.kategoriler.find((k) => k.ad === 'Epic 22 — Müşteri');
assert.ok(epic, 'Epic kategorisi listede olmalı');
assert.equal(epic.no, '22');
assert.equal(epic.durum, 'analiz');
assert.equal(epic.tartisma, 'epic/22');
assert.equal(epic.etki, 'etki/m.html');
assert.equal(epic.figma, 'https://www.figma.com/design/abc');
assert.equal(epic.onay, true);
// alanı da adımı da olmayan başlık süzülür
assert.ok(!p.kategoriler.some((k) => k.ad === 'Başlık'));

// no çıkarımı
assert.equal(parse('## Faz 12.1 — x\n- [ ] 1. a\n  - Kapı: `true`\n').kategoriler[0].no, '12.1');
assert.equal(parse('## Panel\n- [ ] 1. a\n  - Kapı: `true`\n').kategoriler[0].no, null);

// Durum doğrulaması
assert.equal(parse('## D\n- Durum: uydurma\n- [ ] 1. a\n  - Kapı: `true`\n').kategoriler[0].durum, null);

// Tartışma doğrulaması
assert.equal(parse('## T\n- Tartışma: ../x\n- Tartışma: baska/22\n- [ ] 1. a\n  - Kapı: `true`\n').kategoriler[0].tartisma, null);

// Figma doğrulaması
assert.equal(parse('## F\n- Figma: https://kotu.example.com/x\n- [ ] 1. a\n  - Kapı: `true`\n').kategoriler[0].figma, null);

// Etki kırpma
assert.equal(parse('## E\n- Durum: analiz\n- Etki:   etki/m.html  \n').kategoriler[0].etki, 'etki/m.html');

// Adım altındaki alanlar adıma yazılır, kategoriye değil
const pz = parse('## Z\n- [ ] 1. Adım\n  - Etki: etki/a.html\n  - Onay: evet\n');
const z = pz.kategoriler[0];
assert.equal(z.etki, null);
assert.equal(z.onay, false);
assert.equal(z.adimlar[0].etki, 'etki/a.html');
assert.equal(z.adimlar[0].onay, true);

// Adım altındaki Durum/Tartışma kategoriye yazılmaz
const pd = parse('## Z2\n- Durum: analiz\n- [ ] 1. Adım\n  - Durum: gelistirme\n  - Tartışma: epic/9\n');
assert.equal(pd.kategoriler[0].durum, 'analiz');
assert.equal(pd.kategoriler[0].tartisma, null);

// epicDurum
assert.equal(epicDurum({ adimlar: [{ bitti: true }, { bitti: true }], durum: 'gelistirme' }), 'tamamlandi');
assert.equal(epicDurum({ durum: 'tasarim', adimlar: [] }), 'tasarim');
assert.equal(epicDurum({ adimlar: [{ bitti: false }] }), 'gelistirme');
assert.equal(epicDurum({ adimlar: [] }), 'analiz');
assert.equal(epicDurum(null), 'analiz');
assert.equal(epicDurum(undefined), 'analiz');
assert.equal(epicDurum({}), 'analiz');

// snapshot
const d = mkdtempSync(join(tmpdir(), 'epic-plan-'));
mkdirSync(join(d, 'epic', '22'), { recursive: true });
mkdirSync(join(d, 'etki'), { recursive: true });
writeFileSync(join(d, 'PLAN.md'), '## Epic 22 — Müşteri\n- Durum: analiz\n- Tartışma: epic/22\n');
writeFileSync(join(d, 'epic', '22', 'tartisma.json'), '{"durum":"bitti"}');
writeFileSync(join(d, 'etki', 'kararlar.jsonl'), '{"ts":5,"epic":"22","tur":"onay","metin":""}\n');
writeFileSync(join(d, 'etki', '.karar-okundu'), '9');

const s = snapshot(d);
const kayit = s.epikler.find((e) => e.no === '22');
assert.ok(kayit, 'epiklerde Epic 22 olmalı');
assert.equal(kayit.statu, 'analiz');
assert.equal(kayit.tartisma.durum, 'bitti');
assert.equal(kayit.karar.tur, 'onay');
assert.equal(kayit.alindi, true);
assert.equal(kayit.biten, 0);
assert.equal(kayit.toplam, 0);

// bozuk tartisma.json
writeFileSync(join(d, 'epic', '22', 'tartisma.json'), '{bozuk');
const s2 = snapshot(d);
const kayit2 = s2.epikler.find((e) => e.no === '22');
assert.equal(kayit2.tartisma.durum, null);

// PLAN.md yokken
const d2 = mkdtempSync(join(tmpdir(), 'epic-plan2-'));
const s3 = snapshot(d2);
assert.deepEqual(s3.epikler, []);

console.log('epic-plan.test ok');
