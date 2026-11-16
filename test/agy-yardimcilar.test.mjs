// Kapı: Hakem, inceleme, karar ve MCP araçlarında tam Antigravity desteği (Adım 197)
// Kullanım: node test/agy-yardimcilar.test.mjs
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KOK, commit, denetci, depo, gecici, kos, oku, temizEnv, uyu } from './yardim.mjs';
import { metinAyikla } from '../mdk-ortak.mjs';
import { anaBul, anaOku, gorevModelleri } from '../mdk-ana.mjs';

const { vaka, kontrol, bitir } = denetci('agy-yardimcilar.test');

function k(kosul, mesaj, ek = '') {
  try {
    assert.ok(kosul, mesaj);
    kontrol(true, mesaj);
  } catch (err) {
    kontrol(false, mesaj, ek || err.message);
  }
}

// ---------------------------------------------------------------------------
// Vaka 1: metinAyikla Antigravity stream-json result.response desteği
// ---------------------------------------------------------------------------
vaka('1. metinAyikla: stream-json result.response ayıklama ve geriye uyumluluk');
{
  const D = gecici('mdk-agy-metin-');
  const logAgy = join(D, 'agy.log');
  writeFileSync(
    logAgy,
    JSON.stringify({
      event: 'result',
      result: {
        status: 'SUCCESS',
        response: 'ÖLÇÜT 1: GEÇTİ - tamam\nHÜKÜM: GEÇTİ',
      },
    }) + '\n'
  );
  const metin = metinAyikla(logAgy);
  k(metin === 'ÖLÇÜT 1: GEÇTİ - tamam\nHÜKÜM: GEÇTİ', `result.response ayıklanmalı, alınan: ${JSON.stringify(metin)}`);

  // Sınır durumları: opencode text olayı geriye uyumluluk, string olmayan response, bozuk json satırı
  const logKarisik = join(D, 'karisik.log');
  writeFileSync(
    logKarisik,
    [
      JSON.stringify({ type: 'text', part: { text: 'eski-metin;' } }),
      JSON.stringify({ event: 'result', result: { status: 'SUCCESS', response: null } }),
      JSON.stringify({ event: 'step_update', step_update: {} }),
      'geçersiz-json',
      JSON.stringify({ event: 'result', result: { status: 'SUCCESS', response: 'yeni-metin' } }),
    ].join('\n') + '\n'
  );
  const karisikMetin = metinAyikla(logKarisik);
  k(karisikMetin === 'eski-metin;yeni-metin', `karışık logdan doğru parçalar ayıklanmalı, alınan: ${JSON.stringify(karisikMetin)}`);
}

// ---------------------------------------------------------------------------
// Vaka 2: mdk-hakem.mjs Antigravity hakem modeli ve commit regex uyumu
// ---------------------------------------------------------------------------
vaka('2. mdk-hakem.mjs: antigravity hakem çalışması, commit regex ve hakem.jsonl kaydı');
{
  const D = gecici('mdk-hakem-test-');
  const R = join(D, 'repo');
  const planMetni = `## Epic 1 — A
- Ana: antigravity
- [x] 1. İş
  - Kabul: bir; iki
  - Kapı: \`node t.test.mjs\`
`;
  depo(
    {
      'PLAN.md': planMetni,
      't.test.mjs': 'process.exit(0);\n',
    },
    { R }
  );

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
          agy_ek: ['--flag1'],
          gorevler: {
            hakem: ['agy/h1'],
          },
        },
      ],
    })
  );

  const AGY = join(D, 'sahte-agy.mjs');
  writeFileSync(
    AGY,
    `import fs from 'node:fs';
const A = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(join(D, 'agy-args.log'))}, A.join(' ') + '\\n');
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
  k(sonKayit.model === 'agy/h1', `kayıtta model agy/h1 olmalı, alınan: ${sonKayit.model}`);
  k(sonKayit.yazan === 'agy/yazan', `kayıtta yazan agy/yazan olmalı, alınan: ${sonKayit.yazan}`);
  k(sonKayit.hukum === 'gecti', `kayıtta hukum gecti olmalı, alınan: ${sonKayit.hukum}`);
  k(Array.isArray(sonKayit.olcutler) && sonKayit.olcutler.length === 2, 'iki ölçüt kaydedilmeli');
}

// ---------------------------------------------------------------------------
// Vaka 3: mdk-incele.mjs Antigravity inceleme modeli ve UYUM çıktısı
// ---------------------------------------------------------------------------
vaka('3. mdk-incele.mjs: antigravity diff inceleme ve UYUM: 92 çıktısı');
{
  const D = gecici('mdk-incele-test-');
  const R = join(D, 'repo');
  const planMetni = `## Epic 1 — A
- Ana: antigravity
- [x] 1. İş
  - Kabul: bir; iki
  - Ne: örnek iş yapıldı
  - Kapı: \`node t.test.mjs\`
`;
  depo(
    {
      'PLAN.md': planMetni,
      't.test.mjs': 'process.exit(0);\n',
    },
    { R }
  );

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
          gorevler: {
            inceleme: ['agy/i1'],
          },
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
}

// ---------------------------------------------------------------------------
// Vaka 4: mdk-karar.mjs MDK_ANA=antigravity ile karar modeli seçimi
// ---------------------------------------------------------------------------
vaka('4. mdk-karar.mjs: MDK_ANA=antigravity ve basarisizlik kararı');
{
  const D = gecici('mdk-karar-test-');
  const girdiYol = join(D, 'girdi.txt');
  writeFileSync(girdiYol, 'Hata çıktısı: AssertionError in test\\nAdım: 1\\n');

  const YUR = join(D, 'yurutuculer.json');
  writeFileSync(
    YUR,
    JSON.stringify({
      varsayilan: 'claude',
      liste: [
        {
          ad: 'antigravity',
          baslik: 'Antigravity',
          planlayici: ['agy', '-p', '{istem}'],
          gorevler: {
            karar: ['agy/k1'],
          },
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
    response: 'SEÇİM: kapi_yanlis\\nGEREKÇE: test hatalı'
  }
}));
`
  );

  const r = kos(join(KOK, 'mdk-karar.mjs'), ['basarisizlik', girdiYol], {
    cwd: D,
    env: {
      MDK_ANA: 'antigravity',
      MDK_YURUTUCULER: YUR,
      MDK_AGY: AGY,
      POLL: '1',
      ILK: '5',
      SURE: '10',
    },
  });

  k(r.kod === 0, `mdk-karar çıkış 0 olmalı, alınan: ${r.kod}`, r.cikti);
  let parsed = null;
  for (const s of r.cikti.split('\n')) {
    try {
      const j = JSON.parse(s.trim());
      if (j && j.secim) {
        parsed = j;
        break;
      }
    } catch {}
  }
  k(parsed !== null, 'stdout içinde JSON karar çıktısı bulunmalı', r.cikti);
  k(parsed?.secim === 'kapi_yanlis', `secim kapi_yanlis olmalı, alınan: ${parsed?.secim}`);
  k(parsed?.model === 'agy/k1', `model agy/k1 olmalı, alınan: ${parsed?.model}`);
  k(parsed?.varsayilan === false, `varsayilan false olmalı, alınan: ${parsed?.varsayilan}`);
  k(parsed?.gerekce === 'test hatalı', `gerekce "test hatalı" olmalı, alınan: ${parsed?.gerekce}`);
}

// ---------------------------------------------------------------------------
// Vaka 5: mdk-mcp.mjs mdk_epic ana işlemi ve deger doğrulaması
// ---------------------------------------------------------------------------
vaka('5. mdk-mcp.mjs: mdk_epic ana işlemi ve deger sınır durumu');
{
  const D = gecici('mdk-mcp-betik-');
  const K = gecici('mdk-mcp-proje-');
  writeFileSync(
    join(D, 'mdk-epic.mjs'),
    `import fs from 'node:fs';
const a = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(join(D, 'mdk-epic.mjs.argv'))}, a.join('\\n'));
console.log('tamam ' + a.join(' '));
`
  );

  function sunucuBaslat() {
    const c = spawn(process.execPath, [join(KOK, 'mdk-mcp.mjs')], {
      cwd: KOK,
      env: temizEnv({ MDK_PROJE: K, MDK_MCP_BETIK_DIZINI: D }),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const satir = [];
    let tampon = '', sayac = 0;
    c.stdout.on('data', (x) => {
      tampon += x;
      let i;
      while ((i = tampon.indexOf('\n')) >= 0) {
        satir.push(tampon.slice(0, i));
        tampon = tampon.slice(i + 1);
      }
    });
    const bekle = async (kosul, ms = 5000) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        for (const s of satir) {
          let o;
          try {
            o = JSON.parse(s);
          } catch {
            continue;
          }
          if (kosul(o)) return o;
        }
        await uyu(20);
      }
      return null;
    };
    const gonder = (o) => c.stdin.write(JSON.stringify(o) + '\n');
    return {
      cagir: (method, params = {}) => {
        const n = ++sayac;
        gonder({ jsonrpc: '2.0', id: n, method, params });
        return bekle((o) => o.id === n);
      },
      arac: (ad, arguments_) => {
        const n = ++sayac;
        gonder({ jsonrpc: '2.0', id: n, method: 'tools/call', params: { name: ad, arguments: arguments_ } });
        return bekle((o) => o.id === n);
      },
      kapat: () => {
        c.stdin.end();
        c.kill();
      },
    };
  }

  const s = sunucuBaslat();
  try {
    let o = await s.cagir('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '1' },
    });
    k(o?.result?.serverInfo?.name === 'mdk', 'initialize başarılı olmalı');

    // Başarılı durum: islem: 'ana', no: 1, deger: 'antigravity'
    o = await s.arac('mdk_epic', { islem: 'ana', no: 1, deger: 'antigravity' });
    k(!o?.result?.isError, `mdk_epic ana isError olmamalı, yanıt: ${JSON.stringify(o)}`);
    const icerik = oku(join(D, 'mdk-epic.mjs.argv')).trim().split('\n');
    k(
      JSON.stringify(icerik) === JSON.stringify(['ana', '1', 'antigravity']),
      `argv ['ana', '1', 'antigravity'] olmalı, alınan: ${icerik.join(' ')}`
    );

    // Hata / sınır durumu: deger eksik
    const oHata = await s.arac('mdk_epic', { islem: 'ana', no: 1 });
    const txt = oHata?.result?.content?.[0]?.text ?? '';
    k(oHata?.result?.isError === true, 'deger eksik olduğunda isError true olmalı');
    k(txt.includes('geçersiz argüman: deger'), `hata metninde "geçersiz argüman: deger" olmalı, alınan: ${txt}`);
  } finally {
    s.kapat();
  }
}

// ---------------------------------------------------------------------------
// Vaka 6: yurutuculer.json antigravity görev modelleri tanımı
// ---------------------------------------------------------------------------
vaka('6. yurutuculer.json: antigravity görev modelleri (hakem, inceleme, karar, persona)');
{
  const tanim = anaOku(join(KOK, 'yurutuculer.json'));
  const agy = anaBul(tanim, 'antigravity');
  k(Boolean(agy), 'yurutuculer.json içinde antigravity bulunmalı');
  const hakem = gorevModelleri(agy, 'hakem');
  const inceleme = gorevModelleri(agy, 'inceleme');
  const karar = gorevModelleri(agy, 'karar');
  const persona = gorevModelleri(agy, 'persona');

  k(
    Array.isArray(hakem) && hakem.includes('agy/gemini-3.8-flash-medium'),
    `antigravity.gorevler.hakem 'agy/gemini-3.8-flash-medium' içermeli, alınan: ${JSON.stringify(hakem)}`
  );
  k(
    Array.isArray(inceleme) && inceleme.includes('agy/gemini-3.8-flash-medium'),
    `antigravity.gorevler.inceleme 'agy/gemini-3.8-flash-medium' içermeli, alınan: ${JSON.stringify(inceleme)}`
  );
  k(
    Array.isArray(karar) && karar.includes('agy/gemini-3.8-flash-medium'),
    `antigravity.gorevler.karar 'agy/gemini-3.8-flash-medium' içermeli, alınan: ${JSON.stringify(karar)}`
  );
  k(
    Array.isArray(persona) && persona.includes('agy/gemini-3.8-flash-medium'),
    `antigravity.gorevler.persona 'agy/gemini-3.8-flash-medium' içermeli, alınan: ${JSON.stringify(persona)}`
  );
}

bitir();
