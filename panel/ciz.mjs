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

// metin düğümünde & tek başına etiket açmaz: özet satırında okunur ad korunur, etiket karakterleri kaçışlanır
const escMetin = (s) => esc(s).replace(/&amp;/g, '&');

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
  if (n >= 1) return '$' + n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n > 0) return '$' + n.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
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
    `<p id="hukum">${metrikli.length} ölçülen adım: ${sayac.uyumlu} uyumlu, ${sayac.kismen} kısmen, ${sayac.uyumsuz} uyumsuz, ${sayac.incelenmedi} incelenmedi · ${ilk} ilk denemede geçti</p>` +
    '<label class="sadece"><input type="checkbox" id="sadece-sorunlu"> sadece sorunlu</label>' +
    '</div>';
}

function adimlarHtml(adimlar, simdi, acik) {
  let html = '<ul class="adimlar">';
  for (const { a, g, inc, sorunlu } of adimlar) {
    const durum = adimDurumu(a, simdi);
    const bilgi = [yurutucuEtiket(a, g), a.kapi].filter(Boolean).map(esc).join(' · ');
    // süzgeç yalnız geçmişi olan ve sorunsuz tamamlanmış adımları gizler; çalışmamış adım görünür kalır
    const sorunsuz = !!g && !sorunlu;
    const acikMi = typeof acik[a.no] === 'boolean' ? acik[a.no] : sorunlu;
    const ayrinti = g && (g.denemeler.length || g.commit || inc) ? ayrintiHtml(g, inc, acikMi, a.no) : '';
    html += `<li class="${durum}" data-sorunlu="${sorunlu ? 1 : 0}" data-sorunsuz="${sorunsuz ? 1 : 0}">` +
      '<div class="adim-ust">' +
      `<span class="no">${esc(a.no)}</span>` +
      `<span class="baslik">${esc(a.baslik)}</span>` +
      rozet(durum) + '</div>' +
      (bilgi ? `<div class="adim-alt">${bilgi}</div>` : '') +
      ayrinti +
      '</li>';
  }
  return html + '</ul>';
}

// acik: { [adımNo]: true|false, ['kat:' + ad]: true|false } kullanıcı tercihi.
// secenek.sadeceSorunlu: biten bölümlerde sorunlu adım varsa kat açık gelir.
export function planHtml(plan, simdi, gecmis, incelemeler, acik = {}, secenek = {}) {
  if (!plan || !Array.isArray(plan.kategoriler)) return '<span class="bos">PLAN.md bulunamadı</span>';
  const gecmisMap = new Map((gecmis || []).map((g) => [g.no, g]));
  let html = Array.isArray(gecmis) ? hukumHtml(gecmis, incelemeler) : '';
  const bolumler = plan.kategoriler.map((kat) => {
    const adimlar = (kat.adimlar || []).map((a) => {
      const g = gecmisMap.get(a.no);
      const inc = incelemeOf(a.no, g, incelemeler);
      return { a, g, inc, sorunlu: !!g && sorunluMu(g, inc) };
    });
    return {
      kat,
      adimlar,
      bitti: adimlar.length > 0 && adimlar.every((x) => x.a.bitti),
      sorunluSayi: adimlar.filter((x) => x.sorunlu).length,
    };
  });
  // açık işi olan bölümler önce, tamamı bitenler sonra; her grup kendi sırasında
  const sirali = [...bolumler.filter((x) => !x.bitti), ...bolumler.filter((x) => x.bitti)];
  for (const x of sirali) {
    if (!x.bitti) {
      html += `<div><h2>${esc(x.kat.ad)}</h2>${adimlarHtml(x.adimlar, simdi, acik)}</div>`;
      continue;
    }
    const varsayilan = !!secenek.sadeceSorunlu && x.sorunluSayi > 0;
    const anahtar = 'kat:' + x.kat.ad;
    const acikMi = typeof acik[anahtar] === 'boolean' ? acik[anahtar] : varsayilan;
    const ozet = escMetin(x.kat.ad) + ` · ${x.adimlar.length}/${x.adimlar.length} bitti` +
      (x.sorunluSayi ? ` · ${x.sorunluSayi} sorunlu` : '');
    html += `<details class="kat" data-kat="${esc(x.kat.ad)}" data-varsayilan="${varsayilan ? 1 : 0}"${acikMi ? ' open' : ''}>` +
      `<summary>${ozet}</summary>${adimlarHtml(x.adimlar, simdi, acik)}</details>`;
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

// büyük sayılar kısaltılır: 4,1 M · 55 k · 999 (tr-TR)
function kisa(n) {
  const f = (x) => x.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  if (n >= 1e6) return f(n / 1e6) + ' M';
  if (n >= 1e3) return f(Math.round(n / 1e3)) + ' k';
  return String(Math.round(n));
}
const tam = (n) => Math.round(n).toLocaleString('tr-TR');

const kutu = (id, etiket, deger) => `<div class="kpi-kutu"><span class="etiket">${esc(etiket)}</span><b id="${id}">${esc(deger)}</b></div>`;

// üst şerit: dört sayı; bilinmeyen değer "—", eksik anlık görüntü çökmez
export function kpiHtml(snap) {
  const adimlar = (snap?.plan?.kategoriler || []).flatMap((k) => k.adimlar || []);
  const biten = snap?.plan ? `${adimlar.filter((a) => a.bitti).length} / ${adimlar.length}` : '—';
  // yalnız gerçek (sessiz olmayan) denemesi olan adımlar sayılır
  const gercekler = (snap?.gecmis || []).map((g) => (g.denemeler || []).filter((x) => !sessizMi(x))).filter((d) => d.length);
  const ilk = gercekler.length
    ? `%${Math.round((gercekler.filter((d) => d.find((x) => x.gecti === true)?.deneme === 1).length / gercekler.length) * 100)}`
    : '—';
  const tel = snap?.telemetri?.var ? snap.telemetri : null;
  const modeller = snap?.modeller || [];
  const olculen = modeller.filter((m) => typeof m.token === 'number' && Number.isFinite(m.token));
  const token = tel ? tel.toplam?.toplam : olculen.length ? olculen.reduce((t, m) => t + m.token, 0) : null;
  const odenen = tel ? tel.toplam?.maliyet : modeller.length ? modeller.reduce((t, m) => t + (Number(m.maliyet) || 0), 0) : null;
  const cl = snap?.claude?.var ? snap.claude : null;
  let claude = '—';
  if (cl?.toplam) {
    if (typeof cl.toplam.maliyet === 'number') {
      claude = '~' + para(cl.toplam.maliyet) + ((cl.toplam.fiyatsiz || []).length ? ' en az' : '');
    } else if (typeof cl.toplam.toplam === 'number') {
      claude = kisa(cl.toplam.toplam);
    }
  }
  return '<div class="kpi">' +
    kutu('kpi-biten', 'biten adım', biten) +
    kutu('kpi-ilk', 'ilk denemede geçme', ilk) +
    kutu('kpi-token', tel ? 'gerçek token' : 'ölçülen token', typeof token === 'number' ? kisa(token) : '—') +
    kutu('kpi-odenen', 'ödenen', typeof odenen === 'number' ? para(odenen) : '—') +
    kutu('kpi-claude', 'Claude (tahmin)', claude) +
    '</div>';
}

// OpenCode veritabanından gerçek token; tasarruf kartı her zaman "tahmin" etiketli
export function telemetriHtml(t) {
  if (!t || !t.var) return '<span class="bos">OpenCode veritabanı bulunamadı</span>';
  const ts = t.tasarruf;
  const kart = ts
    ? `<b>Tasarruf (tahmin):</b> ${esc(kisa(t.toplam.toplam))} token · liste fiyatıyla ~${esc(para(ts.listeFiyati))} · ödenen ${esc(para(ts.odenen))}` +
      (ts.referans ? ` <span class="soluk">(referans: ${esc(ts.referans)})</span>` : '')
    : `<b>Tasarruf (tahmin):</b> referans fiyat girilmedi · ${esc(kisa(t.toplam.toplam))} token`;
  const satirlar = t.modeller.map((m) => '<tr>' +
    `<td class="model">${esc(m.model)}</td>` +
    `<td class="sayi">${esc(tam(m.mesaj))}</td>` +
    `<td class="sayi">${esc(tam(m.giris))}</td>` +
    `<td class="sayi" title="reasoning: ${esc(tam(m.akil))}">${esc(tam(m.cikis))}</td>` +
    `<td class="sayi" title="okuma ${esc(tam(m.cacheOkuma))} · yazma ${esc(tam(m.cacheYazma))}">${esc(tam(m.cacheOkuma + m.cacheYazma))}</td>` +
    `<td class="sayi">${m.toksn == null ? '—' : esc(tam(m.toksn))}</td>` +
    '</tr>').join('');
  const kapsam = t.kapsam === 'proje' ? '(bu proje)' : '(tüm projeler)';
  return `<p class="soluk kapsam">${kapsam}</p><div class="kart tasarruf">${kart}</div>` +
    '<table><thead><tr><th class="model">model</th><th>mesaj</th><th>giriş</th><th>çıkış</th><th>cache</th><th title="mesaj başına çıkış token / mesaj süresi; ön işleme süresi dahil, üretim hızı değildir">tok/sn (mesaj)</th></tr></thead>' +
    `<tbody>${satirlar}</tbody></table>`;
}

// Claude Code oturumları: ana oturum / alt ajan ayrımıyla token ve tahmini API maliyeti
export function claudeHtml(c) {
  if (!c || !c.var) return '<span class="bos">Claude oturum verisi bulunamadı</span>';
  const t = c.toplam || {};
  const fiyatsiz = t.fiyatsiz || [];
  const pay = (n) => (typeof n === 'number' && t.toplam > 0 ? `%${Math.round((n / t.toplam) * 100)}` : '—');
  const aralik = c.ilk && c.son ? (c.ilk === c.son ? c.ilk : `${c.ilk} → ${c.son}`) : '—';
  const maliyet = typeof t.maliyet === 'number' ? `~${para(t.maliyet)}` : 'hesaplanamadı (fiyat yok)';
  const altNot = fiyatsiz.length ? ' (en az, fiyatı bilinmeyen model dahil değil)' : '';
  const satirlar = (c.modeller || []).map((m) =>
    '<tr>' +
    `<td class="model">${esc(m.model)}</td>` +
    `<td class="sayi">${esc(tam(m.mesaj))}</td>` +
    `<td class="sayi">${esc(tam(m.giris))}</td>` +
    `<td class="sayi">${esc(tam(m.cikis))}</td>` +
    `<td class="sayi" title="okuma ${esc(tam(m.cacheOkuma))} · yazma ${esc(tam(m.cacheYazma))}">${esc(tam(m.cacheOkuma + m.cacheYazma))}</td>` +
    `<td class="sayi">${m.maliyet == null ? 'fiyat yok' : esc(para(m.maliyet))}</td>` +
    '</tr>').join('');
  return '<div class="kart claude-kart">' +
    '<h3>Claude harcaması (tahmin, API karşılığı)</h3>' +
    `<p class="soluk">${esc(aralik)} · ${esc(kisa(t.toplam || 0))} token · ana ${esc(pay(t.ana))} · alt ajan ${esc(pay(t.altajan))}</p>` +
    `<p><b>Tahmini maliyet:</b> ${esc(maliyet)}${esc(altNot)}</p>` +
    '<p class="soluk">abonelikteyseniz gerçek fatura farklı olabilir.</p>' +
    '<table><thead><tr><th class="model">model</th><th>mesaj</th><th>giriş</th><th>çıkış</th><th>cache</th><th>maliyet</th></tr></thead>' +
    `<tbody>${satirlar}</tbody></table>` +
    '</div>';
}

function dengeSutun(ad, token, paraHtml) {
  const tokenHtml = typeof token === 'number' && Number.isFinite(token)
    ? `<p class="denge-token"><b>${esc(kisa(token))}</b> token</p>`
    : '<p class="denge-token soluk">veri yok</p>';
  return '<div class="denge-sutun">' +
    `<h3>${esc(ad)}</h3>` +
    tokenHtml +
    (paraHtml ? `<p class="denge-para">${paraHtml}</p>` : '') +
    '</div>';
}

// maliyet dengesi: önce ölçülen token, sonra tahmini para; para farkı ya da kat oranı yazılmaz
export function dengeHtml(tel, cl) {
  const t = tel && tel.var ? tel : null;
  const c = cl && cl.var ? cl : null;
  if (!t && !c) return '';
  const tokenT = t && typeof t.toplam?.toplam === 'number' ? t.toplam.toplam : null;
  const tokenC = c && typeof c.toplam?.toplam === 'number' ? c.toplam.toplam : null;
  const telPara = t
    ? (t.tasarruf && typeof t.tasarruf.listeFiyati === 'number'
      ? `liste fiyatıyla ~${esc(para(t.tasarruf.listeFiyati))} (kaçınılan, tahmin)`
      : '<span class="soluk">fiyat yok</span>')
    : '';
  const fiyatsiz = c?.toplam?.fiyatsiz || [];
  const clPara = c
    ? (typeof c.toplam?.maliyet === 'number'
      ? `~${esc(para(c.toplam.maliyet))}` +
        (fiyatsiz.length ? ` en az <span class="soluk">(fiyatsız: ${esc(fiyatsiz.join(', '))})</span>` : '')
      : '<span class="soluk">fiyat yok</span>')
    : '';
  const oran = tokenT !== null && tokenC !== null && tokenT + tokenC > 0
    ? `<p class="denge-oran">token'ların %${Math.round((tokenT / (tokenT + tokenC)) * 100)}'i ücretsiz modelde</p>`
    : '';
  return '<div class="kart denge">' +
    dengeSutun('OpenCode (ücretsiz)', tokenT, telPara) +
    dengeSutun('Claude', tokenC, clPara) +
    oran +
    '</div>';
}

// model × adım matrisi; renk tek başına anlam taşımaz, hücrede simge + sayı var
export function matrisHtml(m) {
  if (!m || !m.adimlar?.length || !m.modeller?.length) return '<span class="bos">metrik yok</span>';
  const hucre = (h, no) => {
    if (!h) return `<td class="hucre bos" title="adım ${esc(no)}: denenmedi"></td>`;
    const sure = h.sure == null ? '' : ` · ${h.sure} sn`;
    const [metin, title] = {
      ilk: ['✓1', `ilk denemede geçti${sure}`],
      cok: [`✓${h.deneme}`, `${h.deneme}. denemede geçti${sure}`],
      kaldi: [`✕${h.deneme}`, `geçmedi (${h.deneme} gerçek deneme)`],
      sessiz: ['○', 'yalnız kota sessizliği (sağlayıcı yanıt vermedi)'],
    }[h.durum] || ['', 'bilinmiyor'];
    const sinif = ['ilk', 'cok', 'kaldi', 'sessiz'].includes(h.durum) ? h.durum : 'bos';
    return `<td class="hucre ${sinif}" title="adım ${esc(no)}: ${esc(title)}">${esc(metin)}</td>`;
  };
  const satirlar = m.modeller.map((r) => '<tr>' +
    `<th class="model">${esc(r.model.startsWith(`${r.yurutucu || 'opencode'}/`) ? r.model : `${r.yurutucu || 'opencode'}/${r.model}`)}</th>` +
    m.adimlar.map((no) => hucre(r.hucreler?.[no], no)).join('') +
    '</tr>').join('');
  return '<div class="kaydir"><table class="matris"><thead><tr><th class="model">model</th>' +
    m.adimlar.map((no) => `<th>${esc(no)}</th>`).join('') +
    `</tr></thead><tbody>${satirlar}</tbody></table></div>` +
    '<p class="lejant">✓N = N. denemede geçti · ✕N = N gerçek denemede geçmedi · ○ = yalnız kota sessizliği · boş = denenmedi</p>';
}

// tek etki kartı: değer ve tahmini token çubukları + önce/sonra krokisi
function etkiKart(e, maxToken) {
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
}

// etki: önce açık adımlar; biten adımların taslakları katlı, adım no azalan
export function etkiHtml(etki, { gecmisAcik = false } = {}) {
  const liste = etki || [];
  if (liste.length === 0) return '<span class="bos">onay bekleyen taslak yok</span>';
  const maxToken = Math.max(0, ...liste.map((e) => e.tahmin?.token || 0));
  const aciklar = liste.filter((e) => !e.bitti);
  const bitenler = liste.filter((e) => e.bitti).sort((a, b) => b.no - a.no);
  let html = aciklar.map((e) => etkiKart(e, maxToken)).join('');
  if (bitenler.length === 0) return html;
  if (aciklar.length === 0) html += '<span class="bos">onay bekleyen taslak yok</span>';
  return html +
    `<details class="etki-gecmis"${gecmisAcik ? ' open' : ''}>` +
    `<summary>Biten adımların taslakları (${bitenler.length})</summary>` +
    bitenler.map((e) => etkiKart(e, maxToken)).join('') +
    '</details>';
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
  const yapildiMi = (b) => typeof b.adim === 'number';
  const aciklar = birlesimler.filter((b) => !yapildiMi(b));
  const yapilanlar = birlesimler.filter(yapildiMi);
  html += `<h3>Birleşim önerileri (${aciklar.length} açık, ${yapilanlar.length} yapıldı)</h3>`;
  html += [...aciklar, ...yapilanlar].map((b) =>
    '<div class="etki-kart">' +
    `<div class="etki-ust"><span class="baslik">${yaz(b.ad)}</span>${yildizlar(b.deger)}` +
    (yapildiMi(b) ? `<span class="rozet bitti">yapıldı · adım ${yaz(b.adim)}</span>` : `<span class="rozet bekliyor">efor ${yaz(b.efor)}</span>`) +
    '</div>' +
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

// göreli tarih: "5 dk önce", "3 sa önce", "3 gün önce"; geçersiz tarih "—"
function goreli(tarih, simdiMs = Date.now()) {
  const t = typeof tarih === 'number' ? tarih : Date.parse(tarih);
  if (!Number.isFinite(t)) return '—';
  const dk = Math.max(0, Math.floor((simdiMs - t) / 60000));
  if (dk < 1) return 'az önce';
  if (dk < 60) return `${dk} dk önce`;
  if (dk < 1440) return `${Math.floor(dk / 60)} sa önce`;
  return `${Math.floor(dk / 1440)} gün önce`;
}

// koşu sonucu: [simge, metin]
function kosuDurumu(k) {
  if (k.status !== 'completed') return ['…', 'sürüyor'];
  if (k.conclusion === 'success') return ['✓', 'geçti'];
  return ['✕', k.conclusion || 'başarısız'];
}

const sayiYaz = (n) => (typeof n === 'number' && Number.isFinite(n) ? String(n) : '—');

// depo şeridi: sürüm, yayımlanmamış K, Windows derlemesi, yerel; depo yoksa boş
export function depoSeritHtml(d) {
  if (!d || !d.var) return '';
  // iş akışı adı "Windows Release" (name:) ya da "windows-release" (dosya adı) olabilir
  const ad = (x) => String(x ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  const win = Array.isArray(d.ci) ? d.ci.find((k) => ad(k.workflowName) === 'windows-release') : null;
  const y = d.yerel || {};
  const yerel = `${(y.degisik || []).length} dosya · ↑${sayiYaz(y.ileri)} ↓${sayiYaz(y.geri)}`;
  // yalnız anlamlı kutular: sürüm yoksa sürüm/yayımlanmamış, windows-release yoksa CI kutusu çizilmez
  let html = '';
  if (d.surum) {
    html += kutu('kpi-surum', 'son sürüm', d.surum);
    html += kutu('kpi-yayimlanmamis', 'yayımlanmamış', Array.isArray(d.yayimlanmamis) ? `${d.yayimlanmamis.length} K` : '—');
  }
  if (win) html += kutu('kpi-ci', 'Windows derlemesi', `${kosuDurumu(win)[0]} ${kosuDurumu(win)[1]}`);
  html += kutu('kpi-yerel', 'yerel', yerel);
  return '<div class="kpi">' + html + '</div>';
}

function commitListesi(liste) {
  if (!liste || liste.length === 0) return '<span class="bos">yok</span>';
  return '<ul class="depo-liste">' + liste.map((c) =>
    `<li><span class="model">${esc(c.kisa ?? '—')}</span> ${esc(c.mesaj ?? '')} <span class="soluk">${esc(goreli(c.tarih))}</span></li>`).join('') + '</ul>';
}

// Depo sekmesi içeriği
export function depoHtml(d) {
  if (!d || !d.var) return '';
  let html = `<h3>Yayımlanmamış (${esc(d.surum || '—')} → origin/main)</h3>`;
  html += d.surum ? commitListesi(d.yayimlanmamis) : '<span class="bos">sürüm etiketi yok</span>';

  html += '<h3>GitHub Actions</h3>';
  if (d.hata) html += `<p class="depo-hata">GitHub'a ulaşılamadı: ${esc(d.hata)}</p>`;
  if (Array.isArray(d.ci) && d.ci.length) {
    html += '<ul class="depo-liste">' + d.ci.map((k) => {
      const [simge, metin] = kosuDurumu(k);
      return `<li><span title="${esc(metin)}">${esc(simge)}</span> <b>${esc(k.workflowName ?? '—')}</b> ${esc(k.displayTitle ?? '')} ` +
        `<span class="soluk">${esc(k.headBranch ?? '')} · ${esc(goreli(k.createdAt))}</span> ` +
        (k.url ? `<a href="${esc(k.url)}" rel="noopener" target="_blank">koşu</a>` : '') + '</li>';
    }).join('') + '</ul>';
  } else if (!d.hata) {
    html += `<span class="bos">${Array.isArray(d.ci) ? 'koşu yok' : 'GitHub deposu değil'}</span>`;
  }

  const y = d.yerel || {};
  html += '<h3>Yerel</h3>' +
    `<p>${esc(y.dal || '—')} · origin/main ile ↑${sayiYaz(y.ileri)} ↓${sayiYaz(y.geri)}</p>` +
    ((y.degisik || []).length
      ? '<ul class="depo-liste">' + y.degisik.map((f) => `<li class="model">${esc(f)}</li>`).join('') + '</ul>'
      : '<span class="bos">değişik dosya yok</span>');

  html += `<h3>${d.surum ? `${esc(d.surum)} ile yayımlananlar` : "Son commit'ler"}</h3>` + commitListesi(d.sonK);
  if (typeof d.ts === 'number') html += `<p class="soluk">son yoklama ${esc(goreli(d.ts))}</p>`;
  return html;
}
