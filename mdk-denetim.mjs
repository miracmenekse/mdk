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

// Görev türü başına varsayılan bağlam bütçesi (okuma sınırı)
export const BAGLAM_SINIR = {
  kod: { dosya: 5, satir: 800 },
  kapi: { dosya: 4, satir: 600 },
  tasarim: { dosya: 6, satir: 1000 },
  mekanik: { dosya: 3, satir: 400 },
  eskale: { dosya: 8, satir: 1200 },
};

function sinirAyikla(metin) {
  if (!metin) return null;
  const m = String(metin).trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  const dosya = Number(m[1]), satir = Number(m[2]);
  if (Number.isInteger(dosya) && dosya > 0 && Number.isInteger(satir) && satir > 0) {
    return { dosya, satir };
  }
  return null;
}

export function baglamSiniri(gorev = 'kod', planMetni = '', adimBlok = '') {
  // 1. adimBlok içindeki "- Bağlam sınırı: <D>/<S>"
  if (adimBlok) {
    const m = adimBlok.match(/^\s*-\s*Bağlam sınırı:\s*([^\r\n]+)/im);
    if (m) {
      const s = sinirAyikla(m[1]);
      if (s) return s;
    }
  }

  // 2. planMetni başındaki "Bağlam <gorev>: <D>/<S>"
  if (planMetni) {
    const gorevKacik = (gorev || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mGorev = planMetni.match(new RegExp(`^\\s*Bağlam\\s+${gorevKacik}:\\s*([^\\r\\n]+)`, 'm'));
    if (mGorev) {
      const s = sinirAyikla(mGorev[1]);
      if (s) return s;
    }

    // 3. planMetni başındaki "Bağlam sınırı: <D>/<S>"
    const mGenel = planMetni.match(/^\s*Bağlam sınırı:\s*([^\r\n]+)/m);
    if (mGenel) {
      const s = sinirAyikla(mGenel[1]);
      if (s) return s;
    }
  }

  // 4. BAGLAM_SINIR[gorev] || BAGLAM_SINIR.kod
  const varsayilan = BAGLAM_SINIR[gorev] || BAGLAM_SINIR.kod;
  return { dosya: varsayilan.dosya, satir: varsayilan.satir };
}

export function baglamIpucu(sinir) {
  const s = sinir || BAGLAM_SINIR.kod;
  return 'Bağlam bütçesi: en çok ' + s.dosya + ' dosya ve toplam ' + s.satir + ' satır oku; hedef satır aralığını doğrudan aç.';
}

export function baglamDenetle({ okunanDosya = 0, okunanSatir = 0 } = {}, sinir = BAGLAM_SINIR.kod) {
  if (okunanDosya > sinir.dosya || okunanSatir > sinir.satir) {
    return {
      asim: true,
      ileti: `Bağlam bütçesi aşıldı: ${okunanDosya} dosya / ${okunanSatir} satır okundu (sınır ${sinir.dosya} dosya / ${sinir.satir} satır).`,
    };
  }
  return { asim: false, ileti: null };
}
