// Adım 181 kapısı: yapılacaklar verisi ve kaydı.
// Saf işlevler (panel/yapilacak.mjs) ve POST /api/yapilacak + snapshot().yapilacaklar (sunucu, durum).
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { yapilacakOku, yapilacakEkle, yapilacakDurum, yapilacakTasi, yapilacakYaz } from './yapilacak.mjs';
import { baslat } from './sunucu.mjs';
import { snapshot } from './durum.mjs';
import { depo, commit, git, gecici } from '../test/yardim.mjs';

const TS = '2026-11-16T10:00:00.000Z';
const ids = (liste) => liste.map((o) => o.id);

// A. Saf işlevler ----------------------------------------------------------

// (1) boş listeye ekleme
const bos = [];
const bir = yapilacakEkle(bos, { baslik: '  Rapor yaz  ', not: 'aylık' }, TS);
assert.equal(bir.length, 1, 'bir öğe olmalı');
assert.equal(bir[0].id, 1, 'boş listede id 1 olmalı');
assert.equal(bir[0].durum, 'bekliyor', 'yeni öğe bekliyor olmalı');
assert.equal(bir[0].epic, null, 'yeni öğenin epic alanı null olmalı');
assert.equal(bir[0].baslik, 'Rapor yaz', 'başlık kırpılmış olmalı');
assert.ok(bir[0].ts, 'ts alanı dolu olmalı');
const iki = yapilacakEkle(bir, { baslik: 'İkinci iş' }, TS);
assert.equal(iki[1].id, 2, 'ikinci ekleme id 2 olmalı');
assert.equal(iki[iki.length - 1].baslik, 'İkinci iş', 'yeni öğe sonda olmalı');
assert.equal(bir.length, 1, 'girdi listesi değişmemeli (eklemede)');
assert.equal(bos.length, 0, 'boş girdi dizisi değişmemeli');

// (2) başlık ve not doğrulaması
assert.throws(() => yapilacakEkle([], { baslik: 'ab' }, TS), Error, '2 karakterlik başlık atmalı');
assert.throws(() => yapilacakEkle([], { baslik: '' }, TS), Error, 'boş başlık atmalı');
assert.throws(() => yapilacakEkle([], { baslik: 'a'.repeat(121) }, TS), Error, '121 karakterlik başlık atmalı');
assert.throws(() => yapilacakEkle([], { baslik: 'geçerli', not: 'n'.repeat(1001) }, TS), Error, '1001 karakterlik not atmalı');
assert.equal(yapilacakEkle([], { baslik: 'geçerli' }, TS)[0].not, '', 'not verilmezse boş metin olmalı');

// (3) id'ler 1 ve 5 iken yeni id 6
const bosluklu = [
  { id: 1, baslik: 'a', not: '', durum: 'bekliyor', epic: null, ts: TS },
  { id: 5, baslik: 'b', not: '', durum: 'bekliyor', epic: null, ts: TS },
];
assert.equal(yapilacakEkle(bosluklu, { baslik: 'yeni iş' }, TS).at(-1).id, 6, 'en büyük id + 1 olmalı');

// (4) durum değiştirme
const durumlu = yapilacakDurum(iki, 1, 'bitti');
assert.equal(durumlu.find((o) => o.id === 1).durum, 'bitti', 'id 1 bitti olmalı');
assert.equal(durumlu.find((o) => o.id === 2).durum, 'bekliyor', 'diğer öğeler değişmemeli');
assert.throws(() => yapilacakDurum(iki, 1, 'yok'), Error, 'geçersiz durum atmalı');
assert.throws(() => yapilacakDurum(iki, 99, 'bitti'), Error, 'olmayan id atmalı');

// (5) sıra değiştirme
const uc = [1, 2, 3].reduce((l, b) => yapilacakEkle(l, { baslik: `iş ${b}` }, TS), []);
assert.deepEqual(ids(yapilacakTasi(uc, 3, -1)), [1, 3, 2], 'üçüncü öğe yukarı taşınmalı');
assert.deepEqual(ids(yapilacakTasi(uc, 1, -1)), [1, 2, 3], 'ilk öğeyi yukarı taşımak sırayı değiştirmemeli');
assert.deepEqual(ids(yapilacakTasi(uc, 3, 1)), [1, 2, 3], 'son öğeyi aşağı taşımak sırayı değiştirmemeli');
assert.throws(() => yapilacakTasi(uc, 99, -1), Error, 'olmayan id atmalı');

// (6) yazma/okuma gidiş-dönüşü
const d0 = mkdtempSync(join(tmpdir(), 'yap-saf-'));
assert.deepEqual(yapilacakOku(d0), [], 'dosya yokken boş dizi olmalı');
yapilacakYaz(d0, iki);
assert.deepEqual(yapilacakOku(d0), iki, 'yazılan liste okunduğunda eşit olmalı');
assert.ok(readFileSync(join(d0, 'yapilacaklar.json'), 'utf8').endsWith('\n'), 'dosya satır sonuyla bitmeli');
writeFileSync(join(d0, 'yapilacaklar.json'), '{bozuk');
assert.deepEqual(yapilacakOku(d0), [], 'bozuk JSON okunduğunda boş dizi olmalı');

// B. Sunucu ----------------------------------------------------------------

const post = (kok, govde) =>
  fetch(`${kok}/api/yapilacak`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(govde),
  });

const R = depo({ 'PLAN.md': '# MDK\n', '.gitignore': 'durum.json\nmetrikler.jsonl\n.mdk-log/\n' });
commit(R, 'ilk');
const s = await baslat(R, 0);
const kok = `http://127.0.0.1:${s.port}`;
const dosya = join(R, 'yapilacaklar.json');
const temiz = () => git(R, 'status', '--porcelain').stdout.trim() === '';
const sonKonu = () => git(R, 'log', '-1', '--format=%s').stdout.trim();
const commitSayi = () => Number(git(R, 'rev-list', '--count', 'HEAD').stdout.trim());

// (7) ekleme: dosya yazılır, yalnız o dosya commit edilir
let r = await post(kok, { islem: 'ekle', baslik: 'İlk iş', not: 'n' });
assert.equal(r.status, 200, 'ekleme 200 olmalı');
let j = await r.json();
assert.equal(j.tamam, true, 'yanıt tamam:true olmalı');
assert.equal(j.liste.length, 1, 'yanıt listesi 1 öğe olmalı');
assert.equal(yapilacakOku(R)[0].baslik, 'İlk iş', 'dosyada iş olmalı');
assert.ok(temiz(), 'ekleme sonrası ağaç temiz olmalı (commit edilmiş)');
assert.equal(sonKonu(), 'yapılacak: ekle #1', 'commit konusu yapılacak: ekle #1 olmalı');

// (8) durum değişimi
r = await post(kok, { islem: 'durum', id: 1, durum: 'ertelendi' });
assert.equal(r.status, 200, 'durum değişimi 200 olmalı');
assert.equal(yapilacakOku(R)[0].durum, 'ertelendi', 'dosyada ertelendi olmalı');
assert.ok(temiz(), 'durum değişiminden sonra ağaç temiz olmalı');

// (9) hatalı istekler dosyayı ve commit sayısını değiştirmez
const onceDosya = readFileSync(dosya, 'utf8');
const onceSayi = commitSayi();
r = await post(kok, { islem: 'ekle', baslik: 'a' });
assert.equal(r.status, 400, 'kısa başlık 400 olmalı');
assert.ok((await r.json()).hata, 'hata iletisi gövdede olmalı');
r = await post(kok, { islem: 'sil' });
assert.equal(r.status, 400, 'bilinmeyen işlem 400 olmalı');
r = await post(kok, { islem: 'ekle', baslik: 'x'.repeat(3000) });
assert.equal(r.status, 413, '3 KB gövde 413 olmalı');
assert.equal(readFileSync(dosya, 'utf8'), onceDosya, 'hatalı istekte dosya değişmemeli');
assert.equal(commitSayi(), onceSayi, 'hatalı istekte commit atılmamalı');

// (10) snapshot listesi dosyayla eşit
assert.deepEqual(snapshot(R).yapilacaklar, yapilacakOku(R), 'snapshot liste dosyayla eşit olmalı');
await s.kapat();

// git deposu olmayan kökte ekleme çökmeden yazılır
const D = mkdtempSync(join(tmpdir(), 'yap-duz-'));
const s2 = await baslat(D, 0);
r = await post(`http://127.0.0.1:${s2.port}`, { islem: 'ekle', baslik: 'Düz klasör iş' });
assert.equal(r.status, 200, 'git deposu yokken ekleme 200 olmalı');
assert.ok(existsSync(join(D, 'yapilacaklar.json')), 'dosya yazılmalı');
await s2.kapat();
assert.deepEqual(snapshot(D).yapilacaklar, yapilacakOku(D), 'düz klasörde snapshot dosyayla eşit olmalı');

console.log('yapilacak.test ok');
