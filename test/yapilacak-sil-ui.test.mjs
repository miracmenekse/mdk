// Kapı (adım 220): Panel yapılacaklar listesinde açık ve bitmiş işler için sil düğmesi ve arayüz etkileşimi
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { yapilacaklarHtml } from '../panel/ciz.mjs';

const liste = [
  { id: 1, baslik: 'Açık iş 1', not: '', durum: 'bekliyor', epic: null },
  { id: 2, baslik: 'Ertelenen iş 2', not: 'not', durum: 'ertelendi', epic: null },
  { id: 3, baslik: 'Biten iş 3', not: '', durum: 'bitti', epic: null },
];

// 1. Çizim fonksiyonu testleri
const h = yapilacaklarHtml(liste);
assert.ok(h.includes('data-islem="sil"'), 'sil düğmesi içermeli');

// Açık işlerde sil düğmesi
assert.ok(h.includes('class="yap-islem yap-sil" data-islem="sil"') || h.includes('data-islem="sil"'), 'açık işlerde sil düğmesi olmalı');
const silDugmeSayisi = (h.match(/data-islem="sil"/g) || []).length;
assert.equal(silDugmeSayisi, 3, 'hem açık (2) hem biten (1) işlerde sil butonu bulunmalı');

// Biten işlerde data-id
assert.ok(h.includes('data-id="3"'), 'biten iş data-id içermeli');

// İzleyici modunda hiç sil düğmesi olmamalı
const hIzleyici = yapilacaklarHtml(liste, true);
assert.ok(!hIzleyici.includes('data-islem="sil"'), 'izleyici modunda sil düğmesi olmamalı');

// 2. index.html dosya kontrolleri
const idx = readFileSync(new URL('../panel/index.html', import.meta.url), 'utf8');
assert.ok(idx.includes("islem === 'sil'") || idx.includes('islem === "sil"'), 'index.html sil işlemini dinlemeli');

console.log('yapilacak-sil-ui.test ok');
