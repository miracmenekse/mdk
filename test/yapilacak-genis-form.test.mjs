// Kapı (adım 211): Yapılacak iş formunda geniş textarea ve esnek boyut limitleri.
// Kullanım: node test/yapilacak-genis-form.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { yapilacaklarHtml } from '../panel/ciz.mjs';
import { yapilacakEkle } from '../panel/yapilacak.mjs';
import { baslat } from '../panel/sunucu.mjs';
import { depo, commit } from './yardim.mjs';

const TS = '2026-11-17T10:00:00.000Z';

// 1. Arayüz şablonu (ciz.mjs)
const html = yapilacaklarHtml([]);
assert.ok(html.includes('<textarea name="not"'), 'not alanı textarea olmalı');
assert.ok(!html.includes('<input name="not"'), 'not alanı artık input olmamalı');
assert.match(html, /<input name="baslik"[^>]*maxlength="300"/, 'başlık en çok 300 karakter olmalı');

// 2. CSS tanımları (index.html)
const indexHtml = readFileSync(join(process.cwd(), 'panel', 'index.html'), 'utf8');
assert.ok(indexHtml.includes('.yapilacak-form textarea'), 'index.html içinde .yapilacak-form textarea stili olmalı');

// 3. Veri işlevleri (yapilacak.mjs)
// Başlık 300 karaktere kadar, not 10.000 karaktere kadar geçerli olmalı
const uzunNot = 'n'.repeat(5000);
const uzunBaslik = 'b'.repeat(250);
const liste = yapilacakEkle([], { baslik: uzunBaslik, not: uzunNot }, TS);
assert.equal(liste[0].baslik.length, 250, '250 karakterlik başlık kabul edilmeli');
assert.equal(liste[0].not.length, 5000, '5000 karakterlik not kabul edilmeli');

// Sınır aşımları hata fırlatmalı
assert.throws(() => yapilacakEkle([], { baslik: 'b'.repeat(301) }, TS), /başlık/, '301 karakterlik başlık hata vermeli');
assert.throws(() => yapilacakEkle([], { baslik: 'geçerli', not: 'n'.repeat(10001) }, TS), /not/, '10001 karakterlik not hata vermeli');

// 4. Sunucu gövde limiti (/api/yapilacak)
const R = depo({ 'PLAN.md': '# MDK\n', '.gitignore': 'durum.json\nmetrikler.jsonl\n.mdk-log/\n' });
commit(R, 'ilk');
const s = await baslat(R, 0);
const kok = `http://127.0.0.1:${s.port}`;

try {
  const yanit = await fetch(`${kok}/api/yapilacak`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ islem: 'ekle', baslik: 'Geniş iş', not: 'x'.repeat(4000) }),
  });
  assert.equal(yanit.status, 200, '4 KB gövde 200 dönmeli, 413 olmamalı');
  const govde = await yanit.json();
  assert.equal(govde.tamam, true, 'ekleme başarılı olmalı');
} finally {
  await s.kapat();
}

console.log('yapilacak-genis-form.test ok');
