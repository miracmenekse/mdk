import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { personaSil, personaGeriEkle } from './persona.mjs';
import { personaTakimHtml } from './ciz.mjs';
import { baslat } from './sunucu.mjs';

const A = { ad: 'A', optimize: 'optA', korluk: 'kA', soru: 'sA', yorumlar: [{ metin: 'yA' }] };
const B = { ad: 'B', optimize: 'optB', korluk: 'kB', soru: 'sB', yorumlar: [{ metin: 'yB' }] };
const C = { ad: 'C', optimize: 'optC', korluk: 'kC', soru: 'sC' };

// personaSil: geçerli silme
const takim = { proje: 'x', personalar: [A, B, C] };
const sonuc = personaSil(takim, 1);
assert.ok(sonuc, 'personaSil başarılı sonuç döndürmeli');
assert.deepEqual(sonuc.takim.personalar.map((p) => p.ad), ['A', 'C'], 'silinen indeks takımdan çıkarılmalı');
assert.equal(sonuc.geri.index, 1, 'geri.index silinen indeks olmalı');
assert.deepEqual(sonuc.geri.persona, B, 'geri.persona silinen persona (yorumlarıyla) olmalı');
assert.equal(takim.personalar.length, 3, 'girdi takım değişmemeli');

// personaSil: geçersiz indeks
assert.equal(personaSil(takim, 5), null, 'geçersiz indeks null olmalı');

// personaGeriEkle: geri ekleme
const geriSonuc = personaGeriEkle({ proje: 'x', personalar: [A, C] }, { persona: B, index: 1 });
assert.ok(geriSonuc, 'personaGeriEkle başarılı sonuç döndürmeli');
assert.deepEqual(geriSonuc.personalar.map((p) => p.ad), ['A', 'B', 'C'], 'persona geri eklenmeli');
assert.equal(geriSonuc.proje, 'x', 'proje korunmalı');

// personaGeriEkle: index liste uzunluğunu aşarsa sona
const sonaSonuc = personaGeriEkle({ personalar: [A, C] }, { persona: B, index: 9 });
assert.ok(sonaSonuc, 'index 9 için sonuç döndürmeli');
assert.deepEqual(sonaSonuc.personalar.map((p) => p.ad), ['A', 'C', 'B'], 'index aşımı sona eklemeli');

// personaGeriEkle: aynı ad zaten varsa null
const cakisikSonuc = personaGeriEkle({ personalar: [A, B, C] }, { persona: B, index: 1 });
assert.equal(cakisikSonuc, null, 'aynı ad varsa null olmalı');

// boş takım HTML
assert.ok(personaTakimHtml({ personalar: [] }).includes('henüz persona yok'), 'boş takım mesajı içermeli');

// GET / HTML işaretleri
const d = mkdtempSync(join(tmpdir(), 'persona-geri-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
mkdirSync(join(d, 'persona'));
writeFileSync(join(d, 'persona', 'takim.json'), JSON.stringify({ personalar: [{ ad: 'A', optimize: 'o', korluk: 'k', soru: 's' }] }));

const s = await baslat(d, 0);
try {
  const html = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
  assert.ok(html.includes('id="persona-geri"'), 'persona-geri id içermeli');
  assert.ok(html.includes('Geri al'), 'Geri al içermeli');
  assert.ok(html.includes('Yeni persona'), 'Yeni persona içermeli');
  assert.ok(html.includes('rolün kısa adı'), 'rolün kısa adı içermeli');
  assert.ok(html.includes('ör. Güvenlik Denetçisi'), 'örnek placeholder içermeli');
  assert.ok(html.includes('personaGeriEkle'), 'personaGeriEkle içermeli');
  assert.ok(html.includes(':focus-visible'), 'focus-visible içermeli');
} finally {
  await s.kapat();
}

console.log('persona-geri.test ok');
