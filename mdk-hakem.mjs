// Kullanım (proje kökünde): mdk-hakem.mjs <adım-no> [plan-dosyası]
// Biten bir story için hakem modelleri her kabul ölçütüne ayrı ayrı geçti/geçmedi der.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { adimBlogu, agySaltOkuArgs, kos, metinAyikla, modelListesi, opencodeSec, oturumKapat, planSatiri } from './mdk-ortak.mjs';
import { anaOku, anaSec, gorevModelleri } from './mdk-ana.mjs';

export function hakemAyristir(metin, olcutSayisi) {
  const sayi = Number(olcutSayisi);
  if (!Number.isFinite(sayi) || sayi < 0) return null;
  const temizSatir = (s) => s.replace(/[*#]/g, '').replace(/^\s*[-–—]+\s*/, '').trim();
  const sonucNormalize = (s) => (/med/i.test(s.toLocaleLowerCase('tr-TR')) ? 'gecmedi' : 'gecti');
  const olcutler = new Map();
  let hukumSatiri = null;

  for (const ham of String(metin ?? '').split(/\r?\n/)) {
    const satir = temizSatir(ham);
    if (!satir) continue;
    const olcutEs = satir.match(/^([oö]l[cç][uü]t)\s*(\d+)\s*[:：]?\s*(ge[çcÇC](?:med|t)[iİıI])\s*(?:[-–—:]\s*)?(.*)$/iu);
    if (olcutEs) {
      const no = Number(olcutEs[2]);
      if (no >= 1 && no <= sayi) {
        olcutler.set(no, {
          no,
          sonuc: sonucNormalize(olcutEs[3]),
          gerekce: (olcutEs[4] || '').trim(),
        });
      }
      continue;
    }
    const hukumEs = satir.match(/^h[uü]k[uü]*m\s*[:：]?\s*(ge[çcÇC](?:med|t)[iİıI])/iu);
    if (hukumEs) {
      hukumSatiri = sonucNormalize(hukumEs[1]);
    }
  }

  const liste = [...olcutler.values()].sort((a, b) => a.no - b.no);
  let hukum = null;
  if (liste.some((o) => o.sonuc === 'gecmedi')) hukum = 'gecmedi';
  else if (liste.length === sayi && sayi > 0 && liste.every((o) => o.sonuc === 'gecti')) hukum = 'gecti';
  else if (liste.length === sayi && sayi === 0) hukum = 'gecti';
  else if (hukumSatiri) hukum = hukumSatiri;
  else hukum = null;

  if (hukum === null) return null;
  return { hukum, olcutler: liste };
}

const DIR = process.env.MDK_SELF_DIR || dirname(fileURLToPath(import.meta.url));
const dogrudan = Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;

if (dogrudan) {
  const N = process.argv[2];
  if (!N) { console.error('adım no gerekli'); process.exit(1); }
  const PLAN = process.argv[3] || 'PLAN.md';
  const POLL = Number(process.env.POLL || 3);
  const ILK = Number(process.env.ILK || 90);
  const SURE = Number(process.env.SURE || 300);
  const OC = opencodeSec(DIR);
  const LOGD = '.mdk-log';
  mkdirSync(LOGD, { recursive: true });
  const cik = (m, kod) => { console.log(m); process.exit(kod); };
  const git = (...a) => spawnSync('git', a, { encoding: 'utf8', maxBuffer: 64 << 20 });

  if (!existsSync(PLAN)) cik(`plan dosyası yok: ${PLAN}`, 4);
  const plan = readFileSync(PLAN, 'utf8');
  const blok = adimBlogu(plan, N);
  if (!blok) cik(`adım ${N} bulunamadı`, 4);

  const kabulSatirlari = blok.split('\n').filter((l) => /^\s*-\s+Kabul:/.test(l)); // yalnız alan satırı: Ne/Kapı notu içinde geçen `- Kabul:` örnekleri ölçüt değildir
  const olcutMetinleri = [];
  for (const l of kabulSatirlari) {
    const m = l.match(/^\s*-\s+Kabul:\s*(.*)/);
    if (m) olcutMetinleri.push(...m[1].split(';').map((s) => s.trim()).filter(Boolean));
  }
  if (!olcutMetinleri.length) cik(`adım ${N} için kabul ölçütü yok`, 4);

  const sha = (git('log', '-1', '--format=%H', '--grep', `^adım ${N}: `).stdout || '').trim();
  if (!sha) cik(`adım ${N} için commit yok ('adım ${N}: …' konusu)`, 4);
  const commitDiff = (git('show', sha).stdout || '').slice(0, 30000);

  const subject = (git('log', '-1', '--format=%s', '--grep', `^adım ${N}: `).stdout || '').trim();
  const yazanEs = subject.match(/\(([^,)]+),\s*(?:deneme\s*\d+|rol\s+\S+)\)\s*$/);
  const yazan = yazanEs ? yazanEs[1].trim() : null;
  if (!yazan) cik(`adım ${N} için kodu yazan model bulunamadı`, 4);

  const tanim = anaOku(process.env.MDK_YURUTUCULER || join(DIR, 'yurutuculer.json'));
  let ana = null;
  if (tanim.liste.length) {
    try {
      ana = anaSec(tanim, { plan, adimNo: typeof N !== 'undefined' ? Number(N) : undefined });
    } catch {}
  }

  const anaModeller = ana ? (gorevModelleri(ana, 'hakem') || gorevModelleri(ana, 'inceleme')) : null;
  const hakemSatiri = (anaModeller && anaModeller.length ? anaModeller.join(',') : null) ?? planSatiri(plan, 'Görev hakem');
  const incelemeSatiri = planSatiri(plan, 'Görev inceleme');
  const kaynakSatiri = hakemSatiri ?? incelemeSatiri;
  if (!kaynakSatiri) cik("PLAN'da 'Görev hakem:' ya da 'Görev inceleme:' satırı yok", 4);
  const MODELLER0 = modelListesi(kaynakSatiri);
  if (!MODELLER0.length) cik("'Görev hakem/inceleme:' satırı boş", 4);

  let ayniModel = false;
  let MODELLER = MODELLER0;
  if (MODELLER0.includes(yazan)) {
    const filtreli = MODELLER0.filter((m) => m !== yazan);
    if (filtreli.length) MODELLER = filtreli;
    else { MODELLER = MODELLER0; ayniModel = true; }
  }

  const testDosyalari = [];
  for (const l of blok.split('\n').filter((x) => /Kapı:/i.test(x))) {
    for (const m of l.matchAll(/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+/g)) {
      const f = m[0];
      if (!testDosyalari.includes(f) && existsSync(f)) testDosyalari.push(f);
    }
  }
  let kapiIcerik = '';
  for (const f of testDosyalari) {
    kapiIcerik += `\n--- ${f} ---\n${readFileSync(f, 'utf8').slice(0, 8000)}\n`;
  }

  const istem = `Aşağıda bir PLAN.md adımı ve o adıma ait commit diff'i var. Bu bir hakem görevi: kod yazma, dosya yaratma ya da değiştirme yok (plan ajanı salt-okunur).
Kabul ölçütleri:
${olcutMetinleri.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Adım (${N}):
${blok}

Kapı test dosyaları:${kapiIcerik}

Commit diff'i (git show ${sha}):
${commitDiff}

Yanıt biçimi: her ölçüt için tam olarak bir satır 'ÖLÇÜT <i>: GEÇTİ|GEÇMEDİ - gerekçe' yaz; son satır 'HÜKÜM: GEÇTİ|GEÇMEDİ' olsun. Kod yazma, dosya değiştirme.`;

  let sonuc = null;
  for (const m of MODELLER) {
    const log = join(LOGD, `hakem${N}-${Math.floor(Date.now() / 1000)}.jsonl`);
    if (m.startsWith('agy/')) {
      const ad = m.slice(4);
      await kos({
        komut: process.env.MDK_AGY || 'agy',
        args: agySaltOkuArgs(ad, istem),
        env: process.env,
        log,
        ilk: ILK,
        sure: SURE,
        poll: POLL * 1000,
      });
    } else {
      const env = { ...process.env, OPENCODE_LOG_LEVEL: 'error' };
      const { neden } = await kos({ komut: OC, args: ['run', '--format', 'json', '-m', m, '--title', `hakem-${N}`, '--agent', 'plan', istem], env, log, ilk: ILK, sure: SURE, poll: POLL * 1000 });
      if (neden) oturumKapat(OC, log, null);
    }
    const metin = metinAyikla(log);
    const ayr = hakemAyristir(metin, olcutMetinleri.length);
    if (ayr) { sonuc = { model: m, ayr }; break; }
    console.log(`adım ${N}: ${m} hakem yanıtı biçimsiz, yedek modele geçiliyor`);
  }

  if (!sonuc) cik(`adım ${N}: hiçbir model okunabilir hakem yanıtı vermedi`, 2);

  const { model, ayr } = sonuc;
  const kayit = {
    ts: new Date().toISOString(),
    adim: Number(N),
    model,
    yazan,
    hukum: ayr.hukum,
    olcutler: ayr.olcutler.map((o) => ({
      no: o.no,
      metin: olcutMetinleri[o.no - 1] ?? '',
      sonuc: o.sonuc,
      gerekce: o.gerekce,
    })),
    ayniModel,
  };
  appendFileSync(join(process.cwd(), 'hakem.jsonl'), JSON.stringify(kayit) + '\n');
  console.log(`HÜKÜM: ${ayr.hukum === 'gecti' ? 'GEÇTİ' : 'GEÇMEDİ'}`);
  process.exit(0);
}
