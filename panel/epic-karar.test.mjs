// Kapı (adım 137): epic kararı altyapısı — karar.mjs, sunucu uçları, karar-bekle.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, existsSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { kararEkle } from './karar.mjs';
import { baslat } from './sunucu.mjs';

// --- karar.mjs: epic dalı ---
const kd = mkdtempSync(join(tmpdir(), 'epic-karar-k-'));
const dosya = join(kd, 'etki', 'kararlar.jsonl');

const a = kararEkle(kd, { epic: '22', tur: 'onay' });
assert.equal(a.epic, '22');
assert.equal(a.tur, 'onay');
assert.equal(a.metin, '');
assert.ok(Number.isInteger(a.ts));
assert.ok(!Object.prototype.hasOwnProperty.call(a, 'no'));
const satirlar0 = readFileSync(dosya, 'utf8').trimEnd().split('\n');
assert.equal(satirlar0.length, 1);
assert.deepEqual(JSON.parse(satirlar0[0]), { ts: a.ts, epic: '22', tur: 'onay', metin: '' });

const f = kararEkle(kd, { epic: '22', tur: 'figma' });
assert.equal(f.epic, '22');
assert.equal(f.tur, 'figma');
assert.equal(f.metin, '');

const n = kararEkle(kd, { no: 5, tur: 'onay' });
assert.equal(n.no, 5);
assert.equal(n.tur, 'onay');
assert.ok(!Object.prototype.hasOwnProperty.call(n, 'epic'));

// sınır: 20 karakter kabul, 21 reddedilir; yalnız rakam/nokta
const e20 = '1'.repeat(20);
const ok20 = kararEkle(mkdtempSync(join(tmpdir(), 'epic-karar-20-')), { epic: e20, tur: 'onay' });
assert.equal(ok20.epic, e20);
assert.throws(() => kararEkle(mkdtempSync(join(tmpdir(), 'epic-karar-21-')), { epic: '1'.repeat(21), tur: 'onay' }), Error);
assert.throws(() => kararEkle(mkdtempSync(join(tmpdir(), 'epic-karar-ch-')), { epic: '22a', tur: 'onay' }), Error);

// hatalar dosyayı değiştirmez
const once = readFileSync(dosya, 'utf8');
for (const girdi of [
  { no: 5, tur: 'figma' },
  { epic: '22', no: 5, tur: 'onay' },
  { tur: 'onay' },
  { epic: '', tur: 'onay' },
  { epic: '../x', tur: 'onay' },
  { epic: '22', tur: 'red' },
]) assert.throws(() => kararEkle(kd, girdi), Error);
assert.equal(readFileSync(dosya, 'utf8'), once);

// --- sunucu: epic karar uçları ---
const sd = mkdtempSync(join(tmpdir(), 'epic-karar-srv-'));
writeFileSync(join(sd, 'PLAN.md'),
  '## Epic 22 — M\n- Durum: analiz\n- Tartışma: epic/22\n\n## Epic 20 — Eski\n- [x] 1. iş\n  - Kapı: `true`\n');
mkdirSync(join(sd, 'epic', '22'), { recursive: true });
const tartisma = { durum: 'bitti', mesaj: 'merhaba' };
writeFileSync(join(sd, 'epic', '22', 'tartisma.json'), JSON.stringify(tartisma));

const s = await baslat(sd, 0);
const kok = `http://127.0.0.1:${s.port}`;

let r = await fetch(`${kok}/api/karar`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ epic: '22', tur: 'onay' }),
});
assert.equal(r.status, 200, await r.text());
const ks = readFileSync(join(sd, 'etki', 'kararlar.jsonl'), 'utf8').trimEnd().split('\n');
assert.ok(ks.some((l) => { const o = JSON.parse(l); return o.epic === '22' && o.tur === 'onay'; }), 'dosyada satır olmalı');

r = await fetch(`${kok}/api/karar`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ epic: '99', tur: 'onay' }),
});
assert.equal(r.status, 404, 'olmayan epic 404');

r = await fetch(`${kok}/api/karar`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ epic: '20', tur: 'onay' }),
});
assert.equal(r.status, 404, 'tamamlanmış epic 404');

let j = await (await fetch(`${kok}/api/epic?no=22`)).json();
assert.deepEqual(j.tartisma, tartisma, 'tartisma nesnesi eşit olmalı');

j = await (await fetch(`${kok}/api/epic?no=99`)).json();
assert.equal(j.tartisma, null, 'olmayan epic tartisma null');

writeFileSync(join(sd, 'epic', '22', 'tartisma.json'), '{bozuk');
j = await (await fetch(`${kok}/api/epic?no=22`)).json();
assert.equal(j.tartisma, null, 'bozuk tartisma.json null');

await s.kapat();

// yol güvenliği: symlink ile kök dışına kaçış → 400
const sd2 = mkdtempSync(join(tmpdir(), 'epic-karar-sec-'));
writeFileSync(join(sd2, 'PLAN.md'), '## Epic 22 — M\n- Durum: analiz\n- Tartışma: epic/22\n');
mkdirSync(join(sd2, 'epic'));
const dis = mkdtempSync(join(tmpdir(), 'epic-karar-dis-'));
writeFileSync(join(dis, 'tartisma.json'), JSON.stringify({ secret: true }));
symlinkSync(dis, join(sd2, 'epic', '22'));
const s2 = await baslat(sd2, 0);
const rsec = await fetch(`http://127.0.0.1:${s2.port}/api/epic?no=22`);
assert.equal(rsec.status, 400, 'kök dışı yol 400 olmalı');
const metin = await rsec.text();
assert.ok(!metin.includes('secret'), 'gizli içerik sızmamalı');
await s2.kapat();

// --- karar-bekle.mjs: çocuk süreç ---
const bd = mkdtempSync(join(tmpdir(), 'epic-karar-bekle-'));
mkdirSync(join(bd, 'etki'));
const betik = resolve('karar-bekle.mjs');
const birKez = () => spawnSync('node', [betik, bd, '--bir-kez'], { encoding: 'utf8', timeout: 5000 });

let rb = birKez();
assert.equal(rb.status, 0, rb.stderr);
assert.equal(rb.stdout, '');

appendFileSync(join(bd, 'etki', 'kararlar.jsonl'),
  JSON.stringify({ ts: 1, epic: '22', tur: 'figma', metin: '' }) + '\n');
rb = birKez();
assert.equal(rb.status, 0, rb.stderr);
assert.equal(rb.stdout, 'epic 22 figma\n');

appendFileSync(join(bd, 'etki', 'kararlar.jsonl'),
  JSON.stringify({ ts: 2, epic: '22', tur: 'yorum', metin: 'a\nb' }) + '\n');
rb = birKez();
assert.equal(rb.status, 0, rb.stderr);
assert.equal(rb.stdout, 'epic 22 yorum: a b\n');

appendFileSync(join(bd, 'etki', 'kararlar.jsonl'),
  JSON.stringify({ ts: 3, no: 5, tur: 'onay', metin: '' }) + '\n');
rb = birKez();
assert.equal(rb.status, 0, rb.stderr);
assert.equal(rb.stdout, 'adım 5 onay\n');

console.log('epic-karar.test ok');
