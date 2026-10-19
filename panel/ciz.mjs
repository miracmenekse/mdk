// Panel çizim fonksiyonları: saf, HTML string döndürür, DOM'a dokunmaz.
// Tüm kullanıcı metni esc ile kaçışlanır.

const ROZETLER = { bitti: 'bitti', calisiyor: 'çalışıyor', bekliyor: 'bekliyor', eskale: 'eskale' };
const DURUM_ETIKET = { calisiyor: 'çalışıyor', gecti: 'geçti', eskale: 'eskale', bitti: 'bitti', bekliyor: 'bekliyor', saglayici: 'sağlayıcı yanıt vermiyor' };
const GUVEN = { dusuk: 'düşük', orta: 'orta', yuksek: 'yüksek' };
// model tablosu veri güveni: [simge + metin, açıklama]
const VERI = {
  olculdu: ['● ölçüldü', 'Tüm denemelerde süre ve token ölçüldü'],
  kismi: ['◑ kısmi', 'Bazı denemelerde süre ya da token ölçülmedi; değerler yalnız ölçülenlerden'],
  tahmin: ['◐ tahmin', 'Bazı süre/token değerleri tahmini (bölünmüş ölçüm)'],
  'veri-yok': ['○ veri yok', 'Süre ve token hiç ölçülmedi ya da gerçek deneme yok'],
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ts saniye ya da milisaniye olabilir
const ms = (ts) => (ts < 1e12 ? ts * 1000 : ts);

function saat(ts) {
  const d = new Date(ms(ts));
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function gecenSure(ts, simdiMs) {
  if (!ts) return '—';
  const sn = Math.max(0, Math.floor((simdiMs - ms(ts)) / 1000));
  const dk = Math.floor(sn / 60);
  return dk > 0 ? `${dk} dk ${sn % 60} sn` : `${sn % 60} sn`;
}

function rozet(adi) {
  return `<span class="rozet ${adi}">${ROZETLER[adi]}</span>`;
}

function adimDurumu(a, simdi) {
  if (a.bitti) return 'bitti';
  if (simdi && simdi.adim === a.no) {
    if (simdi.durum === 'eskale') return 'eskale';
    if ((simdi.durum || 'calisiyor') === 'calisiyor') return 'calisiyor';
  }
  return 'bekliyor';
}

function para(n) {
  if (n >= 1) return '$' + n.toFixed(2);
  if (n > 0) return '$' + n.toFixed(4);
  return '$0';
}

function yildizlar(deger) {
  if (deger === null || deger === undefined) return '';
  const n = Math.max(0, Math.min(5, Math.round(Number(deger) || 0)));
  return `<span class="yildiz" title="değer: ${n}/5">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
}

export function suAnHtml(simdi, simdiMs) {
  if (!simdi) return '<span class="bos">boşta</span>';
  const durum = simdi.durum || 'calisiyor';
  // sayaç yalnızca çalışırken; bitince bitiş saati
  const son = durum === 'calisiyor'
    ? `<div class="alan"><span class="etiket">geçen süre</span><b id="sure">${esc(gecenSure(simdi.ts, simdiMs))}</b></div>`
    : `<div class="alan"><span class="etiket">bitiş</span><b>${simdi.ts ? saat(simdi.ts) : '—'}</b></div>`;
  return '<div class="ana">' +
    `<div class="alan"><span class="etiket">adım</span><b>${esc(simdi.baslik || simdi.adim || '—')}</b></div>` +
    `<div class="alan"><span class="etiket">model</span><b class="model">${esc(simdi.model || '—')}</b></div>` +
    `<div class="alan"><span class="etiket">deneme</span><b>${esc(simdi.deneme ?? '—')}</b></div>` +
    `<div class="alan"><span class="etiket">durum</span><b>${esc(DURUM_ETIKET[durum] || durum)}</b></div>` +
    son +
    '</div>';
}

export const SORUNLU_INCELEMELER = ['kismen', 'uyumsuz'];
const INCELEME_ETIKET = { uyumlu: 'uyumlu', kismen: 'kısmen', uyumsuz: 'uyumsuz' };

// kota sessizliği (sağlayıcı yanıt vermedi) gerçek deneme değildir
const sessizMi = (d) => d.neden === 'yanit_yok';

// işi gerçekte yapan: geçen ilk denemenin yürütücüsü; plandakinden farklıysa açıkça yaz
function yurutucuEtiket(a, g) {
  const plan = a.yurutucu || null;
  const gecen = g && g.denemeler ? g.denemeler.find((x) => x.gecti === true && !sessizMi(x)) : null;
  const gercek = gecen && gecen.yurutucu ? gecen.yurutucu : null;
  if (gercek && plan && gercek !== plan) return `${gercek} (plan: ${plan})`;
  return gercek || plan || null;
}

// ilk geçen deneme 1 değilse, hiç geçmediyse ya da inceleme sorunluysa true
// sessiz denemeler yok sayılır (yalnız sessizlik sorun sayılmaz)
export function sorunluMu(gecmisAdim, inceleme) {
  const d = (gecmisAdim.denemeler || []).filter((x) => !sessizMi(x));
  const ilk = d.find((x) => x.gecti === true);
  if (d.length > 0 && (!ilk || ilk.deneme > 1)) return true;
  return !!inceleme && SORUNLU_INCELEMELER.includes(inceleme.inceleme);
}

function incelemeOf(no, g, incelemeler) {
  return (incelemeler && incelemeler[no]) || (g && g.inceleme) || null;
}

function ozetHtml(g, inceleme) {
  const tum = g.denemeler || [];
  const gercek = tum.filter((x) => !sessizMi(x));
  const sessizSayi = tum.length - gercek.length;
  const ilk = gercek.find((x) => x.gecti === true);
  const parcalar = [];
  if (gercek.length > 0) {
    parcalar.push(ilk ? `${ilk.deneme}. denemede geçti` : `geçmedi (${gercek.length} deneme)`);
    if (sessizSayi > 0) parcalar.push(`${sessizSayi} sessiz`);
  } else if (sessizSayi > 0) {
    parcalar.push(`sağlayıcı sessiz (${sessizSayi})`);
  }
  const etiket = inceleme ? INCELEME_ETIKET[inceleme.inceleme] || 'incelenmedi' : 'incelenmedi';
  const sinif = inceleme && INCELEME_ETIKET[inceleme.inceleme] ? inceleme.inceleme : 'incelenmedi';
  parcalar.push(`<span class="rozet ${sinif}">${esc(etiket)}</span>`);
  if (g.commit) parcalar.push(`+${g.commit.eklenen}/−${g.commit.silinen}`, esc(g.commit.sha));
  return parcalar.join(' · ');
}

function ayrintiHtml(g, inceleme, acikMi, no) {
  const acik = acikMi ? ' open' : '';
  let icerik = '';
  if (g.commit) {
    icerik += `<div class="commit">commit: ${esc(g.commit.sha)} ${esc(g.commit.mesaj)} · ${g.commit.dosya} dosya</div>`;
  }
  for (const d of g.denemeler) {
    if (sessizMi(d)) {
      icerik += `<div class="deneme sessiz">${esc(d.deneme)}. ${esc(d.model)} ○ sağlayıcı yanıt vermedi</div>`;
      continue;
    }
    const sure = d.sure_sn == null ? '—' : d.sure_sn;
    const token = d.token == null ? '—' : Math.round(d.token).toLocaleString('tr-TR');
    icerik += `<div class="deneme">${esc(d.deneme)}. ${esc(d.model)} ${d.gecti ? '✓' : '✕'}` +
      `${d.neden ? ' ' + esc(d.neden) : ''} · ${esc(sure)} sn · ${esc(token)} token</div>`;
  }
  if (inceleme && inceleme.not) icerik += `<div class="not">Claude notu: ${esc(inceleme.not)}</div>`;
  return `<details class="ayrinti" data-no="${esc(no)}"${acik}><summary>${ozetHtml(g, inceleme)}</summary><div class="ayrinti-icerik">${icerik}</div></details>`;
}

function hukumHtml(gecmis, incelemeler) {
  const metrikli = gecmis.filter((g) => g.denemeler.length > 0);
  const sayac = { uyumlu: 0, kismen: 0, uyumsuz: 0, incelenmedi: 0 };
  let ilk = 0;
  for (const g of metrikli) {
    const inc = incelemeOf(g.no, g, incelemeler);
    const k = inc && INCELEME_ETIKET[inc.inceleme] ? inc.inceleme : 'incelenmedi';
    sayac[k]++;
    if (g.denemeler.find((x) => x.gecti === true)?.deneme === 1) ilk++;
  }
  return '<div class="hukum-kutu">' +
    `<p id="hukum">${metrikli.length} adım: ${sayac.uyumlu} uyumlu, ${sayac.kismen} kısmen, ${sayac.uyumsuz} uyumsuz, ${sayac.incelenmedi} incelenmedi · ${ilk} ilk denemede geçti</p>` +
    '<label class="sadece"><input type="checkbox" id="sadece-sorunlu"> sadece sorunlu</label>' +
    '</div>';
}

// acik: { [adımNo]: true|false } kullanıcı tercihi; yoksa sorunlu olan açılır
export function planHtml(plan, simdi, gecmis, incelemeler, acik = {}) {
  if (!plan || !Array.isArray(plan.kategoriler)) return '<span class="bos">PLAN.md bulunamadı</span>';
  const gecmisMap = new Map((gecmis || []).map((g) => [g.no, g]));
  let html = Array.isArray(gecmis) ? hukumHtml(gecmis, incelemeler) : '';
  for (const kat of plan.kategoriler) {
    html += `<div><h2>${esc(kat.ad)}</h2><ul class="adimlar">`;
    for (const a of kat.adimlar) {
      const durum = adimDurumu(a, simdi);
      const g = gecmisMap.get(a.no);
      const bilgi = [yurutucuEtiket(a, g), a.kapi].filter(Boolean).map(esc).join(' · ');
      const inc = incelemeOf(a.no, g, incelemeler);
      const sorunlu = !!g && sorunluMu(g, inc);
      const acikMi = typeof acik[a.no] === 'boolean' ? acik[a.no] : sorunlu;
      const ayrinti = g && (g.denemeler.length || g.commit || inc) ? ayrintiHtml(g, inc, acikMi, a.no) : '';
      html += `<li class="${durum}" data-sorunlu="${sorunlu ? 1 : 0}">` +
        '<div class="adim-ust">' +
        `<span class="no">${esc(a.no)}</span>` +
        `<span class="baslik">${esc(a.baslik)}</span>` +
        rozet(durum) + '</div>' +
        (bilgi ? `<div class="adim-alt">${bilgi}</div>` : '') +
        ayrinti +
        '</li>';
    }
    html += '</ul></div>';
  }
  return html || '<span class="bos">adım yok</span>';
}

export function modellerHtml(modeller) {
  if (!modeller || modeller.length === 0) return '<span class="bos">metrik yok</span>';
  // maliyet sütunu yalnızca toplam maliyet 0'dan büyükse gösterilir (ücretsiz modelde $0 gürültüdür)
  const maliyetGoster = modeller.some((m) => (m.maliyet || 0) > 0);
  const yuzde = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`);
  const satirlar = modeller.map((m) => {
    // sessizlik (kota) başarısızlık değil: deneme sayısının yanında ayrı not
    const sessiz = m.sessiz > 0 ? ` <span class="sessiz">${esc(m.sessiz)} sessiz</span>` : '';
    const deneme = m.sessiz > 0 && !m.deneme ? sessiz.trim() : esc(m.deneme ?? 0) + sessiz;
    // eski biçimde etiket yoksa varsayılan "ölçüldü"
    const etiket = VERI[m.etiket] ? m.etiket : 'olculdu';
    return '<tr>' +
      `<td>${esc(m.yurutucu || 'opencode')}</td>` +
      `<td class="model">${esc(m.model)}</td>` +
      `<td class="sayi">${deneme}</td>` +
      `<td class="sayi">${yuzde(m.ilkDenemeOrani)}</td>` +
      `<td class="sayi">${yuzde(m.uyum)}</td>` +
      `<td class="sayi">${m.token == null ? '—' : esc(Math.round(m.token).toLocaleString('tr-TR'))}</td>` +
      (maliyetGoster ? `<td class="sayi">${para(m.maliyet || 0)}</td>` : '') +
      `<td class="sayi">${m.ortSure == null ? '—' : esc(m.ortSure.toFixed(1)) + ' sn'}</td>` +
      `<td><span class="guven ${etiket}" title="${esc(VERI[etiket][1])}">${esc(VERI[etiket][0])}</span></td>` +
      '</tr>';
  }).join('');
  return '<table><thead><tr>' +
    '<th>yürütücü</th><th class="model">model</th><th>deneme</th><th>ilk denemede geçme</th><th>uyum %</th><th>token</th>' +
    (maliyetGoster ? '<th>maliyet</th>' : '') +
    `<th>ort. süre</th><th>veri</th></tr></thead><tbody>${satirlar}</tbody></table>`;
}

export function etkiHtml(etki) {
  if (!etki || etki.length === 0) return '<span class="bos">etki adımı yok</span>';
  const maxToken = Math.max(0, ...etki.map((e) => e.tahmin?.token || 0));
  return etki.map((e) => {
    const t = e.tahmin || { token: 0, maliyet: 0, guven: 'dusuk' };
    const guven = GUVEN[t.guven] ? t.guven : 'dusuk';
    const deger = Math.max(0, Math.min(5, Math.round(e.deger ?? 0)));
    // iki ayrı çubuk: değer (değer/5) ve tahmini token (en büyük token'a oran)
    const degerW = (deger / 5) * 100;
    const tokenW = maxToken > 0 ? ((t.token || 0) / maxToken) * 100 : 0;
    const maliyetYaz = (t.maliyet || 0) > 0 ? ` · ${para(t.maliyet)}` : '';
    const src = '/dosya?yol=' + encodeURIComponent(e.dosya || '');
    return '<div class="etki-kart">' +
      '<div class="etki-ust">' +
      `<span class="no">${esc(e.no)}</span>` +
      `<span class="baslik">${esc(e.baslik)}</span>` +
      yildizlar(e.deger) +
      `<span class="rozet ${guven}">${GUVEN[guven]}</span>` +
      '</div>' +
      `<div class="tahmin">~${Math.round(t.token || 0).toLocaleString('tr-TR')} token${maliyetYaz}</div>` +
      '<div class="dm">' +
      `<div class="dm-satir"><span>değer</span><div class="dm-takip"><i class="deger" style="width:${degerW.toFixed(1)}%"></i></div></div>` +
      `<div class="dm-satir"><span>token</span><div class="dm-takip"><i class="token" style="width:${tokenW.toFixed(1)}%"></i></div></div>` +
      '</div>' +
      '<div class="kroki">' +
      `<div><div class="etiket">önce</div><iframe loading="lazy" src="${esc(src)}&goster=once"></iframe></div>` +
      `<div><div class="etiket">sonra</div><iframe loading="lazy" src="${esc(src)}&goster=sonra"></iframe></div>` +
      '</div>' +
      '</div>';
  }).join('');
}

const ROLLER = { altlik: 'altlık', ornek: 'örnek', 'yan-yana': 'yan yana', izle: 'izle', kullanma: 'kullanma' };
// null/undefined → "—"; "null" yazılmaz
const yaz = (v) => esc(v ?? '—');

// suz.kategori verilirse yalnız o kategorideki adaylar; birleşimler her zaman görünür
export function arastirmaHtml(veri, suz = {}) {
  const adaylar = veri?.adaylar || [];
  const birlesimler = veri?.birlesimler || [];
  if (adaylar.length === 0 && birlesimler.length === 0) return '<span class="bos">Araştırma verisi yok</span>';
  let html = '';
  if (veri.not) html += `<p class="ara-not">${esc(veri.not)}</p>`;
  if (veri.oneri) html += `<p class="ara-oneri"><b>Öneri:</b> ${esc(veri.oneri)}</p>`;
  html += '<h3>Birleşim önerileri</h3>';
  html += birlesimler.map((b) =>
    '<div class="etki-kart">' +
    `<div class="etki-ust"><span class="baslik">${yaz(b.ad)}</span>${yildizlar(b.deger)}<span class="rozet bekliyor">efor ${yaz(b.efor)}</span></div>` +
    `<div class="adim-alt">${(b.parcalar || []).map(esc).join(' + ')}</div>` +
    `<div class="ara-alan"><span>ne</span> ${yaz(b.ne)}</div>` +
    `<div class="ara-alan"><span>neden</span> ${yaz(b.neden)}</div>` +
    `<div class="ara-alan"><span>panelde</span> ${yaz(b.panelde)}</div>` +
    `<div class="ara-alan"><span>risk</span> ${yaz(b.risk)}</div>` +
    '</div>').join('') || '<span class="bos">birleşim yok</span>';
  const liste = suz.kategori ? adaylar.filter((a) => a.kategori === suz.kategori) : adaylar;
  html += `<h3>Adaylar (${liste.length})</h3>`;
  html += liste.map((a) => {
    const kanit = a.kanit === 'doğrulanamadı' ? `<span class="rozet eskale">${esc(a.kanit)}</span>` : yaz(a.kanit);
    return '<div class="etki-kart">' +
      '<div class="etki-ust">' +
      `<a class="baslik model" href="https://github.com/${esc(a.repo)}" target="_blank" rel="noopener noreferrer">${esc(a.repo)}</a>` +
      `<span class="rozet calisiyor">${esc(ROLLER[a.rol] || a.rol)}</span>` +
      '</div>' +
      `<div class="adim-alt">${[a.kategori, a.yildiz == null ? '—' : `★ ${a.yildiz}`, a.lisans, a.son, a.dil].map(yaz).join(' · ')}</div>` +
      `<div class="ara-alan"><span>ne</span> ${yaz(a.ne)}</div>` +
      `<div class="ara-alan"><span>alınacak</span> ${yaz(a.alinacak)}</div>` +
      `<div class="ara-alan"><span>risk</span> ${yaz(a.risk)}</div>` +
      `<div class="ara-alan"><span>kanıt</span> ${kanit}</div>` +
      '</div>';
  }).join('') || '<span class="bos">bu kategoride aday yok</span>';
  return html;
}
