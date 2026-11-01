// Kapı (adım 113): POST /api/test yalnız Mac'in kendisinden; uzak istek kod yürütmez, panelin gösterebileceği JSON döner.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const H = 'mac.tail1a2b.ts.net';
const d = mkdtempSync(join(tmpdir(), 'uzak-test-'));
const iz = join(d, 'kostu-5521');
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
writeFileSync(join(d, '.mdk-uzak.json'), JSON.stringify({ host: H, kullanici: 'k@x.y' }));
mkdirSync(join(d, 'test'));
writeFileSync(join(d, 'test', 'hepsi.sh'), `#!/usr/bin/env bash\ntouch "${iz}"\necho "hepsi ok"\n`);
const s = await baslat(d, 0);
const gonder = (basliklar) => new Promise((coz, ret) => {
  const r = request({ host: '127.0.0.1', port: s.port, path: '/api/test', method: 'POST', headers: basliklar }, (y) => {
    let t = ''; y.on('data', (p) => (t += p)); y.on('end', () => coz({ durum: y.statusCode, govde: t }));
  });
  r.on('error', ret); r.end();
});

for (const b of [
  { host: H, origin: `https://${H}`, 'tailscale-user-login': 'k@x.y' },
  { host: `127.0.0.1:${s.port}`, 'tailscale-user-login': 'k@x.y' },
  { host: `127.0.0.1:${s.port}`, 'x-forwarded-for': '100.64.0.2' },
  { host: 'kotu.example' },
  { host: `127.0.0.1:${s.port}`, origin: 'http://kotu.example' },
]) {
  const r = await gonder(b);
  assert.equal(r.durum, 403, JSON.stringify(b));
  const j = JSON.parse(r.govde);
  assert.equal(j.gecti, false, 'panel düğmesi gecti alanını okur');
  assert.ok(/Mac/.test(j.cikti), 'çıktı nedeni söylemeli: ' + j.cikti);
}
await new Promise((z) => setTimeout(z, 300));
assert.ok(!existsSync(iz), 'reddedilen istek test betiğini koşmamalı');

const yerel = await gonder({ host: `127.0.0.1:${s.port}` });
assert.equal(yerel.durum, 200);
assert.equal(JSON.parse(yerel.govde).gecti, true);
assert.ok(existsSync(iz), 'yerel istek testleri koşmalı');

await s.kapat();
console.log('uzak-test-engel.test ok');
