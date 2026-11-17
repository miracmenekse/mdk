// Kapı (adım 212): Model × adım matrisinde doğru token hesaplama ve adım/epic agregasyonu.
// Kullanım: node test/matris-epik-token.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { olaylariTopla } from '../mdk-ortak.mjs';
import { snapshot } from '../panel/durum.mjs';

// 1. Agy token olay toplama testi (negatif etkin token olmamalı)
const dLog = mkdtempSync(join(tmpdir(), 'agy-log-'));
const agyLogDosya = join(dLog, 'test.jsonl');
writeFileSync(agyLogDosya, JSON.stringify({
  event: 'result',
  result: {
    status: 'SUCCESS',
    usage: {
      input_tokens: 1000,
      output_tokens: 200,
      thinking_tokens: 100,
      cache_read_tokens: 50000,
      total_tokens: 1200,
    },
  },
}) + '\n');

const toplanan = olaylariTopla(agyLogDosya);
assert.ok(toplanan.etkin >= 0, `etkin token (${toplanan.etkin}) negatif olmamalı`);
assert.equal(toplanan.etkin, 1300, 'etkin token input+output+thinking taze tokenları olmalı');
assert.ok(toplanan.token >= 1300, 'toplam token en az taze tokenlar kadar olmalı');

// 2. Durum ve matris adım/epic toplamları
const d = mkdtempSync(join(tmpdir(), 'matris-epik-'));
writeFileSync(join(d, 'PLAN.md'), `
# MDK
## Epic 10 — Giriş
- [x] 1. İlk adım
- [x] 2. İkinci adım

## Epic 20 — İkinci faz
- [x] 3. Üçüncü adım
`);

const satir = (o) => JSON.stringify({ yurutucu: 'agy', model: 'agy/flash', sure_sn: 10, ...o });
writeFileSync(join(d, 'metrikler.jsonl'), [
  // Adım 1: model 1 ve model 2
  satir({ adim: 1, deneme: 1, gecti: true, token: 50000, etkin: 20000, istek: 5 }),
  satir({ adim: 1, yurutucu: 'opencode', model: 'opencode/beam', deneme: 1, gecti: true, token: 10000, etkin: 5000, istek: 2 }),
  // Adım 2: negatif etkinli bozuk eski log
  satir({ adim: 2, deneme: 1, gecti: true, token: 60000, etkin: -500000, istek: 6 }),
  // Adım 3: Epic 20
  satir({ adim: 3, deneme: 1, gecti: true, token: 40000, etkin: 15000, istek: 4 }),
].join('\n') + '\n');

const s = snapshot(d);
const m = s.matris;
assert.ok(m, 'matris nesnesi üretilmeli');
assert.ok(m.adimToplam, 'matris içinde adimToplam haritası olmalı');
assert.equal(m.adimToplam[1]?.token, 25000, 'adım 1 toplam etkin tokenı modellerin toplamı (20.000 + 5.000) olmalı');
assert.equal(m.adimToplam[1]?.istek, 7, 'adım 1 toplam istek sayısı (5 + 2) olmalı');

// Negatif etkin log koruması
assert.ok(m.modeller.find((r) => r.model === 'agy/flash')?.hucreler[2]?.token >= 0, 'bozuk loglu hücre tokenı negatif olmamalı');

// Epic toplamları
assert.ok(Array.isArray(m.epikler), 'matris içinde epikler dizisi olmalı');
const ep10 = m.epikler.find((e) => String(e.no) === '10');
assert.ok(ep10, 'Epic 10 toplamı bulunmalı');
assert.equal(ep10.ad, 'Giriş');
assert.ok(ep10.token > 0, 'Epic 10 toplam tokenı pozitif olmalı');

console.log('matris-epik-token.test ok');
