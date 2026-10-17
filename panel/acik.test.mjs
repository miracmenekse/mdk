import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planHtml } from './ciz.mjs';

// Kullanıcının elle açıp kapattığı <details>, canlı güncellemede varsayılana dönmesin:
// planHtml'in 5. parametresi { [adımNo]: true|false } varsayılanı ezer.
const adim = (no, baslik) => ({ no, baslik, bitti: true, kapi: 'a', kapilar: ['a'], yurutucu: 'opencode', etki: null, deger: null });
const plan = { ayarlar: {}, kategoriler: [{ ad: 'K', adimlar: [adim(1, 'Sorunsuz'), adim(2, 'Sorunlu')] }] };
const dnm = (o) => ({ yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, neden: null, sure_sn: 1, token: 1, ...o });
const gecmis = [
  { no: 1, denemeler: [dnm({})], commit: null, inceleme: null },
  { no: 2, denemeler: [dnm({ gecti: false }), dnm({ deneme: 2 })], commit: null, inceleme: null },
];
const satir = (h, b) => h.split('<li').slice(1).find((r) => r.includes(b));
const acikMi = (r) => /<details[^>]*\sopen/.test(r);

let h = planHtml(plan, null, gecmis, {});
assert.ok(!acikMi(satir(h, 'Sorunsuz')) && acikMi(satir(h, 'Sorunlu')), 'varsayılan: yalnız sorunlu açık');

h = planHtml(plan, null, gecmis, {}, { 1: true, 2: false });
assert.ok(acikMi(satir(h, 'Sorunsuz')), 'kullanıcı açtıysa açık kalmalı');
assert.ok(!acikMi(satir(h, 'Sorunlu')), 'kullanıcı kapattıysa sorunlu bile kapalı kalmalı');

h = planHtml(plan, null, gecmis, {}, {});
assert.ok(acikMi(satir(h, 'Sorunlu')), 'boş tercih nesnesi varsayılanı bozmamalı');
assert.ok(satir(h, 'Sorunlu').includes('data-no="2"') || /<details[^>]*data-no="2"/.test(satir(h, 'Sorunlu')), '<details> adım numarasını data-no ile taşımalı');

// index.html tercihleri toggle olayından toplayıp planHtml'e vermeli
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(/toggle/.test(html), 'index.html toggle olayını dinlemeli');
assert.ok(/planHtml\([^)]*,[^)]*,[^)]*,[^)]*,[^)]+\)/.test(html), 'planHtml 5 argümanla çağrılmalı');
console.log('acik.test ok');
