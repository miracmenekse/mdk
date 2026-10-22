// OpenCode veritabanından (opencode.db) gerçek token kırılımı ve tasarruf tahmini.
// Veritabanı yalnız okunur; yoksa/bozuksa { var: false } döner, asla çökmez.

import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { sep } from 'node:path';

const YOK = () => ({ var: false, modeller: [], toplam: null, tasarruf: null });
const ALANLAR = ['giris', 'cikis', 'akil', 'cacheOkuma', 'cacheYazma'];
const sayi = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);

// dizin verilirse yalnız o dizindeki (ya da altındaki) oturumlar; session tablosu yoksa tümü
export function telemetri(dbYolu, fiyat, dizin) {
  // var olmayan yol readOnly açılışta da hata verir; yine de boş dosya yaratılmasın diye önce bakılır
  if (!dbYolu || !existsSync(dbYolu)) return YOK();
  let satirlar;
  let kapsam = 'tum';
  try {
    const db = new DatabaseSync(dbYolu, { readOnly: true });
    try {
      const oturumVar = !!db.prepare("select 1 from sqlite_master where type = 'table' and name = 'session'").get();
      if (dizin && oturumVar) {
        kapsam = 'proje';
        // düz önek değil: /a/proje-duman, /a/proje'ye sayılmaz
        const dizinler = new Map(db.prepare('select id, directory from session').all().map((r) => [r.id, r.directory]));
        const icinde = (d) => typeof d === 'string' && (d === dizin || d.startsWith(dizin + sep));
        satirlar = db.prepare('select session_id, data from message').all().filter((r) => icinde(dizinler.get(r.session_id)));
      } else {
        satirlar = db.prepare('select data from message').all();
      }
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

  return { var: true, modeller, toplam, tasarruf, kapsam };
}
