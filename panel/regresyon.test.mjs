// Kapı (adım 92): ön regresyon durumları "şu an" kartında ve plan satırında görünür. Kullanım: node panel/regresyon.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { suAnHtml, planHtml } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const ts = 1793280000000;
const kos = suAnHtml({ adim: 7, baslik: 'Yedinci', model: '', deneme: 0, durum: 'regresyon', ts }, ts + 95000);
assert.match(duz(kos), /ön regresyon koşuyor/);
assert.match(duz(kos), /geçen süre/, 'regresyon sürerken sayaç görünmeli');
assert.match(kos, /id="sure"/);
const kir = suAnHtml({ adim: 7, baslik: 'Yedinci', model: '', deneme: 0, durum: 'regresyon_kirmizi', ts }, ts + 95000);
assert.match(duz(kir), /ön regresyon kırmızı/);
assert.doesNotMatch(duz(kir), /geçen süre/, 'kırmızıda sayaç durur');

const adim = (no, baslik) => ({ no, baslik, bitti: false, kapi: 'a', yurutucu: 'opencode', etki: null, deger: null });
const plan = { ayarlar: {}, kategoriler: [{ ad: 'K', adimlar: [adim(7, 'Yedinci'), adim(8, 'Sekizinci')] }] };
const satir = (html, b) => html.split('<li').slice(1).find((r) => r.includes(b));
const h1 = planHtml(plan, { adim: 7, durum: 'regresyon', ts }, [], {});
assert.match(satir(h1, 'Yedinci'), /class="calisiyor"/, 'regresyondaki adım çalışıyor sayılır');
assert.match(satir(h1, 'Sekizinci'), /class="bekliyor"/);
const h2 = planHtml(plan, { adim: 7, durum: 'regresyon_kirmizi', ts }, [], {});
assert.match(satir(h2, 'Yedinci'), /class="bekliyor"/, 'kırmızı regresyonda adım beklemeye döner');
// tarayıcı sayacı regresyonda da akar
const sayfa = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.match(sayfa, /\['calisiyor', 'regresyon'\]\.includes\(sonSimdi\.durum/);
console.log('regresyon.test ok');
