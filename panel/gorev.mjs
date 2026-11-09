// Görev modelleri: PLAN.md üstündeki `Görev <tür>: a, b, c` satırlarını okur/yazar.
// Seçenek listesi şimdilik statik; sağlayıcı entegrasyonu bu sabiti değiştirecek.

export const SERBEST_MODELLER = [
  'opencode/iceman-free',
  'opencode/inkling-2-small-free',
  'opencode/crouton-alpha-free',
  'opencode/longcat-2.5-free',
  'opencode/flint-40b-free',
  'opencode/nemotron-3.5-super-vl-free',
  'opencode/beam-free',
  'opencode/mimo-v2.6-flash-free',
  'opencode/deepseek-v4.1-flash-free',
  'opencode/nemotron-3.5-lightning-free',
  'opencode/big-pickle',
];

const GOREV = /^Görev\s+([^:]+):\s*(.*)$/;

const modellerOku = (s) => s.split(',').map((m) => m.trim()).filter(Boolean);

export function gorevler(metin) {
  const sonuc = [];
  for (const satir of String(metin).split('\n')) {
    const m = satir.match(GOREV);
    if (m) sonuc.push({ gorev: m[1].trim(), modeller: modellerOku(m[2]) });
  }
  return sonuc;
}

export function gorevModelYaz(metin, gorev, sira, model) {
  if (!SERBEST_MODELLER.includes(model)) {
    throw new Error(`bilinmeyen model: ${model}`);
  }
  const satirlar = String(metin).split('\n');
  const indeks = satirlar.findIndex((s) => {
    const m = s.match(GOREV);
    return !!m && m[1].trim() === gorev;
  });
  if (indeks < 0) throw new Error(`görev yok: ${gorev}`);

  const modeller = modellerOku(satirlar[indeks].match(GOREV)[2]);
  if (!Number.isInteger(sira) || sira < 0 || sira > modeller.length) {
    throw new Error(`geçersiz sıra: ${sira}`);
  }
  const mevcut = modeller.indexOf(model);
  if (mevcut !== -1 && mevcut !== sira) {
    throw new Error(`model zaten var: ${model}`);
  }
  if (sira === modeller.length) modeller.push(model);
  else modeller[sira] = model;

  satirlar[indeks] = `Görev ${gorev}: ${modeller.join(', ')}`;
  return satirlar.join('\n');
}
