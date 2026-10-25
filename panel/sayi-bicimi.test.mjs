// Kapı (adım 50): para tr-TR ondalığıyla, hüküm "ölçülen adım" der. Kullanım: node panel/sayi-bicimi.test.mjs
import assert from 'node:assert/strict';
import { kpiHtml, planHtml, claudeHtml } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const odenen = (m) => duz(kpiHtml({ telemetri: { var: true, toplam: { toplam: 1, maliyet: m } } })).match(/ödenen (\S+)/)[1];
assert.equal(odenen(21.76), '$21,76');
assert.equal(odenen(1234.5), '$1.234,50', 'binlik nokta, ondalık virgül');
assert.equal(odenen(1), '$1,00');
assert.equal(odenen(0.25), '$0,2500', '1 altı dört ondalık');
assert.equal(odenen(0), '$0');
const cl = claudeHtml({ var: true, ilk: '2026-10-01', son: '2026-10-02', modeller: [{ model: 'm', mesaj: 1, giris: 1, cikis: 1, cacheOkuma: 0, cacheYazma: 0, toplam: 2, maliyet: 5.02 }], toplam: { mesaj: 1, toplam: 2, ana: 2, altajan: 0, maliyet: 5.02, fiyatsiz: [] } });
assert.ok(duz(cl).includes('~$5,02') && !cl.includes('5.02'), 'Claude kartı da tr-TR');

const plan = { kategoriler: [{ ad: 'K', adimlar: [{ no: 1, baslik: 'a', bitti: true }, { no: 2, baslik: 'b', bitti: false }] }] };
const gecmis = [{ no: 1, denemeler: [{ deneme: 1, gecti: true, model: 'x' }] }, { no: 2, denemeler: [] }];
const h = duz(planHtml(plan, null, gecmis, {}));
assert.ok(h.includes('1 ölçülen adım:'), h.slice(0, 120));
console.log('sayi-bicimi.test ok');
