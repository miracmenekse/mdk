// Kapı: "sadece sorunlu" süzgeci çalışmamış adımları gizlemez. Kullanım: node panel/suzgec.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planHtml } from './ciz.mjs';

const li = (html, baslik) => html.split('<li').slice(1).find((r) => r.includes(baslik));
const dnm = (o) => ({ yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, neden: null, sure_sn: 10, token: 100, ...o });
const adim = (no, baslik, bitti) => ({ no, baslik, bitti, kapi: 'k', yurutucu: 'opencode', etki: null, deger: null });
const plan = { ayarlar: {}, kategoriler: [{ ad: 'K', adimlar: [adim(1, 'Temiz', true), adim(2, 'Sorunlu', true), adim(3, 'Bekleyen', false), adim(4, 'Yalnız sessiz', true)] }] };
const gecmis = [
  { no: 1, denemeler: [dnm({})], commit: null, inceleme: { inceleme: 'uyumlu', not: null } },
  { no: 2, denemeler: [dnm({ gecti: false, neden: 'kapi' }), dnm({ deneme: 2 })], commit: null, inceleme: null },
  { no: 4, denemeler: [dnm({ gecti: false, neden: 'yanit_yok' }), dnm({})], commit: null, inceleme: null },
];
const h = planHtml(plan, null, gecmis, {});
// gizlenecek = yalnız geçmişi olup sorunsuz olanlar; bekleyen adım her zaman görünür
assert.ok(li(h, 'Temiz').includes('data-sorunsuz="1"'));
assert.ok(li(h, 'Yalnız sessiz').includes('data-sorunsuz="1"'));
assert.ok(li(h, 'Sorunlu').includes('data-sorunsuz="0"'));
assert.ok(li(h, 'Bekleyen').includes('data-sorunsuz="0"'), 'çalışmamış adım süzgeçle gizlenmemeli');
// geriye uyum: geçmiş verilmezse hiçbir adım gizlenmez
assert.ok(!planHtml(plan, null).includes('data-sorunsuz="1"'));
// panel betiği yeni özniteliği kullanır, eskisini değil
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
assert.ok(html.includes('dataset.sorunsuz'), 'index.html data-sorunsuz ile gizlemeli');
assert.ok(!html.includes("dataset.sorunlu !== '1'"), 'eski süzgeç koşulu kalmamalı');
console.log('suzgec.test ok');
