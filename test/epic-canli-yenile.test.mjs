// Kapı (adım 208): Kroki ve karar değişiminde açık Epic detayının otomatik yenilenmesi ve güncellendi işareti
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshot } from '../panel/durum.mjs';
import { epicImza, epicDrawerHtml } from '../panel/ciz.mjs';

// 1. durum.mjs: epik nesnesinde etkiMtime bulunmalı
const d = mkdtempSync(join(tmpdir(), 'epic-yenile-'));
mkdirSync(join(d, 'etki'), { recursive: true });
writeFileSync(join(d, 'etki', 'test.html'), '<html>kroki</html>');
writeFileSync(join(d, 'PLAN.md'), '## Epic 1 — Test\n- Durum: analiz\n- Etki: etki/test.html\n');

const s = snapshot(d);
const epik = (s.epikler || []).find((e) => e.no === '1');
assert.ok(epik, 'epik 1 bulunmalı');
assert.ok(typeof epik.etkiMtime === 'number' && epik.etkiMtime > 0, 'etkiMtime pozitif sayı olmalı');

// 2. epicImza: etkiMtime değişince imza değişmeli
const epikA = { no: '1', etki: 'etki/test.html', etkiMtime: 1000 };
const epikB = { no: '1', etki: 'etki/test.html', etkiMtime: 2000 };
assert.notEqual(epicImza(epikA, null), epicImza(epikB, null), 'etkiMtime değişince epicImza değişmeli');

// 3. epicDrawerHtml: iframe src önbellek kırıcı (t=) içermeli
const h = epicDrawerHtml({ ...epikA, etkiMtime: 12345 }, null);
assert.match(h, /<iframe[^>]*src="[^"]*[?&]t=12345[^"]*"[^>]*>/, 'iframe src önbellek kırıcı t= parametresi içermeli');

// 4. index.html: drawer scrollTop korunmalı ve güncellendi rozeti/vurgusu bulunmalı
const indexHtml = readFileSync(new URL('../panel/index.html', import.meta.url), 'utf8');
assert.ok(indexHtml.includes('scrollTop'), 'index.html drawerEl.scrollTop kaydırma konumunu saklayıp geri yüklemeli');
assert.match(indexHtml, /güncellendi|rozet-yeni/, 'index.html güncellendi işareti içermeli');

console.log('epic-canli-yenile.test ok');
