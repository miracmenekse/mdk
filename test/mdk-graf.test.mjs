// Kapı (adım 193): Koşturucu adıma graph bağlamı ekler (isteğe bağlı, ölçülür)
// Kullanım: node test/mdk-graf.test.mjs
import { unlinkSync } from 'node:fs';
import {
  KOK,
  commit,
  denetci,
  depo,
  existsSync,
  gecici,
  join,
  kos,
  metrikler,
  mkdirSync,
  oku,
  stub,
  writeFileSync,
} from './yardim.mjs';
import { grafDilimi } from '../mdk-ortak.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-graf.test');

// Sahte graphify betiği
function sahteGraphify(D) {
  const yol = join(D, 'graphify.mjs');
  const icerik = `import fs from 'node:fs';
const A = process.argv.slice(2);
const D = ${JSON.stringify(D)};
fs.appendFileSync(D + '/graf.log', A.join(' ') + '\\n');
if (process.env.GRAF_HATA === '1') process.exit(1);
if (A[0] === 'query') {
  process.stdout.write('NODE ornekFonk() [src=a.mjs loc=L3]\\n');
  process.exit(0);
}
if (A[0] === 'update') {
  process.exit(0);
}
process.exit(0);
`;
  writeFileSync(yol, icerik);
  return yol;
}

// BİRİM TESTLERİ
const D = gecici('mdk-graf-birim-');
const R = join(D, 'repo');
depo({}, { R });
writeFileSync(join(R, '.gitignore'), 'durum.json\nmetrikler.jsonl\n.mdk-log/\ngraphify-out/\n');
mkdirSync(join(R, 'graphify-out'), { recursive: true });
commit(R, 'c0');

const sahte = sahteGraphify(D);
const logYolu = join(D, 'graf.log');

// (1) MDK_GRAF tanımsız → '' ve graf.log yok
vaka('1. MDK_GRAF tanımsızken boş döner ve graf.log oluşmaz');
delete process.env.MDK_GRAF;
delete process.env.MDK_GRAPHIFY;
delete process.env.MDK_GRAF_BUTCE;
delete process.env.GRAF_HATA;
if (existsSync(logYolu)) unlinkSync(logYolu);
const r1 = grafDilimi({ kok: R, sorgu: 'fonksiyon bul' });
kontrol(r1 === '', 'MDK_GRAF tanımsızken boş string dönmeli', r1);
kontrol(!existsSync(logYolu), 'graf.log oluşmamalı');

// (2) MDK_GRAF=1, MDK_GRAPHIFY=<sahte> → sonuç ornekFonk() içerir; graf.log 1. satır update . ile başlar, 2. satır query ile başlar, sorgu metnini ve --budget 1500 içerir
vaka('2. MDK_GRAF=1 sahte graphify ile sonuç ornekFonk() içerir ve graf.log güncellenir');
process.env.MDK_GRAF = '1';
process.env.MDK_GRAPHIFY = sahte;
delete process.env.MDK_GRAF_BUTCE;
delete process.env.GRAF_HATA;
if (existsSync(logYolu)) unlinkSync(logYolu);
const r2 = grafDilimi({ kok: R, sorgu: 'ornek sorgu metni' });
kontrol(typeof r2 === 'string' && r2.includes('ornekFonk()'), 'sonuç ornekFonk() içermeli', r2);
const log2 = oku(logYolu).trim().split('\n');
kontrol(log2.length >= 2, 'graf.log en az 2 satır içermeli', log2.join('\n'));
kontrol(log2[0]?.startsWith('update .'), 'graf.log 1. satır update . ile başlamalı', log2[0]);
kontrol(log2[1]?.startsWith('query') && log2[1].includes('ornek sorgu metni') && log2[1].includes('--budget 1500'), 'graf.log 2. satır query, sorgu metnini ve --budget 1500 içermeli', log2[1]);

// (3) MDK_GRAF_BUTCE=700 → --budget 700
vaka('3. MDK_GRAF_BUTCE=700 ile --budget 700');
process.env.MDK_GRAF_BUTCE = '700';
if (existsSync(logYolu)) unlinkSync(logYolu);
const r3 = grafDilimi({ kok: R, sorgu: 'butce sorgusu' });
delete process.env.MDK_GRAF_BUTCE;
const log3 = oku(logYolu).trim().split('\n');
kontrol(log3[1]?.includes('--budget 700'), 'graf.log query satırı --budget 700 içermeli', log3[1]);

// (4) guncelle: false → graf.log'da update yok
vaka('4. guncelle: false durumunda update çalıştırılmaz');
if (existsSync(logYolu)) unlinkSync(logYolu);
const r4 = grafDilimi({ kok: R, sorgu: 'guncelleme yok', guncelle: false });
kontrol(typeof r4 === 'string' && r4.includes('ornekFonk()'), 'sonuç ornekFonk() içermeli', r4);
const log4 = oku(logYolu).trim().split('\n').filter(Boolean);
kontrol(!log4.some((l) => l.startsWith('update')), 'graf.log içinde update olmamalı', log4.join('\n'));
kontrol(log4.some((l) => l.startsWith('query')), 'graf.log içinde query olmalı', log4.join('\n'));

// (5) .gitignore'da graphify-out/ olmayan ikinci depo → '' ve sahte çağrılmaz
vaka('5. .gitignore içinde graphify-out/ yoksa boş string ve sahte çağrılmaz');
const D5 = gecici('mdk-graf-ignore-');
const R5 = join(D5, 'repo');
depo({}, { R: R5 });
commit(R5, 'c0');
if (existsSync(logYolu)) unlinkSync(logYolu);
const r5 = grafDilimi({ kok: R5, sorgu: 'test ignore' });
kontrol(r5 === '', 'graphify-out git ignore da yokken boş string dönmeli', r5);
kontrol(!existsSync(logYolu), 'sahte graphify çağrılmamalı');

// (6) GRAF_HATA=1 → '', exception yok
vaka('6. GRAF_HATA=1 durumunda hata fırlatmaz, boş string döner');
process.env.GRAF_HATA = '1';
let r6 = null, err6 = null;
try {
  r6 = grafDilimi({ kok: R, sorgu: 'hata deneme' });
} catch (e) {
  err6 = e;
}
delete process.env.GRAF_HATA;
kontrol(!err6, 'exception fırlatmamalı', err6);
kontrol(r6 === '', 'boş string dönmeli', r6);

// (7) MDK_GRAPHIFY var olmayan yol → '', exception yok
vaka('7. MDK_GRAPHIFY var olmayan yol ise hata fırlatmaz, boş string döner');
process.env.MDK_GRAPHIFY = join(D, 'olmayan-graphify-yolu.mjs');
let r7 = null, err7 = null;
try {
  r7 = grafDilimi({ kok: R, sorgu: 'olmayan yol deneme' });
} catch (e) {
  err7 = e;
}
process.env.MDK_GRAPHIFY = sahte;
kontrol(!err7, 'exception fırlatmamalı', err7);
kontrol(r7 === '', 'boş string dönmeli', r7);

// (8) boş sorgu → ''
vaka('8. boş sorguda boş string döner ve sahte çağrılmaz');
if (existsSync(logYolu)) unlinkSync(logYolu);
const r8a = grafDilimi({ kok: R, sorgu: '' });
const r8b = grafDilimi({ kok: R, sorgu: '   \n\t  ' });
kontrol(r8a === '' && r8b === '', 'boş sorguda boş string dönmeli');
kontrol(!existsSync(logYolu), 'boş sorguda sahte çağrılmamalı');

// ENTEGRASYON TESTLERİ
const PLAN_METNI = `Yürütücü: opencode
Modeller: m1

## K
- [ ] 1. İş
  - Ne: ornek fonksiyonu yaz
  - Kapı: \`node -e "process.exit(require('fs').existsSync('cikti.txt')?0:1)"\`
`;
const YAZ = "yaz('cikti.txt', 'x\\n');";

// (9) MDK_GRAF=1 + MDK_GRAPHIFY=<sahte> ile kos(mdk-adim.mjs, ['1']) → çıkış 0; <T>/istem-1.txt Graph bağlamı ve ornekFonk() içerir; graf.log'daki query satırı ornek fonksiyonu yaz içerir; son metrik satırında graf === 1
vaka('9. Entegrasyon: MDK_GRAF=1 ile istemde Graph bağlamı ve ornekFonk(), query satırında Ne metni, metrikte graf=1');
const T9 = gecici('mdk-graf-ent-1-');
const R9 = join(T9, 'repo');
depo({ 'PLAN.md': PLAN_METNI }, { R: R9 });
writeFileSync(join(R9, '.gitignore'), 'durum.json\nmetrikler.jsonl\n.mdk-log/\ngraphify-out/\n');
mkdirSync(join(R9, 'graphify-out'), { recursive: true });
commit(R9, 'c0');

const OC9 = stub(T9, YAZ);
const sahte9 = sahteGraphify(T9);

const env9 = {
  STUB_DIR: T9,
  MDK_OPENCODE: OC9,
  POLL: '1',
  DENEME: '1',
  SURE: '30',
  MDK_KILIT: join(T9, 'kilit'),
  MDK_ONKONTROL_YOK: '1',
  MDK_GRAF: '1',
  MDK_GRAPHIFY: sahte9,
};

const son9 = kos(RUNNER, ['1'], { cwd: R9, env: env9 });
kontrol(son9.kod === 0, 'çıkış 0 olmalı', son9.cikti);

const istem9 = oku(join(T9, 'istem-1.txt'));
kontrol(istem9.includes('Graph bağlamı'), 'istem-1.txt Graph bağlamı içermeli', istem9);
kontrol(istem9.includes('ornekFonk()'), 'istem-1.txt ornekFonk() içermeli', istem9);

const grafLog9 = oku(join(T9, 'graf.log'));
const querySatiri9 = grafLog9.split('\n').find((l) => l.startsWith('query')) || '';
kontrol(querySatiri9.includes('ornek fonksiyonu yaz'), 'graf.log query satırı "ornek fonksiyonu yaz" içermeli', querySatiri9);

const m9 = metrikler(join(R9, 'metrikler.jsonl'));
const sonMetrik9 = m9[m9.length - 1] || {};
kontrol(sonMetrik9.graf === 1, 'son metrikte graf === 1 olmalı', JSON.stringify(sonMetrik9));

// (10) aynı kurulum MDK_GRAF olmadan → çıkış 0, istem Graph bağlamı İÇERMEZ, metrikte graf === 0
vaka('10. Entegrasyon: MDK_GRAF olmadan çıkış 0, istem Graph bağlamı içermez, metrikte graf=0');
const T10 = gecici('mdk-graf-ent-2-');
const R10 = join(T10, 'repo');
depo({ 'PLAN.md': PLAN_METNI }, { R: R10 });
writeFileSync(join(R10, '.gitignore'), 'durum.json\nmetrikler.jsonl\n.mdk-log/\ngraphify-out/\n');
mkdirSync(join(R10, 'graphify-out'), { recursive: true });
commit(R10, 'c0');

const OC10 = stub(T10, YAZ);
const sahte10 = sahteGraphify(T10);

delete process.env.MDK_GRAF;
delete process.env.MDK_GRAPHIFY;

const env10 = {
  STUB_DIR: T10,
  MDK_OPENCODE: OC10,
  POLL: '1',
  DENEME: '1',
  SURE: '30',
  MDK_KILIT: join(T10, 'kilit'),
  MDK_ONKONTROL_YOK: '1',
  MDK_GRAF: '',
  MDK_GRAPHIFY: sahte10,
};

const son10 = kos(RUNNER, ['1'], { cwd: R10, env: env10 });
kontrol(son10.kod === 0, 'çıkış 0 olmalı', son10.cikti);

const istem10 = oku(join(T10, 'istem-1.txt'));
kontrol(!istem10.includes('Graph bağlamı'), 'istem-1.txt Graph bağlamı İÇERMEMELİ', istem10);

const m10 = metrikler(join(R10, 'metrikler.jsonl'));
const sonMetrik10 = m10[m10.length - 1] || {};
kontrol(sonMetrik10.graf === 0, 'son metrikte graf === 0 olmalı', JSON.stringify(sonMetrik10));

bitir();
