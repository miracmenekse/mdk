// Kapı (adım 213): Model × matris arayüzünde Epic/Adım görünüm seçici ve toplam satırı.
// Kullanım: node test/matris-gorunum-ui.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { matrisHtml } from '../panel/ciz.mjs';

const m = {
  adimlar: [101, 102],
  modeller: [
    {
      yurutucu: 'agy',
      model: 'agy/flash',
      deney: null,
      hucreler: {
        101: { durum: 'ilk', deneme: 1, sure: 12, token: 15000, istek: 2 },
        102: { durum: 'cok', deneme: 2, sure: 30, token: 25000, istek: 4 },
      },
    },
  ],
  adimToplam: {
    101: { token: 15000, istek: 2 },
    102: { token: 25000, istek: 4 },
  },
  epikler: [
    {
      no: '40',
      ad: 'Giriş Paneli',
      token: 40000,
      istek: 6,
    },
  ],
};

// 1. Görünüm seçici ve Adım Görünümü
const htmlAdim = matrisHtml(m, 'adim');
assert.ok(htmlAdim.includes('matris-gorunum-toggle') || htmlAdim.includes('data-gorunum'), 'görünüm seçici düğmeleri olmalı');
assert.ok(htmlAdim.includes('data-gorunum="adim"') && htmlAdim.includes('data-gorunum="epic"'), 'adım ve epic geçiş butonları olmalı');
assert.ok(htmlAdim.includes('matris-toplam') || htmlAdim.includes('toplam'), 'adım görünümünde alt toplam satırı olmalı');
assert.ok(htmlAdim.includes('15k') || htmlAdim.includes('15.0k'), 'toplam token formatı gösterilmeli');

// 2. Epic Görünümü
const htmlEpic = matrisHtml(m, 'epic');
assert.ok(htmlEpic.includes('Epic 40') || htmlEpic.includes('Giriş Paneli'), 'Epic görünümünde Epic başlığı/adı yer almalı');
assert.ok(htmlEpic.includes('40k') || htmlEpic.includes('40.0k'), 'Epic toplam tokenı yer almalı');

// 3. Geriye dönük uyumluluk
assert.equal(matrisHtml(null), '<span class="bos">metrik yok</span>');
assert.equal(matrisHtml({ adimlar: [], modeller: [] }), '<span class="bos">metrik yok</span>');

// 4. index.html entegrasyonu (stil ve dinleyici)
const indexHtml = readFileSync(join(process.cwd(), 'panel', 'index.html'), 'utf8');
assert.ok(indexHtml.includes('matris-gorunum-toggle') || indexHtml.includes('data-gorunum'), 'index.html içinde görünüm toggle mantığı veya stili olmalı');

console.log('matris-gorunum-ui.test ok');
