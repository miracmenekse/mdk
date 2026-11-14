import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { duzenKaydir } from './persona.mjs';
import { personaTakimHtml } from './ciz.mjs';
import { baslat } from './sunucu.mjs';

// duzenKaydir: güvenli indeks kaydırma
assert.equal(duzenKaydir(-1, { silinen: 0 }), -1, 'duzenlenen -1 → -1');
assert.equal(duzenKaydir(-1, { eklenen: 5 }), -1, 'duzenlenen -1 her durumda -1');
assert.equal(duzenKaydir(2, { silinen: 2 }), -1, 'silinen === duzenlenen → -1');
assert.equal(duzenKaydir(2, { silinen: 0 }), 1, 'silinen < duzenlenen → -1');
assert.equal(duzenKaydir(2, { silinen: 3 }), 2, 'silinen > duzenlenen → aynen');
assert.equal(duzenKaydir(2, { eklenen: 1 }), 3, 'eklenen <= duzenlenen → +1');
assert.equal(duzenKaydir(2, { eklenen: 2 }), 3, 'eklenen === duzenlenen → +1');
assert.equal(duzenKaydir(2, { eklenen: 4 }), 2, 'eklenen > duzenlenen → aynen');

const takim = {
  proje: 'mdk',
  personalar: [
    { ad: 'Birinci', optimize: 'opt1', korluk: 'k1', soru: 's1' },
    { ad: 'İkinci', optimize: 'opt2', korluk: 'k2', soru: 's2' },
    { ad: 'Üçüncü', optimize: 'opt3', korluk: 'k3', soru: 's3' },
  ],
};

// Düzenleme modunda düzenlenen kartta düzenle/sil düğmeleri yok.
const h1 = personaTakimHtml(takim, 1);
assert.equal((h1.match(/persona-sil/g) || []).length, 2, 'düzenlemede persona-sil 2 kez');
assert.equal((h1.match(/persona-duzenle"/g) || []).length, 2, 'düzenlemede persona-duzenle" 2 kez');

// persona-hata Ad alanının hemen altında, optimize'dan önce.
const idxAd = h1.indexOf('name="ad"');
const idxHata = h1.indexOf('persona-hata');
const idxOpt = h1.indexOf('name="optimize"');
assert.ok(idxAd >= 0 && idxHata > idxAd && idxHata < idxOpt, 'persona-hata ad ile optimize arasında');

// textarea'lar rows="3".
assert.equal((h1.match(/rows="3"/g) || []).length, 3, 'rows="3" tam 3 kez');

// Düzenleme yok: 3 sil düğmesi.
const h = personaTakimHtml(takim);
assert.equal((h.match(/persona-sil/g) || []).length, 3, 'normalde persona-sil 3 kez');

// GET / HTML işaretleri.
const d = mkdtempSync(join(tmpdir(), 'persona-cila-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
mkdirSync(join(d, 'persona'));
writeFileSync(join(d, 'persona', 'takim.json'), JSON.stringify({ personalar: [{ ad: 'A', optimize: 'o', korluk: 'k', soru: 's' }] }));
const s = await baslat(d, 0);
const html = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
await s.kapat();

assert.ok(html.includes('.persona-kart .avatar'), 'GET / .persona-kart .avatar içermeli');
assert.ok(html.includes('duzenKaydir'), 'GET / duzenKaydir içermeli');

console.log('persona-cila.test ok');
