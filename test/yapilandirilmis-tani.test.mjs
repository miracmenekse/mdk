// Kapı (adım 224): Başarısız test çıktısının ayıklanarak modele yapılandırılmış geri bildirim olarak verilmesi
import assert from 'node:assert/strict';
import { yapilandirilmisTani } from '../mdk-denetim.mjs';

// 1. ANSI kaçış kodlarının temizlenmesi ve AssertionError yapılandırılmış tanısı
const ansiCikti =
  '\x1b[31mAssertionError [ERR_ASSERTION]: Expected values to be strictly equal:\x1b[0m\n' +
  "+ actual - expected\n+ 'yanlis'\n- 'dogru'\n" +
  '    at Object.<anonymous> (test/ornek.test.mjs:18:10)\n' +
  '    at node:internal/modules/cjs/loader:1200:14\n';

const t1 = yapilandirilmisTani(ansiCikti, { komut: 'node test/ornek.test.mjs', sinir: 1500 });
assert.equal(t1.komut, 'node test/ornek.test.mjs');
assert.equal(t1.hataTuru, 'AssertionError');
assert.equal(t1.konum, 'test/ornek.test.mjs:18:10');
assert.ok(!t1.geriBildirim.includes('\x1b['), 'ANSI kodları temizlenmeli');
assert.ok(t1.geriBildirim.includes('Komut: node test/ornek.test.mjs'), 'komut bilgisi yer almalı');
assert.ok(t1.geriBildirim.includes('Hata Türü: AssertionError'), 'hata türü yer almalı');
assert.ok(t1.geriBildirim.includes('Konum: test/ornek.test.mjs:18:10'), 'konum bilgisi yer almalı');
assert.ok(t1.geriBildirim.includes("+ 'yanlis'"), 'fark satırları korunmalı');

// 2. TypeError ve BAŞARISIZ satırları
const t2 = yapilandirilmisTani('· vaka_1\nBAŞARISIZ [vaka_1]: beklenen 200\n    at kontrol (panel/sunucu.test.mjs:42:5)', {
  komut: 'node panel/sunucu.test.mjs',
});
assert.equal(t2.hataTuru, 'TestHatasi');
assert.equal(t2.konum, 'panel/sunucu.test.mjs:42:5');
assert.ok(t2.geriBildirim.includes('BAŞARISIZ [vaka_1]: beklenen 200'));

// 3. Sınır kontrolü
const t3 = yapilandirilmisTani('x'.repeat(3000), { komut: 'node a.mjs', sinir: 300 });
assert.ok(t3.geriBildirim.length <= 300, 'geriBildirim sınır uzunluğunu aşmamalı');

console.log('yapilandirilmis-tani.test ok');
