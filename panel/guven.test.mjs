// Kapı: güven etiketli sayılar. Kullanım: node panel/guven.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { snapshot } from './durum.mjs';
import { modellerHtml } from './ciz.mjs';

const d = mkdtempSync(join(tmpdir(), 'guven-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const satir = (o) => JSON.stringify({ ts: 1, adim: 1, yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, sure_sn: 10, token: 100, maliyet: 0, ...o });
const bul = (s, model) => s.modeller.find((m) => m.model === model);
const yaz = (satirlar) => writeFileSync(join(d, 'metrikler.jsonl'), satirlar.join('\n') + '\n');

yaz([
  // olculdu: tüm satırlar sayısal süre ve token
  satir({ model: 'olc' }), satir({ model: 'olc', adim: 2, sure_sn: 30, token: 300 }),
  // sessiz: yalnız yanit_yok satırları: model başarısızlığı sayılmaz, veri yok
  satir({ model: 'ses', gecti: false, sure_sn: 900, token: 0, neden: 'yanit_yok' }),
  satir({ model: 'ses', adim: 2, gecti: false, sure_sn: 900, token: 0, neden: 'yanit_yok' }),
  // karma: gerçek denemeler + sessiz satır; sessiz satır hiçbir istatistiğe girmez
  satir({ model: 'kar', sure_sn: 20, token: 200 }),
  satir({ model: 'kar', adim: 2, gecti: false, sure_sn: 40, token: 400 }),
  satir({ model: 'kar', adim: 3, gecti: false, sure_sn: 900, token: 0, neden: 'yanit_yok' }),
  // kismi: bir satırda süre/token yok (null): ortalama yalnız ölçülenlerden, 0 sayılmaz
  satir({ model: 'kis', sure_sn: 60, token: 600 }),
  satir({ model: 'kis', adim: 2, sure_sn: null, token: null }),
  // tahmin: bir satır tahmini:true
  satir({ model: 'tah', sure_sn: 122, token: 22949, tahmini: true }),
  // veri-yok: gerçek deneme var ama süre/token hiç ölçülmemiş
  satir({ model: 'yok', sure_sn: null, token: null }),
  satir({ model: 'yok', adim: 2, sure_sn: null, token: null }),
]);
const s = snapshot(d);

let m = bul(s, 'olc');
assert.equal(m.etiket, 'olculdu');
assert.equal(m.sessiz, 0);
assert.equal(m.ortSure, 20);
assert.equal(m.token, 400);

m = bul(s, 'ses');
assert.equal(m.etiket, 'veri-yok');
assert.equal(m.sessiz, 2);
assert.equal(m.deneme, 0, 'sessizlik deneme sayılmaz');
assert.equal(m.gecen, 0);
assert.equal(m.ilkDenemeOrani, null, 'gerçek deneme yoksa oran 0 değil null');
assert.equal(m.ortSure, null);
assert.equal(m.token, null);

m = bul(s, 'kar');
assert.equal(m.sessiz, 1);
assert.equal(m.deneme, 2, 'yanit_yok deneme sayılmaz');
assert.equal(m.ilkDenemeOrani, 0.5);
assert.equal(m.ortSure, 30, 'ortalama yalnız gerçek denemelerden (20 ve 40)');
assert.equal(m.token, 600);
assert.equal(m.etiket, 'olculdu');

m = bul(s, 'kis');
assert.equal(m.etiket, 'kismi');
assert.equal(m.ortSure, 60, 'null süre 0 sayılıp ortalamayı bozmamalı');
assert.equal(m.token, 600);
assert.equal(m.deneme, 2);

assert.equal(bul(s, 'tah').etiket, 'tahmin');

m = bul(s, 'yok');
assert.equal(m.etiket, 'veri-yok');
assert.equal(m.ortSure, null);
assert.equal(m.token, null);
assert.equal(m.deneme, 2, 'gerçek denemeler sayılır, yalnız süre/token yok');

// çizim: etiket, sessiz notu, null → —
const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const hepsi = modellerHtml(s.modeller);
for (const e of ['olculdu', 'veri-yok', 'kismi', 'tahmin']) assert.ok(hepsi.includes(`guven ${e}`), `guven ${e} sınıfı yok`);
const tek = (model) => modellerHtml([bul(s, model)]);
assert.ok(duz(tek('ses')).includes('2 sessiz'), '"2 sessiz" notu yok');
assert.ok(!/0\.0 sn|\b0%/.test(duz(tek('ses'))), 'sessiz model 0%/0.0 sn göstermemeli');
assert.ok((duz(tek('ses')).match(/—/g) || []).length >= 3, 'oran, token, süre için — beklenir');
assert.ok(!duz(tek('olc')).includes('sessiz'), 'sessiz yoksa not yok');
assert.match(duz(tek('olc')), /ölçüldü/);
assert.match(duz(tek('yok')), /veri yok/);
assert.match(duz(tek('kis')), /kısmi/);
assert.match(duz(tek('tah')), /tahmin/);
// eski biçim (etiket/sessiz alanı yok) çökmemeli
assert.doesNotThrow(() => modellerHtml([{ yurutucu: 'opencode', model: 'eski', deneme: 1, gecen: 1, ilkDenemeOrani: 1, token: 5, maliyet: 0, ortSure: 1, uyum: null }]));
assert.ok(!hepsi.includes('undefined') && !hepsi.includes('NaN') && !hepsi.includes('null'));
// etiket metni kaçışlanır
assert.ok(!modellerHtml([{ ...bul(s, 'olc'), model: '<b>x</b>' }]).includes('<b>x</b>'));

// stil: dört etiket için CSS kuralı panelde var
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
for (const e of ['olculdu', 'veri-yok', 'kismi', 'tahmin']) assert.ok(html.includes(`.guven.${e}`), `index.html: .guven.${e} kuralı yok`);

// gerçek proje verisi: kota sessizliği satırları (adım 9) artık model hatası sayılmaz
const gercek = snapshot(join(dirname(fileURLToPath(import.meta.url)), '..'));
assert.ok(gercek.modeller.some((x) => x.sessiz > 0), 'gerçek metriklerde sessiz satırlar sayılmalı');
assert.ok(gercek.modeller.every((x) => ['olculdu', 'kismi', 'tahmin', 'veri-yok'].includes(x.etiket)));
console.log('guven.test ok');
