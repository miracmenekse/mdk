import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync, mkdirSync, writeFileSync, readFileSync,
  existsSync, symlinkSync, rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
if (process.platform === 'win32') { console.log('atlandı (win32): POSIX vekil testi'); process.exit(0); }

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const ESITLE = join(ROOT, 'mdk-esitle.mjs');
const PANEL = join(ROOT, 'mdk-panel.mjs');

const nodeBinDir = mkdtempSync(join(tmpdir(), 'nodebin-'));
symlinkSync(process.execPath, join(nodeBinDir, 'node'));
const env = { ...process.env, PATH: nodeBinDir };

function run(script, args = [], extraEnv = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT,
    env: { ...env, ...extraEnv },
    encoding: 'utf8',
  });
}

// --- esitle ---
const evHome = mkdtempSync(join(tmpdir(), 'esitle-ev-'));
mkdirSync(join(evHome, '.claude'), { recursive: true });
const claudeMd = join(evHome, '.claude', 'CLAUDE.md');
writeFileSync(claudeMd, '# Bu makine\n\nÖzgü not.\n\n## Görev dağıtımı (modeller)\n- eski bayat kural gemini-4-argon\n');

const esitleRes = run(ESITLE, [], { MDK_ESITLE_EV: evHome });
assert.equal(esitleRes.status, 0, `esitle exit: ${esitleRes.status}\n${esitleRes.stderr}`);
assert.match(esitleRes.stdout, new RegExp(`mdk-esitle tamam \\(deneme evi: ${evHome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`));

const esit = join(ROOT, 'esit');
assert.ok(existsSync(join(evHome, '.config', 'opencode', 'AGENTS.md')));
assert.equal(readFileSync(join(evHome, '.config', 'opencode', 'AGENTS.md'), 'utf8'), readFileSync(join(esit, 'AGENTS.md'), 'utf8'));
assert.ok(existsSync(join(evHome, '.config', 'opencode', 'opencode.jsonc')));
assert.equal(readFileSync(join(evHome, '.config', 'opencode', 'opencode.jsonc'), 'utf8'), readFileSync(join(esit, 'opencode.jsonc'), 'utf8'));
assert.ok(existsSync(join(evHome, '.claude', 'skills', 'ba-pm-bakis', 'SKILL.md')));
assert.equal(readFileSync(join(evHome, '.claude', 'skills', 'ba-pm-bakis', 'SKILL.md'), 'utf8'), readFileSync(join(esit, 'ba-pm-bakis.SKILL.md'), 'utf8'));

const afterClaude = readFileSync(claudeMd, 'utf8');
assert.ok(afterClaude.includes('Özgü not.'));
assert.ok(!afterClaude.includes('eski bayat kural'));
assert.equal((afterClaude.match(/^## Görev dağıtımı/gm) || []).length, 1);
assert.equal(
  afterClaude.slice(afterClaude.indexOf('## Görev dağıtımı')).trim(),
  readFileSync(join(esit, 'gorev-dagitimi.md'), 'utf8').trim()
);

// --- panel ---
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
    srv.on('error', reject);
  });
}

const port = await freePort();
const pdir = mkdtempSync(join(tmpdir(), 'panel-dir-'));
writeFileSync(join(pdir, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');

const pidFile = join(pdir, '.mdk-log', 'panel.pid');

const start1 = run(PANEL, ['start', pdir, String(port)]);
assert.equal(start1.status, 0, `start1: ${start1.status}\n${start1.stderr}\n${start1.stdout}`);
assert.match(start1.stdout, /başlatıldı pid=/);
assert.ok(existsSync(pidFile));
const pid1 = readFileSync(pidFile, 'utf8').trim();
assert.match(pid1, /^\d+$/);

const durum1 = run(PANEL, ['durum', pdir, String(port)]);
assert.equal(durum1.status, 0, `durum1: ${durum1.status}\n${durum1.stdout}`);
assert.match(durum1.stdout, /çalışıyor/);

const apiRes = await fetch(`http://127.0.0.1:${port}/api/durum`);
assert.ok(apiRes.ok, `api status ${apiRes.status}`);
const apiBody = await apiRes.text();
assert.match(apiBody, /kategoriler/);

const start2 = run(PANEL, ['start', pdir, String(port)]);
assert.equal(start2.status, 0, `start2: ${start2.status}`);
assert.match(start2.stdout, /zaten çalışıyor/);
assert.equal(readFileSync(pidFile, 'utf8').trim(), pid1);

const stop = run(PANEL, ['stop', pdir, String(port)]);
assert.equal(stop.status, 0, `stop: ${stop.status}\n${stop.stderr}\n${stop.stdout}`);
assert.match(stop.stdout, /durduruldu/);

const durum2 = run(PANEL, ['durum', pdir, String(port)]);
assert.equal(durum2.status, 1, `durum2: ${durum2.status}`);
assert.match(durum2.stdout, /çalışmıyor/);

const unknown = run(PANEL, ['bilinmeyen', pdir, String(port)]);
assert.equal(unknown.status, 2, `unknown: ${unknown.status}`);

// --- .sh wrappers ---
for (const name of ['mdk-esitle.sh', 'mdk-panel.sh']) {
  const content = readFileSync(join(ROOT, name), 'utf8');
  const lines = content.replace(/\n+$/, '').split('\n');
  assert.ok(lines.length < 3, `${name} satır sayısı ${lines.length}`);
  assert.match(content, /exec node .*\.mjs/, `${name} exec .mjs değil`);
}

// cleanup temp dirs
rmSync(nodeBinDir, { recursive: true, force: true });
rmSync(evHome, { recursive: true, force: true });
rmSync(pdir, { recursive: true, force: true });
console.log('tasima-esitle-panel.test ok');
