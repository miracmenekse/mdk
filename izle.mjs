// Kullanım (proje kökünde): node izle.mjs [--bastan]
// .op-log içindeki en yeni OpenCode çalışmasını terminalde canlı gösterir; yeni çalışma başlayınca ona geçer.
// --bastan: en yenisini baştan oynatır (sonra izlemeye devam eder).
import { readdirSync, statSync, openSync, readSync, closeSync } from 'node:fs';

const DIR = '.op-log';
const bastan = process.argv.includes('--bastan');
const kes = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };

export function bicimle(e) {
  const p = e.part ?? {};
  if (e.type === 'text') return `\n${p.text}`;
  if (e.type === 'tool_use') {
    const i = p.state?.input ?? {};
    const hedef = i.filePath ?? i.command ?? i.pattern ?? i.path ?? JSON.stringify(i);
    return `  ▸ ${p.tool}  ${kes(hedef, 110)}${p.state?.status === 'error' ? '  [HATA]' : ''}`;
  }
  if (e.type === 'step_finish') return `  · adım bitti (${p.tokens?.total ?? 0} token)`;
  return null; // step_start gibi gürültü
}

const sonDosya = () => {
  try {
    return readdirSync(DIR).filter((f) => /^adim\d+-\d+\.jsonl$/.test(f))
      .map((f) => ({ f, t: statSync(`${DIR}/${f}`).mtimeMs })).sort((a, b) => b.t - a.t)[0]?.f;
  } catch { return undefined; }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  let dosya, konum = 0, artik = '';
  const tur = () => {
    const yeni = sonDosya();
    if (!yeni) return;
    if (yeni !== dosya) {
      dosya = yeni; artik = ''; konum = 0; // yeni dosya: baştan oku
      console.log(`\n══ ${dosya} ══`);
    }
    const boy = statSync(`${DIR}/${dosya}`).size;
    if (boy <= konum) return;
    const fd = openSync(`${DIR}/${dosya}`, 'r'), b = Buffer.alloc(boy - konum);
    readSync(fd, b, 0, b.length, konum); closeSync(fd); konum = boy;
    const satirlar = (artik + b.toString('utf8')).split('\n'); artik = satirlar.pop();
    for (const l of satirlar) {
      try { const s = bicimle(JSON.parse(l)); if (s) console.log(s); } catch { /* yarım/bozuk satır */ }
    }
  };
  if (!bastan) { const y = sonDosya(); if (y) { dosya = y; konum = statSync(`${DIR}/${y}`).size; console.log(`══ ${y} (sondan izleniyor) ══`); } }
  setInterval(tur, 500); tur();
}
