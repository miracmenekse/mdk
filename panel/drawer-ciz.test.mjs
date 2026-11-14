// Adım 96 kapısı: drawerHtml(adim, etkiKartiHtml)
// Adım detay drawer'ı: başlık (ADIM no + ad + kapat), durum satırı, ilerleme,
// PERSONA DÜŞÜNCELERİ (boş #drawer-persona kabı), ETKİ (etkiKartiHtml ya da "etki yok").
import assert from 'node:assert/strict';
import { drawerHtml } from './ciz.mjs';

// çalışan adım + etki kartı (form.karar içeren)
const etkiHtml = '<div class="etki-kart"><form class="karar" data-no="92"><button name="tur" value="onay">Onayla</button></form></div>';
const h1 = drawerHtml(
  { no: 92, baslik: 'Panelde ön regresyon durumu', durum: 'calisiyor', model: 'opencode-go/glm-5.3-flash', deneme: 2, ts: 1793530000, yuzde: 55, calisiyor: true, simdiMs: 1793530000000 + 723000 },
  etkiHtml,
);
assert.ok(h1.includes('STORY') && h1.includes('92'), 'başlıkta STORY no');
assert.ok(h1.includes('Panelde ön regresyon durumu'), 'adım adı');
assert.ok(h1.includes('id="drawer-kapat"'), 'kapat düğmesi');
assert.ok(h1.includes('PERSONA DÜŞÜNCELERİ'), 'persona bölüm başlığı');
assert.ok(h1.includes('<div id="drawer-persona"></div>'), 'boş persona kabı (lazy dolacak)');
assert.ok(h1.includes('ETKİ'), 'etki bölüm başlığı');
assert.ok(h1.includes('form class="karar"'), 'etki kartı (karar formuyla) gömülmeli');
assert.ok(h1.includes('rozet') && h1.includes('çalışıyor'), 'durum rozeti');
assert.ok(h1.includes('opencode-go/glm-5.3-flash'), 'model');
assert.ok(/12 dk 3 sn/.test(h1), 'çalışan adımda geçen süre (12 dk 3 sn)');
assert.ok(h1.includes('55'), 'ilerleme yüzdesi');

// etkisiz, biten adım → "etki yok", karar formu yok
const h2 = drawerHtml({ no: 93, baslik: 'Dar ekran düzeni', durum: 'bekliyor', model: null, deneme: null, ts: null, yuzde: 0, calisiyor: false }, null);
assert.ok(h2.includes('etki yok'), 'etkisiz adımda "etki yok"');
assert.ok(!h2.includes('form class="karar"'), 'etkisiz adımda karar formu olmamalı');
assert.ok(h2.includes('93') && h2.includes('Dar ekran düzeni'), 'etkisiz adım başlığı');

// XSS: adım adı kaçışlanır
const h3 = drawerHtml({ no: 1, baslik: '<script>x</script>', durum: 'bitti', yuzde: 100 }, null);
assert.ok(!h3.includes('<script>x</script>'), 'adım adı kaçışlanmalı');

console.log('drawer-ciz.test ok');
