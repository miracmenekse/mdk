// Kapı (adım 157): mdk-paralel.mjs bash/grep/sed olmadan çalışır (Windows vekili: PATH'te yalnız node, git, kapı için bash).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = resolve(fileURLToPath(import.meta.url), '..', '..');
const PARALEL = join(KOK, 'mdk-paralel.mjs');
const nerede = (ad) => spawnSync('/usr/bin/which', [ad], { encoding: 'utf8' }).stdout.trim();
const T = mkdtempSync(join(tmpdir(), 'tasima-paralel-'));
const BIN = join(T, 'bin'); mkdirSync(BIN);
for (const ad of ['node', 'git', 'bash']) symlinkSync(ad === 'node' ? process.execPath : nerede(ad), join(BIN, ad));
// sahte opencode: istemdeki YAZ:<dosya>=<içerik> işaretlerini yazar
writeFileSync(join(BIN, 'opencode'), `#!/usr/bin/env node
const istem=process.argv[process.argv.length-1];
for (const m of istem.matchAll(/YAZ:([^ \`\\n]+)/g)) { const [f,i]=m[1].split('='); require('fs').writeFileSync(f, i+'\\n'); }
console.log(JSON.stringify({type:'step_finish',part:{tokens:{total:100},cost:0}}));
`);
chmodSync(join(BIN, 'opencode'), 0o755);

function depo(y1, y2, k2) {
  const R = join(mkdtempSync(join(T, 'p-')), 'proje'); mkdirSync(R);
  const g = (...a) => spawnSync('git', a, { cwd: R });
  g('init', '-q', '-b', 'main'); g('config', 'user.name', 't'); g('config', 'user.email', 't@t');
  writeFileSync(join(R, '.gitignore'), 'durum.json\nmetrikler.jsonl\n.mdk-log/\n');
  writeFileSync(join(R, 'PLAN.md'), `Yürütücü: opencode\nModeller: m/a\n\n## K\n- [ ] 1. Bir\n  - Ne: YAZ:${y1}\n  - Kapı: \`test -f ${y1.split('=')[0]}\`\n\n- [ ] 2. İki\n  - Ne: YAZ:${y2}\n  - Kapı: \`test -f ${k2}\`\n`);
  g('add', '-A'); g('commit', '-qm', 'c0');
  return R;
}
const kos = (R, nos) => spawnSync(process.execPath, [PARALEL, ...nos], { cwd: R, encoding: 'utf8', timeout: 90000, env: { HOME: T, PATH: BIN, MDK_OPENCODE: 'opencode', MDK_ONKONTROL_YOK: '1', MDK_KILIT: join(T, 'kilit'), MDK_KILIT_BEKLE: '1', POLL: '1', DENEME: '1', SURE: '20' } });

try {
  let R = depo('a.txt=A', 'b.txt=B', 'b.txt');
  let r = kos(R, ['1', '2']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const plan = readFileSync(join(R, 'PLAN.md'), 'utf8');
  assert.match(plan, /^- \[x\] 1\./m); assert.match(plan, /^- \[x\] 2\./m);
  assert.equal(readFileSync(join(R, 'a.txt'), 'utf8'), 'A\n');
  assert.equal(r.stdout.split('\n').filter((l) => /^\| [12] \|/.test(l)).length, 2, 'tabloda iki satır');

  R = depo('ortak.txt=A', 'ortak.txt=B', 'ortak.txt');
  r = kos(R, ['1', '2']);
  assert.equal(r.status, 9, r.stdout + r.stderr);
  assert.equal(readFileSync(join(R, 'ortak.txt'), 'utf8'), 'A\n');

  r = kos(R, []);
  assert.equal(r.status, 4, r.stdout + r.stderr);

  assert.match(readFileSync(join(KOK, 'mdk-paralel.sh'), 'utf8'), /exec node .*mdk-paralel\.mjs/);
} finally { rmSync(T, { recursive: true, force: true }); }
console.log('tasima-paralel.test ok');
