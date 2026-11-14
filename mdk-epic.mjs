// Epic akışı: PLAN.md üzerinde Epic bloklarını okur/yazar.
// Kullanım:
//   node mdk-epic.mjs ac "<ad>" <is-dosyası>
//   node mdk-epic.mjs tartis <no> [--persona …] [--neden …]
//   node mdk-epic.mjs karar <no> onay
//   node mdk-epic.mjs gelistir <no>
//   node mdk-epic.mjs figma <no> <url>
//   node mdk-epic.mjs durum [no]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse, epicDurum } from './panel/plan.mjs';

const betikDizini = dirname(fileURLToPath(import.meta.url));

function hata(mesaj) {
  process.stderr.write(`${mesaj}\n`);
  process.exit(1);
}

function kullanim(mesaj) {
  process.stderr.write(`${mesaj}\n`);
  process.exit(2);
}

function gitDeposuMu(dir) {
  const r = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dir, encoding: 'utf8' });
  return r.status === 0;
}

function commitEt(no, komut) {
  if (!gitDeposuMu(process.cwd())) return;
  spawnSync('git', ['add', 'PLAN.md', `epic/${no}`], { cwd: process.cwd(), encoding: 'utf8' });
  spawnSync('git', ['commit', '-qm', `epic ${no}: ${komut}`], { cwd: process.cwd(), encoding: 'utf8' });
}

function tartismaDurum(no) {
  try {
    const j = JSON.parse(readFileSync(join('epic', String(no), 'tartisma.json'), 'utf8'));
    return j && typeof j === 'object' ? j.durum : null;
  } catch {
    return null;
  }
}

function findEpicHeadingIndex(lines, no) {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(?:Epic|Faz)\s+(\S+)/);
    if (m && m[1] === String(no)) return i;
  }
  return -1;
}

const ALAN_RE = /^\s*-\s+(Durum|Tartışma|Etki|Figma|Onay):/;

function setField(text, no, field, value) {
  const lines = String(text).split('\n');
  const idx = findEpicHeadingIndex(lines, no);
  if (idx < 0) throw new Error('Epic yok');
  let end = lines.length;
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) { end = i; break; }
  }
  let fieldIdx = -1;
  for (let i = idx + 1; i < end; i++) {
    if (new RegExp(`^\\s*-\\s+${field}:`).test(lines[i])) { fieldIdx = i; break; }
  }
  const yeniSatir = `- ${field}: ${value}`;
  if (fieldIdx !== -1) {
    lines[fieldIdx] = yeniSatir;
  } else {
    let lastField = idx;
    for (let i = idx + 1; i < end; i++) {
      if (ALAN_RE.test(lines[i])) lastField = i;
      else if (lines[i].trim() === '') continue;
      else break;
    }
    lines.splice(lastField + 1, 0, yeniSatir);
  }
  return lines.join('\n');
}

const argv = process.argv.slice(2);
if (argv.length === 0) kullanim('komut eksik');
const komut = argv[0];

if (komut === 'ac') {
  if (argv.length !== 3) kullanim('kullanım: mdk-epic.mjs ac "<ad>" <is-dosyası>');
  const ad = argv[1];
  const isDosyasi = argv[2];
  if (!ad) kullanim('ad eksik');
  let isIcerik;
  try { isIcerik = readFileSync(isDosyasi); } catch (e) { hata(`is dosyası okunamadı: ${isDosyasi}`); }
  let plan;
  try { plan = readFileSync('PLAN.md', 'utf8'); } catch (e) { hata('PLAN.md okunamadı'); }

  const parsed = parse(plan);
  let maxNo = 0;
  for (const k of parsed.kategoriler) {
    if (k.no && /^\d+$/.test(k.no)) {
      const n = Number(k.no);
      if (n > maxNo) maxNo = n;
    }
  }
  const no = maxNo + 1;

  const lines = plan.split('\n');
  const sonrakiIdx = lines.findIndex((l) => /^##\s+Sonraki iyileştirmeler\s*$/.test(l.trim()));
  let yeniPlan;
  if (sonrakiIdx !== -1) {
    lines.splice(sonrakiIdx, 0, `## Epic ${no} — ${ad}`, `- Durum: analiz`, '');
    yeniPlan = lines.join('\n');
  } else {
    yeniPlan = plan;
    if (!yeniPlan.endsWith('\n')) yeniPlan += '\n';
    yeniPlan += `\n## Epic ${no} — ${ad}\n- Durum: analiz\n\n`;
  }

  try {
    mkdirSync(join('epic', String(no)), { recursive: true });
    writeFileSync(join('epic', String(no), 'is.md'), isIcerik);
    writeFileSync('PLAN.md', yeniPlan);
  } catch (e) {
    hata(`yazma hatası: ${e.message}`);
  }
  commitEt(no, 'ac');
  process.stdout.write(`${no}\n`);
  process.exit(0);
} else if (komut === 'tartis') {
  if (argv.length < 2) kullanim('kullanım: mdk-epic.mjs tartis <no> [--persona …] [--neden …]');
  const no = argv[1];
  let plan;
  try { plan = readFileSync('PLAN.md', 'utf8'); } catch (e) { hata('PLAN.md okunamadı'); }
  const parsed = parse(plan);
  const kat = parsed.kategoriler.find((k) => k.no === no);
  if (!kat) hata('Epic yok');
  if (epicDurum(kat) !== 'analiz') hata('Epic analiz durumunda değil');

  const extra = argv.slice(2);
  const betik = process.env.MDK_EPIC_TARTIS || join(betikDizini, 'epic-tartis.mjs');
  const r = spawnSync(process.execPath, [betik, no, ...extra], { cwd: process.cwd(), env: process.env, encoding: 'utf8' });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  const code = r.status === null ? 1 : r.status;
  if (code !== 0) process.exit(code);

  try {
    const plan2 = readFileSync('PLAN.md', 'utf8');
    const yeni = setField(plan2, no, 'Tartışma', `epic/${no}`);
    writeFileSync('PLAN.md', yeni);
  } catch (e) {
    hata(e.message);
  }
  commitEt(no, 'tartis');
  process.exit(0);
} else if (komut === 'karar') {
  if (argv.length !== 3 || argv[2] !== 'onay') kullanim('kullanım: mdk-epic.mjs karar <no> onay');
  const no = argv[1];
  let plan;
  try { plan = readFileSync('PLAN.md', 'utf8'); } catch (e) { hata('PLAN.md okunamadı'); }
  const parsed = parse(plan);
  const kat = parsed.kategoriler.find((k) => k.no === no);
  if (!kat) hata('Epic yok');
  if (!kat.tartisma) hata('tartışma yok');
  if (tartismaDurum(no) !== 'bitti') hata('tartışma bitti değil');

  try {
    let yeni = plan;
    yeni = setField(yeni, no, 'Onay', 'evet');
    yeni = setField(yeni, no, 'Durum', 'tasarim');
    writeFileSync('PLAN.md', yeni);
  } catch (e) {
    hata(e.message);
  }
  commitEt(no, 'karar');
  process.exit(0);
} else if (komut === 'gelistir') {
  if (argv.length !== 2) kullanim('kullanım: mdk-epic.mjs gelistir <no>');
  const no = argv[1];
  let plan;
  try { plan = readFileSync('PLAN.md', 'utf8'); } catch (e) { hata('PLAN.md okunamadı'); }
  const parsed = parse(plan);
  const kat = parsed.kategoriler.find((k) => k.no === no);
  if (!kat) hata('Epic yok');
  if (!kat.adimlar || kat.adimlar.length === 0) hata('Epic\'te adım yok');
  if (kat.tartisma && !kat.onay) hata('onay yok');

  try {
    const yeni = setField(plan, no, 'Durum', 'gelistirme');
    writeFileSync('PLAN.md', yeni);
  } catch (e) {
    hata(e.message);
  }
  commitEt(no, 'gelistir');
  process.exit(0);
} else if (komut === 'figma') {
  if (argv.length !== 3) kullanim('kullanım: mdk-epic.mjs figma <no> <url>');
  const no = argv[1];
  const url = argv[2];
  if (!/^https:\/\/(www\.)?figma\.com\//.test(url)) hata('geçersiz figma url');
  let plan;
  try { plan = readFileSync('PLAN.md', 'utf8'); } catch (e) { hata('PLAN.md okunamadı'); }
  const parsed = parse(plan);
  const kat = parsed.kategoriler.find((k) => k.no === no);
  if (!kat) hata('Epic yok');

  try {
    const yeni = setField(plan, no, 'Figma', url);
    writeFileSync('PLAN.md', yeni);
  } catch (e) {
    hata(e.message);
  }
  commitEt(no, 'figma');
  process.exit(0);
} else if (komut === 'durum') {
  if (argv.length > 2) kullanim('kullanım: mdk-epic.mjs durum [no]');
  let plan;
  try { plan = readFileSync('PLAN.md', 'utf8'); } catch (e) { hata('PLAN.md okunamadı'); }
  const parsed = parse(plan);
  const hedefNo = argv[1];
  let epics;
  if (hedefNo) {
    const kat = parsed.kategoriler.find((k) => k.no === hedefNo);
    if (!kat) hata('Epic yok');
    epics = [kat];
  } else {
    epics = parsed.kategoriler.filter((k) => k.no !== null && epicDurum(k) !== 'tamamlandi');
  }
  const satirlar = [];
  for (const kat of epics) {
    const no = kat.no;
    const statu = epicDurum(kat);
    let hamle;
    if (statu === 'tamamlandi') {
      hamle = 'tamamlandı';
    } else if (statu === 'tasarim') {
      hamle = "story'leri yaz, sonra gelistir";
    } else if (statu === 'gelistirme') {
      const acik = (kat.adimlar || []).find((a) => !a.bitti);
      hamle = `story koştur (${acik ? acik.no : '?'})`;
    } else {
      const td = kat.tartisma ? tartismaDurum(no) : null;
      if (kat.tartisma && td === 'bitti' && !kat.onay) {
        hamle = 'kullanıcı onayı bekleniyor';
      } else {
        hamle = 'story yaz ya da tartis';
      }
    }
    satirlar.push(`Epic ${no} · ${statu} · sıradaki: ${hamle}`);
  }
  process.stdout.write(satirlar.length ? satirlar.join('\n') + '\n' : '');
  process.exit(0);
} else {
  kullanim(`bilinmeyen komut: ${komut}`);
}
