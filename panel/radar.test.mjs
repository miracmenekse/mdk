import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';
import { kpiHtml, radarHtml } from './ciz.mjs';

const simdiMs = 1_700_000_000_000;
const tsSon = simdiMs - 5 * 60 * 1000;

const adaylar = [
  { repo: 'a/one', grup: 'g1', yildiz: 10, lisans: 'MIT', son: '2026-01-01', aciklama: 'desc1' },
  { repo: 'b/two', grup: 'g2', yildiz: 20, lisans: 'Apache-2.0', son: '2026-02-02', aciklama: 'desc2' },
  { repo: 'c/three', grup: 'g<script>', yildiz: 30, lisans: 'NOASSERTION', son: '2026-03-03', aciklama: 'desc3' },
];

const degisenler3 = [
  { repo: 'a/one', tur: 'yeni', not: 'Cümle bir' },
  { repo: 'b/two', tur: 'sicradi', fark: '+5 yıldız (%50)', not: 'Cümle iki' },
  { repo: 'c/three', tur: 'durdu', fark: '10 gündür güncellenmedi', not: 'Cümle üç' },
];

// 1) sonuc null
{
  const h = radarHtml({ sonuc: null, isaretler: {} }, simdiMs);
  assert.ok(h.includes('<div class="radar bos">Henüz tarama yok</div>'), 'boş durum metni yok');
}

// 2) 3 değişen
{
  const sonuc = { ts: tsSon, ilk: false, adaylar, degisenler: degisenler3, sonHata: null };
  const h = radarHtml({ sonuc, isaretler: {} }, simdiMs);
  assert.match(h, /Bu hafta · 3 değişiklik/, 'başlık sayısı yanlış');
  assert.equal((h.match(/class="radar-satir"/g) || []).length, 3, 'radar-satir sayısı yanlış');
  assert.ok(h.includes('yeni') && h.includes('sıçradı') && h.includes('durdu'), 'tür rozet metni yok');
  assert.ok(h.includes('Senin için: Cümle bir'), 'Senin için cümlesi yok');
  assert.ok(h.includes('Senin için: Cümle iki'), 'Senin için cümlesi yok');
  assert.ok(h.includes('Senin için: Cümle üç'), 'Senin için cümlesi yok');
  assert.ok(h.includes('<span class="kaynak">kaynak: GitHub API</span>'), 'kaynak damgası yok');
  assert.ok(h.includes('★ 10'), 'yıldız yok');
  assert.ok(h.includes('MIT'), 'lisans yok');
  assert.ok(h.includes('2026-01-01'), 'son tarih yok');
  assert.ok(h.includes('+5 yıldız (%50)'), 'fark yok');
  assert.ok(h.includes('10 gündür güncellenmedi'), 'fark yok');
  assert.ok(h.includes('https://github.com/a/one'), 'GitHub bağlantısı yok');
  assert.ok(/target=["']?_blank["']?/.test(h), 'target yok');
  assert.ok(h.includes('rel="noopener noreferrer"'), 'rel yok');
  assert.ok(h.includes('son tarama: 5 dk önce'), 'göreli tarih yok');
}

// 3) biri işaretli
{
  const sonuc = { ts: tsSon, ilk: false, adaylar, degisenler: degisenler3, sonHata: null };
  const veri = { sonuc, isaretler: { 'b/two': { isaret: 'izle', ts: simdiMs, tarama: sonuc.ts } } };
  const h = radarHtml(veri, simdiMs);
  assert.match(h, /Bu hafta · 2 değişiklik/, 'işaretli çıkarılmalı');
  assert.equal((h.match(/class="radar-satir"/g) || []).length, 2, 'şerit sayısı yanlış');
  assert.ok(!h.includes('<details class="radar-satir" data-repo="b/two">'), 'işaretli şeritte olmamalı');
  const izl = h.slice(h.indexOf('radar-izlenen'));
  assert.ok(izl.includes('b/two'), 'işaretli İzlenenlerde olmalı');
}

// 4) sakin
{
  const sonuc = { ts: tsSon, ilk: false, adaylar, degisenler: [], sonHata: null };
  const h = radarHtml({ sonuc, isaretler: {} }, simdiMs);
  assert.ok(h.includes('Bu hafta sakin'), 'sakin metni yok');
}

// 5) ilk tarama
{
  const sonuc = { ts: tsSon, ilk: true, adaylar, degisenler: [], sonHata: null };
  const h = radarHtml({ sonuc, isaretler: {} }, simdiMs);
  assert.match(h, /İlk tarama yapıldı · 3 aday izleniyor/, 'ilk tarama metni yok');
}

// 6) sonHata
{
  const sonuc = {
    ts: tsSon, ilk: false, adaylar,
    degisenler: [degisenler3[0], degisenler3[1]],
    sonHata: { ts: simdiMs - 2 * 60 * 60 * 1000, ileti: 'ağ hatası' },
  };
  const h = radarHtml({ sonuc, isaretler: {} }, simdiMs);
  assert.ok(h.includes('Son tarama başarısız'), 'hata metni yok');
  assert.equal((h.match(/class="radar-satir"/g) || []).length, 2, 'adaylar listelenmeli');
}

// 7) not null
{
  const sonuc = {
    ts: tsSon, ilk: false,
    adaylar: [{ repo: 'd/four', grup: 'g', yildiz: 5, lisans: 'MIT', son: '2026-04-04', aciklama: 'd' }],
    degisenler: [{ repo: 'd/four', tur: 'durdu', fark: '7 gündür güncellenmedi', not: null }],
    sonHata: null,
  };
  const h = radarHtml({ sonuc, isaretler: {} }, simdiMs);
  assert.ok(h.includes('7 gündür güncellenmedi'), 'fark görünmeli');
  assert.ok(!h.includes('Senin için'), 'Senin için olmamalı');
}

// 8) kaçış
{
  const sonuc = {
    ts: tsSon, ilk: false,
    adaylar: [{ repo: 'x/y', grup: 'g<script>', yildiz: 1, lisans: 'MIT', son: '2026-01-01', aciklama: '<script>alert(1)</script>' }],
    degisenler: [{ repo: 'x/y', tur: 'yeni', not: 'n' }],
    sonHata: null,
  };
  const h = radarHtml({ sonuc, isaretler: {} }, simdiMs);
  assert.ok(!h.includes('<script>'), 'ham script kaçışlanmamış');
  assert.ok(h.includes('&lt;script&gt;'), 'kaçışlı script yok');
}

// 9) sunucu
{
  const d = mkdtempSync(join(tmpdir(), 'radar-srv-'));
  writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
  const s = await baslat(d, 0);
  const kok = `http://127.0.0.1:${s.port}`;
  let r = await fetch(`${kok}/api/radar`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { sonuc: null, isaretler: {} });
  mkdirSync(join(d, 'strateji'), { recursive: true });
  const sonuc = { ts: tsSon, ilk: false, adaylar: [], degisenler: [], sonHata: null };
  writeFileSync(join(d, 'strateji', 'radar-sonuc.json'), JSON.stringify(sonuc));
  writeFileSync(join(d, 'strateji', 'radar-isaret.json'), JSON.stringify({ 'a/one': { isaret: 'izle', ts: simdiMs, tarama: sonuc.ts } }));
  r = await fetch(`${kok}/api/radar`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { sonuc, isaretler: { 'a/one': { isaret: 'izle', ts: simdiMs, tarama: sonuc.ts } } });
  await s.kapat();
}

// 10) kpi
{
  const snap = { plan: null, gecmis: [], modeller: [] };
  const radar = { sonuc: { degisenler: [{ repo: 'r1' }, { repo: 'r2' }], adaylar: [] }, isaretler: {} };
  const kpi = kpiHtml(snap, null, radar);
  const i = kpi.indexOf('data-sekme="arastirma"');
  assert.ok(i >= 0, 'Araştırma kartı yok');
  const card = kpi.slice(i, kpi.indexOf('</button>', i));
  assert.ok(card.includes('2'), 'değer 2 olmalı');
  assert.ok(card.includes('bu hafta değişen'), 'alt yazı yanlış');
}

console.log('radar.test ok');
