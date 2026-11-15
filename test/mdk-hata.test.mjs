import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  hataSinifla,
  gunlukHatasi,
  bekleMs,
  iletiBul,
} from '../mdk-hata.mjs';

// hataSinifla
assert.deepEqual(hataSinifla('429 Too Many Requests'), { tur: 'oran', gecici: true });
assert.deepEqual(hataSinifla('GoUsageLimitError: Go usage limit reached'), { tur: 'kota', gecici: false });
assert.deepEqual(hataSinifla('429 quota exceeded'), { tur: 'kota', gecici: false });
assert.deepEqual(hataSinifla('Invalid API key'), { tur: 'kimlik', gecici: false });
assert.deepEqual(hataSinifla('ProviderModelNotFoundError'), { tur: 'model_yok', gecici: false });
assert.deepEqual(hataSinifla('503 Service Unavailable'), { tur: 'sunucu', gecici: true });
assert.deepEqual(hataSinifla('Overloaded'), { tur: 'sunucu', gecici: true });
assert.deepEqual(hataSinifla('fetch failed: ECONNRESET'), { tur: 'ag', gecici: true });
assert.deepEqual(hataSinifla('Failed to execute statement'), { tur: 'bilinmeyen', gecici: false });
assert.equal(hataSinifla(''), null);
assert.equal(hataSinifla(null), null);
assert.deepEqual(hataSinifla('port 5000 açıldı'), { tur: 'bilinmeyen', gecici: false });

// gunlukHatasi
const d = mkdtempSync(join(tmpdir(), 'mdk-hata-'));
const log1 = join(d, 'a.log');
writeFileSync(log1, '{"type":"error","error":{"name":"APIError","data":{"message":"rate limit exceeded"}}}\n');
assert.deepEqual(gunlukHatasi(log1), { tur: 'oran', gecici: true });

const log2 = join(d, 'b.log');
writeFileSync(log2, '{"type":"text","part":{"type":"text","text":"429 rate limit hatasını düzelttim"}}\n');
assert.equal(gunlukHatasi(log2), null);

const log3 = join(d, 'c.log');
writeFileSync(log3, '');
writeFileSync(log3 + '.err', 'Free usage limit reached');
assert.deepEqual(gunlukHatasi(log3), { tur: 'kota', gecici: false });

const log4 = join(d, 'd.log');
writeFileSync(log4, '{"type":"error","error":{"name":"UnknownError","data":{"message":"Failed to execute statement"}}}\n');
assert.deepEqual(gunlukHatasi(log4), { tur: 'bilinmeyen', gecici: false });

assert.equal(gunlukHatasi(join(d, 'yok.log')), null);

// bekleMs
assert.equal(bekleMs(1), 5000);
assert.equal(bekleMs(2), 15000);
assert.equal(bekleMs(3), 45000);
assert.equal(bekleMs(4), 60000);
assert.equal(bekleMs(2, 100, 250), 250);

// iletiBul
const nedenler = ['kota', 'oran', 'sunucu', 'ag', 'kimlik', 'model_yok', 'yanit_yok', 'butce', 'sure', 'kapi', 'regresyon', 'kurcalama', 'sorun'];
const durumlar = ['eskale', 'saglayici', 'kilit', 'kapi_hata', 'ortam_hatasi', 'regresyon_kirmizi'];
const yasaklar = ['429', 'stderr', 'JSON', 'exit'];

for (const n of nedenler) {
  const r = iletiBul('saglayici', n);
  assert.ok(r && typeof r.ileti === 'string' && r.ileti.length > 0, n);
  assert.ok(typeof r.oneri === 'string' && r.oneri.length > 0, n);
  assert.ok(r.ileti.length <= 160 && r.oneri.length <= 160, n);
}

for (const d0 of durumlar) {
  const r = iletiBul(d0, null);
  assert.ok(r && typeof r.ileti === 'string' && r.ileti.length > 0, d0);
  assert.ok(typeof r.oneri === 'string' && r.oneri.length > 0, d0);
  assert.ok(r.ileti.length <= 160 && r.oneri.length <= 160, d0);
}

const iletiler = nedenler.map((n) => iletiBul('', n).ileti);
assert.equal(new Set(iletiler).size, nedenler.length);

assert.deepEqual(iletiBul('saglayici', 'kota'), iletiBul('', 'kota'));
assert.equal(iletiBul('calisiyor', null), null);
assert.equal(iletiBul('x', 'y'), null);

for (const n of nedenler) {
  const r = iletiBul('', n);
  for (const alan of ['ileti', 'oneri']) {
    for (const y of yasaklar) {
      assert.ok(!String(r[alan]).toLowerCase().includes(y.toLowerCase()), `${n}:${alan}:${y}`);
    }
  }
}
for (const d0 of durumlar) {
  const r = iletiBul(d0, null);
  for (const alan of ['ileti', 'oneri']) {
    for (const y of yasaklar) {
      assert.ok(!String(r[alan]).toLowerCase().includes(y.toLowerCase()), `${d0}:${alan}:${y}`);
    }
  }
}

console.log('mdk-hata.test ok');
