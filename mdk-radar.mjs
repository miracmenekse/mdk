// Rakip depoları `gh api` ile tarar, eşiklere göre haftalık farkı yazar.
// Kullanım: node mdk-radar.mjs [kök=.]  →  <kök>/strateji/radar-sonuc.json
// Yalnız Node yerleşikleri; ağa çıkan tek yer `gh` çağrısıdır (MDK_GH ile değiştirilebilir).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { komutHazirla } from './mdk-ortak.mjs';

const ALINAMADI = 'alinamadi';
const GUN_MS = 86400000;
const SURE_MS = 20000;

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
  const sonuc = { ts: new Date(simdiMs).toISOString(), ilk, adaylar, degisenler, onceki };
  yaz(sonucYolu, sonuc);
  console.log(`radar: ${adaylar.length} aday, ${degisenler.length} değişiklik`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
