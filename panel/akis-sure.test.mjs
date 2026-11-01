// Adım 104 kapısı: akisTablosuHtml meta satırında ortalama süre (sn).
import assert from 'node:assert/strict';
import { akisTablosuHtml } from './ciz.mjs';

const plan = { kategoriler: [{ ad: 'K', adimlar: [{ no: 88, baslik: 'A', bitti: true, yurutucu: 'opencode' }] }] };
const gecmis = [{ no: 88, denemeler: [{ deneme: 1, model: 'opencode-go/glm-5.3-flash', gecti: true, sure_sn: 386, token: 12400, neden: null }] }];

const h = akisTablosuHtml(plan, null, gecmis, {});
assert.ok(/386 sn/.test(h), 'biten adımın meta satırında süre (386 sn) görünmeli');
assert.ok(h.includes('opencode-go/glm-5.3-flash') && h.includes('12.400'), 'model ve token korunmalı');

console.log('akis-sure.test ok');
