import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const h = readFileSync(new URL('./ORNEK.html', import.meta.url), 'utf8');
assert.match(h, /<svg[^>]*id="once"/, 'önce çizimi yok');
assert.match(h, /<svg[^>]*id="sonra"/, 'sonra çizimi yok');
assert.match(h, /class="[^"]*degisen/, 'değişen bölge vurgusu yok');
assert.ok(h.length < 6000, 'taslak küçük kalmalı (token tasarrufu)');
assert.ok(!/<script/i.test(h), 'taslakta script olmamalı');
console.log('ornek.test ok');
