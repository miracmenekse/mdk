import assert from 'node:assert/strict';
import { planHtml, sorunluMu, SORUNLU_INCELEMELER } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const satir = (html, baslik) => html.split('<li').slice(1).find((r) => r.includes(baslik));
const dnm = (o) => ({ yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, neden: null, sure_sn: 100, token: 5000, ...o });
const commit = (sha, mesaj, e, s, dosya = 1) => ({ sha, mesaj, tarih: '2026-10-17T11:00:00+03:00', dosya, eklenen: e, silinen: s });
const adim = (no, baslik, bitti = true) => ({ no, baslik, bitti, kapi: 'a', yurutucu: 'opencode', etki: null, deger: null });

const plan = { ayarlar: {}, kategoriler: [{ ad: 'K', adimlar: [adim(1, 'Birinci'), adim(2, 'İkinci'), adim(3, 'Üçüncü'), adim(4, 'Dördüncü', false), adim(5, 'Beşinci', false)] }] };
const gecmis = [
  { no: 1, denemeler: [dnm({})], commit: commit('0c3a930', 'adım 1: PLAN.md ayrıştırıcı', 69, 0), inceleme: { inceleme: 'uyumlu', not: 'iyi' } },
  { no: 2, denemeler: [dnm({ gecti: false, neden: 'kapi', sure_sn: 82 }), dnm({ deneme: 2, sure_sn: 123 })], commit: commit('5ab12cd', 'adım 2: Arayüz', 142, 3, 2), inceleme: { inceleme: 'kismen', not: 'durum etiketi <çevrilmemiş>' } },
  { no: 3, denemeler: [dnm({})], commit: commit('9fe01aa', 'adım 3: Etki <script>x</script>', 132, 2), inceleme: null },
  { no: 5, denemeler: [dnm({ gecti: false, neden: 'butce' }), dnm({ deneme: 2, gecti: false, neden: 'sure' })], commit: null, inceleme: null },
];
const incelemeler = { 1: { inceleme: 'uyumlu', not: 'iyi' }, 2: { inceleme: 'kismen', not: 'durum etiketi <çevrilmemiş>' } };

const html = planHtml(plan, null, gecmis, incelemeler);

// hüküm cümlesi ve süzgeç
assert.ok(html.includes('id="hukum"'));
assert.ok(duz(html).includes('4 adım: 1 uyumlu, 1 kısmen, 0 uyumsuz, 2 incelenmedi · 2 ilk denemede geçti'), duz(html).slice(0, 300));
assert.ok(html.includes('id="sadece-sorunlu"') && /type="checkbox"/.test(html));

// sorunsuz adım: özet var, ayrıntı kapalı
const r1 = satir(html, 'Birinci');
assert.ok(duz(r1).includes('1. denemede geçti') && duz(r1).includes('uyumlu') && duz(r1).includes('0c3a930'));
assert.match(duz(r1), /\+69\/[−-]0/);
assert.ok(r1.includes('<details') && !/<details[^>]*\sopen/.test(r1), 'sorunsuz adımın ayrıntısı kapalı olmalı');

// sorunlu adım: açık; tüm denemeler, neden, commit, not görünür; kaçışlanmış
const r2 = satir(html, 'İkinci');
assert.ok(/<details[^>]*\sopen/.test(r2), 'sorunlu adımın ayrıntısı açık gelmeli');
assert.ok(duz(r2).includes('2. denemede geçti') && duz(r2).includes('kısmen') && duz(r2).includes('5ab12cd'));
assert.match(duz(r2), /\+142\/[−-]3/);
assert.ok(duz(r2).includes('✕') && duz(r2).includes('✓') && duz(r2).includes('kapi') && duz(r2).includes('a/x'), 'başarısız deneme dahil hepsi görünmeli');
assert.ok(duz(r2).includes('adım 2: Arayüz'));
assert.ok(r2.includes('&lt;çevrilmemiş&gt;') && !r2.includes('<çevrilmemiş>'), 'inceleme notu kaçışlanmalı');

// incelenmemiş adım asla "uyumlu" görünmez
const r3 = satir(html, 'Üçüncü');
assert.ok(duz(r3).includes('incelenmedi') && !duz(r3).includes('uyumlu'));
assert.ok(r3.includes('&lt;script&gt;') && !r3.includes('<script>'), 'commit mesajı kaçışlanmalı');
assert.ok(!/<details[^>]*\sopen/.test(r3));

// geçmişi olmayan adım: özet/ayrıntı yok; hiç geçmeyen adım: açık
assert.ok(!satir(html, 'Dördüncü').includes('<details'));
const r5 = satir(html, 'Beşinci');
assert.ok(duz(r5).includes('geçmedi (2 deneme)') && /<details[^>]*\sopen/.test(r5));

// geriye uyumluluk: geçmiş verilmezse çalışır, hüküm yazmaz
assert.ok(!planHtml(plan, null).includes('id="hukum"'));

// sorunluMu: tek sabit, testli eşik
assert.deepEqual(SORUNLU_INCELEMELER, ['kismen', 'uyumsuz']);
const g1 = { denemeler: [dnm({})] };
const g2 = { denemeler: [dnm({ gecti: false }), dnm({ deneme: 2 })] };
const g0 = { denemeler: [dnm({ gecti: false })] };
assert.equal(sorunluMu(g1, { inceleme: 'uyumlu' }), false);
assert.equal(sorunluMu(g1, null), false);
assert.equal(sorunluMu(g2, { inceleme: 'uyumlu' }), true);
assert.equal(sorunluMu(g0, null), true);
assert.equal(sorunluMu(g1, { inceleme: 'kismen' }), true);
assert.equal(sorunluMu(g1, { inceleme: 'uyumsuz' }), true);
console.log('gecmis-ui.test ok');
