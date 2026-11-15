// Ana yürütücü tanımı ve okuyucusu: yurutuculer.json'dan hangi ana yürütücülerin tanımlı olduğunu, planlayıcı komutunu ve rol modellerini okur.
// Dışa aktarılan saf işlevler; doğrudan çalıştırılınca CLI: liste | goster <ad>.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { epicBlogu } from './mdk-ortak.mjs';

const BU = dirname(fileURLToPath(import.meta.url));
const VARSAYILAN_AD = 'claude';

// yurutuculer.json okunur; dosya yok ya da bozuksa boş tanım döner
export function anaOku(dosya = process.env.MDK_YURUTUCULER || join(BU, 'yurutuculer.json')) {
  try {
    const t = JSON.parse(readFileSync(dosya, 'utf8'));
    return { varsayilan: t.varsayilan ?? VARSAYILAN_AD, liste: Array.isArray(t.liste) ? t.liste : [] };
  } catch {
    return { varsayilan: VARSAYILAN_AD, liste: [] };
  }
}

export const anaBul = (tanim, ad) => tanim.liste.find((a) => a.ad === ad) ?? null;

// Epic'in "- Ana: <ad>" satırı; yoksa null
export function epicAnasi(plan, adimNo) {
  const m = epicBlogu(plan, adimNo).match(/^- Ana: (.+)$/m);
  return m ? m[1].trim() : null;
}

// Öncelik: MDK_ANA ortam değişkeni > Epic'in ana yürütücüsü > varsayılan. Tanınmayan ad atar.
export function anaSec(tanim, { plan = '', adimNo = null, env = process.env } = {}) {
  const ad = env.MDK_ANA || (plan && adimNo !== null ? epicAnasi(plan, adimNo) : null) || tanim.varsayilan;
  const ana = anaBul(tanim, ad);
  if (!ana) throw new Error(`tanınmayan ana yürütücü: ${ad}`);
  return ana;
}

// [komut, argümanlar]; {istem} yeri istemle değişir, yoksa istem sona eklenir
export function planlayiciKomutu(ana, istem) {
  const [komut, ...args] = ana.planlayici;
  const yer = args.some((a) => a.includes('{istem}'));
  const yeni = args.map((a) => a.split('{istem}').join(istem));
  return [komut, yer ? yeni : [...yeni, istem]];
}

export const rolModeli = (ana, rol) => ana.roller?.[rol] ?? null;
export const gorevModelleri = (ana, tur) => ana.gorevler?.[tur] ?? null;

// CLI
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [komut, ad] = process.argv.slice(2);
  const tanim = anaOku();
  if (komut === 'liste') {
    for (const a of tanim.liste) console.log(`${a.ad}\t${a.baslik}${a.ad === tanim.varsayilan ? ' (varsayılan)' : ''}`);
    process.exit(0);
  }
  if (komut === 'goster' && ad) {
    const ana = anaBul(tanim, ad);
    if (!ana) { process.stderr.write(`tanınmayan ana yürütücü: ${ad}\n`); process.exit(4); }
    console.log(JSON.stringify(ana, null, 2));
    process.exit(0);
  }
  process.stderr.write('Kullanım: node mdk-ana.mjs liste | goster <ad>\n');
  process.exit(2);
}
