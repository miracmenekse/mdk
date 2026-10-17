// Kapı denetleyici: PLAN.md'deki bitmemiş opencode adımlarının kapılarını kontrol eder.
// Kullanım: node kapi-denetle.mjs [PLAN.md]

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from './panel/plan.mjs';

// Kapı bir test dosyası ya da test betiği çalıştırıyor mu?
const TEST_KAPI = /\.test\.|(^|[ \/])test\/|npm test|node --test/;

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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const bulgular = denetle(readFileSync(process.argv[2] ?? 'PLAN.md', 'utf8'));
  for (const b of bulgular) console.log(`adım ${b.no}: ${b.seviye}: ${b.mesaj}`);
  if (bulgular.length === 0) console.log('kapılar tamam');
  process.exit(bulgular.some((b) => b.seviye === 'HATA') ? 1 : 0);
}
