import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';
import { personaTakimHtml } from './ciz.mjs';

const takim = {
  proje: 'mdk',
  personalar: [
    { ad: 'Birinci', optimize: 'opt1', korluk: 'k1', soru: 's1', yorumlar: [{ metin: 'not1' }] },
    { ad: 'İkinci', optimize: 'opt2', korluk: 'a "b" <c>', soru: 's2' },
    { ad: 'Üçüncü', optimize: 'opt3', korluk: 'k3', soru: 's3' },
  ],
};

// Düzenleme yok: 3 düzenle düğmesi, form yok.
const h = personaTakimHtml(takim);
assert.equal((h.match(/persona-duzenle"/g) || []).length, 3, '3 persona-duzenle düğmesi');
assert.equal((h.match(/persona-duzenle-form/g) || []).length, 0, 'düzenleme formu yok');

// İkinci persona düzenleniyor.
const h1 = personaTakimHtml(takim, 1);
assert.equal((h1.match(/persona-duzenle-form/g) || []).length, 1, 'tam bir düzenle formu');
assert.ok(h1.includes('data-index="1"'), 'form data-index="1"');
assert.equal((h1.match(/duzenleniyor/g) || []).length, 1, 'duzenleniyor bir kez');
assert.equal((h1.match(/persona-kart/g) || []).length, 3, 'persona-kart tam 3 kez');
const adEslesme = h1.match(/name="ad"[^>]*value="([^"]*)"/);
assert.ok(adEslesme, 'ad input value bulunmalı');
assert.equal(adEslesme[1], 'İkinci', 'ad değeri ikinci persona');
assert.ok(h1.includes('Vazgeç'), 'Vazgeç düğmesi');
assert.ok(h1.includes('rolün kısa adı'), 'Ad açıklaması');
assert.ok(h1.includes('bilerek neyi kaçırır'), 'Körlük açıklaması');
assert.ok(h1.includes('sıra, renk ve yorumlar korunur'), 'korunur notu');
assert.ok(h1.includes('&lt;c&gt;'), '<c> kaçışlı');
assert.ok(h1.includes('&quot;'), 'tırnak kaçışlı');
assert.ok(!h1.includes('<c>'), '<c> ham geçmez');
assert.ok(h1.includes('düzenleniyor'), 'düzenleniyor metni');

// İlk persona düzenlenirken yorum notu görünmeye devam eder.
const h0 = personaTakimHtml(takim, 0);
assert.ok(h0.includes('not1'), 'mevcut yorum notu korunur');

// GET / HTML'i gerekli işaretleri içermeli.
const d = mkdtempSync(join(tmpdir(), 'persona-duzenle-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
mkdirSync(join(d, 'persona'));
writeFileSync(join(d, 'persona', 'takim.json'), JSON.stringify({ personalar: [{ ad: 'A', optimize: 'o', korluk: 'k', soru: 's' }] }));
const s = await baslat(d, 0);
const html = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
await s.kapat();

assert.ok(html.includes('persona-duzenle-form'), 'GET / persona-duzenle-form');
assert.ok(html.includes('persona-vazgec'), 'GET / persona-vazgec');
assert.ok(html.includes('duzenlenen'), 'GET / duzenlenen');
assert.ok(html.includes('/persona.mjs'), 'GET / /persona.mjs');

console.log('persona-duzenle.test ok');
