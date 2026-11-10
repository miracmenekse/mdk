// Model karşılaştırma tablosu: yürütücü/model bazında deneme, ilk deneme oranı, süre, token, uyum.
// Kullanım: node karsilastir.mjs [dizin]

import { fileURLToPath } from 'node:url';
import { snapshot } from './panel/durum.mjs';

const yuzde = (oran) => (oran === null ? '-' : String(Math.round(oran * 100)));

export function tablo(modeller) {
  if (modeller.length === 0) return 'metrik yok';
  const basliklar = ['yürütücü', 'model', 'deneme', 'ilk%', 'ort.sn', 'token', 'uyum%'];
  const satirlar = modeller.map((m) => [
    m.yurutucu,
    m.model,
    String(m.deneme),
    yuzde(m.ilkDenemeOrani),
    m.ortSure == null ? '-' : String(Math.round(m.ortSure)), // ölçülmemiş süre/token 0 değil
    m.token == null ? '-' : String(m.token),
    yuzde(m.uyum),
  ]);
  const hepsi = [basliklar, ...satirlar];
  const genislik = basliklar.map((_, i) => Math.max(...hepsi.map((r) => r[i].length)));
  return hepsi.map((r) => r.map((h, i) => h.padEnd(genislik[i])).join('  ').trimEnd()).join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const anlik = snapshot(process.argv[2] ?? '.');
  console.log(tablo(anlik.modeller));
  // kapı üretimi ayrı: kabul = sözdizimi temiz, kod yazılmadan kırmızı, yalnız istenen dosya
  for (const k of anlik.kapiUretim) {
    const neden = Object.entries(k.nedenler).map(([n, a]) => `${n} ${a}`).join(', ');
    console.log(`kapı üretimi  ${k.model}  ${k.kabul}/${k.deneme} kabul  ort ${k.ortSure == null ? '-' : Math.round(k.ortSure)} sn${k.sessiz ? `  ${k.sessiz} sessiz` : ''}${neden ? `  (${neden})` : ''}`);
  }
}
