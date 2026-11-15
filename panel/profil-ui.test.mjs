// Kapı (adım 180): Modeller sekmesinde hazır profil kartları.
// Kullanım: node panel/profil-ui.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { profilHtml } from './ciz.mjs';

const profiller = [
  { ad: 'ucretsiz', baslik: 'Yalnız ücretsiz', aciklama: 'Hiç ücret ödemezsin.', etkin: false },
  { ad: 'karma', baslik: 'Önce ücretsiz, takılırsa abonelik', aciklama: 'İşi ücretsiz modeller dener.', etkin: true },
  { ad: 'go', baslik: 'OpenCode Go aboneliğim var', aciklama: 'İşler abonelik modelleriyle yapılır.', etkin: false },
];

const kartlar = (h) => [...h.matchAll(/<div class="profil-kart[^"]*"[^>]*>/g)].map((m) => m[0]);
const dugmeler = (h) => [...h.matchAll(/<button[^>]*class="profil-sec"[^>]*>/g)].map((m) => m[0]);

// (1) üç profil, ikincisi etkin
const h1 = profilHtml(profiller.map((p) => ({ ...p })));
assert.equal(kartlar(h1).length, 3, 'üç profil kartı bekleniyordu');
const etkinKartlar = kartlar(h1).filter((k) => /profil-kart etkin/.test(k));
assert.equal(etkinKartlar.length, 1, 'tam bir etkin kart olmalı');
assert.ok(etkinKartlar[0].includes('data-ad="karma"'), 'etkin kart karma olmalı');
assert.equal(dugmeler(h1).length, 2, 'etkin kartta düğme olmamalı: iki düğme bekleniyordu');
assert.ok(!dugmeler(h1).some((d) => d.includes('data-ad="karma"')), 'etkin karmada "Bunu kullan" düğmesi olmamalı');
assert.equal((h1.match(/rozet bitti[^>]*>etkin</g) || []).length, 1, 'etkin rozeti bir kez olmalı');
assert.ok(!h1.includes('özel ayar'), 'etkin profil varken "özel ayar" yazmamalı');

// (2) hiçbiri etkin değil → özel ayar, üç düğme
const h2 = profilHtml(profiller.map((p) => ({ ...p, etkin: false })));
assert.ok(h2.includes('özel ayar'), 'hiçbiri etkin değilken "özel ayar" yazmalı');
assert.equal(dugmeler(h2).length, 3, 'üç düğme bekleniyordu');

// (3) izleyici → hiç düğme yok
const h3 = profilHtml(profiller, true);
assert.equal(dugmeler(h3).length, 0, 'izleyici modunda düğme olmamalı');
assert.equal(kartlar(h3).length, 3, 'izleyici modunda kartlar yine görünmeli');

// (4) kaçış ve data-ad değerleri
const h4 = profilHtml([{ ad: 'x', baslik: 'A <b>', aciklama: 'a', etkin: false }]);
assert.ok(h4.includes('A &lt;b&gt;'), 'başlık kaçışlanmalı');
assert.ok(!h4.includes('A <b>'), 'ham başlık HTML olarak çıkmamalı');
const h5 = profilHtml(profiller);
for (const p of profiller) assert.ok(h5.includes(`data-ad="${p.ad}"`), `data-ad="${p.ad}" yok`);

// (5) boş girdi
for (const bos of [[], undefined]) {
  assert.equal(profilHtml(bos), '', 'boş girdide boş dizge dönmeli');
}

// (6) index.html bağlantıları
const sayfa = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(sayfa.includes('id="profiller"'), 'index.html id="profiller" yok');
assert.ok(sayfa.includes('/api/profil'), 'index.html /api/profil isteği yok');
assert.match(sayfa, /import\s*\{[^}]*profilHtml[^}]*\}\s*from\s*'\/ciz\.mjs'/, 'profilHtml /ciz.mjs içinden içe aktarılmalı');

console.log('profil-ui.test ok');
