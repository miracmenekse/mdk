// Kapı (adım 71): matris hücresinde harcanan token ve istek; deney koşuları ayrı satır. Kullanım: node panel/matris-token.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshot } from './durum.mjs';
import { matrisHtml } from './ciz.mjs';

const d = mkdtempSync(join(tmpdir(), 'matris-token-'));
const satir = (o) => JSON.stringify({ yurutucu: 'opencode', model: 'opencode/a', sure_sn: 10, ...o });
writeFileSync(join(d, 'metrikler.jsonl'), [
  satir({ adim: 5, deneme: 1, gecti: false, neden: 'kapi', token: 90000, etkin: 30000, istek: 7 }),
  satir({ adim: 5, deneme: 2, gecti: true, token: 50000, etkin: 12500, istek: 4 }),
  satir({ adim: 5, deneme: 1, gecti: true, token: 9000, etkin: 2100, istek: 1, deney: 'L1' }),
  satir({ adim: 6, deneme: 1, gecti: false, neden: 'yanit_yok', token: 0, etkin: 0, istek: 0 }),
  satir({ adim: 7, deneme: 1, gecti: true, token: 800 }),
  satir({ adim: 8, deneme: 1, gecti: false, neden: 'kota', token: 0, etkin: 0, istek: 0 }),
  JSON.stringify({ yurutucu: 'claude', model: 'opus', adim: 7, deneme: 1, gecti: true, token: null }),                       // eski satır: etkin/istek yok
].join('\n') + '\n');

const m = snapshot(d).matris;
const taban = m.modeller.find((r) => r.model === 'opencode/a' && !r.deney);
const l1 = m.modeller.find((r) => r.model === 'opencode/a' && r.deney === 'L1');
assert.ok(taban && l1, 'deney koşusu ayrı satır olmalı (deney alanı)');
assert.equal(m.modeller.length, 3);
assert.equal(m.modeller.find((r) => r.model === 'opus').hucreler[7].token, null, 'ölçülmemiş token 0 değil null');
assert.equal(taban.hucreler[8].durum, 'sessiz', 'kota da sessizlik sayılır');
assert.equal(taban.hucreler[5].token, 42500, 'hücre token = denemelerin etkin toplamı');
assert.equal(taban.hucreler[5].istek, 11, 'hücre istek = denemelerin istek toplamı');
assert.equal(taban.hucreler[5].durum, 'cok');
assert.equal(l1.hucreler[5].token, 2100);
assert.equal(l1.hucreler[5].istek, 1);
assert.equal(l1.hucreler[5].durum, 'ilk');
assert.equal(taban.hucreler[7].token, 800, 'etkin yoksa token kullanılır');
assert.equal(taban.hucreler[7].istek, null, 'istek yoksa null');
assert.equal(taban.hucreler[6].durum, 'sessiz');

const h = matrisHtml(m);
const duz = h.replace(/<[^>]+>/g, ' ');
assert.ok(/opencode\/a\s*·\s*L1/.test(duz), 'deney satırının adı "model · deney"');
assert.ok(duz.includes('42,5k') || duz.includes('42.5k') || duz.includes('43k'), 'hücrede kısa token (42,5k)');
assert.ok(duz.includes('2,1k') || duz.includes('2.1k') || duz.includes('2k'), 'deney hücresinde kısa token');
assert.ok(duz.includes('800'), 'küçük token olduğu gibi');
assert.ok(/title="adım 5:[^"]*42\.500[^"]*11 istek/.test(h), 'title: tr-TR token ve istek sayısı');
assert.ok(!/title="adım 7:[^"]*istek/.test(h), 'istek bilinmiyorsa title istek yazmaz');
assert.ok(h.includes('✓2') && h.includes('✓1') && h.includes('○'), 'mevcut simgeler korunur');
assert.ok(/lejant[^]*token/.test(h), 'lejant token sayısını anlatır');
assert.ok(!matrisHtml({ adimlar: [1], modeller: [{ yurutucu: 'o', model: 'x', deney: '<i>y</i>', hucreler: {} }] }).includes('<i>y</i>'), 'deney adı kaçışlı');
console.log('matris-token.test ok');
