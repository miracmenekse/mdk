// Adım 146 kapısı: persona takımı doğrulaması (takimDenetle, adCakisir, sunucu, HTML).
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { takimDenetle, adCakisir } from './persona.mjs';
import { baslat } from './sunucu.mjs';

// takimDenetle: geçerli iki persona → tamam; adlar kırpılmış, yorumlar ve proje korunur, eksik korluk ''.
const girdi = {
  proje: 'mdk',
  personalar: [
    { ad: '  A  ', optimize: '  optA  ', korluk: '  k  ', soru: '  s  ', yorumlar: [{ metin: 'y' }] },
    { ad: 'B', optimize: 'optB' },
  ],
};
const sonuc = takimDenetle(girdi);
assert.equal(sonuc.tamam, true, 'geçerli takım tamam olmalı');
assert.equal(sonuc.takim.personalar[0].ad, 'A', 'ad kırpılmalı');
assert.equal(sonuc.takim.personalar[0].optimize, 'optA', 'optimize kırpılmalı');
assert.deepEqual(sonuc.takim.personalar[0].yorumlar, [{ metin: 'y' }], 'yorumlar aynen korunmalı');
assert.equal(sonuc.takim.personalar[1].korluk, '', 'eksik korluk boş string olmalı');
assert.equal(sonuc.takim.personalar[1].soru, '', 'eksik soru boş string olmalı');
assert.equal(sonuc.takim.proje, 'mdk', 'proje korunmalı');

// ad boş
const bosAd = takimDenetle({ personalar: [{ ad: '  ', optimize: 'o' }] });
assert.equal(bosAd.tamam, false, 'boş ad tamam:false');
assert.equal(bosAd.hata, 'Ad boş olamaz.', 'boş ad hata metni');

// optimize boş
const bosOpt = takimDenetle({ personalar: [{ ad: 'A', optimize: '   ' }] });
assert.equal(bosOpt.tamam, false, 'boş optimize tamam:false');
assert.match(bosOpt.hata, /optimize/, 'optimize hata metni optimize içermeli');

// büyük/küçük harf duyarsız tekrar
const tekrar = takimDenetle({ personalar: [{ ad: 'Ürün', optimize: 'o1' }, { ad: 'ürün ', optimize: 'o2' }] });
assert.equal(tekrar.tamam, false, 'tekrar ad tamam:false');
assert.match(tekrar.hata, /zaten var/, 'tekrar hata metni zaten var içermeli');

// personalar dizi değil
assert.equal(takimDenetle({ personalar: 'x' }).tamam, false, 'personalar dizi değil');
// 13 persona
const onUc = Array.from({ length: 13 }, (_, i) => ({ ad: `P${i}`, optimize: 'o' }));
assert.equal(takimDenetle({ personalar: onUc }).tamam, false, '13 persona tamam:false');
// ad 61 karakter
assert.equal(takimDenetle({ personalar: [{ ad: 'a'.repeat(61), optimize: 'o' }] }).tamam, false, '61 karakter ad tamam:false');

// adCakisir
const takim = { personalar: [{ ad: 'A' }, { ad: 'B' }] };
assert.equal(adCakisir(takim, ' a '), true, 'eşleşen ad true');
assert.equal(adCakisir(takim, 'a', 0), false, 'haric indeksi atlanmalı');
assert.equal(adCakisir(takim, 'C'), false, 'eşleşmeyen ad false');

// sunucu
const d = mkdtempSync(join(tmpdir(), 'persona-dogrula-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
mkdirSync(join(d, 'persona'));
const ilkDosya = JSON.stringify({ personalar: [{ ad: 'A', optimize: 'o', korluk: 'k', soru: 's' }] }, null, 2) + '\n';
writeFileSync(join(d, 'persona', 'takim.json'), ilkDosya);

const s = await baslat(d, 0);
const kok = `http://127.0.0.1:${s.port}`;

// yinelenen adlı POST → 400, hata zaten var, dosya değişmemiş
const once = readFileSync(join(d, 'persona', 'takim.json'), 'utf8');
const dup = await fetch(`${kok}/api/persona-takim`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ personalar: [{ ad: 'A', optimize: 'o' }, { ad: 'A', optimize: 'o2' }] }),
});
assert.equal(dup.status, 400, 'yinelenen ad POST 400 olmalı');
const dupGovde = await dup.json();
assert.match(String(dupGovde.hata || ''), /zaten var/, 'gövde hata zaten var içermeli');
assert.equal(readFileSync(join(d, 'persona', 'takim.json'), 'utf8'), once, 'yinelenen ad dosyayı değiştirmemeli');

// geçerli POST (ad: ' B ') → 200 ve dosyada B
const gecerli = await fetch(`${kok}/api/persona-takim`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ personalar: [{ ad: ' B ', optimize: 'o' }] }),
});
assert.equal(gecerli.status, 200, 'geçerli POST 200 olmalı');
const dosyaSon = JSON.parse(readFileSync(join(d, 'persona', 'takim.json'), 'utf8'));
assert.equal(dosyaSon.personalar[0].ad, 'B', 'dosyada B olmalı');

// GET /persona.mjs → 200 ve takimDenetle içerir
const modul = await fetch(`${kok}/persona.mjs`);
assert.equal(modul.status, 200, 'persona.mjs 200 olmalı');
assert.match(await modul.text(), /takimDenetle/, 'persona.mjs takimDenetle içermeli');

// GET / HTML'i id="persona-durum" içerir
const html = await (await fetch(`${kok}/`)).text();
assert.ok(html.includes('id="persona-durum"'), 'HTML persona-durum id içermeli');

await s.kapat();
console.log('persona-dogrula.test ok');
