// Adım 179 kapısı: hazır profiller (ucretsiz/karma/go) + tek istekle uygulama.
// PROFILLER, profilUygula, etkinProfil, profilOzeti (panel/profil.mjs);
// POST /api/profil (panel/sunucu.mjs) ve snapshot().profiller (panel/durum.mjs).
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PROFILLER, profilUygula, etkinProfil, profilOzeti } from './profil.mjs';
import { baslat } from './sunucu.mjs';
import { snapshot } from './durum.mjs';

// Görev satırlarını tür → model dizisi olarak okur (dosya sırasına göre değil).
const gorevOku = (metin) => {
  const sonuc = {};
  for (const s of metin.split('\n')) {
    const m = s.match(/^Görev\s+([^:]+):\s*(.*)$/);
    if (m) sonuc[m[1].trim()] = m[2].split(',').map((x) => x.trim()).filter(Boolean);
  }
  return sonuc;
};

// (1) PROFILLER yapısı ------------------------------------------------------
assert.deepEqual(PROFILLER.map((p) => p.ad), ['ucretsiz', 'karma', 'go'], 'üç profil ve bu sırayla olmalı');
const ucretsiz = PROFILLER.find((p) => p.ad === 'ucretsiz');
const karma = PROFILLER.find((p) => p.ad === 'karma');
const go = PROFILLER.find((p) => p.ad === 'go');
for (const p of PROFILLER) {
  for (const t of ['kod', 'kapi', 'eskale', 'hakem']) {
    assert.ok(Array.isArray(p.gorevler[t]) && p.gorevler[t].length > 0, `${p.ad} profilinde ${t} dolu olmalı`);
  }
}
for (const liste of Object.values(ucretsiz.gorevler)) {
  for (const m of liste) assert.ok(!m.startsWith('opencode-go/'), 'ucretsiz profilde abonelik modeli olmamalı');
}
assert.equal(go.gorevler.kod[0], 'opencode-go/kimi-k3', 'go kod ilk modeli kimi-k3 olmalı');
assert.deepEqual(karma.gorevler.kod, ucretsiz.gorevler.kod, 'karma kod listesi ucretsiz ile aynı olmalı');
assert.equal(karma.gorevler.eskale[0], 'opencode-go/kimi-k3', 'karma eskale ilk modeli kimi-k3 olmalı');

// (2) profilUygula: değiştirme + ekleme + geri kalan koruma -----------------
const fikstur = [
  '# MDK',
  'Yürütücü: opencode',
  'Modeller: x/1',
  'Görev kod: x/1',
  'Görev kapi: x/2',
  '',
  'Bütçe: 300000',
  'Kurallar: ...',
  '## K',
  '- [ ] 1. Bir iş',
  '  - Kapı: `true`',
].join('\n');

const fSatirlar = fikstur.split('\n');
const kodIdx = fSatirlar.findIndex((s) => s.startsWith('Görev kod'));
const kapiIdx = fSatirlar.findIndex((s) => s.startsWith('Görev kapi'));
assert.equal(kapiIdx, kodIdx + 1, 'fikstürde kod ve kapi satırları ardışık olmalı');

const uygulanan = profilUygula(fikstur, 'go');
const uySatirlar = uygulanan.split('\n');
assert.equal(uySatirlar[kodIdx], 'Görev kod: opencode-go/kimi-k3, opencode-go/qwen3.8-max, opencode/deepseek-v4.1-flash-free', 'Görev kod go modelleriyle değişmeli');
assert.equal(uySatirlar[kapiIdx], 'Görev kapi: opencode-go/deepseek-v4-pro, opencode/beam-free', 'Görev kapi go modelleriyle değişmeli');
assert.deepEqual(gorevOku(uygulanan), go.gorevler, 'tüm türler go profiliyle birebir eşleşmeli');

// eksik türler kapi satırının hemen altına eklenmeli
const eksik = Object.keys(go.gorevler).filter((t) => t !== 'kod' && t !== 'kapi');
for (let i = 0; i < eksik.length; i++) {
  assert.ok(/^Görev\s/.test(uySatirlar[kapiIdx + 1 + i]), 'kapi altına yeni görev satırı eklenmeli');
}
assert.equal(uySatirlar[kapiIdx + 1 + eksik.length], fSatirlar[kapiIdx + 1], 'ekleme sonrası orijinal satırlar aynen devam etmeli');
// Görev ile başlamayan satırlar aynı sırada, bayt bayt aynı
const gorevOlmayan = (metin) => metin.split('\n').filter((s) => !/^Görev\s/.test(s));
assert.deepEqual(gorevOlmayan(uygulanan), gorevOlmayan(fikstur), 'Görev olmayan satırlar aynı sırada ve bayt bayt aynı olmalı');

// (3) etkinProfil -----------------------------------------------------------
assert.equal(etkinProfil(profilUygula(fikstur, 'go')), 'go', 'uygulanan profil etkin sayılmalı');
const bozulmus = profilUygula(fikstur, 'go').replace(/^Görev kod:.*$/m, 'Görev kod: opencode/beam-free');
assert.equal(etkinProfil(bozulmus), null, 'elle değişiklikte etkin profil olmamalı');
assert.equal(etkinProfil(profilUygula(fikstur, 'ucretsiz')), 'ucretsiz', 'ucretsiz karma ile karışmamalı');
assert.equal(etkinProfil(profilUygula(fikstur, 'karma')), 'karma', 'karma kendisiyle eşleşmeli');

// (4) profilUygula hataları -------------------------------------------------
assert.throws(() => profilUygula(fikstur, 'yok'), Error, 'bilinmeyen profil atmalı');
assert.throws(() => profilUygula('# MDK\n\n## K\n- [ ] 1. İş\n', 'go'), Error, 'Görev ve Modeller satırı yoksa atmalı');

// sınır: Görev yok ama Modeller var → Modeller altına eklenir
const sade = 'Yürütücü: opencode\nModeller: x/1\n';
const sadeUygulanan = profilUygula(sade, 'ucretsiz');
const sadeSatirlar = sadeUygulanan.split('\n');
assert.equal(sadeSatirlar[1], 'Modeller: x/1', 'Modeller satırı değişmemeli');
assert.ok(/^Görev\s/.test(sadeSatirlar[2]), 'Görev satırları Modeller altına eklenmeli');
assert.deepEqual(gorevOku(sadeUygulanan), ucretsiz.gorevler, 'Modeller altına ucretsiz türleri eklenmeli');

// (5) eşgüçlülük ------------------------------------------------------------
const bir = profilUygula(fikstur, 'go');
assert.equal(profilUygula(bir, 'go'), bir, 'aynı profili iki kez uygulamak aynı metni vermeli');

// (6) profilOzeti -----------------------------------------------------------
const ozet = profilOzeti(profilUygula(fikstur, 'go'));
assert.equal(ozet.length, 3, 'özet üç öğe olmalı');
assert.deepEqual(ozet.map((o) => o.ad), ['ucretsiz', 'karma', 'go'], 'özet adları üç profil olmalı');
for (const o of ozet) {
  assert.ok(typeof o.baslik === 'string' && o.baslik.length > 0, 'özet başlığı dolu olmalı');
  assert.ok(typeof o.aciklama === 'string' && o.aciklama.length > 0, 'özet açıklaması dolu olmalı');
}
assert.equal(ozet.filter((o) => o.etkin).length, 1, 'tam biri etkin olmalı');
assert.equal(ozet.find((o) => o.etkin).ad, 'go', 'etkin olan go olmalı');
assert.equal(profilOzeti(fikstur).filter((o) => o.etkin).length, 0, 'eşleşme yoksa hiçbiri etkin olmamalı');

// (7) sunucu: POST /api/profil ----------------------------------------------
const d = mkdtempSync(join(tmpdir(), 'profil-srv-'));
writeFileSync(join(d, 'PLAN.md'), fikstur);
const s = await baslat(d, 0);
const kok = `http://127.0.0.1:${s.port}`;

let r = await fetch(`${kok}/api/profil`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ad: 'karma' }),
});
assert.equal(r.status, 200, 'geçerli profil 200 olmalı');
const j = await r.json();
assert.equal(j.tamam, true, 'yanıt tamam:true olmalı');
assert.equal(j.etkin, 'karma', 'yanıt etkin:karma olmalı');
assert.equal(etkinProfil(readFileSync(join(d, 'PLAN.md'), 'utf8')), 'karma', 'dosyaya karma uygulanmalı');

const once = readFileSync(join(d, 'PLAN.md'), 'utf8');
r = await fetch(`${kok}/api/profil`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ad: 'x' }),
});
assert.equal(r.status, 400, 'bilinmeyen profil 400 olmalı');
assert.ok((await r.json()).hata, 'hata alanı dönmeli');
assert.equal(readFileSync(join(d, 'PLAN.md'), 'utf8'), once, 'hatada dosya değişmemeli');

r = await fetch(`${kok}/api/profil`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ad: 'karma', ek: 'x'.repeat(3000) }),
});
assert.equal(r.status, 413, '2 KB üstü gövde 413 olmalı');
assert.equal(readFileSync(join(d, 'PLAN.md'), 'utf8'), once, '413\'te dosya değişmemeli');

await s.kapat();

const d2 = mkdtempSync(join(tmpdir(), 'profil-srv2-'));
const s2 = await baslat(d2, 0);
r = await fetch(`http://127.0.0.1:${s2.port}/api/profil`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ad: 'karma' }),
});
assert.equal(r.status, 404, 'PLAN.md yokken 404 olmalı');
await s2.kapat();

// (8) snapshot().profiller ---------------------------------------------------
const d3 = mkdtempSync(join(tmpdir(), 'profil-durum-'));
writeFileSync(join(d3, 'PLAN.md'), profilUygula(fikstur, 'karma'));
const snap = snapshot(d3);
assert.equal(snap.profiller.length, 3, 'snapshot üç profil vermeli');
assert.equal(snap.profiller.filter((p) => p.etkin).length, 1, 'tam biri etkin olmalı');
assert.equal(snap.profiller.find((p) => p.etkin).ad, 'karma', 'etkin olan karma olmalı');

const d4 = mkdtempSync(join(tmpdir(), 'profil-durum2-'));
assert.deepEqual(snapshot(d4).profiller, [], 'PLAN yoksa profiller boş liste olmalı');

console.log('profil.test ok');
