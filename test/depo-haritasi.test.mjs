// Kapı (adım 226): Depo / kod haritası desteği (depoHaritasi)
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { depoHaritasi } from '../mdk-ortak.mjs';

const d = mkdtempSync(join(tmpdir(), 'mdk-harita-'));
mkdirSync(join(d, 'panel'), { recursive: true });
mkdirSync(join(d, 'test'), { recursive: true });

writeFileSync(
  join(d, 'motor.mjs'),
  "import { yardimci } from './panel/yardim.mjs';\nexport function hesapla(x) { return yardimci(x); }\nexport const SABIT = 42;\n"
);
writeFileSync(
  join(d, 'panel', 'yardim.mjs'),
  'export async function yardimci(v) { return v * 2; }\n'
);
writeFileSync(
  join(d, 'test', 'motor.test.mjs'),
  'export function testIcinde() {}\n'
);

// 1. Semboller, satır numaraları ve yerel bağımlılıklar çıkarılmalı; test dosyaları dahil edilmemeli
const harita = depoHaritasi({
  kok: d,
  sorgu: 'hesapla fonksiyonu',
  adimBlok: '- Ne: `panel/yardim.mjs` içinde güncelleme',
  butce: 1000,
});

assert.ok(harita.includes('panel/yardim.mjs: yardimci:L1'), 'hedef dosya ve satır numarası olmalı');
assert.ok(harita.includes('motor.mjs: hesapla:L2, SABIT:L3 -> ./panel/yardim.mjs'), 'semboller ve bağımlılık okları olmalı');
assert.ok(!harita.includes('motor.test.mjs'), 'test dosyaları haritaya girmemeli');

// 2. Adımda adı geçen dosya en üstte önceliklendirilmeli
const satirlar = harita.split('\n');
assert.ok(satirlar[0].startsWith('panel/yardim.mjs:'), 'adımda geçen hedef dosya ilk sırada yer almalı');

// 3. Bütçe sınırına uyulmalı
const darHarita = depoHaritasi({ kok: d, butce: 35 });
assert.ok(darHarita.length <= 35, 'bütçe sınırı aşılmamalı');

console.log('depo-haritasi.test ok');
