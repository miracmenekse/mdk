// PLAN.md ayrıştırıcı
// Beklenen biçim: `## Kategori`, `- [ ] N. Başlık`, altında
// `- Kapı:`, `- Yürütücü:`, `- Etki:`, `- Değer:` satırları.
// Dosya üstünde `Yürütücü:` ve `Modeller:` ayarları olabilir.

const temizle = (s) => s.trim().replace(/^`+|`+$/g, '').trim();
const sayiOku = (s) => {
  const t = s.trim();
  const n = Number(t);
  return t !== '' && Number.isFinite(n) ? n : null;
};

export function parse(text) {
  const sonuc = { ayarlar: { yurutucu: null, modeller: [], butce: null }, kategoriler: [] };
  let kategori = null;
  let adim = null;
  let ustYurutucu = null;

  for (const ham of String(text).split('\n')) {
    const satir = ham.trimEnd();
    const kat = satir.match(/^##\s+(.*)$/);
    if (kat) {
      kategori = { ad: kat[1].trim(), adimlar: [] };
      sonuc.kategoriler.push(kategori);
      adim = null;
      continue;
    }

    const is = satir.match(/^-\s+\[( |x|X)\]\s+(\d+)\.\s+(.*)$/);
    if (is) {
      adim = {
        no: Number(is[2]),
        baslik: is[3].trim(),
        bitti: is[1].toLowerCase() === 'x',
        kapi: null,
        kapilar: [],
        yurutucu: null,
        etki: null,
        deger: null,
        butce: null,
        onay: false,
      };
      if (!kategori) {
        kategori = { ad: '', adimlar: [] };
        sonuc.kategoriler.push(kategori);
      }
      kategori.adimlar.push(adim);
      continue;
    }

    const onay = satir.match(/^\s*-\s+Onay:\s*evet\b/i);
    if (onay && adim) {
      adim.onay = true;
      continue;
    }

    const alan = satir.match(/^\s*-\s+(Kapı|Yürütücü|Etki|Değer|Bütçe):\s*(.*)$/);
    if (alan && adim) {
      const [, anahtar, deger] = alan;
      if (anahtar === 'Kapı') adim.kapilar.push(temizle(deger));
      else if (anahtar === 'Yürütücü') adim.yurutucu = deger.trim() || null;
      else if (anahtar === 'Etki') adim.etki = deger.trim() || null;
      else if (anahtar === 'Değer') adim.deger = sayiOku(deger);
      else adim.butce = sayiOku(deger);
      continue;
    }

    const ust = satir.match(/^(Yürütücü|Modeller|Bütçe):\s*(.*)$/);
    if (ust && !kategori) {
      if (ust[1] === 'Yürütücü') ustYurutucu = ust[2].trim() || null;
      else if (ust[1] === 'Bütçe') sonuc.ayarlar.butce = sayiOku(ust[2]);
      else sonuc.ayarlar.modeller = ust[2].split(',').map((m) => m.trim()).filter(Boolean);
    }
  }

  sonuc.ayarlar.yurutucu = ustYurutucu;
  for (const k of sonuc.kategoriler) {
    for (const a of k.adimlar) {
      if (!a.yurutucu) a.yurutucu = ustYurutucu;
      a.kapi = a.kapilar[0] ?? null;
    }
  }
  sonuc.kategoriler = sonuc.kategoriler.filter((k) => k.adimlar.length > 0);
  return sonuc;
}
