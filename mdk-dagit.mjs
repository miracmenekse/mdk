// Dağıtıcı: iki ana yürütücünün aynı projede paralel çalışması. Bir Epic'i bir ana yürütücüye kiralar,
// ona ayrı bir çalışma kopyası (worktree) açar, dosya çakışmasını engeller, biten işi testler yeşilse ana dala birleştirir.
// Kullanım:
//   node mdk-dagit.mjs kirala <epic> <ana>
//   node mdk-dagit.mjs birak <epic>
//   node mdk-dagit.mjs durum
//   node mdk-dagit.mjs birlestir <ana>
// Çıkış: 0 tamam · 1 test kırmızı (birleştirme geri alındı) · 2 kullanım · 4 ön koşul · 8 birleştirme kilitli · 9 çakışma
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { anaOku, anaBul } from './mdk-ana.mjs';
import { kilitAl, kilitBirak } from './mdk-ortak.mjs';

const BU = dirname(fileURLToPath(import.meta.url));
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 64 << 20 });
const kiraDizin = () => join(process.cwd(), '.mdk-log', 'kira');
const kiraYol = (no) => join(kiraDizin(), `${no}.json`);
const sureSn = () => Number(process.env.MDK_KIRA_SN ?? 7200);
const wtYol = (ad) => join(process.env.MDK_WT_KOK || dirname(process.cwd()), `${basename(process.cwd())}-${ad}`);

function fail(kod, mesaj) {
  process.stderr.write(`${mesaj}\n`);
  process.exit(kod);
}

// Epic'in "## Epic <no>" bölümündeki satırlar (başlık hariç); yoksa null
function epicBolumu(plan, no) {
  const satirlar = plan.split(/\r?\n/);
  const bas = satirlar.findIndex((l) => {
    const m = l.match(/^##\s+(?:Epic|Faz)\s+(\S+)/);
    return m && m[1] === String(no);
  });
  if (bas < 0) return null;
  let son = satirlar.length;
  for (let i = bas + 1; i < satirlar.length; i++) {
    if (/^##\s/.test(satirlar[i])) { son = i; break; }
  }
  return satirlar.slice(bas + 1, son);
}

// Epic'in bitmemiş story'lerinin "Ne:" satırlarındaki ters tırnaklı yollar (tekil)
export function epicDosyalari(plan, no) {
  const dosyalar = new Set();
  let acik = false;
  for (const l of epicBolumu(plan, no) ?? []) {
    const s = l.match(/^- \[( |x)\] /);
    if (s) { acik = s[1] === ' '; continue; }
    if (acik && /^\s*-\s+Ne:/.test(l)) {
      for (const m of l.matchAll(/`([\w./-]+\.[a-z]+)(?::[\d,-]+)?`/g)) dosyalar.add(m[1]);
    }
  }
  return [...dosyalar];
}

// Geçerli kiralar; süresi dolanlar (ya da bozuk olanlar) yok sayılır ve silinir
function kiralar() {
  if (!existsSync(kiraDizin())) return [];
  const sn = sureSn() * 1000;
  const cikti = [];
  for (const f of readdirSync(kiraDizin())) {
    if (!f.endsWith('.json')) continue;
    let k = null;
    try { k = JSON.parse(readFileSync(join(kiraDizin(), f), 'utf8')); } catch { k = null; }
    if (!k || typeof k.ts !== 'number' || Date.now() - k.ts >= sn) {
      try { unlinkSync(join(kiraDizin(), f)); } catch {}
      continue;
    }
    cikti.push(k);
  }
  return cikti;
}

function planOku() {
  try { return readFileSync('PLAN.md', 'utf8'); } catch { fail(4, 'PLAN.md okunamadı'); }
}

function kirala(no, ad) {
  if (!anaBul(anaOku(), ad)) fail(4, `tanınmayan ana yürütücü: ${ad}`);
  const plan = planOku();
  if (epicBolumu(plan, no) === null) fail(4, 'Epic yok');
  const dosyalar = epicDosyalari(plan, no);
  const aktif = kiralar();

  if (aktif.some((k) => k.epic === String(no) && k.ana !== ad)) {
    const sahip = aktif.find((k) => k.epic === String(no)).ana;
    fail(9, `Epic ${no} zaten ${sahip} yürütücüsünde`);
  }
  const cakisan = [];
  for (const k of aktif) {
    if (k.epic === String(no)) continue;
    for (const f of dosyalar) if ((k.dosyalar || []).includes(f)) cakisan.push(`${f} (Epic ${k.epic}, ${k.ana})`);
  }
  if (cakisan.length) fail(9, `dosya çakışması: ${cakisan.join(', ')}`);

  mkdirSync(kiraDizin(), { recursive: true });
  writeFileSync(kiraYol(no), JSON.stringify({ epic: String(no), ana: ad, ts: Date.now(), dosyalar }, null, 2) + '\n');
  const m = spawnSync(process.execPath, [join(BU, 'mdk-epic.mjs'), 'ana', String(no), ad], { cwd: process.cwd(), encoding: 'utf8' });
  if (m.status !== 0) {
    try { unlinkSync(kiraYol(no)); } catch {}
    fail(m.status ?? 4, (m.stderr || m.stdout || 'mdk-epic ana başarısız').trim());
  }

  const yol = wtYol(ad);
  if (!existsSync(yol)) {
    mkdirSync(dirname(yol), { recursive: true });
    const dal = `ana/${ad}`;
    const dalVarMi = git(process.cwd(), 'show-ref', '--verify', '-q', `refs/heads/${dal}`).status === 0;
    const r = dalVarMi
      ? git(process.cwd(), 'worktree', 'add', yol, dal)
      : git(process.cwd(), 'worktree', 'add', '-b', dal, yol, 'HEAD');
    if (r.status !== 0) fail(4, `worktree açılamadı: ${(r.stderr || '').trim()}`);
  }
  console.log(`kiralandı: Epic ${no} → ${ad} (${yol})`);
  process.exit(0);
}

function birak(no) {
  rmSync(kiraYol(no), { force: true });
  process.exit(0);
}

function durum() {
  const aktif = kiralar().sort((a, b) => Number(a.epic) - Number(b.epic));
  if (!aktif.length) { console.log('kira yok'); process.exit(0); }
  const sn = sureSn() * 1000;
  for (const k of aktif) {
    const kalan = Math.max(0, Math.ceil((sn - (Date.now() - k.ts)) / 60000));
    console.log(`Epic ${k.epic}\t${k.ana}\t${kalan} dk\t${(k.dosyalar || []).length} dosya`);
  }
  process.exit(0);
}

// Birleştirme: rebase, ff-only birleştirme, test; kırmızıysa ana dal eski hâline döner. Push yapmaz.
function birlestirIc(kok, ad, yol, dal, once) {
  const r = git(yol, 'rebase', dal);
  if (r.status !== 0) {
    git(yol, 'rebase', '--abort');
    return [9, `${ad} dalı ${dal} üstüne oturmadı (çakışma ya da kirli çalışma kopyası)`];
  }
  const ff = git(kok, 'merge', '--ff-only', `ana/${ad}`);
  if (ff.status !== 0) return [9, `ana dal ilerletilemedi: ${(ff.stderr || '').trim()}`];

  const t = spawnSync(process.env.MDK_BIRLESTIR_TEST || 'node test/hepsi.mjs', { cwd: kok, shell: true, encoding: 'utf8', maxBuffer: 64 << 20 });
  if (t.status !== 0) {
    git(kok, 'reset', '--hard', once);
    process.stderr.write(`${((t.stdout || '') + (t.stderr || '')).slice(-1500)}\n`);
    return [1, 'test kırmızı; ana dal birleştirme öncesi hâline döndü'];
  }
  const n = git(kok, 'rev-list', '--count', `${once}..ana/${ad}`).stdout.trim();
  return [0, `birleştirildi: ana/${ad} (${n} commit)`];
}

function birlestir(ad) {
  if (!anaBul(anaOku(), ad)) fail(4, `tanınmayan ana yürütücü: ${ad}`);
  const kok = process.cwd();
  if (git(kok, 'status', '--porcelain').stdout.trim()) fail(4, 'ana depo kirli; önce temizle');
  const yol = wtYol(ad);
  if (!existsSync(yol)) fail(4, `çalışma kopyası yok: ${yol}`);
  const dal = git(kok, 'rev-parse', '--abbrev-ref', 'HEAD').stdout.trim();
  const once = git(kok, 'rev-parse', 'HEAD').stdout.trim();

  const dizin = process.env.MDK_KILIT || join(homedir(), '.cache', 'mdk');
  mkdirSync(dizin, { recursive: true });
  const kilit = kilitAl(dizin, 'birlestir');
  if (!kilit) fail(8, 'birleştirme kilitli: başka bir birleştirme sürüyor');
  let sonuc;
  try {
    sonuc = birlestirIc(kok, ad, yol, dal, once);
  } finally {
    kilitBirak(kilit);
  }
  const [kod, mesaj] = sonuc;
  if (kod === 0) console.log(mesaj);
  else process.stderr.write(`${mesaj}\n`);
  process.exit(kod);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [komut, a, b] = process.argv.slice(2);
  if (komut === 'kirala' && a && b) kirala(a, b);
  else if (komut === 'birak' && a) birak(a);
  else if (komut === 'durum' && !a) durum();
  else if (komut === 'birlestir' && a) birlestir(a);
  else {
    process.stderr.write('Kullanım: mdk-dagit.mjs kirala <epic> <ana> | birak <epic> | durum | birlestir <ana>\n');
    process.exit(2);
  }
}
