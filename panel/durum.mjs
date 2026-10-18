// Durum birleştirici: PLAN.md + durum.json + metrikler.jsonl → anlık görüntü.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './plan.mjs';
import { tahmin } from './tahmin.mjs';
import { gecmis } from './gecmis.mjs';

export function snapshot(dir) {
  const sonuc = { plan: null, simdi: null, modeller: [], etki: [], incelemeler: {}, gecmis: [] };

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
    // sağlayıcı sessizliği (kota) model denemesi değildir; yalnız ayrı sayılır
    if (s.neden === 'yanit_yok') {
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

  if (sonuc.plan) {
    for (const k of sonuc.plan.kategoriler) {
      for (const a of k.adimlar) {
        if (a.bitti || !a.etki) continue;
        sonuc.etki.push({
          no: a.no,
          baslik: a.baslik,
          dosya: a.etki,
          deger: a.deger,
          tahmin: tahmin(satirlar, 1),
        });
      }
    }
  }

  return sonuc;
}
