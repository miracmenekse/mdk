// Adım 97 kapısı: akisTablosuHtml(plan, simdi, gecmis, incelemeler)
// v3 düz ADIMLAR tablosu: Adım / İlerleme / Durum sütunları, data-adim satırları.
// Gruplu <details data-kat> ve "sadece sorunlu" süzgeci YOK.
import assert from 'node:assert/strict';
import { akisTablosuHtml } from './ciz.mjs';

const plan = { kategoriler: [{ ad: 'K', adimlar: [
  { no: 88, baslik: 'Gerçek deneme ve ölçüm', bitti: true, yurutucu: 'opencode', kapi: 'true' },
  { no: 92, baslik: 'Panelde ön regresyon durumu', bitti: false, yurutucu: 'opencode', kapi: 'true' },
  { no: 93, baslik: 'Dar ekran düzeni', bitti: false, yurutucu: 'kodcu', kapi: 'true' },
] }] };
const simdi = { adim: 92, baslik: 'Panelde ön regresyon durumu', model: 'opencode-go/glm-5.3-flash', deneme: 2, durum: 'calisiyor', ts: 1793530000 };
const gecmis = [{ no: 88, denemeler: [{ deneme: 1, model: 'opencode-go/glm-5.3-flash', gecti: true, sure_sn: 360, token: 12400 }], commit: { sha: 'abc1234', eklenen: 10, silinen: 2, dosya: 1, mesaj: 'x' } }];

const h = akisTablosuHtml(plan, simdi, gecmis, {});

assert.ok(h.includes('<table'), 'tablo olmalı');
assert.ok(h.includes('Adım') && h.includes('İlerleme') && h.includes('Durum'), 'sütun başlıkları');
assert.ok(h.includes('data-adim="88"') && h.includes('data-adim="92"') && h.includes('data-adim="93"'), 'satırlar data-adim taşımalı');
assert.ok(!/<details[^>]*data-kat/.test(h), 'gruplu kategori <details> olmamalı');
assert.ok(!h.includes('sadece-sorunlu'), '"sadece sorunlu" süzgeci olmamalı');

// durum rozetleri satıra özgü
assert.ok(/data-adim="88"[\s\S]*?rozet bitti/.test(h), '88 bitti rozeti');
assert.ok(/data-adim="92"[\s\S]*?rozet calisiyor/.test(h), '92 çalışıyor rozeti');
assert.ok(/data-adim="93"[\s\S]*?rozet bekliyor/.test(h), '93 bekliyor rozeti');

// meta: biten adımda model + token
assert.ok(h.includes('opencode-go/glm-5.3-flash'), 'model meta görünmeli');
assert.ok(h.includes('12.400'), 'token meta (tr-TR) görünmeli');

// çalışan satır vurgusu (sınıf data-adim'den önce gelir)
assert.ok(/class="[^"]*\bsecili\b[^"]*"[^>]*data-adim="92"/.test(h), 'çalışan satır "secili" sınıfı');

console.log('akis-tablo.test ok');
