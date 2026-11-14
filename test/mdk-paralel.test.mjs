// mdk-paralel.mjs testi: sahte opencode (.mjs) ile, geçici git deposunda, ağsız.
import { KOK, commit, denetci, depo, gecici, git, join, kos, oku, stub } from './yardim.mjs';
import { existsSync } from 'node:fs';

const RUNNER = join(KOK, 'mdk-paralel.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-paralel.test');
const VAR = (f) => `node -e "process.exit(require('fs').existsSync('${f}')?0:1)"`;
let T, R, SON;
function setup(y1, y2, k2) { // adım 1/2 Ne işaretleri (YAZ:<dosya>=<içerik>), adım 2 kapı dosyası
  T = gecici(); R = join(T, 'proje');
  // istemdeki YAZ:<dosya>=<içerik> işaretlerine göre dosya yaz (3 sn sürer: paralellik ölçülür)
  stub(T, "await uyu(3); for (const m of ISTEM.matchAll(/YAZ:([^ `\\n]+)/g)) { const [f, i] = m[1].split('='); yaz(f, i + '\\n'); }");
  depo({ 'PLAN.md': `Yürütücü: opencode\nModeller: m/a, m/b\n\n## K\n- [ ] 1. Bir\n  - Ne: YAZ:${y1}\n  - Kapı: \`${VAR(y1.split('=')[0])}\`\n\n- [ ] 2. İki\n  - Ne: YAZ:${y2}\n  - Kapı: \`${VAR(k2 || 'b.txt')}\`\n` }, { R, dal: 'main' });
  commit(R);
}
const kosu = (nos) => (SON = kos(RUNNER, nos, { cwd: R, env: { STUB_DIR: T, MDK_OPENCODE: join(T, 'opencode.mjs'), MDK_KILIT: join(T, 'kilit'), MDK_KILIT_BEKLE: '1', MDK_ONKONTROL_YOK: '1', POLL: '1', DENEME: '1', SURE: '30' } }));
const k = (c, m) => kontrol(c, m, SON?.cikti);
const p = (f) => oku(join(R, f));
const temiz = () => git(R, 'status', '--porcelain').stdout === '';

vaka('ayri'); // ayrı dosyalar: paralel koşar, ikisi de ana dalda, [x] ana dalda
setup('a.txt=A', 'b.txt=B'); kosu(['1', '2']);
k(SON.kod === 0, 'çıkış 0'); k(SON.sn < 8, 'paralel (sıralı olsaydı ≥6 sn + açılış)');
k(git(R, 'branch', '--show-current').stdout.trim() === 'main' && p('a.txt') === 'A\n' && p('b.txt') === 'B\n', 'ana dalda');
k(/^- \[x\] 1\./m.test(p('PLAN.md')) && /^- \[x\] 2\./m.test(p('PLAN.md')), '[x] ana dalda'); k(temiz(), 'temiz');
k(git(R, 'worktree', 'list').stdout.trim().split('\n').length === 1, 'worktree silindi');
k(git(R, 'rev-parse', '-q', '--verify', 'mdk/1').status === 0 && git(R, 'rev-parse', '-q', '--verify', 'mdk/2').status === 0, 'dallar kalır');
k((p('metrikler.jsonl').match(/"gecti":true/g) || []).length === 2, 'metrik ana depoya');
k(/^\| 1 \|.*m\//m.test(SON.cikti) && /^\| 2 \|.*m\//m.test(SON.cikti), 'özet tablo');

vaka('cakisma'); // aynı dosya: 1 işlenir, 2 çakışır → 9, cherry-pick yarım kalmaz
setup('ortak.txt=A', 'ortak.txt=B', 'ortak.txt'); kosu(['1', '2']);
k(SON.kod === 9, 'çıkış 9'); k(p('ortak.txt') === 'A\n' && /^- \[x\] 1\./m.test(p('PLAN.md')) && /^- \[ \] 2\./m.test(p('PLAN.md')), 'yalnız 1 işlendi');
k(temiz() && !existsSync(join(R, git(R, 'rev-parse', '--git-path', 'CHERRY_PICK_HEAD').stdout.trim())), 'cherry-pick yarım değil'); k(SON.cikti.includes('mdk/2'), 'çakışan dal');

vaka('kalan'); // adım 2 kapıdan kalır: 1 işlenir, çıkış 2
setup('a.txt=A', 'yok.txt=x', 'b.txt'); kosu(['1', '2']);
k(SON.kod === 2, 'çıkış 2'); k(p('a.txt') === 'A\n' && /^- \[x\] 1\./m.test(p('PLAN.md')) && /^- \[ \] 2\./m.test(p('PLAN.md')), '1 işlendi'); k(temiz(), 'temiz');

vaka('kullanim'); // argümansız: çıkış 4, hiçbir şey koşmaz
setup('a.txt=A', 'b.txt=B'); kosu([]);
k(SON.kod === 4 && !existsSync(join(T, 'modeller.log')), 'çıkış 4');
bitir();
