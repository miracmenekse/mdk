// Kapı (adım 156): mdk-adim.mjs bash/grep/sed/setsid/flock olmadan çalışır
// (Windows vekili: PATH'te yalnız node, git ve node ile yazılmış sahte opencode; kapı komutu için bash).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = resolve(fileURLToPath(import.meta.url), '..', '..');
const ADIM = join(KOK, 'mdk-adim.mjs');
const nerede = (ad) => spawnSync('/usr/bin/which', [ad], { encoding: 'utf8' }).stdout.trim();
const T = mkdtempSync(join(tmpdir(), 'tasima-adim-'));
const BIN = join(T, 'bin'); mkdirSync(BIN);
// kapı komutları kabukta koşar (Windows'ta Git Bash); yürütücü yolu bash'siz kalmalı
for (const ad of ['node', 'git', 'bash']) symlinkSync(ad === 'node' ? process.execPath : nerede(ad), join(BIN, ad));
// sahte opencode: YAZ=1 ise cikti.txt yazar
writeFileSync(join(BIN, 'opencode'), `#!/usr/bin/env node
if (process.env.YAZ === '1') require('fs').writeFileSync('cikti.txt', 'x');
console.log(JSON.stringify({type:'step_finish',part:{tokens:{total:100},cost:0}}));
`);
chmodSync(join(BIN, 'opencode'), 0o755);
// test sırasında bash'e kaçış olursa (grep/sed/awk/setsid/flock) PATH'te bulunamaz ve koşu bozulur
const yasak = ['grep', 'sed', 'awk', 'setsid', 'flock', 'cat', 'cp', 'pgrep'];
for (const y of yasak) assert.ok(!existsSync(join(BIN, y)));

function depo(adim) {
  const R = mkdtempSync(join(T, 'r-'));
  const g = (...a) => spawnSync('git', a, { cwd: R });
  g('init', '-q'); g('config', 'user.name', 't'); g('config', 'user.email', 't@t');
  writeFileSync(join(R, '.gitignore'), 'durum.json\nmetrikler.jsonl\n.mdk-log/\n');
  writeFileSync(join(R, 'PLAN.md'), `Yürütücü: opencode\nModeller: m/a\n\n## K\n- [ ] 1. İş\n${adim}\n`);
  g('add', '-A'); g('commit', '-qm', 'c0');
  return R;
}
const kos = (R, ek = {}) => spawnSync(process.execPath, [ADIM, '1'], { cwd: R, encoding: 'utf8', timeout: 60000, env: { HOME: T, PATH: BIN, MDK_OPENCODE: 'opencode', MDK_ONKONTROL_YOK: '1', MDK_KILIT: join(T, 'kilit'), POLL: '1', DENEME: '1', SURE: '20', ...ek } });

try {
  let R = depo('  - Kapı: `test -f cikti.txt`');
  let r = kos(R, { YAZ: '1' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(readFileSync(join(R, 'PLAN.md'), 'utf8'), /^- \[x\] 1\./m);
  assert.match(spawnSync('git', ['log', '-1', '--format=%s'], { cwd: R, encoding: 'utf8' }).stdout, /^adım 1: İş \(m\/a, deneme 1\)/);
  const m = JSON.parse(readFileSync(join(R, 'metrikler.jsonl'), 'utf8').trim());
  assert.equal(m.gecti, true); assert.equal(m.token, 100); assert.equal(m.model, 'm/a');
  assert.ok(existsSync(join(R, '.mdk-log', 'donmus', 'mdk-adim.mjs')), 'donmuş kopya');

  R = depo('  - Kapı: `test -f cikti.txt`');
  r = kos(R);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stdout, /eskale/);

  R = depo('  - Kapı: `test -f cikti.txt`\n  - Etki: etki/a.html');
  r = kos(R, { YAZ: '1' });
  assert.equal(r.status, 5, r.stdout + r.stderr);

  assert.match(readFileSync(join(KOK, 'mdk-adim.sh'), 'utf8'), /exec node .*mdk-adim\.mjs/);
} finally { rmSync(T, { recursive: true, force: true }); }
console.log('tasima-adim.test ok');
