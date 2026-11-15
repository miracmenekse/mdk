// Antigravity uyum kapı testi (Story 192):
// A: olaylariTopla Antigravity stream-json (result usage, step_update DONE sayaç) ve opencode geriye uyumluluk.
// B: mdk-adim.mjs koşturucu (14290 gibi sayılar kota sayılmaz, RESOURCE_EXHAUSTED çıkış 6, eksik kapı antigravity modeline üretilir).
// C: mdk-kur.mjs kurulum (agy mcp add ile kayıt, mcp add hatasında çıkış 4, agy yoksa dosya yolu fallback).
// Kullanım: node test/agy-uyum.test.mjs

import assert from 'node:assert';
import { existsSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { KOK, commit, denetci, depo, gecici, git, kos, metrikler, oku, satirlar } from './yardim.mjs';
import { olaylariTopla } from '../mdk-ortak.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const KUR = join(KOK, 'mdk-kur.mjs');
const { vaka, kontrol, bitir } = denetci('agy-uyum.test');

function k(kosul, mesaj, ek = '') {
  try {
    assert.ok(kosul, mesaj);
    kontrol(true, mesaj);
  } catch (err) {
    kontrol(false, mesaj, ek || err.message);
  }
}

// ============================================================================
// A Vakası: olaylariTopla (mdk-ortak.mjs)
// ============================================================================
vaka('A.1 olaylariTopla agy stream-json token ve istek sayımı');
{
  const D = gecici('mdk-agy-olay-');
  const logAgy = join(D, 'agy.log');
  const satirlarAgy = [
    JSON.stringify({ event: 'init' }),
    JSON.stringify({
      event: 'step_update',
      step_update: {
        step_type: 'agent_response',
        state: 'DONE',
        usage: { input_tokens: 100, output_tokens: 5, cache_read_tokens: 40, total_tokens: 105 },
      },
    }),
    JSON.stringify({
      event: 'result',
      result: {
        status: 'SUCCESS',
        usage: { input_tokens: 300, output_tokens: 20, thinking_tokens: 0, cache_read_tokens: 100, total_tokens: 320 },
      },
    }),
  ];
  writeFileSync(logAgy, satirlarAgy.join('\n') + '\n');
  const sonuc = olaylariTopla(logAgy);
  k(sonuc.token === 320, `token 320 olmalı (yalnız result usage), alınan: ${sonuc.token}`);
  k(sonuc.etkin === 220, `etkin 220 olmalı (token - cache_read), alınan: ${sonuc.etkin}`);
  k(sonuc.istek >= 1, `istek >= 1 olmalı (agent_response DONE sayısı), alınan: ${sonuc.istek}`);
}

vaka('A.2 olaylariTopla opencode step_finish geriye uyumluluk');
{
  const D = gecici('mdk-opencode-olay-');
  const logOc = join(D, 'oc.log');
  writeFileSync(logOc, JSON.stringify({ type: 'step_finish', part: { tokens: { total: 50 }, cost: 0 } }) + '\n');
  const sonuc = olaylariTopla(logOc);
  k(sonuc.token === 50, `opencode step_finish total 50 için token 50 olmalı, alınan: ${sonuc.token}`);
}

// ============================================================================
// B Vakası: Koşturucu (mdk-adim.mjs) Antigravity uyumu
// ============================================================================
function setupB(planMetni, sahteAgyGovdesi) {
  const T = gecici('mdk-agy-adim-');
  const R = join(T, 'repo');
  depo({ 'PLAN.md': planMetni }, { R });

  const OC = join(T, 'opencode.mjs');
  writeFileSync(OC, "import fs from 'node:fs';\n");

  const AGY = join(T, 'agy.mjs');
  writeFileSync(
    AGY,
    `import fs from 'node:fs';
const A = process.argv.slice(2);
const ISTEM = A[A.length - 1] || '';
const T = ${JSON.stringify(T)};
const sayacYolu = T + '/agy-sayac';
const n = Number(fs.existsSync(sayacYolu) ? fs.readFileSync(sayacYolu, 'utf8') : 0) + 1;
fs.writeFileSync(sayacYolu, String(n));
fs.appendFileSync(T + '/agy-cagrilar.log', ISTEM + '\\n---CAGRI---\\n');
${sahteAgyGovdesi}
`
  );

  const YUR = join(T, 'yurutuculer.json');
  writeFileSync(
    YUR,
    JSON.stringify({
      varsayilan: 'claude',
      liste: [
        { ad: 'claude', baslik: 'Claude', planlayici: ['claude', '-p', '{istem}'] },
        {
          ad: 'antigravity',
          baslik: 'Antigravity',
          planlayici: ['agy', '-p', '{istem}'],
          agy_ek: ['--izin'],
          gorevler: { kod: ['agy/m1'], kapi: ['agy/m1'] },
        },
      ],
    })
  );

  commit(R);
  return { T, R, OC, AGY, YUR };
}

function kosuB({ T, R, OC, AGY, YUR }, adim = '1', ekEnv = {}) {
  const env = {
    STUB_DIR: T,
    MDK_OPENCODE: OC,
    MDK_AGY: AGY,
    MDK_YURUTUCULER: YUR,
    MDK_ANA: '',
    POLL: '1',
    DENEME: '1',
    SURE: '30',
    ILK: '20',
    MDK_KILIT: join(T, 'kilit'),
    ...ekEnv,
  };
  return kos(RUNNER, [adim], { cwd: R, env });
}

vaka('B.1 sahte agy 14290 token basar, 429 sayısı kota sayılmaz, çıkış 0, metrik token 14290');
{
  const plan = `Yürütücü: opencode
Görev kod: m/oc

## Epic 1 — A
- Ana: antigravity
- [ ] 1. İş A
  - Kapı: \`node -e "process.exit(require('fs').existsSync('cikti.txt')?0:1)"\`
`;
  const govde = `
fs.writeFileSync('cikti.txt', 'tamam\\n');
console.log(JSON.stringify({
  event: 'result',
  result: {
    status: 'SUCCESS',
    usage: { input_tokens: 14290, total_tokens: 14290 },
  },
}));
`;
  const ctx = setupB(plan, govde);
  const son = kosuB(ctx, '1');
  k(son.kod === 0, `çıkış 0 olmalı (429 içeren sayı kota sayılmamalı), alınan: ${son.kod}`, son.cikti);
  const m = metrikler(join(ctx.R, 'metrikler.jsonl'));
  const sonMetrik = m.at(-1) || {};
  k(sonMetrik.token === 14290, `metrikte token 14290 olmalı, alınan: ${sonMetrik.token}`);
}

vaka('B.2 sahte agy stderr RESOURCE_EXHAUSTED basıp çıkarsa çıkış 6');
{
  const plan = `Yürütücü: opencode
Görev kod: m/oc

## Epic 1 — A
- Ana: antigravity
- [ ] 1. İş A
  - Kapı: \`node -e "process.exit(require('fs').existsSync('cikti.txt')?0:1)"\`
`;
  const govde = `
process.stderr.write('RESOURCE_EXHAUSTED\\n');
process.exit(1);
`;
  const ctx = setupB(plan, govde);
  const son = kosuB(ctx, '1');
  k(son.kod === 6, `çıkış 6 olmalı (RESOURCE_EXHAUSTED kota hatası), alınan: ${son.kod}`, son.cikti);
}

vaka('B.3 adım kapısı diskte yok ve PLAN Görev kapi yok: kapiUret antigravity ile kırmızı kapı üretip commit eder, çıkış 0');
{
  const plan = `Yürütücü: opencode
Görev kod: m/oc

## Epic 1 — A
- Ana: antigravity
- [ ] 1. İş A
  - Kapı: \`node kapi/k.test.mjs\`
`;
  const govde = `
if (ISTEM.includes('KAPI ÜRETME')) { // kapı üretim istemi (mdk-adim-kapi.mjs); kod isteminde de kapı yolu geçtiği için yol değil görev başlığı aranır
  fs.mkdirSync('kapi', { recursive: true });
  fs.writeFileSync('kapi/k.test.mjs', "import { existsSync } from 'node:fs'; process.exit(existsSync('cikti.txt') ? 0 : 1);\\n");
} else {
  fs.writeFileSync('cikti.txt', 'tamam\\n');
}
console.log(JSON.stringify({
  event: 'result',
  result: {
    status: 'SUCCESS',
    usage: { total_tokens: 100 },
  },
}));
`;
  const ctx = setupB(plan, govde);
  const son = kosuB(ctx, '1');
  k(son.kod === 0, `çıkış 0 olmalı, alınan: ${son.kod}`, son.cikti);
  const cagriSayisi = Number(oku(join(ctx.T, 'agy-sayac')) || 0);
  k(cagriSayisi >= 2, `sahte agy en az 2 kez çağrılmalı (kapı üretimi + kodlama), alınan: ${cagriSayisi}`);
  const commitVar = git(ctx.R, 'cat-file', '-e', 'HEAD:kapi/k.test.mjs').status === 0;
  k(commitVar, 'kapi/k.test.mjs commit edilmiş olmalı');
}

// ============================================================================
// C Vakası: Kurulum (mdk-kur.mjs) Antigravity MCP kaydı
// ============================================================================
vaka('C.4 mdk-kur.mjs agy mcp add ile kaydeder, MDK_AGY_MCP dosyası oluşturmaz');
{
  const D = gecici('mdk-agy-kur-');
  const agyLog = join(D, 'agy-argv.log');
  const sahteAgy = join(D, 'agy.mjs');
  writeFileSync(
    sahteAgy,
    `import fs from 'node:fs';
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(agyLog)}, args.join(' ') + '\\n');
process.exit(0);
`
  );
  const proje = depo({}, { R: join(D, 'ornek-proje') });
  const agyMcpYolu = join(D, 'mcp_config.json');

  const r = kos(KUR, [proje], { env: { MDK_AGY: sahteAgy, MDK_AGY_MCP: agyMcpYolu } });
  k(r.kod === 0, `kurulum çıkış 0 olmalı, alınan: ${r.kod}`, r.cikti);
  const logSatirlari = satirlar(agyLog);
  k(logSatirlari.some((s) => s.trim() === 'mcp list'), 'agy-argv.log mcp list içermeli');
  const projeKlasor = basename(proje);
  const addSatiri = logSatirlari.find((s) => s.startsWith(`mcp add --env MDK_PROJE=${proje}`));
  k(
    !!addSatiri && addSatiri.includes(`mdk-${projeKlasor}`) && addSatiri.includes('mdk-mcp.mjs'),
    `agy-argv.log mcp add --env MDK_PROJE=... mdk-${projeKlasor} ve mdk-mcp.mjs içermeli, alınan: ${addSatiri || ''}`
  );
  k(!existsSync(agyMcpYolu), 'MDK_AGY_MCP dosyası oluşmamalı');
}

vaka('C.5 sahte agy mcp add başarısız (çıkış 1) olursa kurulum çıkış 4 verir');
{
  const D = gecici('mdk-agy-kur-hata-');
  const sahteAgy = join(D, 'agy.mjs');
  writeFileSync(
    sahteAgy,
    `const args = process.argv.slice(2);
if (args[0] === 'mcp' && args[1] === 'add') {
  process.stderr.write('mcp add basarisiz\\n');
  process.exit(1);
}
process.exit(0);
`
  );
  const proje = depo({}, { R: join(D, 'hata-proje') });
  const agyMcpYolu = join(D, 'mcp_config.json');

  const r = kos(KUR, [proje], { env: { MDK_AGY: sahteAgy, MDK_AGY_MCP: agyMcpYolu } });
  k(r.kod === 4, `mcp add hatasında kurulum çıkış 4 olmalı, alınan: ${r.kod}`, r.cikti);
}

vaka('C.6 MDK_AGY çalıştırılamayan yolsa eski davranış sürer: MDK_AGY_MCP dosyası yazılır');
{
  const D = gecici('mdk-agy-kur-fallback-');
  const proje = depo({}, { R: join(D, 'eski-proje') });
  const olmayanAgy = join(D, 'olmayan-agy.mjs');
  const agyMcpYolu = join(D, 'mcp_config.json');

  const r = kos(KUR, [proje], { env: { MDK_AGY: olmayanAgy, MDK_AGY_MCP: agyMcpYolu } });
  k(r.kod === 0, `çıkış 0 olmalı, alınan: ${r.kod}`, r.cikti);
  k(existsSync(agyMcpYolu), 'MDK_AGY_MCP dosyası yazılmış olmalı');
}

bitir();
