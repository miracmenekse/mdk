// PLAN.md ayrıştırıcı
// Beklenen biçim: `## Kategori`, `- [ ] N. Başlık`, altında
// `- Kapı:`, `- Yürütücü:`, `- Etki:`, `- Değer:` satırları.
// Dosya üstünde `Yürütücü:` ve `Modeller:` ayarları olabilir.

const temizle = (s) => s.trim().replace(/^`+|`+$/g, '').trim();

export function parse(text) {
  const sonuc = { ayarlar: { yurutucu: null, modeller: [] }, kategoriler: [] };
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
        yurutucu: null,
        etki: null,
        deger: null,
      };
      if (!kategori) {
        kategori = { ad: '', adimlar: [] };
        sonuc.kategoriler.push(kategori);
      }
      kategori.adimlar.push(adim);
      continue;
    }

    const alan = satir.match(/^\s*-\s+(Kapı|Yürütücü|Etki|Değer):\s*(.*)$/);
    if (alan && adim) {
      const [, anahtar, deger] = alan;
      if (anahtar === 'Kapı') adim.kapi = temizle(deger);
      else if (anahtar === 'Yürütücü') adim.yurutucu = deger.trim() || null;
      else if (anahtar === 'Etki') adim.etki = deger.trim() || null;
      else if (anahtar === 'Değer') {
        const n = Number(deger.trim());
        adim.deger = deger.trim() !== '' && Number.isFinite(n) ? n : null;
      }
      continue;
    }

    const ust = satir.match(/^(Yürütücü|Modeller):\s*(.*)$/);
    if (ust && !kategori) {
      if (ust[1] === 'Yürütücü') ustYurutucu = ust[2].trim() || null;
      else sonuc.ayarlar.modeller = ust[2].split(',').map((m) => m.trim()).filter(Boolean);
    }
  }

  sonuc.ayarlar.yurutucu = ustYurutucu;
  for (const k of sonuc.kategoriler) {
    for (const a of k.adimlar) if (!a.yurutucu) a.yurutucu = ustYurutucu;
  }
  sonuc.kategoriler = sonuc.kategoriler.filter((k) => k.adimlar.length > 0);
  return sonuc;
}
