// Adım 134 kapısı: adimAsama(adim, simdi, etki) → { sinif, etiket, yuzde }
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { akisTablosuHtml, drawerHtml, adimAsama } from './ciz.mjs';

function chk(adim, simdi, etki, beklenen) {
  const r = adimAsama(adim, simdi, etki);
  assert.equal(r.sinif, beklenen.sinif, `sinif: ${JSON.stringify(adim)} ${JSON.stringify(simdi)}`);
  assert.equal(r.etiket, beklenen.etiket, `etiket: ${JSON.stringify(adim)} ${JSON.stringify(simdi)}`);
  assert.equal(r.yuzde, beklenen.yuzde, `yuzde: ${JSON.stringify(adim)} ${JSON.stringify(simdi)}`);
}

// 1) bitti
chk({ no: 5, bitti: true }, undefined, undefined, { sinif: 'bitti', etiket: 'bitti', yuzde: 100 });

// 2) simdi current durumları
const a5 = { no: 5, bitti: false };
chk(a5, { adim: 5, durum: 'regresyon' }, undefined, { sinif: 'calisiyor', etiket: 'ön regresyon', yuzde: 45 });
chk(a5, { adim: 5, durum: 'persona' }, undefined, { sinif: 'calisiyor', etiket: 'persona turu', yuzde: 40 });
chk(a5, { adim: 5, durum: 'kapi_yaziliyor' }, undefined, { sinif: 'calisiyor', etiket: 'kapı yazılıyor', yuzde: 55 });
chk(a5, { adim: 5, durum: 'calisiyor' }, undefined, { sinif: 'calisiyor', etiket: 'kod yazılıyor', yuzde: 75 });
chk(a5, { adim: 5 }, undefined, { sinif: 'calisiyor', etiket: 'kod yazılıyor', yuzde: 75 });
chk(a5, { adim: 5, durum: 'gecti' }, undefined, { sinif: 'bitti', etiket: 'bitti', yuzde: 100 });
chk(a5, { adim: 5, durum: 'eskale' }, undefined, { sinif: 'eskale', etiket: 'eskale', yuzde: 100 });
chk(a5, { adim: 5, durum: 'kapi_hata' }, undefined, { sinif: 'hata', etiket: 'kapı üretilemedi', yuzde: 55 });
chk(a5, { adim: 5, durum: 'regresyon_kirmizi' }, undefined, { sinif: 'hata', etiket: 'ön regresyon kırmızı', yuzde: 45 });
chk(a5, { adim: 5, durum: 'ortam_hatasi' }, undefined, { sinif: 'hata', etiket: 'ortam hatası', yuzde: 75 });
chk(a5, { adim: 5, durum: 'saglayici' }, undefined, { sinif: 'hata', etiket: 'sağlayıcı yanıt vermiyor', yuzde: 75 });
chk(a5, { adim: 5, durum: 'kilit' }, undefined, { sinif: 'hata', etiket: 'modeller kilitli', yuzde: 75 });
chk(a5, { adim: 5, durum: 'bilinmeyen' }, undefined, { sinif: 'calisiyor', etiket: 'bilinmeyen', yuzde: 50 });

// 3) etki kuralları (simdi başka adımda)
const a1 = { no: 1, bitti: false };
chk(a1, { adim: 99 }, { onay: false, figma: null, karar: null }, { sinif: 'karar', etiket: 'taslak onayı bekliyor', yuzde: 10 } );
chk(a1, { adim: 99 }, { onay: false, figma: null, karar: { tur: 'onay' } }, { sinif: 'karar', etiket: 'Figma bekleniyor', yuzde: 20 });
chk(a1, { adim: 99 }, { onay: false, figma: 'https://www.figma.com/design/k', karar: { tur: 'onay' } }, { sinif: 'karar', etiket: 'adım onayı bekliyor', yuzde: 30 });
chk(a1, { adim: 99 }, { onay: true, figma: null, karar: null }, { sinif: 'bekliyor', etiket: 'sırada', yuzde: 35 });
chk(a1, { adim: 99 }, { onay: false, figma: null, karar: { tur: 'red' } }, { sinif: 'karar', etiket: 'taslak düzeltiliyor', yuzde: 10 });

// etki yok
chk(a1, { adim: 99 }, undefined, { sinif: 'bekliyor', etiket: 'sırada', yuzde: 0 });
chk(a1, { adim: 99 }, null, { sinif: 'bekliyor', etiket: 'sırada', yuzde: 0 });

// bitti simdi/etki'yi ezer
chk({ no: 2, bitti: true }, { adim: 2, durum: 'kapi_yaziliyor' }, { onay: true }, { sinif: 'bitti', etiket: 'bitti', yuzde: 100 });

// simdi etki'yi ezer
chk(a1, { adim: 1, durum: 'calisiyor' }, { onay: true }, { sinif: 'calisiyor', etiket: 'kod yazılıyor', yuzde: 75 });

// null/eksik girdiler hata vermez
assert.doesNotThrow(() => adimAsama(null, null, null));
assert.doesNotThrow(() => adimAsama({ no: 1 }, undefined));
const r1 = adimAsama({ no: 1 }, undefined);
assert.equal(r1.sinif, 'bekliyor');
assert.equal(r1.etiket, 'sırada');
assert.equal(r1.yuzde, 0);

// akisTablosuHtml
const plan = { kategoriler: [{ ad: 'K', adimlar: [
  { no: 1, baslik: 'Bir', bitti: false },
  { no: 2, baslik: 'Iki', bitti: false },
] }] };
const simdi = { adim: 1, durum: 'kapi_yaziliyor', model: 'm', deneme: 1 };
const etki = [{ no: 2, onay: false, figma: 'https://www.figma.com/design/k', karar: { tur: 'onay' } }];
const h = akisTablosuHtml(plan, simdi, [], {}, etki);

assert.ok(/data-adim="1"[\s\S]*?rozet calisiyor/.test(h), '1. adım calisiyor rozeti');
assert.ok(h.includes('kapı yazılıyor'), 'kapı yazılıyor etiketi');
assert.ok(h.includes('%55'), '%55');
assert.ok(h.includes('width:55%'), 'width:55%');
assert.ok(h.includes('m'), 'model m');
assert.ok(/data-adim="2"[\s\S]*?rozet karar/.test(h), '2. adım karar rozeti');
assert.ok(h.includes('adım onayı bekliyor'), 'adım onayı bekliyor etiketi');
assert.ok(h.includes('%30'), '%30');

// etki parametresi verilmeden eski çağrı çökmez
const h0 = akisTablosuHtml(plan, simdi, [], {});
assert.equal(typeof h0, 'string');

// drawerHtml
const dh = drawerHtml({ no: 3, baslik: 'x', sinif: 'hata', etiket: 'kapı üretilemedi', yuzde: 55 }, null);
assert.ok(dh.includes('rozet hata'), 'rozet hata');
assert.ok(dh.includes('kapı üretilemedi'), 'etiket metni');

// index.html
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(html.includes('adimAsama('), 'index.html adimAsama import/kullanım');
assert.ok(html.includes('.rozet.karar'), 'index.html .rozet.karar CSS');

console.log('adim-asama.test ok');
