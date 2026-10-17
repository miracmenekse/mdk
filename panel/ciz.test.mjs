import assert from 'node:assert/strict';
import { suAnHtml, planHtml, modellerHtml, etkiHtml } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const t0 = Date.parse('2026-10-17T10:00:00Z');

// "Şu an" kartı: boşta
assert.match(duz(suAnHtml(null, t0)), /boşta/);

// (1) etiket ile değer yapışık olmamalı ("adımEtki sekmesi" hatası)
const calisiyor = { adim: 7, baslik: 'Etki sekmesi', model: 'a/x', deneme: 2, durum: 'calisiyor', ts: t0 };
let h = suAnHtml(calisiyor, t0 + 75_000);
assert.ok(!/(adım|model|deneme|durum|geçen süre)\s*<b/.test(h), 'etiket ve değer arasında ayrı öğe/satır olmalı');
for (const s of ['Etki sekmesi', 'a/x', 'çalışıyor']) assert.ok(duz(h).includes(s), `${s} yok`);

// (3) süre sayacı yalnızca çalışırken: geçen süre + id="sure"
assert.ok(duz(h).includes('1 dk 15 sn'));
assert.ok(h.includes('id="sure"'));

// (2) durum etiketi Türkçe, ham 'gecti' görünmez; (3) bitince sayaç yok, bitiş saati var
h = suAnHtml({ ...calisiyor, durum: 'gecti' }, t0 + 999_999);
assert.ok(duz(h).includes('geçti'));
assert.ok(!duz(h).includes('gecti'));
assert.ok(!h.includes('id="sure"'), 'bitmiş işte sayaç olmamalı');
assert.ok(!duz(h).includes('geçen süre'));
assert.match(duz(h), /bitiş/);
assert.match(duz(h), /\d\d:\d\d:\d\d/);
assert.ok(duz(suAnHtml({ ...calisiyor, durum: 'eskale' }, t0)).includes('eskale'));

// (4) rozetler
const plan = { ayarlar: {}, kategoriler: [{ ad: 'K', adimlar: [
  { no: 1, baslik: 'Birinci', bitti: true, kapi: 'a', yurutucu: 'opencode', etki: null, deger: null },
  { no: 2, baslik: 'İkinci', bitti: false, kapi: 'a', yurutucu: 'opencode', etki: null, deger: null },
  { no: 3, baslik: 'Üçüncü', bitti: false, kapi: 'a', yurutucu: 'claude', etki: null, deger: null },
  { no: 4, baslik: 'Dördüncü', bitti: false, kapi: 'a', yurutucu: 'opencode', etki: null, deger: null },
  { no: 5, baslik: '<b>kaçış</b>', bitti: false, kapi: 'a', yurutucu: 'opencode', etki: null, deger: null },
] }] };
const satir = (html, baslik) => html.split('<li').slice(1).find((r) => r.includes(baslik));

let p = planHtml(plan, null);
assert.ok(duz(satir(p, 'Birinci')).includes('bitti'));
assert.ok(duz(satir(p, 'İkinci')).includes('bekliyor'));
const uc = duz(satir(p, 'Üçüncü'));
assert.ok(uc.includes('bekliyor') && uc.includes('claude'), 'opencode olmayan bekleyen adım: bekliyor + yürütücü adı');
assert.ok(!duz(p).includes('eskale'), 'eskale yokken hiçbir satırda eskale yazmamalı');
assert.ok(p.includes('&lt;b&gt;'), 'başlık HTML olarak kaçışlanmalı');
assert.ok(!p.includes('<b>kaçış</b>'));

p = planHtml(plan, { adim: 4, durum: 'eskale', ts: t0 });
assert.ok(duz(satir(p, 'Dördüncü')).includes('eskale'));
assert.ok(!duz(satir(p, 'İkinci')).includes('eskale'));
assert.ok(!duz(satir(p, 'Üçüncü')).includes('eskale'));

p = planHtml(plan, { adim: 2, durum: 'calisiyor', ts: t0 });
assert.ok(duz(satir(p, 'İkinci')).includes('çalışıyor'));

// boş / eksik veri
assert.match(duz(planHtml(null, null)), /PLAN\.md bulunamadı/);
assert.match(duz(modellerHtml([])), /metrik yok/);
assert.match(duz(etkiHtml([])), /etki adımı yok/);

// model tablosu ve etki listesi çizilir
const mh = modellerHtml([{ yurutucu: 'opencode', model: 'a/x', deneme: 3, gecen: 2, ilkDenemeOrani: 0.5, token: 600, maliyet: 0, ortSure: 20, uyum: 0.5 }]);
assert.ok(duz(mh).includes('a/x') && duz(mh).includes('50%'));
const eh = etkiHtml([{ no: 1, baslik: 'Rapor', dosya: 'etki/r.html', deger: 5, tahmin: { token: 1000, maliyet: 0, guven: 'dusuk' } }]);
assert.ok(duz(eh).includes('Rapor') && duz(eh).includes('★★★★★'));
assert.ok(eh.includes('etki%2Fr.html'));
console.log('ciz.test ok');
