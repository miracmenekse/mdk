import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ZORUNLU = ['Optimize eder', 'Sorusu', 'Körlüğü', 'Ne zaman', 'Ayrışma ekseni'];

function ayrıştır(metin) {
  const satirlar = String(metin).split(/\r?\n/);
  const alanlar = [];
  const gunluk = [];
  let mevcutAlan = null;
  let gunlukte = false;
  let mevcutKart = null;
  let alanVar = false;

  for (const satir of satirlar) {
    const h2 = satir.match(/^## (.*)$/);
    if (h2) {
      mevcutKart = null;
      const baslik = h2[1].trim();
      if (baslik.startsWith('Alan:')) {
        const ad = baslik.slice('Alan:'.length).trim();
        mevcutAlan = { ad, durum: null, kartlar: [] };
        alanlar.push(mevcutAlan);
        alanVar = true;
        gunlukte = false;
      } else if (baslik.startsWith('Karar günlüğü')) {
        mevcutAlan = null;
        gunlukte = true;
      } else {
        mevcutAlan = null;
        gunlukte = false;
      }
      continue;
    }

    if (gunlukte) {
      const t = satir.trim();
      if (!t.startsWith('|')) continue;
      if (/^\|[\s\-|]+\|$/.test(t)) continue;
      const hucreler = t.split('|').map((c) => c.trim());
      if (hucreler.length && hucreler[0] === '') hucreler.shift();
      if (hucreler.length && hucreler[hucreler.length - 1] === '') hucreler.pop();
      if (hucreler.length === 0) continue;
      if (hucreler[0] === 'Tarih') continue;
      if (hucreler.length < 6) continue;
      const [, alan, , kartlarStr, eksen, kazananStr] = hucreler;
      gunluk.push({
        alan: alan.trim(),
        kartlar: kartlarStr.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
        eksen: eksen.trim(),
        kazanan: kazananStr.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
      });
      continue;
    }

    if (mevcutAlan) {
      const durumEsles = satir.match(/^\s*Durum:\s*(.*)$/);
      if (durumEsles) {
        mevcutAlan.durum = durumEsles[1].trim();
        continue;
      }
      const kartEsles = satir.match(/^### (.*)$/);
      if (kartEsles) {
        mevcutKart = { ad: kartEsles[1].trim(), alanlar: {} };
        mevcutAlan.kartlar.push(mevcutKart);
        continue;
      }
      const alanEsles = satir.match(/^-\s*\*\*(.+?):\*\*\s*(.*)$/);
      if (alanEsles && mevcutKart) {
        mevcutKart.alanlar[alanEsles[1].trim()] = alanEsles[2].trim();
      }
    }
  }

  return { alanlar, gunluk, alanVar };
}

export function denetle(metin) {
  const { alanlar, gunluk, alanVar } = ayrıştır(metin);
  if (!alanVar) {
    return [{ ad: 'dosya', seviye: 'HATA', mesaj: 'hiç ## Alan: başlığı yok' }];
  }

  const bulgular = [];
  const alanAdlari = new Map(alanlar.map((a) => [a.ad, a]));

  for (const alan of alanlar) {
    if (alan.kartlar.length < 3) {
      bulgular.push({ ad: alan.ad, seviye: 'HATA', mesaj: 'alanda 3ten az kart var' });
    }
    if (alan.kartlar.length > 5) {
      bulgular.push({ ad: alan.ad, seviye: 'UYARI', mesaj: 'alanda 5ten fazla kart var' });
    }
    if (alan.durum !== 'denendi' && alan.durum !== 'denenmemiş') {
      bulgular.push({ ad: alan.ad, seviye: 'HATA', mesaj: 'Durum denendi ya da denenmemiş olmalı' });
    }
    if (alan.durum === 'denendi') {
      const satirlar = gunluk.filter((g) => g.alan === alan.ad);
      if (satirlar.length === 0) {
        bulgular.push({ ad: alan.ad, seviye: 'HATA', mesaj: 'denendi ama günlük satırı yok' });
      }
    }

    const gorulen = new Set();
    for (const kart of alan.kartlar) {
      if (gorulen.has(kart.ad)) {
        bulgular.push({ ad: kart.ad, seviye: 'HATA', mesaj: 'yinelenen kart adı' });
      } else {
        gorulen.add(kart.ad);
      }
      for (const alanAdi of ZORUNLU) {
        if (!(alanAdi in kart.alanlar) || kart.alanlar[alanAdi] === '') {
          bulgular.push({ ad: kart.ad, seviye: 'HATA', mesaj: `zorunlu alan eksik: ${alanAdi}` });
        }
      }
    }

    if (alan.durum === 'denendi') {
      const kullanilan = new Set();
      for (const g of gunluk) {
        if (g.alan === alan.ad) {
          for (const k of g.kartlar) kullanilan.add(k);
        }
      }
      for (const kart of alan.kartlar) {
        if (!kullanilan.has(kart.ad)) {
          bulgular.push({ ad: kart.ad, seviye: 'UYARI', mesaj: 'denendi alanda hiç kullanılmadı' });
        }
      }
    }
  }

  gunluk.forEach((g, i) => {
    const n = i + 1;
    const alan = alanAdlari.get(g.alan);
    if (!alan) {
      bulgular.push({ ad: `günlük ${n}`, seviye: 'HATA', mesaj: 'alan yok' });
    } else {
      const kartAdlari = new Set(alan.kartlar.map((k) => k.ad));
      for (const k of g.kartlar) {
        if (!kartAdlari.has(k)) {
          bulgular.push({ ad: `günlük ${n}`, seviye: 'HATA', mesaj: `kart alanda yok: ${k}` });
        }
      }
    }
    if (g.eksen === '') {
      bulgular.push({ ad: `günlük ${n}`, seviye: 'HATA', mesaj: 'Eksen boş' });
    }
    for (const k of g.kazanan) {
      if (k === 'benchmark' || k === 'sentez') continue;
      if (!g.kartlar.includes(k)) {
        bulgular.push({ ad: `günlük ${n}`, seviye: 'HATA', mesaj: `Kazanan kartlarda yok: ${k}` });
      }
    }
  });

  return bulgular;
}

export function sayim(metin) {
  const { alanlar, gunluk } = ayrıştır(metin);
  const sonuc = {};
  for (const alan of alanlar) {
    for (const kart of alan.kartlar) {
      let kullanim = 0;
      let kazanma = 0;
      for (const g of gunluk) {
        if (g.kartlar.includes(kart.ad)) kullanim++;
        if (g.kazanan.includes(kart.ad) && g.kartlar.includes(kart.ad)) kazanma++;
      }
      sonuc[`${alan.ad}/${kart.ad}`] = { kullanim, kazanma };
    }
  }
  return sonuc;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const sayimFlag = args.includes('--sayim');
  let dosya = null;
  for (const a of args) {
    if (a.startsWith('--')) continue;
    dosya = a;
    break;
  }
  if (!dosya) dosya = 'personalar.md';

  let metin;
  try {
    metin = readFileSync(dosya, 'utf8');
  } catch (e) {
    console.error(`dosya okunamadı: ${dosya}`);
    process.exit(1);
  }

  const bulgular = denetle(metin);
  for (const b of bulgular) {
    console.log(`${b.ad}: ${b.seviye}: ${b.mesaj}`);
  }
  if (bulgular.length === 0) {
    console.log('personalar tamam');
  }

  if (sayimFlag) {
    const s = sayim(metin);
    for (const [anahtar, deger] of Object.entries(s)) {
      console.log(`${anahtar}: kullanım ${deger.kullanim}, kazanma ${deger.kazanma}`);
    }
  }

  const hataVar = bulgular.some((b) => b.seviye === 'HATA');
  process.exit(hataVar ? 1 : 0);
}
