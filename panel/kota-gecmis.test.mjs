// Kapı (adım 90): adım geçmişinde `kota` denemesi sessiz sayılır ve "kota doldu" diye ayrı yazılır. Kullanım: node panel/kota-gecmis.test.mjs
import assert from 'node:assert/strict';
import { planHtml, sorunluMu } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const satir = (html, baslik) => duz(html.split('<li').slice(1).find((r) => r.includes(baslik)));
const dnm = (o) => ({ yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, neden: null, sure_sn: 100, token: 5000, ...o });
const adim = (no, baslik) => ({ no, baslik, bitti: true, kapi: 'a', yurutucu: 'opencode', etki: null, deger: null });
const plan = { ayarlar: {}, kategoriler: [{ ad: 'K', adimlar: [adim(1, 'Kotalı'), adim(2, 'Sessiz'), adim(3, 'Yalnızkota')] }] };
const gecmis = [
  { no: 1, denemeler: [dnm({ model: 'go/q', gecti: false, neden: 'kota', sure_sn: 6 }), dnm({ model: 'go/w', deneme: 1, sure_sn: 222 })], commit: null, inceleme: null },
  { no: 2, denemeler: [dnm({ model: 'go/s', gecti: false, neden: 'yanit_yok' }), dnm({ model: 'go/w', sure_sn: 333 })], commit: null, inceleme: null },
  { no: 3, denemeler: [dnm({ model: 'go/q', gecti: false, neden: 'kota' }), dnm({ model: 'go/r', gecti: false, neden: 'kota' })], commit: null, inceleme: null },
];

// kota tek başına sorun değil (sessizlik gibi)
assert.equal(sorunluMu(gecmis[0], null), false, 'kota + 1. denemede geçiş sorunlu sayılmamalı');
assert.equal(sorunluMu(gecmis[2], null), false, 'yalnız kota sorunlu sayılmamalı');

const html = planHtml(plan, null, gecmis, {}, { 1: true, 2: true, 3: true });
const r1 = satir(html, 'Kotalı'), r2 = satir(html, 'Sessiz'), r3 = satir(html, 'Yalnızkota');
assert.match(r1, /1\. denemede geçti/);
assert.match(r1, /1 kota/, 'özet: kota sayısı ayrı');
assert.doesNotMatch(r1, /sessiz/, 'kota "sessiz" diye yazılmamalı');
assert.match(r1, /go\/q ○ kota doldu/, 'ayrıntı: kota satırı');
assert.doesNotMatch(r1, /go\/q ✕/, 'kota satırı başarısız deneme gibi çizilmemeli');
assert.match(r2, /1 sessiz/, 'yanit_yok yine sessiz');
assert.match(r2, /go\/s ○ sağlayıcı yanıt vermedi/);
assert.match(r3, /kota doldu \(2\)/, 'yalnız kota: özet');
console.log('kota-gecmis ok');
