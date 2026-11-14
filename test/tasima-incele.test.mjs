// Kapı (adım 153): mdk-incele.mjs bash/grep/sed olmadan çalışır (Windows vekili: PATH'te yalnız node, git, sahte opencode).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
if (process.platform === 'win32') { console.log('atlandı (win32): POSIX vekil testi'); process.exit(0); }

const KOK = resolve(fileURLToPath(import.meta.url), '..', '..');
const INCELE = join(KOK, 'mdk-incele.mjs');
const nerede = (ad) => spawnSync('/usr/bin/which', [ad], { encoding: 'utf8' }).stdout.trim();
const T = mkdtempSync(join(tmpdir(), 'tasima-incele-'));
const BIN = join(T, 'bin'); mkdirSync(BIN);
symlinkSync(process.execPath, join(BIN, 'node'));
symlinkSync(nerede('git'), join(BIN, 'git'));
// sahte opencode: -m modeline göre YANIT_<model> dosyasındaki metni text olayı olarak basar
writeFileSync(join(BIN, 'opencode'), `#!/usr/bin/env node
const fs=require('fs'),a=process.argv.slice(2);const m=a[a.indexOf('-m')+1];
fs.appendFileSync(process.env.STUB_DIR+'/cagri.log',m+'\\n');
const y=fs.readFileSync(process.env.STUB_DIR+'/y-'+m.replace('/','_'),'utf8');
console.log(JSON.stringify({type:'text',part:{type:'text',text:y}}));
`);
chmodSync(join(BIN, 'opencode'), 0o755);

function depo(y1, y2) {
  const R = mkdtempSync(join(T, 'r-'));
  writeFileSync(join(T, 'y-m_i1'), y1); writeFileSync(join(T, 'y-m_i2'), y2); rmSync(join(T, 'cagri.log'), { force: true });
  const g = (...a) => spawnSync(nerede('git'), a, { cwd: R });
  g('init', '-q'); g('config', 'user.name', 't'); g('config', 'user.email', 't@t');
  writeFileSync(join(R, '.gitignore'), 'durum.json\nmetrikler.jsonl\n.mdk-log/\n');
  writeFileSync(join(R, 'PLAN.md'), 'Yürütücü: opencode\nGörev inceleme: m/i1, m/i2\n\n## K\n- [x] 1. Bir\n  - Ne: x yaz\n  - Kapı: `true`\n- [ ] 2. İki\n  - Kapı: `true`\n');
  g('add', '-A'); g('commit', '-qm', 'c0');
  writeFileSync(join(R, 'x.txt'), 'x\n'); g('add', '-A'); g('commit', '-qm', 'adım 1: Bir (m/a, deneme 1)');
  return R;
}
const kos = (R, n) => spawnSync(process.execPath, [INCELE, String(n)], { cwd: R, encoding: 'utf8', env: { HOME: T, PATH: BIN, STUB_DIR: T, MDK_OPENCODE: 'opencode', POLL: '1' } });
const kayit = (R) => (existsSync(join(R, 'metrikler.jsonl')) ? readFileSync(join(R, 'metrikler.jsonl'), 'utf8') : '');

try {
  let R = depo('UYUM: 85\n- uygun', 'UYUM: 10');
  let r = kos(R, 1);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /UYUM: 85/);
  assert.match(kayit(R), /"inceleme":"uyumlu"/);

  R = depo('bilmiyorum', 'UYUM: 60\n- eksik');
  r = kos(R, 1);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /yedek modele geçiliyor/);
  assert.match(kayit(R), /"inceleme":"kismen"/);

  R = depo('olmaz', 'UYUM: yüksek');
  r = kos(R, 1);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.equal(kayit(R), '');

  R = depo('UYUM: 90', 'UYUM: 90');
  r = kos(R, 2);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.ok(!existsSync(join(T, 'cagri.log')), 'commit yokken model çağrılmaz');

  assert.match(readFileSync(join(KOK, 'mdk-incele.sh'), 'utf8'), /exec node .*mdk-incele\.mjs/);
} finally { rmSync(T, { recursive: true, force: true }); }
console.log('tasima-incele.test ok');
