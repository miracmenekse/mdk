import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync,
  rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
if (process.platform === 'win32') { console.log('atlandı (win32): POSIX vekil testi'); process.exit(0); }

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const FIGMA = join(ROOT, 'mdk-figma.mjs');

const nodeBinDir = mkdtempSync(join(tmpdir(), 'figma-nodebin-'));
symlinkSync(process.execPath, join(nodeBinDir, 'node'));

const bunFake = join(nodeBinDir, 'bun');
writeFileSync(bunFake, '#!/usr/bin/env node\nsetTimeout(() => {}, 30000);\n');
chmodSync(bunFake, 0o755);

const homeDir = mkdtempSync(join(tmpdir(), 'figma-home-'));
const workDir = mkdtempSync(join(tmpdir(), 'figma-work-'));
const ttfDir = join(workDir, 'ttf');
mkdirSync(join(ttfDir, 'src', 'cursor_mcp_plugin'), { recursive: true });
writeFileSync(join(ttfDir, 'src', 'socket.ts'), 'socket\n');
for (const f of ['code.js', 'ui.html', 'setcharacters.js']) {
  writeFileSync(join(ttfDir, 'src', 'cursor_mcp_plugin', f), `${f}\n`);
}

const pidFile = join(workDir, 'figma.pid');
const env = {
  ...process.env,
  PATH: nodeBinDir,
  HOME: homeDir,
  MDK_TTF_DIR: ttfDir,
  MDK_BUN: bunFake,
  MDK_FIGMA_PID: pidFile,
  MDK_FIGMA_PORT: '3055',
};

function run(args, extraEnv = {}) {
  return spawnSync(process.execPath, [FIGMA, ...args], {
    cwd: ROOT,
    env: { ...env, ...extraEnv },
    encoding: 'utf8',
  });
}

function canSignal(pid) {
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

try {
  // durum: başta çalışmıyor, çıkış 3
  let r = run(['durum']);
  assert.equal(r.status, 3, `durum1: ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /çalışmıyor/, 'durum1 mesajı');

  // start: çıkış 0, başlatıldı, PID dosyası var, süreç canlı
  r = run(['start']);
  assert.equal(r.status, 0, `start1: ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /başlatıldı/, 'start1 mesajı');
  assert.ok(existsSync(pidFile), 'PID dosyası var');
  const pid = readFileSync(pidFile, 'utf8').trim();
  assert.match(pid, /^\d+$/, 'PID sayısal');
  assert.match(r.stdout, new RegExp(`pid=${pid}`), 'start1 pid');
  assert.match(r.stdout, /port=3055/, 'start1 port');
  assert.ok(canSignal(pid), 'süreç canlı');

  // ikinci start: zaten çalışıyor, aynı PID
  const r2 = run(['start']);
  assert.equal(r2.status, 0, `start2: ${r2.status}\n${r2.stdout}\n${r2.stderr}`);
  assert.match(r2.stdout, /zaten çalışıyor/, 'start2 mesajı');
  assert.equal(readFileSync(pidFile, 'utf8').trim(), pid, 'aynı PID');

  // durum: çalışıyor
  const rd = run(['durum']);
  assert.equal(rd.status, 0, `durum2: ${rd.status}\n${rd.stdout}\n${rd.stderr}`);
  assert.match(rd.stdout, /çalışıyor/, 'durum2 mesajı');
  assert.match(rd.stdout, new RegExp(`pid=${pid}`), 'durum2 pid');

  // stop: süreç ölü, PID dosyası yok, durduruldu
  const rs = run(['stop']);
  assert.equal(rs.status, 0, `stop1: ${rs.status}\n${rs.stdout}\n${rs.stderr}`);
  assert.match(rs.stdout, /durduruldu/, 'stop1 mesajı');
  assert.match(rs.stdout, new RegExp(`pid=${pid}`), 'stop1 pid');
  await new Promise((coz) => setTimeout(coz, 500));
  assert.ok(!canSignal(pid), 'süreç öldü');
  assert.ok(!existsSync(pidFile), 'PID dosyası silindi');

  // ikinci stop: çalışmıyor, çıkış 0
  const rs2 = run(['stop']);
  assert.equal(rs2.status, 0, `stop2: ${rs2.status}\n${rs2.stdout}\n${rs2.stderr}`);
  assert.match(rs2.stdout, /çalışmıyor/, 'stop2 mesajı');

  // hemen ölen bun ile start: çıkış 1, PID dosyası kalmaz
  const dieBun = join(workDir, 'bun-die');
  writeFileSync(dieBun, '#!/usr/bin/env node\nprocess.exit(1);\n');
  chmodSync(dieBun, 0o755);
  const rdie = run(['start'], { MDK_BUN: dieBun });
  assert.equal(rdie.status, 1, `die start: ${rdie.status}\n${rdie.stdout}\n${rdie.stderr}`);
  assert.ok(!existsSync(pidFile), 'die sonrası PID dosyası yok');

  // eklenti: dört dosya kopyalanır, basılan yol var olan manifest.json
  const target = join(workDir, 'eklenti');
  const re = run(['eklenti', target]);
  assert.equal(re.status, 0, `eklenti: ${re.status}\n${re.stdout}\n${re.stderr}`);
  for (const f of ['code.js', 'ui.html', 'setcharacters.js', 'manifest.json']) {
    assert.ok(existsSync(join(target, f)), `hedef/${f} var`);
  }
  for (const f of ['code.js', 'ui.html', 'setcharacters.js']) {
    assert.equal(
      readFileSync(join(target, f), 'utf8'),
      readFileSync(join(ttfDir, 'src', 'cursor_mcp_plugin', f), 'utf8'),
      `${f} içeriği aynı`
    );
  }
  assert.equal(
    readFileSync(join(target, 'manifest.json'), 'utf8'),
    readFileSync(join(ROOT, 'figma', 'eklenti-manifest.json'), 'utf8'),
    'manifest içeriği aynı'
  );
  const manifestPath = re.stdout.trim();
  assert.equal(manifestPath, resolve(target, 'manifest.json'), 'basılan yol mutlak manifest');
  assert.ok(existsSync(manifestPath), 'basılan manifest var');

  // hedefsiz eklenti: geçici HOME altında talk-to-figma-eklenti
  const re2 = run(['eklenti']);
  assert.equal(re2.status, 0, `eklenti (hedefsiz): ${re2.status}\n${re2.stdout}\n${re2.stderr}`);
  const defaultTarget = join(homeDir, 'talk-to-figma-eklenti');
  assert.ok(existsSync(join(defaultTarget, 'manifest.json')), 'varsayılan hedef manifest var');
  assert.equal(re2.stdout.trim(), resolve(defaultTarget, 'manifest.json'), 'varsayılan hedef yol');

  // bilinmeyen komut: çıkış 2
  const ru = run(['xyz']);
  assert.equal(ru.status, 2, `bilinmeyen: ${ru.status}\n${ru.stdout}\n${ru.stderr}`);
  assert.match(`${ru.stdout}\n${ru.stderr}`, /kullanım/i, 'bilinmeyen kullanım mesajı');

  // .sh yönlendirici
  const sh = readFileSync(join(ROOT, 'mdk-figma.sh'), 'utf8');
  assert.match(sh, /exec node .*mdk-figma\.mjs/, '.sh node .mjs yönlendirici');
} finally {
  if (existsSync(pidFile)) {
    const p = readFileSync(pidFile, 'utf8').trim();
    if (p && canSignal(p)) {
      try { process.kill(Number(p)); } catch {}
    }
  }
  rmSync(nodeBinDir, { recursive: true, force: true });
  rmSync(homeDir, { recursive: true, force: true });
  rmSync(workDir, { recursive: true, force: true });
}

console.log('tasima-figma.test ok');
