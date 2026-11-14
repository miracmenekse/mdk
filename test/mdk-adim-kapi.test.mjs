// Kapı (adım 155): mdk-adim-kapi.mjs — izinler, eksik kapı listesi, kapı üretimi sonuç nedenleri.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eksikKapilar, izinYapilandirmasi, kapiUret } from '../mdk-adim-kapi.mjs';
if (process.platform === 'win32') { console.log('atlandı (win32): POSIX vekil testi'); process.exit(0); }

const KOK = resolve(fileURLToPath(import.meta.url), '..', '..');

// izinler
let c = JSON.parse(izinYapilandirmasi('kod', ['node a.test.mjs'])).permission;
assert.deepEqual([c.edit['*'], c.edit['PLAN.md'], c.edit['test/*'], c.edit['*.test.*'], c.edit['kapi/*']], ['allow', 'deny', 'deny', 'deny', 'deny']);
assert.equal(c.bash['*test/hepsi.sh*'], 'deny');
assert.equal(c.bash['git push*'], 'deny');
assert.deepEqual(c.shell, c.bash);
assert.equal(c.external_directory, 'deny');
c = JSON.parse(izinYapilandirmasi('kod', ['bash test/hepsi.sh'])).permission;
assert.equal(c.bash['*test/hepsi.sh*'], undefined, "kapıda geçen betik yasaklanmaz");
c = JSON.parse(izinYapilandirmasi('kapi', ['node x.test.mjs'], ['x.test.mjs'])).permission;
assert.deepEqual([c.edit['*'], c.edit['x.test.mjs']], ['deny', 'allow']);
assert.ok(JSON.parse(izinYapilandirmasi('kod', [], [], '1')).compaction);

// eksik kapılar
const T = mkdtempSync(join(tmpdir(), 'adim-kapi-'));
const R = join(T, 'r');
const g = (...a) => spawnSync('git', a, { cwd: R, encoding: 'utf8' });
spawnSync('mkdir', ['-p', R]);
writeFileSync(join(R, 'var.test.mjs'), '');
assert.deepEqual(eksikKapilar(['node var.test.mjs && node b.test.mjs', 'bash kapi/derle.sh && bash a.test.sh'], R), ['a.test.sh', 'b.test.mjs']);

// kapı üretimi: geçici depoda sahte calistir
g('init', '-q'); g('config', 'user.name', 't'); g('config', 'user.email', 't@t');
writeFileSync(join(R, '.gitignore'), '.mdk-log/\nmetrikler.jsonl\n');
writeFileSync(join(R, 'PLAN.md'), 'Görev kapi: m/k\n');
g('add', '-A'); g('commit', '-qm', 'c0');
const CP = g('rev-parse', 'HEAD').stdout.trim();
process.chdir(R);
spawnSync('mkdir', ['-p', '.mdk-log']);

async function dene(yaz) {
  const metrik = [];
  const yeni = await kapiUret({
    n: 1, blok: '- [ ] 1. İş', kapilar: ['node y.test.mjs'], planMetni: 'Görev kapi: m/k\n', kurallar: 'K', projeKural: '', cp: g('rev-parse', 'HEAD').stdout.trim(),
    logd: '.mdk-log', selfDir: KOK, yazDurum: () => {}, yazMetrik: (m) => metrik.push(m),
    calistir: async (m, b, istem, log) => { assert.match(istem, /KAPI ÜRETME/); writeFileSync(log, ''); yaz(); return { neden: '', yurm: 'opencode', t0: Math.floor(Date.now() / 1000) }; },
  });
  return { yeni, m: metrik[0] };
}
const temiz = () => g('status', '--porcelain').stdout === '';

let r = await dene(() => { writeFileSync('y.test.mjs', 'import "./y.mjs";\n'); writeFileSync('baska.txt', 'x'); });
assert.equal(r.yeni, null); assert.equal(r.m.neden, 'kapi_kapsam'); assert.ok(temiz() && !existsSync('y.test.mjs'));
r = await dene(() => writeFileSync('y.test.mjs', 'import {\n'));
assert.equal(r.m.neden, 'kapi_sozdizimi'); assert.ok(temiz());
r = await dene(() => writeFileSync('y.test.mjs', 'process.exit(0)\n'));
assert.equal(r.m.neden, 'kapi_yesil'); assert.ok(temiz());
r = await dene(() => {});
assert.equal(r.m.neden, 'kapi_eksik');
r = await dene(() => writeFileSync('y.test.mjs', 'import "./y.mjs";\n'));
assert.equal(r.m.neden, null); assert.equal(r.m.tur, 'kapi'); assert.equal(r.m.gecti, true);
assert.notEqual(r.yeni, CP);
assert.equal(r.yeni, g('rev-parse', 'HEAD').stdout.trim());
assert.match(g('log', '-1', '--format=%s').stdout, /^adım 1 kapısı: y\.test\.mjs \(m\/k\)/);
assert.ok(JSON.parse(process.env.OPENCODE_CONFIG_CONTENT).permission.edit['PLAN.md'] === 'deny', 'sonunda kod izinleri');

process.chdir(tmpdir());
rmSync(T, { recursive: true, force: true });
console.log('mdk-adim-kapi.test ok');
