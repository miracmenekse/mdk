import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gelistirmeHtml, kpiHtml, akisTablosuHtml } from './ciz.mjs';

const plan = {
  kategoriler: [
    { ad: 'Eski <b>', adimlar: [{ no: 1, baslik: 'A', bitti: true }] },
    { ad: 'Epic 21 — Yeni', no: '21', adimlar: [{ no: 2, baslik: 'B', bitti: true }, { no: 3, baslik: 'C', bitti: false }] },
    { ad: 'Epic 22 — Müşteri', no: '22', adimlar: [] },
  ],
};

const epikler = [
  { ad: 'Eski <b>', no: null, statu: 'tamamlandi' },
  { ad: 'Epic 21 — Yeni', no: '21', statu: 'gelistirme', tartisma: null, onay: false },
  { ad: 'Epic 22 — Müşteri', no: '22', statu: 'analiz', tartisma: { yol: 'epic/22', durum: 'bitti' }, onay: false },
];

function epicBolge(h, sira) {
  const i = h.indexOf(`data-epic="${sira}"`);
  if (i < 0) return '';
  const j = h.indexOf('data-epic="', i + 1);
  return j < 0 ? h.slice(i) : h.slice(i, j);
}

const h = gelistirmeHtml(plan, null, [], {}, [], epikler);

assert.equal((h.match(/class="epic-satir"/g) || []).length, 3, 'üç epic-satir olmalı');

const i2 = h.indexOf('data-epic="2"');
const i1 = h.indexOf('data-epic="1"');
const i0 = h.indexOf('data-epic="0"');
assert.ok(i2 >= 0 && i1 >= 0 && i0 >= 0, 'data-epic değerleri bulunmalı');
assert.ok(i2 < i1 && i1 < i0, 'sıra Epic 22, Epic 21, Eski olmalı');

const r2 = epicBolge(h, 2);
const r1 = epicBolge(h, 1);
const r0 = epicBolge(h, 0);

assert.ok(r2.includes('Analiz'), 'Epic 22 rozet Analiz');
assert.ok(r1.includes('Geliştirme'), 'Epic 21 rozet Geliştirme');
assert.ok(r0.includes('Tamamlandı'), 'Eski rozet Tamamlandı');

assert.ok(r1.includes('1 / 2'), 'Epic 21 ilerlemesi 1 / 2');

assert.ok(r2.includes('epic-detay uyari'), 'Epic 22 düğmesi uyari');
assert.ok(r2.includes('çözüm onayı bekliyor'), 'Epic 22 çözüm onayı bekliyor');
assert.ok(r2.includes('data-epic-no="22"'), 'Epic 22 data-epic-no');

assert.ok(!r0.includes('epic-detay'), 'no suz Eski de epic-detay yok');

assert.ok(r1.includes('data-adim="3"') && r1.includes('data-adim="2"'), 'Epic 21 data-adim 3 ve 2');
const p3 = r1.indexOf('data-adim="3"');
const p2 = r1.indexOf('data-adim="2"');
assert.ok(p3 >= 0 && p2 >= 0 && p3 < p2, 'Epic 21 de 3 önce');
assert.ok(r1.includes('Story'), 'Epic 21 başlıkta Story');

assert.ok(!h.includes('data-adim="1"'), 'Eski kapalı, data-adim 1 yok');

assert.ok(r2.includes('henüz story yok'), 'Epic 22 henüz story yok');

assert.ok(h.includes('Eski &lt;b&gt;'), 'ad kaçışlanmış');
assert.ok(!h.includes('Eski <b>'), 'ad ham etiket içermemeli');

assert.match(h, /data-epic="2"[^>]*aria-expanded="true"/, 'Epic 22 açık');
assert.match(h, /data-epic="1"[^>]*aria-expanded="true"/, 'Epic 21 açık');
assert.match(h, /data-epic="0"[^>]*aria-expanded="false"/, 'Eski kapalı');

const epiklerOnay = epikler.map((e) => (e.ad === 'Epic 22 — Müşteri' ? { ...e, onay: true } : e));
const hOnay = gelistirmeHtml(plan, null, [], {}, [], epiklerOnay);
assert.ok(!hOnay.includes('uyari'), 'onay true iken uyari yok');

const hEtki = gelistirmeHtml(plan, null, [], {}, [{ no: 3, bitti: false, onay: false }], epikler);
assert.ok(hEtki.includes('Detay · 1 story karar bekliyor'), 'etki ile story karar bekliyor');

const hBos = gelistirmeHtml(plan, null, [], {}, [], []);
assert.ok(epicBolge(hBos, 0).includes('Tamamlandı'), 'epikler boş: Eski Tamamlandı');
assert.ok(epicBolge(hBos, 1).includes('Geliştirme'), 'epikler boş: Epic 21 Geliştirme');
assert.ok(epicBolge(hBos, 2).includes('Analiz'), 'epikler boş: Epic 22 Analiz');

const hAcik = gelistirmeHtml(plan, null, [], {}, [], epikler, { 0: true, 1: false });
assert.ok(hAcik.includes('data-adim="1"'), 'acik 0 true ile data-adim 1 var');
assert.ok(!hAcik.includes('data-adim="3"'), 'acik 1 false ile data-adim 3 yok');

assert.equal(gelistirmeHtml(null), '<span class="bos">PLAN.md bulunamadı</span>', 'plan yok');

const kh = kpiHtml({ plan });
assert.ok(kh.includes('Geliştirme'), 'kpi adı Geliştirme');
assert.ok(kh.includes('biten story'), 'kpi alt yazısı biten story');
assert.ok(kh.includes('data-sekme="akis"'), 'kpi data-sekme akis');

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(html.includes('gelistirmeHtml('), 'index.html gelistirmeHtml');
assert.ok(html.includes('akisTablosuHtml'), 'index.html akisTablosuHtml');
assert.ok(html.includes('epic-satir'), 'index.html epic-satir');
assert.ok(html.includes("<h2>Epic'ler</h2>"), 'index.html Epic ler başlığı');

console.log('gelistirme.test ok');
