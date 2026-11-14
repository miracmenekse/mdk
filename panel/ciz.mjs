// Panel çizim fonksiyonları: saf, HTML string döndürür, DOM'a dokunmaz.
// Tüm kullanıcı metni esc ile kaçışlanır.

const ROZETLER = { bitti: 'bitti', calisiyor: 'çalışıyor', bekliyor: 'bekliyor', eskale: 'eskale' };
const DURUM_ETIKET = { calisiyor: 'çalışıyor', gecti: 'geçti', eskale: 'eskale', bitti: 'bitti', bekliyor: 'bekliyor', saglayici: 'sağlayıcı yanıt vermiyor', regresyon: 'ön regresyon koşuyor', regresyon_kirmizi: 'ön regresyon kırmızı' };
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

function rozet(adi, etiket) {
  const metin = etiket ?? ROZETLER[adi] ?? '';
  return `<span class="rozet ${adi}">${esc(metin)}</span>`;
}

// adımın akıştaki aşaması: neyi beklediğini söyleyen rozet ve aşamaya göre ilerleme.
// (1) adım bitti → (2) koşturucu bu adımdaysa durumuna göre → (3) etki kaydına göre → (4) sırada
export function adimAsama(adim, simdi, etki) {
  if (adim?.bitti) return { sinif: 'bitti', etiket: 'bitti', yuzde: 100 };
  if (simdi && simdi.adim === adim?.no) {
    const d = simdi.durum || 'calisiyor';
    const kural = {
      '': ['calisiyor', 'kod yazılıyor', 75],
      calisiyor: ['calisiyor', 'kod yazılıyor', 75],
      regresyon: ['calisiyor', 'ön regresyon', 45],
      persona: ['calisiyor', 'persona turu', 40],
      kapi_yaziliyor: ['calisiyor', 'kapı yazılıyor', 55],
      gecti: ['bitti', 'bitti', 100],
      eskale: ['eskale', 'eskale', 100],
      kapi_hata: ['hata', 'kapı üretilemedi', 55],
      regresyon_kirmizi: ['hata', 'ön regresyon kırmızı', 45],
      ortam_hatasi: ['hata', 'ortam hatası', 75],
      saglayici: ['hata', 'sağlayıcı yanıt vermiyor', 75],
      kilit: ['hata', 'modeller kilitli', 75],
    }[d];
    if (kural) return { sinif: kural[0], etiket: kural[1], yuzde: kural[2] };
    // bilinmeyen koşturucu durumu: etiketi değerin kendisi olsun
    return { sinif: 'calisiyor', etiket: String(d), yuzde: 50 };
  }
  if (etki) {
    if (etki.onay === true) return { sinif: 'bekliyor', etiket: 'sırada', yuzde: 35 };
    if (etki.figma) return { sinif: 'karar', etiket: 'adım onayı bekliyor', yuzde: 30 };
    if (etki.karar?.tur === 'onay') return { sinif: 'karar', etiket: 'Figma bekleniyor', yuzde: 20 };
    if (etki.karar?.tur === 'red') return { sinif: 'karar', etiket: 'taslak düzeltiliyor', yuzde: 10 };
    return { sinif: 'karar', etiket: 'taslak onayı bekliyor', yuzde: 10 };
  }
  return { sinif: 'bekliyor', etiket: 'sırada', yuzde: 0 };
}

function adimDurumu(a, simdi) {
  if (a.bitti) return 'bitti';
  if (simdi && simdi.adim === a.no) {
    if (simdi.durum === 'eskale') return 'eskale';
    const d = simdi.durum || 'calisiyor';
    // ön regresyon koşarken adım çalışıyor sayılır; kırmızı regresyon beklemeye döner
    if (d === 'calisiyor' || d === 'regresyon') return 'calisiyor';
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
  // sayaç yalnızca çalışırken (ön regresyon dahil); bitince bitiş saati
  const son = durum === 'calisiyor' || durum === 'regresyon'
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

// kota sessizliği (sağlayıcı yanıt vermedi) gerçek deneme değildir;
// kota dolumu da gerçek deneme değildir ama geçmişte ayrı sayılır
const sessizMi = (d) => d.neden === 'yanit_yok';
const kotaMi = (d) => d.neden === 'kota';
const denemeDegilMi = (d) => sessizMi(d) || kotaMi(d);

// işi gerçekte yapan: geçen ilk denemenin yürütücüsü; plandakinden farklıysa açıkça yaz
function yurutucuEtiket(a, g) {
  const plan = a.yurutucu || null;
  const gecen = g && g.denemeler ? g.denemeler.find((x) => x.gecti === true && !denemeDegilMi(x)) : null;
  const gercek = gecen && gecen.yurutucu ? gecen.yurutucu : null;
  if (gercek && plan && gercek !== plan) return `${gercek} (plan: ${plan})`;
  return gercek || plan || null;
}

// ilk geçen deneme 1 değilse, hiç geçmediyse ya da inceleme sorunluysa true
// sessiz ve kota denemeleri yok sayılır (yalnız sessizlik ya da kota sorun sayılmaz)
export function sorunluMu(gecmisAdim, inceleme) {
  const d = (gecmisAdim.denemeler || []).filter((x) => !denemeDegilMi(x));
  const ilk = d.find((x) => x.gecti === true);
  if (d.length > 0 && (!ilk || ilk.deneme > 1)) return true;
  return !!inceleme && SORUNLU_INCELEMELER.includes(inceleme.inceleme);
}

function incelemeOf(no, g, incelemeler) {
  return (incelemeler && incelemeler[no]) || (g && g.inceleme) || null;
}

function ozetHtml(g, inceleme) {
  const tum = g.denemeler || [];
  const gercek = tum.filter((x) => !denemeDegilMi(x));
  const sessizSayi = tum.filter((x) => sessizMi(x)).length;
  const kotaSayi = tum.filter((x) => kotaMi(x)).length;
  const ilk = gercek.find((x) => x.gecti === true);
  const parcalar = [];
  if (gercek.length > 0) {
    parcalar.push(ilk ? `${ilk.deneme}. denemede geçti` : `geçmedi (${gercek.length} deneme)`);
    if (sessizSayi > 0) parcalar.push(`${sessizSayi} sessiz`);
    if (kotaSayi > 0) parcalar.push(`${kotaSayi} kota`);
  } else if (sessizSayi > 0) {
    parcalar.push(`sağlayıcı sessiz (${sessizSayi})`);
  } else if (kotaSayi > 0) {
    parcalar.push(`kota doldu (${kotaSayi})`);
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
    if (kotaMi(d)) {
      icerik += `<div class="deneme sessiz">${esc(d.deneme)}. ${esc(d.model)} ○ kota doldu</div>`;
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
// persona turu ozet.md metnini balonlara çevirir; her `## <kart>` başlığı bir balon.
// `# Persona turu` H1 ve özet `- ...` satırları (ilk `## ` öncesi) balon olmaz.
// avatar baş harfleri: iki kelimesi ilk harfleri ('Ürün Sahibi' → 'ÜS'), tek kelimesi ilk iki harfi ('Mühendis' → 'MÜ')
function basHarf(ad) {
  const k = String(ad ?? '').trim().split(/\s+/);
  const s = k.length >= 2 && k[0] && k[1] ? k[0][0] + k[1][0] : k[0].slice(0, 2);
  return s.toLocaleUpperCase('tr');
}

export function personaBalonlarHtml(ozet) {
  const metin = String(ozet || '').trim();
  if (!metin) return '<p class="bos">bu adım için persona turu yok</p>';
  const bloklar = [];
  let cari = null;
  for (const satir of metin.split('\n')) {
    const baslik = satir.match(/^##\s+(.+?)\s*$/);
    if (baslik) {
      cari = { rol: baslik[1], govde: [] };
      bloklar.push(cari);
    } else if (cari) {
      cari.govde.push(satir);
    }
  }
  if (bloklar.length === 0) return '<p class="bos">bu adım için persona turu yok</p>';
  const renkler = ['persona-a', 'persona-b', 'persona-c'];
  return bloklar
    .map((b, i) => {
      const govde = esc(b.govde.join('\n').trim()).replace(/\n+/g, '<br>');
      return (
        `<div class="persona-balon ${renkler[i % renkler.length]}">` +
        `<span class="avatar">${esc(basHarf(b.rol))}</span>` +
        `<div class="icerik"><span class="rol">${esc(b.rol)}</span>` +
        `<p class="metin">${govde}</p></div></div>`
      );
    })
    .join('');
}

// persona takımı kartları: her persona için ad + avatar + sıraya göre persona-a/b/c rengi;
// gövdede optimize eder / körlüğü / sorusu alanları
export function personaTakimHtml(takim) {
  const liste = (takim && takim.personalar) || [];
  if (liste.length === 0) return '<span class="bos">persona takımı yok</span>';
  const renkler = ['persona-a', 'persona-b', 'persona-c'];
  return liste.map((p, i) => {
    const yorumlar = (p.yorumlar || [])
      .map((y) => `<div class="persona-not">${escMetin(typeof y === 'string' ? y : y.metin || '')}</div>`)
      .join('');
    return `<div class="persona-kart ${renkler[i % renkler.length]}" data-index="${esc(i)}">` +
      '<div class="persona-bas">' +
      `<span class="avatar">${esc(basHarf(p.ad))}</span>` +
      `<span class="ad">${esc(p.ad ?? '—')}</span>` +
      `<button type="button" class="persona-sil" data-index="${esc(i)}" title="personayı sil">sil</button>` +
      '</div>' +
      '<div class="persona-govde">' +
      `<div class="ara-alan"><span>optimize eder</span> ${escMetin(p.optimize ?? '—')}</div>` +
      `<div class="ara-alan"><span>körlüğü</span> ${escMetin(p.korluk ?? '—')}</div>` +
      `<div class="ara-alan"><span>sorusu</span> ${escMetin(p.soru ?? '—')}</div>` +
      '</div>' +
      (yorumlar ? `<div class="persona-notlar">${yorumlar}</div>` : '') +
      `<form class="persona-yorum" data-index="${esc(i)}"><input type="text" maxlength="500" placeholder="yorum / geri bildirim"><button type="submit">gönder</button></form>` +
      '</div>';
  }).join('');
}

// v3 Akış düz ADIMLAR tablosu: Adım / İlerleme / Durum. Her satır data-adim=<no> (tıklanabilir,
// drawer'ı açar). Gruplu kategori / deneme-genişletme / "sadece sorunlu" süzgeci YOK (planHtml ayrı).
function storySatiriHtml(a, g, simdi, etki) {
  const asama = adimAsama(a, simdi, etki);
  const calisiyorMu = asama.sinif === 'calisiyor';
  const gercek = g ? (g.denemeler || []).filter((x) => !denemeDegilMi(x)) : [];
  const rep = gercek.find((x) => x.gecti === true) || gercek[gercek.length - 1] || null;
  const mp = [];
  if (calisiyorMu && simdi) {
    if (simdi.model) mp.push(esc(simdi.model));
    if (simdi.deneme != null) mp.push(`${esc(simdi.deneme)}. deneme`);
  } else if (rep) {
    if (rep.model) mp.push(esc(rep.model));
    if (gercek.length) mp.push(`${gercek.length} deneme`);
    if (rep.sure_sn != null) mp.push(`${esc(rep.sure_sn)} sn`);
    if (rep.token != null) mp.push(`${Math.round(rep.token).toLocaleString('tr-TR')} token`);
  }
  const meta = mp.length ? `<div class="meta">${mp.join(' · ')}</div>` : '';
  const yuzde = asama.yuzde;
  const secili = calisiyorMu ? ' secili' : '';
  return `<tr class="adim-satir ${asama.sinif}${secili}" data-adim="${esc(a.no)}" tabindex="0">` +
    `<td class="ad"><span class="no">${esc(a.no)}</span> ${esc(a.baslik)}${meta}</td>` +
    `<td class="ilerleme"><div class="cubuk"><span style="width:${yuzde}%"></span></div><span class="yuzde">%${yuzde}</span></td>` +
    `<td class="durum">${rozet(asama.sinif, asama.etiket)}</td>` +
    '</tr>';
}

export function akisTablosuHtml(plan, simdi, gecmis, incelemeler, etki = []) {
  const gecmisMap = new Map((gecmis || []).map((g) => [g.no, g]));
  const satirlar = [];
  for (const k of (plan && plan.kategoriler) || []) {
    for (const a of k.adimlar) {
      satirlar.push(storySatiriHtml(a, gecmisMap.get(a.no), simdi, (etki || []).find((e) => e.no === a.no)));
    }
  }
  return (
    '<table class="akis-tablo"><thead><tr><th class="ad">Adım</th><th class="ilerleme">İlerleme</th><th class="durum">Durum</th></tr></thead>' +
    `<tbody>${satirlar.reverse().join('')}</tbody></table>`
  );
}

const EPIC_ETIKET = { analiz: 'Analiz', tasarim: 'Tasarım', gelistirme: 'Geliştirme', tamamlandi: 'Tamamlandı' };

// Geliştirme sekmesi: her kategori bir Epic satırı; açık Epic'in altında yalnız kendi
// story'lerini gösteren tablo (yeni adım üstte). Açık/kapalı tercihi acik[sira] ile.
export function gelistirmeHtml(plan, simdi, gecmis, incelemeler, etki = [], epikler = [], acik = {}) {
  if (!plan || !Array.isArray(plan.kategoriler)) return '<span class="bos">PLAN.md bulunamadı</span>';
  const gecmisMap = new Map((gecmis || []).map((g) => [g.no, g]));
  const etkiList = etki || [];
  const epikList = epikler || [];
  const ogeler = plan.kategoriler.map((kat, sira) => {
    const adimlar = kat.adimlar || [];
    const biten = adimlar.filter((a) => a.bitti).length;
    const kayit = epikList.find((e) => e.ad === kat.ad);
    let statu;
    if (kayit?.statu) statu = kayit.statu;
    else if (adimlar.length && biten === adimlar.length) statu = 'tamamlandi';
    else if (adimlar.length) statu = 'gelistirme';
    else statu = 'analiz';
    const acikMi = typeof acik[sira] === 'boolean' ? acik[sira] : statu !== 'tamamlandi';
    return { kat, sira, adimlar, biten, kayit, statu, acikMi };
  });
  // açık işi olan Epic'ler önce, tamamlananlar sonra; her grupta dosyada sonra gelen üstte
  const sirali = [
    ...ogeler.filter((x) => x.statu !== 'tamamlandi').sort((a, b) => b.sira - a.sira),
    ...ogeler.filter((x) => x.statu === 'tamamlandi').sort((a, b) => b.sira - a.sira),
  ];
  let html = '';
  for (const x of sirali) {
    let dugme = '';
    if (x.kat.no != null && x.kat.no !== '') {
      const tartismaBitti = x.kayit?.tartisma?.durum === 'bitti' && !x.kayit.onay && x.statu !== 'tamamlandi';
      const bekleyen = x.adimlar.filter((a) => etkiList.some((e) => e.no === a.no && !e.bitti && !e.onay)).length;
      let sinif = 'epic-detay';
      let metin = 'Detay';
      if (tartismaBitti) {
        sinif += ' uyari';
        metin = 'Detay · çözüm onayı bekliyor';
      } else if (bekleyen > 0) {
        sinif += ' uyari';
        metin = `Detay · ${bekleyen} story karar bekliyor`;
      }
      dugme = `<button type="button" class="${sinif}" data-epic-no="${esc(x.kat.no)}">${esc(metin)}</button>`;
    }
    html += `<div class="epic-satir" data-epic="${x.sira}" tabindex="0" aria-expanded="${x.acikMi ? 'true' : 'false'}">` +
      `<span class="epic-ad">${esc(x.kat.ad)}</span>` +
      `<span class="epic-ilerleme">${esc(x.biten)} / ${esc(x.adimlar.length)}</span>` +
      `<span class="rozet epic-${esc(x.statu)}">${esc(EPIC_ETIKET[x.statu] || x.statu)}</span>` +
      dugme +
      '</div>';
    if (!x.acikMi) continue;
    html += '<div class="epic-govde">';
    if (x.adimlar.length === 0) {
      html += '<p class="bos">henüz story yok</p>';
    } else {
      const satirlar = [...x.adimlar].reverse()
        .map((a) => storySatiriHtml(a, gecmisMap.get(a.no), simdi, etkiList.find((e) => e.no === a.no)));
      html += '<table class="akis-tablo"><thead><tr><th class="ad">Story</th><th class="ilerleme">İlerleme</th><th class="durum">Durum</th></tr></thead>' +
        `<tbody>${satirlar.join('')}</tbody></table>`;
    }
    html += '</div>';
  }
  return html;
}

// adım detay drawer'ı (kart=sekme tasarımı): başlık (ADIM no + ad + kapat), durum satırı,
// ilerleme, PERSONA DÜŞÜNCELERİ (boş #drawer-persona kabı, JS lazy doldurur), ETKİ bölümü.
// Açık drawer'ın canlı yenilenmesi için kararlı imza: yalnız gösterilen persona/etki
// alanlarından üretilir; başlık gibi başka alanlar imzayı değiştirmez.
export function drawerImza(adim, etki) {
  const a = adim || {};
  const e = etki || {};
  return JSON.stringify([
    a.persona ?? null,
    a.bitti ?? null,
    e.figma ?? null,
    e.onay ?? null,
    e.bitti ?? null,
    e.karar?.ts ?? null,
    e.alindi ?? null,
  ]);
}

// etkiKartiHtml: o adımın etki kartı HTML'i (karar formuyla) ya da null → "etki yok".
export function drawerHtml(adim, etkiKartiHtml) {
  const a = adim || {};
  const durum = a.durum || 'bekliyor';
  // etiket verilmişse rozet metni o; yoksa eski durum→sınıf eşlemesi
  const eskiSinif = ROZETLER[durum]
    ? durum
    : durum === 'regresyon'
      ? 'calisiyor'
      : 'bekliyor';
  const sinif = a.sinif || eskiSinif;
  const parcalar = [];
  if (a.model) parcalar.push(`<span class="model">${esc(a.model)}</span>`);
  if (a.deneme != null) parcalar.push(`${esc(a.deneme)}. deneme`);
  if (a.ts) parcalar.push(saat(a.ts));
  const meta = parcalar.join(' · ');
  const gecen = a.calisiyor && a.ts
    ? ` · <b class="gecen" id="drawer-sure">${esc(gecenSure(a.ts, a.simdiMs ?? Date.now()))}</b>`
    : '';
  const ilerleme = a.yuzde != null
    ? `<div class="ilerleme"><span style="width:${Math.max(0, Math.min(100, Number(a.yuzde) || 0))}%"></span></div><span class="yuzde">%${esc(a.yuzde)}</span>`
    : '';
  return (
    '<div class="drawer-ic">' +
    '<div class="drawer-bas">' +
    `<div><span class="etiket">ADIM</span> <b>${esc(a.no ?? '—')}</b></div>` +
    '<button type="button" id="drawer-kapat" aria-label="kapat">×</button>' +
    '</div>' +
    `<h2 class="drawer-baslik">${esc(a.baslik || '—')}</h2>` +
    `<div class="drawer-durum">${rozet(sinif, a.etiket)} ${meta}${gecen}</div>` +
    ilerleme +
    '<h3 class="drawer-bolum">PERSONA DÜŞÜNCELERİ</h3>' +
    '<div id="drawer-persona"></div>' +
    '<h3 class="drawer-bolum">ETKİ</h3>' +
    (etkiKartiHtml || '<p class="bos">etki yok</p>') +
    '</div>'
  );
}

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

// görev modelleri: her `Görev <tür>:` satırı için model seçicileri ve yedek ekleme
export function gorevModelleriHtml(gorevler, serbest) {
  if (!gorevler || gorevler.length === 0) return '<span class="bos">görev yok</span>';
  const liste = Array.isArray(serbest) ? serbest : [];
  const secenekler = (gorev, model, sira) => {
    const ops = [];
    // mevcut model ücretsiz listede yoksa en üstte seçili gelir
    if (!liste.includes(model)) {
      ops.push(`<option value="${esc(model)}" selected>(${esc(model)}) — ücretsiz değil</option>`);
    }
    for (const m of liste) {
      ops.push(`<option value="${esc(m)}"${m === model ? ' selected' : ''}>${esc(m)}</option>`);
    }
    return `<select class="gorev-model" data-gorev="${esc(gorev)}" data-sira="${sira}">${ops.join('')}</select>`;
  };
  const satirlar = gorevler.map((g) => {
    const modeller = Array.isArray(g.modeller) ? g.modeller : [];
    const hucreler = modeller.map((m, i) => `<td>${secenekler(g.gorev, m, i)}</td>`).join('');
    const yedek = `<td><select class="gorev-model" data-gorev="${esc(g.gorev)}" data-sira="${modeller.length}">` +
      '<option value="">+ yedek ekle</option>' +
      liste.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join('') +
      '</select></td>';
    return `<tr><td>${esc(g.gorev)}</td>${hucreler}${yedek}</tr>`;
  }).join('');
  return '<p class="not">Seçenekler şimdilik sabit ücretsiz OpenCode listesi; sağlayıcı entegrasyonu sonra.</p>' +
    '<table><thead><tr><th>görev</th><th>modeller</th></tr></thead>' +
    `<tbody>${satirlar}</tbody></table>`;
}

// kapı üretimi: hangi model kapı testini yazdı, kabul/ret nedenleri, kota ve ortalama süre
const KAPI_NEDENLERI = {
  kapi_yesil: 'kod yazılmadan yeşil',
  kapi_sozdizimi: 'sözdizimi bozuk',
  kapi_eksik: 'dosya yazılmadı',
  kapi_kapsam: 'başka dosyaya yazdı',
};
export function kapiUretimHtml(kapiUretim) {
  if (!kapiUretim || !Array.isArray(kapiUretim) || kapiUretim.length === 0) return '<p class="bos">henüz kapı üretilmedi</p>';
  // azalan deneme; eşitse model adı artan
  const sirali = [...kapiUretim].sort((a, b) => (b.deneme || 0) - (a.deneme || 0) || String(a.model).localeCompare(String(b.model)));
  const satirlar = sirali.map((m) => {
    const kabul = m.deneme
      ? `${esc(m.kabul ?? 0)} / ${esc(m.deneme)} · %${Math.round(((m.kabul || 0) / m.deneme) * 100)}`
      : '—';
    // bilinmeyen ret kodu olduğu gibi yazılır (kaçışlanmış)
    const nedenler = Object.entries(m.nedenler || {})
      .map(([kod, sayi]) => `${esc(KAPI_NEDENLERI[kod] || kod)} ×${esc(sayi)}`)
      .join(', ') || '—';
    const azOrnek = m.deneme < 5 ? ' <span class="rozet az-ornek">az örnek · sırayı henüz değiştirme</span>' : '';
    return '<tr>' +
      `<td class="model">${esc(m.model)}${azOrnek}</td>` +
      `<td class="sayi">${esc(m.deneme ?? 0)}</td>` +
      `<td class="sayi">${kabul}</td>` +
      `<td>${nedenler}</td>` +
      `<td class="sayi">${esc(m.sessiz ?? 0)}</td>` +
      `<td class="sayi">${m.ortSure == null ? '—' : esc(Math.round(m.ortSure)) + ' sn'}</td>` +
      '</tr>';
  }).join('');
  return '<p class="not">kabul = sözdizimi temiz, kod yazılmadan kırmızı · kabul % kod başarısı değildir</p>' +
    '<table><thead><tr><th>model</th><th>deneme</th><th>kapı kabul</th><th>ret nedenleri</th><th>kota</th><th>ort. sn</th></tr></thead>' +
    `<tbody>${satirlar}</tbody></table>`;
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
export function kpiHtml(snap, ara) {
  const adimlar = (snap?.plan?.kategoriler || []).flatMap((k) => k.adimlar || []);
  const biten = snap?.plan ? `${adimlar.filter((a) => a.bitti).length} / ${adimlar.length}` : '—';
  const modeller = snap?.modeller || [];
  const depo = snap?.depo;
  const ileri = depo?.yerel?.ileri;
  const degisik = (depo?.yerel?.degisik || []).length;
  // dikkat sayıları (rozet): Akış = sorunlu adım, Modeller = sorunlu model, Depo = değişen dosya, Araştırma = 0
  const sorunluAdim = (snap?.gecmis || []).filter((g) => sorunluMu(g, incelemeOf(g.no, g, snap?.incelemeler))).length;
  const sorunluModel = modeller.filter((m) => (m.uyum != null && m.uyum < 1) || m.sessiz > 0).length;
  const adaylar = ara?.adaylar?.length;

  // kart = aynı zamanda sekme düğmesi (role=tab + data-sekme); rozet dikkat sayısı, 0'da gizli
  const kart = (sekme, ad, deger, alt, dikkat) => {
    const r = dikkat > 0 ? `<span class="kpi-rozet">${esc(dikkat)}</span>` : '';
    return `<button type="button" role="tab" data-sekme="${sekme}" aria-selected="false" aria-controls="sekme-${sekme}" class="kpi-kart">` +
      `<span class="kart-bas"><span class="ad">${esc(ad)}</span>${r}</span>` +
      `<b class="deger">${esc(deger)}</b>` +
      `<span class="alt">${esc(alt)}</span></button>`;
  };
  let kartlar = '';
  if (depo?.var) kartlar += kart('depo', 'Depo', ileri ?? '—', 'bekleyen commit', degisik);
  kartlar += kart('akis', 'Geliştirme', biten, 'biten story', sorunluAdim);
  kartlar += kart('modeller', 'Modeller', modeller.length || '—', 'etkin model', sorunluModel);
  kartlar += kart('arastirma', 'Araştırma', adaylar ?? '—', 'araştırma notu', 0);
  const pSay = (snap?.personaTakim?.personalar || []).length;
  kartlar += kart('persona', 'Persona', pSay || '—', 'takım üyesi', 0);
  return '<div class="kpi" role="tablist">' + kartlar + '</div>';
}

// bekleyen karar şeridi: kartların altında tek satır; tık ilk bekleyen adımın çekmecesini açar
export function kararSeridiHtml(etki) {
  const bekleyen = (etki || []).filter((e) => !e.bitti && !e.onay);
  if (!bekleyen.length) return '';
  const ilk = bekleyen.reduce((a, b) => (b.no < a.no ? b : a));
  const asama = ilk.figma ? 'adım onayı' : 'taslak onayı';
  return `<button type="button" class="karar-seridi" data-adim="${esc(ilk.no)}">` +
    `${esc(bekleyen.length)} adım karar bekliyor · ${esc(ilk.no)} ${esc(ilk.baslik)}: ${asama} →</button>`;
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

// Modeller v2 — birleşik "TOKEN PAYI VE MALIYET" kartı: degrade halka gauge + maliyet rakamları + lejant
export function tokenPayiHtml(snap) {
  const tel = snap?.telemetri?.var ? snap.telemetri : null;
  const cl = snap?.claude?.var ? snap.claude : null;
  const ocToken = tel && typeof tel.toplam?.toplam === 'number'
    ? tel.toplam.toplam
    : (snap?.modeller || []).reduce((t, m) => t + (Number.isFinite(m.token) ? m.token : 0), 0);
  const clToken = cl && typeof cl.toplam?.toplam === 'number' ? cl.toplam.toplam : 0;
  const toplam = ocToken + clToken;
  const ocPct = toplam > 0 ? Math.round((ocToken / toplam) * 100) : 0;
  const clPct = toplam > 0 ? 100 - ocPct : 0;
  const telPara = tel && tel.tasarruf && typeof tel.tasarruf.listeFiyati === 'number'
    ? `liste fiyatıyla ~${esc(para(tel.tasarruf.listeFiyati))} (kaçınılan, tahmin)`
    : 'fiyat yok';
  const clPara = cl && typeof cl.toplam?.maliyet === 'number'
    ? `~${esc(para(cl.toplam.maliyet))}${(cl.toplam.fiyatsiz || []).length ? ' en az' : ''}`
    : 'fiyat yok';
  const r = 66;
  const C = 2 * Math.PI * r;
  const ocLen = (ocPct / 100) * C;
  const clLen = (clPct / 100) * C;
  const donut = toplam > 0
    ? `<svg viewBox="0 0 180 180" class="donut" role="img" aria-label="token payı halkası">` +
      '<defs><linearGradient id="g-claude" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#e537c9"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs>' +
      '<g transform="rotate(-90 90 90)" fill="none" stroke-width="22">' +
      `<circle cx="90" cy="90" r="${r}" stroke="var(--cizgi)"/>` +
      `<circle cx="90" cy="90" r="${r}" stroke="#22d3ee" stroke-dasharray="${ocLen.toFixed(1)} ${(C - ocLen).toFixed(1)}"/>` +
      `<circle cx="90" cy="90" r="${r}" stroke="url(#g-claude)" stroke-dasharray="${clLen.toFixed(1)} ${(C - clLen).toFixed(1)}" stroke-dashoffset="${(-ocLen).toFixed(1)}"/>` +
      '</g>' +
      `<text x="90" y="86" text-anchor="middle" class="donut-buyuk">${esc(kisa(toplam))}</text>` +
      '<text x="90" y="106" text-anchor="middle" class="donut-alt">toplam token</text>' +
      '</svg>'
    : '<p class="bos">token verisi yok</p>';
  return '<div class="kart token-payi">' +
    '<div class="tp-ust"><span class="baslik">TOKEN PAYI VE MALIYET</span> <span class="alt">ücretsiz vs ücretli</span></div>' +
    '<div class="tp-govde">' +
    `<div class="tp-donut">${donut}</div>` +
    '<div class="tp-maliyet">' +
    `<div class="tp-blok"><span class="ad">OpenCode (ücretsiz)</span><p class="buyuk"><b>${esc(kisa(ocToken))}</b> token</p><p class="kucuk">${telPara}</p></div>` +
    `<div class="tp-blok"><span class="ad">Claude</span><p class="buyuk"><b>${esc(kisa(clToken))}</b> token</p><p class="kucuk">${clPara}</p></div>` +
    '</div>' +
    '</div>' +
    '<div class="tp-lejant">' +
    `<span class="e"><i style="background:#22d3ee"></i>OpenCode (ücretsiz)</span><b>%${ocPct}</b>` +
    `<span class="e"><i style="background:#2563eb"></i>Claude</span><b>%${clPct}</b>` +
    '</div>' +
    (toplam > 0 ? `<p class="tp-oran">token'ların <b>%${ocPct}</b>'i ücretsiz modelde</p>` : '') +
    '</div>';
}

// Modeller v2 — model başına token degrade çubuk grafiği
export function modelTokenCubukHtml(snap) {
  const modeller = (snap?.modeller || []).filter((m) => Number.isFinite(m.token) && m.token > 0);
  const ust = '<div class="tp-ust"><span class="baslik">MODEL BAŞINA TOKEN</span> <span class="alt">kaynak: model metrikleri</span></div>';
  if (modeller.length === 0) return `<div class="kart cubuk-grafik">${ust}<span class="bos">model token verisi yok</span></div>`;
  const maxT = Math.max(...modeller.map((m) => m.token));
  const bars = modeller.map((m) => {
    const h = maxT > 0 ? (m.token / maxT) * 100 : 0;
    const cacheOran = Number.isFinite(m.cacheOkuma) && m.token > 0 ? Math.round((m.cacheOkuma / m.token) * 100) : null;
    const alt = cacheOran !== null ? `<span class="cubuk-cache">cache %${cacheOran}</span>` : '';
    return '<div class="cubuk-sutun">' +
      `<div class="cubuk-kap"><div class="cubuk-dolu" style="height:${h.toFixed(1)}%"><span class="cubuk-deger">${esc(tam(m.token))}</span></div></div>` +
      `<div class="cubuk-ad">${esc(m.model)}</div>${alt}` +
      '</div>';
  }).join('');
  return `<div class="kart cubuk-grafik">${ust}<div class="cubuklar">${bars}</div></div>`;
}

// kısa token: 1000 ve üstü tek ondalıklı k (42,5k), altı olduğu gibi
function kisaToken(n) {
  if (n < 1000) return String(n);
  return (n / 1000).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'k';
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
    const token = Number.isFinite(h.token) ? h.token : null;
    const istek = Number.isFinite(h.istek) ? h.istek : null;
    const altTok = token == null ? '' : ` · ${token.toLocaleString('tr-TR')} token`;
    const altIstek = istek == null ? '' : ` · ${istek.toLocaleString('tr-TR')} istek`;
    const kucuk = token == null ? '' : `<small>${esc(kisaToken(token))}</small>`;
    return `<td class="hucre ${sinif}" title="adım ${esc(no)}: ${esc(title)}${esc(altTok)}${esc(altIstek)}">${esc(metin)}${kucuk}</td>`;
  };
  const satirlar = m.modeller.map((r) => {
    const ad = r.model.startsWith(`${r.yurutucu || 'opencode'}/`) ? r.model : `${r.yurutucu || 'opencode'}/${r.model}`;
    const etiket = r.deney ? `${ad} · ${r.deney}` : ad;
    return '<tr>' +
      `<th class="model">${esc(etiket)}</th>` +
      m.adimlar.map((no) => hucre(r.hucreler?.[no], no)).join('') +
      '</tr>';
  }).join('');
  return '<div class="kaydir"><table class="matris"><thead><tr><th class="model">model</th>' +
    m.adimlar.map((no) => `<th>${esc(no)}</th>`).join('') +
    `</tr></thead><tbody>${satirlar}</tbody></table></div>` +
    '<p class="lejant">✓N = N. denemede geçti · ✕N = N gerçek denemede geçmedi · ○ = yalnız kota sessizliği · boş = denenmedi · alttaki sayı = harcanan etkin token</p>';
}

// karar durumu: son karar varsa özet + iletim hâli
function kararDurum(e, izleyici) {
  if (!e.karar) return '';
  const k = e.karar;
  const dt = new Date(ms(k.ts));
  const saatMetin = dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const metin = k.metin ? ` · "${esc(k.metin)}"` : '';
  const ileti = e.alindi ? ' — Claude aldı'
    : izleyici ? " — Claude'a iletiliyor"
    : ' — kuyrukta, Claude oturumu açılınca işlenir';
  return `son karar: ${esc(k.tur)} · ${saatMetin}${metin}${ileti}`;
}

// figma satırı: karar formunun üstünde, yalnız geçerli url varsa
function figmaBilgi(e) {
  if (!e.figma) return '';
  return `<p class="figma-bilgi">Figma güncellendi · <a href="${esc(e.figma)}" target="_blank" rel="noopener">Figma'da aç ↗</a></p>`;
}

// kart sonundaki karar bölümü: biten adımda yok, onaylı adımda form yok
function kararBolum(e, izleyici) {
  if (e.bitti) return '';
  if (e.onay) return '<p class="karar-durum">onaylandı</p>';
  // figma yoksa taslak onayı; alan hiç yoksa eski "Onayla" korunur
  const onayAd = e.figma ? 'Adımı onayla' : e.figma === undefined ? 'Onayla' : 'Taslağı onayla';
  return '<form class="karar" data-no="' + esc(e.no) + '">' +
    '<textarea name="metin" rows="2" maxlength="2000" placeholder="not (red ve yorumda zorunlu)"></textarea>' +
    `<button type="submit" name="tur" value="onay">${onayAd}</button>` +
    '<button type="submit" name="tur" value="red">Reddet</button>' +
    '<button type="submit" name="tur" value="yorum">Yorum</button>' +
    `<p class="karar-durum">${kararDurum(e, izleyici)}</p>` +
    '</form>';
}

// tek etki kartı: değer ve tahmini token çubukları + önce/sonra krokisi
function etkiKart(e, maxToken, izleyici) {
  const t = e.tahmin || { token: 0, maliyet: 0, guven: 'dusuk' };
  const guven = GUVEN[t.guven] ? t.guven : 'dusuk';
  const deger = Math.max(0, Math.min(5, Math.round(e.deger ?? 0)));
  // iki ayrı çubuk: değer (değer/5) ve tahmini token (en büyük token'a oran)
  const degerW = (deger / 5) * 100;
  const tokenW = maxToken > 0 ? ((t.token || 0) / maxToken) * 100 : 0;
  const maliyetYaz = (t.maliyet || 0) > 0 ? ` · ${para(t.maliyet)}` : '';
  const src = '/dosya?yol=' + encodeURIComponent(e.dosya || '');
  const once = `${esc(src)}&goster=once`;
  const sonra = `${esc(src)}&goster=sonra`;
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
    '<div><div class="etiket">önce</div>' +
    `<button type="button" class="buyut" data-src="${once}" aria-label="önce taslağını büyüt"></button>` +
    `<iframe loading="lazy" src="${once}"></iframe></div>` +
    '<div><div class="etiket">sonra</div>' +
    `<button type="button" class="buyut" data-src="${sonra}" aria-label="sonra taslağını büyüt"></button>` +
    `<iframe loading="lazy" src="${sonra}"></iframe></div>` +
    '</div>' +
    figmaBilgi(e) +
    kararBolum(e, izleyici) +
    '</div>';
}

// etki: önce açık adımlar; biten adımların taslakları katlı, adım no azalan
export function etkiHtml(etki, { gecmisAcik = false, izleyici = false } = {}) {
  const liste = etki || [];
  if (liste.length === 0) return '<span class="bos">onay bekleyen taslak yok</span>';
  const maxToken = Math.max(0, ...liste.map((e) => e.tahmin?.token || 0));
  const aciklar = liste.filter((e) => !e.bitti);
  const bitenler = liste.filter((e) => e.bitti).sort((a, b) => b.no - a.no);
  let html = aciklar.map((e) => etkiKart(e, maxToken, izleyici)).join('');
  if (bitenler.length === 0) return html;
  if (aciklar.length === 0) html += '<span class="bos">onay bekleyen taslak yok</span>';
  return html +
    `<details class="etki-gecmis"${gecmisAcik ? ' open' : ''}>` +
    `<summary>Biten adımların taslakları (${bitenler.length})</summary>` +
    bitenler.map((e) => etkiKart(e, maxToken, izleyici)).join('') +
    '</details>';
}

// tek adımın etki kartı (drawer ETKİ bölümü için); etki yoksa boş durum. izleyici = karar iletim hâli.
export function etkiKartiHtml(e, izleyici = false) {
  if (!e) return '<p class="bos">etki yok</p>';
  return etkiKart(e, e.tahmin?.token || 0, izleyici);
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
