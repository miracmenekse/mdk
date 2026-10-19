// Kapı: opencode.db'den gerçek token ve tasarruf kartı. Kullanım: node panel/telemetri.test.mjs
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { telemetri } from './telemetri.mjs';
import { telemetriHtml } from './ciz.mjs';
import { snapshot } from './durum.mjs';
import { baslat } from './sunucu.mjs';

const d = mkdtempSync(join(tmpdir(), 'telemetri-'));
const dbYol = join(d, 'opencode.db');
const db = new DatabaseSync(dbYol);
db.exec('create table message (id text primary key, session_id text, time_created integer, time_updated integer, data text)');
const ekle = (id, veri) => db.prepare('insert into message values (?,?,?,?,?)').run(id, 's1', 1, 1, typeof veri === 'string' ? veri : JSON.stringify(veri));
const asist = (model, t, sureMs, cost = 0) => ({
  role: 'assistant', providerID: 'opencode', modelID: model, cost,
  tokens: { input: t[0], output: t[1], reasoning: t[2], cache: { read: t[3], write: t[4] } },
  ...(sureMs ? { time: { created: 1000, completed: 1000 + sureMs } } : {}),
});
ekle('m1', asist('a-free', [1e6, 1e6, 0, 0, 0], 100000));
ekle('m2', asist('a-free', [1e6, 5e5, 5e5, 1e6, 1e6], 100000));
ekle('m3', asist('b', [1e6, 0, 0, 0, 0], null, 1.0));            // süre yok → tok/sn null; ücretli
ekle('m4', { role: 'user', tokens: { input: 9e9, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } }); // kullanıcı mesajı sayılmaz
ekle('m5', { role: 'assistant', providerID: 'opencode', modelID: 'c', cost: 0 });                           // tokens yok
ekle('m6', '{bozuk json');                                                                                  // bozuk satır atlanır
db.close();
const once = readFileSync(dbYol);
const mt = statSync(dbYol).mtimeMs;

const fiyat = { referans: { ad: 'ref', giris: 2, cikis: 10, cacheOkuma: 0.2, cacheYazma: 2.5 } };
const t = telemetri(dbYol, fiyat);
const yakin = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} ≠ ${b}`);

assert.equal(t.var, true);
assert.equal(t.modeller.length, 2, 'yalnız asistan mesajları ve tokens olanlar');
assert.deepEqual(t.modeller.map((m) => m.model), ['opencode/a-free', 'opencode/b'], 'toplam token azalan sırada');
const a = t.modeller[0];
assert.deepEqual([a.mesaj, a.giris, a.cikis, a.akil, a.cacheOkuma, a.cacheYazma], [2, 2e6, 1.5e6, 5e5, 1e6, 1e6]);
assert.equal(a.toplam, 2e6 + 1.5e6 + 5e5 + 1e6 + 1e6);
assert.equal(a.toksn, 7500, 'tok/sn = çıkış token / süre (reasoning hariç)');
assert.equal(t.modeller[1].toksn, null, 'süre yoksa tok/sn null (0 değil)');
yakin(t.modeller[1].maliyet, 1.0, 'ödenen maliyet');
// tasarruf: (giriş·2 + (çıkış+reasoning)·10 + cacheOkuma·0.2 + cacheYazma·2.5) / 1M, referans fiyatla
// a: 4 + 20 + 0.2 + 2.5 = 26.7 ; b: 2 ; toplam 28.7 ; ödenen 1.0 ; tasarruf 27.7
yakin(t.tasarruf.listeFiyati, 28.7, 'liste fiyatı');
yakin(t.tasarruf.odenen, 1.0, 'ödenen');
yakin(t.tasarruf.tutar, 27.7, 'tasarruf');
assert.equal(t.tasarruf.referans, 'ref');
assert.equal(telemetri(dbYol, null).tasarruf, null, 'fiyat yoksa tasarruf null');
assert.equal(telemetri(dbYol, { referans: { ad: 'x' } }).tasarruf, null, 'eksik fiyat alanı: tahmin uydurulmaz');
assert.equal(t.toplam.mesaj, 3);

// salt-okunur: veritabanı değişmedi
assert.ok(readFileSync(dbYol).equals(once) && statSync(dbYol).mtimeMs === mt, 'veritabanına yazılmamalı');

// bozuk girdiler çökertmez
assert.deepEqual(telemetri(join(d, 'yok.db'), fiyat), { var: false, modeller: [], toplam: null, tasarruf: null });
writeFileSync(join(d, 'bozuk.db'), 'sqlite değil');
assert.equal(telemetri(join(d, 'bozuk.db'), fiyat).var, false);
const bos = join(d, 'bos.db'); new DatabaseSync(bos).close();
assert.equal(telemetri(bos, fiyat).var, false, 'message tablosu yoksa veri yok');

// çizim
const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
let h = duz(telemetriHtml(t));
assert.ok(h.includes('Tasarruf') && h.includes('tahmin'), 'kart "tahmin" etiketi taşır');
assert.match(h, /\$28[.,]70/); assert.match(h, /\$1[.,]00/);
assert.match(h, /7[.\s ]?500/); assert.ok(h.includes('tok/sn') && h.includes('opencode/a-free') && h.includes('—'));
assert.ok(!telemetriHtml(t).includes('undefined') && !telemetriHtml(t).includes('NaN') && !telemetriHtml(t).includes('null'));
assert.ok(duz(telemetriHtml(telemetri(dbYol, null))).includes('referans fiyat girilmedi'));
assert.ok(duz(telemetriHtml(telemetri(join(d, 'yok.db'), fiyat))).includes('OpenCode veritabanı bulunamadı'));
assert.ok(duz(telemetriHtml(null)).includes('OpenCode veritabanı bulunamadı'));
assert.ok(!telemetriHtml({ ...t, modeller: [{ ...a, model: '<b>x</b>' }] }).includes('<b>x</b>'), 'kaçışlanmalı');

// snapshot: OPENCODE_DB ve proje fiyat.json'u
const p = mkdtempSync(join(tmpdir(), 'telemetri-p-'));
writeFileSync(join(p, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
process.env.OPENCODE_DB = dbYol;
assert.equal(snapshot(p).telemetri.var, true);
assert.equal(snapshot(p).telemetri.tasarruf, null, 'fiyat.json yoksa tasarruf yok');
writeFileSync(join(p, 'fiyat.json'), JSON.stringify(fiyat));
yakin(snapshot(p).telemetri.tasarruf.tutar, 27.7, 'snapshot tasarruf');
process.env.OPENCODE_DB = join(d, 'yok.db');
assert.equal(snapshot(p).telemetri.var, false);

// sayfa
const s = await baslat(p, 0);
const sayfa = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
assert.ok(sayfa.includes('id="telemetri"') && sayfa.includes('telemetriHtml'), 'sayfa telemetri bölümünü çizmeli');
await s.kapat();
console.log('telemetri.test ok');
