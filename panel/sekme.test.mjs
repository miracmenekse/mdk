// Kapı: KPI şeridi ve sekmeler. Kullanım: node panel/sekme.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kpiHtml } from './ciz.mjs';
import { baslat } from './sunucu.mjs';

const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const dnm = (o) => ({ yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, neden: null, sure_sn: 10, token: 100, ...o });
const adim = (no, bitti) => ({ no, baslik: 'A' + no, bitti, kapi: 'k', yurutucu: 'opencode', etki: null, deger: null });
const snap = {
  plan: { ayarlar: {}, kategoriler: [{ ad: 'K', adimlar: [adim(1, true), adim(2, true), adim(3, false)] }] },
  gecmis: [
    { no: 1, denemeler: [dnm({})] },
    { no: 2, denemeler: [dnm({ gecti: false, neden: 'yanit_yok' }), dnm({ gecti: false, neden: 'kapi' }), dnm({ deneme: 2 })] },
  ],
  modeller: [{ token: 300, maliyet: 0.5 }, { token: null, maliyet: 0 }],
  telemetri: { var: true, modeller: [], toplam: { toplam: 4100000, maliyet: 1 }, tasarruf: null },
};
let h = kpiHtml(snap);
for (const id of ['kpi-biten', 'kpi-ilk', 'kpi-token', 'kpi-odenen']) assert.ok(h.includes(`id="${id}"`), `#${id} yok`);
let t = duz(h);
assert.ok(t.includes('2 / 3'), 'biten / toplam adım');
assert.ok(/%\s?50/.test(t), 'ilk denemede geçme: 2 metrikli adımın 1\'i (sessiz deneme sayılmaz, 2. adım 2. denemede geçti)');
assert.ok(t.includes('4,1 M') && t.includes('gerçek token'), 'veritabanı varsa gerçek token, M biçiminde');
assert.match(t, /\$1[.,]00/);
// veritabanı yoksa çalıştırıcı ölçümü ve etiket değişir
t = duz(kpiHtml({ ...snap, telemetri: { var: false, modeller: [], toplam: null, tasarruf: null } }));
assert.ok(t.includes('ölçülen token') && /\b400\b/.test(t) && !t.includes('gerçek token'), 'null token toplama girmez');
assert.match(t, /\$0[.,]50/);
// boş / eksik veri çökmez, 0 yerine —
t = duz(kpiHtml(null));
assert.ok(t.includes('—') && !t.includes('NaN') && !t.includes('undefined'));
t = duz(kpiHtml({ plan: snap.plan, gecmis: [], modeller: [], telemetri: null }));
assert.ok(t.includes('0 / 3') && t.includes('—'));
assert.ok(!kpiHtml({ ...snap, plan: { ayarlar: {}, kategoriler: [{ ad: 'K', adimlar: [{ ...adim(1, true), no: '<b>1</b>' }] }] } }).includes('<b>'));

// sayfa: sekmeler
const p = mkdtempSync(join(tmpdir(), 'sekme-'));
writeFileSync(join(p, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const s = await baslat(p, 0);
const sayfa = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
await s.kapat();
assert.ok(sayfa.includes('id="kpi"') && sayfa.includes('kpiHtml'));
assert.ok(sayfa.includes('role="tablist"'));
const sekmeler = ['akis', 'modeller', 'etki', 'arastirma'];
for (const k of sekmeler) {
  assert.ok(new RegExp(`role="tab"[^>]*data-sekme="${k}"|data-sekme="${k}"[^>]*role="tab"`).test(sayfa), `${k} sekme düğmesi yok`);
  assert.ok(sayfa.includes(`role="tabpanel"`) && sayfa.includes(`id="sekme-${k}"`), `${k} paneli yok`);
}
const panel = (k) => { const i = sayfa.indexOf(`id="sekme-${k}"`); const sonraki = sayfa.indexOf('role="tabpanel"', i + 10); return sayfa.slice(i, sonraki > 0 ? sonraki : sayfa.indexOf('</main>')); };
for (const id of ['simdi', 'kategoriler']) assert.ok(panel('akis').includes(`id="${id}"`), `${id} Akış sekmesinde`);
for (const id of ['modeller', 'telemetri', 'matris']) assert.ok(panel('modeller').includes(`id="${id}"`), `${id} Modeller sekmesinde`);
assert.ok(panel('etki').includes('id="etki"'));
assert.ok(panel('arastirma').includes('id="arastirma"'));
assert.ok(sayfa.includes('location.hash'), 'seçili sekme adreste saklanmalı');
assert.ok(sayfa.includes('aria-selected'), 'erişilebilirlik: aria-selected');
assert.ok(/\.kpi/.test(sayfa) && /@media[^{]*max-width/.test(sayfa), 'KPI stili ve dar ekran kuralı');
console.log('sekme.test ok');
