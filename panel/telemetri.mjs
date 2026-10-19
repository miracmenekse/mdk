// OpenCode veritabanından (opencode.db) gerçek token kırılımı ve tasarruf tahmini.
// Veritabanı yalnız okunur; yoksa/bozuksa { var: false } döner, asla çökmez.

import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';

const YOK = () => ({ var: false, modeller: [], toplam: null, tasarruf: null });
const ALANLAR = ['giris', 'cikis', 'akil', 'cacheOkuma', 'cacheYazma'];
const sayi = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);

export function telemetri(dbYolu, fiyat) {
  // var olmayan yol readOnly açılışta da hata verir; yine de boş dosya yaratılmasın diye önce bakılır
  if (!dbYolu || !existsSync(dbYolu)) return YOK();
  let satirlar;
  try {
    const db = new DatabaseSync(dbYolu, { readOnly: true });
    try {
      satirlar = db.prepare('select data from message').all();
    } finally {
      db.close();
    }
  } catch {
    return YOK();
  }

  const harita = new Map();
  for (const { data } of satirlar) {
    let v;
    try {
      v = JSON.parse(data);
    } catch {
      continue; // bozuk satır atlanır
    }
    if (!v || v.role !== 'assistant' || !v.tokens) continue;
    const anahtar = `${v.providerID}/${v.modelID}`;
    const m = harita.get(anahtar) ?? { model: anahtar, mesaj: 0, giris: 0, cikis: 0, akil: 0, cacheOkuma: 0, cacheYazma: 0, maliyet: 0, sureliCikis: 0, sure: 0 };
    harita.set(anahtar, m);
    const t = v.tokens;
    m.mesaj += 1;
    m.giris += sayi(t.input);
    m.cikis += sayi(t.output);
    m.akil += sayi(t.reasoning);
    m.cacheOkuma += sayi(t.cache?.read);
    m.cacheYazma += sayi(t.cache?.write);
    m.maliyet += sayi(v.cost);
    // hız yalnız süresi bilinen mesajlardan; reasoning hariç
    const bas = v.time?.created, son = v.time?.completed;
    if (typeof bas === 'number' && typeof son === 'number' && son > bas) {
      m.sure += (son - bas) / 1000;
      m.sureliCikis += sayi(t.output);
    }
  }

  const modeller = [...harita.values()]
    .map(({ sureliCikis, sure, ...m }) => ({
      ...m,
      toplam: ALANLAR.reduce((s, k) => s + m[k], 0),
      toksn: sure > 0 ? sureliCikis / sure : null,
    }))
    .sort((a, b) => b.toplam - a.toplam);

  const toplam = { mesaj: 0, toplam: 0, maliyet: 0 };
  for (const k of ALANLAR) toplam[k] = 0;
  for (const m of modeller) for (const k of Object.keys(toplam)) toplam[k] += m[k];

  // tahmin uydurulmaz: dört fiyat alanının hepsi sayı olmalı
  const r = fiyat?.referans;
  const fiyatli = r && ['giris', 'cikis', 'cacheOkuma', 'cacheYazma'].every((k) => typeof r[k] === 'number' && Number.isFinite(r[k]));
  let tasarruf = null;
  if (fiyatli) {
    const listeFiyati = (toplam.giris * r.giris + (toplam.cikis + toplam.akil) * r.cikis + toplam.cacheOkuma * r.cacheOkuma + toplam.cacheYazma * r.cacheYazma) / 1e6;
    tasarruf = { referans: r.ad ?? null, listeFiyati, odenen: toplam.maliyet, tutar: listeFiyati - toplam.maliyet };
  }

  return { var: true, modeller, toplam, tasarruf };
}
