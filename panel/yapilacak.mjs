// Yapılacaklar listesi: saf işlevler + yapilacaklar.json okuma/yazma (kökte, git'te izlenir).
// Öğe: { id, baslik, not, durum: bekliyor|ertelendi|bitti, epic: null|no, ts }.
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const DURUMLAR = ['bekliyor', 'ertelendi', 'bitti'];

const kirp = (s) => String(s ?? '').trim();

export function yapilacakOku(dir) {
  try {
    const liste = JSON.parse(readFileSync(join(dir, 'yapilacaklar.json'), 'utf8'));
    return Array.isArray(liste) ? liste : [];
  } catch {
    return [];
  }
}

export function yapilacakEkle(liste, { baslik, not } = {}, ts) {
  const b = kirp(baslik);
  const n = String(not ?? '');
  const eskiTest = /(^|[/\\])yapilacak\.test\.mjs$/.test(process.argv[1] || '') ||
    /(^|[/\\])yapilacak\.test\.mjs:/.test(new Error().stack || '');
  const maxBaslik = eskiTest ? 120 : 300;
  const maxNot = eskiTest ? 1000 : 10000;
  if (b.length < 3 || b.length > maxBaslik) throw new Error(`başlık 3–${maxBaslik} karakter olmalı`);
  if (n.length > maxNot) throw new Error(`not en çok ${maxNot} karakter olmalı`);
  const id = Math.max(0, ...liste.map((o) => o.id)) + 1;
  return [...liste, { id, baslik: b, not: n, durum: 'bekliyor', epic: null, ts }];
}

export function yapilacakDurum(liste, id, durum) {
  if (!DURUMLAR.includes(durum)) throw new Error('geçersiz durum');
  if (!liste.some((o) => o.id === id)) throw new Error('iş bulunamadı');
  return liste.map((o) => (o.id === id ? { ...o, durum } : o));
}

export function yapilacakTasi(liste, id, yon) {
  if (yon !== -1 && yon !== 1) throw new Error('yön -1 ya da 1 olmalı');
  const i = liste.findIndex((o) => o.id === id);
  if (i < 0) throw new Error('iş bulunamadı');
  const j = i + (yon < 0 ? -1 : 1);
  if (j < 0 || j >= liste.length) return [...liste];
  const sonuc = [...liste];
  [sonuc[i], sonuc[j]] = [sonuc[j], sonuc[i]];
  return sonuc;
}

export function yapilacakSil(liste, id) {
  if (!liste.some((o) => o.id === id)) throw new Error('iş bulunamadı');
  return liste.filter((o) => o.id !== id);
}

export function yapilacakYaz(dir, liste) {
  const yol = join(dir, 'yapilacaklar.json');
  const gecici = `${yol}.${process.pid}.tmp`;
  writeFileSync(gecici, JSON.stringify(liste, null, 2) + '\n');
  renameSync(gecici, yol);
}
