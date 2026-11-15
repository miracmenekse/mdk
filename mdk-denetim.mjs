// Kapı çıktısından başarısız iddiayı ayıklar ve story boyutunu ölçer. Saf, yan etkisiz.
const kirp = (s) => s.replace(/\n+$/, '');
const yiginSatiri = (l) => /^\s+at\s/.test(l) && !/node:|node_modules/.test(l);

// Başarısız iddiayı kapı çıktısından seçer; tanınmazsa metnin son sinir karakterini döndürür.
export function hataOzeti(metin, sinir = 1500) {
  const m = metin == null ? '' : String(metin);
  const sonKarakter = kirp(m.slice(-sinir));
  if (!m) return sonKarakter;
  const s = m.split(/\r?\n/);
  const parca = [];

  // 1) BAŞARISIZ satırları (en çok 5)
  parca.push(...s.filter((l) => l.includes('BAŞARISIZ')).slice(0, 5));

  // 2) AssertionError bloğu: ilk satır ve boş ya da "    at " satırına kadar gelenler (en çok 20)
  const ai = s.findIndex((l) => l.includes('AssertionError'));
  if (ai >= 0) {
    for (let i = ai; i < s.length && i - ai < 20; i++) {
      if (i > ai && (s[i].trim() === '' || /^\s+at\s/.test(s[i]))) break;
      parca.push(s[i]);
    }
  } else {
    // 3) AssertionError yoksa ilk "…Error:" satırı
    const genel = s.find((l) => /\b[A-Za-z_$][\w$]*Error\s*:/.test(l));
    if (genel !== undefined) parca.push(genel);
  }

  // 4) node içermeyen ilk yığın satırı
  const yigin = s.find(yiginSatiri);
  if (yigin !== undefined) parca.push(yigin);

  if (!parca.length) return sonKarakter;
  const birlesik = parca.join('\n');
  return birlesik.length > sinir ? birlesik.slice(0, sinir) : birlesik;
}

// Story boyutu: 60 satırın altı küçük, 250 satır / 3 dosyanın üstü büyük; arası normal (null).
export function boyutDenetle({ dosya = 0, satir = 0 } = {}) {
  if (satir < 60) {
    return { tur: 'kucuk', ileti: `Story küçük: ${satir} satır, ${dosya} dosya (sınır 60 satır / 3 dosya); iş daha büyük olabilir.` };
  }
  if (satir > 250 || dosya > 3) {
    return { tur: 'buyuk', ileti: `Story büyük: ${satir} satır, ${dosya} dosya (sınır 250 satır / 3 dosya); daha küçük parçalara böl.` };
  }
  return null;
}
