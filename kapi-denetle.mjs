// Kapı denetleyici: PLAN.md'deki bitmemiş opencode adımlarının kapılarını kontrol eder.
// Kullanım: node kapi-denetle.mjs [PLAN.md]
//          node kapi-denetle.mjs --dosya <kapı.test.mjs>   (üretilmiş kapı zayıf mı; mdk-adim.sh kapı üretiminden sonra çağırır, yalnız uyarır)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from './panel/plan.mjs';

// Kapı bir test dosyası, test betiği ya da satır içi assert çalıştırıyor mu?
const TEST_KAPI = /\.test\.|(^|[ \/])test\/|npm test|node --test|node -e .*assert/;

export function denetle(planMetni) {
  const bulgular = [];
  for (const k of parse(planMetni).kategoriler) {
    for (const a of k.adimlar) {
      if (a.bitti || a.yurutucu !== 'opencode') continue;
      if (a.kapilar.length === 0) {
        bulgular.push({ no: a.no, seviye: 'HATA', mesaj: 'kapı yok' });
        continue;
      }
      if (!a.kapilar.some((g) => TEST_KAPI.test(g))) {
        bulgular.push({ no: a.no, seviye: 'UYARI', mesaj: 'kapı yalnızca varlık kontrolü olabilir' });
      }
      if (a.etki && !a.onay) {
        bulgular.push({ no: a.no, seviye: 'BİLGİ', mesaj: 'taslak onayı bekliyor' });
      }
    }
  }
  return bulgular;
}

// Üretilmiş kapı dosyası: projeden bir şey çalıştırıyor mu (içe aktarma, süreç, sunucu), yoksa yalnız kaynak metni mi okuyor?
const CALISTIRIR = /from\s+['"]\.{1,2}\/|import\(\s*['"`]\.{1,2}\/|child_process|fetch\(|createServer|node:http/;
export function dosyaDenetle(icerik) {
  const bulgular = [];
  if (!/assert/.test(icerik)) bulgular.push('assert yok');
  if (!CALISTIRIR.test(icerik) && /readFileSync/.test(icerik)) bulgular.push('yalnız kaynak metni arıyor (davranışı çalıştırmıyor)');
  return bulgular;
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === '--dosya') {
  const dosya = process.argv[3];
  if (/\.mjs$/.test(dosya ?? '')) for (const b of dosyaDenetle(readFileSync(dosya, 'utf8'))) console.log(`UYARI: zayıf kapı ${dosya}: ${b}`);
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const bulgular = denetle(readFileSync(process.argv[2] ?? 'PLAN.md', 'utf8'));
  for (const b of bulgular) console.log(`adım ${b.no}: ${b.seviye}: ${b.mesaj}`);
  if (bulgular.length === 0) console.log('kapılar tamam');
  process.exit(bulgular.some((b) => b.seviye === 'HATA') ? 1 : 0);
}
