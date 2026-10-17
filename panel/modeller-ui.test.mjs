import assert from 'node:assert/strict';
import { modellerHtml, etkiHtml } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const m = (o) => ({ yurutucu: 'opencode', model: 'a/x', deneme: 3, gecen: 2, ilkDenemeOrani: 0.5, token: 600, maliyet: 0, ortSure: 20, uyum: 0.5, ...o });

// model tablosu: yürütücü ve uyum sütunları; maliyet 0 ise sütun yok
let h = duz(modellerHtml([m({}), m({ yurutucu: 'kodcu', model: 'sonnet', ilkDenemeOrani: 1, uyum: null })]));
for (const s of ['yürütücü', 'model', 'deneme', 'ilk denemede geçme', 'uyum', 'token', 'ort. süre']) assert.ok(h.includes(s), `başlıkta ${s} yok`);
assert.ok(!h.includes('maliyet'), 'tüm maliyetler 0 iken maliyet sütunu olmamalı');
assert.ok(h.includes('kodcu') && h.includes('sonnet'));
assert.equal(h.split('50%').length - 1, 2, 'a/x için ilk denemede geçme ve uyum: 50% iki kez');
assert.ok(h.includes('—'), 'uyum null ise —');

// maliyet varsa sütun görünür
h = duz(modellerHtml([m({ maliyet: 1.5 })]));
assert.ok(h.includes('maliyet') && h.includes('$1.50'));

// etki çubuğu token bazlı: iki ayrı etiketli çubuk
const e = (no, baslik, deger, token, maliyet = 0) => ({ no, baslik, dosya: `etki/${no}.html`, deger, tahmin: { token, maliyet, guven: 'orta' } });
const eh = etkiHtml([e(1, 'Küçük iş', 5, 1000), e(2, 'Büyük iş', 2, 4000)]);
const t = duz(eh);
assert.ok(t.includes('değer') && t.includes('token'), 'çubuklar etiketli olmalı');
assert.match(t, /~1[.\s ]?000 token/);
assert.match(t, /~4[.\s ]?000 token/);
assert.ok(!eh.includes('$'), 'maliyet 0 iken para yazılmamalı');
for (const w of ['width:100', 'width:25', 'width:40']) assert.ok(eh.includes(w), `${w} çubuk genişliği yok (değer/5 ve token/en büyük)`);
assert.ok(duz(etkiHtml([e(3, 'Ücretli', 3, 2000, 0.25)])).includes('$0.2500'));
assert.ok(t.includes('orta'), 'güven rozeti kalmalı');
console.log('modeller-ui.test ok');
