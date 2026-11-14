// Persona takımı doğrulaması: saf fonksiyonlar, Node ve tarayıcıda çalışır.

const EN_COK_PERSONA = 12;
const AD_EN_COK = 60;
const METIN_EN_COK = 400;

const kirp = (deger) => String(deger ?? '').trim();
const kucult = (ad) => kirp(ad).toLocaleLowerCase('tr');

// Takımı doğrular; başarılıysa kırpılmış değerleri taşıyan takımı döndürür.
export function takimDenetle(girdi) {
  if (!girdi || typeof girdi !== 'object' || Array.isArray(girdi)) {
    return { tamam: false, hata: 'Takım bir nesne olmalı.' };
  }
  const { personalar } = girdi;
  if (!Array.isArray(personalar)) {
    return { tamam: false, hata: 'Personalar bir dizi olmalı.' };
  }
  if (personalar.length > EN_COK_PERSONA) {
    return { tamam: false, hata: `Takımda en çok ${EN_COK_PERSONA} persona olabilir.` };
  }

  const gorulen = new Set();
  const temiz = [];

  for (const ham of personalar) {
    if (!ham || typeof ham !== 'object' || Array.isArray(ham)) {
      return { tamam: false, hata: 'Her persona bir nesne olmalı.' };
    }

    const ad = kirp(ham.ad);
    if (!ad) return { tamam: false, hata: 'Ad boş olamaz.' };
    if (ad.length > AD_EN_COK) return { tamam: false, hata: `Ad en çok ${AD_EN_COK} karakter olabilir.` };

    const optimize = kirp(ham.optimize);
    if (!optimize) return { tamam: false, hata: `"${ad}" için optimize eder boş olamaz.` };
    if (optimize.length > METIN_EN_COK) return { tamam: false, hata: `"${ad}" için optimize eder en çok ${METIN_EN_COK} karakter olabilir.` };

    const korluk = kirp(ham.korluk);
    if (korluk.length > METIN_EN_COK) return { tamam: false, hata: `"${ad}" için körlük en çok ${METIN_EN_COK} karakter olabilir.` };

    const soru = kirp(ham.soru);
    if (soru.length > METIN_EN_COK) return { tamam: false, hata: `"${ad}" için soru en çok ${METIN_EN_COK} karakter olabilir.` };

    const anahtar = kucult(ad);
    if (gorulen.has(anahtar)) return { tamam: false, hata: `"${ad}" adı takımda zaten var.` };
    gorulen.add(anahtar);

    const persona = { ...ham, ad, optimize, korluk, soru };
    if (ham.yorumlar !== undefined) {
      if (!Array.isArray(ham.yorumlar)) return { tamam: false, hata: `"${ad}" için yorumlar bir dizi olmalı.` };
      persona.yorumlar = ham.yorumlar;
    }
    temiz.push(persona);
  }

  return { tamam: true, takim: { ...girdi, personalar: temiz } };
}

// `haric` indeksi dışında aynı ada (büyük/küçük harf duyarsız) sahip persona var mı?
export function adCakisir(takim, ad, haric = -1) {
  const liste = takim?.personalar;
  if (!Array.isArray(liste)) return false;
  const anahtar = kucult(ad);
  return liste.some((p, i) => i !== haric && kucult(p?.ad) === anahtar);
}
