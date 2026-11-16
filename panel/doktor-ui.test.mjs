// Kapı (adım 201): Panelde ilk açılış kurulum sihirbazı (/api/doktor ve kurulum kartı)
// Kullanım: node panel/doktor-ui.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doktorHtml } from './ciz.mjs';
import { baslat } from './sunucu.mjs';

// (1) tamam: true durumu
// (a) zorlaGoster = false (varsayılan): tamamken sihirbaz gizlenir, boş dizge döner
const tamamRapor = {
  tamam: true,
  araclar: [
    { ad: 'node', baslik: 'Node.js', zorunlu: true, kurulu: true, surum: 'v22.0.0' },
    { ad: 'git', baslik: 'Git', zorunlu: true, kurulu: true, surum: 'git version 2.40.0' },
  ],
};
assert.equal(doktorHtml(tamamRapor), '', 'tamamken sihirbaz boş dönmeli (gizlenmeli)');
assert.equal(doktorHtml(tamamRapor, false), '', 'zorlaGoster false iken boş dönmeli');

// (b) zorlaGoster = true: tamamken bile kart gösterilir ('Kurulum hazır' başlığı)
const hTamamZorla = doktorHtml(tamamRapor, true);
assert.ok(hTamamZorla.includes('Kurulum hazır'), 'zorlaGoster true iken "Kurulum hazır" içermeli');
assert.ok(hTamamZorla.includes('doktor-sihirbaz'), 'kart doktor-sihirbaz sınıfı içermeli');
assert.ok(hTamamZorla.includes('id="doktor-yenile"'), 'yenileme düğmesi içermeli');

// (2) tamam: false durumu (eksik araç var, kaçış, satır sınıfları ve işaretler)
const eksikRapor = {
  tamam: false,
  araclar: [
    { ad: 'git', baslik: 'Git <x>', zorunlu: true, kurulu: false, oneri: 'Git kur' },
    { ad: 'node', baslik: 'Node', zorunlu: true, kurulu: true, surum: 'v22' },
  ],
};
const hEksik = doktorHtml(eksikRapor);
assert.ok(hEksik.includes('Kurulum sihirbazı'), '"Kurulum sihirbazı" başlığı içermeli');
assert.ok(hEksik.includes('Git &lt;x&gt;'), 'HTML kaçışlanmalı (&lt;x&gt;)');
assert.ok(!hEksik.includes('Git <x>'), 'ham HTML tag içermemeli');
assert.ok(hEksik.includes('Git kur'), 'öneri metni içermeli');
assert.ok(hEksik.includes('v22'), 'kurulu sürüm içermeli');
assert.ok(hEksik.includes('id="doktor-yenile"'), 'id="doktor-yenile" butonu içermeli');

// Satır sınıfları kontrolü
const eksikSatirlar = [...hEksik.matchAll(/class="[^"]*doktor-satir[^"]*eksik[^"]*"/g)];
const kuruluSatirlar = [...hEksik.matchAll(/class="[^"]*doktor-satir[^"]*kurulu[^"]*"/g)];
assert.equal(eksikSatirlar.length, 1, 'tam bir .doktor-satir.eksik olmalı');
assert.equal(kuruluSatirlar.length, 1, 'tam bir .doktor-satir.kurulu olmalı');
assert.ok(hEksik.includes('✓'), 'kurulu araç için ✓ işareti olmalı');
assert.ok(hEksik.includes('✗'), 'eksik araç için ✗ işareti olmalı');

// İsteğe bağlı kurulu olmayan araç kontrolü (.doktor-satir.istege-bagli)
const karmaRapor = {
  tamam: false,
  araclar: [
    { ad: 'gh', baslik: 'GitHub CLI', zorunlu: false, kurulu: false, oneri: 'gh kur' },
  ],
};
const hKarma = doktorHtml(karmaRapor);
const istegeBagliSatirlar = [...hKarma.matchAll(/class="[^"]*doktor-satir[^"]*istege-bagli[^"]*"/g)];
assert.equal(istegeBagliSatirlar.length, 1, 'isteğe bağlı araç için .doktor-satir.istege-bagli sınıfı olmalı');

// (3) Sınır durumları: boş / null / tanımsız girdi
assert.equal(doktorHtml(null), '', 'null girdide boş dizge dönmeli');
assert.equal(doktorHtml(undefined), '', 'undefined girdide boş dizge dönmeli');
assert.equal(doktorHtml(), '', 'parametresiz çağrıda boş dizge dönmeli');

// (4) Sunucu testi: baslat(geciciKok, 0) ile GET /api/doktor
const geciciKok = mkdtempSync(join(tmpdir(), 'doktor-ui-'));
writeFileSync(join(geciciKok, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `node -e "0"`\n');
const s = await baslat(geciciKok, 0);
try {
  const r = await fetch(`http://127.0.0.1:${s.port}/api/doktor`);
  assert.equal(r.status, 200, 'GET /api/doktor 200 dönmeli');
  const ct = r.headers.get('content-type') || '';
  assert.ok(ct.includes('application/json'), 'content-type application/json olmalı');
  const j = await r.json();
  assert.equal(typeof j.tamam, 'boolean', 'tamam boolean olmalı');
  assert.ok(Array.isArray(j.araclar), 'araclar dizi olmalı');
  assert.equal(j.araclar.length, 4, 'mdk-doktor standart 4 araç raporlamalı');
  for (const a of j.araclar) {
    assert.ok(typeof a.ad === 'string' && a.ad.length > 0, 'araç ad bilgisi olmalı');
    assert.ok(typeof a.baslik === 'string' && a.baslik.length > 0, 'araç baslik bilgisi olmalı');
    assert.equal(typeof a.zorunlu, 'boolean', 'zorunlu boolean olmalı');
    assert.equal(typeof a.kurulu, 'boolean', 'kurulu boolean olmalı');
  }
} finally {
  await s.kapat();
}

// (5) panel/index.html bağlantıları
const sayfa = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(sayfa.includes('id="doktor-seridi"'), 'index.html id="doktor-seridi" içermeli');
assert.ok(sayfa.includes('/api/doktor'), 'index.html /api/doktor çağrısı içermeli');
assert.match(sayfa, /import\s*\{[^}]*doktorHtml[^}]*\}\s*from\s*['"]\/ciz\.mjs['"]/, 'doktorHtml /ciz.mjs içinden içe aktarılmalı');

console.log('doktor-ui.test ok');
