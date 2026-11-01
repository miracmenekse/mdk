// Kapı (adım 112): gerçek sunucu; POST /api/karar ve /api/persona-takim uzak izni yazmaIzni ile verir.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const H = 'mac.tail1a2b.ts.net';
const d = mkdtempSync(join(tmpdir(), 'uzak-sunucu-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 41. Taslaklı\n  - Etki: etki/a.html\n  - Kapı: `true`\n');
const s = await baslat(d, 0);
const gonder = (yol, govde, basliklar) => new Promise((coz, ret) => {
  const r = request({ host: '127.0.0.1', port: s.port, path: yol, method: 'POST', headers: { 'content-type': 'application/json', ...basliklar } }, (y) => {
    let t = ''; y.on('data', (p) => (t += p)); y.on('end', () => coz({ durum: y.statusCode, govde: t }));
  });
  r.on('error', ret); r.write(JSON.stringify(govde)); r.end();
});
const uzak = { host: H, origin: `https://${H}`, 'tailscale-user-login': 'k@x.y' };
const karar = { no: 41, tur: 'yorum', metin: 'telefondan-7319' };
const takim = { personalar: [{ ad: 'Uzak-8842', optimize: 'a', korluk: 'b', soru: 'c' }] };
const kararDosya = join(d, 'etki', 'kararlar.jsonl');
const takimDosya = join(d, 'persona', 'takim.json');

// ayar yok: uzak reddedilir, dosya oluşmaz
for (const [yol, g] of [['/api/karar', karar], ['/api/persona-takim', takim]]) {
  assert.equal((await gonder(yol, g, uzak)).durum, 403, yol + ' ayarsız uzak');
}
assert.ok(!existsSync(kararDosya) && !existsSync(takimDosya), 'reddedilen istek yazmamalı');

// ayar var (sunucuyu yeniden başlatmadan etkili): doğru kimlik geçer ve gerçekten yazar
writeFileSync(join(d, '.mdk-uzak.json'), JSON.stringify({ host: H, kullanici: 'k@x.y' }));
const r1 = await gonder('/api/karar', karar, uzak);
assert.equal(r1.durum, 200, 'karar uzak: ' + r1.govde);
assert.ok(readFileSync(kararDosya, 'utf8').includes('telefondan-7319'));
const r2 = await gonder('/api/persona-takim', takim, uzak);
assert.equal(r2.durum, 200, 'takım uzak: ' + r2.govde);
assert.ok(readFileSync(takimDosya, 'utf8').includes('Uzak-8842'));

// yanlış kimlik, yabancı origin, yabancı host: yine 403 ve yazmaz
const onceki = readFileSync(kararDosya, 'utf8');
for (const b of [{ ...uzak, 'tailscale-user-login': 'baska@x.y' }, { ...uzak, origin: 'https://kotu.example' }, { ...uzak, host: 'kotu.example' }]) {
  for (const [yol, g] of [['/api/karar', { ...karar, metin: 'sizma' }], ['/api/persona-takim', takim]]) {
    assert.equal((await gonder(yol, g, b)).durum, 403, yol + ' ' + JSON.stringify(b));
  }
}
assert.equal(readFileSync(kararDosya, 'utf8'), onceki, 'reddedilen karar yazmamalı');

// yerel akış bozulmadı
assert.equal((await gonder('/api/karar', { no: 41, tur: 'yorum', metin: 'yerel' }, { host: `127.0.0.1:${s.port}` })).durum, 200);

await s.kapat();
rmSync(d, { recursive: true, force: true });
console.log('uzak-sunucu.test ok');
