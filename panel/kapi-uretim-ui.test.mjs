// Kapı (adım 131): Modeller sekmesinde "Kapı üretimi" tablosu.
// Kullanım: node panel/kapi-uretim-ui.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { kapiUretimHtml } from './ciz.mjs';

// boş / undefined → boş durum
assert.equal(kapiUretimHtml([]), '<p class="bos">henüz kapı üretilmedi</p>');
assert.equal(kapiUretimHtml(undefined), '<p class="bos">henüz kapı üretilmedi</p>');

const iki = [
  { model: 'opencode/a', deneme: 2, kabul: 1, sessiz: 1, nedenler: { kapi_yesil: 1 }, ortSure: 91 },
  { model: 'opencode/b<x>', deneme: 6, kabul: 6, sessiz: 0, nedenler: {}, ortSure: 74 },
];
const h = kapiUretimHtml(iki);
assert.ok(h.includes('kabul % kod başarısı değildir'), 'alt başlık metni yok');
assert.ok(h.includes('<table'), 'tablo yok');
// deneme azalan: b satırı a satırından önce
assert.ok(h.indexOf('b&lt;x&gt;') >= 0, 'b modeli yok');
assert.ok(h.indexOf('b&lt;x&gt;') < h.indexOf('opencode/a'), 'sıralama deneme azalan değil');
assert.ok(h.includes('1 / 2 · %50'), 'a kapı kabul satırı yok');
assert.ok(h.includes('6 / 6 · %100'), 'b kapı kabul satırı yok');
assert.ok(h.includes('kod yazılmadan yeşil ×1'), 'ret nedeni etiketi yok');
const azSayisi = (h.match(/az örnek/g) || []).length;
assert.equal(azSayisi, 1, 'az örnek tam bir kez olmalı');
assert.ok(h.includes('<span class="rozet az-ornek">az örnek</span>'), 'az örnek rozeti yok');
assert.ok(h.includes('b&lt;x&gt;'), 'model kaçışlı değil');
assert.ok(!h.includes('b<x>'), 'ham model etiketi var');
assert.ok(h.includes('91') && h.includes('74'), 'ort. sn değerleri yok');

// bilinmeyen ret nedeni olduğu gibi (esc ile)
const z = kapiUretimHtml([{ model: 'm', deneme: 1, kabul: 0, sessiz: 0, nedenler: { zzz: 2 }, ortSure: 5 }]);
assert.ok(z.includes('zzz ×2'), 'bilinmeyen neden ×sayı yok');

// deneme 0 → kapı kabul sütunu —
const sifir = kapiUretimHtml([{ model: 'm', deneme: 0, kabul: 0, sessiz: 0, nedenler: {}, ortSure: 5 }]);
assert.ok(!sifir.includes('0 / 0'), 'deneme 0 iken 0 / 0 yazılmamalı');
assert.ok(sifir.includes('—'), 'deneme 0 iken — yok');

// etiket eşlemeleri
const etiketler = [
  ['kapi_yesil', 'kod yazılmadan yeşil'],
  ['kapi_sozdizimi', 'sözdizimi bozuk'],
  ['kapi_eksik', 'dosya yazılmadı'],
  ['kapi_kapsam', 'başka dosyaya yazdı'],
];
for (const [kod, etiket] of etiketler) {
  const hh = kapiUretimHtml([{ model: 'm', deneme: 2, kabul: 0, sessiz: 0, nedenler: { [kod]: 1 }, ortSure: 1 }]);
  assert.ok(hh.includes(`${etiket} ×1`), `${etiket} etiketi yok`);
}

// bilinmeyen neden HTML kaçışlı
const xss = kapiUretimHtml([{ model: 'm', deneme: 1, kabul: 0, sessiz: 0, nedenler: { '<x>': 1 }, ortSure: 1 }]);
assert.ok(xss.includes('&lt;x&gt; ×1'), 'neden kaçışlı değil');
assert.ok(!xss.includes('<x> ×1'), 'ham neden etiketi var');

// panel/index.html: kapi-uretim bölümü gorev-modelleri sonrası ve çağrı var
const idx = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(idx.includes('kapiUretimHtml('), 'index.html kapiUretimHtml çağrısı yok');
const iGorev = idx.indexOf('id="gorev-modelleri"');
const iKapi = idx.indexOf('id="kapi-uretim"');
assert.ok(iGorev >= 0 && iKapi > iGorev, 'kapi-uretim gorev-modelleri sonrası değil');
assert.ok(idx.includes('kapiUretimEl'), 'kapiUretimEl yok');
assert.ok(idx.includes('kapiUretimHtml(d.kapiUretim)'), 'kapiUretimHtml(d.kapiUretim) çağrısı yok');
assert.ok(idx.includes('.az-ornek'), '.az-ornek CSS yok');

console.log('kapi-uretim-ui.test ok');
