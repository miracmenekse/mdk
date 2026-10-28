// Kapı (adım 65): karar-bekle.mjs — Claude oturumunun Monitor ile izlediği betik.
// Okunmamış kararları satır satır yazar, etki/.karar-okundu'yu ilerletir, izlerken etki/.karar-izleyici'ye pid yazar.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const betik = resolve('karar-bekle.mjs');
const d = mkdtempSync(join(tmpdir(), 'karar-bekle-'));
mkdirSync(join(d, 'etki'));
const kd = join(d, 'etki', 'kararlar.jsonl');
const okundu = join(d, 'etki', '.karar-okundu');
const pidDosya = join(d, 'etki', '.karar-izleyici');
const satir = (k) => JSON.stringify(k) + '\n';
const birKez = () => spawnSync('node', [betik, d, '--bir-kez'], { encoding: 'utf8', timeout: 5000 });

// dosya yokken: çıktı boş, çıkış 0
let r = birKez();
assert.equal(r.status, 0, r.stderr);
assert.equal(r.stdout, '');

// işaret yokken tümü okunmamış sayılır (oturum kapalıyken gelenler kaybolmaz); bozuk satır atlanır
writeFileSync(kd, satir({ ts: 1000, no: 63, tur: 'onay', metin: '' }) + '{bozuk\n' +
  satir({ ts: 2000, no: 64, tur: 'red', metin: 'iki\nsatır' }));
r = birKez();
assert.equal(r.status, 0, r.stderr);
assert.equal(r.stdout, 'adım 63 onay\nadım 64 red: iki satır\n', 'her karar tek satır, metindeki satır sonu boşluk olur');
assert.equal(readFileSync(okundu, 'utf8').trim(), '2000');

// ikinci çalıştırma: yeni karar yok
assert.equal(birKez().stdout, '');

// yalnız işaretten yeni olanlar
appendFileSync(kd, satir({ ts: 1500, no: 9, tur: 'yorum', metin: 'eski' }) + satir({ ts: 3000, no: 65, tur: 'yorum', metin: 'neden?' }));
assert.equal(birKez().stdout, 'adım 65 yorum: neden?\n');
assert.equal(readFileSync(okundu, 'utf8').trim(), '3000');
assert.ok(!existsSync(pidDosya), '--bir-kez pid dosyası bırakmamalı');

// dizin verilmezse çalışma dizini; bayrak dizin sanılmaz
appendFileSync(kd, satir({ ts: 3500, no: 70, tur: 'onay', metin: '' }));
r = spawnSync('node', [betik, '--bir-kez'], { cwd: d, encoding: 'utf8', timeout: 5000 });
assert.equal(r.status, 0, r.stderr);
assert.equal(r.stdout, 'adım 70 onay\n', 'yalnız --bir-kez verilince dizin "." olmalı');

// izleme kipi: pid yazar, eklenen kararı birkaç saniyede basar, SIGTERM'de pid dosyasını siler
const c = spawn('node', [betik, d], { stdio: ['ignore', 'pipe', 'pipe'] });
let cikti = '';
c.stdout.on('data', (p) => (cikti += p));
const bekle = async (kosul, ms, neden) => {
  const son = Date.now() + ms;
  while (!kosul()) {
    if (Date.now() > son) { c.kill('SIGKILL'); throw new Error(neden); }
    await new Promise((z) => setTimeout(z, 100));
  }
};
await bekle(() => existsSync(pidDosya), 3000, 'izleyici pid dosyası yazılmadı');
assert.equal(readFileSync(pidDosya, 'utf8').trim(), String(c.pid));
appendFileSync(kd, satir({ ts: 4000, no: 66, tur: 'red', metin: 'renk soluk' }));
await bekle(() => cikti.includes('adım 66 red: renk soluk'), 4000, `yeni karar basılmadı: ${JSON.stringify(cikti)}`);
assert.equal(cikti, 'adım 66 red: renk soluk\n', 'eski kararlar yeniden basılmamalı');
c.kill('SIGTERM');
await new Promise((z) => c.on('exit', z));
assert.ok(!existsSync(pidDosya), 'çıkışta pid dosyası silinmeli');
assert.equal(readFileSync(okundu, 'utf8').trim(), '4000');
console.log('karar-bekle.test ok');
