// Kapı (adım 217): Araştırma sekmesinde details kendiliğinden açılma kusurunun giderilmesi
// Kullanım: node test/arastirma-details-kusur.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// 1. panel/index.html doğrulama
const sayfa = readFileSync(join(process.cwd(), 'panel', 'index.html'), 'utf8');

// (a) İçteki bölüm id="arastirma-eski" olmalı
assert.ok(sayfa.includes('id="arastirma-eski"'), 'index.html içinde id="arastirma-eski" bulunmalı');

// (b) Details içinde id="arastirma" kalmamalı (URL #arastirma olunca details otomatik açılmamalı)
const detailsMatch = sayfa.match(/<details>[\s\S]*?<summary>Eski araştırma notu<\/summary>([\s\S]*?)<\/details>/);
assert.ok(detailsMatch, 'Eski araştırma notu details bloğu bulunmalı');
assert.ok(!detailsMatch[1].includes('id="arastirma"'), 'details içinde id="arastirma" olmamalı, aksi halde tarayıcı akordiyonu açar');

// (c) Script referansı güncel olmalı
assert.ok(sayfa.includes("document.getElementById('arastirma-eski')"), 'script içinde getElementById(\'arastirma-eski\') olmalı');

// (d) CSS stilleri güncel olmalı
assert.ok(sayfa.includes('#arastirma-eski .bos'), 'CSS içinde #arastirma-eski stili bulunmalı');

console.log('arastirma-details-kusur.test ok');
