// Kullanım (proje kökünde): mdk-incele.mjs <adım-no> [plan-dosyası]
// İşlenmiş bir adımı plana karşı "Görev inceleme:" modelleriyle sordurur (plan ajanı, salt-okunur):
// istem = adım metni + o adımın commit diff'i. Yanıt ilk satırı `UYUM: <0-100>` olan metin olmalı;
// bozuksa yedek model denenir, o da bozuksa çıkış 2. Geçerli sonuç mdk-kayit.mjs ile inceleme kaydı
// olarak yazılır (uyum ≥80 uyumlu, 50-79 kismen, <50 uyumsuz).
// Çıkış: 0 inceleme yazıldı | 2 iki model de yorumlanabilir çıktı vermedi | 4 ön koşul (adım, commit ya da model bulunamadı)
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { adimBlogu, agySaltOkuArgs, kos, metinAyikla, modelListesi, opencodeSec, oturumKapat, planSatiri } from './mdk-ortak.mjs';
import { anaOku, anaSec, gorevModelleri } from './mdk-ana.mjs';

const DIR = process.env.MDK_SELF_DIR || dirname(fileURLToPath(import.meta.url));
const N = process.argv[2];
if (!N) { console.error('adım no gerekli'); process.exit(1); }
const PLAN = process.argv[3] || 'PLAN.md';
const POLL = Number(process.env.POLL || 3);   // süreç izleme aralığı, saniye
const ILK = Number(process.env.ILK || 90);    // model bu kadar saniyede hiç olay yazmazsa atlanır (kota sessizliği)
const SURE = Number(process.env.SURE || 300); // deneme başına süre sınırı, saniye
const OC = opencodeSec(DIR);
const LOGD = '.mdk-log'; mkdirSync(LOGD, { recursive: true });
const cik = (m, kod) => { console.log(m); process.exit(kod); };
const git = (...a) => spawnSync('git', a, { encoding: 'utf8', maxBuffer: 64 << 20 });

if (!existsSync(PLAN)) cik(`plan dosyası yok: ${PLAN}`, 4);
const plan = readFileSync(PLAN, 'utf8');
const blok = adimBlogu(plan, N);
if (!blok) cik(`adım ${N} bulunamadı`, 4);

// adımın commit'i: mdk-adim'in "adım N: …" konusu; yoksa HEAD'e düşme
const sha = (git('log', '-1', '--format=%H', '--grep', `^adım ${N}: `).stdout || '').trim();
if (!sha) cik(`adım ${N} için commit yok ('adım ${N}: …' konusu)`, 4);
const commitDiff = (git('show', sha).stdout || '').replace(/\n+$/, '');

const tanim = anaOku(process.env.MDK_YURUTUCULER || join(DIR, 'yurutuculer.json'));
let ana = null;
if (tanim.liste.length) {
  try {
    ana = anaSec(tanim, { plan, adimNo: typeof N !== 'undefined' ? Number(N) : undefined });
  } catch {}
}

const anaModeller = ana ? gorevModelleri(ana, 'inceleme') : null;
const modline = (anaModeller && anaModeller.length ? anaModeller.join(',') : null) ?? planSatiri(plan, 'Görev inceleme');
if (!modline) cik("PLAN'da 'Görev inceleme:' satırı yok", 4);
const MODELLER = modelListesi(modline);
if (!MODELLER.length) cik("'Görev inceleme:' satırı boş", 4);

const istem = `Aşağıda bir PLAN.md adımı ve o adıma ait commit diff'i var. Bu bir inceleme görevi: kod yazma, dosya yaratma ya da değiştirme yok (plan ajanı salt-okunur).
İstek: diff'in adımın 'Ne:' maddelerini gerçekten yaptığını, yarım ya da kapıyı geçirmek için boş bırakılmış bir çözüm bırakmadığını değerlendir; iş eksikse ya da anlamsızsa puanı düşür.
Biçim: İLK SATIR tam olarak 'UYUM: <0-100>' olsun; ardından en çok 5 maddede bulgularını yaz.

Adım (${N}):
${blok}

Commit diff'i (git show ${sha}):
${commitDiff}`;

let sinif = '', uyum = null;
for (const m of MODELLER) {
  const log = join(LOGD, `incele${N}-${Math.floor(Date.now() / 1000)}.jsonl`);
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
    const { neden } = await kos({ komut: OC, args: ['run', '--format', 'json', '-m', m, '--title', `incele-${N}`, '--agent', 'plan', istem], env, log, ilk: ILK, sure: SURE, poll: POLL * 1000 });
    if (neden) oturumKapat(OC, log, null);
  }
  const metin = metinAyikla(log);
  const ilkSatir = metin.split('\n')[0];
  const e = ilkSatir.match(/^UYUM: (\d+)$/);
  if (e && Number(e[1]) <= 100) {
    uyum = Number(e[1]);
    const maddeler = metin.split('\n').slice(1).map((s) => s.trim()).filter(Boolean).slice(0, 5).join(';');
    sinif = uyum >= 80 ? 'uyumlu' : uyum >= 50 ? 'kismen' : 'uyumsuz';
    spawnSync(process.execPath, [join(DIR, 'mdk-kayit.mjs'), N, '--inceleme', sinif, '--not', `UYUM ${uyum}: ${maddeler}`], { stdio: 'inherit' });
    break;
  }
  console.log(`adım ${N}: ${m} incelemesi biçimsiz yanıt verdi, yedek modele geçiliyor`);
}
if (!sinif) cik(`adım ${N}: iki model de yorumlanabilir inceleme çıktısı vermedi`, 2);

console.log(`UYUM: ${uyum}`);
console.log(`İnceleme: ${sinif} (metrikler.jsonl'a yazıldı)`);
if (uyum < 80) console.log("uyum < 80: diff'i Claude kendisi okumalı");
process.exit(0);
