// Kapı (adım 216): Sentez çıktısında odak persona rozeti, emniyet bandı ve panel görünümü
// Kullanım: node test/persona-odak-ui.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { epicDrawerHtml } from '../panel/ciz.mjs';

// 1. epicDrawerHtml - Odak Persona Rozeti ve Emniyet Bandı
const epikObj = {
  no: 48,
  ad: 'Persona Ağırlıklandırma',
  statu: 'gelistirme',
  odakPersona: 'Bilişsel Yük Bekçisi',
  adimlar: [],
};
const tartisma = {
  durum: 'bitti',
  odak: { ad: 'Bilişsel Yük Bekçisi', carpan: 3 },
  personalar: [{ ad: 'Bilişsel Yük Bekçisi' }, { ad: 'Geliştirme Yöneticisi' }],
  turlar: [],
  cozum: {
    model: 'agy/test',
    metin: '## Çözüm\nÖrnek çözüm metni.',
  },
};

const html = epicDrawerHtml(epikObj, tartisma);

// (a) Odak rozeti
assert.ok(html.includes('odak-persona-rozet'), 'çözüm başlığında veya üstünde .odak-persona-rozet bulunmalı');
assert.ok(html.includes('Bilişsel Yük Bekçisi'), 'rozet odak persona adını içermeli');
assert.ok(html.includes('×3'), 'rozet ×3 çarpanını içermeli');

// (b) Emniyet katmanı bandı
assert.ok(html.includes('emniyet-bandi'), 'çözümde .emniyet-bandi yer almalı');
assert.ok(html.includes('BASTIRILAMAZ EMNİYET') || html.includes('Kırmızı kapı'), 'emniyet bandında güvenlik açıklaması yer almalı');

// (c) Odak persona seçici / butonları
assert.ok(html.includes('odak-secim-btn') || html.includes('odak-secici'), 'odak persona seçici arayüzü yer almalı');

// 2. CSS stilleri (index.html)
const indexHtml = readFileSync(join(process.cwd(), 'panel', 'index.html'), 'utf8');
assert.ok(indexHtml.includes('.odak-persona-rozet'), 'index.html içinde .odak-persona-rozet stili olmalı');
assert.ok(indexHtml.includes('.emniyet-bandi'), 'index.html içinde .emniyet-bandi stili olmalı');

console.log('persona-odak-ui.test ok');
