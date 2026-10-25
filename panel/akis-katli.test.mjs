// Kapı (adım 54): açık bölümler üstte, tamamı biten bölümler katlı. Kullanım: node panel/akis-katli.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planHtml } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const adim = (no, bitti) => ({ no, baslik: `Adım ${no}`, bitti, kapi: 'true', yurutucu: 'opencode' });
const plan = { ayarlar: {}, kategoriler: [
  { ad: 'Eski & bitmiş', adimlar: [adim(1, true), adim(2, true)] },
  { ad: 'Açık', adimlar: [adim(3, true), adim(4, false)] },
  { ad: 'Temiz', adimlar: [adim(5, true)] },
] };
// adım 2: 2. denemede geçti → sorunlu
const gecmis = [
  { no: 1, denemeler: [{ deneme: 1, gecti: true, model: 'x' }] },
  { no: 2, denemeler: [{ deneme: 1, gecti: false, model: 'x', neden: 'kapi' }, { deneme: 2, gecti: true, model: 'x' }] },
  { no: 5, denemeler: [{ deneme: 1, gecti: true, model: 'x' }] },
];
const kat = (h, ad) => {
  const bas = h.indexOf(`<details class="kat" data-kat="${ad}"`);
  if (bas < 0) return null;
  const son = h.indexOf('<details class="kat"', bas + 1);
  return h.slice(bas, son < 0 ? undefined : son).match(/^<details class="kat" data-kat="[^"]*" data-varsayilan="([01])"( open)?><summary>([\s\S]*?)<\/summary>([\s\S]*)$/);
};

let h = planHtml(plan, null, gecmis, {});
// sıra: açık bölüm önce, bitenler kendi sırasında sonra
const i = (s) => h.indexOf(s);
assert.ok(i('Adım 4') < i('data-kat="Eski &amp; bitmiş"') && i('data-kat="Eski &amp; bitmiş"') < i('data-kat="Temiz"'), 'Açık → Eski → Temiz');
assert.ok(h.includes('<h2>Açık</h2>') && !h.includes('data-kat="Açık"'), 'açık bölüm düz başlık');
const a = kat(h, 'Eski &amp; bitmiş');
assert.ok(a, 'biten bölüm details.kat içinde (ad kaçışlı): ' + h.slice(0, 400));
assert.equal(a[1], '0'); assert.equal(a[2], undefined, 'varsayılan kapalı (sorunlu adım olsa bile)');
assert.ok(duz(a[3]).includes('Eski & bitmiş') && duz(a[3]).includes('2/2 bitti') && duz(a[3]).includes('1 sorunlu'), duz(a[3]));
assert.ok(a[4].includes('<ul class="adimlar">') && a[4].includes('Adım 1') && a[4].includes('Adım 2'), 'içerik bugünkü liste');
assert.ok(a[4].includes('<details class="ayrinti" data-no="2" open>'), 'adım ayrıntısı davranışı değişmez (sorunlu açık)');
const t = kat(h, 'Temiz');
assert.ok(t && duz(t[3]).includes('1/1 bitti') && !duz(t[3]).includes('sorunlu'));
assert.ok(h.indexOf('id="hukum"') < i('Adım 4'), 'hüküm en üstte kalır');

// kullanıcı tercihi
assert.equal(kat(planHtml(plan, null, gecmis, {}, { 'kat:Eski & bitmiş': true }), 'Eski &amp; bitmiş')[2], ' open');
// sadece sorunlu: sorunlu adımı olan biten bölüm açık, diğeri kapalı
h = planHtml(plan, null, gecmis, {}, {}, { sadeceSorunlu: true });
assert.equal(kat(h, 'Eski &amp; bitmiş')[1], '1'); assert.equal(kat(h, 'Eski &amp; bitmiş')[2], ' open');
assert.equal(kat(h, 'Temiz')[2], undefined);
assert.equal(kat(planHtml(plan, null, gecmis, {}, { 'kat:Eski & bitmiş': false }, { sadeceSorunlu: true }), 'Eski &amp; bitmiş')[2], undefined, 'tercih varsayılanı ezer');
// geçmiş yokken de çalışır
assert.ok(kat(planHtml(plan, null), 'Temiz'));

// sayfa
const s = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(s.includes("details[data-kat]") && s.includes("'kat:'"), 'kat toggle tercihi acikTercih["kat:"+ad]');
assert.match(s, /planHtml\([^)]*acikTercih, \{ sadeceSorunlu \}\)/, 'planHtml secenek ile çağrılır');
const deg = s.slice(s.indexOf("e.target.id === 'sadece-sorunlu'"), s.indexOf("e.target.id === 'sadece-sorunlu'") + 200);
assert.match(deg, /planCiz\(\)/, 'kutu değişince plan yeniden çizilir (planCiz)');
assert.match(s, /function planCiz\(/);
console.log('akis-katli.test ok');
