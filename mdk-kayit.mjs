// Kayıt aracı: deneme sonucunu ya da Claude incelemesini metrikler.jsonl'a ekler.
// Kullanım:
//   node mdk-kayit.mjs <adım> --yurutucu kodcu|claude|opencode --model <ad> --gecti true|false [--sure <sn>] [--token <n>] [--deneme <n>] [--neden <metin>] [--dizin <d>]
//   node mdk-kayit.mjs <adım> --inceleme uyumlu|kismen|uyumsuz [--not "<metin>"] [--dizin <d>]

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const YURUTUCULER = ['kodcu', 'claude', 'opencode'];
const INCELEMELER = ['uyumlu', 'kismen', 'uyumsuz'];

function kullanim(mesaj) {
  process.stderr.write(`${mesaj}\nKullanım: node mdk-kayit.mjs <adım> --yurutucu ... --model ... --gecti ... | --inceleme ...\n`);
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

const dizin = opt.dizin ?? '.';
appendFileSync(join(dizin, 'metrikler.jsonl'), JSON.stringify(satir) + '\n');

// Panel "Şu an" kartı için: yalnızca deneme kayıtları durum.json'u günceller
if (satir.tur === undefined) {
  let baslik = null;
  try {
    const plan = readFileSync(join(dizin, 'PLAN.md'), 'utf8');
    const m = plan.match(new RegExp(`^- \\[[ xX]\\] ${adim}\\. (.+)$`, 'm'));
    if (m) baslik = m[1].trim();
  } catch {
    // PLAN.md yoksa başlık null kalır
  }
  writeFileSync(join(dizin, 'durum.json'), JSON.stringify({
    adim,
    baslik,
    model: satir.model,
    deneme: satir.deneme,
    durum: satir.gecti ? 'gecti' : 'eskale',
    ts,
  }));
}
