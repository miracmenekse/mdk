import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planHtml } from './ciz.mjs';

// Ekran görüntüsünde adım 13'ün başlığı harf harf alt alta diziliyordu: uzun kapı komutu başlığı sıkıştırıyordu.
// Çözüm: başlık/rozet üst satırda, yürütücü + kapı komutu ayrı bir alt satırda.
const uzun = 'bash test/mdk-adim.test.sh temel coklu onay neden sure yanit_yok butce butce_ok sorun once && node panel/plan.test.mjs';
const plan = { ayarlar: {}, kategoriler: [{ ad: 'K', adimlar: [
  { no: 13, baslik: 'SORUN.md ve model sırası', bitti: true, kapi: uzun, kapilar: [uzun], yurutucu: 'kodcu', etki: null, deger: null },
] }] };
const html = planHtml(plan, null);

const m = html.match(/<div class="adim-ust">([\s\S]*?)<\/div>\s*<div class="adim-alt">([\s\S]*?)<\/div>/);
assert.ok(m, 'satır "adim-ust" ve ardından "adim-alt" bölümlerinden oluşmalı');
const [, ust, alt] = m;
assert.ok(ust.includes('SORUN.md ve model sırası'), 'başlık üst satırda');
assert.ok(ust.includes('bitti'), 'rozet üst satırda');
assert.ok(!ust.includes('mdk-adim.test.sh'), 'kapı komutu üst satırda olmamalı');
assert.ok(alt.includes('kodcu') && alt.includes('mdk-adim.test.sh'), 'yürütücü ve kapı komutu alt satırda');

// CSS: alt satır küçük ve uzun komutu kırar; başlık daralmaz
const css = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.match(css, /\.adim-alt\s*\{[^}]*overflow-wrap:\s*anywhere/, '.adim-alt uzun komutu kırmalı');
assert.match(css, /\.adim-ust\s*\{[^}]*display:\s*flex/, '.adim-ust flex satır olmalı');
assert.match(css, /\.adim-ust\s+\.baslik\s*\{[^}]*flex:\s*1/, 'başlık esnek genişlik almalı');
assert.ok(!/ul\.adimlar li\s*\{[^}]*display:\s*flex/.test(css), 'li doğrudan flex olmamalı (başlık sıkışıyordu)');
console.log('duzen.test ok');
