// Claude Code oturum dosyalarından (salt-okunur) model bazında token ve tahmini maliyet.
// Dizin büyük (~400 MB); dosya başına path+size+mtime önbelleğiyle yalnız değişen dosya yeniden okunur.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { homedir } from 'node:os';

const ALANLAR = ['giris', 'cikis', 'cacheOkuma', 'cacheYazma'];
const BOS = () => ({ var: false, modeller: [], toplam: null, ilk: null, son: null });
const sayi = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);

const onbellek = new Map();

function dosyalar(kok) {
  const liste = [];
  let projeler;
  try {
    projeler = readdirSync(kok, { withFileTypes: true });
  } catch {
    return liste;
  }
  for (const proje of projeler) {
    if (!proje.isDirectory()) continue;
    const projeDizini = join(kok, proje.name);
    let icler;
    try {
      icler = readdirSync(projeDizini, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ic of icler) {
      if (ic.isFile() && ic.name.endsWith('.jsonl')) {
        liste.push({ yol: join(projeDizini, ic.name), altajan: false });
      } else if (ic.isDirectory()) {
        const alt = join(projeDizini, ic.name, 'subagents');
        let altlar;
        try {
          altlar = readdirSync(alt, { withFileTypes: true });
        } catch {
          continue;
        }
        for (const a of altlar) {
          if (a.isFile() && a.name.endsWith('.jsonl')) liste.push({ yol: join(alt, a.name), altajan: true });
        }
      }
    }
  }
  return liste;
}

// dosya kayıtları: aynı message.id içerik bloğu başına tekrar eder; çıkışı en büyük satır seçilir
function oku(yol, altajan) {
  let st;
  try {
    st = statSync(yol);
  } catch {
    onbellek.delete(yol);
    return [];
  }
  const eski = onbellek.get(yol);
  if (eski && eski.size === st.size && eski.mtimeMs === st.mtimeMs) return eski.kayitlar;

  let metin;
  try {
    metin = readFileSync(yol, 'utf8');
  } catch {
    onbellek.delete(yol);
    return [];
  }

  const harita = new Map();
  const tekiller = [];
  for (const satir of metin.split('\n')) {
    if (!satir) continue;
    let v;
    try {
      v = JSON.parse(satir);
    } catch {
      continue; // bozuk satır atlanır
    }
    if (!v || v.type !== 'assistant') continue;
    const u = v.message?.usage;
    const model = v.message?.model;
    if (!u || typeof u !== 'object' || typeof model !== 'string' || !model || model === '<synthetic>') continue;
    if (typeof v.cwd !== 'string' || !v.cwd) continue;
    const kayit = {
      id: typeof v.message?.id === 'string' ? v.message.id : null,
      model,
      cwd: v.cwd,
      ts: typeof v.timestamp === 'string' ? v.timestamp : null,
      altajan: altajan || v.isSidechain === true,
      giris: sayi(u.input_tokens),
      cikis: sayi(u.output_tokens),
      cacheOkuma: sayi(u.cache_read_input_tokens),
      cacheYazma: sayi(u.cache_creation_input_tokens),
    };
    if (kayit.id == null) {
      tekiller.push(kayit);
      continue;
    }
    const onceki = harita.get(kayit.id);
    if (!onceki || kayit.cikis > onceki.cikis) harita.set(kayit.id, kayit);
  }

  const kayitlar = [...harita.values(), ...tekiller];
  onbellek.set(yol, { size: st.size, mtimeMs: st.mtimeMs, kayitlar });
  return kayitlar;
}

const fiyatli = (f) => !!f && ALANLAR.every((k) => typeof f[k] === 'number' && Number.isFinite(f[k]));

const gun = (ts) => (typeof ts === 'string' && /^\d{4}-\d{2}-\d{2}/.test(ts) ? ts.slice(0, 10) : null);

export function claudeKullanim(projeDizini, fiyat, kok = process.env.CLAUDE_PROJECTS || join(homedir(), '.claude', 'projects')) {
  const proje = typeof projeDizini === 'string' ? projeDizini : '';
  if (!proje) return BOS();
  const icinde = (cwd) => cwd === proje || cwd.startsWith(proje + sep);

  const harita = new Map();
  let varMi = false;
  let ana = 0;
  let altajan = 0;
  let mesaj = 0;
  let toplam = 0;
  let ilk = null;
  let son = null;

  for (const { yol, altajan: altDosya } of dosyalar(kok)) {
    for (const r of oku(yol, altDosya)) {
      if (!icinde(r.cwd)) continue;
      varMi = true;
      const t = r.giris + r.cikis + r.cacheOkuma + r.cacheYazma;
      mesaj += 1;
      toplam += t;
      if (r.altajan) altajan += t;
      else ana += t;
      if (r.ts) {
        if (!ilk || r.ts < ilk) ilk = r.ts;
        if (!son || r.ts > son) son = r.ts;
      }
      const m = harita.get(r.model) ?? {
        model: r.model,
        mesaj: 0,
        giris: 0,
        cikis: 0,
        cacheOkuma: 0,
        cacheYazma: 0,
      };
      harita.set(r.model, m);
      m.mesaj += 1;
      m.giris += r.giris;
      m.cikis += r.cikis;
      m.cacheOkuma += r.cacheOkuma;
      m.cacheYazma += r.cacheYazma;
    }
  }

  if (!varMi) return BOS();

  const modeller = [...harita.values()]
    .map((m) => {
      const f = fiyat?.claude?.[m.model];
      const maliyet = fiyatli(f)
        ? (m.giris * f.giris + m.cikis * f.cikis + m.cacheOkuma * f.cacheOkuma + m.cacheYazma * f.cacheYazma) / 1e6
        : null;
      return { ...m, toplam: m.giris + m.cikis + m.cacheOkuma + m.cacheYazma, maliyet };
    })
    // yeni token (giriş+çıkış) azalan; cache okuma/yazma toplamı şişirdiği için sıralamada kullanılmaz
    .sort((a, b) => b.giris + b.cikis - (a.giris + a.cikis) || b.toplam - a.toplam || a.model.localeCompare(b.model));

  const bilinen = modeller.filter((m) => m.maliyet != null);
  return {
    var: true,
    modeller,
    toplam: {
      mesaj,
      toplam,
      ana,
      altajan,
      maliyet: bilinen.length ? bilinen.reduce((t, m) => t + m.maliyet, 0) : null,
      fiyatsiz: modeller.filter((m) => m.maliyet == null).map((m) => m.model),
    },
    ilk: gun(ilk),
    son: gun(son),
  };
}
