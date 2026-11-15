// mdk-ana.mjs testi: yurutuculer.json okuma, ana yürütücü seçimi, planlayıcı komutu, rol modelleri, CLI; kayıt aracı adı kabulü.
import { KOK, denetci, existsSync, gecici, join, kos, oku, writeFileSync } from './yardim.mjs';
import { anaBul, anaOku, anaSec, epicAnasi, gorevModelleri, planlayiciKomutu, rolModeli } from '../mdk-ana.mjs';

const CLI = join(KOK, 'mdk-ana.mjs');
const KAYIT = join(KOK, 'mdk-kayit.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-ana.test');

// (1) depodaki gerçek yurutuculer.json
vaka('1 gerçek yapılandırma');
const gercek = anaOku(join(KOK, 'yurutuculer.json'));
kontrol(gercek.varsayilan === 'claude', 'varsayılan claude', JSON.stringify(gercek));
const claude = anaBul(gercek, 'claude');
const antigravity = anaBul(gercek, 'antigravity');
kontrol(!!claude, 'claude tanımlı');
kontrol(!!antigravity, 'antigravity tanımlı');
kontrol(Array.isArray(antigravity?.gorevler?.kod) && antigravity.gorevler.kod.length > 0, 'antigravity gorevler.kod dolu');
kontrol(claude && gorevModelleri(claude, 'kod') === null, 'claude gorevler.kod yok (null)');
kontrol(rolModeli(claude, 'kodcu') === 'claude/haiku', 'claude kodcu claude/haiku');

// (2) bozuk ve olmayan dosya
vaka('2 bozuk ve olmayan dosya');
const T = gecici();
const bozuk = join(T, 'bozuk.json');
writeFileSync(bozuk, '{bozuk json');
const b = anaOku(bozuk);
kontrol(Array.isArray(b.liste) && b.liste.length === 0 && b.varsayilan === 'claude', 'bozuk → liste [] varsayılan claude', JSON.stringify(b));
const yok = anaOku(join(T, 'yok.json'));
kontrol(Array.isArray(yok.liste) && yok.liste.length === 0 && yok.varsayilan === 'claude', 'olmayan → liste [] varsayılan claude', JSON.stringify(yok));

// (3) epicAnasi
vaka('3 Epic ana yürütücüsü');
const plan = [
  '## Epic 5 — A',
  '- Ana: antigravity',
  '- [ ] 10. x',
  '  - Ne: a',
  '',
  '## Epic 6 — B',
  '- [ ] 11. y',
  '  - Ne: b',
  '',
].join('\n');
kontrol(epicAnasi(plan, 10) === 'antigravity', 'adım 10 → antigravity', String(epicAnasi(plan, 10)));
kontrol(epicAnasi(plan, 11) === null, 'adım 11 → null', String(epicAnasi(plan, 11)));

// (4) anaSec
vaka('4 anaSec önceliği');
const tanim = { varsayilan: 'claude', liste: [claude, antigravity] };
kontrol(anaSec(tanim, { plan, adimNo: 10, env: {} })?.ad === 'antigravity', 'env boş + adım 10 → antigravity');
kontrol(anaSec(tanim, { plan, adimNo: 11, env: {} })?.ad === 'claude', 'env boş + adım 11 → claude');
kontrol(anaSec(tanim, { plan, adimNo: 10, env: { MDK_ANA: 'claude' } })?.ad === 'claude', 'MDK_ANA claude → claude');
let hata = null;
try { anaSec(tanim, { plan, adimNo: 10, env: { MDK_ANA: 'yok' } }); } catch (e) { hata = e; }
kontrol(hata !== null && /tanınmayan ana yürütücü: yok/.test(hata.message), 'MDK_ANA yok → tanınmayan ana yürütücü: yok', String(hata?.message));

// (5) planlayiciKomutu
vaka('5 planlayıcı komutu');
const [k5, a5] = planlayiciKomutu({ planlayici: ['x', '-p', '{istem}', '--y'] }, 'merhaba');
kontrol(k5 === 'x' && JSON.stringify(a5) === JSON.stringify(['-p', 'merhaba', '--y']), 'x -p merhaba --y', JSON.stringify([k5, a5]));
const [k5b, a5b] = planlayiciKomutu({ planlayici: ['x', '-p'] }, 'merhaba');
kontrol(k5b === 'x' && JSON.stringify(a5b) === JSON.stringify(['-p', 'merhaba']), 'istem sona eklenir', JSON.stringify([k5b, a5b]));

// (6) CLI
vaka('6 CLI');
let r = kos(CLI, ['liste'], { cwd: KOK });
kontrol(r.kod === 0, 'liste çıkış 0', r.cikti);
kontrol(/claude/.test(r.cikti) && /\(varsayılan\)/.test(r.cikti), 'liste claude ve (varsayılan)', r.cikti);
r = kos(CLI, ['goster', 'antigravity'], { cwd: KOK });
let json = null;
try { json = JSON.parse(r.cikti); } catch { /* aşağıda kontrol */ }
kontrol(r.kod === 0 && json && json.ad === 'antigravity', 'goster antigravity JSON', r.cikti);
r = kos(CLI, ['goster', 'yok'], { cwd: KOK });
kontrol(r.kod === 4, 'goster yok çıkış 4', String(r.kod));
r = kos(CLI, [], { cwd: KOK });
kontrol(r.kod === 2, 'argümansız çıkış 2', String(r.kod));

// (7) kayıt aracı yeni ana adını kabul eder, geçersiz adı reddeder
vaka('7 kayıt aracı ana adı');
const D = gecici();
r = kos(KAYIT, ['1', '--yurutucu', 'antigravity', '--model', 'agy/x', '--gecti', 'true', '--dizin', D], { cwd: KOK });
kontrol(r.kod === 0, 'antigravity kabul, çıkış 0', r.cikti);
const satirlar = oku(join(D, 'metrikler.jsonl')).split('\n').filter(Boolean);
const son = satirlar.length ? JSON.parse(satirlar[satirlar.length - 1]) : {};
kontrol(son.yurutucu === 'antigravity', 'metrik yurutucu antigravity', oku(join(D, 'metrikler.jsonl')));
r = kos(KAYIT, ['1', '--yurutucu', 'Kötü Ad', '--model', 'x', '--gecti', 'true', '--dizin', D], { cwd: KOK });
kontrol(r.kod !== 0, 'Kötü Ad reddedilir (çıkış sıfırdan farklı)', r.cikti);

bitir();
