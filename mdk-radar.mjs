// Rakip depoları `gh api` ile tarar, eşiklere göre haftalık farkı yazar.
// Kullanım: node mdk-radar.mjs [kök=.]  →  <kök>/strateji/radar-sonuc.json
// Yalnız Node yerleşikleri; ağa çıkan yerler `gh` çağrısı (MDK_GH) ve özet için opencode'dur (ocSec).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { komutHazirla, modelListesi, planSatiri } from './mdk-ortak.mjs';
import { ocSec } from './oc-sec.mjs';

const ALINAMADI = 'alinamadi';
const GUN_MS = 86400000;
const SURE_MS = 20000;
const OZET_SURE_MS = 90000;
const OZET_SORU = 'Bu değişiklik ürün sahibi için ne anlama geliyor? Tek Türkçe cümle, en çok 160 karakter, sayı yazma.';

const gunFarki = (son, simdiMs) => {
  const t = Date.parse(`${son}T00:00:00Z`);
  return Number.isFinite(t) ? Math.floor((simdiMs - t) / GUN_MS) : null;
};

const eskiMi = (son, esik, simdiMs) => {
  const g = gunFarki(son, simdiMs);
  return g !== null && g > (esik.durmusGun ?? 0);
};

// Saf karşılaştırma: yeni / sıçradı / durdu; hatalı adaylar hiçbir türe girmez.
export function farkBul(oncekiAdaylar, simdikiAdaylar, esik, simdiMs) {
  if (!Array.isArray(oncekiAdaylar) || oncekiAdaylar.length === 0) return [];
  const onceki = new Map(oncekiAdaylar.filter((a) => a && !a.hata).map((a) => [a.repo, a]));
  const degisenler = [];
  for (const a of simdikiAdaylar || []) {
    if (!a || a.hata) continue;
    const p = onceki.get(a.repo);
    if (!p) {
      degisenler.push({ repo: a.repo, tur: 'yeni' });
      continue;
    }
    const fark = (a.yildiz ?? 0) - (p.yildiz ?? 0);
    const yuzde = p.yildiz > 0 ? (fark / p.yildiz) * 100 : Infinity;
    const yuzdeEsik = esik.sicramaYuzde ?? Infinity;
    const mutlakEsik = esik.sicramaMutlak ?? Infinity;
    if (fark > 0 && (yuzde >= yuzdeEsik || fark >= mutlakEsik)) {
      degisenler.push({ repo: a.repo, tur: 'sicradi', fark: `+${fark} yıldız (%${Math.round(yuzde)})` });
    }
    if (eskiMi(a.son, esik, simdiMs) && !eskiMi(p.son, esik, simdiMs)) {
      degisenler.push({ repo: a.repo, tur: 'durdu', fark: `${gunFarki(a.son, simdiMs)} gündür güncellenmedi` });
    }
  }
  return degisenler;
}

function adayGetir(komut, repo, grup) {
  const [k, args] = komutHazirla(komut, ['api', `repos/${repo}`]);
  let r;
  try {
    r = spawnSync(k, args, { encoding: 'utf8', timeout: SURE_MS, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  } catch {
    return { repo, grup, hata: ALINAMADI };
  }
  if (!r || r.error || r.status !== 0) return { repo, grup, hata: ALINAMADI };
  let veri;
  try {
    veri = JSON.parse(r.stdout);
  } catch {
    return { repo, grup, hata: ALINAMADI };
  }
  if (!veri || typeof veri !== 'object') return { repo, grup, hata: ALINAMADI };
  return {
    repo,
    grup,
    yildiz: Number(veri.stargazers_count) || 0,
    lisans: veri.license?.spdx_id ?? null,
    son: typeof veri.pushed_at === 'string' ? veri.pushed_at.slice(0, 10) : '',
    aciklama: veri.description ?? null,
    kaynak: 'api',
  };
}

function ozetIstem(urun, degisen, aday) {
  return [
    `Ürün: ${urun ?? ''}`,
    `Depo: ${degisen.repo}`,
    `Grup: ${aday?.grup ?? ''}`,
    `Açıklama: ${aday?.aciklama ?? ''}`,
    `Değişiklik: ${degisen.tur}${degisen.fark ? ` — ${degisen.fark}` : ''}`,
    OZET_SORU,
  ].join('\n');
}

function metinTopla(cikti) {
  let m = '';
  for (const l of String(cikti || '').split(/\r?\n/)) {
    try {
      const x = JSON.parse(l);
      if (x?.type === 'text') m += x.part?.text ?? '';
    } catch {}
  }
  return m;
}

function ozetUret(oc, model, istem) {
  const [k, args] = komutHazirla(oc, ['run', '-m', model, '--format', 'json', '--title', 'radar', istem]);
  let r;
  try {
    r = spawnSync(k, args, {
      encoding: 'utf8', timeout: OZET_SURE_MS, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
      env: { ...process.env, OPENCODE_LOG_LEVEL: 'error' },
    });
  } catch {
    return '';
  }
  if (!r || r.error || r.status !== 0) return '';
  return metinTopla(r.stdout).split(/\r?\n/)[0].trim().slice(0, 200);
}

function ozetle(kok, urun, adaylar, degisenler) {
  let plan;
  try {
    plan = readFileSync(join(kok, 'PLAN.md'), 'utf8');
  } catch {
    return 0;
  }
  const modeller = modelListesi(planSatiri(plan, 'Görev arastirma'));
  if (modeller.length === 0) return 0;
  const oc = ocSec();
  let adet = 0;
  for (const d of degisenler) {
    const aday = adaylar.find((a) => a.repo === d.repo);
    const istem = ozetIstem(urun, d, aday);
    for (const model of modeller) {
      const metin = ozetUret(oc, model, istem);
      if (metin) {
        d.not = metin;
        adet++;
        break;
      }
    }
  }
  return adet;
}

function yaz(yol, veri) {
  mkdirSync(dirname(yol), { recursive: true });
  writeFileSync(yol, `${JSON.stringify(veri, null, 2)}\n`);
}

function hataYaz(yol, adet) {
  let eski = null;
  try {
    eski = JSON.parse(readFileSync(yol, 'utf8'));
  } catch {}
  const sonHata = { ts: new Date().toISOString(), ileti: `tüm ${adet} depo alınamadı` };
  const sonuc = eski && typeof eski === 'object' ? { ...eski, sonHata } : { adaylar: [], degisenler: [], sonHata };
  yaz(yol, sonuc);
}

function main() {
  const kok = resolve(process.argv[2] || '.');
  const radarYolu = join(kok, 'strateji', 'radar.json');
  const sonucYolu = join(kok, 'strateji', 'radar-sonuc.json');

  let radar;
  try {
    radar = JSON.parse(readFileSync(radarYolu, 'utf8'));
  } catch {
    console.error(`radar: ${radarYolu} okunamadı`);
    process.exit(2);
  }

  const esik = radar.esik || {};
  const izle = Array.isArray(radar.izle) ? radar.izle : [];
  const komut = process.env.MDK_GH || 'gh';
  const adaylar = izle.map((x) => adayGetir(komut, x.repo, x.grup));

  if (adaylar.length > 0 && adaylar.every((a) => a.hata)) {
    hataYaz(sonucYolu, adaylar.length);
    process.exit(1);
  }

  let oncekiDosya = null;
  try {
    oncekiDosya = JSON.parse(readFileSync(sonucYolu, 'utf8'));
  } catch {}
  const eskiAdaylar = oncekiDosya && Array.isArray(oncekiDosya.adaylar) ? oncekiDosya.adaylar : [];
  const ilk = eskiAdaylar.length === 0;
  const onceki = ilk ? null : { ts: oncekiDosya.ts, adaylar: eskiAdaylar };
  const simdiMs = Date.now();
  const degisenler = ilk ? [] : farkBul(eskiAdaylar, adaylar, esik, simdiMs);
  for (const d of degisenler) d.not = null;
  let ozet = 0;
  if (degisenler.length > 0 && process.env.MDK_RADAR_OZETSIZ !== '1') {
    ozet = ozetle(kok, radar.urun, adaylar, degisenler);
  }
  const sonuc = { ts: new Date(simdiMs).toISOString(), ilk, adaylar, degisenler, onceki };
  yaz(sonucYolu, sonuc);
  console.log(`radar: ${adaylar.length} aday, ${degisenler.length} değişiklik, ${ozet} özet`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
