import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { kararSeridiHtml } from './ciz.mjs';

// boş etki: şerit yok
assert.equal(kararSeridiHtml([]), '');

// yalnız bitti/onay kayıtları: şerit yok
assert.equal(kararSeridiHtml([{ no: 1, baslik: 'X', bitti: true, onay: false, figma: null }]), '');
assert.equal(kararSeridiHtml([{ no: 2, baslik: 'Y', bitti: false, onay: true, figma: null }]), '');
assert.equal(kararSeridiHtml([
  { no: 3, baslik: 'Z', bitti: true, onay: false, figma: null },
  { no: 4, baslik: 'W', bitti: false, onay: true, figma: null },
]), '');

// iki bekleyen: sayı, ilk bekleyen (en küçük no), taslak onayı, kaçışlı başlık
const h = kararSeridiHtml([
  { no: 131, baslik: 'B', bitti: false, onay: false, figma: null },
  { no: 129, baslik: 'A <x>', bitti: false, onay: false, figma: null },
]);
assert.match(h, /<button type="button" class="karar-seridi"/);
assert.match(h, /data-adim="129"/);
assert.ok(h.includes('2 adım karar bekliyor'), 'bekleyen sayısı');
assert.ok(h.includes('taslak onayı'), 'taslak onayı');
assert.ok(h.includes('A &lt;x&gt;'), 'başlık kaçışlı');
assert.ok(!h.includes('<x>'), 'ham etiket yok');
assert.ok(!h.includes('\n'), 'tek satır');

// ilk bekleyende figma doluysa adım onayı, taslak onayı yok
const h2 = kararSeridiHtml([
  { no: 131, baslik: 'B', bitti: false, onay: false, figma: null },
  { no: 129, baslik: 'A <x>', bitti: false, onay: false, figma: 'https://www.figma.com/design/k' },
]);
assert.ok(h2.includes('adım onayı'), 'adım onayı');
assert.ok(!h2.includes('taslak onayı'), 'taslak onayı yok');

// panel/index.html: işlev adı ve karar şeridi öğesi kpi'den sonra
const idx = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(idx.includes('kararSeridiHtml'), 'index.html işlev adını içerir');
const iKpi = idx.indexOf('id="kpi"');
const iSerit = idx.indexOf('id="karar-seridi"');
assert.ok(iKpi >= 0 && iSerit > iKpi, 'karar-seridi kpi sonrası');

console.log('karar-seridi.test ok');
