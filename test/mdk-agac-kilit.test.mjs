// mdk-agac-kilit.test.mjs: Ağaç kilidi (adım 194) kapı testi:
// Aynı çalışma kopyasında iki koşturucu birbirinin işini silmesin.
// Canlı yabancı süreç, ölü/bozuk pid, yabancı pid ile birak(),
// mdk-adim ve mdk-rol entegrasyonu (çıkış 8 / başka bir koşturucu).
import { spawn, spawnSync } from 'node:child_process';
import {
  KOK,
  commit,
  denetci,
  depo,
  existsSync,
  gecici,
  git,
  join,
  kos,
  mkdirSync,
  oku,
  stub,
  writeFileSync,
} from './yardim.mjs';
import * as ortak from '../mdk-ortak.mjs';

const { agacKilidi } = ortak;
const { vaka, kontrol, bitir } = denetci('mdk-agac-kilit.test');

const RUNNER_ADIM = join(KOK, 'mdk-adim.mjs');
const RUNNER_ROL = join(KOK, 'mdk-rol.mjs');

// Canlı yabancı süreç
const yabanci = spawn(process.execPath, ['-e', 'setTimeout(()=>{},60000)'], { stdio: 'ignore' });
const yabanciPid = yabanci.pid;

process.on('exit', () => {
  try { yabanci.kill(); } catch {}
});

// Ölü süreç pid'i
const olu = spawnSync(process.execPath, ['-e', '']);
const oluPid = olu.pid;

try {
  // BİRİM (agacKilidi mdk-ortak.mjs'den)
  // (1) boş geçici kökte agacKilidi(K) → ok === true, <K>/.mdk-log/agac.kilit var ve içeriği String(process.pid); birak() sonrası dosya yok.
  vaka('1 boş geçici kökte agacKilidi(K)');
  if (typeof agacKilidi !== 'function') {
    kontrol(false, 'agacKilidi fonksiyonu mdk-ortak.mjs içinde tanımlı olmalı');
  } else {
    const K1 = gecici('kilit-b1-');
    const yol1 = join(K1, '.mdk-log', 'agac.kilit');
    const k1 = agacKilidi(K1);
    kontrol(k1?.ok === true, 'ok === true olmalı');
    kontrol(existsSync(yol1), '.mdk-log/agac.kilit var olmalı');
    kontrol(oku(yol1).trim() === String(process.pid), `dosya içeriği String(process.pid) (${process.pid}) olmalı`);
    if (typeof k1?.birak === 'function') k1.birak();
    kontrol(!existsSync(yol1), 'birak() sonrası dosya yok olmalı');
  }

  // (2) kilit dosyasına canlı yabancı pid yazılmışken → ok === false, sahip o pid; dosya içeriği değişmemiş.
  vaka('2 kilit dosyasına canlı yabancı pid yazılmışken');
  if (typeof agacKilidi !== 'function') {
    kontrol(false, 'agacKilidi fonksiyonu mdk-ortak.mjs içinde tanımlı olmalı');
  } else {
    const K2 = gecici('kilit-b2-');
    const yol2 = join(K2, '.mdk-log', 'agac.kilit');
    mkdirSync(join(K2, '.mdk-log'), { recursive: true });
    writeFileSync(yol2, String(yabanciPid));
    const k2 = agacKilidi(K2);
    kontrol(k2?.ok === false, 'ok === false olmalı');
    kontrol(Number(k2?.sahip) === yabanciPid, `sahip yabancı pid (${yabanciPid}) olmalı`);
    kontrol(oku(yol2) === String(yabanciPid), 'dosya içeriği değişmemiş olmalı');
  }

  // (3) kilit dosyasına ölü pid ya da abc yazılmışken → ok === true ve dosya artık process.pid.
  vaka('3a kilit dosyasına ölü pid yazılmışken');
  if (typeof agacKilidi !== 'function') {
    kontrol(false, 'agacKilidi fonksiyonu mdk-ortak.mjs içinde tanımlı olmalı');
  } else {
    const K3a = gecici('kilit-b3a-');
    const yol3a = join(K3a, '.mdk-log', 'agac.kilit');
    mkdirSync(join(K3a, '.mdk-log'), { recursive: true });
    writeFileSync(yol3a, String(oluPid));
    const k3a = agacKilidi(K3a);
    kontrol(k3a?.ok === true, 'ok === true olmalı');
    kontrol(oku(yol3a).trim() === String(process.pid), `dosya artık process.pid (${process.pid}) olmalı`);
    if (typeof k3a?.birak === 'function') k3a.birak();
    kontrol(!existsSync(yol3a), 'birak() sonrası dosya yok olmalı');
  }

  vaka('3b kilit dosyasına "abc" yazılmışken');
  if (typeof agacKilidi !== 'function') {
    kontrol(false, 'agacKilidi fonksiyonu mdk-ortak.mjs içinde tanımlı olmalı');
  } else {
    const K3b = gecici('kilit-b3b-');
    const yol3b = join(K3b, '.mdk-log', 'agac.kilit');
    mkdirSync(join(K3b, '.mdk-log'), { recursive: true });
    writeFileSync(yol3b, 'abc');
    const k3b = agacKilidi(K3b);
    kontrol(k3b?.ok === true, 'ok === true olmalı');
    kontrol(oku(yol3b).trim() === String(process.pid), `dosya artık process.pid (${process.pid}) olmalı`);
    if (typeof k3b?.birak === 'function') k3b.birak();
    kontrol(!existsSync(yol3b), 'birak() sonrası dosya yok olmalı');
  }

  // (4) yabancı pid'li kilitte birak() → dosya silinmez.
  vaka('4 yabancı pid ile değiştirilmiş kilitte birak()');
  if (typeof agacKilidi !== 'function') {
    kontrol(false, 'agacKilidi fonksiyonu mdk-ortak.mjs içinde tanımlı olmalı');
  } else {
    const K4 = gecici('kilit-b4-');
    const yol4 = join(K4, '.mdk-log', 'agac.kilit');
    const k4 = agacKilidi(K4);
    kontrol(k4?.ok === true, 'başlangıçta kilit alınmalı');
    writeFileSync(yol4, String(yabanciPid));
    if (typeof k4?.birak === 'function') k4.birak();
    kontrol(existsSync(yol4), 'yabancı pid olan dosya silinmemeli');
    kontrol(oku(yol4) === String(yabanciPid), 'dosya içeriği hâlâ yabancı pid olmalı');
  }

  // ENTEGRASYON mdk-adim
  const KAPI_ADIM = `node -e "process.exit(require('fs').existsSync('cikti.txt')?0:1)"`;
  const PLAN_ADIM = `Yürütücü: opencode\nModeller: m1\n\n## K\n- [ ] 1. İş\n  - Kapı: \`${KAPI_ADIM}\`\n`;

  function kurAdim() {
    const T = gecici('adim-t-');
    const R = join(T, 'repo');
    depo({ 'PLAN.md': PLAN_ADIM }, { R });
    const OC = stub(T, "yaz('cikti.txt', 'x\\n');");
    const cp = commit(R, 'c0');
    const env = {
      STUB_DIR: T,
      MDK_OPENCODE: OC,
      POLL: '1',
      DENEME: '1',
      SURE: '30',
      MDK_KILIT: join(T, 'kilit'),
      MDK_ONKONTROL_YOK: '1',
    };
    return { T, R, OC, cp, env };
  }

  // (5) depo içine .mdk-log/agac.kilit = canlı yabancı pid → mdk-adim.mjs 1 çıkış 8, çıktı başka bir koşturucu ve pid'i içerir, sahte opencode HİÇ çağrılmamış (<T>/sayac yok), HEAD değişmemiş, cikti.txt yok, kilit dosyası hâlâ yabancı pid.
  vaka('5 mdk-adim canlı yabancı pid ile');
  const A5 = kurAdim();
  const kilitYol5 = join(A5.R, '.mdk-log', 'agac.kilit');
  mkdirSync(join(A5.R, '.mdk-log'), { recursive: true });
  writeFileSync(kilitYol5, String(yabanciPid));
  const son5 = kos(RUNNER_ADIM, ['1'], { cwd: A5.R, env: A5.env });
  kontrol(son5.kod === 8, `çıkış 8 olmalı (alınan: ${son5.kod})`, son5.cikti);
  kontrol(son5.cikti.includes('başka bir koşturucu'), 'çıktı "başka bir koşturucu" içermeli', son5.cikti);
  kontrol(son5.cikti.includes(String(yabanciPid)), `çıktı pid (${yabanciPid}) içermeli`, son5.cikti);
  kontrol(!existsSync(join(A5.T, 'sayac')), 'sahte opencode hiç çağrılmamış olmalı (<T>/sayac yok)');
  kontrol(git(A5.R, 'rev-parse', 'HEAD').stdout.trim() === A5.cp, 'HEAD değişmemiş olmalı');
  kontrol(!existsSync(join(A5.R, 'cikti.txt')), 'cikti.txt olmamalı');
  kontrol(oku(kilitYol5) === String(yabanciPid), 'kilit dosyası hâlâ yabancı pid içermeli');

  // (6) kilit yokken aynı koşu → çıkış 0 ve koşu sonunda .mdk-log/agac.kilit yok.
  vaka('6 mdk-adim kilit yokken');
  const A6 = kurAdim();
  const kilitYol6 = join(A6.R, '.mdk-log', 'agac.kilit');
  const son6 = kos(RUNNER_ADIM, ['1'], { cwd: A6.R, env: A6.env });
  kontrol(son6.kod === 0, `çıkış 0 olmalı (alınan: ${son6.kod})`, son6.cikti);
  kontrol(!existsSync(kilitYol6), 'koşu sonunda .mdk-log/agac.kilit yok olmalı');

  // (7) kilit dosyası ölü pid → çıkış 0.
  vaka('7 mdk-adim ölü pid ile');
  const A7 = kurAdim();
  const kilitYol7 = join(A7.R, '.mdk-log', 'agac.kilit');
  mkdirSync(join(A7.R, '.mdk-log'), { recursive: true });
  writeFileSync(kilitYol7, String(oluPid));
  const son7 = kos(RUNNER_ADIM, ['1'], { cwd: A7.R, env: A7.env });
  kontrol(son7.kod === 0, `çıkış 0 olmalı (alınan: ${son7.kod})`, son7.cikti);
  kontrol(!existsSync(kilitYol7), 'koşu sonunda .mdk-log/agac.kilit yok olmalı');

  // ENTEGRASYON mdk-rol
  const KAPI_ROL = `node -e "process.exit(require('fs').existsSync('cikti.txt')?0:1)"`;
  const PLAN_ROL = [
    'Kurallar (tüm adımlar için):',
    '- Kapı dosyalarına dokunma.',
    '',
    '## Epic 1 — A',
    '- [ ] 1. İş',
    '  - Kapı: `' + KAPI_ROL + '`',
    '',
  ].join('\n');

  const YUR_ROL = {
    varsayilan: 'cc',
    liste: [
      { ad: 'cc', baslik: 'Test claude', planlayici: ['claude', '-p', '{istem}'], roller: { kodcu: 'claude/ucuz', tasarimci: 'claude/tas' } },
    ],
  };

  function sahteClaude(T, ad = 'claude') {
    const yol = join(T, `${ad}.mjs`);
    writeFileSync(yol, `import fs from 'node:fs';
const D = process.env.STUB_DIR, A = process.argv.slice(2), d = process.env.SAHTE_DAVRANIS || '';
fs.writeFileSync(D + '/argv-${ad}', JSON.stringify(A));
if (d === 'kapi') fs.writeFileSync('cikti.txt', 'tamam');
`);
    return yol;
  }

  function kurRol(plan = PLAN_ROL) {
    const T = gecici('rol-t-');
    const R = join(T, 'proje');
    const yur = join(T, 'yur.json');
    writeFileSync(yur, JSON.stringify(YUR_ROL));
    const claude = sahteClaude(T, 'claude');
    depo({ 'PLAN.md': plan, 'ekran.md': 'Giriş ekranı\n' }, { R });
    const cp = commit(R, 'ilk');
    return {
      T,
      R,
      cp,
      env: {
        STUB_DIR: T,
        MDK_CLAUDE: claude,
        MDK_YURUTUCULER: yur,
        ILK: '30',
        SURE: '60',
        SAHTE_DAVRANIS: 'kapi',
      },
    };
  }

  // (8) canlı yabancı pid kilidi varken mdk-rol.mjs kodcu 1 → çıkış 8, çıktı başka bir koşturucu içerir, sahte claude çağrılmamış (argv-claude yok), HEAD değişmemiş.
  vaka('8 mdk-rol canlı yabancı pid ile');
  const R8 = kurRol();
  const kilitYol8 = join(R8.R, '.mdk-log', 'agac.kilit');
  mkdirSync(join(R8.R, '.mdk-log'), { recursive: true });
  writeFileSync(kilitYol8, String(yabanciPid));
  const son8 = kos(RUNNER_ROL, ['kodcu', '1'], { cwd: R8.R, env: R8.env });
  kontrol(son8.kod === 8, `çıkış 8 olmalı (alınan: ${son8.kod})`, son8.cikti);
  kontrol(son8.cikti.includes('başka bir koşturucu'), 'çıktı "başka bir koşturucu" içermeli', son8.cikti);
  kontrol(son8.cikti.includes(String(yabanciPid)), `çıktı pid (${yabanciPid}) içermeli`, son8.cikti);
  kontrol(!existsSync(join(R8.T, 'argv-claude')), 'sahte claude çağrılmamış olmalı (argv-claude yok)');
  kontrol(git(R8.R, 'rev-parse', 'HEAD').stdout.trim() === R8.cp, 'HEAD değişmemiş olmalı');
  kontrol(oku(kilitYol8) === String(yabanciPid), 'kilit dosyası hâlâ yabancı pid içermeli');

  // (9) kilit yokken → çıkış 0 ve .mdk-log/agac.kilit yok.
  vaka('9 mdk-rol kilit yokken');
  const R9 = kurRol();
  const kilitYol9 = join(R9.R, '.mdk-log', 'agac.kilit');
  const son9 = kos(RUNNER_ROL, ['kodcu', '1'], { cwd: R9.R, env: R9.env });
  kontrol(son9.kod === 0, `çıkış 0 olmalı (alınan: ${son9.kod})`, son9.cikti);
  kontrol(!existsSync(kilitYol9), 'koşu sonunda .mdk-log/agac.kilit yok olmalı');
} finally {
  try { yabanci.kill(); } catch {}
  bitir();
}
