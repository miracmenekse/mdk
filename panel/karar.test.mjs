// Kapı (adım 63): karar.mjs — panelden gelen kararı doğrular, etki/kararlar.jsonl'e ekler, okur.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kararEkle, kararlar } from './karar.mjs';

const d = mkdtempSync(join(tmpdir(), 'karar-'));
const dosya = join(d, 'etki', 'kararlar.jsonl');

// dosya yokken boş liste, etki/ dizini yokken de yazılır
assert.deepEqual(kararlar(d), []);
const a = kararEkle(d, { no: 63, tur: 'onay' }, 1700000000123);
assert.deepEqual(a, { ts: 1700000000123, no: 63, tur: 'onay', metin: '' });
assert.ok(existsSync(dosya), 'etki/kararlar.jsonl oluşturulmalı');

// metin kırpılır; red ve yorum ayrı türler olarak saklanır
const b = kararEkle(d, { no: 64, tur: 'red', metin: '  butonlar sağda olsun\n' }, 1700000000456);
assert.equal(b.metin, 'butonlar sağda olsun');
kararEkle(d, { no: 7, tur: 'yorum', metin: 'neden iki çubuk?' }, 1700000000789);

// her karar tek satır JSON, eklenme sırasıyla
const satirlar = readFileSync(dosya, 'utf8').trimEnd().split('\n');
assert.equal(satirlar.length, 3);
assert.deepEqual(JSON.parse(satirlar[2]), { ts: 1700000000789, no: 7, tur: 'yorum', metin: 'neden iki çubuk?' });

// bozuk satır atlanır, diğerleri okunur
writeFileSync(dosya, readFileSync(dosya, 'utf8') + '{bozuk\n\n');
const liste = kararlar(d);
assert.deepEqual(liste.map((k) => [k.no, k.tur]), [[63, 'onay'], [64, 'red'], [7, 'yorum']]);

// geçersiz girdiler hata fırlatır ve dosyaya hiçbir şey yazmaz
const once = readFileSync(dosya, 'utf8');
for (const [girdi, neden] of [
  [{ no: 0, tur: 'onay' }, 'no 0'],
  [{ no: 2.5, tur: 'onay' }, 'no kesirli'],
  [{ no: '63', tur: 'onay' }, 'no metin'],
  [{ no: 63, tur: 'sil' }, 'bilinmeyen tür'],
  [{ no: 63, tur: 'red' }, 'red metinsiz'],
  [{ no: 63, tur: 'yorum', metin: '   ' }, 'yorum boşluk'],
  [{ no: 63, tur: 'yorum', metin: 42 }, 'metin sayı'],
  [{ no: 63, tur: 'yorum', metin: 'x'.repeat(2001) }, 'metin 2000+'],
  [null, 'girdi yok'],
]) assert.throws(() => kararEkle(d, girdi, 1), Error, neden);
assert.equal(readFileSync(dosya, 'utf8'), once, 'geçersiz karar dosyayı değiştirmemeli');

// 2000 karakter sınırda kabul edilir; zaman verilmezse Date.now()
const sinir = kararEkle(d, { no: 9, tur: 'yorum', metin: 'y'.repeat(2000) });
assert.equal(sinir.metin.length, 2000);
assert.ok(Math.abs(sinir.ts - Date.now()) < 5000);
console.log('karar.test ok');
