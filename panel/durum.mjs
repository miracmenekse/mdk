// Durum birleştirici: PLAN.md + durum.json + metrikler.jsonl → anlık görüntü.

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { parse } from './plan.mjs';
import { tahmin } from './tahmin.mjs';
import { gecmis } from './gecmis.mjs';
import { telemetri } from './telemetri.mjs';
import { claudeKullanim } from './claude.mjs';
import { kararlar } from './karar.mjs';

export function snapshot(dir) {
  const sonuc = { plan: null, simdi: null, modeller: [], etki: [], incelemeler: {}, gecmis: [], matris: { adimlar: [], modeller: [] }, claude: null, kararIzleyici: false };

  try {
    sonuc.plan = parse(readFileSync(join(dir, 'PLAN.md'), 'utf8'));
  } catch {
    sonuc.plan = null;
  }

  try {
    sonuc.simdi = JSON.parse(readFileSync(join(dir, 'durum.json'), 'utf8'));
  } catch {
    sonuc.simdi = null;
  }

  let satirlar = [];
  try {
    satirlar = readFileSync(join(dir, 'metrikler.jsonl'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((s) => {
        try {
          return JSON.parse(s);
        } catch {
          return null; // bozuk satır atlanır
        }
      })
      .filter(Boolean);
  } catch {
    satirlar = [];
  }

  // inceleme satırları: adım başına son sonuç; deneme istatistiğine girmez
  for (const s of satirlar) {
    if (s.tur === 'inceleme') sonuc.incelemeler[s.adim] = { inceleme: s.inceleme, not: s.not ?? null, ts: s.ts };
  }

  const harita = new Map();
  for (const s of satirlar) {
    if (s.tur === 'inceleme' || typeof s.model !== 'string' || !s.model) continue;
    const yurutucu = s.yurutucu ?? 'opencode';
    const anahtar = `${yurutucu}\u0000${s.model}`;
    const m = harita.get(anahtar) ?? {
      yurutucu,
      model: s.model,
      deneme: 0,
      gecen: 0,
      ilkToplam: 0,
      ilkGecen: 0,
      token: 0,
      tokenSay: 0,
      maliyet: 0,
      sure: 0,
      sureSay: 0,
      sessiz: 0,
      tahmini: false,
      eksik: false,
      gecenAdimlar: new Set(),
    };
    harita.set(anahtar, m);
    // sağlayıcı sessizliği (yanit_yok ve kota) model denemesi değildir; yalnız ayrı sayılır
    if (s.neden === 'yanit_yok' || s.neden === 'kota') {
      m.sessiz += 1;
      continue;
    }
    m.deneme += 1;
    if (s.gecti === true) {
      m.gecen += 1;
      m.gecenAdimlar.add(s.adim);
    }
    if (s.deneme === 1) {
      m.ilkToplam += 1;
      if (s.gecti === true) m.ilkGecen += 1;
    }
    // ölçülmemiş (null) süre/token 0 sayılmaz
    const sayisal = (x) => typeof x === 'number' && Number.isFinite(x);
    if (sayisal(s.token)) { m.token += s.token; m.tokenSay += 1; }
    if (sayisal(s.sure_sn)) { m.sure += s.sure_sn; m.sureSay += 1; }
    if (!sayisal(s.token) || !sayisal(s.sure_sn)) m.eksik = true;
    if (s.tahmini === true) m.tahmini = true;
    m.maliyet += Number(s.maliyet) || 0;
  }

  // uyum: en az bir kez geçilen ve incelenmiş adımların, "uyumlu" son incelemeye oranı
  sonuc.modeller = [...harita.values()]
    .sort((a, b) => a.yurutucu.localeCompare(b.yurutucu) || a.model.localeCompare(b.model))
    .map((m) => {
      const incelenen = [...m.gecenAdimlar].filter((a) => sonuc.incelemeler[a]);
      const uyumlu = incelenen.filter((a) => sonuc.incelemeler[a].inceleme === 'uyumlu').length;
      return {
        yurutucu: m.yurutucu,
        model: m.model,
        deneme: m.deneme,
        gecen: m.gecen,
        ilkDenemeOrani: m.ilkToplam > 0 ? m.ilkGecen / m.ilkToplam : null,
        token: m.tokenSay > 0 ? m.token : null,
        maliyet: m.maliyet,
        ortSure: m.sureSay > 0 ? m.sure / m.sureSay : null,
        uyum: incelenen.length > 0 ? uyumlu / incelenen.length : null,
        sessiz: m.sessiz,
        // güven: hiç ölçüm yok > tahmin > eksik ölçüm > tam ölçüm
        etiket: m.tokenSay + m.sureSay === 0 ? 'veri-yok' : m.tahmini ? 'tahmin' : m.eksik ? 'kismi' : 'olculdu',
      };
    });

  sonuc.gecmis = gecmis(dir, satirlar);
  sonuc.matris = matris(satirlar);

  // gerçek token: OpenCode veritabanı (salt-okunur); referans fiyat proje kökünde
  let fiyat = null;
  try {
    fiyat = JSON.parse(readFileSync(join(dir, 'fiyat.json'), 'utf8'));
  } catch {
    fiyat = null;
  }
  // ponytail: her anlık görüntüde veritabanı yeniden okunur; yavaşlarsa mtime+size önbelleği
  // yalnız bu projenin (ve alt dizinlerinin) oturumları sayılır
  sonuc.telemetri = telemetri(process.env.OPENCODE_DB || join(homedir(), '.local/share/opencode/opencode.db'), fiyat, resolve(dir));
  sonuc.claude = claudeKullanim(resolve(dir), fiyat);

  let isaret = 0;
  try {
    const n = Number(readFileSync(join(dir, 'etki', '.karar-okundu'), 'utf8').trim());
    if (Number.isFinite(n)) isaret = n;
  } catch {
    isaret = 0; // dosya yok ya da okunamıyor
  }

  // adım başına dosyada en sonda görülen karar geçerlidir
  const sonKarar = new Map();
  for (const k of kararlar(dir)) sonKarar.set(k.no, k);

  try {
    const pid = Number(readFileSync(join(dir, 'etki', '.karar-izleyici'), 'utf8').trim());
    if (Number.isInteger(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        sonuc.kararIzleyici = true;
      } catch {
        sonuc.kararIzleyici = false; // süreç yok
      }
    }
  } catch {
    sonuc.kararIzleyici = false; // dosya yok ya da okunamıyor
  }

  if (sonuc.plan) {
    for (const k of sonuc.plan.kategoriler) {
      for (const a of k.adimlar) {
        if (!a.etki) continue;
        const karar = sonKarar.get(a.no) ?? null;
        sonuc.etki.push({
          no: a.no,
          baslik: a.baslik,
          dosya: a.etki,
          deger: a.deger,
          bitti: !!a.bitti,
          onay: !!a.onay,
          karar,
          alindi: karar !== null && karar.ts <= isaret,
          tahmin: tahmin(satirlar, 1),
        });
      }
    }
  }

  return sonuc;
}

const sayisal = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);

// hücre: durum + hücredeki TÜM satırların etkin token'ı (yoksa token, o da yoksa 0) ve istek toplamı
function hucre(durum, deneme, sure, liste) {
  const tokenler = liste.map((s) => sayisal(s.etkin) ?? sayisal(s.token)).filter((x) => x !== null);
  const token = tokenler.length ? tokenler.reduce((a, b) => a + b, 0) : null;   // hiç ölçülmediyse 0 değil null
  const istekler = liste.map((s) => sayisal(s.istek)).filter((x) => x !== null);
  return { durum, deneme, sure, token, istek: istekler.length ? istekler.reduce((a, b) => a + b, 0) : null };
}

// model × adım: hücre = o modelin o adımdaki sonucu; sessiz (yanit_yok) satırlar gerçek deneme değildir
function matris(satirlar) {
  const metrik = satirlar.filter((s) => s.tur !== 'inceleme' && typeof s.adim === 'number' && Number.isFinite(s.adim));
  const adimlar = [...new Set(metrik.map((s) => s.adim))].sort((a, b) => a - b);
  const harita = new Map();
  for (const s of metrik) {
    if (typeof s.model !== 'string' || !s.model) continue;
    const yurutucu = s.yurutucu ?? 'opencode';
    const deney = s.deney ?? null;
    // deney koşusu ayrı satır: anahtar yürütücü + model + deney
    const anahtar = `${yurutucu}\u0000${s.model}\u0000${deney ?? ''}`;
    const m = harita.get(anahtar) ?? { yurutucu, model: s.model, deney, satir: {} };
    harita.set(anahtar, m);
    (m.satir[s.adim] ??= []).push(s);
  }
  const modeller = [...harita.values()]
    .sort((a, b) => a.yurutucu.localeCompare(b.yurutucu) || a.model.localeCompare(b.model) ||
      (a.deney ?? '').localeCompare(b.deney ?? ''))
    .map(({ yurutucu, model, deney, satir }) => {
      const hucreler = {};
      for (const [adim, liste] of Object.entries(satir)) {
        const gercek = liste.filter((s) => s.neden !== 'yanit_yok' && s.neden !== 'kota');   // kota da sağlayıcı sessizliği
        const gecen = gercek.find((s) => s.gecti === true);
        if (gecen) {
          hucreler[adim] = hucre(gecen.deneme === 1 ? 'ilk' : 'cok', gecen.deneme, typeof gecen.sure_sn === 'number' ? gecen.sure_sn : null, liste);
        } else if (gercek.length) {
          hucreler[adim] = hucre('kaldi', gercek.length, null, liste);
        } else {
          hucreler[adim] = hucre('sessiz', 0, null, liste);
        }
      }
      return { yurutucu, model, deney, hucreler };
    });
  return { adimlar, modeller };
}
