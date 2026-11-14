import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const TURLER = ['onay', 'red', 'yorum'];

export function kararEkle(kok, girdi, simdi = Date.now()) {
  if (girdi === null || typeof girdi !== 'object' || Array.isArray(girdi)) {
    throw new Error('karar bir nesne olmalı');
  }

  const { no, epic, tur } = girdi;
  const noVar = no !== undefined;
  const epicVar = epic !== undefined;
  if (noVar && epicVar) {
    throw new Error("no ile epic ikisi birden olamaz");
  }
  if (!noVar && !epicVar) {
    throw new Error('no ya da epic gerekli');
  }
  if (noVar && (!Number.isInteger(no) || no <= 0)) {
    throw new Error('no pozitif tam sayı olmalı');
  }
  if (epicVar && (typeof epic !== 'string' || !/^[0-9.]{1,20}$/.test(epic))) {
    throw new Error('epic 1-20 karakter ve yalnız rakam/nokta olmalı');
  }
  if (typeof tur !== 'string' || !(TURLER.includes(tur) || (epicVar && tur === 'figma'))) {
    throw new Error("tur 'onay', 'red', 'yorum' ya da epic ile 'figma' olmalı");
  }

  let metin = '';
  if (girdi.metin !== undefined) {
    if (typeof girdi.metin !== 'string') {
      throw new Error('metin yazı olmalı');
    }
    metin = girdi.metin.trim();
    if (metin.length > 2000) {
      throw new Error('metin en çok 2000 karakter olmalı');
    }
  }
  if ((tur === 'red' || tur === 'yorum') && metin === '') {
    throw new Error(`${tur} için metin gerekli`);
  }

  const karar = noVar ? { ts: simdi, no, tur, metin } : { ts: simdi, epic, tur, metin };
  const dizin = join(kok, 'etki');
  mkdirSync(dizin, { recursive: true });
  appendFileSync(join(dizin, 'kararlar.jsonl'), JSON.stringify(karar) + '\n');
  return karar;
}

export function kararlar(kok) {
  const dosya = join(kok, 'etki', 'kararlar.jsonl');
  if (!existsSync(dosya)) return [];
  const sonuc = [];
  for (const satir of readFileSync(dosya, 'utf8').split('\n')) {
    if (satir.trim() === '') continue;
    try {
      sonuc.push(JSON.parse(satir));
    } catch {
      // bozuk satır atlanır
    }
  }
  return sonuc;
}
