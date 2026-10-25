// Kapı (adım 55): maliyet dengesi kartı; önce ölçülen token, sonra tahmini para; fark/kat yazılmaz. Kullanım: node panel/denge.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dengeHtml } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tel = { var: true, toplam: { toplam: 9_700_000, maliyet: 0 }, tasarruf: { listeFiyati: 5.02, odenen: 0, referans: 'r' } };
const cl = (maliyet, fiyatsiz = []) => ({ var: true, toplam: { toplam: 78_100_000, maliyet, fiyatsiz, mesaj: 1, ana: 1, altajan: 0 }, modeller: [] });

let h = dengeHtml(tel, cl(21.76, ['claude-opus-5-5', '<x>']));
assert.ok(h.startsWith('<div class="kart denge">'), h.slice(0, 60));
let t = duz(h);
for (const s of ['OpenCode (ücretsiz)', 'Claude', '9,7 M', '78,1 M', '~$5,02', 'kaçınılan', '~$21,76', 'en az', 'claude-opus-5-5']) assert.ok(t.includes(s), `${s} yok: ${t}`);
assert.ok(h.includes('&lt;x&gt;') && !h.includes('<x>'), 'model adları kaçışlı');
// token önce, para sonra (her sütunda)
assert.ok(t.indexOf('9,7 M') < t.indexOf('~$5,02') && t.indexOf('78,1 M') < t.indexOf('~$21,76'));
// tek ölçülen oran: 9,7 / (9,7 + 78,1) = %11
assert.ok(t.includes("token'ların %11'i ücretsiz modelde"), t);
// para farkı ya da kat yazılmaz
assert.ok(!/kat[ıi]?\b|net|fark|\$16/.test(t), 'fark/kat/net yazılmamalı: ' + t);

// fiyatsız yoksa "en az" yok
assert.ok(!duz(dengeHtml(tel, cl(3))).includes('en az'));
// Claude fiyatı yok
t = duz(dengeHtml(tel, cl(null, ['claude-opus-5-5'])));
assert.ok(t.includes('fiyat yok') && t.includes('78,1 M') && !t.includes('null'), t);
// tasarruf (referans fiyat) yok: OpenCode tarafında para yok, token var
t = duz(dengeHtml({ ...tel, tasarruf: null }, cl(3)));
assert.ok(t.includes('9,7 M') && !t.includes('kaçınılan'), t);
// bir taraf yok: "veri yok", oran satırı yok
t = duz(dengeHtml(null, cl(3)));
assert.ok(t.includes('veri yok') && !t.includes('ücretsiz modelde'), t);
t = duz(dengeHtml(tel, { var: false }));
assert.ok(t.includes('veri yok') && !t.includes('ücretsiz modelde'), t);
// ikisi de yok
assert.equal(dengeHtml(null, null), '');
assert.equal(dengeHtml({ var: false }, { var: false }), '');
for (const x of [dengeHtml(tel, cl(null)), dengeHtml(null, cl(1)), dengeHtml(tel, null)]) assert.ok(!/undefined|NaN|null/.test(x), x);

// sayfa: Modeller sekmesinin en üstünde
const s = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const sekme = s.slice(s.indexOf('id="sekme-modeller"'));
assert.ok(/^id="sekme-modeller"[^>]*>\s*<h2>Maliyet dengesi<\/h2>\s*<section id="denge">/.test(sekme), 'Modeller sekmesinin ilk bölümü: ' + sekme.slice(0, 120));
assert.match(s, /dengeHtml\(d\.telemetri, d\.claude\)/);
console.log('denge.test ok');
