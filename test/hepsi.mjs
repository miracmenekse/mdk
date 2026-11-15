// Tüm kapı testlerini çalıştırır (regresyon). Kullanım (proje kökünde): node test/hepsi.mjs
// HEPSI_HIZLI=1: ön kontrol kipi; yavaş koşturucu testleri (mdk-adim, mdk-hiz) atlanır.
import { existsSync, readdirSync, readFileSync, writeSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(KOK);
const yaz = (s) => writeSync(1, s + '\n');

// ileride commit edilen kırmızı kapı: yalnız bitmemiş adımların Kapı'larında geçen test dosyası atlanır;
// bitmiş bir adımda da geçiyorsa koşar (regresyon korunur)
function bekleyenler() {
  const bitti = new Set(), acik = new Set(); let k = null;
  let t = ''; try { t = readFileSync('PLAN.md', 'utf8'); } catch {}
  for (const l of t.split(/\r?\n/)) {
    const a = l.match(/^- \[([ x])\] \d+\./); if (a) { k = a[1] === 'x' ? bitti : acik; continue; }
    if (/^#/.test(l)) { k = null; continue; }
    const m = k && l.match(/^\s*- Kapı: `(.*)`/);
    if (m) for (const f of m[1].match(/[\w./-]+\.test\.(mjs|sh)/g) || []) k.add(f);
  }
  return new Set([...acik].filter((f) => !bitti.has(f)));
}
const BEKLEYEN = bekleyenler();
// süreç sayan, süre ölçen ya da kilit kullanan testler birbirini bozmasın diye sırayla, paralel grubun ardından koşar
const SIRALI = ['mdk-adim', 'mdk-hiz', 'mdk-paralel', 'persona-tur', 'persona-gorev', 'mdk-incele', 'epic-onay', 'mdk-panel', 'mdk-esitle', 'mdk-figma'].map((a) => `test/${a}.test.mjs`).concat(['panel/radar-tara.test.mjs']); // radar-tara zamanlamaya dayalı: yük altında oynak, sırayla koşar
// hızlı kipte atlananlar: koşturucunun kendi uzun testleri (eskiden hepsi.sh'te de hızlı kipte atlanır ya da hiç koşmazdı)
const YAVAS = ['mdk-adim', 'mdk-hiz', 'mdk-paralel', 'persona-tur', 'persona-gorev', 'mdk-incele', 'epic-onay'].map((a) => `test/${a}.test.mjs`);
const IOS = /^test\/ios-/; // simülatör ister; yalnız kendi adımının kapısında koşar
const DISARIDA = ['test/hepsi-hizli.test.mjs']; // hepsi.mjs'i kendisi koşar (sonsuz döngü)

const dosyalar = [];
for (const d of ['panel', 'etki', 'test']) {
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d).sort()) if (f.endsWith('.test.mjs')) dosyalar.push(`${d}/${f}`);
}
const kos = (t) => new Promise((coz) => {
  const c = spawn(process.execPath, [t], { stdio: ['ignore', 'pipe', 'pipe'] });
  let o = ''; c.stdout.on('data', (x) => (o += x)); c.stderr.on('data', (x) => (o += x));
  c.on('error', (e) => coz({ t, ok: false, o: String(e) }));
  c.on('close', (k) => coz({ t, ok: k === 0, o }));
});

const paralel = [], sirali = [];
for (const t of dosyalar) {
  if (IOS.test(t) || DISARIDA.includes(t)) continue;
  if (BEKLEYEN.has(t)) { yaz(`atlandı (bekleyen adımın kapısı): ${t}`); continue; }
  if (process.env.HEPSI_HIZLI === '1' && YAVAS.includes(t)) { yaz(`atlandı (hızlı): ${t}`); continue; }
  (SIRALI.includes(t) ? sirali : paralel).push(t);
}
const sonuc = [];
let i = 0;
await Promise.all(Array.from({ length: 8 }, async () => { while (i < paralel.length) sonuc.push(await kos(paralel[i++])); }));
for (const t of SIRALI) if (sirali.includes(t)) sonuc.push(await kos(t));

let fail = false;
for (const r of sonuc.sort((a, b) => dosyalar.indexOf(a.t) - dosyalar.indexOf(b.t))) {
  if (r.ok) continue;
  fail = true;
  yaz(`BAŞARISIZ: ${r.t}`);
  yaz(r.o.replace(/\n+$/, '').split('\n').slice(-8).join('\n'));
}
if (fail) process.exit(1);
yaz('hepsi ok');
