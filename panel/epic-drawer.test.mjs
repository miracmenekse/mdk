// Adım 138 kapısı: epicDrawerHtml(epik, tartisma, izleyici) ve epicImza(epik, tartisma)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { epicDrawerHtml, epicImza } from './ciz.mjs';

const epik0 = { no: '22', ad: 'Epic 22 — M <x>', statu: 'analiz', onay: false, etki: null, figma: null, karar: null, alindi: false };

const tartismaSur = {
  durum: 'suruyor',
  personalar: [{ ad: 'Ürün Sahibi' }, { ad: 'Mühendis' }],
  turlar: [{ tur: 1, ad: 'Değerlendirme', mesajlar: [
    { persona: 'Ürün Sahibi', model: 'm', metin: 'değer <script>alert(1)</script>' },
    { persona: 'Mühendis', model: 'm', metin: 'risk' },
  ] }],
};

const tartismaBit = {
  durum: 'bitti',
  personalar: [{ ad: 'Ürün Sahibi' }, { ad: 'Mühendis' }],
  neden: 'neden metni',
  turlar: [
    { tur: 1, ad: 'Değerlendirme', mesajlar: [
      { persona: 'Ürün Sahibi', model: 'm', metin: 'değer' },
      { persona: 'Mühendis', model: 'm', metin: 'risk' },
    ] },
    { tur: 2, ad: 'Tartışma', mesajlar: [
      { persona: 'Mühendis', model: 'm', metin: 'itiraz' },
    ] },
  ],
  cozum: { metin: '## Çözüm\nTek ekran\n## Tahmini story listesi\n- Tablo\n- Form <b>' },
};

// temel: boş durumlar ve kaçış
const h0 = epicDrawerHtml(epik0, null);
assert.ok(h0.includes('<span class="etiket">EPIC</span>'), 'EPIC etiketi');
assert.ok(h0.includes('M &lt;x&gt;'), 'ad kaçışlı');
assert.ok(h0.includes('id="drawer-kapat"'), 'kapat düğmesi');
assert.ok(h0.includes('Analiz'), 'statü rozeti metni');
assert.match(h0, /<h3 class="drawer-bolum">TARTIŞMA<\/h3>/, 'TARTIŞMA bölümü');
assert.match(h0, /<h3 class="drawer-bolum">ÇÖZÜM<\/h3>/, 'ÇÖZÜM bölümü');
assert.match(h0, /<h3 class="drawer-bolum">UI\/UX ETKİSİ<\/h3>/, 'UI/UX bölümü');
assert.match(h0, /<h3 class="drawer-bolum">KARAR<\/h3>/, 'KARAR bölümü');
assert.ok(h0.includes('bu Epic için persona tartışması yok'), 'tartışma yok');
assert.ok(h0.includes('henüz çözüm yok'), 'çözüm yok');
assert.ok(h0.includes('taslak yok'), 'taslak yok');
assert.ok(h0.includes("Figma'da çiz"), "Figma'da çiz düğmesi");
assert.match(h0, /<form class="epic-karar" data-epic="22"/, 'epic-karar formu');
assert.ok(h0.includes(`<button type="submit" name="tur" value="figma">Figma'da çiz</button>`), 'figma düğmesi');
assert.ok(!h0.includes('Çözümü onayla'), 'onay düğmesi yok (tartışma bitmemiş)');
assert.ok(h0.includes('karar için önce tartışma bitmeli'), 'karar için tartışma şartı');

// süren tartışma
const h1 = epicDrawerHtml(epik0, tartismaSur);
assert.ok(h1.includes('tartışma sürüyor…'), 'süren tartışma notu');
assert.ok(h1.includes('<h4>Tur 1 · Değerlendirme</h4>'), 'tur başlığı');
assert.equal((h1.match(/persona-balon/g) || []).length, 2, 'iki balon');
assert.ok(!h1.includes('<script>alert(1)</script>'), 'ham script yok');
assert.ok(h1.includes('&lt;script&gt;'), 'script kaçışlı');

// biten tartışma
const h2 = epicDrawerHtml(epik0, tartismaBit);
assert.ok(h2.includes('<h4>Çözüm</h4>'), 'çözüm başlığı');
assert.ok(h2.includes('<h4>Tahmini story listesi</h4>'), 'ikinci başlık');
assert.ok(h2.includes('<li>Tablo</li>'), 'liste öğesi Tablo');
assert.ok(h2.includes('<li>Form &lt;b&gt;</li>'), 'liste öğesi Form kaçışlı');
assert.ok(h2.includes('Tek ekran'), 'diğer satır paragraf');
assert.ok(h2.includes('Çözümü onayla'), 'onay düğmesi');
assert.ok(h2.includes('Reddet'), 'red düğmesi');
assert.ok(h2.includes('Yorum'), 'yorum düğmesi');
assert.match(h2, /data-epic="22"/, 'data-epic');
assert.equal((h2.match(/persona-balon persona-b/g) || []).length, 2, 'Mühendis iki turda aynı renk');

// onay
const h3 = epicDrawerHtml({ ...epik0, onay: true }, tartismaBit);
assert.ok(h3.includes('çözüm onaylandı'), 'onaylandı');
assert.ok(!h3.includes('Çözümü onayla'), 'onaylıda onay düğmesi yok');

// figma
const h4 = epicDrawerHtml({ ...epik0, figma: 'https://www.figma.com/design/a?x="1"' }, null);
assert.ok(h4.includes("Figma'da aç"), 'figma bağlantısı');
assert.ok(h4.includes('target="_blank" rel="noopener"'), 'figma hedef/rel');
assert.ok(h4.includes('https://www.figma.com/design/a?x=&quot;1&quot;'), 'figma tırnak kaçışı');

// etki
const h5 = epicDrawerHtml({ ...epik0, etki: 'etki/m.html' }, null);
assert.ok((h5.match(/goster=once/g) || []).length >= 1, 'goster=once');
assert.ok((h5.match(/goster=sonra/g) || []).length >= 1, 'goster=sonra');
assert.ok((h5.match(/class="buyut"/g) || []).length >= 2, 'buyut düğmeleri');

// tamamlandi
const h6 = epicDrawerHtml({ ...epik0, statu: 'tamamlandi' }, tartismaBit);
assert.ok(!h6.includes("Figma'da çiz"), 'tamamlandida figma çiz yok');
assert.ok(!h6.includes('epic-karar'), 'tamamlandida karar formu yok');
assert.ok(!h6.includes('drawer-bolum">KARAR'), 'tamamlandida KARAR bölümü yok');

// yetersiz
const h7 = epicDrawerHtml(epik0, { durum: 'yetersiz', personalar: [], turlar: [] });
assert.ok(h7.includes('tartışma tamamlanamadı (yeterli yanıt yok)'), 'yetersiz');

// karar durumu entegrasyonu
const epikKarar = { ...epik0, karar: { ts: Date.UTC(2026, 0, 1, 12, 34), tur: 'onay', metin: '<x>' }, alindi: true };
const hk = epicDrawerHtml(epikKarar, tartismaBit);
assert.ok(hk.includes('son karar: onay'), 'son karar türü');
assert.ok(hk.includes('&lt;x&gt;'), 'son karar metni kaçışlı');
assert.ok(hk.includes('Claude aldı'), 'iletim: alındı');
const hk2 = epicDrawerHtml({ ...epikKarar, alindi: false }, tartismaBit, true);
assert.ok(hk2.includes("Claude'a iletiliyor"), 'iletim: iletiliyor');
const hk3 = epicDrawerHtml({ ...epikKarar, alindi: false }, tartismaBit, false);
assert.ok(hk3.includes('kuyrukta'), 'iletim: kuyrukta');

// epicImza
const baseEpik = { no: '22', ad: 'Epic 22 — M <x>', statu: 'analiz', onay: false, etki: null, figma: null, karar: null, alindi: false };
const baseTart = { durum: 'suruyor', personalar: [{ ad: 'Ürün Sahibi' }], turlar: [{ tur: 1, ad: 'Değerlendirme', mesajlar: [{ persona: 'Ürün Sahibi', model: 'm', metin: 'a' }] }], cozum: { metin: 'a' } };
const imza0 = epicImza(baseEpik, baseTart);
assert.equal(typeof imza0, 'string', 'imza metin');
assert.equal(epicImza(baseEpik, baseTart), imza0, 'aynı girdi eşit');

// yeni mesaj
const tartYeni = { ...baseTart, turlar: [{ tur: 1, ad: 'Değerlendirme', mesajlar: [{ persona: 'Ürün Sahibi', model: 'm', metin: 'a' }, { persona: 'Mühendis', model: 'm', metin: 'b' }] }] };
assert.notEqual(epicImza(baseEpik, tartYeni), imza0, 'yeni mesaj farklı');

// durum
assert.notEqual(epicImza(baseEpik, { ...baseTart, durum: 'bitti' }), imza0, 'durum farklı');

// onay
assert.notEqual(epicImza({ ...baseEpik, onay: true }, baseTart), imza0, 'onay farklı');

// figma
assert.notEqual(epicImza({ ...baseEpik, figma: 'https://x' }, baseTart), imza0, 'figma farklı');

// karar.ts
assert.notEqual(epicImza({ ...baseEpik, karar: { ts: 5 } }, baseTart), imza0, 'karar.ts farklı');

// etki
assert.notEqual(epicImza({ ...baseEpik, etki: 'etki/m.html' }, baseTart), imza0, 'etki farklı');

// alindi
assert.notEqual(epicImza({ ...baseEpik, alindi: true }, baseTart), imza0, 'alindi farklı');

// cozum uzunluğu
assert.notEqual(epicImza(baseEpik, { ...baseTart, cozum: { metin: 'ab' } }), imza0, 'cozum uzunluğu farklı');

// yalnız ad değişince eşit
assert.equal(epicImza({ ...baseEpik, ad: 'başka' }, baseTart), imza0, 'yalnız ad değişince eşit');

// null güvenli
assert.doesNotThrow(() => epicImza(null, null));
assert.equal(typeof epicImza(null, null), 'string', 'null imza metin');

// index.html kanıtı
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
for (const parca of ['epicDrawerHtml(', 'epicImza(', '/api/epic', 'epic-karar']) {
  assert.ok(html.includes(parca), `index.html ${parca} içermeli`);
}

console.log('epic-drawer.test ok');
