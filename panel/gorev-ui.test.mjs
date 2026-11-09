// Kapı (adım 121): Modeller sekmesindeki "Görev modelleri" bölgesi.
// Kullanım: node panel/gorev-ui.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gorevModelleriHtml } from './ciz.mjs';

const SERBEST = ['opencode/a-free', 'opencode/b-free', 'opencode/c-free', 'opencode/big-pickle'];
const gorevler = [
  { gorev: 'kod', modeller: ['opencode/b-free', 'opencode/x-paid'] },
  { gorev: 'kapi', modeller: ['opencode/c-free'] },
];

const html = gorevModelleriHtml(gorevler, SERBEST);
assert.ok(html.includes('<table'), 'tablo bekleniyordu');

const selectler = [...html.matchAll(/<select\b[^>]*>[\s\S]*?<\/select>/g)].map((m) => m[0]);
const secici = (gorev, sira) => selectler.find((s) => s.includes(`data-gorev="${gorev}"`) && s.includes(`data-sira="${sira}"`));

const secili = (s) => {
  const m = s.match(/<option[^>]*\bselected\b[^>]*>([\s\S]*?)<\/option>/);
  return m ? m[1].replace(/<[^>]*>/g, '').trim() : null;
};
const ilkOption = (s) => s.match(/<option[^>]*>([\s\S]*?)<\/option>/);

// her görev adı, her model için doğru seçici ve seçili seçenek
for (const g of gorevler) {
  assert.ok(html.includes(g.gorev), `görev adı yok: ${g.gorev}`);
  g.modeller.forEach((model, i) => {
    const s = secici(g.gorev, i);
    assert.ok(s, `${g.gorev} sıra ${i} seçicisi yok`);
    assert.match(s, /gorev-model/, 'seçici gorev-model sınıfında olmalı');
    if (model === 'opencode/x-paid') {
      const t = secili(s);
      assert.ok(t && t.includes(model) && t.includes('ücretsiz değil'), `ücretsiz olmayan model etiketi yok: ${t}`);
    } else {
      assert.equal(secili(s), model, `${g.gorev} sıra ${i} seçili model yanlış`);
    }
  });
  // yedek ekleme seçicisi: modeller.length sırasında, ilk seçenek boş "+ yedek ekle"
  const y = secici(g.gorev, g.modeller.length);
  assert.ok(y, `${g.gorev} yedek seçicisi yok`);
  const ilk = ilkOption(y);
  assert.ok(ilk && ilk[1].includes('+ yedek ekle'), `${g.gorev} yedek ekle ilk seçeneği yok`);
  assert.ok(!/value="[^"]+"/.test(ilk[0]), `${g.gorev} yedek ekle ilk seçeneği boş değerli olmalı`);
}

assert.ok(html.includes('+ yedek ekle'), '+ yedek ekle metni yok');

// görev adındaki HTML kaçışlanır
const kotu = gorevModelleriHtml([{ gorev: '<script>alert(1)</script>', modeller: ['opencode/a-free'] }], SERBEST);
assert.ok(!kotu.includes('<script>'), 'görev adı kaçışlanmalı');
assert.ok(kotu.includes('&lt;script&gt;'), 'kaçışlanmış görev adı yok');

// boş ya da eksik girdi
for (const bos of [[], undefined, null]) {
  const h = gorevModelleriHtml(bos, SERBEST);
  assert.match(h, /class="bos"[^>]*>\s*görev yok/, 'boş girdide "görev yok" yok');
}

// index.html: bölüm, çizim çağrısı ve POST ucu bağlı
const sayfa = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(sayfa.includes('id="gorev-modelleri"'), 'index.html görev-modelleri bölümü yok');
assert.ok(sayfa.includes('gorevModelleriHtml'), 'index.html çizim çağrısı yok');
assert.ok(sayfa.includes('/api/gorev-model'), 'index.html POST ucu yok');

console.log('gorev-ui.test ok');
