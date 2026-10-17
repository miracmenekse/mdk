// Panel çizim fonksiyonları: saf, HTML string döndürür, DOM'a dokunmaz.
// Tüm kullanıcı metni esc ile kaçışlanır.

const ROZETLER = { bitti: 'bitti', calisiyor: 'çalışıyor', bekliyor: 'bekliyor', eskale: 'eskale' };
const DURUM_ETIKET = { calisiyor: 'çalışıyor', gecti: 'geçti', eskale: 'eskale', bitti: 'bitti', bekliyor: 'bekliyor' };
const GUVEN = { dusuk: 'düşük', orta: 'orta', yuksek: 'yüksek' };

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

export function planHtml(plan, simdi) {
  if (!plan || !Array.isArray(plan.kategoriler)) return '<span class="bos">PLAN.md bulunamadı</span>';
  let html = '';
  for (const kat of plan.kategoriler) {
    html += `<div><h2>${esc(kat.ad)}</h2><ul class="adimlar">`;
    for (const a of kat.adimlar) {
      const durum = adimDurumu(a, simdi);
      const bilgi = [a.yurutucu, a.kapi].filter(Boolean).map(esc).join(' · ');
      html += `<li class="${durum}">` +
        '<div class="adim-ust">' +
        `<span class="no">${esc(a.no)}</span>` +
        `<span class="baslik">${esc(a.baslik)}</span>` +
        rozet(durum) + '</div>' +
        (bilgi ? `<div class="adim-alt">${bilgi}</div>` : '') +
        '</li>';
    }
    html += '</ul></div>';
  }
  return html || '<span class="bos">adım yok</span>';
}

export function modellerHtml(modeller) {
  if (!modeller || modeller.length === 0) return '<span class="bos">metrik yok</span>';
  const satirlar = modeller.map((m) =>
    '<tr>' +
    `<td class="model">${esc(m.model)}</td>` +
    `<td class="sayi">${esc(m.deneme)}</td>` +
    `<td class="sayi">${Math.round((m.ilkDenemeOrani || 0) * 100)}%</td>` +
    `<td class="sayi">${Math.round(m.token || 0).toLocaleString('tr-TR')}</td>` +
    `<td class="sayi">${para(m.maliyet || 0)}</td>` +
    `<td class="sayi">${(m.ortSure || 0).toFixed(1)} sn</td>` +
    '</tr>').join('');
  return '<table><thead><tr>' +
    '<th class="model">model</th><th>deneme</th><th>ilk denemede geçme</th><th>token</th><th>maliyet</th><th>ort. süre</th>' +
    `</tr></thead><tbody>${satirlar}</tbody></table>`;
}

export function etkiHtml(etki) {
  if (!etki || etki.length === 0) return '<span class="bos">etki adımı yok</span>';
  const maxMaliyet = Math.max(0, ...etki.map((e) => e.tahmin?.maliyet || 0));
  return etki.map((e) => {
    const t = e.tahmin || { token: 0, maliyet: 0, guven: 'dusuk' };
    const guven = GUVEN[t.guven] ? t.guven : 'dusuk';
    const deger = Math.max(0, Math.min(5, Math.round(e.deger ?? 0)));
    const degerOran = deger / 5;
    const maliyetOran = maxMaliyet > 0 ? (t.maliyet || 0) / maxMaliyet : 0;
    // değer / maliyet çubuğu: değer oranı + maliyet oranı yan yana
    const degerW = degerOran * 100;
    const maliyetW = Math.min(maliyetOran, 1 - degerOran) * 100;
    const src = '/dosya?yol=' + encodeURIComponent(e.dosya || '');
    return '<div class="etki-kart">' +
      '<div class="etki-ust">' +
      `<span class="no">${esc(e.no)}</span>` +
      `<span class="baslik">${esc(e.baslik)}</span>` +
      yildizlar(e.deger) +
      `<span class="rozet ${guven}">${GUVEN[guven]}</span>` +
      '</div>' +
      `<div class="tahmin">~${Math.round(t.token || 0).toLocaleString('tr-TR')} token · ${para(t.maliyet || 0)}</div>` +
      '<div class="dm">değer / maliyet' +
      `<div class="dm-takip" title="değer %${Math.round(degerW)} · maliyet %${Math.round(maliyetW)}">` +
      `<i class="deger" style="width:${degerW.toFixed(1)}%"></i>` +
      `<i class="maliyet" style="width:${maliyetW.toFixed(1)}%"></i>` +
      '</div></div>' +
      '<div class="kroki">' +
      `<div><div class="etiket">önce</div><iframe loading="lazy" src="${esc(src)}#once"></iframe></div>` +
      `<div><div class="etiket">sonra</div><iframe loading="lazy" src="${esc(src)}#sonra"></iframe></div>` +
      '</div>' +
      '</div>';
  }).join('');
}
