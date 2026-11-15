// mdk-adim.mjs ana yürütücü testi: Epic'in "- Ana:" satırına göre Antigravity (agy) koşusu ve model seçimi.
// Kullanım: node test/mdk-adim-ana.test.mjs
import { KOK, commit, denetci, depo, existsSync, gecici, join, kos, metrikler, oku, stub, writeFileSync } from './yardim.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-adim-ana.test');
// kapılar bash'siz de (Windows cmd) çalışsın: node -e
const VAR = (f) => `node -e "process.exit(require('fs').existsSync('${f}')?0:1)"`;
const KAPI = `  - Kapı: \`${VAR('cikti.txt')}\``;
const YAZ = "yaz('cikti.txt', 'x\\n');";

// Plan: Epic 1 Antigravity'ye ait (adım 1); Epic 2 Ana satırı yok (varsayılan claude) (adım 2)
const PLAN = `Yürütücü: opencode
Görev kod: m/oc

## Epic 1 — A
- Ana: antigravity
- [ ] 1. İş A
${KAPI}

## Epic 2 — B
- [ ] 2. İş B
${KAPI}
`;

let T, R, OC, AGY, YUR, SON;

// sahte agy: argümanları agy-argv'ye yazar, cikti.txt yazar, stdout'a bir satır basar; ek gövde ile değişir
function agySahte(ek = '') {
  AGY = join(T, 'agy.mjs');
  writeFileSync(AGY, `import fs from 'node:fs';
fs.writeFileSync(${JSON.stringify(join(T, 'agy-argv'))}, process.argv.slice(2).join('\\n') + '\\n');
fs.writeFileSync('cikti.txt', 'x\\n');
${ek}
console.log('agy tamam');
`);
}

function setup(planMetni, opencodeGovde = YAZ) {
  T = gecici();
  R = join(T, 'repo');
  depo({ 'PLAN.md': planMetni }, { R });
  OC = stub(T, opencodeGovde);
  YUR = join(T, 'yurutuculer.json');
  writeFileSync(YUR, JSON.stringify({
    varsayilan: 'claude',
    liste: [
      { ad: 'claude', baslik: 'Claude', planlayici: ['claude', '-p', '{istem}'] },
      { ad: 'antigravity', baslik: 'Antigravity', planlayici: ['agy', '-p', '{istem}'], agy_ek: ['--izin'], gorevler: { kod: ['agy/varsayilan'], eskale: ['agy/varsayilan'] } },
    ],
  }));
  const commit0 = commit(R); // ilk commit, kontrol noktası HEAD
  return commit0;
}

function kosu(adim = '1', ek = {}) {
  const env = { STUB_DIR: T, MDK_OPENCODE: OC, MDK_AGY: AGY, MDK_YURUTUCULER: YUR, MDK_ANA: '', POLL: '1', DENEME: '1', SURE: '30', ILK: '20', MDK_KILIT: join(T, 'kilit'), ...ek };
  SON = kos(RUNNER, [adim], { cwd: R, env });
  return SON;
}
const M = () => metrikler(join(R, 'metrikler.jsonl'));
const son = () => M().at(-1) || {};
const agyArgv = () => oku(join(T, 'agy-argv')).trim().split('\n').filter(Boolean);
const opencodeCagrildi = () => existsSync(join(T, 'modeller.log'));
const modeller = () => oku(join(T, 'modeller.log')).trim().split('\n').filter(Boolean).join();
const k = (kosul, mesaj) => kontrol(kosul, mesaj, SON?.cikti);

const V = {
  agy_ana() { // (1) Antigravity Epic'i: agy çağrılır, opencode çağrılmaz, metrik ana=antigravity
    setup(PLAN); agySahte(); kosu('1');
    k(SON.kod === 0, 'çıkış 0');
    const a = agyArgv();
    k(a.includes('-p') && a.includes('--izin'), `agy argümanları -p ve --izin içermeli: ${a.join(' ')}`);
    k(!a.includes('--model'), 'varsayilan model için --model verilmemeli');
    k(!opencodeCagrildi(), 'sahte opencode çağrılmamalı');
    k(son().ana === 'antigravity', `metrik ana antigravity olmalı: ${son().ana}`);
    k(son().model === 'agy/varsayilan', `metrik model agy/varsayilan olmalı: ${son().model}`);
  },
  claude_ana() { // (2) Ana satırı olmayan Epic: opencode m/oc ile koşar, agy çağrılmaz, metrik ana=claude
    setup(PLAN); agySahte(); kosu('2');
    k(SON.kod === 0, 'çıkış 0');
    k(modeller() === 'm/oc' || modeller().includes('m/oc'), `opencode m/oc ile çağrılmalı: ${modeller()}`);
    k(!existsSync(join(T, 'agy-argv')), 'agy çağrılmamalı');
    k(son().ana === 'claude', `metrik ana claude olmalı: ${son().ana}`);
  },
  adim_modeli_once() { // (3) adımda "- Modeller:" varsa Epic Ana'sı antigravity olsa da opencode o modelle çağrılır
    const plan = PLAN.replace('- [ ] 1. İş A\n', `- [ ] 1. İş A\n  - Modeller: m/oc\n`);
    setup(plan); agySahte(); kosu('1');
    k(SON.kod === 0, 'çıkış 0');
    k(modeller().includes('m/oc'), `opencode m/oc ile çağrılmalı: ${modeller()}`);
    k(!existsSync(join(T, 'agy-argv')), 'adım Modeller satırı varken agy çağrılmamalı');
  },
  kota_cikis6() { // (4) agy RESOURCE_EXHAUSTED basarsa kota sayılır, sağlayıcı sorunu olarak çıkış 6
    setup(PLAN); agySahte("process.stderr.write('RESOURCE_EXHAUSTED\\n'); process.exit(1);"); kosu('1');
    k(SON.kod === 6, `çıkış 6 olmalı: ${SON.kod}`);
    k(!opencodeCagrildi(), 'sahte opencode çağrılmamalı');
  },
  bilinmeyen_ana() { // (5) MDK_ANA tanınmayan ad → çıkış 4, "tanınmayan ana yürütücü"
    setup(PLAN); agySahte(); kosu('1', { MDK_ANA: 'yok' });
    k(SON.kod === 4, `çıkış 4 olmalı: ${SON.kod}`);
    k(SON.cikti.includes('tanınmayan ana yürütücü'), 'çıktıda tanınmayan ana yürütücü');
  },
};

for (const ad of Object.keys(V)) { vaka(ad); V[ad](); }

bitir();
