// Kapı: Agy hakem, inceleme ve karar salt okunur model seçimi (Adım 203)
// Kullanım: node test/agy-saltoku.test.mjs
import assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KOK, commit, denetci, depo, gecici, kos, oku } from './yardim.mjs';
import { agySaltOkuArgs } from '../mdk-ortak.mjs';
import { anaOku, anaBul, gorevModelleri } from '../mdk-ana.mjs';

const { vaka, kontrol, bitir } = denetci('agy-saltoku.test');

function k(kosul, mesaj, ek = '') {
  try {
    assert.ok(kosul, mesaj);
    kontrol(true, mesaj);
  } catch (err) {
    kontrol(false, mesaj, ek || err.message);
  }
}

vaka('1. mdk-hakem.mjs: agy dalı salt-okunur argümanlar kullanır, agy_ek yok');
{
  const D = gecici('mdk-agy-saltoku-hakem-');
  const R = join(D, 'repo');
  const planMetni = `## Epic 1 — A
- Ana: antigravity
- [x] 1. İş
  - Kabul: bir; iki
  - Kapı: \`node t.test.mjs\`
`;
  depo({ 'PLAN.md': planMetni, 't.test.mjs': 'process.exit(0);\n' }, { R });

  const YUR = join(D, 'yurutuculer.json');
  writeFileSync(
    YUR,
    JSON.stringify({
      varsayilan: 'antigravity',
      liste: [
        {
          ad: 'antigravity',
          baslik: 'Antigravity',
          planlayici: ['agy', '-p', '{istem}'],
          agy_ek: ['--mode', 'accept-edits'],
          gorevler: { hakem: ['agy/h1'] },
        },
      ],
    })
  );

  const AGY = join(D, 'sahte-agy.mjs');
  const argsLog = join(D, 'agy-args.log');
  writeFileSync(
    AGY,
    `import fs from 'node:fs';
const A = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(argsLog)}, A.join(' ') + '\\n');
console.log(JSON.stringify({
  event: 'result',
  result: {
    status: 'SUCCESS',
    response: 'ÖLÇÜT 1: GEÇTİ - a\\nÖLÇÜT 2: GEÇTİ - b\\nHÜKÜM: GEÇTİ'
  }
}));
`
  );

  commit(R, 'adım 1: İş (agy/yazan, rol kodcu)');

  const r = kos(join(KOK, 'mdk-hakem.mjs'), ['1'], {
    cwd: R,
    env: {
      MDK_AGY: AGY,
      MDK_YURUTUCULER: YUR,
      POLL: '1',
      ILK: '5',
      SURE: '10',
    },
  });

  k(r.kod === 0, `mdk-hakem çıkış 0 olmalı, alınan: ${r.kod}`, r.cikti);
  const args = oku(argsLog);
  k(args.includes('--mode plan'), `args --mode plan içermeli, alınan: ${args}`);
  k(args.includes('--output-format stream-json'), `args --output-format stream-json içermeli, alınan: ${args}`);
  k(!args.includes('accept-edits'), `args accept-edits içermemeli, alınan: ${args}`);
}

vaka('2. mdk-incele.mjs: agy dalı salt-okunur argümanlar kullanır, agy_ek yok');
{
  const D = gecici('mdk-agy-saltoku-incele-');
  const R = join(D, 'repo');
  const planMetni = `## Epic 1 — A
- Ana: antigravity
- [x] 1. İş
  - Kabul: bir; iki
  - Ne: örnek iş yapıldı
  - Kapı: \`node t.test.mjs\`
`;
  depo({ 'PLAN.md': planMetni, 't.test.mjs': 'process.exit(0);\n' }, { R });

  const YUR = join(D, 'yurutuculer.json');
  writeFileSync(
    YUR,
    JSON.stringify({
      varsayilan: 'antigravity',
      liste: [
        {
          ad: 'antigravity',
          baslik: 'Antigravity',
          planlayici: ['agy', '-p', '{istem}'],
          agy_ek: ['--mode', 'accept-edits'],
          gorevler: { inceleme: ['agy/i1'] },
        },
      ],
    })
  );

  const AGY = join(D, 'sahte-agy.mjs');
  const argsLog = join(D, 'agy-args.log');
  writeFileSync(
    AGY,
    `import fs from 'node:fs';
const A = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(argsLog)}, A.join(' ') + '\\n');
console.log(JSON.stringify({
  event: 'result',
  result: {
    status: 'SUCCESS',
    response: 'UYUM: 92\\n- eksiksiz'
  }
}));
`
  );

  commit(R, 'adım 1: İş (agy/yazan, rol kodcu)');

  const r = kos(join(KOK, 'mdk-incele.mjs'), ['1'], {
    cwd: R,
    env: {
      MDK_AGY: AGY,
      MDK_YURUTUCULER: YUR,
      POLL: '1',
      ILK: '5',
      SURE: '10',
    },
  });

  k(r.kod === 0, `mdk-incele çıkış 0 olmalı, alınan: ${r.kod}`, r.cikti);
  k(r.cikti.includes('UYUM: 92'), `çıktıda "UYUM: 92" bulunmalı, alınan: ${r.cikti}`);
  const args = oku(argsLog);
  k(args.includes('--mode plan'), `args --mode plan içermeli, alınan: ${args}`);
  k(args.includes('--output-format stream-json'), `args --output-format stream-json içermeli, alınan: ${args}`);
  k(!args.includes('accept-edits'), `args accept-edits içermemeli, alınan: ${args}`);
}

vaka('3. mdk-hakem.mjs: yazan model filtrelenir, ikinci hakem modeli seçilir');
{
  const D = gecici('mdk-agy-saltoku-hakem2-');
  const R = join(D, 'repo');
  const planMetni = `## Epic 1 — A
- Ana: antigravity
- [x] 1. İş
  - Kabul: bir; iki
  - Kapı: \`node t.test.mjs\`
`;
  depo({ 'PLAN.md': planMetni, 't.test.mjs': 'process.exit(0);\n' }, { R });

  const YUR = join(D, 'yurutuculer.json');
  writeFileSync(
    YUR,
    JSON.stringify({
      varsayilan: 'antigravity',
      liste: [
        {
          ad: 'antigravity',
          baslik: 'Antigravity',
          planlayici: ['agy', '-p', '{istem}'],
          gorevler: { hakem: ['agy/a', 'agy/b'] },
        },
      ],
    })
  );

  const AGY = join(D, 'sahte-agy.mjs');
  writeFileSync(
    AGY,
    `import fs from 'node:fs';
console.log(JSON.stringify({
  event: 'result',
  result: {
    status: 'SUCCESS',
    response: 'ÖLÇÜT 1: GEÇTİ - a\\nÖLÇÜT 2: GEÇTİ - b\\nHÜKÜM: GEÇTİ'
  }
}));
`
  );

  commit(R, 'adım 1: İş (agy/a, deneme 1)');

  const r = kos(join(KOK, 'mdk-hakem.mjs'), ['1'], {
    cwd: R,
    env: {
      MDK_AGY: AGY,
      MDK_YURUTUCULER: YUR,
      POLL: '1',
      ILK: '5',
      SURE: '10',
    },
  });

  k(r.kod === 0, `mdk-hakem çıkış 0 olmalı, alınan: ${r.kod}`, r.cikti);
  const kayitlar = oku(join(R, 'hakem.jsonl'))
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  k(kayitlar.length >= 1, 'hakem.jsonl kaydı bulunmalı', r.cikti);
  const sonKayit = kayitlar[kayitlar.length - 1] || {};
  k(sonKayit.model === 'agy/b', `kayıtta model agy/b olmalı, alınan: ${sonKayit.model}`);
}

vaka('4. mdk-karar.mjs: adım no verilince antigravity karar modeli seçilir');
{
  const D = gecici('mdk-agy-saltoku-karar-');
  const girdiYol = join(D, 'girdi.txt');
  writeFileSync(girdiYol, 'Hata çıktısı: AssertionError in test\\nAdım: 1\\n');

  const YUR = join(D, 'yurutuculer.json');
  writeFileSync(
    YUR,
    JSON.stringify({
      varsayilan: 'claude',
      liste: [
        { ad: 'claude', baslik: 'Claude' },
        {
          ad: 'antigravity',
          baslik: 'Antigravity',
          planlayici: ['agy', '-p', '{istem}'],
          gorevler: { karar: ['agy/k1'] },
        },
      ],
    })
  );

  const AGY = join(D, 'sahte-agy.mjs');
  const argsLog = join(D, 'agy-args.log');
  writeFileSync(
    AGY,
    `import fs from 'node:fs';
const A = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(argsLog)}, A.join(' ') + '\\n');
console.log(JSON.stringify({
  event: 'result',
  result: {
    status: 'SUCCESS',
    response: 'SEÇİM: kapi_yanlis\\nGEREKÇE: test hatalı'
  }
}));
`
  );

  const PLAN = join(D, 'PLAN.md');
  writeFileSync(PLAN, '## Epic 1 — A\n- Ana: antigravity\n- [ ] 5. İş\n');

  const r1 = kos(join(KOK, 'mdk-karar.mjs'), ['basarisizlik', girdiYol, PLAN, '5'], {
    cwd: D,
    env: {
      MDK_YURUTUCULER: YUR,
      MDK_AGY: AGY,
      POLL: '1',
      ILK: '5',
      SURE: '10',
    },
  });

  k(r1.kod === 0, `mdk-karar çıkış 0 olmalı, alınan: ${r1.kod}`, r1.cikti);
  let parsed1 = null;
  for (const s of r1.cikti.split('\n')) {
    try {
      const j = JSON.parse(s.trim());
      if (j && typeof j.secim !== 'undefined') {
        parsed1 = j;
        break;
      }
    } catch {}
  }
  k(parsed1 !== null, 'stdout içinde JSON karar çıktısı bulunmalı', r1.cikti);
  k(parsed1?.model === 'agy/k1', `model agy/k1 olmalı, alınan: ${parsed1?.model}`);
  const args = oku(argsLog);
  k(args.includes('--mode plan'), `args --mode plan içermeli, alınan: ${args}`);

  const r2 = kos(join(KOK, 'mdk-karar.mjs'), ['basarisizlik', girdiYol, PLAN], {
    cwd: D,
    env: {
      MDK_YURUTUCULER: YUR,
      MDK_AGY: AGY,
      POLL: '1',
      ILK: '5',
      SURE: '10',
    },
  });

  k(r2.kod === 0, `mdk-karar çıkış 0 olmalı, alınan: ${r2.kod}`, r2.cikti);
  let parsed2 = null;
  for (const s of r2.cikti.split('\n')) {
    try {
      const j = JSON.parse(s.trim());
      if (j && typeof j.secim !== 'undefined') {
        parsed2 = j;
        break;
      }
    } catch {}
  }
  k(parsed2 !== null, 'stdout içinde JSON karar çıktısı bulunmalı', r2.cikti);
  k(parsed2?.model !== 'agy/k1', `dördüncü argümansız model agy/k1 olmamalı, alınan: ${parsed2?.model}`);
}

vaka('5. yurutuculer.json: hakem ve inceleme ilk modeli kod modelinden farklı');
{
  const tanim = anaOku(join(KOK, 'yurutuculer.json'));
  const agy = anaBul(tanim, 'antigravity');
  const kod = gorevModelleri(agy, 'kod');
  const hakem = gorevModelleri(agy, 'hakem');
  const inceleme = gorevModelleri(agy, 'inceleme');

  k(Array.isArray(kod) && kod[0] === 'agy/gemini-3.8-flash-medium', `kod[0] flash olmalı, alınan: ${JSON.stringify(kod)}`);
  k(Array.isArray(hakem) && hakem[0] === 'agy/gemini-4-argon-medium', `hakem[0] argon olmalı, alınan: ${JSON.stringify(hakem)}`);
  k(Array.isArray(inceleme) && inceleme[0] === 'agy/gemini-4-argon-medium', `inceleme[0] argon olmalı, alınan: ${JSON.stringify(inceleme)}`);
  k(Array.isArray(hakem) && Array.isArray(kod) && hakem[0] !== kod[0], 'hakem[0] kod[0] ile aynı olmamalı');
  k(Array.isArray(inceleme) && Array.isArray(kod) && inceleme[0] !== kod[0], 'inceleme[0] kod[0] ile aynı olmamalı');
}

vaka('6. agySaltOkuArgs: varsayılan modelde --model yok, son öğeler -p ve istem');
{
  const got = agySaltOkuArgs('varsayilan', 'x');
  k(Array.isArray(got), 'dizi dönmeli');
  k(
    JSON.stringify(got) === JSON.stringify(['--mode', 'plan', '--output-format', 'stream-json', '-p', 'x']),
    `beklenen argümanlar, alınan: ${JSON.stringify(got)}`
  );
  k(!got.includes('--model'), `--model içermemeli, alınan: ${JSON.stringify(got)}`);
  k(JSON.stringify(got.slice(-2)) === JSON.stringify(['-p', 'x']), `son iki öğe -p, x olmalı, alınan: ${JSON.stringify(got.slice(-2))}`);
}

bitir();
