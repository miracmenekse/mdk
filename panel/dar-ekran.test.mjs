// Kapı (adım 52): dar ekranda sıkı KPI (3 sütun) ve tek satır kayan sekme. Kullanım: node panel/dar-ekran.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./index.html', import.meta.url), 'utf8').replace(/\s+/g, ' ');
// max-width: 520px blok(lar)ının içeriği (iç içe tek seviye süslü parantez)
const dar = [...css.matchAll(/@media \(max-width: ?520px\) ?\{((?:[^{}]*\{[^}]*\})*)[^{}]*\}/g)].map((m) => m[1]).join(' ');
assert.ok(dar, '@media (max-width: 520px) bloğu yok');
const kural = (sec) => [...dar.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter((m) => m[1].split(',').map((s) => s.trim()).includes(sec)).map((m) => m[2]).join(';');
assert.match(kural('.kpi'), /grid-template-columns: ?repeat\(3, ?minmax\(0, ?1fr\)\)/, 'dar ekranda 3 sütun');
assert.match(kural('.kpi'), /gap: ?6px/);
assert.match(kural('.kpi-kutu'), /padding: ?6px 8px/);
assert.match(kural('.kpi-kutu b'), /font-size: ?15px/);
assert.match(kural('.kpi-kutu .etiket'), /font-size: ?11px/);
assert.match(kural('.sekmeler'), /flex-wrap: ?nowrap/);
assert.match(kural('.sekmeler'), /overflow-x: ?auto/);
assert.match(kural('.sekmeler button'), /white-space: ?nowrap/);
assert.match(kural('.sekmeler button'), /flex: ?none/);
// geniş ekran kuralları değişmez
assert.match(css, /\.kpi \{ display: grid; grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
assert.match(css, /\.sekmeler \{ display: flex; flex-wrap: wrap;/);
console.log('dar-ekran.test ok');
