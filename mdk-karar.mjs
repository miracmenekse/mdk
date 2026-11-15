// Karar modeli: bir story tüm modellerde başarısız olunca ya da panelden serbest bir yorum gelince, ucuz bir modele
// sınıflandırtır. Kullanım (proje kökünde): node mdk-karar.mjs <tür> <girdi-dosyası> [plan=PLAN.md]
//   tür: basarisizlik → kapi_yanlis | model_zayif | plan_belirsiz | ortam
//        yorum        → onay | red | soru | degisiklik
// Çıktı: stdout'a tek satır JSON { tur, secim, gerekce, model, varsayilan }; kökte kararmodel.jsonl'a ts ile eklenir.
// Model sırası PLAN'daki "Görev karar:" (yoksa "Görev hakem:") satırından gelir; ikisi de yoksa model çağrılmaz.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { kos, metinAyikla, modelListesi, opencodeSec, oturumKapat, planSatiri } from './mdk-ortak.mjs';

export const TURLER = {
  basarisizlik: {
    secenekler: ['kapi_yanlis', 'model_zayif', 'plan_belirsiz', 'ortam'],
    varsayilan: 'model_zayif',
    aciklama: 'Bir story tüm modellerde başarısız oldu. Nedenin kapıdaki bir yanlış (kapi_yanlis), modelin zayıflığı (model_zayif), planın belirsizliği (plan_belirsiz) ya da ortam sorunu (ortam) olduğunu seç. Girdide son kapı çıktısı, SORUN.md ve adım metni var.',
  },
  yorum: {
    secenekler: ['onay', 'red', 'soru', 'degisiklik'],
    varsayilan: 'soru',
    aciklama: 'Panelden bir kullanıcı yorumu geldi. Yorumun onay (kabul), red (reddetme), soru (bilgi isteği) ya da degisiklik (kod ya da plan değişikliği isteği) olduğunu seç.',
  },
};

// Türkçe büyük-küçük harf: 'SEÇİM' → 'seçim', 'SECIM' → 'secım' (ı); 'İ' ve 'ı' ikisi de kabul edilir
const kucuk = (s) => s.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i');

// Saf ayrıştırıcı: son "SEÇİM:" satırı seçenek listesinde olmalı, yoksa null. GEREKÇE: satırı varsa alınır, yoksa ''.
export function kararAyristir(metin, secenekler) {
  let secim = null, gerekce = '';
  for (const ham of String(metin ?? '').split(/\r?\n/)) {
    const satir = kucuk(ham.replace(/[*#]/g, '').replace(/^\s*[-–—]+\s*/, '').trim());
    const s = satir.match(/^se[çc][iıİ]m\s*:\s*(.+)$/);
    if (s) {
      const ilk = s[1].trim().match(/^[\p{L}\p{N}_]+/u);
      secim = ilk ? ilk[0] : '';
      continue;
    }
    const g = satir.match(/^gerek[çc]e\s*:\s*(.*)$/);
    if (g) gerekce = ham.replace(/[*#]/g, '').replace(/^\s*[-–—]+\s*/, '').trim().replace(/^[^:]*:\s*/, '');
  }
  if (secim === null) return null;
  const eslesen = secenekler.find((o) => kucuk(o) === secim);
  if (!eslesen) return null;
  return { secim: eslesen, gerekce };
}

const DIR = process.env.MDK_SELF_DIR || dirname(fileURLToPath(import.meta.url));
const dogrudan = Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;

if (dogrudan) {
  const cik = (m, kod) => { console.log(m); process.exit(kod); };
  const [tur, girdiYol, planYol = 'PLAN.md'] = process.argv.slice(2);
  const tanim = TURLER[tur];
  if (!tanim) cik(`bilinmeyen karar türü: ${tur ?? '(yok)'}`, 2);
  let girdi;
  try { girdi = readFileSync(girdiYol, 'utf8'); } catch { cik(`girdi okunamadı: ${girdiYol}`, 2); }
  const plan = existsSync(planYol) ? readFileSync(planYol, 'utf8') : '';
  const modeller = modelListesi(planSatiri(plan, 'Görev karar') ?? planSatiri(plan, 'Görev hakem') ?? '');

  const OC = opencodeSec(DIR);
  const LOGD = '.mdk-log';
  mkdirSync(LOGD, { recursive: true });
  const POLL = Number(process.env.POLL || 3);
  const ILK = Number(process.env.MDK_KARAR_ILK || 90);
  const SURE = Number(process.env.MDK_KARAR_SURE || 200);
  const istem = `Aşağıda bir "${tur}" karar girdisi var. Bu bir sınıflandırma görevi: kod yazma, dosya yaratma ya da değiştirme yok.
${tanim.aciklama}
Seçenekler: ${tanim.secenekler.join(', ')}

Girdi:
${girdi.slice(0, 12000)}

Yanıt biçimi: iki satır yaz, başka bir şey yazma.
SEÇİM: <seçenek adlarından biri, yalnız listedekilerden>
GEREKÇE: <tek kısa cümle>`;

  let sonuc = null;
  for (const m of modeller) {
    const log = join(LOGD, `karar-${tur}-${Date.now()}.jsonl`);
    const env = { ...process.env, OPENCODE_LOG_LEVEL: 'error' };
    const { neden } = await kos({ komut: OC, args: ['run', '--format', 'json', '-m', m, '--title', `karar-${tur}`, '--agent', 'plan', istem], env, log, ilk: ILK, sure: SURE, poll: POLL * 1000 });
    if (neden) oturumKapat(OC, log, null);
    const ayr = kararAyristir(metinAyikla(log), tanim.secenekler);
    if (ayr) { sonuc = { ...ayr, model: m, varsayilan: false }; break; }
  }
  // model yok ya da hiçbiri okunur yanıt vermedi: güvenli varsayılan
  if (!sonuc) sonuc = { secim: tanim.varsayilan, gerekce: '', model: null, varsayilan: true };

  const cikti = { tur, secim: sonuc.secim, gerekce: sonuc.gerekce, model: sonuc.model, varsayilan: sonuc.varsayilan };
  appendFileSync(join(process.cwd(), 'kararmodel.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ...cikti }) + '\n');
  console.log(JSON.stringify(cikti));
  process.exit(0);
}
