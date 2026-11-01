// Kapı (adım 111): yazma izni kararı. Yerel davranış aynı kalır; uzak yalnız .mdk-uzak.json'daki host + Tailscale kullanıcısıyla.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { yazmaIzni, uzakAyar } from './uzak.mjs';

const ayar = { host: 'mac.tail1a2b.ts.net', kullanici: 'mirac@example.com' };
const H = 'mac.tail1a2b.ts.net';
const uzak = (ek = {}) => ({ host: H, origin: `https://${H}`, 'tailscale-user-login': 'mirac@example.com', ...ek });

// yerel: eskisi gibi
assert.deepEqual(yazmaIzni({ host: '127.0.0.1:4747' }, null), { izin: true, kaynak: 'yerel' });
assert.deepEqual(yazmaIzni({ host: 'localhost:4747', origin: 'http://localhost:4747' }, ayar), { izin: true, kaynak: 'yerel' });
assert.equal(yazmaIzni({ host: '127.0.0.1:4747', origin: 'http://kotu.example' }, null).izin, false, 'yerelde yabancı origin');
assert.equal(yazmaIzni({ host: '127.0.0.1:4747', origin: 'http://kotu.example' }, null).neden, 'istek kaynağı bu sunucu değil');
assert.equal(yazmaIzni({ host: 'kotu.example' }, null).neden, 'istek yerel adresten gelmiyor');

// vekilden geçen istek, Host 127.0.0.1 olsa bile yerel sayılmaz
for (const ek of [{ 'tailscale-user-login': 'mirac@example.com' }, { 'x-forwarded-for': '100.64.0.2' }]) {
  const s = yazmaIzni({ host: '127.0.0.1:4747', ...ek }, ayar);
  assert.notEqual(s.kaynak, 'yerel', 'vekil başlığı yerel sayılmamalı: ' + Object.keys(ek));
  assert.equal(s.izin, false);
}

// uzak: ayar yoksa kapalı
assert.equal(yazmaIzni(uzak(), null).izin, false, 'ayar yokken uzak kapalı');

// uzak: doğru host + kullanıcı + origin
assert.deepEqual(yazmaIzni(uzak(), ayar), { izin: true, kaynak: 'uzak' });
assert.deepEqual(yazmaIzni(uzak({ host: H.toUpperCase(), origin: `https://${H.toUpperCase()}` }), ayar), { izin: true, kaynak: 'uzak' }, 'host büyük/küçük harf duyarsız');
const originsiz = uzak(); delete originsiz.origin;
assert.deepEqual(yazmaIzni(originsiz, ayar), { izin: true, kaynak: 'uzak' }, 'origin yoksa geçer');

// uzak: ret yolları
assert.equal(yazmaIzni(uzak({ 'tailscale-user-login': 'baska@example.com' }), ayar).izin, false, 'başka kullanıcı');
const kimliksiz = uzak(); delete kimliksiz['tailscale-user-login'];
assert.equal(yazmaIzni(kimliksiz, ayar).izin, false, 'kimlik başlığı yok');
assert.equal(yazmaIzni(uzak({ origin: 'https://kotu.example' }), ayar).izin, false, 'yabancı origin');
assert.equal(yazmaIzni(uzak({ origin: `http://${H}` }), ayar).izin, false, 'https olmayan origin');
assert.equal(yazmaIzni(uzak({ host: 'kotu.example' }), ayar).izin, false, 'yabancı host');
assert.equal(yazmaIzni(uzak({ host: `${H}.kotu.example` }), ayar).izin, false, 'sonek hilesi');
assert.equal(yazmaIzni({ host: H, 'tailscale-user-login': '' }, { host: H, kullanici: '' }).izin, false, 'boş kullanıcı eşleşmez');

// uzakAyar: dosyadan okur, bozuk/eksikse null
const d = mkdtempSync(join(tmpdir(), 'uzak-'));
assert.equal(uzakAyar(d), null, 'dosya yok');
writeFileSync(join(d, '.mdk-uzak.json'), '{bozuk');
assert.equal(uzakAyar(d), null, 'bozuk JSON');
writeFileSync(join(d, '.mdk-uzak.json'), JSON.stringify({ host: H }));
assert.equal(uzakAyar(d), null, 'kullanıcı eksik');
writeFileSync(join(d, '.mdk-uzak.json'), JSON.stringify({ host: H, kullanici: 'k@x.y' }));
assert.deepEqual(uzakAyar(d), { host: H, kullanici: 'k@x.y' });

console.log('uzak.test ok');
