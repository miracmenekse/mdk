// Adım 95 kapısı: personaBalonlarHtml(ozet)
// persona-tur ozet.md metnindeki her `## <kart>` bloğunu bir balona çevirir.
// `# Persona turu` H1 ve özet `- ...` satırları balon OLMAZ. Boş/null → boş durum.
import assert from 'node:assert/strict';
import { personaBalonlarHtml } from './ciz.mjs';

// boş / null → boş durum
for (const bos of [null, '', '   ']) {
  const h = personaBalonlarHtml(bos);
  assert.match(h, /bos/, 'boş ozet boş durum sınıfı içermeli');
  assert.match(h, /persona turu yok/i, 'boş ozet açıklama metni içermeli');
}

const ozet = `# Persona turu

Alan: proje-gelistirme

Soru:
Panel regresyonu neden yavaş?

- Ürün Sahibi · a/x · gecerli · 1000 token
- Test Mühendisi · a/x · gecerli · 1200 token
- Geliştirici · a/x · gecerli · 900 token

## Ürün Sahibi

Testin tamamlanmasını bekliyorum.

## Test Mühendisi

Token sınırına ulaştı; <script>alert(1)</script> kapsam iyi.

## Geliştirici

Senaryoların yarısı geçti.
`;

const h = personaBalonlarHtml(ozet);

// tam 3 balon (H1 ve özet - satırları balon değil)
assert.equal((h.match(/persona-balon/g) || []).length, 3, '3 persona balonu olmalı');

// rol adları
for (const rol of ['Ürün Sahibi', 'Test Mühendisi', 'Geliştirici']) {
  assert.ok(h.includes(rol), `rol görünmeli: ${rol}`);
}

// sıraya göre renk sınıfları
assert.ok(h.includes('persona-a') && h.includes('persona-b') && h.includes('persona-c'), 'a/b/c renk sınıfları');

// avatar baş harfleri (çok kelime → ilk iki kelimenin baş harfi; tek kelime → ilk iki harf), tr büyük
assert.ok(h.includes('ÜS'), 'Ürün Sahibi avatarı ÜS');
assert.ok(h.includes('TM'), 'Test Mühendisi avatarı TM');
assert.ok(h.includes('GE'), 'Geliştirici avatarı GE');

// gövde metni
assert.ok(h.includes('Senaryoların yarısı geçti'), 'persona yanıt metni görünmeli');

// XSS: ham script yok, kaçışlanmış var
assert.ok(!h.includes('<script>'), 'ham <script> olmamalı');
assert.ok(h.includes('&lt;script&gt;'), 'script kaçışlanmalı');

console.log('persona-ciz.test ok');
