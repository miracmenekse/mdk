// Kapı: adım geçmişinde güven (sessizlik ayrı, eksik veri —, gerçek yürütücü). Kullanım: node panel/gecmis-guven.test.mjs
import assert from 'node:assert/strict';
import { planHtml, sorunluMu } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const satir = (html, baslik) => html.split('<li').slice(1).find((r) => r.includes(baslik));
const dnm = (o) => ({ yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, neden: null, sure_sn: 100, token: 5000, ...o });
const sessiz = (model) => dnm({ model, gecti: false, neden: 'yanit_yok', sure_sn: 62, token: 0 });
const adim = (no, baslik, yurutucu = 'opencode') => ({ no, baslik, bitti: true, kapi: 'k', yurutucu, etki: null, deger: null });

const plan = { ayarlar: {}, kategoriler: [{ ad: 'K', adimlar: [
  adim(1, 'Devralınan'), adim(2, 'Yalnız sessiz'), adim(3, 'Eksik veri'), adim(4, 'Aynı yürütücü'), adim(5, 'Geçmişsiz'), adim(6, 'Hiç geçmeyen'),
] }] };
const gecmis = [
  { no: 1, denemeler: [sessiz('m/bir'), sessiz('m/iki'), sessiz('m/uc'), dnm({ yurutucu: 'kodcu', model: 'kodcu', sure_sn: 157, token: 52362 })], commit: null, inceleme: null },
  { no: 2, denemeler: [sessiz('m/bir'), sessiz('m/iki')], commit: null, inceleme: null },
  { no: 3, denemeler: [dnm({ gecti: false, neden: 'kapi', sure_sn: null, token: null }), dnm({ deneme: 2, sure_sn: null, token: null })], commit: null, inceleme: null },
  { no: 4, denemeler: [dnm({})], commit: null, inceleme: null },
  { no: 6, denemeler: [dnm({ gecti: false, neden: 'kapi' })], commit: null, inceleme: null },
];
const html = planHtml(plan, null, gecmis, {});

// 1) gerçek yürütücü: işi yapan kodcu, planda opencode yazıyor
const r1 = satir(html, 'Devralınan');
assert.ok(duz(r1).includes('kodcu (plan: opencode)'), 'devralınan adımda gerçek yürütücü ve plan birlikte yazılmalı');
assert.ok(!satir(html, 'Aynı yürütücü').includes('(plan:'), 'yürütücü aynıysa plan notu yok');
assert.ok(duz(satir(html, 'Aynı yürütücü')).includes('opencode'));
assert.ok(duz(satir(html, 'Geçmişsiz')).includes('opencode') && !satir(html, 'Geçmişsiz').includes('(plan:'), 'geçmişi olmayan adım planın yürütücüsünü yazar');
assert.ok(duz(satir(html, 'Hiç geçmeyen')).includes('opencode') && !satir(html, 'Hiç geçmeyen').includes('(plan:'), 'hiç geçmeyen adımda işi yapan yok: planın yürütücüsü');

// 2) sessizlik: özet satırında ayrı sayı, başarısızlık gibi görünmez
assert.ok(duz(r1).includes('1. denemede geçti') && duz(r1).includes('3 sessiz'), 'özette "3 sessiz" olmalı');
assert.ok(!duz(r1).includes('geçmedi'));
const sessizSatirlar = r1.split('<div class="deneme').slice(1).filter((x) => x.includes('m/bir') || x.includes('m/iki') || x.includes('m/uc'));
assert.equal(sessizSatirlar.length, 3);
for (const s of sessizSatirlar) {
  const t = duz(s);
  assert.ok(t.includes('sağlayıcı yanıt vermedi'), `sessiz satır açıklaması yok: ${t}`);
  assert.ok(!t.includes('✕') && !t.includes('62 sn') && !t.includes('0 token'), `sessiz satırda ✕/süre/token olmamalı: ${t}`);
}
assert.match(duz(r1), /157 sn · 52[.\s ]?362 token/, 'gerçek deneme süre ve token yazar');
assert.ok(!r1.includes('class="deneme sessiz"') || r1.includes('sessiz'), 'sessiz satıra sınıf verilebilir');

// 3) yalnız sessiz: "geçmedi" değil; sorunlu sayılmaz
const r2 = satir(html, 'Yalnız sessiz');
assert.ok(duz(r2).includes('sağlayıcı sessiz (2)'), 'yalnız sessiz adımın özeti');
assert.ok(!duz(r2).includes('geçmedi'));
assert.ok(r2.includes('data-sorunlu="0"'), 'yalnız sessizlik sorun sayılmaz');
assert.ok(!/<details[^>]*\sopen/.test(r2));

// 4) eksik süre/token: 0 değil —
const r3 = satir(html, 'Eksik veri');
assert.ok(duz(r3).includes('— sn · — token'), `eksik veri — yazmalı: ${duz(r3)}`);
assert.ok(!/\b0 token|\b0 sn/.test(duz(r3)));

// 5) sorunluMu: sessiz denemeler sayılmaz
assert.equal(sorunluMu({ denemeler: [sessiz('a'), dnm({})] }, null), false, 'sessiz + ilk denemede geçti: sorunsuz');
assert.equal(sorunluMu({ denemeler: [sessiz('a'), dnm({ gecti: false, neden: 'kapi' }), dnm({ deneme: 2 })] }, null), true, 'gerçek başarısızlık sorunlu');
assert.equal(sorunluMu({ denemeler: [sessiz('a'), sessiz('b')] }, null), false, 'yalnız sessiz: sorun değil');
assert.equal(sorunluMu({ denemeler: [dnm({ gecti: false, neden: 'kapi' })] }, null), true, 'hiç geçmeyen gerçek deneme hâlâ sorunlu');

// 6) güvenlik: model/yürütücü kaçışlanır
const kotu = planHtml(plan, null, [{ no: 1, denemeler: [sessiz('<b>x</b>'), dnm({ yurutucu: '<i>y</i>' })], commit: null, inceleme: null }], {});
assert.ok(!kotu.includes('<b>x</b>') && !kotu.includes('<i>y</i>'));
console.log('gecmis-guven.test ok');
