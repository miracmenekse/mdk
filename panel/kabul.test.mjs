// Adım 174 kapısı: story kartında "bu iş ne zaman bitmiş sayılır" listesi.
import assert from 'node:assert/strict';
import { parse } from './plan.mjs';
import { drawerHtml, drawerImza } from './ciz.mjs';

// (1) Kabul satırları ayrıştırılır, kırpılır ve birleştirilir.
{
  const m = `## Panel
- [ ] 1. İş
  - Kabul: ilk ölçüt; ikinci ölçüt ;  
  - Kabul: üçüncü
`;
  const a = parse(m).kategoriler[0].adimlar[0];
  assert.deepEqual(a.kabul, ['ilk ölçüt', 'ikinci ölçüt', 'üçüncü']);
  assert.equal(a.kabulOnay, false);
}

// (2) Kabul satırı olmayan adım → boş dizi ve false.
{
  const m = `## Panel
- [ ] 1. İş
  - Kapı: \`node x.test.mjs\`
`;
  const a = parse(m).kategoriler[0].adimlar[0];
  assert.deepEqual(a.kabul, []);
  assert.equal(a.kabulOnay, false);
}

// (3) Kabul onayı: evet → true ve kabul dizisine eklenmez.
{
  const mEvet = `## Panel
- [ ] 1. İş
  - Kabul onayı: evet
`;
  const aEvet = parse(mEvet).kategoriler[0].adimlar[0];
  assert.equal(aEvet.kabulOnay, true);
  assert.deepEqual(aEvet.kabul, []);

  const mHayir = `## Panel
- [ ] 1. İş
  - Kabul onayı: hayır
`;
  const aHayir = parse(mHayir).kategoriler[0].adimlar[0];
  assert.equal(aHayir.kabulOnay, false);
}

// (4) Üst ayar: PLAN başında (ilk ##'den önce) Kabul onayı: zorunlu → true.
{
  const mZorunlu = `Kabul onayı: zorunlu

## Panel
- [ ] 1. İş
`;
  assert.equal(parse(mZorunlu).ayarlar.kabulOnay, true);

  const mYok = `## Panel
- [ ] 1. İş
`;
  assert.equal(parse(mYok).ayarlar.kabulOnay, false);

  const mSonra = `## Panel
- [ ] 1. İş

Kabul onayı: zorunlu
`;
  assert.equal(parse(mSonra).ayarlar.kabulOnay, false);
}

// (5) Regresyon: Bütçe, Kapı, Değer ve Kabul birlikte.
{
  const m = `## Panel
- [ ] 1. İş
  - Bütçe: 500000
  - Kapı: \`node x.test.mjs\`
  - Değer: 4
  - Kabul: a
`;
  const a = parse(m).kategoriler[0].adimlar[0];
  assert.equal(a.butce, 500000);
  assert.deepEqual(a.kapilar, ['node x.test.mjs']);
  assert.equal(a.deger, 4);
  assert.deepEqual(a.kabul, ['a']);
}

// (6) drawerHtml: başlık önce gelir, iki li, kaçış, teknik details açık değil.
{
  const h = drawerHtml({ no: 1, baslik: 'İş', kabul: ['A <b>', 'B'], kapilar: ['node x.test.mjs'] });
  assert.ok(h.indexOf('BU İŞ NE ZAMAN BİTMİŞ SAYILIR') < h.indexOf('PERSONA DÜŞÜNCELERİ'));
  assert.equal((h.match(/<li>/g) || []).length, 2);
  assert.ok(h.includes('A &lt;b&gt;'));
  assert.ok(h.includes('<details class="teknik">'));
  assert.ok(h.includes('node x.test.mjs'));
  assert.ok(h.includes('<code>node x.test.mjs</code>'));
  assert.ok(!/<details[^>]*\sopen(?:\s|>|=)/.test(h));
}

// (7) Boş kabul ve kapısız durum.
{
  const h = drawerHtml({ no: 2, baslik: 'İş', kabul: [] });
  assert.ok(h.includes('kabul ölçütü yazılmamış'));
  assert.ok(!h.includes('<ul class="kabul">'));
  assert.ok(!h.includes('<details class="teknik">'));
}

// (8) drawerImza kabul/kabulOnay'a duyarlı ve deterministik.
{
  const etki = { figma: null, onay: false, bitti: false, karar: null, alindi: false };
  const a = { persona: null, bitti: false, baslik: 'A', kabul: ['x'], kabulOnay: false };
  const aKabul = { persona: null, bitti: false, baslik: 'A', kabul: ['y'], kabulOnay: false };
  const aOnay = { persona: null, bitti: false, baslik: 'A', kabul: ['x'], kabulOnay: true };
  assert.notStrictEqual(drawerImza(a, etki), drawerImza(aKabul, etki));
  assert.notStrictEqual(drawerImza(a, etki), drawerImza(aOnay, etki));
  assert.strictEqual(drawerImza(a, etki), drawerImza({ ...a }, etki));
}

console.log('kabul.test ok');
