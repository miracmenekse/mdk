// Kapı (adım 210): Tıklanabilir mini bölüm göstergesi ve aktif bölüm takibi
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { epicDrawerHtml } from '../panel/ciz.mjs';

const epik0 = {
  no: '44',
  ad: 'Epic 44',
  statu: 'analiz',
  onay: false,
  etki: 'etki/kroki.html',
  figma: null,
  karar: null,
  alindi: false,
};

// 1. epicDrawerHtml içinde .drawer-gosterge mini navigasyonu bulunmalı
const h = epicDrawerHtml(epik0, null);
assert.match(
  h,
  /<(?:nav|div)[^>]*class=["'][^"']*drawer-gosterge[^"']*["']/,
  'epicDrawerHtml içinde .drawer-gosterge navigasyon alanı bulunmalı'
);

// 2. Göstergede bölümleri temsil eden tıklanabilir noktalar/bağlantılar ve bölüm adları olmalı
assert.match(
  h,
  /class=["'][^"']*(?:gosterge-nokta|gosterge-oge)[^"']*["']|data-hedef=["'][^"']+["']/,
  'epicDrawerHtml içinde gösterge noktaları/bağlantıları bulunmalı'
);
assert.match(
  h,
  /class=["'][^"']*gosterge-ad[^"']*["']|Tartışma/,
  'epicDrawerHtml içinde bölüm adları görünür olmalı'
);

// 3. index.html içinde aktif bölüm takibi, atlanan bölüm bildirimi ve scrollIntoView bulunmalı
const html = readFileSync(new URL('../panel/index.html', import.meta.url), 'utf8');
assert.match(
  html,
  /IntersectionObserver|drawer-gosterge[\s\S]*?aktif/,
  'index.html içinde aktif bölümü göstergeye yansıtacak takip mantığı bulunmalı'
);
assert.match(
  html,
  /drawer-gosterge[\s\S]*?scrollIntoView|\.gosterge-[\s\S]*?scrollIntoView/,
  'index.html içinde göstergeye tıklandığında ilgili bölüme scrollIntoView ile kaydırma yapılmalı'
);
assert.match(
  html,
  /atlanan|gosterge-bildirim/,
  'index.html içinde atlanan bölüm adını gösterecek bildirim/durum alanı bulunmalı'
);

// 4. index.html içinde .drawer-gosterge sol tarafta (left:) konumlandırılmış olmalı
assert.match(
  html,
  /\.drawer-gosterge\s*\{[^}]*left\s*:/,
  'index.html içinde .drawer-gosterge sol tarafta (left:) konumlandırılmış olmalı'
);

console.log('epic-bolum-gosterge.test ok');
