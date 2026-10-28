// Okunmamış kararları izler; Claude oturumu bunu Monitor ile çalıştırır.
// Kullanım: node karar-bekle.mjs [dizin] [--bir-kez]
//   dizin = "--" ile başlamayan ilk argüman (yoksa ".").
//   --bir-kez: bir kez tara, yaz ve çık (pid dosyası yazmaz).
//   Aksi hâlde: etki/.karar-izleyici'ye pid yazar, her 1 sn tarar;
//   SIGTERM/SIGINT'te pid dosyasını silip çıkar.
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { kararlar } from './panel/karar.mjs';

const argumanlar = process.argv.slice(2);
const birKez = argumanlar.includes('--bir-kez');
const dizinArg = argumanlar.find((a) => !a.startsWith('--'));
const kok = dizinArg ?? '.';

const etki = join(kok, 'etki');
const okunduDosya = join(etki, '.karar-okundu');
const pidDosya = join(etki, '.karar-izleyici');

function isaretOku() {
  if (!existsSync(okunduDosya)) return 0;
  const sayi = Number(readFileSync(okunduDosya, 'utf8').trim());
  return Number.isInteger(sayi) ? sayi : 0;
}

function tara() {
  const isaret = isaretOku();
  let enBuyuk = isaret;
  for (const karar of kararlar(kok)) {
    if (!(karar.ts > isaret)) continue;
    if (karar.ts > enBuyuk) enBuyuk = karar.ts;
    const metin = typeof karar.metin === 'string' ? karar.metin.replace(/\r?\n/g, ' ') : '';
    process.stdout.write(metin === ''
      ? `adım ${karar.no} ${karar.tur}\n`
      : `adım ${karar.no} ${karar.tur}: ${metin}\n`);
  }
  if (enBuyuk > isaret) {
    mkdirSync(etki, { recursive: true });
    writeFileSync(okunduDosya, String(enBuyuk));
  }
}

function durdur() {
  try {
    if (existsSync(pidDosya)) unlinkSync(pidDosya);
  } catch {
    // silinemezse yine çık
  }
  process.exit(0);
}

if (birKez) {
  tara();
  process.exit(0);
}

mkdirSync(etki, { recursive: true });
writeFileSync(pidDosya, String(process.pid));
process.on('SIGTERM', durdur);
process.on('SIGINT', durdur);
tara();
setInterval(tara, 1000);
