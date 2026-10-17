import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gecmis } from './gecmis.mjs';
import { snapshot } from './durum.mjs';

const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const git = (d, ...a) => execFileSync('git', a, { cwd: d, env, encoding: 'utf8' });
const d = mkdtempSync(join(tmpdir(), 'gecmis-'));
git(d, 'init', '-q');
const yaz = (f, s, msg) => { writeFileSync(join(d, f), s); git(d, 'add', '-A'); git(d, 'commit', '-qm', msg); };
yaz('a.txt', 'a\nb\nc\n', 'adım 1: İlk');                          // +3 −0, 1 dosya
writeFileSync(join(d, 'b.txt'), 'x\ny\n'); writeFileSync(join(d, 'a.txt'), 'a\nb\n');
git(d, 'add', '-A'); git(d, 'commit', '-qm', 'adım 2: İkinci');    // +2 −1, 2 dosya
yaz('c.txt', 'z\n', 'adım 2: İkinci tekrar');                      // +1 −0, 1 dosya (adım 2'nin en yenisi)
yaz('d.txt', 'q\n', 'adım 3: Sadece commit');                      // metriği yok
yaz('e.txt', 'w\n', 'başka iş');                                   // adım değil, yok sayılır

const satir = (o) => ({ ts: 1, adim: 1, yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: true, sure_sn: 10, token: 100, maliyet: 0, neden: null, ...o });
const satirlar = [
  satir({ gecti: false, neden: 'kapi' }),
  satir({ deneme: 2, sure_sn: 30, token: 200 }),
  satir({ adim: 2, yurutucu: 'kodcu', model: 'sonnet' }),
  { tur: 'inceleme', adim: 1, inceleme: 'uyumlu', not: 'iyi', ts: 5 },
];

const g = gecmis(d, satirlar);
assert.deepEqual(g.map((x) => x.no), [1, 2, 3]);

assert.deepEqual(g[0].denemeler, [
  { yurutucu: 'opencode', model: 'a/x', deneme: 1, gecti: false, neden: 'kapi', sure_sn: 10, token: 100 },
  { yurutucu: 'opencode', model: 'a/x', deneme: 2, gecti: true, neden: null, sure_sn: 30, token: 200 },
]);
assert.match(g[0].commit.sha, /^[0-9a-f]{7}$/);
assert.equal(g[0].commit.mesaj, 'adım 1: İlk');
assert.match(g[0].commit.tarih, /^\d{4}-\d\d-\d\dT/);
assert.deepEqual([g[0].commit.dosya, g[0].commit.eklenen, g[0].commit.silinen], [1, 3, 0]);
assert.deepEqual(g[0].inceleme, { inceleme: 'uyumlu', not: 'iyi' });

assert.equal(g[1].commit.mesaj, 'adım 2: İkinci tekrar'); // adım başına en yeni commit
assert.deepEqual([g[1].commit.dosya, g[1].commit.eklenen, g[1].commit.silinen], [1, 1, 0]);
assert.equal(g[1].inceleme, null);
assert.equal(g[1].denemeler[0].yurutucu, 'kodcu');

assert.deepEqual(g[2].denemeler, []);
assert.equal(g[2].commit.mesaj, 'adım 3: Sadece commit');

// git deposu değilse commit null, hata fırlatmaz
const d2 = mkdtempSync(join(tmpdir(), 'gecmis2-'));
const g2 = gecmis(d2, satirlar);
assert.deepEqual(g2.map((x) => x.no), [1, 2]);
assert.ok(g2.every((x) => x.commit === null));

// snapshot() gecmis alanını içerir
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
writeFileSync(join(d, 'metrikler.jsonl'), satirlar.map((s) => JSON.stringify(s)).join('\n') + '\n');
const s = snapshot(d);
assert.ok(Array.isArray(s.gecmis));
assert.equal(s.gecmis[0].commit.sha, g[0].commit.sha);
assert.equal(s.gecmis[0].inceleme.inceleme, 'uyumlu');
console.log('gecmis.test ok');
