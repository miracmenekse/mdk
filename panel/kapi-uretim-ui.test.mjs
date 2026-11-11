import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { kapiUretimHtml } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

// boş / undefined / null / dizi olmayan girdiler
for (const v of [[], undefined, null, 'metin', 0, {}, 42]) {
  assert.equal(
    kapiUretimHtml(v),
    '<p class="bos">henüz kapı üretilmedi</p>',
    `boş olmayan girdi boş kabul edilmeli: ${String(v)}`,
  );
}

// temel çıktı, sıralama, kaçış, rozet ve etiketler
const girdi = [
  { model: 'opencode/a', deneme: 2, kabul: 1, sessiz: 1, nedenler: { kapi_yesil: 1 }, ortSure: 91.4 },
  { model: 'opencode/b<x>', deneme: 6, kabul: 6, sessiz: 0, nedenler: {}, ortSure: 74 },
];
const h = kapiUretimHtml(girdi);
assert.ok(h.includes('<table'), 'tablo olmalı');
assert.ok(h.indexOf('opencode/b&lt;x&gt;') >= 0, 'kaçışlanmış model adı yok');
assert.ok(
  h.indexOf('opencode/b&lt;x&gt;') < h.indexOf('opencode/a'),
  'b satırı a satırından önce gelmeli',
);
for (const s of ['1 / 2 · %50', '6 / 6 · %100', 'kod yazılmadan yeşil ×1', '91', 'kabul % kod başarısı değildir']) {
  assert.ok(h.includes(s), `eksik: ${s}`);
}
assert.equal(h.split('<span class="rozet az-ornek">az örnek · sırayı henüz değiştirme</span>').length - 1, 1, 'az örnek rozeti tam bir kez geçmeli');
assert.ok(h.includes('b&lt;x&gt;'), 'model adı kaçışlanmalı');
assert.ok(!h.includes('b<x>'), 'ham model adı sızdırılmamalı');

// bilinmeyen ve bilinen ret nedeni etiketleri
const hn = kapiUretimHtml([{ model: 'm', deneme: 1, kabul: 0, sessiz: 0, nedenler: { zzz: 2, kapi_eksik: 1 }, ortSure: 5 }]);
assert.ok(hn.includes('zzz ×2'), 'bilinmeyen neden kodu olduğu gibi yazılmalı');
assert.ok(hn.includes('dosya yazılmadı ×1'), 'kapi_eksik etiketi yanlış');

const hb = kapiUretimHtml([{ model: 'm', deneme: 4, kabul: 0, sessiz: 0, nedenler: { kapi_yesil: 1, kapi_sozdizimi: 2, kapi_eksik: 3, kapi_kapsam: 4 }, ortSure: 10 }]);
for (const s of ['kod yazılmadan yeşil ×1', 'sözdizimi bozuk ×2', 'dosya yazılmadı ×3', 'başka dosyaya yazdı ×4']) {
  assert.ok(hb.includes(s), `eksik etiket: ${s}`);
}

// deneme 0 → — ve NaN yok
const h0 = kapiUretimHtml([{ model: 'm', deneme: 0, kabul: 0, sessiz: 0, nedenler: {}, ortSure: 5 }]);
assert.ok(h0.includes('—'), 'deneme 0 için — olmalı');
assert.ok(!h0.includes('NaN'), 'deneme 0 NaN üretmemeli');

// ortSure null → NaN yok
const hN = kapiUretimHtml([{ model: 'm', deneme: 1, kabul: 1, sessiz: 0, nedenler: {}, ortSure: null }]);
assert.ok(!hN.includes('NaN'), 'null süre NaN üretmemeli');

// ret nedeni anahtarı kaçışlanmalı
const he = kapiUretimHtml([{ model: 'm', deneme: 1, kabul: 0, sessiz: 0, nedenler: { '<x>': 1 }, ortSure: 1 }]);
assert.ok(he.includes('&lt;x&gt; ×1'), 'neden anahtarı kaçışlanmalı');
assert.ok(!he.includes('<x> ×1'), 'ham neden anahtarı sızdırılmamalı');

// eşit denemede model adı artan
const ht = kapiUretimHtml([
  { model: 'm/b', deneme: 2, kabul: 1, sessiz: 0, nedenler: {}, ortSure: 1 },
  { model: 'm/a', deneme: 2, kabul: 1, sessiz: 0, nedenler: {}, ortSure: 1 },
]);
assert.ok(ht.indexOf('m/a') < ht.indexOf('m/b'), 'eşit denemede model adı artan olmalı');

// sütun başlıkları
const t = duz(h);
for (const s of ['model', 'deneme', 'kapı kabul', 'ret nedenleri', 'kota', 'ort. sn']) {
  assert.ok(t.includes(s), `sütun başlığı yok: ${s}`);
}

// index.html entegrasyonu
const sayfa = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(sayfa.includes('id="kapi-uretim"'), 'kapi-uretim bölümü yok');
assert.ok(
  sayfa.indexOf('id="kapi-uretim"') > sayfa.indexOf('id="gorev-modelleri"'),
  'kapi-uretim gorev-modelleri sonrası gelmeli',
);
assert.ok(sayfa.includes('kapiUretimHtml'), 'kapiUretimHtml içe aktarımı/çağrısı yok');
assert.ok(sayfa.includes('kapiUretimHtml(d.kapiUretim)'), 'kapiUretimHtml çağrısı yok');
assert.ok(sayfa.includes("const kapiUretimEl = document.getElementById('kapi-uretim');"), 'kapiUretimEl tanımı yok');
assert.ok(sayfa.includes('.rozet.az-ornek'), 'az-ornek CSS kuralı yok');

console.log('kapi-uretim-ui.test ok');
