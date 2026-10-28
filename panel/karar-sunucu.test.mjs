// Kapı (adım 64): POST /api/karar — kararı etki/kararlar.jsonl'e yazar; yerel olmayan istekleri reddeder.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const d = mkdtempSync(join(tmpdir(), 'karar-sunucu-'));
const plan = 'Yürütücü: opencode\nModeller: a/x\n\n## K\n' +
  '- [ ] 41. Taslaklı iş\n  - Etki: etki/a.html\n  - Kapı: `true`\n' +
  '- [ ] 42. Taslaksız iş\n  - Kapı: `true`\n' +
  '- [x] 43. Biten taslaklı iş\n  - Etki: etki/b.html\n  - Kapı: `true`\n';
writeFileSync(join(d, 'PLAN.md'), plan);
const s = await baslat(d, 0);
const dosya = join(d, 'etki', 'kararlar.jsonl');

// ham istek: Host/Origin başlığını fetch değiştiremediği için node:http
function gonder({ govde, tip = 'application/json', host = `127.0.0.1:${s.port}`, origin, method = 'POST', yol = '/api/karar' }) {
  return new Promise((coz, ret) => {
    const basliklar = { host };
    if (tip) basliklar['content-type'] = tip;
    if (origin) basliklar.origin = origin;
    const r = request({ host: '127.0.0.1', port: s.port, path: yol, method, headers: basliklar }, (y) => {
      let t = '';
      y.on('data', (p) => (t += p));
      y.on('end', () => coz({ durum: y.statusCode, govde: t }));
    });
    r.on('error', ret);
    if (govde !== undefined) r.write(typeof govde === 'string' ? govde : JSON.stringify(govde));
    r.end();
  });
}

// SSE: karar gelince ve etki/ altında dosya değişince panel yeniden çizilir
const ev = await fetch(`http://127.0.0.1:${s.port}/olay`);
const rd = ev.body.getReader();
const dec = new TextDecoder();
let olaylar = 0;
(async () => { try { while (true) { const { value, done } = await rd.read(); if (done) break; olaylar += (dec.decode(value).match(/^data: /gm) || []).length; } } catch {} })();
const olayBekle = async (onceki, neden) => {
  const son = Date.now() + 4000;
  while (olaylar <= onceki) {
    if (Date.now() > son) throw new Error(neden);
    await new Promise((z) => setTimeout(z, 50));
  }
};
await olayBekle(0, 'ilk SSE olayı gelmedi');

// başarı: onay, red; yanıt yazılan kararı döner
let o = olaylar;
let r = await gonder({ govde: { no: 41, tur: 'onay' }, origin: `http://127.0.0.1:${s.port}` });
assert.equal(r.durum, 200, r.govde);
const j = JSON.parse(r.govde);
assert.equal(j.tamam, true);
assert.equal(j.karar.no, 41);
assert.equal(j.karar.tur, 'onay');
await olayBekle(o, 'karar sonrası SSE olayı gelmedi');
r = await gonder({ govde: { no: 41, tur: 'red', metin: 'kutu solda kalsın' }, host: `localhost:${s.port}`, origin: `http://localhost:${s.port}` });
assert.equal(r.durum, 200, r.govde);
let satirlar = readFileSync(dosya, 'utf8').trimEnd().split('\n').map((x) => JSON.parse(x));
assert.deepEqual(satirlar.map((k) => [k.no, k.tur, k.metin]), [[41, 'onay', ''], [41, 'red', 'kutu solda kalsın']]);

// Claude işareti ya da taslağı değiştirince de olay gelir (etki/ izlenir)
o = olaylar;
writeFileSync(join(d, 'etki', '.karar-okundu'), '1\n');
await olayBekle(o, 'etki/.karar-okundu değişince SSE olayı gelmedi');
o = olaylar;
writeFileSync(join(d, 'etki', 'a.html'), '<p>yeni taslak</p>');
await olayBekle(o, 'etki/*.html değişince SSE olayı gelmedi');

// PLAN.md'ye panel yazmaz (Claude yazar)
assert.equal(readFileSync(join(d, 'PLAN.md'), 'utf8'), plan);

// hatalar: her biri dosyayı değiştirmez, yanıt JSON {hata}
const once = readFileSync(dosya, 'utf8');
const hatalar = [
  [{ govde: { no: 42, tur: 'onay' } }, 404, 'taslaksız adım'],
  [{ govde: { no: 43, tur: 'onay' } }, 404, 'biten adım'],
  [{ govde: { no: 99, tur: 'onay' } }, 404, 'olmayan adım'],
  [{ govde: { no: 41, tur: 'red' } }, 400, 'metinsiz red'],
  [{ govde: { no: 41, tur: 'sil' } }, 400, 'bilinmeyen tür'],
  [{ govde: '{bozuk' }, 400, 'bozuk JSON'],
  [{ govde: { no: 41, tur: 'onay' }, tip: 'text/plain' }, 415, 'JSON olmayan tür (CSRF basit istek)'],
  [{ govde: { no: 41, tur: 'onay' }, tip: null }, 415, 'tür yok'],
  [{ govde: { no: 41, tur: 'yorum', metin: 'z'.repeat(5000) } }, 413, 'büyük gövde'],
  [{ govde: { no: 41, tur: 'onay' }, origin: 'http://kotu.example' }, 403, 'yabancı Origin'],
  [{ govde: { no: 41, tur: 'onay' }, host: `kotu.example:${s.port}`, origin: `http://kotu.example:${s.port}` }, 403, 'DNS rebinding: yerel olmayan Host'],
];
for (const [istek, kod, neden] of hatalar) {
  const y = await gonder(istek);
  assert.equal(y.durum, kod, `${neden}: ${y.durum} ${y.govde}`);
  if (kod !== 413) assert.ok(typeof JSON.parse(y.govde).hata === 'string', `${neden}: {hata} yok`);
}
assert.equal(readFileSync(dosya, 'utf8'), once, 'hatalı istek dosyayı değiştirmemeli');

// diğer yöntemler ve yollar eskisi gibi
assert.equal((await gonder({ method: 'PUT', govde: {} })).durum, 405);
assert.equal((await gonder({ method: 'OPTIONS' })).durum, 405, 'ön uçuş (preflight) izinli olmamalı');
assert.equal((await gonder({ yol: '/api/durum', govde: {} })).durum, 405, 'POST yalnız /api/karar');
assert.equal((await fetch(`http://127.0.0.1:${s.port}/api/durum`)).status, 200);

await rd.cancel();
await s.kapat();
console.log('karar-sunucu.test ok');
