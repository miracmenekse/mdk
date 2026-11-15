// Karar uyandırıcı: panelden gelen yeni kararı, kararın ait olduğu Epic'in ana yürütücüsüne kendiliğinden iletir.
// Kullanım: node mdk-uyandir.mjs [dizin=.] [--bir-kez]
//   --bir-kez: bir kez tara, işle, çık.
//   Aksi hâlde: etki/.karar-uyandirici'ye pid yazar, her 5 sn tarar; SIGTERM/SIGINT'te pid dosyasını silip çıkar.
// Okundu işareti etki/.karar-uyandi (karar-bekle'nin etki/.karar-okundu'suna dokunulmaz).
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, closeSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kararlar } from './panel/karar.mjs';
import { anaBul, anaOku, epicAnasi, planlayiciKomutu } from './mdk-ana.mjs';
import { kilitAl, kilitBirak, komutHazirla } from './mdk-ortak.mjs';

const BU = dirname(fileURLToPath(import.meta.url));
const argumanlar = process.argv.slice(2);
const birKez = argumanlar.includes('--bir-kez');
const dizinArg = argumanlar.find((a) => !a.startsWith('--'));
const kok = dizinArg ?? '.';

const etki = join(kok, 'etki');
const isaretDosya = join(etki, '.karar-uyandi');
const pidDosya = join(etki, '.karar-uyandirici');
const logDizin = join(kok, '.mdk-log');

const oku = (yol) => { try { return readFileSync(yol, 'utf8'); } catch { return ''; } };

function isaretOku() {
  const sayi = Number(oku(isaretDosya).trim());
  return Number.isInteger(sayi) ? sayi : 0;
}
function isaretYaz(ts) {
  mkdirSync(etki, { recursive: true });
  writeFileSync(isaretDosya, String(ts));
}

// karar-bekle ile aynı satır biçimi: "epic 3 onay: metin" ya da "adım 8 yorum: metin"
const satir = (k) => (k.epic !== undefined ? `epic ${k.epic} ${k.tur}` : `adım ${k.no} ${k.tur}`);
function metinli(k) {
  const metin = typeof k.metin === 'string' ? k.metin.replace(/\r?\n/g, ' ') : '';
  return metin === '' ? satir(k) : `${satir(k)}: ${metin}`;
}

// Epic başlığı "## Epic <no>" ya da eski "## Faz <no>" (mdk-epic.mjs ile aynı); bloğu sonraki "## " satırına kadardır
function epicAnaAdi(plan, epic) {
  const satirlar = plan.split(/\r?\n/);
  const bas = satirlar.findIndex((l) => {
    const m = l.match(/^##\s+(?:Epic|Faz)\s+(\S+)/);
    return m !== null && m[1] === String(epic);
  });
  if (bas < 0) return null;
  for (let i = bas + 1; i < satirlar.length && !/^## /.test(satirlar[i]); i++) {
    const m = satirlar[i].match(/^- Ana: (.+)$/);
    if (m) return m[1].trim();
  }
  return null;
}

// Karar ana adı: epic alanı varsa Epic'in Ana satırı, no varsa adımın Epic'i; yoksa null
const anaAdi = (plan, k) => (k.epic !== undefined ? epicAnaAdi(plan, k.epic) : epicAnasi(plan, k.no));

const istemOlustur = (metin) => `Panelden karar geldi: ${metin}. Proje kuralların .mdk/planlayici.md dosyasında; o kurallara göre bu kararı işle ve sıradaki hamleyi node ${join(BU, 'mdk-epic.mjs')} durum ile belirle.`;

// yorum/red kararında karar modeli metni sınıflandırır; sonucu istemin sonuna eklenecek cümle olarak döner.
// Model başarısızsa (varsayılan) ya da metin yoksa '' döner ve istem eskisi gibi kalır.
function yorumSinifi(karar) {
  if (!['yorum', 'red'].includes(karar.tur) || typeof karar.metin !== 'string' || karar.metin.trim() === '') return '';
  mkdirSync(logDizin, { recursive: true });
  const girdi = join(logDizin, `yorum-${karar.ts}.txt`);
  writeFileSync(girdi, karar.metin);
  const r = spawnSync(process.execPath, [join(BU, 'mdk-karar.mjs'), 'yorum', girdi, join(kok, 'PLAN.md')], { cwd: kok, encoding: 'utf8', env: process.env, timeout: 300000, stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    const o = JSON.parse((r.stdout || '').trim().split('\n').pop());
    if (o.varsayilan) return '';
    return ` Karar modeli bu yorumu "${o.secim}" olarak sınıfladı (${o.gerekce}).`;
  } catch { return ''; }
}

// MDK_UYANDIR_KOMUT (testler) verilirse o betik [ana adı, istem] ile çağrılır
function komutuKur(ana, istem) {
  const ozel = process.env.MDK_UYANDIR_KOMUT;
  const [komut, args] = ozel ? [ozel, [ana.ad, istem]] : planlayiciKomutu(ana, istem);
  return komutHazirla(komut, args);
}

// çıktı log dosyasına yazılır; süreç bitince çözülür (beklenir, ayrık değil)
function calistir(cmd, args, logYol) {
  return new Promise((coz) => {
    const fd = openSync(logYol, 'a');
    const bitti = () => { try { closeSync(fd); } catch {} coz(); };
    const c = spawn(cmd, args, { cwd: kok, stdio: ['ignore', fd, fd] });
    c.on('error', (e) => { appendFileSync(logYol, `${e.message}\n`); bitti(); });
    c.on('close', bitti);
  });
}

// işlenmemiş kararları ts sırasıyla işler; ana yürütücü meşgulse kalan kararlar sırayla beklemek için durur
async function tara() {
  const tanim = anaOku();
  const plan = oku(join(kok, 'PLAN.md'));
  const isaret = isaretOku();
  const bekleyen = kararlar(kok)
    .filter((k) => Number.isFinite(k.ts) && k.ts > isaret)
    .sort((a, b) => a.ts - b.ts);

  for (const karar of bekleyen) {
    const s = metinli(karar);
    const ana = anaBul(tanim, anaAdi(plan, karar) ?? tanim.varsayilan);
    if (!ana) {
      process.stdout.write(`atlandı: ${s} (tanınmayan ana yürütücü)\n`);
      isaretYaz(karar.ts);
      continue;
    }
    mkdirSync(logDizin, { recursive: true });
    const kilit = kilitAl(logDizin, `uyandir-${ana.ad}`);
    if (!kilit) break;
    try {
      const [cmd, args] = komutuKur(ana, istemOlustur(s) + yorumSinifi(karar));
      await calistir(cmd, args, join(logDizin, `uyandir-${karar.ts}.log`));
    } finally {
      kilitBirak(kilit);
    }
    isaretYaz(karar.ts);
    process.stdout.write(`uyandırıldı: ${ana.ad} ← ${s}\n`);
  }
}

if (birKez) {
  await tara();
} else {
  mkdirSync(etki, { recursive: true });
  writeFileSync(pidDosya, String(process.pid));
  const durdur = () => {
    try { unlinkSync(pidDosya); } catch {}
    process.exit(0);
  };
  process.on('SIGTERM', durdur);
  process.on('SIGINT', durdur);
  let mesgul = false;
  const dongu = () => {
    if (mesgul) return;
    mesgul = true;
    tara().catch((e) => process.stderr.write(`${e.message}\n`)).finally(() => { mesgul = false; });
  };
  dongu();
  setInterval(dongu, 5000);
}
