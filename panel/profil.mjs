// Hazır profiller: rol → model atamalarını tek istekle PLAN.md'nin `Görev <tür>:` satırlarına yazar.
// Saf fonksiyonlar; dosya okuma/yazma sunucuda.

const GOREV = /^Görev\s+([^:]+):\s*(.*)$/;

const UCRETSIZ = {
  kod: ['opencode/deepseek-v4.1-flash-free', 'opencode/glm-5.3-flash-free', 'opencode/beam-free'],
  tasarim: ['opencode/glm-5.3-flash-free', 'opencode/minimax-m3.1-flash-free', 'opencode/mimo-v2.6-flash-free'],
  persona: ['opencode/inkling-2-small-free', 'opencode/mimo-v2.6-flash-free'],
  kapi: ['opencode/beam-free', 'opencode/deepseek-v4.1-flash-free'],
  inceleme: ['opencode/minimax-m3.1-flash-free', 'opencode/inkling-2-small-free'],
  eskale: ['opencode/longcat-2.5-free', 'opencode/minimax-m3.1-flash-free', 'opencode/big-pickle'],
  mekanik: ['opencode/nemotron-3.5-lightning-free', 'opencode/flint-40b-free', 'opencode/iceman-free'],
  arastirma: ['opencode/inkling-2-small-free', 'opencode/nemotron-3.5-super-vl-free'],
  hakem: ['opencode/inkling-2-small-free', 'opencode/longcat-2.5-free', 'opencode/minimax-m3.1-flash-free'],
};

export const PROFILLER = [
  {
    ad: 'ucretsiz',
    baslik: 'Yalnız ücretsiz',
    aciklama: 'Hiç ücret ödemezsin; günlük kullanım hakkı dolunca iş bekler.',
    gorevler: UCRETSIZ,
  },
  {
    ad: 'karma',
    baslik: 'Önce ücretsiz, takılırsa abonelik',
    aciklama: 'İşi ücretsiz modeller dener; beceremezse OpenCode Go modeli devreye girer.',
    gorevler: {
      ...UCRETSIZ,
      eskale: ['opencode-go/kimi-k3', 'opencode-go/claude-haiku-5-5'],
      hakem: ['opencode-go/glm-5.3', 'opencode/inkling-2-small-free'],
    },
  },
  {
    ad: 'go',
    baslik: 'OpenCode Go aboneliğim var',
    aciklama: 'İşler abonelik modelleriyle yapılır; daha hızlı ve isabetli, abonelik kotasından düşer.',
    gorevler: {
      kod: ['opencode-go/kimi-k3', 'opencode-go/qwen3.8-max', 'opencode/deepseek-v4.1-flash-free'],
      tasarim: ['opencode-go/gemini-4-argon', 'opencode/glm-5.3-flash-free'],
      persona: ['opencode-go/mimo-v2.6-flash', 'opencode/inkling-2-small-free'],
      kapi: ['opencode-go/deepseek-v4-pro', 'opencode/beam-free'],
      inceleme: ['opencode-go/glm-5.3', 'opencode/minimax-m3.1-flash-free'],
      eskale: ['opencode-go/claude-haiku-5-5', 'opencode-go/gpt-6-luna'],
      mekanik: ['opencode-go/qwen3.8-flash', 'opencode/nemotron-3.5-lightning-free'],
      arastirma: ['opencode-go/minimax-m3.1-flash', 'opencode/inkling-2-small-free'],
      hakem: ['opencode-go/glm-5.3', 'opencode/inkling-2-small-free'],
    },
  },
];

const bul = (ad) => {
  const p = PROFILLER.find((x) => x.ad === ad);
  if (!p) throw new Error(`bilinmeyen profil: ${ad}`);
  return p;
};

// PLAN metnindeki Görev satırlarını tür → model dizisi olarak okur.
const gorevOku = (metin) => {
  const sonuc = {};
  for (const s of String(metin).split('\n')) {
    const m = s.match(GOREV);
    if (m) sonuc[m[1].trim()] = m[2].split(',').map((x) => x.trim()).filter(Boolean);
  }
  return sonuc;
};

// Profildeki her tür için Görev satırını değiştirir; PLAN'da olmayan türleri son Görev satırının
// altına (yoksa Modeller satırının altına) ekler. Başka satırlara dokunmaz.
export function profilUygula(metin, ad) {
  const profil = bul(ad);
  const satirlar = String(metin).split('\n');

  const eklenecek = [];
  for (const [tur, modeller] of Object.entries(profil.gorevler)) {
    const indeks = satirlar.findIndex((s) => {
      const m = s.match(GOREV);
      return !!m && m[1].trim() === tur;
    });
    const yeni = `Görev ${tur}: ${modeller.join(', ')}`;
    if (indeks >= 0) satirlar[indeks] = yeni;
    else eklenecek.push(yeni);
  }

  if (eklenecek.length) {
    let ekleIdx = -1;
    satirlar.forEach((s, i) => {
      if (GOREV.test(s)) ekleIdx = i;
    });
    if (ekleIdx < 0) ekleIdx = satirlar.findIndex((s) => /^Modeller:/.test(s));
    if (ekleIdx < 0) throw new Error('PLAN\'da Görev ya da Modeller satırı yok');
    satirlar.splice(ekleIdx + 1, 0, ...eklenecek);
  }
  return satirlar.join('\n');
}

// PLAN'daki Görev satırları bir profilin tüm türleriyle birebir aynıysa o profilin adı, değilse null.
export function etkinProfil(metin) {
  const mevcut = gorevOku(metin);
  const anahtarlar = Object.keys(mevcut).sort().join(',');
  for (const p of PROFILLER) {
    const beklenen = Object.keys(p.gorevler).sort();
    if (beklenen.join(',') !== anahtarlar) continue;
    if (beklenen.every((t) => p.gorevler[t].join(',') === mevcut[t].join(','))) return p.ad;
  }
  return null;
}

export function profilOzeti(metin) {
  const etkin = etkinProfil(metin);
  return PROFILLER.map((p) => ({ ad: p.ad, baslik: p.baslik, aciklama: p.aciklama, etkin: p.ad === etkin }));
}
