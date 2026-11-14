import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, openSync, closeSync, statSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
  adimBlogu, epicBlogu, planSatiri, modelListesi, opencodeSec,
  olaylariTopla, metinAyikla, oturumKimligi, oturumKapat, zombiTemizle,
  agacOldur, kos, kilitAl, kilitBirak,
} from '../mdk-ortak.mjs';

const PLAN = `Yürütücü: opencode
Modeller: m/a

## Kategori A
Açıklama satırı
- [ ] 1. İlk
  - Kapı: \`true\`

- [x] 2. Bitmiş
  - Kapı: \`true\`

## Kategori B
- [ ] 3. Son
  - Kapı: \`true\`
`;

// adimBlogu
assert.equal(adimBlogu(PLAN, 999), '');
const ab1 = adimBlogu(PLAN, 1);
assert.match(ab1, /^- \[ \] 1\. İlk/m);
assert.ok(ab1.includes('Kapı'));
assert.ok(!ab1.includes('- [x] 2'));
const ab2 = adimBlogu(PLAN, 2);
assert.match(ab2, /^- \[x\] 2\. Bitmiş/m);
const ab3 = adimBlogu(PLAN, 3);
assert.match(ab3, /3\. Son/);
assert.ok(ab3.includes('Kapı'));

// epicBlogu
assert.equal(epicBlogu(PLAN, 1), 'Açıklama satırı\n');
assert.equal(epicBlogu(PLAN, 2), 'Açıklama satırı\n');
assert.equal(epicBlogu(PLAN, 3), '');
assert.equal(epicBlogu(PLAN, 999), '');

// planSatiri
assert.equal(planSatiri('Foo: bar\nBaz: qux\nFoo: second', 'Foo'), 'bar');
assert.equal(planSatiri('Foo: bar', 'Yok'), null);
assert.equal(planSatiri('X: a b', 'X'), 'a b');

// modelListesi
assert.deepEqual(modelListesi('a / b , c , , d'), ['a/b', 'c', 'd']);
assert.deepEqual(modelListesi(''), []);
assert.deepEqual(modelListesi('  x  ,  y  '), ['x', 'y']);

// opencodeSec
const od = mkdtempSync(join(tmpdir(), 'ocsec-'));
writeFileSync(join(od, 'oc-sec.mjs'), "process.stdout.write('FAKE_OC');");
const prevOc = process.env.MDK_OPENCODE;
process.env.MDK_OPENCODE = '/env/oc';
assert.equal(opencodeSec(od), '/env/oc');
delete process.env.MDK_OPENCODE;
assert.equal(opencodeSec(od), 'FAKE_OC');
if (prevOc !== undefined) process.env.MDK_OPENCODE = prevOc;

// olaylariTopla
const ol = join(tmpdir(), `ol-${Date.now()}.jsonl`);
writeFileSync(ol, [
  JSON.stringify({ type: 'step_finish', part: { cost: 0.01, tokens: { total: 100, input: 50, output: 30, reasoning: 5, cache: { read: 10, write: 5 } } } }),
  JSON.stringify({ type: 'step_start' }),
  JSON.stringify({ type: 'assistant', model_call_id: 'abc' }),
  JSON.stringify({ type: 'result', usage: { inputTokens: 10, outputTokens: 5, cacheReadTokens: 2, cacheWriteTokens: 1 } }),
].join('\n'));
const olt = olaylariTopla(ol);
assert.equal(olt.token, 118);
assert.equal(olt.maliyet, 0.01);
assert.equal(olt.etkin, 106);
assert.equal(olt.istek, 2);

// metinAyikla
const ml = join(tmpdir(), `ml-${Date.now()}.jsonl`);
writeFileSync(ml, [JSON.stringify({ type: 'text', part: { text: 'Mer' } }), JSON.stringify({ type: 'other' }), JSON.stringify({ type: 'text', part: { text: 'haba' } })].join('\n'));
assert.equal(metinAyikla(ml), 'Merhaba');

// oturumKimligi
const kl = join(tmpdir(), `kl-${Date.now()}.jsonl`);
writeFileSync(kl, 'foo "sessionID":"ses_abc123" bar');
assert.equal(oturumKimligi(kl), 'ses_abc123');
assert.equal(oturumKimligi(join(tmpdir(), 'yok-jsonl')), null);

// oturumKapat
const tmpO = mkdtempSync(join(tmpdir(), 'ot-'));
const ocLog = join(tmpO, 'oc.log');
const ocBin = join(tmpO, 'oc');
writeFileSync(ocBin, `#!/usr/bin/env node\nrequire('fs').appendFileSync(process.env.OC_LOG, process.argv.slice(2).join(' ')+'\\n');\n`);
chmodSync(ocBin, 0o755);
const slog = join(tmpO, 's.jsonl');
writeFileSync(slog, '"sessionID":"ses_xyz999"');
process.env.OC_LOG = ocLog;
oturumKapat(ocBin, slog, null);
assert.match(readFileSync(ocLog, 'utf8'), /api POST \/api\/session\/ses_xyz999\/interrupt/);

// zombiTemizle
const zdb = join(tmpO, 'z.db');
const zdbSqlite = new DatabaseSync(zdb);
zdbSqlite.exec('CREATE TABLE session_v2 (id TEXT, title TEXT, time_idle INTEGER)');
zdbSqlite.exec('CREATE TABLE session_message (session_id TEXT, type TEXT, seq INTEGER)');
zdbSqlite.prepare('INSERT INTO session_v2 (id,title,time_idle) VALUES (?,?,?)').run('ses_zombie1', 'adim-5', null);
zdbSqlite.prepare('INSERT INTO session_message (session_id,type,seq) VALUES (?,?,?)').run('ses_zombie1', 'tool', 1);
const prevMd = process.env.MDK_OPENCODE;
delete process.env.MDK_OPENCODE;
process.env.OPENCODE_DB = zdb;
rmSync(ocLog, { force: true });
zombiTemizle(ocBin);
assert.match(readFileSync(ocLog, 'utf8'), /ses_zombie1/);
if (prevMd !== undefined) process.env.MDK_OPENCODE = prevMd;
delete process.env.OPENCODE_DB;

// agacOldur
assert.doesNotThrow(() => agacOldur(99999999, 'SIGTERM'));

// kos
const klog = join(tmpO, 'kos.log');
const kr1 = await kos({ komut: process.execPath, args: ['-e', 'setTimeout(()=>{},9000)'], log: klog, ilk: 1, sure: 10, poll: 200 });
assert.equal(kr1.neden, 'yanit_yok');
const klog2 = join(tmpO, 'kos2.log');
const kr2 = await kos({ komut: process.execPath, args: ['-e', 'console.log("hi")'], log: klog2, ilk: 5, sure: 5, poll: 100 });
assert.equal(kr2.neden, null);
assert.equal(kr2.kod, 0);
assert.match(readFileSync(klog2, 'utf8'), /hi/);

// kilit
const kd = mkdtempSync(join(tmpdir(), 'kil-'));
const k1 = kilitAl(kd, 'a/b');
assert.ok(k1);
assert.equal(kilitAl(kd, 'a/b'), null);
kilitBirak(k1);
assert.ok(kilitAl(kd, 'a/b'));
const kd2 = mkdtempSync(join(tmpdir(), 'kil2-'));
writeFileSync(join(kd2, 'm'), '999999');
assert.ok(kilitAl(kd2, 'm'));

console.log('mdk-ortak.test ok');
