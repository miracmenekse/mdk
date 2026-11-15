// Kullanım (proje kökünde):
//   node mdk-rol.mjs kodcu <adım-no> [plan=PLAN.md]   adımı ana yürütücünün kodcu modeline yaptırır, kapıyı koşar
//   node mdk-rol.mjs tasarimci <is-dosyası>           iş dosyasını ana yürütücünün tasarım modeline verir, sonucu tasarim.md'ye yazar
// Çıkış: 0 geçti/yazıldı | 1 kapı kırmızı, kurcalama ya da sonuç yazılmadı | 2 argüman hatası | 4 ön koşul ya da ortam (ana yürütücü, model, git)
import { existsSync, mkdirSync, readFileSync, writeFileSync, writeSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { anaOku, anaSec, rolModeli } from './mdk-ana.mjs';
import { adimBlogu, kos } from './mdk-ortak.mjs';
import { kabukKos, temizOrtam } from './mdk-adim-kapi.mjs';

const SELF = dirname(fileURLToPath(import.meta.url));
const yaz = (s) => writeSync(1, s + '\n');
const hataYaz = (s) => writeSync(2, s + '\n');
const oku = (y) => { try { return readFileSync(y, 'utf8'); } catch { return null; } };
const git = (...a) => spawnSync('git', a, { encoding: 'utf8', maxBuffer: 256 << 20 });
const cik = (kod) => process.exit(kod);

// "<önek>/<ad>" → [komut, argümanlar]; tanınmayan önek null
function rolKomutu(model, istem, ana) {
  const i = model.indexOf('/');
  if (i < 0) return null;
  const onek = model.slice(0, i), m = model.slice(i + 1);
  if (onek === 'claude') return [process.env.MDK_CLAUDE || 'claude', ['-p', '--model', m, '--permission-mode', 'acceptEdits', istem]];
  if (onek === 'agy') return [process.env.MDK_AGY || 'agy', ['-p', ...(m === 'varsayilan' ? [] : ['--model', m]), ...(ana.agy_ek || []), istem]];
  return null;
}

// PLAN başındaki "Kurallar" bloğu (boş satıra kadar); mdk-adim.mjs ile aynı çıkarım
function projeKurali(plan) {
  const c = []; let on = false;
  for (const l of plan.split(/\r?\n/)) { if (/^Kurallar/.test(l)) on = true; if (on && /^\s*$/.test(l)) break; if (on) c.push(l); }
  return c.join('\n').replace(/\n+$/, '');
}

// deneme kaydı: mdk-kayit.mjs metrikler.jsonl'a ve durum.json'a yazar (yalnız yoksayılan dosyalar)
function kayit(n, yurutucu, model, gecti, neden) {
  const args = [join(SELF, 'mdk-kayit.mjs'), String(n), '--yurutucu', yurutucu, '--model', model, '--gecti', String(gecti)];
  if (neden) args.push('--neden', neden);
  spawnSync(process.execPath, args, { stdio: 'ignore' });
}

async function main() {
  const [rol, hedef, planArg] = process.argv.slice(2);
  if (!['kodcu', 'tasarimci'].includes(rol) || !hedef) {
    hataYaz('Kullanım: node mdk-rol.mjs kodcu <adım-no> [plan] | node mdk-rol.mjs tasarimci <is-dosyası>');
    cik(2);
  }
  const tanim = anaOku();

  if (rol === 'tasarimci') {
    const isMetin = oku(hedef);
    if (isMetin === null) { yaz(`iş dosyası yok: ${hedef}`); cik(4); }
    let ana; try { ana = anaSec(tanim, {}); } catch (e) { yaz(e.message); cik(4); }
    const model = rolModeli(ana, 'tasarimci');
    if (!model || !rolKomutu(model, '', ana)) { yaz(`tanımsız ya da bilinmeyen tasarım modeli: ${model ?? '(yok)'}`); cik(4); }
    const once = oku('tasarim.md');
    const istem = `Tasarım görevi. Sonucu yalnız tasarim.md dosyasına yaz.\n\n${isMetin}`;
    mkdirSync('.mdk-log', { recursive: true });
    const [komut, args] = rolKomutu(model, istem, ana);
    const r = await kos({ komut, args, log: join('.mdk-log', `rol-tasarimci-${Date.now()}.jsonl`), env: temizOrtam(), ilk: Number(process.env.ILK || 120), sure: Number(process.env.SURE || 900) });
    if (r.kod === 127) { yaz(`komut bulunamadı: ${komut}`); cik(4); }
    if (r.neden) { yaz(`tasarım: ${r.neden}; sonuç yazılmadı`); cik(1); }
    if (oku('tasarim.md') === once) { yaz('tasarim.md değişmedi; sonuç yazılmadı'); cik(1); }
    git('add', '--', 'tasarim.md');
    git('commit', '-qm', `tasarım: ${basename(hedef)} (${model})`, '--', 'tasarim.md');
    yaz(`tasarım yazıldı: tasarim.md (${model})`);
    cik(0);
  }

  // kodcu
  const N = hedef;
  if (!/^\d+$/.test(N)) { hataYaz('adım no sayı olmalı'); cik(2); }
  const PLAN = planArg || 'PLAN.md';
  const plan = oku(PLAN);
  if (plan === null) { yaz(`plan dosyası yok: ${PLAN}`); cik(4); }
  let ana; try { ana = anaSec(tanim, { plan, adimNo: Number(N) }); } catch (e) { yaz(e.message); cik(4); }
  const blok = adimBlogu(plan, Number(N)).replace(/\s+$/, '');
  if (!blok) { yaz(`adım ${N} bulunamadı`); cik(4); }
  const ilkSatir = blok.split(/\r?\n/)[0];
  const baslik = ilkSatir.replace(/^- \[.\] [0-9]+\.\s*/, '');
  if (/^- \[x\]/.test(ilkSatir)) { yaz(`adım ${N} zaten bitmiş`); cik(0); }
  const kapilar = [...blok.matchAll(/^\s*- Kapı: `([^`]+)/gm)].map((m) => m[1]);
  if (!kapilar.length) { yaz(`adım ${N} için Kapı yok`); cik(4); }
  const model = rolModeli(ana, 'kodcu');
  if (!model || !rolKomutu(model, '', ana)) { yaz(`tanımsız ya da bilinmeyen kodcu modeli: ${model ?? '(yok)'}`); cik(4); }
  if (git('rev-parse', '--git-dir').status !== 0) { yaz('git deposu değil'); cik(4); }
  if (git('status', '--porcelain').stdout.trim()) { yaz('çalışma ağacı kirli; önce commit et'); cik(4); }
  const CP = git('rev-parse', 'HEAD').stdout.trim();

  const kurallar = (oku(join(SELF, 'yurutucu-kurallar.md')) || '').trim();
  const istem = `${kurallar}\n\nAşağıdaki adımı yap, yalnızca onu (PLAN.md adım ${N}; metnin tamamı burada). PLAN.md'yi açma.\n${projeKurali(plan)}\nAdım:\n${blok}`;
  mkdirSync('.mdk-log', { recursive: true });
  const [komut, args] = rolKomutu(model, istem, ana);
  const r = await kos({ komut, args, log: join('.mdk-log', `rol-kodcu-${Date.now()}.jsonl`), env: temizOrtam(), ilk: Number(process.env.ILK || 120), sure: Number(process.env.SURE || 900) });
  if (r.kod === 127) { yaz(`komut bulunamadı: ${komut}`); cik(4); }

  let neden = r.neden || null, kapiCikti = '';
  git('add', '-A');
  if (!neden) {
    // kurcalama: model kapı dosyasını ya da PLAN'ı eklemiş/değiştirmiş olamaz (eklenen dosya dahil)
    const kurcalama = git('diff', '--cached', '--name-only', '--no-renames', '--diff-filter=AMD', CP).stdout.split('\n').filter((f) => f && /(^|\/)test\/|^kapi\/|\.test\.[a-z]+$|^PLAN\.md$/.test(f));
    if (kurcalama.length) { yaz(`kurcalama: kapı dosyaları değiştirilmiş (${kurcalama.join(', ')}); deneme geçersiz`); neden = 'kurcalama'; }
  }
  if (!neden) {
    for (const k of kapilar) {
      const s = kabukKos(k, { env: temizOrtam() });
      if (!s.ok) { neden = 'kapi'; kapiCikti = s.metin; break; }
    }
  }

  if (neden) {
    git('reset', '-q', '--hard', CP); git('clean', '-fdq');
    kayit(N, ana.ad, model, false, neden);
    if (kapiCikti) yaz(kapiCikti.replace(/\n+$/, '').split('\n').slice(-30).join('\n'));
    yaz(`adım ${N} geçmedi (${model}: ${neden}); değişiklik geri alındı`);
    cik(1);
  }

  writeFileSync(PLAN, readFileSync(PLAN, 'utf8').replace(new RegExp(`^- \\[ \\] ${N}\\.`, 'gm'), `- [x] ${N}.`));
  git('add', '-A');
  git('commit', '-qm', `adım ${N}: ${baslik} (${model}, rol kodcu)`);
  kayit(N, ana.ad, model, true);
  yaz(`adım ${N} geçti (${model}, rol kodcu)`);
  cik(0);
}

main();
