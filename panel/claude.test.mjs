// Kapı: Claude harcaması (Claude Code oturum dosyalarından). Kullanım: node panel/claude.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { claudeKullanim } from './claude.mjs';
import { claudeHtml, kpiHtml } from './ciz.mjs';
import { snapshot } from './durum.mjs';
import { baslat } from './sunucu.mjs';

const kok = mkdtempSync(join(tmpdir(), 'claude-'));
const proje = '/w/proje';
const satir = (o) => JSON.stringify({ type: 'assistant', timestamp: '2026-10-18T10:00:00.000Z', cwd: proje, isSidechain: false, ...o });
const msg = (id, model, u, extra = {}) => satir({ ...extra, message: { id, model, usage: { input_tokens: u[0], output_tokens: u[1], cache_read_input_tokens: u[2], cache_creation_input_tokens: u[3] } } });
const yaz = (yol, satirlar) => { mkdirSync(join(yol, '..'), { recursive: true }); writeFileSync(yol, satirlar.join('\n') + '\n'); };

const ana = join(kok, '-w-proje', 's1.jsonl');
yaz(ana, [
  msg('m1', 'claude-sonnet-5-5', [1e6, 100, 0, 0]),                    // aynı id iki satır (içerik bloğu başına): bir kez sayılır, çıkış büyük olan
  msg('m1', 'claude-sonnet-5-5', [1e6, 500000, 2e6, 1e6]),
  msg('m2', 'claude-sonnet-5-5', [0, 0, 0, 0], { cwd: '/baska/yer' }),   // proje dışı: sayılmaz
  msg('m3', '<synthetic>', [5, 5, 5, 5]),                               // sentetik: sayılmaz
  JSON.stringify({ type: 'user', cwd: proje, message: { usage: { input_tokens: 9e9 } } }), // asistan değil
  msg('m4', 'claude-sonnet-5-5', [1, 1, 1, 1], { cwd: proje + '/panel' }), // alt dizin: sayılır
  '{bozuk',
]);
yaz(join(kok, '-w-proje', 's1', 'subagents', 'agent-a.jsonl'), [
  msg('a1', 'claude-opus-5-5', [1e6, 1e6, 0, 0], { isSidechain: true, timestamp: '2026-10-19T10:00:00.000Z' }),
]);
const fiyat = { claude: { 'claude-sonnet-5-5': { giris: 2, cikis: 10, cacheOkuma: 0.2, cacheYazma: 2.5 } } };

const once = readFileSync(ana); const mt = statSync(ana).mtimeMs;
const c = claudeKullanim(proje, fiyat, kok);
assert.equal(c.var, true);
const m = (ad) => c.modeller.find((x) => x.model === ad);
const s = m('claude-sonnet-5-5');
assert.deepEqual([s.mesaj, s.giris, s.cikis, s.cacheOkuma, s.cacheYazma], [2, 1e6 + 1, 500001, 2e6 + 1, 1e6 + 1], 'id başına tek sayım (çıkışı büyük olan), proje dışı/sentetik/kullanıcı hariç');
assert.equal(s.toplam, s.giris + s.cikis + s.cacheOkuma + s.cacheYazma);
// maliyet = (giriş·2 + çıkış·10 + okuma·0.2 + yazma·2.5)/1e6 = 2.000002 + 5.00001 + 0.4000002 + 2.5000025
assert.ok(Math.abs(s.maliyet - (2.000002 + 5.00001 + 0.4000002 + 2.5000025)) < 1e-6, `maliyet ${s.maliyet}`);
const o = m('claude-opus-5-5');
assert.equal(o.mesaj, 1); assert.equal(o.maliyet, null, 'fiyatı olmayan modele maliyet uydurulmaz');
assert.deepEqual(c.toplam.fiyatsiz, ['claude-opus-5-5']);
assert.ok(Math.abs(c.toplam.maliyet - s.maliyet) < 1e-9, 'toplam maliyet yalnız fiyatı bilinenler (alt sınır)');
assert.equal(c.toplam.mesaj, 3);
assert.equal(c.toplam.toplam, s.toplam + o.toplam);
assert.equal(c.toplam.altajan, o.toplam, 'alt ajan (kodcu) token ayrı toplanır');
assert.equal(c.toplam.ana, s.toplam);
assert.deepEqual([c.ilk, c.son], ['2026-10-18', '2026-10-19'], 'kapsanan tarih aralığı (Claude Code ~30 gün saklar)');
assert.deepEqual(c.modeller.map((x) => x.model), ['claude-opus-5-5', 'claude-sonnet-5-5'], 'toplam token azalan');
assert.equal(claudeKullanim(proje, null, kok).toplam.maliyet, null, 'hiç fiyat yoksa toplam maliyet null (0 değil)');
// salt-okunur, ikinci çağrı aynı sonuç (önbellek)
assert.deepEqual(claudeKullanim(proje, fiyat, kok), c);
assert.ok(readFileSync(ana).equals(once) && statSync(ana).mtimeMs === mt, 'oturum dosyasına yazılmamalı');
// dosya büyüyünce önbellek yenilenir
writeFileSync(ana, readFileSync(ana, 'utf8') + msg('m5', 'claude-sonnet-5-5', [10, 0, 0, 0]) + '\n');
assert.equal(claudeKullanim(proje, fiyat, kok).toplam.mesaj, 4);
// bozuk girdiler
assert.deepEqual(claudeKullanim(proje, fiyat, join(kok, 'yok')), { var: false, modeller: [], toplam: null, ilk: null, son: null });
assert.equal(claudeKullanim('/hic/yok', fiyat, kok).var, false, 'bu projeye ait mesaj yoksa veri yok');

// çizim
const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const h = claudeHtml(claudeKullanim(proje, fiyat, kok));
const t = duz(h);
assert.ok(t.includes('Claude harcaması') && t.includes('tahmin') && t.includes('API karşılığı'), 'kart "tahmin / API karşılığı" etiketli');
assert.ok(t.includes('claude-opus-5-5') && t.includes('fiyat yok') && t.includes('en az'), 'fiyatsız model ve alt sınır uyarısı');
assert.ok(t.includes('alt ajan') && t.includes('2026-10-18'), 'alt ajan payı ve tarih aralığı');
assert.ok(t.includes('abonelik') , 'abonelikteyse gerçek fatura farklı olabilir notu');
assert.ok(!h.includes('undefined') && !h.includes('NaN') && !h.includes('null'));
assert.ok(duz(claudeHtml(null)).includes('Claude oturum verisi bulunamadı'));
assert.ok(!claudeHtml({ ...c, modeller: [{ ...s, model: '<b>x</b>' }] }).includes('<b>x</b>'));
// KPI: beşinci kutu
const k = kpiHtml({ plan: null, gecmis: [], modeller: [], telemetri: null, claude: c });
assert.ok(k.includes('id="kpi-claude"') && /~\$\s?9[.,]\d+/.test(duz(k)) && duz(k).includes('en az'), duz(k));
assert.ok(duz(kpiHtml({ plan: null, gecmis: [], modeller: [], telemetri: null, claude: null })).includes('—'));
assert.ok(kpiHtml(null).includes('id="kpi-claude"'));

// snapshot + sayfa
const p = mkdtempSync(join(tmpdir(), 'claude-p-'));
writeFileSync(join(p, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const yok = join(p, 'yok');
process.env.CLAUDE_PROJECTS = yok;
assert.equal(snapshot(p).claude.var, false);
const pk = join(kok, '-p'); yaz(join(pk, 's.jsonl'), [msg('z1', 'claude-sonnet-5-5', [1000, 1000, 0, 0], { cwd: p })]);
process.env.CLAUDE_PROJECTS = kok;
writeFileSync(join(p, 'fiyat.json'), JSON.stringify(fiyat));
const sn = snapshot(p);
assert.equal(sn.claude.var, true); assert.equal(sn.claude.toplam.mesaj, 1, 'proje dizini = snapshot dizini');
const sv = await baslat(p, 0);
const sayfa = await (await fetch(`http://127.0.0.1:${sv.port}/`)).text();
await sv.kapat();
assert.ok(sayfa.includes('id="claude"') && sayfa.includes('claudeHtml'));
assert.ok(/id="sekme-modeller"[\s\S]*id="claude"[\s\S]*id="sekme-etki"/.test(sayfa), 'Claude bölümü Modeller sekmesinde');
console.log('claude.test ok');
