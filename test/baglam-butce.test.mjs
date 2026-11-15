// test/baglam-butce.test.mjs: Rol başına bağlam bütçesi kapı testi (Adım 195).
// A: mdk-denetim.mjs doğrudan (BAGLAM_SINIR, baglamSiniri, baglamIpucu, baglamDenetle)
// B: olaylariTopla (mdk-ortak.mjs) OpenCode ve Antigravity olaylarından okunanDosya/okunanSatir
// C: mdk-adim.mjs koşturucu entegrasyonu (istem ipucu, sınır aşımı uyarısı ve metrik)

import {
  KOK,
  commit,
  denetci,
  depo,
  gecici,
  join,
  kos,
  metrikler,
  oku,
  stub,
  writeFileSync,
} from './yardim.mjs';
import * as denetim from '../mdk-denetim.mjs';
import * as ortak from '../mdk-ortak.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const { vaka, kontrol, bitir } = denetci('baglam-butce.test');

const { BAGLAM_SINIR, baglamSiniri, baglamIpucu, baglamDenetle } = denetim;
const { olaylariTopla } = ortak;

// --- A. mdk-denetim.mjs doğrudan ---

// (1) baglamSiniri('kod') → {dosya:5,satir:800}, baglamSiniri('mekanik') → {dosya:3,satir:400}, bilinmeyen görev → {dosya:5,satir:800}
vaka('1. baglamSiniri varsayılan görev sınırları ve BAGLAM_SINIR');
if (typeof baglamSiniri !== 'function' || !BAGLAM_SINIR) {
  kontrol(false, 'baglamSiniri fonksiyonu ve BAGLAM_SINIR mdk-denetim.mjs içinde tanımlı olmalı');
} else {
  kontrol(BAGLAM_SINIR.kod?.dosya === 5 && BAGLAM_SINIR.kod?.satir === 800, 'BAGLAM_SINIR.kod 5/800 olmalı');
  kontrol(BAGLAM_SINIR.kapi?.dosya === 4 && BAGLAM_SINIR.kapi?.satir === 600, 'BAGLAM_SINIR.kapi 4/600 olmalı');
  kontrol(BAGLAM_SINIR.tasarim?.dosya === 6 && BAGLAM_SINIR.tasarim?.satir === 1000, 'BAGLAM_SINIR.tasarim 6/1000 olmalı');
  kontrol(BAGLAM_SINIR.mekanik?.dosya === 3 && BAGLAM_SINIR.mekanik?.satir === 400, 'BAGLAM_SINIR.mekanik 3/400 olmalı');
  kontrol(BAGLAM_SINIR.eskale?.dosya === 8 && BAGLAM_SINIR.eskale?.satir === 1200, 'BAGLAM_SINIR.eskale 8/1200 olmalı');

  const sKod = baglamSiniri('kod');
  kontrol(sKod?.dosya === 5 && sKod?.satir === 800, "baglamSiniri('kod') {dosya:5,satir:800} dönmeli", JSON.stringify(sKod));

  const sMek = baglamSiniri('mekanik');
  kontrol(sMek?.dosya === 3 && sMek?.satir === 400, "baglamSiniri('mekanik') {dosya:3,satir:400} dönmeli", JSON.stringify(sMek));

  const sBilinmeyen = baglamSiniri('bilinmeyen');
  kontrol(sBilinmeyen?.dosya === 5 && sBilinmeyen?.satir === 800, 'bilinmeyen görev {dosya:5,satir:800} dönmeli', JSON.stringify(sBilinmeyen));

  const sBos = baglamSiniri();
  kontrol(sBos?.dosya === 5 && sBos?.satir === 800, 'argümansız çağrı varsayılan kod {dosya:5,satir:800} dönmeli', JSON.stringify(sBos));
}

// (2) PLAN'da Bağlam sınırı: 4/500 ve Bağlam kod: 6/900 → 'kod' için 6/900, 'mekanik' için 4/500;
//     adım bloğunda - Bağlam sınırı: 2/150 → 2/150 (adım öncelikli); bozuk - Bağlam sınırı: abc → varsayılana düşer
vaka('2. baglamSiniri plan ve adım öncelik sırası ile bozuk değer toleransı');
if (typeof baglamSiniri !== 'function') {
  kontrol(false, 'baglamSiniri fonksiyonu mdk-denetim.mjs içinde tanımlı olmalı');
} else {
  const planMetni = `Yürütücü: opencode
Bağlam sınırı: 4/500
Bağlam kod: 6/900

## K
- [ ] 1. İş
`;
  const sPlanKod = baglamSiniri('kod', planMetni);
  kontrol(sPlanKod?.dosya === 6 && sPlanKod?.satir === 900, "PLAN'da Bağlam kod: 6/900 'kod' için geçerli olmalı", JSON.stringify(sPlanKod));

  const sPlanMek = baglamSiniri('mekanik', planMetni);
  kontrol(sPlanMek?.dosya === 4 && sPlanMek?.satir === 500, "PLAN'da genel Bağlam sınırı: 4/500 'mekanik' için geçerli olmalı", JSON.stringify(sPlanMek));

  const adimOncelikli = '  - Bağlam sınırı: 2/150\n  - Kapı: `node -e ""`\n';
  const sAdim = baglamSiniri('kod', planMetni, adimOncelikli);
  kontrol(sAdim?.dosya === 2 && sAdim?.satir === 150, 'adım bloğundaki - Bağlam sınırı: 2/150 öncelikli olmalı', JSON.stringify(sAdim));

  const adimBozuk = '  - Bağlam sınırı: abc\n';
  const sBozuk = baglamSiniri('kod', planMetni, adimBozuk);
  kontrol(sBozuk?.dosya === 6 && sBozuk?.satir === 900, "bozuk adım sınırı 'abc' bir sonraki önceliğe (plan 'kod' 6/900) düşmeli", JSON.stringify(sBozuk));

  const sBozukHepsi = baglamSiniri('kod', 'Bağlam sınırı: abc\nBağlam kod: def', '  - Bağlam sınırı: xyz');
  kontrol(sBozukHepsi?.dosya === 5 && sBozukHepsi?.satir === 800, 'tüm sınırlar bozuksa BAGLAM_SINIR.kod (5/800) değerine düşmeli', JSON.stringify(sBozukHepsi));
}

// (3) baglamIpucu({dosya:3,satir:400}) '3 dosya' ve '400 satır' içerir
vaka('3. baglamIpucu yönerge metni formatı');
if (typeof baglamIpucu !== 'function') {
  kontrol(false, 'baglamIpucu fonksiyonu mdk-denetim.mjs içinde tanımlı olmalı');
} else {
  const ip = baglamIpucu({ dosya: 3, satir: 400 });
  kontrol(typeof ip === 'string', 'baglamIpucu string dönmeli');
  kontrol(ip?.includes('3 dosya'), "baglamIpucu '3 dosya' içermeli", ip);
  kontrol(ip?.includes('400 satır'), "baglamIpucu '400 satır' içermeli", ip);
  kontrol(
    ip === 'Bağlam bütçesi: en çok 3 dosya ve toplam 400 satır oku; hedef satır aralığını doğrudan aç.',
    'baglamIpucu beklenen tam şablona uymalı',
    ip
  );
}

// (4) baglamDenetle({okunanDosya:2,okunanSatir:100},{dosya:3,satir:400}) → asim:false, ileti:null;
//     okunanDosya:4 ya da okunanSatir:401 → asim:true ve ileti ölçülen ve sınır sayıları içerir
vaka('4. baglamDenetle aşım tespiti ve ileti içeriği');
if (typeof baglamDenetle !== 'function') {
  kontrol(false, 'baglamDenetle fonksiyonu mdk-denetim.mjs içinde tanımlı olmalı');
} else {
  const sinir = { dosya: 3, satir: 400 };

  const dNormal = baglamDenetle({ okunanDosya: 2, okunanSatir: 100 }, sinir);
  kontrol(dNormal?.asim === false, 'sınır aşılmadığında asim === false olmalı', JSON.stringify(dNormal));
  kontrol(dNormal?.ileti === null, 'sınır aşılmadığında ileti === null olmalı', JSON.stringify(dNormal));

  const dSinir = baglamDenetle({ okunanDosya: 3, okunanSatir: 400 }, sinir);
  kontrol(dSinir?.asim === false && dSinir?.ileti === null, 'tam sınır değerinde asim false ve ileti null olmalı', JSON.stringify(dSinir));

  const dDosyaAsim = baglamDenetle({ okunanDosya: 4, okunanSatir: 100 }, sinir);
  kontrol(dDosyaAsim?.asim === true, 'okunanDosya > sinir.dosya ise asim === true olmalı', JSON.stringify(dDosyaAsim));
  kontrol(
    dDosyaAsim?.ileti?.includes('4') &&
    dDosyaAsim?.ileti?.includes('100') &&
    dDosyaAsim?.ileti?.includes('3') &&
    dDosyaAsim?.ileti?.includes('400'),
    'dosya aşımında ileti okunan ve sınır sayılarını içermeli',
    dDosyaAsim?.ileti
  );

  const dSatirAsim = baglamDenetle({ okunanDosya: 2, okunanSatir: 401 }, sinir);
  kontrol(dSatirAsim?.asim === true, 'okunanSatir > sinir.satir ise asim === true olmalı', JSON.stringify(dSatirAsim));
  kontrol(
    dSatirAsim?.ileti?.includes('2') &&
    dSatirAsim?.ileti?.includes('401') &&
    dSatirAsim?.ileti?.includes('3') &&
    dSatirAsim?.ileti?.includes('400'),
    'satır aşımında ileti okunan ve sınır sayılarını içermeli',
    dSatirAsim?.ileti
  );

  const dBos = baglamDenetle();
  kontrol(dBos?.asim === false && dBos?.ileti === null, 'varsayılan parametrelerle asim false dönmeli', JSON.stringify(dBos));
}

// --- B. olaylariTopla (mdk-ortak.mjs) ---

// (5) geçici log dosyasında iki OpenCode tool_use read olayı (/a.mjs 10 satır <content>, /b.mjs 20 satır, ardından /a.mjs tekrar 5 satır)
//     → okunanDosya === 2, okunanSatir === 35
vaka('5. olaylariTopla OpenCode tool_use read olaylarından tekil dosya ve toplam satır ölçümü');
if (typeof olaylariTopla !== 'function') {
  kontrol(false, 'olaylariTopla fonksiyonu mdk-ortak.mjs içinde tanımlı olmalı');
} else {
  const icerik10 = Array.from({ length: 10 }, (_, i) => `satir ${i + 1}`).join('\n');
  const icerik20 = Array.from({ length: 20 }, (_, i) => `satir ${i + 1}`).join('\n');
  const icerik5 = Array.from({ length: 5 }, (_, i) => `satir ${i + 1}`).join('\n');

  const logSatirlariOC = [
    JSON.stringify({
      type: 'tool_use',
      part: {
        tool: 'read',
        state: {
          status: 'completed',
          input: { filePath: '/a.mjs' },
          output: `<content>${icerik10}</content>`,
        },
      },
    }),
    JSON.stringify({
      type: 'tool_use',
      part: {
        tool: 'read',
        state: {
          status: 'completed',
          input: { path: '/b.mjs' },
          output: icerik20,
        },
      },
    }),
    JSON.stringify({
      type: 'tool_use',
      part: {
        tool: 'read',
        state: {
          status: 'completed',
          input: { filePath: '/a.mjs' },
          output: `<content>${icerik5}</content>`,
        },
      },
    }),
    JSON.stringify({
      type: 'step_finish',
      part: { tokens: { total: 100 }, cost: 0.05 },
    }),
  ].join('\n');

  const logYoluOC = join(gecici('mdk-log-oc-'), 'adim.jsonl');
  writeFileSync(logYoluOC, logSatirlariOC);

  const resOC = olaylariTopla(logYoluOC);
  kontrol(resOC?.okunanDosya === 2, 'okunanDosya === 2 olmalı (tekil /a.mjs ve /b.mjs)', String(resOC?.okunanDosya));
  kontrol(resOC?.okunanSatir === 35, 'okunanSatir === 35 olmalı (10 + 20 + 5)', String(resOC?.okunanSatir));
  kontrol(resOC?.token === 100, 'mevcut token dönüş alanı korunmalı', String(resOC?.token));
}

// (6) Antigravity step_update read_file DONE olayları
//     (Path:'/x.mjs', StartLine:10, EndLine:29 ve Path:'/y.mjs', output:'50 lines, 1200 bytes')
//     → okunanDosya === 2, okunanSatir === 70
vaka('6. olaylariTopla Antigravity step_update read_file/view_file olaylarından ölçüm');
if (typeof olaylariTopla !== 'function') {
  kontrol(false, 'olaylariTopla fonksiyonu mdk-ortak.mjs içinde tanımlı olmalı');
} else {
  const logSatirlariAGY = [
    JSON.stringify({
      event: 'step_update',
      step_update: {
        state: 'DONE',
        tool_name: 'read_file',
        parameters: { Path: '/x.mjs', StartLine: 10, EndLine: 29 },
        tool_info: { name: 'read_file', parameters: { Path: '/x.mjs', StartLine: 10, EndLine: 29 } },
      },
    }),
    JSON.stringify({
      event: 'step_update',
      step_update: {
        state: 'DONE',
        tool_name: 'read_file',
        parameters: { Path: '/y.mjs' },
        tool_info: { name: 'read_file', parameters: { Path: '/y.mjs' }, output: '50 lines, 1200 bytes' },
      },
    }),
    JSON.stringify({
      event: 'result',
      result: { status: 'SUCCESS', usage: { total_tokens: 300 } },
    }),
  ].join('\n');

  const logYoluAGY = join(gecici('mdk-log-agy-'), 'adim.jsonl');
  writeFileSync(logYoluAGY, logSatirlariAGY);

  const resAGY = olaylariTopla(logYoluAGY);
  kontrol(resAGY?.okunanDosya === 2, 'okunanDosya === 2 olmalı (tekil /x.mjs ve /y.mjs)', String(resAGY?.okunanDosya));
  kontrol(resAGY?.okunanSatir === 70, 'okunanSatir === 70 olmalı ((29 - 10 + 1) + 50)', String(resAGY?.okunanSatir));
  kontrol(resAGY?.token === 300, 'mevcut token dönüş alanı korunmalı', String(resAGY?.token));
}

// --- C. Koşturucu entegrasyonu (mdk-adim.mjs) ---

// (7) adımda - Bağlam sınırı: 1/20, sahte opencode iki farklı dosya okuma olayı (tool_use read /f1.mjs ve /f2.mjs) basar
//     ve cikti.txt yazar → çıkış 0, istem (istem-1.txt) Bağlam bütçesi: en çok 1 dosya ve toplam 20 satır oku içerir,
//     çıktıda UYARI: bağlam bütçesi: var, son metrikte okunan_dosya === 2 ve baglam_asim === true
vaka('7. Entegrasyon: bağlam sınırı aşımı durumunda istem ipucu, uyarı ve metrik');
const T7 = gecici('mdk-baglam-ent-1-');
const R7 = join(T7, 'repo');
const PLAN_7 = `Yürütücü: opencode
Modeller: m1

## K
- [ ] 1. Sınır aşımı testi
  - Bağlam sınırı: 1/20
  - Kapı: \`node -e "process.exit(require('fs').existsSync('cikti.txt')?0:1)"\`
`;
depo({ 'PLAN.md': PLAN_7 }, { R: R7 });
commit(R7, 'c0');

const govde7 = `
olay({ type: 'tool_use', part: { tool: 'read', state: { status: 'completed', input: { filePath: '/f1.mjs' }, output: '<content>1\\n2</content>' } } });
olay({ type: 'tool_use', part: { tool: 'read', state: { status: 'completed', input: { filePath: '/f2.mjs' }, output: '<content>1\\n2</content>' } } });
yaz('cikti.txt', 'x\\n');
`;
const OC7 = stub(T7, govde7);

const env7 = {
  STUB_DIR: T7,
  MDK_OPENCODE: OC7,
  POLL: '1',
  DENEME: '1',
  SURE: '30',
  MDK_KILIT: join(T7, 'kilit'),
  MDK_ONKONTROL_YOK: '1',
};

const son7 = kos(RUNNER, ['1'], { cwd: R7, env: env7 });
kontrol(son7.kod === 0, 'çıkış 0 olmalı (sınır aşılsa bile story tamamlanır)', son7.cikti);

const istem7 = oku(join(T7, 'istem-1.txt'));
kontrol(
  istem7.includes('Bağlam bütçesi: en çok 1 dosya ve toplam 20 satır oku'),
  'istem-1.txt içinde bağlam ipucu bulunmalı',
  istem7
);
kontrol(son7.cikti.includes('UYARI: bağlam bütçesi:'), 'çıktıda UYARI: bağlam bütçesi: uyarısı bulunmalı', son7.cikti);

const m7 = metrikler(join(R7, 'metrikler.jsonl'));
const sonM7 = m7[m7.length - 1] || {};
kontrol(sonM7.okunan_dosya === 2, 'metrikte okunan_dosya === 2 olmalı', JSON.stringify(sonM7));
kontrol(sonM7.baglam_asim === true, 'metrikte baglam_asim === true olmalı', JSON.stringify(sonM7));

// (8) sınır aşılmadan (0 okuma) → çıkış 0, UYARI: bağlam bütçesi: yok, metrikte baglam_asim === false
vaka('8. Entegrasyon: bağlam sınırı aşılmadığında uyarı basılmaz ve baglam_asim false döner');
const T8 = gecici('mdk-baglam-ent-2-');
const R8 = join(T8, 'repo');
const PLAN_8 = `Yürütücü: opencode
Modeller: m1

## K
- [ ] 1. Aşım olmama testi
  - Bağlam sınırı: 1/20
  - Kapı: \`node -e "process.exit(require('fs').existsSync('cikti.txt')?0:1)"\`
`;
depo({ 'PLAN.md': PLAN_8 }, { R: R8 });
commit(R8, 'c0');

const govde8 = `
yaz('cikti.txt', 'x\\n');
`;
const OC8 = stub(T8, govde8);

const env8 = {
  STUB_DIR: T8,
  MDK_OPENCODE: OC8,
  POLL: '1',
  DENEME: '1',
  SURE: '30',
  MDK_KILIT: join(T8, 'kilit'),
  MDK_ONKONTROL_YOK: '1',
};

const son8 = kos(RUNNER, ['1'], { cwd: R8, env: env8 });
kontrol(son8.kod === 0, 'çıkış 0 olmalı', son8.cikti);
kontrol(!son8.cikti.includes('UYARI: bağlam bütçesi:'), 'sınır aşılmadığında UYARI: bağlam bütçesi: basılmamalı', son8.cikti);

const m8 = metrikler(join(R8, 'metrikler.jsonl'));
const sonM8 = m8[m8.length - 1] || {};
kontrol(sonM8.baglam_asim === false, 'metrikte baglam_asim === false olmalı', JSON.stringify(sonM8));
kontrol(sonM8.okunan_dosya === 0, 'metrikte okunan_dosya === 0 olmalı', JSON.stringify(sonM8));

bitir();
