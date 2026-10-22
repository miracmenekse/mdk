// Kapı: depo durumu (sürüm, yayımlanmamış, CI, yerel) ve projeye süzülmüş token. Kullanım: node panel/depo.test.mjs
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { depo } from './depo.mjs';
import { depoSeritHtml, depoHtml, telemetriHtml } from './ciz.mjs';
import { telemetri } from './telemetri.mjs';
import { baslat } from './sunucu.mjs';

const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const RUNS = [
  { workflowName: 'windows-release', displayTitle: 'v0.3.6', status: 'completed', conclusion: 'success', headBranch: 'v0.3.6', createdAt: '2026-10-19T12:00:00Z', url: 'https://github.com/o/r/actions/runs/1' },
  { workflowName: 'CodeQL', displayTitle: 'K66 <b>x</b>', status: 'completed', conclusion: 'failure', headBranch: 'main', createdAt: '2026-10-19T11:00:00Z', url: 'https://github.com/o/r/actions/runs/2' },
];
// sahte çalıştırıcı: argümanlara bakıp yanıt verir; çağrılar kaydedilir
function sahte(ust = {}) {
  const cagrilar = [];
  const fn = async (komut, args) => {
    const a = args.join(' ');
    cagrilar.push(`${komut} ${a}`);
    const y = (k, c = '') => ({ kod: k, cikti: c });
    if (komut === 'gh') return ust.gh ?? y(0, JSON.stringify(RUNS));
    if (a.includes('rev-parse --is-inside-work-tree')) return ust.git ?? y(0, 'true\n');
    if (a.includes('remote get-url origin')) return y(0, 'https://github.com/o/r.git\n');
    if (a.includes('describe --tags')) return ust.describe ?? y(0, 'v0.3.6\n');
    if (a.includes('v0.3.6..origin/main')) return y(0, '2b6b6f0\t2026-10-19T15:21:53+03:00\tK66: value picker <b>x</b>\n7332f64\t2026-10-19T10:00:00+03:00\tK65: plain column\n');
    if (a.includes('-10') && a.includes('origin/main')) return y(0, '2b6b6f0\t2026-10-19T15:21:53+03:00\tK66: value picker <b>x</b>\n');
    if (a.includes('abbrev-ref HEAD')) return y(0, 'main\n');
    if (a.includes('rev-list --left-right --count')) return y(0, '1\t0\n');
    if (a.includes('status --porcelain')) return y(0, ' M plugins/a/A.java\n?? yeni.txt\n');
    if (a.includes('fetch')) return y(0, '');
    return y(1, 'bilinmeyen komut');
  };
  fn.cagrilar = cagrilar;
  return fn;
}

// başarı
const c1 = sahte();
const d = await depo('/x', { calistir: c1 });
assert.equal(d.var, true);
assert.equal(d.surum, 'v0.3.6');
assert.equal(d.yayimlanmamis.length, 2);
assert.deepEqual(d.yayimlanmamis[0], { kisa: '2b6b6f0', tarih: '2026-10-19T15:21:53+03:00', mesaj: 'K66: value picker <b>x</b>' });
assert.equal(d.sonK.length, 1);
assert.deepEqual(d.yerel, { dal: 'main', ileri: 1, geri: 0, degisik: ['plugins/a/A.java', 'yeni.txt'] });
assert.equal(d.ci.length, 2);
assert.equal(d.hata, null);
assert.equal(typeof d.ts, 'number');
assert.ok(c1.cagrilar.some((x) => x.startsWith('gh ') && x.includes('-R o/r')), 'gh sahip/depo origin URL\'sinden');
assert.ok(c1.cagrilar.some((x) => x.includes('--no-optional-locks') && x.includes('status --porcelain')), 'status index.lock almamalı');
assert.ok(!c1.cagrilar.some((x) => x.includes('fetch')), 'depo() fetch yapmaz (sunucunun işi)');

// ssh origin biçimi de çözülür
const c1b = sahte();
const ssh = async (k, a) => (a.join(' ').includes('remote get-url') ? { kod: 0, cikti: 'git@github.com:o/r.git\n' } : c1b(k, a));
await depo('/x', { calistir: ssh });
assert.ok(c1b.cagrilar.some((x) => x.startsWith('gh ') && x.includes('-R o/r')));

// git deposu değil
assert.equal((await depo('/x', { calistir: sahte({ git: { kod: 128, cikti: 'fatal' } }) })).var, false);
// gh hatası: ci null, neden hata'da, geri kalan dolu; asla fırlatmaz
const d2 = await depo('/x', { calistir: sahte({ gh: { kod: 1, cikti: 'error connecting to api.github.com' } }) });
assert.equal(d2.var, true);
assert.equal(d2.ci, null);
assert.ok(typeof d2.hata === 'string' && d2.hata.length > 0);
assert.equal(d2.surum, 'v0.3.6');
// gh bozuk JSON
const d2b = await depo('/x', { calistir: sahte({ gh: { kod: 0, cikti: '{bozuk' } }) });
assert.equal(d2b.ci, null);
// etiket yok
const d3 = await depo('/x', { calistir: sahte({ describe: { kod: 128, cikti: 'fatal: No names found' } }) });
assert.equal(d3.surum, null);
assert.equal(d3.yayimlanmamis, null);
// çalıştırıcı fırlatsa bile depo() fırlatmaz
const d4 = await depo('/x', { calistir: async () => { throw new Error('ENOENT'); } });
assert.equal(d4.var, false);

// çizim: şerit
let h = depoSeritHtml(d);
for (const id of ['kpi-surum', 'kpi-yayimlanmamis', 'kpi-ci', 'kpi-yerel']) assert.ok(h.includes(`id="${id}"`), `#${id} yok`);
let t = duz(h);
assert.ok(t.includes('v0.3.6'));
assert.ok(/\b2 K\b/.test(t), 'yayımlanmamış K sayısı');
assert.ok(t.includes('✓') && t.includes('geçti'), 'son windows-release koşusu simge + metin');
assert.ok(/2 dosya/.test(t) && t.includes('↑1') && t.includes('↓0'));
assert.ok(duz(depoSeritHtml({ ...d, ci: [{ ...RUNS[0], conclusion: 'failure' }] })).includes('✕'));
assert.ok(duz(depoSeritHtml({ ...d, ci: [{ ...RUNS[0], status: 'in_progress', conclusion: '' }] })).includes('…'));
t = duz(depoSeritHtml(d3));
assert.ok(t.includes('—') && !t.includes('null') && !t.includes('undefined'), 'etiket yoksa —');
assert.equal(depoSeritHtml(null), '');
assert.equal(depoSeritHtml({ var: false }), '');

// çizim: sekme içeriği
h = depoHtml(d);
t = duz(h);
for (const b of ['Yayımlanmamış', 'GitHub Actions', 'Yerel', 'Son K']) assert.ok(t.includes(b), `${b} bölümü yok`);
assert.ok(t.includes('2b6b6f0') && t.includes('önce'), 'kısa hash ve göreli tarih');
assert.ok(t.includes('plugins/a/A.java'));
assert.ok(h.includes('href="https://github.com/o/r/actions/runs/1"') && h.includes('rel="noopener"'));
assert.ok(!h.includes('<b>x</b>'), 'commit mesajı ve koşu başlığı kaçışlanmalı');
assert.ok(duz(depoHtml(d2)).includes('GitHub\'a ulaşılamadı'), 'gh hatası görünür');
assert.ok(!depoHtml(d3).includes('undefined') && !depoHtml(d3).includes('null'));
assert.equal(depoHtml(null), '');

// telemetri: proje dizinine süzme (düz önek değil)
const td = mkdtempSync(join(tmpdir(), 'depo-tel-'));
const dbYol = join(td, 'opencode.db');
const db = new DatabaseSync(dbYol);
db.exec('create table session (id text primary key, directory text not null)');
db.exec('create table message (id text primary key, session_id text, time_created integer, time_updated integer, data text)');
const oturum = (id, dir) => db.prepare('insert into session values (?,?)').run(id, dir);
oturum('s1', '/a/proje'); oturum('s2', '/a/proje-duman'); oturum('s3', '/a/proje/alt'); oturum('s4', '/b');
let i = 0;
for (const s of ['s1', 's2', 's3', 's4']) {
  db.prepare('insert into message values (?,?,?,?,?)').run('m' + i++, s, 1, 1, JSON.stringify({
    role: 'assistant', providerID: 'opencode', modelID: 'x', cost: 0,
    tokens: { input: 100, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
  }));
}
db.close();
const tp = telemetri(dbYol, null, '/a/proje');
assert.equal(tp.toplam.mesaj, 2, 'yalnız /a/proje ve altı; /a/proje-duman sayılmaz');
assert.equal(tp.kapsam, 'proje');
const tt = telemetri(dbYol, null);
assert.equal(tt.toplam.mesaj, 4);
assert.equal(tt.kapsam, 'tum');
assert.ok(duz(telemetriHtml(tp)).includes('bu proje'));
assert.ok(duz(telemetriHtml(tt)).includes('tüm projeler'));
// session tablosu olmayan eski veritabanı: süzülemez, tümü sayılır ve öyle etiketlenir
const eski = join(td, 'eski.db');
const db2 = new DatabaseSync(eski);
db2.exec('create table message (id text primary key, session_id text, time_created integer, time_updated integer, data text)');
db2.prepare('insert into message values (?,?,?,?,?)').run('m', 's', 1, 1, JSON.stringify({ role: 'assistant', providerID: 'p', modelID: 'm', tokens: { input: 1 } }));
db2.close();
const te = telemetri(eski, null, '/a/proje');
assert.equal(te.var, true);
assert.equal(te.kapsam, 'tum');

// sunucu: depo anlık görüntüde; git deposu olmayan dizinde var:false; sahte çalıştırıcıyla dolu
const p = mkdtempSync(join(tmpdir(), 'depo-p-'));
writeFileSync(join(p, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
let s = await baslat(p, 0);
let api = await (await fetch(`http://127.0.0.1:${s.port}/api/durum`)).json();
assert.equal(api.depo?.var, false, 'git deposu değil');
const sayfa = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
await s.kapat();
const c5 = sahte();
s = await baslat(p, 0, { calistir: c5 });
api = await (await fetch(`http://127.0.0.1:${s.port}/api/durum`)).json();
await s.kapat();
assert.equal(api.depo.surum, 'v0.3.6', 'ilk yanıtta depo hazır');
assert.ok(Array.isArray(api.plan?.kategoriler), 'mevcut alanlar korunur');

// sayfa: Depo sekmesi ilk sırada, şerit ve çizim bağlı
assert.ok(sayfa.includes('depoSeritHtml') && sayfa.includes('depoHtml'));
assert.ok(sayfa.includes('id="depo-serit"'));
const sekmeSirasi = [...sayfa.matchAll(/data-sekme="(\w+)"/g)].map((m) => m[1]);
assert.equal(sekmeSirasi[0], 'depo', 'Depo ilk sekme');
const i0 = sayfa.indexOf('id="sekme-depo"');
assert.ok(i0 > 0 && sayfa.indexOf('id="depo"', i0) > i0, 'Depo paneli #depo içerir');
assert.ok(/role="tab"[^>]*data-sekme="depo"|data-sekme="depo"[^>]*role="tab"/.test(sayfa));
console.log('depo.test ok');
