// Kapı (adım 56): yapılan birleşim önerilerine "yapıldı · adım N" rozeti; açıklar önce. Kullanım: node panel/arastirma-yapildi.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { arastirmaHtml } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const b = (ad, adim) => ({ ad, parcalar: ['o/r'], ne: 'n', neden: 'n', panelde: 'p', efor: 'S', deger: 3, risk: 'r', ...(adim === undefined ? {} : { adim }) });
const veri = { adaylar: [], birlesimler: [b('Bir', 44), b('İki'), b('Üç', 41), b('Dört'), b('Beş', '45')] };
const h = arastirmaHtml(veri);
const t = duz(h);
assert.ok(t.includes('Birleşim önerileri (3 açık, 2 yapıldı)'), 'adim sayı olmayan ("45") açık sayılır: ' + t.slice(0, 200));
const sira = ['İki', 'Dört', 'Beş', 'Bir', 'Üç'].map((x) => h.indexOf(`>${x}<`));
assert.ok(sira.every((x) => x >= 0) && sira.every((x, i) => i === 0 || x > sira[i - 1]), 'açıklar kendi sırasında önce, yapılanlar sonra: ' + sira);
assert.ok(h.includes('<span class="rozet bitti">yapıldı · adım 44</span>') && h.includes('yapıldı · adım 41'));
// yapılanda efor rozeti yok, açıkta var
const kart = (ad) => h.slice(h.indexOf(`>${ad}<`), h.indexOf('</div></div>', h.indexOf(`>${ad}<`)) + 1 || undefined).split('<div class="etki-kart">')[0];
assert.ok(!kart('Bir').includes('efor') && kart('İki').includes('efor S'), kart('Bir'));
// hiç yapılan yoksa başlık yine sayılı
assert.ok(duz(arastirmaHtml({ adaylar: [], birlesimler: [b('X')] })).includes('Birleşim önerileri (1 açık, 0 yapıldı)'));

// gerçek veri: Claude'un işlediği eşleme
const gercek = JSON.parse(readFileSync(new URL('../arastirma/arastirma.json', import.meta.url), 'utf8'));
const esleme = Object.fromEntries(gercek.birlesimler.filter((x) => typeof x.adim === 'number').map((x) => [x.ad, x.adim]));
assert.equal(Object.keys(esleme).length, 6, JSON.stringify(esleme));
console.log('arastirma-yapildi.test ok');
