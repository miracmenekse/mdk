// Adım 177 kapısı: hakem hükmü story bitince kendiliğinden alınır ve kartta görünür.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KOK, commit, denetci, depo, gecici, git, kos, oku, readFileSync, stub, uyu, writeFileSync as wf } from './yardim.mjs';
import { snapshot } from '../panel/durum.mjs';
import { drawerHtml, drawerImza } from '../panel/ciz.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const { vaka, kontrol, bitir } = denetci('hakem-kanca.test');

const VAR = (f) => `node -e "process.exit(require('fs').existsSync('${f}')?0:1)"`;
const KAPI = `  - Kapı: \`${VAR('cikti.txt')}\`\n  - Kabul: bir; iki`;
const KAPI_NO_KABUL = `  - Kapı: \`${VAR('cikti.txt')}\``;
const YAZ = "yaz('cikti.txt', 'x\\n');";

const plan = (m, adim) => `Yürütücü: opencode\nModeller: ${m}\nGörev hakem: m/h\n\n## K\n- [ ] 1. İş\n${adim}\n`;
const planNoHakem = (m, adim) => `Yürütücü: opencode\nModeller: ${m}\n\n## K\n- [ ] 1. İş\n${adim}\n`;

let T, R, CP, OC, SELFDIR, SON;
function makeFakeHakem(dir) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'mdk-hakem.mjs'), `import fs from 'node:fs';
const D = process.env.STUB_DIR;
const mode = process.env.FAKE_HAKEM_MODE || 'gecmedi';
const sayac = D + '/hakem-sayac';
const n = Number(fs.existsSync(sayac) ? fs.readFileSync(sayac, 'utf8') : 0) + 1;
fs.writeFileSync(sayac, String(n));
const N = process.argv[2];
if (mode === 'gecmedi' || mode === 'gecti') {
  const hukum = mode === 'gecmedi' ? 'gecmedi' : 'gecti';
  const olcutler = mode === 'gecmedi'
    ? [{ no: 1, metin: 'bir', sonuc: 'gecti', gerekce: 'a' }, { no: 2, metin: 'iki', sonuc: 'gecmedi', gerekce: 'eksik kaldı' }]
    : [{ no: 1, metin: 'bir', sonuc: 'gecti', gerekce: 'a' }, { no: 2, metin: 'iki', sonuc: 'gecti', gerekce: 'b' }];
  const kayit = { ts: new Date().toISOString(), adim: Number(N), model: 'm/h', hukum, olcutler };
  fs.appendFileSync('hakem.jsonl', JSON.stringify(kayit) + '\\n');
}
process.exit(mode === 'exit2' ? 2 : 0);
`);
}
function setup(planMetni, govde, stubOpt) {
  T = gecici();
  R = join(T, 'repo');
  depo({ 'PLAN.md': planMetni }, { R });
  OC = stub(T, govde, stubOpt);
  SELFDIR = join(T, 'self');
  makeFakeHakem(SELFDIR);
}
const commit0 = () => { CP = commit(R); };
const ortam = (ek = {}) => ({ STUB_DIR: T, MDK_OPENCODE: OC, MDK_SELF_DIR: SELFDIR, POLL: '1', DENEME: '1', SURE: '30', MDK_KILIT: join(T, 'kilit'), ...ek });
function kosu(ek = {}) { SON = kos(RUNNER, ['1'], { cwd: R, env: ortam(ek) }); return SON; }
const p = (f) => oku(join(R, f));

// (1)
vaka('runner_gecmedi');
setup(plan('m/a', KAPI), YAZ);
commit0();
kosu({ FAKE_HAKEM_MODE: 'gecmedi' });
kontrol(SON.kod === 0, 'çıkış 0', SON.cikti);
kontrol(/^- \[x\] 1\./m.test(p('PLAN.md')), '[x]', SON.cikti);
kontrol(SON.cikti.includes('UYARI: hakem "geçmedi" dedi'), 'uyarı', SON.cikti);
kontrol(SON.cikti.includes('iki'), 'iki', SON.cikti);
kontrol(SON.cikti.includes('eksik kaldı'), 'gerekçe', SON.cikti);
kontrol(oku(join(T, 'hakem-sayac')) === '1', 'sayaç 1', SON.cikti);

// (2)
vaka('runner_gecti');
setup(plan('m/a', KAPI), YAZ);
commit0();
kosu({ FAKE_HAKEM_MODE: 'gecti' });
kontrol(SON.kod === 0, 'çıkış 0', SON.cikti);
kontrol(!SON.cikti.includes('UYARI: hakem'), 'uyarı yok', SON.cikti);
kontrol(SON.cikti.includes('hakem: geçti'), 'geçti', SON.cikti);

// (3)
vaka('runner_exit2');
setup(plan('m/a', KAPI), YAZ);
commit0();
kosu({ FAKE_HAKEM_MODE: 'exit2' });
kontrol(SON.kod === 0, 'çıkış 0', SON.cikti);
kontrol(SON.cikti.includes('hüküm alınamadı'), 'alınamadı', SON.cikti);

// (4)
vaka('runner_no_hakem');
setup(planNoHakem('m/a', KAPI), YAZ);
commit0();
kosu({ FAKE_HAKEM_MODE: 'gecmedi' });
kontrol(!existsSync(join(T, 'hakem-sayac')), 'sayaç yok', SON.cikti);

// (5)
vaka('runner_no_kabul');
setup(plan('m/a', KAPI_NO_KABUL), YAZ);
commit0();
kosu({ FAKE_HAKEM_MODE: 'gecmedi' });
kontrol(!existsSync(join(T, 'hakem-sayac')), 'sayaç yok', SON.cikti);

// (6)
vaka('runner_mdk_hakem_0');
setup(plan('m/a', KAPI), YAZ);
commit0();
kosu({ FAKE_HAKEM_MODE: 'gecmedi', MDK_HAKEM: '0' });
kontrol(!existsSync(join(T, 'hakem-sayac')), 'sayaç yok', SON.cikti);

// (7) panel durum
vaka('panel_durum');
{
  const d = gecici('hakem-durum-');
  writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n- [ ] 2. İş2\n  - Kapı: `true`\n');
  const r1a = { ts: 1, adim: 1, model: 'a/x', hukum: 'gecti' };
  const r1b = { ts: 2, adim: 1, model: 'a/x', hukum: 'gecmedi' };
  const r2 = { ts: 3, adim: 2, model: 'a/x', hukum: 'gecti' };
  writeFileSync(join(d, 'hakem.jsonl'), [JSON.stringify(r1a), 'bozuk satır', JSON.stringify(r1b), JSON.stringify(r2)].join('\n') + '\n');
  const s = snapshot(d);
  kontrol(Object.prototype.hasOwnProperty.call(s, 'hakem'), 'hakem alanı var', '');
  assert.deepStrictEqual(s.hakem[1], r1b);
  assert.ok(s.hakem[2], 'adım 2 kaydı var');
  const d2 = gecici('hakem-durum-');
  writeFileSync(join(d2, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
  const s2 = snapshot(d2);
  assert.deepStrictEqual(s2.hakem, {});
}

// (8) drawerHtml işaretler
vaka('panel_drawer');
{
  const h = drawerHtml({ no: 1, kabul: ['bir', 'iki'], hakem: { hukum: 'gecmedi', model: 'm/h', olcutler: [{ no: 1, sonuc: 'gecti', gerekce: 'iyi' }, { no: 2, sonuc: 'gecmedi', gerekce: 'eksik <x>' }] } });
  kontrol(h.includes('hakem: geçmedi'), 'geçmedi', h);
  kontrol(h.includes('m/h'), 'model', h);
  const lis = h.split('<li>').slice(1);
  kontrol(lis.length >= 2 && lis[0].includes('✓'), 'birinci ✓', h);
  kontrol(lis.length >= 2 && lis[1].includes('✗'), 'ikinci ✗', h);
  kontrol(h.includes('eksik &lt;x&gt;'), 'gerekçe kaçışı', h);
}

// (9) hakem yok
vaka('panel_yok');
{
  const h = drawerHtml({ no: 1, kabul: ['bir'] });
  kontrol(!h.includes('hakem'), 'hakem sözcüğü yok', h);
}

// (10) drawerImza
vaka('panel_imza');
{
  const etki = { figma: null, onay: false, bitti: false, karar: null, alindi: false };
  const a = { persona: null, bitti: true, kabul: ['x'], hakem: { ts: 1 } };
  const b = { persona: null, bitti: true, kabul: ['x'], hakem: { ts: 2 } };
  kontrol(drawerImza(a, etki) !== drawerImza(b, etki), 'ts değişince imza değişir', '');
}

bitir();