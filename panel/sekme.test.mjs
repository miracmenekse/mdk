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
// KPI kartları = sekmeler (role=tab + data-sekme); eski metrik kutuları (biten/ilk/token/ödenen)
// artık üst şeritte değil — biten adım Akış kartında, token/ödenen/Claude Modeller(Denge)'de.
let h = kpiHtml(snap);
for (const s of ['akis', 'modeller', 'arastirma']) {
  assert.ok(new RegExp(`role="tab"[^>]*data-sekme="${s}"`).test(h), `${s} sekme-kartı yok`);
}
assert.ok(!/data-sekme="etki"/.test(h), 'Etki kartı olmamalı');
assert.ok(h.includes('role="tablist"'), 'KPI kartları tablist');
let t = duz(h);
assert.ok(t.includes('2 / 3'), 'Akış kartı: biten / toplam adım');
// git deposu varsa Depo kartı ilk sırada
const hd = kpiHtml({ ...snap, depo: { var: true, yerel: { ileri: 5, degisik: [] } } });
assert.equal([...hd.matchAll(/data-sekme="(\w+)"/g)][0][1], 'depo', 'Depo kartı ilk sırada');
// boş / eksik veri çökmez, 0 yerine —
t = duz(kpiHtml(null));
assert.ok(t.includes('—') && !t.includes('NaN') && !t.includes('undefined'));
t = duz(kpiHtml({ plan: snap.plan, gecmis: [], modeller: [], telemetri: null }));
assert.ok(t.includes('2 / 3') && t.includes('—'));

// sayfa: sekmeler
const p = mkdtempSync(join(tmpdir(), 'sekme-'));
writeFileSync(join(p, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const s = await baslat(p, 0);
const sayfa = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
await s.kapat();
assert.ok(sayfa.includes('id="kpi"') && sayfa.includes('kpiHtml'), 'KPI kartları (kpiHtml) sayfada');
// sekme düğmeleri artık KPI kartları (role=tab/tablist kpiHtml'de JS ile çizilir); statik panel'ler kalır
const sekmeler = ['akis', 'modeller', 'arastirma'];
for (const k of sekmeler) {
  assert.ok(sayfa.includes(`role="tabpanel"`) && sayfa.includes(`id="sekme-${k}"`), `${k} paneli yok`);
}
const panel = (k) => { const i = sayfa.indexOf(`id="sekme-${k}"`); const sonraki = sayfa.indexOf('role="tabpanel"', i + 10); return sayfa.slice(i, sonraki > 0 ? sonraki : sayfa.indexOf('</main>')); };
for (const id of ['simdi', 'kategoriler']) assert.ok(panel('akis').includes(`id="${id}"`), `${id} Akış sekmesinde`);
for (const id of ['modeller', 'telemetri', 'matris']) assert.ok(panel('modeller').includes(`id="${id}"`), `${id} Modeller sekmesinde`);
assert.ok(panel('arastirma').includes('id="arastirma"'));
assert.ok(sayfa.includes('location.hash'), 'seçili sekme adreste saklanmalı');
assert.ok(sayfa.includes('aria-selected'), 'erişilebilirlik: aria-selected');
assert.ok(/\.kpi/.test(sayfa) && /@media[^{]*max-width/.test(sayfa), 'KPI stili ve dar ekran kuralı');
console.log('sekme.test ok');
