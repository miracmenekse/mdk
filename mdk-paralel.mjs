// Kullanım (proje kökünde): mdk-paralel.mjs <no> <no>...
// Her adımı kendi git worktree'sinde (dal mdk/<no>, ana dalın HEAD'inden) mdk-adim.mjs ile paralel koşturur.
// Geçenleri numara sırasıyla ana dala cherry-pick eder ve PLAN.md'de [x] işaretler.
// Çıkış: 0 hepsi işlendi | 2 en az bir adım geçmedi (geçenler işlendi) | 9 çakışma | 4 argüman yok ya da ana ağaç kirli
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync, writeSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const SELF = dirname(fileURLToPath(import.meta.url));
const yaz = (s) => writeSync(1, s + '\n');
const hata = (s, kod) => { writeSync(2, s + '\n'); process.exit(kod); };
const git = (...a) => spawnSync('git', a, { encoding: 'utf8', maxBuffer: 256 << 20 });
const oku = (y) => { try { return readFileSync(y, 'utf8'); } catch { return ''; } };

const args = process.argv.slice(2);
if (!args.length) hata('kullanım: mdk-paralel.sh <no> <no>...', 4);
const kok = git('rev-parse', '--show-toplevel');
if (kok.status !== 0) hata('git deposu değil', 4);
const ANA = kok.stdout.trim();
process.chdir(ANA);
if (git('status', '--porcelain').stdout.trim()) hata('ana ağaç kirli; önce commit et', 4);

const NOS = [...args].sort((a, b) => Number(a) - Number(b));
const ALAN = basename(ANA), WTD = join(dirname(ANA), '.mdk-wt'), LOGD = join(ANA, '.mdk-log');
mkdirSync(LOGD, { recursive: true }); mkdirSync(WTD, { recursive: true });
const metrikSatirlari = () => oku('metrikler.jsonl').split('\n').filter(Boolean);
const M0 = metrikSatirlari().length;
const RC = {}, SN = {}, MOD = {}, CP = {};
const wtYol = (n) => join(WTD, `${ALAN}-${n}`);

git('worktree', 'prune');
const isler = NOS.map((n) => {
  const wt = wtYol(n), logYol = join(LOGD, `paralel-${n}.log`);
  if (existsSync(wt)) git('worktree', 'remove', '--force', wt);
  const ac = git('worktree', 'add', '-q', '-B', `mdk/${n}`, wt, 'HEAD');
  if (ac.status !== 0) { writeFileSync(logYol, ac.stderr || ''); RC[n] = 4; SN[n] = 0; writeSync(2, `worktree açılamadı: adım ${n}\n`); return Promise.resolve(); }
  const fd = openSync(logYol, 'w'), t0 = Date.now();
  const env = { ...process.env, MDK_PLAN_DOKUNMA: '1', MDK_METRIK: join(ANA, 'metrikler.jsonl'), MDK_DURUM: join(ANA, 'durum.json') };
  delete env.MDK_DONMUS;
  const c = spawn(process.execPath, [join(SELF, 'mdk-adim.mjs'), n], { cwd: wt, env, stdio: ['ignore', fd, fd] });
  closeSync(fd);
  return new Promise((coz) => {
    c.on('error', () => { RC[n] = 4; SN[n] = 0; coz(); });
    c.on('exit', (k) => { RC[n] = k ?? 4; SN[n] = Math.round((Date.now() - t0) / 1000); coz(); });
  });
});
await Promise.all(isler);

const yeni = metrikSatirlari().slice(M0);
for (const n of NOS) {
  const s = yeni.filter((l) => l.includes(`"adim":${n},`)).pop();
  let m = '-'; try { m = JSON.parse(s).model || '-'; } catch {}
  MOD[n] = m;
}
const sonuc = (k) => ({ 0: 'geçti', 2: 'eskale', 4: 'ön koşul', 6: 'sağlayıcı', 8: 'kilitli' }[k] ?? `hata ${k}`);

// geçenleri numara sırasıyla ana dala al; çakışmada dur (yarım kalan cherry-pick iptal edilir)
let CAKISMA = '';
for (const n of NOS) {
  if (RC[n] !== 0) continue;
  const C = git('rev-list', '--reverse', `HEAD..mdk/${n}`).stdout.split('\n').filter(Boolean);
  if (C.length) {
    const r = git('cherry-pick', ...C);
    writeFileSync(join(LOGD, `cp-${n}.log`), (r.stdout || '') + (r.stderr || ''));
    if (r.status !== 0) { git('cherry-pick', '--abort'); CP[n] = 'çakıştı'; CAKISMA = n; break; }
  }
  CP[n] = 'alındı';
  writeFileSync('PLAN.md', oku('PLAN.md').replace(new RegExp(`^- \\[ \\] ${n}\\.`, 'gm'), `- [x] ${n}.`));
  if (git('diff', '--quiet', '--', 'PLAN.md').status !== 0) { git('add', 'PLAN.md'); git('commit', '-qm', `adım ${n}: [x] işaretlendi (paralel)`); }
}

// biten worktree'leri sil; dallar kalır
for (const n of NOS) if (existsSync(wtYol(n))) git('worktree', 'remove', '--force', wtYol(n));
for (const n of NOS) if (existsSync(wtYol(n))) rmSync(wtYol(n), { recursive: true, force: true });
git('worktree', 'prune');

yaz('| adım | model | sonuç | sn |');
yaz('|---|---|---|---|');
for (const n of NOS) {
  let s = sonuc(RC[n]);
  if (RC[n] === 0 && !CP[n]) s += ', işlenmedi';
  if (CP[n]) s += `, ana dala ${CP[n]}`;
  yaz(`| ${n} | ${MOD[n]} | ${s} | ${SN[n]} |`);
}
if (CAKISMA) hata(`ÇAKIŞMA: adım ${CAKISMA} (dal mdk/${CAKISMA}) ana dala alınamadı; sonraki adımlar işlenmedi`, 9);
process.exit(NOS.every((n) => RC[n] === 0) ? 0 : 2);
