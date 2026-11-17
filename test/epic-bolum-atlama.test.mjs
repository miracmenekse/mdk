// Kapı (adım 209): Tam sayfa Epic detayında hızlı kaydırmayla bölüm atlama motoru ve form koruması
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../panel/index.html', import.meta.url), 'utf8');

// 1. Üst çubukta hızlı atlama aç/kapa toggle düğmesi bulunmalı
assert.match(
  html,
  /id=["']hizli-atlama-toggle["']|data-islem=["']hizli-atlama["']/,
  'panel/index.html içinde hızlı atlama toggle düğmesi bulunmalı'
);

// 2. localStorage üzerinden hızlı atlama tercihi saklanmalı ve okunmalı
assert.match(
  html,
  /localStorage\.(getItem|setItem)\(['"]mdk_hizli_atlama['"]\)/,
  'panel/index.html localStorage üzerinden mdk_hizli_atlama anahtarını okuyup yazmalı'
);

// 3. Form/metin alanı odaktayken (input, textarea) bölüm atlama engellenmeli
assert.match(
  html,
  /activeElement[\s\S]*?(INPUT|TEXTAREA|input|textarea)/,
  'panel/index.html odaktaki öğe input veya textarea iken hızlı bölüm atlamayı engellemeli'
);

// 4. Hızlı kaydırmada .drawer-bolum hedeflenip scrollIntoView ile yumuşak geçiş yapılmalı
assert.match(
  html,
  /\.drawer-bolum[\s\S]*?scrollIntoView/,
  'panel/index.html hızlı kaydırmada .drawer-bolum öğesine scrollIntoView çağırmalı'
);

console.log('epic-bolum-atlama.test ok');
