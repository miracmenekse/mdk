// Kapı (adım 221): Zaman aşımı sınıflandırması, Retry-After ayıklama ve akıllı üstel bekleme
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  hataSinifla,
  retryAfterBul,
  gunlukHatasi,
  bekleMs,
  iletiBul,
} from '../mdk-hata.mjs';

// 1. Zaman aşımı sınıflandırması (gecici: true)
assert.deepEqual(hataSinifla('408 Request Timeout'), { tur: 'zaman_asimi', gecici: true });
assert.deepEqual(hataSinifla('Gateway Timeout'), { tur: 'zaman_asimi', gecici: true });
assert.deepEqual(hataSinifla('Connection timed out while waiting'), { tur: 'zaman_asimi', gecici: true });
assert.deepEqual(hataSinifla('Request timeout after 30s'), { tur: 'zaman_asimi', gecici: true });

// 2. retryAfterBul: metin ve JSON kalıpları
assert.equal(retryAfterBul('429 Too Many Requests. Retry-After: 12'), 12000);
assert.equal(retryAfterBul('Rate limit reached, please retry after 25s'), 25000);
assert.equal(retryAfterBul('Too many requests, try again in 15 seconds'), 15000);
assert.equal(retryAfterBul('retry in 800 ms'), 800);
assert.equal(retryAfterBul('{"error":{"message":"rate limit","data":{"retryAfter":18}}}'), 18000);
assert.equal(retryAfterBul({ error: { data: { headers: { 'retry-after': '9' } } } }), 9000);
assert.equal(retryAfterBul('Normal bir hata metni'), null);
assert.equal(retryAfterBul(''), null);
assert.equal(retryAfterBul(null), null);

// 3. gunlukHatasi: Retry-After varsa retryAfterMs döner, yoksa eski şemayı korur
const d = mkdtempSync(join(tmpdir(), 'mdk-hata-retry-'));
const logRetry = join(d, 'r1.log');
writeFileSync(
  logRetry,
  '{"type":"error","error":{"name":"APIError","data":{"message":"429 Too Many Requests, retry after 14s"}}}\n'
);
assert.deepEqual(gunlukHatasi(logRetry), { tur: 'oran', gecici: true, retryAfterMs: 14000 });

const logHeader = join(d, 'r2.log');
writeFileSync(
  logHeader,
  '{"type":"error","error":{"name":"APIError","data":{"message":"503 Service Unavailable","retryAfter":7}}}\n'
);
assert.deepEqual(gunlukHatasi(logHeader), { tur: 'sunucu', gecici: true, retryAfterMs: 7000 });

const logSade = join(d, 'r3.log');
writeFileSync(
  logSade,
  '{"type":"error","error":{"name":"APIError","data":{"message":"rate limit exceeded"}}}\n'
);
assert.deepEqual(gunlukHatasi(logSade), { tur: 'oran', gecici: true });

// 4. bekleMs: Retry-After varsa ona uyar ve tavanMs ile sınırlar
assert.equal(bekleMs(1, 5000, 60000, 12000), 12000);
assert.equal(bekleMs(1, 5000, 60000, 95000), 60000);
assert.equal(bekleMs(2, 5000, 60000, null), 15000);

// 5. iletiBul: zaman_asimi iletisi
const ileti = iletiBul('saglayici', 'zaman_asimi');
assert.ok(ileti && ileti.ileti.length > 0 && ileti.oneri.length > 0, 'zaman_asimi iletisi olmalı');
assert.ok(ileti.ileti.length <= 160 && ileti.oneri.length <= 160, '160 karakter sınırı');

console.log('mdk-hata-retry.test ok');
