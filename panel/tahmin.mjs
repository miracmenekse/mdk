// Maliyet tahmini: geçen denemelerin medyan token/maliyeti üzerinden.

function medyan(dizi) {
  if (dizi.length === 0) return 0;
  const s = [...dizi].sort((a, b) => a - b);
  const orta = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[orta - 1] + s[orta]) / 2 : s[orta];
}

export function tahmin(satirlar, adimSayisi) {
  const gecen = (satirlar ?? []).filter((s) => s.gecti === true);
  if (gecen.length === 0) return { token: 0, maliyet: 0, guven: 'dusuk' };
  const n = Number(adimSayisi) || 0;
  const guven = gecen.length < 3 ? 'dusuk' : gecen.length < 10 ? 'orta' : 'yuksek';
  return {
    token: medyan(gecen.map((s) => Number(s.token) || 0)) * n,
    maliyet: medyan(gecen.map((s) => Number(s.maliyet) || 0)) * n,
    guven,
  };
}
