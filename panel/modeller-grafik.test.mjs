// Faz 13 kapısı: Modeller v2 grafikleri — tokenPayiHtml (degrade halka + maliyet) ve
// modelTokenCubukHtml (degrade çubuk). Boş veri çökmez.
import assert from 'node:assert/strict';
import { tokenPayiHtml, modelTokenCubukHtml } from './ciz.mjs';

const snap = {
  telemetri: { var: true, toplam: { toplam: 1300000, maliyet: 0 }, tasarruf: { listeFiyati: 6.4 } },
  claude: { var: true, toplam: { toplam: 6000000, maliyet: null, fiyatsiz: ['opus'] } },
  modeller: [
    { model: 'glm-5.3-flash', token: 52000, cacheOkuma: 47000 },
    { model: 'deepseek-v4.1-flash', token: 48000, cacheOkuma: 43000 },
    { model: 'gemini-4-argon', token: 9000, cacheOkuma: 0 },
  ],
};

// --- tokenPayiHtml ---
const tp = tokenPayiHtml(snap);
assert.ok(tp.includes('<svg') && tp.includes('donut'), 'degrade halka SVG');
assert.ok(tp.includes('url(#g-claude)'), 'Claude degrade dolgusu');
assert.ok(tp.includes('7,3 M') && tp.includes('toplam token'), 'merkez toplam token (7,3 M)');
assert.ok(tp.includes('OpenCode (ücretsiz)') && tp.includes('Claude'), 'maliyet blokları');
assert.ok(tp.includes('1,3 M') && tp.includes('6 M'), 'OpenCode/Claude token değerleri');
assert.ok(tp.includes('liste fiyatıyla') && tp.includes('$6,40'), 'OpenCode liste fiyatı');
assert.ok(/token'ların <b>%\d+<\/b>'i ücretsiz modelde/.test(tp), 'ücretsiz oran metni');
assert.ok(/%\d+/.test(tp), 'lejant yüzdeleri');

// boş veri çökmez
const bos = tokenPayiHtml(null);
assert.ok(bos.includes('token-payi') && !bos.includes('NaN'), 'boş tokenPayi güvenli');

// --- modelTokenCubukHtml ---
const cb = modelTokenCubukHtml(snap);
assert.ok(cb.includes('MODEL BAŞINA TOKEN'), 'başlık');
assert.equal((cb.match(/cubuk-sutun/g) || []).length, 3, '3 çubuk (token>0 olanlar)');
assert.ok(cb.includes('52.000') && cb.includes('glm-5.3-flash'), 'değer + model adı');
assert.ok(cb.includes('cubuk-dolu') && /height:\s?100\.0%/.test(cb), 'en büyük çubuk tam yükseklik');
assert.ok(cb.includes('cache %90'), 'cache oranı ipucu (47000/52000)');

// boş çubuk güvenli
assert.ok(modelTokenCubukHtml({ modeller: [] }).includes('model token verisi yok'), 'boş çubuk durumu');

console.log('modeller-grafik.test ok');
