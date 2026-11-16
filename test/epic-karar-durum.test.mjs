// Kapı (adım 207): Epic detayında düğme durumları, çift tık engeli ve boş not kontrolü
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { epicDrawerHtml } from '../panel/ciz.mjs';

const epik0 = {
  no: '43',
  ad: 'Epic 43',
  statu: 'analiz',
  onay: false,
  etki: 'etki/kroki.html',
  figma: null,
  karar: null,
  alindi: false,
};

const tartismaBit = {
  durum: 'bitti',
  personalar: [{ ad: 'Ürün Sahibi' }],
  turlar: [{ tur: 1, ad: 'Değerlendirme', mesajlar: [{ persona: 'Ürün Sahibi', model: 'm', metin: 't' }] }],
  cozum: { metin: '## Çözüm\nDetay' },
};

// 1. Kroki formunda .karar-durum bulunmalı
const h0 = epicDrawerHtml(epik0, tartismaBit);
assert.match(h0, /<form class="epic-karar"[^>]*data-bolum="kroki"[^>]*>[\s\S]*?<p class="karar-durum">[\s\S]*?<\/p>/, 'kroki formunda karar-durum paragrafı bulunmalı');

// 2. Bekleyen karar varken (e.karar var ama alindi false) butonlar kilitli (disabled) olmalı
const epikKuyrukta = {
  ...epik0,
  karar: { ts: Date.UTC(2026, 0, 1, 10, 0), tur: 'yorum', metin: 'kroki: cizgi kalin olsun' },
  alindi: false,
};
const hKuyruk = epicDrawerHtml(epikKuyrukta, tartismaBit);
assert.ok(hKuyruk.includes('disabled'), 'bekleyen kararda butonlar disabled olmalı');
assert.match(hKuyruk, /kuyrukta|gönderildi/, 'bekleyen kararda durum kuyrukta veya gönderildi içermeli');

// 3. Karar alındığında (alindi: true) durum "alındı" ya da "hazırlanıyor" içermeli
const epikAlindi = {
  ...epik0,
  karar: { ts: Date.UTC(2026, 0, 1, 10, 0), tur: 'figma', metin: '' },
  alindi: true,
};
const hAlindi = epicDrawerHtml(epikAlindi, tartismaBit);
assert.match(hAlindi, /alındı|Claude aldı|hazırlanıyor/, 'alınan kararda alındı veya hazırlanıyor içermeli');

// 4. index.html içinde satır içi doğrulama kontrolü: Reddet ve Yorum boş not denetimi
const html = readFileSync(new URL('../panel/index.html', import.meta.url), 'utf8');
assert.ok(html.includes("!metin.trim()"), 'index.html boş not kontrolü yapmalı');
assert.ok(html.includes("zorunlu"), 'index.html notun zorunlu olduğuna dair uyarı içermeli');

console.log('epic-karar-durum.test ok');
