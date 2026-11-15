// Node testlerinin ortak yardımcıları: geçici git deposu, sahte opencode/cursor (.mjs), koşturma, metrik, yetim süreç.
// Sahte betikler .mjs: koşturucular komut .mjs ise node ile başlatır (Windows'ta da çalışır).
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

export const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
export const WIN = process.platform === 'win32';
export const uyu = (ms) => new Promise((coz) => setTimeout(coz, ms));
export const oku = (y) => { try { return readFileSync(y, 'utf8'); } catch { return ''; } };
export const gecici = (on = 'mdk-test-') => mkdtempSync(join(tmpdir(), on));
export const git = (R, ...a) => spawnSync('git', a, { cwd: R, encoding: 'utf8' });

// bash'teki kontrol(): hatayı biriktirir, sonda bitir() özet basar ve çıkış kodunu verir
export function denetci(ad) {
  let fail = false, vaka = '';
  return {
    vaka: (v) => { vaka = v; console.log(`· ${v}`); },
    kontrol: (kosul, mesaj, ek = '') => { if (!kosul) { fail = true; console.log(`BAŞARISIZ [${vaka}]: ${mesaj}${ek ? `\n${String(ek).slice(-1500)}` : ''}`); } },
    bitir: () => { console.log(fail ? `${ad} BAŞARISIZ` : `${ad} ok`); process.exit(fail ? 1 : 0); },
  };
}

// geçici git deposu: .gitignore + dosyalar + ilk commit
export function depo(dosyalar = {}, { R, dal } = {}) {
  R = R || join(gecici(), 'repo'); mkdirSync(R, { recursive: true });
  git(R, 'init', '-q', ...(dal ? ['-b', dal] : [])); git(R, 'config', 'user.name', 't'); git(R, 'config', 'user.email', 't@t');
  writeFileSync(join(R, '.gitignore'), 'durum.json\nmetrikler.jsonl\n.mdk-log/\n');
  for (const [f, i] of Object.entries(dosyalar)) { mkdirSync(dirname(join(R, f)), { recursive: true }); writeFileSync(join(R, f), i); }
  return R;
}
export const commit = (R, m = 'c0') => { git(R, 'add', '-A'); git(R, 'commit', '-qm', m); return git(R, 'rev-parse', 'HEAD').stdout.trim(); };

// sahte opencode: argümanları ayrıştırır, sayaç/modeller.log/istem/izin/yalıtım kaydeder, davran gövdesini koşar.
// gövdede kullanılabilir: M (model), n (çağrı no), A (argümanlar), ISTEM, D (STUB_DIR), fs, uyu(sn), yaz(f,i),
// olay(o), metin(t) (text olayı), yetim(isaret) (aynı süreç grubunda uzun yaşayan çocuk)
export function stub(D, govde, { son = true, ad = 'opencode.mjs' } = {}) {
  mkdirSync(D, { recursive: true });
  const yol = join(D, ad);
  writeFileSync(yol, `import fs from 'node:fs'; import { spawn } from 'node:child_process';
const A = process.argv.slice(2), D = process.env.STUB_DIR || ${JSON.stringify(D)};
const al = (b) => (A.includes(b) ? A[A.indexOf(b) + 1] : '');
const M = al('-m') || al('--model'), AJAN = al('--agent'), ISTEM = A[A.length - 1] || '';
const n = Number(fs.existsSync(D + '/sayac') ? fs.readFileSync(D + '/sayac', 'utf8') : 0) + 1; fs.writeFileSync(D + '/sayac', String(n));
if (A[0] !== 'api') {
  fs.appendFileSync(D + '/modeller.log', M + '\\n'); fs.appendFileSync(D + '/cagri.log', M + '|' + AJAN + '\\n');
  fs.writeFileSync(D + '/argv', A.join('\\n') + '\\n'); fs.writeFileSync(D + '/istem-' + n + '.txt', ISTEM);
  fs.writeFileSync(D + '/izin-' + n + '.json', process.env.OPENCODE_CONFIG_CONTENT || '');
  fs.writeFileSync(D + '/yalitim-' + n + '.txt', process.env.OPENCODE_DISABLE_CLAUDE_CODE || '');
  fs.writeFileSync(D + '/loglevel', (process.env.OPENCODE_LOG_LEVEL || '') + '\\n');
} else fs.appendFileSync(D + '/interrupt.log', A.join(' ') + '\\n');
const uyu = (s) => new Promise((r) => setTimeout(r, s * 1000));
const yaz = (f, i) => fs.writeFileSync(f, i);
const olay = (o) => process.stdout.write(JSON.stringify(o) + '\\n');
const metin = (t) => olay({ type: 'text', part: { type: 'text', text: t } });
const yetim = (isaret) => spawn(process.execPath, ['-e', 'setTimeout(()=>{},600000)', isaret], { stdio: 'ignore' });
${govde}
${son ? "if (A[0] !== 'api') olay({ type: 'step_finish', part: { tokens: { total: 100 }, cost: 0 } });" : ''}
`);
  return yol;
}

// koşturucuyu node ile koştur (eşzamanlı); iç MDK değişkenleri dışarıdan sızmasın
export function temizEnv(ek = {}) {
  const e = { ...process.env };
  for (const k of ['MDK_DONMUS', 'MDK_SELF_DIR', 'MDK_METRIK', 'MDK_DURUM', 'MDK_PLAN_DOKUNMA', 'MDK_KILIT', 'MDK_OPENCODE', 'MDK_CURSOR', 'OPENCODE_CONFIG_CONTENT', 'OPENCODE_DISABLE_CLAUDE_CODE', 'HEPSI_HIZLI', 'MDK_HAKEM', 'MDK_HAKEM_ARKA', 'MDK_GECICI_TEKRAR', 'MDK_GECICI_BEKLE_MS', 'MDK_ANA', 'MDK_YURUTUCULER', 'MDK_AGY', 'MDK_CLAUDE']) delete e[k];
  return { OPENCODE_DB: join(tmpdir(), 'mdk-test-yok.db'), ...e, ...ek };
}
export function kos(betik, args, { cwd, env = {}, zaman = 120000 } = {}) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [betik, ...args], { cwd, env: temizEnv(env), encoding: 'utf8', timeout: zaman, maxBuffer: 64 << 20 });
  return { kod: r.status, cikti: (r.stdout || '') + (r.stderr || ''), sn: (Date.now() - t0) / 1000 };
}
// arka planda koştur (paralel vakalar için); Promise {kod, cikti, sn}
export function kosArka(betik, args, { cwd, env = {} } = {}) {
  const t0 = Date.now();
  return new Promise((coz) => {
    const c = spawn(process.execPath, [betik, ...args], { cwd, env: temizEnv(env), stdio: ['ignore', 'pipe', 'pipe'] });
    let o = ''; c.stdout.on('data', (x) => (o += x)); c.stderr.on('data', (x) => (o += x));
    c.on('close', (k) => coz({ kod: k, cikti: o, sn: (Date.now() - t0) / 1000 }));
  });
}

export const metrikler = (yol) => oku(yol).split('\n').filter(Boolean).map((l) => JSON.parse(l));
export const satirlar = (yol) => oku(yol).split('\n').filter(Boolean);
// aynı işaretle yaşayan yetim süreç var mı (POSIX; Windows'ta denetlenmez)
export const yetimVar = (isaret) => !WIN && spawnSync('pgrep', ['-f', isaret]).status === 0;
export const ekle = appendFileSync;
export { existsSync, readFileSync, writeFileSync, mkdirSync, join };
