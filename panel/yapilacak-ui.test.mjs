// Kapı (adım 182): Panelde yapılacaklar listesi ve "yeni iş" kutusu.
// Kullanım: node panel/yapilacak-ui.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { yapilacaklarHtml } from './ciz.mjs';

const liste = [
  { id: 1, baslik: 'Birinci iş', not: '', durum: 'bekliyor', epic: null, ts: '2026-01-01T00:00:00.000Z' },
  { id: 2, baslik: 'İkinci iş', not: 'ertelenen not', durum: 'ertelendi', epic: null, ts: '2026-01-01T00:00:00.000Z' },
  { id: 3, baslik: 'Üçüncü iş', not: '', durum: 'bitti', epic: null, ts: '2026-01-01T00:00:00.000Z' },
  { id: 4, baslik: 'Dördüncü iş', not: '', durum: 'bekliyor', epic: 33, ts: '2026-01-01T00:00:00.000Z' },
];

const lilar = (h) => [...h.matchAll(/<li data-id="(\d+)"[^>]*>/g)].map((m) => m[0]);
const idler = (h) => [...h.matchAll(/<li data-id="(\d+)"/g)].map((m) => Number(m[1]));
const dugmeler = (h) => [...h.matchAll(/<button[^>]*>[^<]*<\/button>/g)].map((m) => m[0]);

// (1) boş liste: not ve form
const h1 = yapilacaklarHtml([]);
assert.ok(h1.includes('yapılacak iş yok'), 'boş listede "yapılacak iş yok" yazmalı');
assert.ok(h1.includes('id="yapilacak-form"'), 'form id="yapilacak-form" olmalı');
assert.ok(!h1.includes('<ol class="yapilacaklar">'), 'boş listede sıralı liste olmamalı');

// (2) dört öğe: üç açık öğe, biten öğe altta
const h2 = yapilacaklarHtml(liste);
assert.match(h2, /<ol class="yapilacaklar">[\s\S]*<\/ol>/, '<ol class="yapilacaklar"> olmalı');
const ol = h2.match(/<ol class="yapilacaklar">([\s\S]*?)<\/ol>/)[1];
assert.deepEqual(idler(ol), [1, 2, 4], 'açık öğeler id sırasıyla (1,2,4) listelenmeli');
assert.equal(lilar(ol).length, 3, 'ol içinde üç <li olmalı');

const detay = h2.match(/<details class="yapilacak-biten"[^>]*>([\s\S]*?)<\/details>/);
assert.ok(detay, 'biten işler <details class="yapilacak-biten"> içinde olmalı');
assert.ok(h2.includes('biten işler (1)'), '"biten işler (1)" başlığı olmalı');
assert.ok(detay[1].includes('Üçüncü iş'), 'biten öğenin başlığı details içinde olmalı');
assert.ok(!/<details[^>]*\bopen\b/.test(h2), '<details> open taşımamalı');
assert.ok(!ol.includes('Üçüncü iş'), 'biten öğe açık listede olmamalı');

// ertelendi öğesi: rozet, geri al düğmesi, not
const li2 = ol.match(/<li data-id="2"[\s\S]*?<\/li>/)[0];
assert.ok(li2.includes('class="yapilacak ertelendi"'), 'ertelendi öğe class "yapilacak ertelendi" olmalı');
assert.ok(li2.includes('<span class="rozet bekliyor">ertelendi</span>'), 'ertelendi rozeti yok');
assert.ok(li2.includes('data-deger="bekliyor"') && li2.includes('geri al'), '"geri al" düğmesi yok');
assert.ok(/<small>[^<]*ertelenen not[^<]*<\/small>/.test(li2), 'not <small> içinde olmalı');

// bekliyor öğe: ertele düğmesi, Epic rozeti (4. öğe)
const li1 = ol.match(/<li data-id="1"[\s\S]*?<\/li>/)[0];
assert.ok(li1.includes('data-islem="durum" data-deger="ertelendi"') && li1.includes('ertele'), '1. öğede "ertele" düğmesi yok');
const li4 = ol.match(/<li data-id="4"[\s\S]*?<\/li>/)[0];
assert.ok(li4.includes('<span class="rozet calisiyor">Epic 33</span>'), '4. öğede "Epic 33" rozeti yok');

// her açık öğede iki taşıma düğmesi (yukarı -1, aşağı 1)
for (const li of [li1, li2, li4]) {
  const tasi = dugmeler(li).filter((d) => d.includes('data-islem="tasi"'));
  assert.equal(tasi.length, 2, 'her açık öğede iki taşıma düğmesi olmalı');
  assert.ok(tasi.some((d) => d.includes('data-deger="-1"')), 'yukarı taşıma (-1) yok');
  assert.ok(tasi.some((d) => d.includes('data-deger="1"')), 'aşağı taşıma (1) yok');
}

// (3) hiç biten yokken details yok
const h3 = yapilacaklarHtml(liste.filter((o) => o.durum !== 'bitti'));
assert.ok(!h3.includes('yapilacak-biten'), 'biten yokken yapilacak-biten olmamalı');

// (4) izleyici: form yok, düğme yok, başlıklar görünür
const h4 = yapilacaklarHtml(liste, true);
assert.ok(!h4.includes('id="yapilacak-form"'), 'izleyici modunda form olmamalı');
assert.ok(!h4.includes('yap-islem'), 'izleyici modunda yap-islem düğmesi olmamalı');
assert.equal(dugmeler(h4).length, 0, 'izleyici modunda hiç düğme olmamalı');
assert.ok(h4.includes('Birinci iş') && h4.includes('Üçüncü iş'), 'izleyici modunda başlıklar görünmeli');

// (5) kaçış
const h5 = yapilacaklarHtml([{ id: 1, baslik: 'A <b>', not: '<i>', durum: 'bekliyor', epic: null, ts: 'x' }]);
assert.ok(h5.includes('A &lt;b&gt;'), 'başlık kaçışlanmalı');
assert.ok(h5.includes('&lt;i&gt;'), 'not kaçışlanmalı');
assert.ok(!h5.includes('A <b>') && !h5.includes('<i>'), 'ham metin HTML olarak çıkmamalı');

// (6) index.html bağlantıları
const sayfa = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const simdiKonum = sayfa.indexOf('id="simdi"');
const yapKonum = sayfa.indexOf('id="yapilacaklar"');
const katKonum = sayfa.indexOf('id="kategoriler"');
assert.ok(yapKonum > 0, 'index.html id="yapilacaklar" yok');
assert.ok(simdiKonum < yapKonum && yapKonum < katKonum, 'yapilacaklar bölümü simdi ile kategoriler arasında olmalı');
assert.ok(sayfa.includes('/api/yapilacak'), 'index.html /api/yapilacak isteği yok');
assert.match(sayfa, /import\s*\{[^}]*yapilacaklarHtml[^}]*\}\s*from\s*'\/ciz\.mjs'/, 'yapilacaklarHtml /ciz.mjs içinden içe aktarılmalı');

console.log('yapilacak-ui.test ok');
