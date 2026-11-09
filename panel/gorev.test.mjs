// Adım 120 kapısı: görev satırı ayrıştırma/yazma + POST /api/gorev-model.
// Gerçek PLAN.md'ye dokunmaz: mkdtemp içindeki fikstürle çalışır.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gorevler, gorevModelYaz, SERBEST_MODELLER } from './gorev.mjs';
import { baslat } from './sunucu.mjs';

// --- fikstür PLAN.md -------------------------------------------------------
const satirlar = [
  '# MDK',
  'Yürütücü: opencode',
  'Modeller: opencode/deepseek-v4.1-flash-free, opencode/big-pickle',
  'Görev kod: opencode/deepseek-v4.1-flash-free, opencode/big-pickle',
  'Görev tasarim: opencode/beam-free, opencode/inkling-2-small-free, opencode/mimo-v2.6-flash-free',
  'Görev persona: opencode/crouton-alpha-free',
  '',
  'Bütçe: 300000',
  '## Panel',
  '- [ ] 1. İş',
  '  - Kapı: `true`',
  '',
];
const fikstur = satirlar.join('\n');

const beklenenGorevler = [
  { gorev: 'kod', modeller: ['opencode/deepseek-v4.1-flash-free', 'opencode/big-pickle'] },
  {
    gorev: 'tasarim',
    modeller: ['opencode/beam-free', 'opencode/inkling-2-small-free', 'opencode/mimo-v2.6-flash-free'],
  },
  { gorev: 'persona', modeller: ['opencode/crouton-alpha-free'] },
];

// satirlar kopyasında yalnız verilen satırı değiştirip metin üretir
const yaz = (indeks, yeni) => satirlar.map((s, i) => (i === indeks ? yeni : s)).join('\n');

// --- gorevler() ------------------------------------------------------------
assert.deepEqual(gorevler(fikstur), beklenenGorevler, 'görevler ve modeller dosya sırasıyla dönmeli');

// --- SERBEST_MODELLER ------------------------------------------------------
const serbest = [
  'opencode/iceman-free',
  'opencode/inkling-2-small-free',
  'opencode/crouton-alpha-free',
  'opencode/longcat-2.5-free',
  'opencode/flint-40b-free',
  'opencode/nemotron-3.5-super-vl-free',
  'opencode/beam-free',
  'opencode/mimo-v2.6-flash-free',
  'opencode/deepseek-v4.1-flash-free',
  'opencode/nemotron-3.5-lightning-free',
  'opencode/big-pickle',
];
assert.equal(SERBEST_MODELLER.length, 11, 'serbest listede 11 model olmalı');
assert.ok(SERBEST_MODELLER.includes('opencode/big-pickle'), 'big-pickle listede olmalı');
assert.deepEqual(SERBEST_MODELLER, serbest, 'serbest liste verilen sırayla olmalı');

// --- gorevModelYaz(): değiştirme -------------------------------------------
const degisti = gorevModelYaz(fikstur, 'kod', 0, 'opencode/inkling-2-small-free');
assert.equal(
  degisti,
  yaz(3, 'Görev kod: opencode/inkling-2-small-free, opencode/big-pickle'),
  'sıra 0 değişmeli, ikinci model ve dosyanın geri kalanı aynı kalmalı',
);

// --- gorevModelYaz(): sona ekleme ------------------------------------------
const eklendi = gorevModelYaz(fikstur, 'kod', 2, 'opencode/flint-40b-free');
assert.equal(
  eklendi,
  yaz(3, 'Görev kod: opencode/deepseek-v4.1-flash-free, opencode/big-pickle, opencode/flint-40b-free'),
  'sıra === modeller.length ise sona eklenmeli, geri kalan aynı kalmalı',
);

// --- gorevModelYaz(): hatalar ----------------------------------------------
assert.throws(() => gorevModelYaz(fikstur, 'yok', 0, 'opencode/big-pickle'), Error, 'bilinmeyen görev');
assert.throws(() => gorevModelYaz(fikstur, 'kod', 0, 'opencode/olmayan-model'), Error, 'bilinmeyen model');
assert.throws(() => gorevModelYaz(fikstur, 'kod', -1, 'opencode/flint-40b-free'), Error, 'negatif sıra');
assert.throws(() => gorevModelYaz(fikstur, 'kod', 3, 'opencode/flint-40b-free'), Error, 'aralık dışı sıra');
assert.throws(
  () => gorevModelYaz(fikstur, 'kod', 0, 'opencode/big-pickle'),
  Error,
  'yinelenen model (başka sırada zaten var)',
);

// --- sunucu: anlık görüntü ve POST /api/gorev-model -------------------------
const d = mkdtempSync(join(tmpdir(), 'gorev-'));
writeFileSync(join(d, 'PLAN.md'), fikstur);

const s = await baslat(d, 0);
const kok = `http://127.0.0.1:${s.port}`;

// anlık görüntü gorevler + serbestModeller içerir
const durum = await (await fetch(`${kok}/api/durum`)).json();
assert.deepEqual(durum.gorevler, beklenenGorevler, 'durum.gorevler fikstürü yansıtmalı');
assert.deepEqual(durum.serbestModeller, serbest, 'durum.serbestModeller sabit listeyi vermeli');

// geçerli POST dosyadaki yalnız o satırı değiştirir
const r = await fetch(`${kok}/api/gorev-model`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ gorev: 'kod', sira: 0, model: 'opencode/inkling-2-small-free' }),
});
assert.equal(r.status, 200, 'geçerli değişiklik 200');
assert.equal((await r.json()).tamam, true, 'yanıt tamam:true olmalı');
assert.equal(
  readFileSync(join(d, 'PLAN.md'), 'utf8'),
  yaz(3, 'Görev kod: opencode/inkling-2-small-free, opencode/big-pickle'),
  'dosyada yalnız o görev satırı değişmeli, geri kalan bayt bayt aynı kalmalı',
);

// sonraki anlık görüntü yeni modeli gösterir
const durum2 = await (await fetch(`${kok}/api/durum`)).json();
assert.equal(durum2.gorevler[0].modeller[0], 'opencode/inkling-2-small-free', 'durum değişikliği yansıtmalı');

// bilinmeyen model 400 döner ve dosyayı değiştirmez
const r2 = await fetch(`${kok}/api/gorev-model`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ gorev: 'kod', sira: 0, model: 'opencode/olmayan-model' }),
});
assert.equal(r2.status, 400, 'bilinmeyen model 400');
assert.ok((await r2.json()).hata, 'hata alanı dönmeli');
assert.equal(
  readFileSync(join(d, 'PLAN.md'), 'utf8'),
  yaz(3, 'Görev kod: opencode/inkling-2-small-free, opencode/big-pickle'),
  'doğrulama hatasında dosya değişmemeli',
);

await s.kapat();
console.log('gorev.test ok');
