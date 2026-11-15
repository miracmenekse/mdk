// mdk-rol.mjs testi: kodcu (kapı, kurcalama, geri alma, ana yürütücü ve model seçimi) ve tasarımcı; sahte claude/agy ile geçici git deposunda, ağsız.
import { KOK, commit, denetci, depo, existsSync, gecici, git, join, kos, metrikler, oku, writeFileSync } from './yardim.mjs';

const RUNNER = join(KOK, 'mdk-rol.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-rol.test');

// Ana yürütücü adları 2+ karakter: mdk-kayit.mjs tek harfli adı reddeder (YURUTUCU_DESEN)
const KAPI = `node -e "process.exit(require('fs').existsSync('cikti.txt')?0:1)"`;
const PLAN = ['Kurallar (tüm adımlar için):', '- Kapı dosyalarına dokunma.', '', '## Epic 1 — A', '- [ ] 1. İş', '  - Kapı: `' + KAPI + '`', ''].join('\n');
const YUR = {
  varsayilan: 'cc',
  liste: [
    { ad: 'cc', baslik: 'Test claude', planlayici: ['claude', '-p', '{istem}'], roller: { kodcu: 'claude/ucuz', tasarimci: 'claude/tas' } },
    { ad: 'gg', baslik: 'Test agy', planlayici: ['agy', '-p', '{istem}'], agy_ek: ['--ek'], roller: { kodcu: 'agy/varsayilan', tasarimci: 'agy/varsayilan' } },
  ],
};

// sahte claude/agy: argümanlarını <T>/argv-<ad> dosyasına yazar; SAHTE_DAVRANIS'a göre dosya üretir
function sahte(T, ad) {
  const yol = join(T, `${ad}.mjs`);
  writeFileSync(yol, `import fs from 'node:fs';
const D = process.env.STUB_DIR, A = process.argv.slice(2), d = process.env.SAHTE_DAVRANIS || '';
fs.writeFileSync(D + '/argv-${ad}', JSON.stringify(A));
if (d === 'kapi') fs.writeFileSync('cikti.txt', 'tamam');
if (d === 'kurcalama') { fs.mkdirSync('test', { recursive: true }); fs.writeFileSync('test/x.test.mjs', 'x'); fs.writeFileSync('cikti.txt', 'tamam'); }
if (d === 'tas') { fs.writeFileSync('tasarim.md', 'taslak'); fs.writeFileSync('yan.txt', 'yan'); }
`);
  return yol;
}

function kur(plan = PLAN) {
  const T = gecici(), R = join(T, 'proje');
  const yur = join(T, 'yur.json');
  writeFileSync(yur, JSON.stringify(YUR));
  const claude = sahte(T, 'claude'), agy = sahte(T, 'agy');
  depo({ 'PLAN.md': plan, 'ekran.md': 'Giriş ekranı\n' }, { R });
  commit(R, 'ilk');
  return { T, R, env: { STUB_DIR: T, MDK_CLAUDE: claude, MDK_AGY: agy, MDK_YURUTUCULER: yur, ILK: '30', SURE: '60' } };
}
const calistir = (E, args, ek = {}) => kos(RUNNER, args, { cwd: E.R, env: { ...E.env, ...ek } });
const planOku = (E) => oku(join(E.R, 'PLAN.md'));
const head = (E) => git(E.R, 'rev-parse', 'HEAD').stdout.trim();
const argv = (E, ad) => { const t = oku(join(E.T, `argv-${ad}`)); return t ? JSON.parse(t) : null; };
const sonKayit = (E) => metrikler(join(E.R, 'metrikler.jsonl')).at(-1) ?? {};
const konu = (E) => git(E.R, 'log', '-1', '--format=%s').stdout.trim();

// (1) kodcu başarılı: kapı yeşil, PLAN işaretli, commit konusu, argv ve istem, metrik
vaka('1 kodcu başarılı');
let E = kur();
let s = calistir(E, ['kodcu', '1'], { SAHTE_DAVRANIS: 'kapi' });
kontrol(s.kod === 0, 'çıkış 0', s.cikti);
kontrol(planOku(E).includes('- [x] 1. İş'), "PLAN'da - [x] 1.");
kontrol(konu(E) === 'adım 1: İş (claude/ucuz, rol kodcu)', 'commit konusu', konu(E));
const a1 = argv(E, 'claude') ?? [];
kontrol(a1.includes('-p') && a1[a1.indexOf('--model') + 1] === 'ucuz', 'argv: -p ve --model ucuz', JSON.stringify(a1).slice(0, 300));
const i1 = a1.at(-1) ?? '';
kontrol(i1.includes('İş') && i1.includes('Kurallar'), 'istem İş ve Kurallar içerir');
kontrol(sonKayit(E).yurutucu === 'cc' && sonKayit(E).gecti === true, 'metrik yurutucu cc, gecti true', JSON.stringify(sonKayit(E)));

// (2) model yazmadı: kapı kırmızı, geri alma, PLAN aynı, ağaç temiz
vaka('2 yazmadı: kapı kırmızı');
E = kur();
const h2 = head(E);
s = calistir(E, ['kodcu', '1']);
kontrol(s.kod === 1, 'çıkış 1', s.cikti);
kontrol(planOku(E).includes('- [ ] 1. İş'), "PLAN'da hâlâ - [ ] 1.");
kontrol(head(E) === h2, 'HEAD değişmedi');
kontrol(git(E.R, 'status', '--porcelain').stdout.trim() === '', 'ağaç temiz');
kontrol(sonKayit(E).gecti === false && sonKayit(E).neden === 'kapi', 'metrik neden kapi', JSON.stringify(sonKayit(E)));

// (3) kapı dosyası eklendi: kurcalama, geri alma
vaka('3 kurcalama: test dosyası eklendi');
E = kur();
const h3 = head(E);
s = calistir(E, ['kodcu', '1'], { SAHTE_DAVRANIS: 'kurcalama' });
kontrol(s.kod === 1, 'çıkış 1', s.cikti);
kontrol(!existsSync(join(E.R, 'test', 'x.test.mjs')), 'test dosyası geri alındı');
kontrol(head(E) === h3 && planOku(E).includes('- [ ] 1.'), 'HEAD ve PLAN değişmedi');
kontrol(sonKayit(E).neden === 'kurcalama', 'metrik neden kurcalama', JSON.stringify(sonKayit(E)));

// (4) MDK_ANA=gg: agy çağrılır, --model yok, --ek var
vaka('4 MDK_ANA=gg agy');
E = kur();
s = calistir(E, ['kodcu', '1'], { MDK_ANA: 'gg', SAHTE_DAVRANIS: 'kapi' });
kontrol(s.kod === 0, 'çıkış 0', s.cikti);
const a4 = argv(E, 'agy') ?? [];
kontrol(a4.includes('-p') && a4.includes('--ek') && !a4.includes('--model'), 'agy argv: -p, --ek, --model yok', JSON.stringify(a4).slice(0, 300));
kontrol(argv(E, 'claude') === null, 'claude çağrılmadı');
kontrol(konu(E) === 'adım 1: İş (agy/varsayilan, rol kodcu)', 'commit konusu agy', konu(E));
kontrol(sonKayit(E).yurutucu === 'gg', 'metrik yurutucu gg', JSON.stringify(sonKayit(E)));

// (5) ön koşullar: model çağrılmadan çıkış 4 ya da 0
vaka('5a kirli ağaç');
E = kur();
writeFileSync(join(E.R, 'kirli.txt'), 'x');
s = calistir(E, ['kodcu', '1'], { SAHTE_DAVRANIS: 'kapi' });
kontrol(s.kod === 4, 'çıkış 4', s.cikti);
kontrol(argv(E, 'claude') === null, 'model çağrılmadı');

vaka('5b adım yok');
E = kur();
s = calistir(E, ['kodcu', '9']);
kontrol(s.kod === 4, 'çıkış 4', s.cikti);
kontrol(argv(E, 'claude') === null, 'model çağrılmadı');

vaka('5c adım zaten bitmiş');
E = kur(PLAN.replace('- [ ] 1.', '- [x] 1.'));
s = calistir(E, ['kodcu', '1']);
kontrol(s.kod === 0 && s.cikti.includes('zaten bitmiş'), 'çıkış 0 ve zaten bitmiş', s.cikti);
kontrol(argv(E, 'claude') === null, 'model çağrılmadı');

vaka('5d Kapı yok');
E = kur(['Kurallar (tüm adımlar için):', '- Kapı dosyalarına dokunma.', '', '## Epic 1 — A', '- [ ] 1. İş', ''].join('\n'));
s = calistir(E, ['kodcu', '1']);
kontrol(s.kod === 4, 'çıkış 4', s.cikti);
kontrol(argv(E, 'claude') === null, 'model çağrılmadı');

// (6) tasarımcı: yazdı → yalnız tasarim.md commit; yazmadı → çıkış 1
vaka('6 tasarımcı yazdı');
E = kur();
s = calistir(E, ['tasarimci', 'ekran.md'], { SAHTE_DAVRANIS: 'tas' });
kontrol(s.kod === 0, 'çıkış 0', s.cikti);
const son6 = git(E.R, 'show', '--name-only', '--format=', 'HEAD').stdout.trim().split('\n').filter(Boolean);
kontrol(JSON.stringify(son6) === '["tasarim.md"]', 'son commit yalnız tasarim.md', JSON.stringify(son6));
const a6 = argv(E, 'claude') ?? [];
kontrol(a6[a6.indexOf('--model') + 1] === 'tas', 'argv --model tas', JSON.stringify(a6).slice(0, 300));
kontrol((a6.at(-1) ?? '').includes('Giriş ekranı'), 'istem Giriş ekranı içerir');

vaka('6b tasarımcı yazmadı');
E = kur();
s = calistir(E, ['tasarimci', 'ekran.md']);
kontrol(s.kod === 1, 'çıkış 1', s.cikti);

// (7) bilinmeyen önek → 4; argümansız → 2
vaka('7 bilinmeyen önek ve argüman hatası');
const T7 = gecici(), yur7 = join(T7, 'yur.json');
writeFileSync(yur7, JSON.stringify({ varsayilan: 'cc', liste: [{ ad: 'cc', planlayici: ['x'], roller: { kodcu: 'x/y', tasarimci: 'claude/tas' } }] }));
E = kur();
s = calistir(E, ['kodcu', '1'], { MDK_YURUTUCULER: yur7 });
kontrol(s.kod === 4, 'bilinmeyen önek çıkış 4', s.cikti);
kontrol(argv(E, 'claude') === null, 'model çağrılmadı');
s = calistir(E, []);
kontrol(s.kod === 2, 'argümansız çıkış 2', s.cikti);

bitir();
