// Kapı (adım 183): Listedeki işi tek tıkla Epic'e çevir.
// Kullanım: node panel/yapilacak-epic.test.mjs
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baslat } from './sunucu.mjs';
import { yapilacaklarHtml } from './ciz.mjs';
import { yapilacakOku } from './yapilacak.mjs';
import { depo, commit, git } from '../test/yardim.mjs';

// Sahte Epic betiği: argümanları argv.json'a yazar, is dosyasını is-kopya.md'ye kopyalar,
// her çağrıyı cagri.txt'ye ekler. SAHTE_EPIC_KOD=1 ise stderr'e "olmadı" basıp çıkış 1; değilse "41" basıp çıkış 0.
const G = mkdtempSync(join(tmpdir(), 'yap-epic-'));
const betik = join(G, 'sahte-epic.mjs');
writeFileSync(betik, `
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
const args = process.argv.slice(2);
writeFileSync(${JSON.stringify(join(G, 'argv.json'))}, JSON.stringify(args));
appendFileSync(${JSON.stringify(join(G, 'cagri.txt'))}, 'x\\n');
try { writeFileSync(${JSON.stringify(join(G, 'is-kopya.md'))}, readFileSync(args[2], 'utf8')); } catch {}
if (process.env.SAHTE_EPIC_KOD === '1') {
  process.stderr.write('olmadı\\n');
  process.exit(1);
}
process.stdout.write('41\\n');
process.exit(0);
`);
process.env.MDK_EPIC_BETIK = betik;

const TS = '2026-11-16T10:00:00.000Z';
const liste = [
  { id: 1, baslik: 'Rapor ekranı', not: 'aylık özet', durum: 'bekliyor', epic: null, ts: TS },
  { id: 2, baslik: 'Eski iş', not: '', durum: 'bitti', epic: null, ts: TS },
  { id: 3, baslik: 'Zaten Epic', not: '', durum: 'bekliyor', epic: 7, ts: TS },
];

const R = depo({ 'PLAN.md': '# MDK\n', 'yapilacaklar.json': JSON.stringify(liste, null, 2) + '\n' });
commit(R, 'ilk');
const s = await baslat(R, 0);
const kok = `http://127.0.0.1:${s.port}`;
const cagriSayi = () => (existsSync(join(G, 'cagri.txt')) ? readFileSync(join(G, 'cagri.txt'), 'utf8').split('\n').filter(Boolean).length : 0);
const epicIstek = (govde) =>
  fetch(`${kok}/api/yapilacak-epic`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(govde),
  });

// (1) bekleyen öğe Epic'e çevrilir
let r = await epicIstek({ id: 1 });
assert.equal(r.status, 200, 'bekleyen öğenin Epic\'e çevrilmesi 200 olmalı');
let j = await r.json();
assert.equal(j.tamam, true, 'yanıt tamam:true olmalı');
assert.equal(j.epic, 41, 'yanıt epic 41 olmalı');
let dosya = yapilacakOku(R);
assert.equal(dosya.find((o) => o.id === 1).epic, 41, 'dosyada 1. öğenin epic alanı 41 olmalı');
assert.equal(dosya.find((o) => o.id === 1).durum, 'bekliyor', 'öğenin durumu bekliyor kalmalı');
const argv = JSON.parse(readFileSync(join(G, 'argv.json'), 'utf8'));
assert.equal(argv[0], 'ac', 'sahte betiğe giden ilk argüman ac olmalı');
assert.equal(argv[1], 'Rapor ekranı', 'ikinci argüman başlık olmalı');
const isKopya = readFileSync(join(G, 'is-kopya.md'), 'utf8');
assert.ok(isKopya.includes('Rapor ekranı') && isKopya.includes('aylık özet'), 'is dosyası başlık ve notu içermeli');
assert.equal(cagriSayi(), 1, 'betik bir kez çağrılmış olmalı');

// (2) aynı iş ikinci kez 409, betik yeniden çağrılmaz
r = await epicIstek({ id: 1 });
assert.equal(r.status, 409, 'zaten Epic olan öğe 409 dönmeli');
assert.equal(cagriSayi(), 1, 'ikinci istekte betik çağrılmamalı');

// (3) bitti, zaten Epic ve olmayan id
assert.equal((await epicIstek({ id: 2 })).status, 409, 'bitti öğe 409 dönmeli');
assert.equal((await epicIstek({ id: 3 })).status, 409, 'Epic\'i olan öğe 409 dönmeli');
assert.equal((await epicIstek({ id: 99 })).status, 400, 'olmayan id 400 dönmeli');
assert.equal(cagriSayi(), 1, 'reddedilen isteklerde betik çağrılmamalı');

// (4) Epic açılamazsa iş değişmez, neden yazılır
r = await epicIstek({ id: 0 });
assert.equal(r.status, 400, 'id 0 olmayan öğe sayılmalı: 400');
let ekle = await fetch(`${kok}/api/yapilacak`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ islem: 'ekle', baslik: 'Hatalı Epic denemesi' }),
});
assert.equal(ekle.status, 200, 'yeni bekleyen öğe eklenmeli');
const yeniId = Math.max(...yapilacakOku(R).map((o) => o.id));
process.env.SAHTE_EPIC_KOD = '1';
try {
  r = await epicIstek({ id: yeniId });
  assert.equal(r.status, 500, 'betik başarısızsa 500 dönmeli');
  const govde = await r.text();
  assert.ok(govde.includes('olmadı'), 'gövdede betiğin son satırı olmalı');
} finally {
  delete process.env.SAHTE_EPIC_KOD;
}
assert.equal(yapilacakOku(R).find((o) => o.id === yeniId).epic, null, 'başarısız denemede epic alanı null kalmalı');

await s.kapat();

// (5) yapilacaklarHtml: yalnız bekleyen ve Epic'i olmayan öğede düğme
const h = yapilacaklarHtml([
  ...liste,
  { id: 4, baslik: 'Ertelenen', not: '', durum: 'ertelendi', epic: null, ts: TS },
]);
assert.ok(h.includes('<button type="button" class="yap-epic" data-id="1">Epic\'e çevir</button>'), 'bekleyen öğede yap-epic düğmesi olmalı');
const li = (id) => h.match(new RegExp(`<li data-id="${id}"[\\s\\S]*?</li>`))[0];
assert.ok(!li(3).includes('yap-epic'), 'Epic\'i dolu öğede yap-epic olmamalı');
assert.ok(!li(4).includes('yap-epic'), 'ertelendi öğede yap-epic olmamalı');
const izleyiciHtml = yapilacaklarHtml(liste, true);
assert.ok(!izleyiciHtml.includes('yap-epic'), 'izleyici modunda yap-epic olmamalı');

console.log('yapilacak-epic.test ok');
