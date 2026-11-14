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
      const ad = kat[1].trim();
      const nm = ad.match(/^(?:Epic|Faz)\s+(\d+(?:\.\d+)?)\b/);
      kategori = { ad, no: nm ? nm[1] : null, durum: null, tartisma: null, etki: null, figma: null, onay: false, adimlar: [] };
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
        figma: null,
      };
      if (!kategori) {
        kategori = { ad: '', no: null, durum: null, tartisma: null, etki: null, figma: null, onay: false, adimlar: [] };
        sonuc.kategoriler.push(kategori);
      }
      kategori.adimlar.push(adim);
      continue;
    }

    const onay = satir.match(/^\s*-\s+Onay:\s*evet\b/i);
    if (onay) {
      if (adim) adim.onay = true;
      else if (kategori) kategori.onay = true;
      continue;
    }

    const alan = satir.match(/^\s*-\s+(Kapı|Yürütücü|Etki|Değer|Bütçe|Persona|Figma|Durum|Tartışma):\s*(.*)$/);
    if (alan) {
      const [, anahtar, deger] = alan;
      if (!adim) {
        // kategori alanları yalnız ilk adımdan önce geçerlidir
        if (kategori) {
          if (anahtar === 'Durum') {
            const y = deger.trim();
            kategori.durum = ['analiz', 'tasarim', 'gelistirme'].includes(y) ? y : null;
          } else if (anahtar === 'Tartışma') {
            const y = deger.trim();
            kategori.tartisma = y.startsWith('epic/') && !y.includes('..') ? y : null;
          } else if (anahtar === 'Etki') {
            kategori.etki = deger.trim() || null;
          } else if (anahtar === 'Figma') {
            const y = deger.trim();
            kategori.figma = /^https:\/\/(www\.)?figma\.com\//.test(y) ? y : null;
          }
        }
        continue;
      }
      // adım altındaki Durum/Tartışma yok sayılır
      if (anahtar === 'Durum' || anahtar === 'Tartışma') continue;
      if (anahtar === 'Kapı') adim.kapilar.push(temizle(deger));
      else if (anahtar === 'Yürütücü') adim.yurutucu = deger.trim() || null;
      else if (anahtar === 'Etki') adim.etki = deger.trim() || null;
      else if (anahtar === 'Değer') adim.deger = sayiOku(deger);
      else if (anahtar === 'Persona') {
        // yalnız satır varsa atanır (nesne literaline eklenmez); yol güvenliği: persona-tur/ altında, `..` yok
        const y = deger.trim();
        adim.persona = y.startsWith('persona-tur/') && !y.includes('..') ? y : null;
      } else if (anahtar === 'Figma') {
        // yalnız figma.com adresleri kabul edilir
        const y = deger.trim();
        adim.figma = /^https:\/\/(www\.)?figma\.com\//.test(y) ? y : null;
      } else adim.butce = sayiOku(deger);
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
  sonuc.kategoriler = sonuc.kategoriler.filter((k) => k.adimlar.length > 0 || k.durum !== null);
  return sonuc;
}

export function epicDurum(kat) {
  if (!kat || typeof kat !== 'object') return 'analiz';
  const adimlar = Array.isArray(kat.adimlar) ? kat.adimlar : [];
  if (adimlar.length > 0 && adimlar.every((a) => a && a.bitti)) return 'tamamlandi';
  if (kat.durum) return kat.durum;
  if (adimlar.length > 0) return 'gelistirme';
  return 'analiz';
}
