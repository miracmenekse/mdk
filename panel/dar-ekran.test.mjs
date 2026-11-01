// Kapı (adım 52): dar ekranda sıkı KPI (3 sütun) ve tek satır kayan sekme. Kullanım: node panel/dar-ekran.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./index.html', import.meta.url), 'utf8').replace(/\s+/g, ' ');
// max-width: 520px blok(lar)ının içeriği (iç içe tek seviye süslü parantez)
const dar = [...css.matchAll(/@media \(max-width: ?520px\) ?\{((?:[^{}]*\{[^}]*\})*)[^{}]*\}/g)].map((m) => m[1]).join(' ');
assert.ok(dar, '@media (max-width: 520px) bloğu yok');
const kural = (sec) => [...dar.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter((m) => m[1].split(',').map((s) => s.trim()).includes(sec)).map((m) => m[2]).join(';');
// KPI kartları dar ekranda sıkışır, drawer tam ekran olur (sekmeler artık KPI kartları)
assert.match(kural('.kpi'), /gap: ?6px/, 'dar ekranda KPI aralığı küçülür');
assert.match(kural('.kpi-kutu'), /padding: ?6px 8px/);
assert.match(kural('.kpi-kart'), /padding: ?8px/, 'dar ekranda kart sıkışır');
assert.match(kural('#drawer'), /width: ?100vw/, 'dar ekranda drawer tam genişlik');
// geniş ekran: KPI responsive auto-fit ızgara (sabit sütun sayısı değil)
assert.match(css, /\.kpi \{ display: grid; grid-template-columns: repeat\(auto-fit/, 'KPI auto-fit ızgara');
console.log('dar-ekran.test ok');
