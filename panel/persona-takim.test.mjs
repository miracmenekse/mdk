// Adım 107 kapısı: personaTakimHtml(takim) — Persona sekmesi kartları (Ad/Optimize/Körlük/Soru).
import assert from 'node:assert/strict';
import { personaTakimHtml } from './ciz.mjs';

const takim = { proje: 'mdk', personalar: [
  { ad: 'Ürün Sahibi', optimize: 'iş değeri', korluk: 'teknik borç', soru: 'Hangi sorunu çözüyor?' },
  { ad: 'Mühendis', optimize: 'sadelik', korluk: 'aciliyet', soru: 'En küçük uygulama ne?' },
  { ad: 'Eleştirmen', optimize: 'risk & basit alternatif', korluk: '<script>x</script>', soru: 'Ne ters gider?' },
] };

const h = personaTakimHtml(takim);
assert.equal((h.match(/persona-kart/g) || []).length, 3, '3 persona kartı');
for (const p of takim.personalar) assert.ok(h.includes(p.ad), `ad görünmeli: ${p.ad}`);
assert.ok(h.includes('iş değeri') && h.includes('sadelik') && h.includes('risk & basit alternatif'), 'optimize alanları');
assert.ok(h.includes('teknik borç') && h.includes('aciliyet'), 'körlük alanları');
assert.ok(h.includes('Hangi sorunu çözüyor?') && h.includes('En küçük uygulama ne?'), 'soru alanları');
// sıraya göre renk sınıfı + avatar baş harfleri
assert.ok(h.includes('persona-a') && h.includes('persona-b') && h.includes('persona-c'), 'renk sınıfları');
assert.ok(h.includes('ÜS') && h.includes('M') && h.includes('E'), 'avatar baş harfleri');
// XSS
assert.ok(!h.includes('<script>x</script>') && h.includes('&lt;script&gt;'), 'kaçış');
// boş
assert.ok(/bos|persona yok/i.test(personaTakimHtml({ personalar: [] })), 'boş durum');
assert.ok(/bos|persona yok/i.test(personaTakimHtml(null)), 'null güvenli');

console.log('persona-takim.test ok');
