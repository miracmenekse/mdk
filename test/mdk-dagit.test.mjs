// Dağıtıcı (mdk-dagit.mjs) kapı testi: kira, Epic/dosya çakışması, süre dolumu, birleştirme ve geri alma.
// Geçici depo, geçici MDK_YURUTUCULER, MDK_WT_KOK ve MDK_KILIT kullanır; gerçek ~/.cache'e yazmaz.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { denetci, depo, commit, git, gecici, kos, oku, KOK } from './yardim.mjs';

const d = denetci('mdk-dagit');
const DAGIT = join(KOK, 'mdk-dagit.mjs');
const EPIC = join(KOK, 'mdk-epic.mjs');

const PLAN0 = `# Plan

## Epic 1 — A
- [ ] 1. x
  - Ne: \`a.mjs:1-5\`

## Epic 2 — B
- [ ] 2. y
  - Ne: \`a.mjs:9-12\` ve \`b.mjs\`

## Epic 3 — C
- [ ] 3. z
  - Ne: \`c.mjs\`
`;

const T = gecici('dagit-');
const YUR = join(T, 'yurutuculer.json');
const WT = join(T, 'wt');
const KILIT = join(T, 'kilit');
mkdirSync(WT, { recursive: true });
mkdirSync(KILIT, { recursive: true });
writeFileSync(YUR, JSON.stringify({
  varsayilan: 'claude',
  liste: [
    { ad: 'claude', baslik: 'Claude', planlayici: ['claude', '-p', '{istem}'] },
    { ad: 'antigravity', baslik: 'Antigravity', planlayici: ['agy', '-p', '{istem}'] },
  ],
}));

const R = depo({
  'PLAN.md': PLAN0,
  'a.mjs': '', 'b.mjs': '', 'c.mjs': '',
}, { R: join(T, 'repo') });
commit(R, 'ilk');

const ENV = { MDK_YURUTUCULER: YUR, MDK_WT_KOK: WT, MDK_KILIT: KILIT };
const run = (args, env = {}) => kos(DAGIT, args, { cwd: R, env: { ...ENV, ...env } });
const plan = () => oku(join(R, 'PLAN.md'));
const kiraDosya = (no) => join(R, '.mdk-log', 'kira', `${no}.json`);
const kiraOku = (no) => { try { return JSON.parse(oku(kiraDosya(no))); } catch { return null; } };
const wtYol = (ana) => join(WT, `${basename(R)}-${ana}`);

// 1. Ana yürütücü tanınmıyorsa ya da Epic yoksa 4
d.vaka('kirala: tanınmayan ana ya da Epic yok → 4');
let r = run(['kirala', '1', 'yok']);
d.kontrol(r.kod === 4, 'tanınmayan ana için çıkış 4 olmalı', r.cikti);
r = run(['kirala', '99', 'claude']);
d.kontrol(r.kod === 4, 'olmayan Epic için çıkış 4 olmalı', r.cikti);
d.kontrol(!existsSync(kiraDosya(1)) && !existsSync(kiraDosya(99)), 'hatalı istekte kira dosyası oluşmamalı');

// 2. Kiralama: PLAN'a Ana satırı commit edilir, kira dosyası ve worktree açılır
d.vaka('kirala 1 antigravity → kira, Ana satırı, worktree');
r = run(['kirala', '1', 'antigravity']);
d.kontrol(r.kod === 0, 'kirala 1 antigravity çıkış 0 olmalı', r.cikti);
const headPlan = git(R, 'show', 'HEAD:PLAN.md').stdout || '';
d.kontrol(/## Epic 1 — A\n- Ana: antigravity\n/.test(headPlan), 'HEAD PLAN\'da Epic 1 altında "- Ana: antigravity" yok');
d.kontrol(/^epic 1: ana$/m.test(git(R, 'log', '-1', '--format=%s').stdout), 'son commit "epic 1: ana" olmalı');
const k1 = kiraOku(1);
d.kontrol(k1 && k1.ana === 'antigravity' && k1.dosyalar.includes('a.mjs'), 'kira dosyası ana/dosyalar içermeli', JSON.stringify(k1));
d.kontrol(existsSync(wtYol('antigravity')), 'worktree açılmalı: ' + wtYol('antigravity'));
d.kontrol(git(R, 'rev-parse', '--verify', '-q', 'refs/heads/ana/antigravity').status === 0, 'ana/antigravity dalı olmalı');

// 3. Aynı Epic başka anaya; dosyası kesişen başka Epic de başka anaya verilemez
d.vaka('çakışma: aynı Epic başka ana → 9; dosya kesişimi → 9');
r = run(['kirala', '1', 'claude']);
d.kontrol(r.kod === 9, 'aynı Epic başka anaya 9 olmalı', r.cikti);
r = run(['kirala', '2', 'claude']);
d.kontrol(r.kod === 9, 'a.mjs kesişen Epic 2 için 9 olmalı', r.cikti);
d.kontrol(/a\.mjs/.test(r.cikti), 'kesişen dosya çıktıda basılmalı', r.cikti);
d.kontrol(!existsSync(kiraDosya(2)), 'çakışan kiralamada kira yazılmamalı');

// 4. Kesişmeyen Epic kiralanır; durum kimin neyi tuttuğunu gösterir
d.vaka('kirala 3 claude → 0; durum');
r = run(['kirala', '3', 'claude']);
d.kontrol(r.kod === 0, 'kesişmeyen Epic 3 için çıkış 0 olmalı', r.cikti);
d.kontrol(existsSync(wtYol('claude')), 'claude worktree açılmalı');
r = run(['durum']);
d.kontrol(/^Epic 1\tantigravity\t\d+ dk\t\d+ dosya$/m.test(r.cikti), 'durum: Epic 1 antigravity satırı yok', r.cikti);
d.kontrol(/^Epic 3\tclaude\t/m.test(r.cikti), 'durum: Epic 3 claude satırı yok', r.cikti);

// 5. Bırakma: birak kirayı siler; yoksa da 0
d.vaka('birak 1 → 0; yoksa da 0; durum');
r = run(['birak', '1']);
d.kontrol(r.kod === 0 && !existsSync(kiraDosya(1)), 'birak 1 çıkış 0 ve kira silinmiş olmalı', r.cikti);
r = run(['birak', '99']);
d.kontrol(r.kod === 0, 'olmayan kira için birak 0 olmalı', r.cikti);
r = run(['durum']);
d.kontrol(!/^Epic 1\t/m.test(r.cikti), 'birak sonrası durum Epic 1 göstermemeli', r.cikti);
d.kontrol(/^Epic 3\tclaude\t/m.test(r.cikti), 'birak 1 Epic 3 kirasını silmemeli', r.cikti);

// 6. Süre dolumu: MDK_KIRA_SN=0 iken eski kiralar yok sayılır ve silinir
d.vaka('MDK_KIRA_SN=0 → eski kiralar düşer');
r = run(['kirala', '2', 'claude'], { MDK_KIRA_SN: '0' });
d.kontrol(r.kod === 0, 'süresi dolmuş kira varken kirala 2 çıkış 0 olmalı', r.cikti);
d.kontrol(!existsSync(kiraDosya(3)), 'süresi dolan Epic 3 kirası silinmeli');
r = run(['durum'], { MDK_KIRA_SN: '0' });
d.kontrol(/kira yok/.test(r.cikti), 'süresi dolmuşken durum "kira yok" demeli', r.cikti);

// 7. Birleştirme: kirli ana depo → 4
d.vaka('birlestir: kirli ana depo → 4');
writeFileSync(join(R, 'kirli.txt'), 'x');
r = run(['birlestir', 'antigravity'], { MDK_BIRLESTIR_TEST: 'node -e "process.exit(0)"' });
d.kontrol(r.kod === 4, 'kirli ana depoda çıkış 4 olmalı', r.cikti);
rmSync(join(R, 'kirli.txt'));

// 8. Birleştirme: yeşil test → ana dala birleşir
d.vaka('birlestir: yeşil test → ana dal ilerler');
const W = wtYol('antigravity');
writeFileSync(join(W, 'yeni.txt'), 'y');
commit(W, 'yeni dosya');
r = run(['birlestir', 'antigravity'], { MDK_BIRLESTIR_TEST: 'node -e "process.exit(0)"' });
d.kontrol(r.kod === 0, 'yeşil testte çıkış 0 olmalı', r.cikti);
d.kontrol(existsSync(join(R, 'yeni.txt')), 'yeni dosya ana dalda olmalı');
d.kontrol(/birleştirildi: ana\/antigravity/.test(r.cikti), 'çıktıda "birleştirildi" olmalı', r.cikti);

// 9. Birleştirme: kırmızı test → ana dal birleştirme öncesi hâline döner
d.vaka('birlestir: kırmızı test → ana dal geri alınır');
writeFileSync(join(W, 'yeni2.txt'), 'y2');
commit(W, 'kirmizi dosya');
const once = git(R, 'rev-parse', 'HEAD').stdout.trim();
r = run(['birlestir', 'antigravity'], { MDK_BIRLESTIR_TEST: 'node -e "process.exit(1)"' });
d.kontrol(r.kod === 1, 'kırmızı testte çıkış 1 olmalı', r.cikti);
d.kontrol(git(R, 'rev-parse', 'HEAD').stdout.trim() === once, 'kırmızıda ana HEAD eski hâline dönmeli');
d.kontrol(!existsSync(join(R, 'yeni2.txt')), 'kırmızıda yeni2.txt ana dalda olmamalı');

// 10. Birleştirme kilidi: canlı bir sahibi olan kilit → 8
d.vaka('birlestir: kilit canlıyken → 8');
writeFileSync(join(KILIT, 'birlestir.kilit'), String(process.pid));
r = run(['birlestir', 'antigravity'], { MDK_BIRLESTIR_TEST: 'node -e "process.exit(0)"' });
d.kontrol(r.kod === 8, 'kilit canlıyken çıkış 8 olmalı', r.cikti);
rmSync(join(KILIT, 'birlestir.kilit'));

// 11. mdk-epic.mjs ana: tanınmayan ana → 1, PLAN değişmez
d.vaka('mdk-epic ana 3 yok → 1; PLAN değişmez');
const onceP = plan();
r = kos(EPIC, ['ana', '3', 'yok'], { cwd: R, env: ENV });
d.kontrol(r.kod === 1, 'tanınmayan ana için mdk-epic çıkış 1 olmalı', r.cikti);
d.kontrol(plan() === onceP, 'tanınmayan ana için PLAN değişmemeli');

rmSync(T, { recursive: true, force: true });
d.bitir();
