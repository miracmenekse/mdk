import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// kodcu/claude işleri çalıştırıcı üzerinden geçmediği için durum.json güncellenmiyor, "Şu an" kartı bayat kalıyordu.
const KAYIT = fileURLToPath(new URL('../op-kayit.mjs', import.meta.url));
const kos = (args) => spawnSync(process.execPath, [KAYIT, ...args], { encoding: 'utf8' });
const durum = (d) => JSON.parse(readFileSync(join(d, 'durum.json'), 'utf8'));

const d = mkdtempSync(join(tmpdir(), 'kdurum-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [x] 9. Çoklu kapı\n  - Kapı: `true`\n- [ ] 10. Başka iş\n  - Kapı: `true`\n');

// geçti: durum.json adımı gösterir, başlık PLAN.md'den gelir
let r = kos(['9', '--yurutucu', 'kodcu', '--model', 'sonnet', '--gecti', 'true', '--dizin', d]);
assert.equal(r.status, 0, r.stderr);
let s = durum(d);
assert.equal(s.adim, 9);
assert.equal(s.baslik, 'Çoklu kapı');
assert.equal(s.model, 'sonnet');
assert.equal(s.deneme, 1);
assert.equal(s.durum, 'gecti');
assert.equal(typeof s.ts, 'number');

// kaldı: eskale
r = kos(['10', '--yurutucu', 'kodcu', '--model', 'sonnet', '--gecti', 'false', '--deneme', '2', '--dizin', d]);
assert.equal(r.status, 0, r.stderr);
s = durum(d);
assert.deepEqual([s.adim, s.baslik, s.durum, s.deneme], [10, 'Başka iş', 'eskale', 2]);

// inceleme kaydı durum.json'a dokunmaz
const once = readFileSync(join(d, 'durum.json'), 'utf8');
r = kos(['9', '--inceleme', 'uyumlu', '--dizin', d]);
assert.equal(r.status, 0, r.stderr);
assert.equal(readFileSync(join(d, 'durum.json'), 'utf8'), once);

// PLAN.md yoksa da çalışır (başlık null)
const d2 = mkdtempSync(join(tmpdir(), 'kdurum2-'));
r = kos(['3', '--yurutucu', 'claude', '--model', 'opus', '--gecti', 'true', '--dizin', d2]);
assert.equal(r.status, 0, r.stderr);
assert.ok(existsSync(join(d2, 'durum.json')));
assert.equal(durum(d2).baslik ?? null, null);

// hatalı kullanımda durum.json yazılmaz
const d3 = mkdtempSync(join(tmpdir(), 'kdurum3-'));
r = kos(['3', '--yurutucu', 'kodcu', '--model', 'sonnet', '--gecti', 'belki', '--dizin', d3]);
assert.equal(r.status, 2);
assert.ok(!existsSync(join(d3, 'durum.json')));
console.log('kayit-durum.test ok');
