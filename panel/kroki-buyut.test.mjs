// Kapı (adım 57): etki krokisine tıklayınca büyük pencerede açılır. Kullanım: node panel/kroki-buyut.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { etkiHtml } from './ciz.mjs';

const e = (no, bitti, dosya = `etki/${no}.html`) => ({ no, baslik: `İş ${no}`, dosya, deger: 3, bitti, tahmin: { token: 1, maliyet: 0, guven: 'orta' } });
let h = etkiHtml([e(1, false, 'etki/a"b&c.html')]);
const dugmeler = [...h.matchAll(/<button type="button" class="buyut" data-src="([^"]*)" aria-label="([^"]*)">/g)];
assert.equal(dugmeler.length, 2, 'kart başına önce + sonra düğmesi: ' + h.slice(h.indexOf('kroki'), h.indexOf('kroki') + 400));
const srcler = [...h.matchAll(/<iframe[^>]*src="([^"]*)"/g)].map((m) => m[1]);
assert.deepEqual(dugmeler.map((m) => m[1]), srcler, 'data-src = iframe src (aynı kaçışla)');
assert.ok(srcler[0].endsWith('goster=once') && srcler[1].endsWith('goster=sonra'));
assert.deepEqual(dugmeler.map((m) => m[2]), ['önce taslağını büyüt', 'sonra taslağını büyüt']);
// düğme iframe ile aynı kutuda
const kutu = h.match(/<div><div class="etiket">önce<\/div>([\s\S]*?)<\/div><div>/)?.[1] || '';
assert.ok(kutu.includes('<iframe') && kutu.includes('class="buyut"'), kutu);
// biten taslaklarda da var
h = etkiHtml([e(2, true)], { gecmisAcik: true });
assert.equal((h.match(/class="buyut"/g) || []).length, 2);

// sayfa: tek dialog, showModal, kapatma yolları, CSS
const s = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const css = s.replace(/\s+/g, ' ');
assert.equal((s.match(/<dialog id="buyuk"/g) || []).length, 1, 'tek <dialog id="buyuk">');
const dlg = s.slice(s.indexOf('<dialog id="buyuk"'), s.indexOf('</dialog>'));
assert.ok(dlg.includes('<iframe') && /<button[^>]*>/.test(dlg), 'dialog içinde iframe ve kapat düğmesi');
const js = s.slice(s.lastIndexOf('<script'));
assert.ok(js.includes('.buyut') || js.includes("'buyut'") || js.includes('"buyut"'), 'buyut tıklaması dinlenir');
assert.ok(js.includes('showModal()'), 'showModal');
assert.ok(js.includes('dataset.src'), 'iframe src = data-src');
assert.ok(/\.close\(\)/.test(js), 'kapat düğmesi / arka plan close()');
assert.ok(/addEventListener\(\s*'close'/.test(js), 'kapanınca iframe src boşaltılır');
assert.match(css, /\.kroki > div \{[^}]*position: ?relative/);
const b = css.match(/\.buyut \{([^}]*)\}/)?.[1] || '';
for (const k of [/position: ?absolute/, /inset: ?0/, /background: ?transparent/, /cursor: ?zoom-in/]) assert.match(b, k);
assert.match(css, /\.buyut:focus-visible \{[^}]*outline/, 'klavye odağında görünür çerçeve');
assert.match(css, /#buyuk iframe \{[^}]*92vw[^}]*88vh|#buyuk iframe \{[^}]*88vh[^}]*92vw/);
console.log('kroki-buyut.test ok');
