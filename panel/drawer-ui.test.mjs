// Adım 98 kapısı: index.html düz tabloya geçer + drawer kabuğu/aç-kapat.
// jsdom yok → sunucudan '/' çekip iskelet ve bağlama kodunu substring ile denetler.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';

const d = mkdtempSync(join(tmpdir(), 'drawer-ui-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const s = await baslat(d, 0);
const h = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
await s.kapat();

// düz tablo + drawer fonksiyonları içe aktarılmalı
assert.ok(h.includes('akisTablosuHtml'), 'akisTablosuHtml içe aktarılmalı/kullanılmalı');
assert.ok(h.includes('drawerHtml'), 'drawerHtml kullanılmalı');
assert.ok(h.includes('personaBalonlarHtml'), 'personaBalonlarHtml (lazy doldurma) kullanılmalı');

// drawer + overlay iskeleti
assert.ok(h.includes('id="drawer"'), '#drawer öğesi');
assert.ok(h.includes('id="drawer-overlay"'), '#drawer-overlay öğesi');

// satır tıklama → açma
assert.ok(h.includes('data-adim'), 'satır tıklaması data-adim ile');
assert.ok(h.includes('/api/persona'), 'persona lazy fetch');

// kapatma 3 yol: kapat düğmesi, Escape, overlay
assert.ok(h.includes('drawer-kapat'), 'kapat düğmesi bağlı');
assert.ok(h.includes('Escape'), 'Esc ile kapanır');

// eski gruplu liste süzgeci kaldırıldı
assert.ok(!h.includes('filtreUygula'), 'gruplu liste süzgeci (filtreUygula) kaldırılmalı');

console.log('drawer-ui.test ok');
