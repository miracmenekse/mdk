import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const d = mkdtempSync(join(tmpdir(), 'sunucu-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const s = await baslat(d, 0); // 0 = boş port
const kok = `http://127.0.0.1:${s.port}`;

const r = await fetch(`${kok}/api/durum`);
assert.equal(r.status, 200);
assert.equal((await r.json()).plan.kategoriler.length, 1);

const ev = await fetch(`${kok}/olay`);
assert.match(ev.headers.get('content-type'), /text\/event-stream/);
const rd = ev.body.getReader();
const dec = new TextDecoder();
const ilk = dec.decode((await rd.read()).value);
assert.ok(ilk.startsWith('data: '), 'bağlanınca ilk olay hemen gelmeli');

writeFileSync(join(d, 'durum.json'), JSON.stringify({ adim: 1, baslik: 'İş', model: 'a/x', deneme: 1, durum: 'calisiyor', ts: 1 }));
const ikinci = await Promise.race([
  (async () => { let t = ''; while (!t.includes('calisiyor')) t += dec.decode((await rd.read()).value); return t; })(),
  new Promise((_, ret) => setTimeout(() => ret(new Error('dosya değişince olay gelmedi')), 4000)),
]);
assert.match(ikinci, /calisiyor/);

await rd.cancel();
await s.kapat();
console.log('sunucu.test ok');
