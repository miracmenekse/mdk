// Kayıt aracı: deneme sonucunu ya da Claude incelemesini metrikler.jsonl'a ekler.
// Kullanım:
//   node op-kayit.mjs <adım> --yurutucu kodcu|claude|opencode --model <ad> --gecti true|false [--sure <sn>] [--token <n>] [--deneme <n>] [--neden <metin>] [--dizin <d>]
//   node op-kayit.mjs <adım> --inceleme uyumlu|kismen|uyumsuz [--not "<metin>"] [--dizin <d>]

import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

const YURUTUCULER = ['kodcu', 'claude', 'opencode'];
const INCELEMELER = ['uyumlu', 'kismen', 'uyumsuz'];

function kullanim(mesaj) {
  process.stderr.write(`${mesaj}\nKullanım: node op-kayit.mjs <adım> --yurutucu ... --model ... --gecti ... | --inceleme ...\n`);
  process.exit(2);
}

const sayi = (v, varsayilan) => {
  if (v === undefined) return varsayilan;
  const n = Number(v);
  if (v.trim() === '' || !Number.isFinite(n) || n < 0) kullanim(`geçersiz sayı: ${v}`);
  return n;
};

const [adimRaw, ...rest] = process.argv.slice(2);
if (!/^\d+$/.test(adimRaw ?? '')) kullanim('adım numarası eksik ya da geçersiz');
const adim = Number(adimRaw);

const opt = {};
for (let i = 0; i < rest.length; i += 2) {
  if (!rest[i]?.startsWith('--') || rest[i + 1] === undefined) kullanim(`hatalı seçenek: ${rest[i]}`);
  opt[rest[i].slice(2)] = rest[i + 1];
}

const ts = Date.now();
let satir;
if (opt.inceleme !== undefined) {
  if (!INCELEMELER.includes(opt.inceleme)) kullanim(`--inceleme şunlardan biri olmalı: ${INCELEMELER.join(', ')}`);
  satir = { tur: 'inceleme', ts, adim, inceleme: opt.inceleme, not: opt.not ?? null };
} else {
  if (!YURUTUCULER.includes(opt.yurutucu)) kullanim(`--yurutucu şunlardan biri olmalı: ${YURUTUCULER.join(', ')}`);
  if (!opt.model) kullanim('--model eksik');
  if (opt.gecti !== 'true' && opt.gecti !== 'false') kullanim('--gecti true ya da false olmalı');
  satir = {
    ts,
    adim,
    yurutucu: opt.yurutucu,
    model: opt.model,
    deneme: sayi(opt.deneme, 1),
    gecti: opt.gecti === 'true',
    sure_sn: sayi(opt.sure, null),
    token: sayi(opt.token, null),
    maliyet: 0,
    neden: opt.neden ?? null,
  };
}

appendFileSync(join(opt.dizin ?? '.', 'metrikler.jsonl'), JSON.stringify(satir) + '\n');
