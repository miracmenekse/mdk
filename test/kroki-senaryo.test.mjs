// Kapı (adım 214): Scrollsuz tam oturan kroki yapısı ve örnek kullanım senaryosu kartı.
// Kullanım: node test/kroki-senaryo.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from '../panel/plan.mjs';
import { snapshot } from '../panel/durum.mjs';
import { epicDrawerHtml } from '../panel/ciz.mjs';

// 1. PLAN.md - Senaryo ayrıştırma
const planMetni = `
# MDK
## Epic 10 — Test Epik
- Durum: gelistirme
- Etki: etki/test.html
- Senaryo: Geliştirici | Paneli açar, bakar | Sayılar görünür | Kapı kırmızıysa loga bak
- [ ] 1. Adım
`;
const parsed = parse(planMetni);
assert.equal(parsed.kategoriler[0].senaryo, 'Geliştirici | Paneli açar, bakar | Sayılar görünür | Kapı kırmızıysa loga bak', 'senaryo alanı ayrıştırılmalı');

// 2. Durum snapshot aktarımı
const d = mkdtempSync(join(tmpdir(), 'kroki-senaryo-'));
writeFileSync(join(d, 'PLAN.md'), planMetni);
const snap = snapshot(d);
const epikObj = snap.epikler.find((e) => String(e.no) === '10');
assert.ok(epikObj, 'Epic 10 bulunmalı');
assert.equal(epikObj.senaryo, 'Geliştirici | Paneli açar, bakar | Sayılar görünür | Kapı kırmızıysa loga bak', 'snapshot içine senaryo aktarılmalı');

// 3. Arayüz şablonu (epicDrawerHtml)
const html = epicDrawerHtml(epikObj, { durum: 'bitti', turlar: [] });
assert.ok(html.includes('scrolling="no"'), 'kroki iframe scrolling="no" olmalı');
assert.ok(html.includes('kroki-senaryo'), 'kullanım senaryosu kartı (kroki-senaryo) yer almalı');
assert.ok(html.includes('Paneli açar, bakar') || html.includes('Geliştirici'), 'senaryo metni arayüzde gösterilmeli');

// 4. CSS stilleri (index.html)
const indexHtml = readFileSync(join(process.cwd(), 'panel', 'index.html'), 'utf8');
assert.ok(indexHtml.includes('.kroki-senaryo'), 'index.html içinde .kroki-senaryo stili olmalı');
const iframeMatch = indexHtml.match(/\.kroki\s+iframe\s*\{[^}]*height:\s*(\d+)px/);
assert.ok(iframeMatch && Number(iframeMatch[1]) >= 400, 'kroki iframe yüksekliği en az 400px olmalı');

console.log('kroki-senaryo.test ok');
