// mdk-adim.mjs hata sınıflandırma testi: sahte opencode (.mjs) ile, geçici git deposunda, ağsız ve hızlı.
import { KOK, commit, denetci, depo, existsSync, gecici, git, join, kos, metrikler, oku, stub, writeFileSync } from './yardim.mjs';
import { iletiBul } from '../mdk-hata.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-adim-hata.test');
const VAR = (f) => `node -e "process.exit(require('fs').existsSync('${f}')?0:1)"`;
const KAPI = `  - Kapı: \`${VAR('cikti.txt')}\``;
const plan = (m, adim) => `Yürütücü: opencode\nModeller: ${m}\n\n## K\n- [ ] 1. İş\n${adim}\n`;
const planEskale = (m, adim) => `Yürütücü: opencode\nModeller: ${m}\n\nGörev eskale: m/e\n\n## K\n- [ ] 1. İş\n${adim}\n`;
const YAZ = "yaz('cikti.txt', 'x\\n');";

let T, R, CP, OC, SON;
function setup(planMetni, govde, stubOpt) { T = gecici(); R = join(T, 'repo'); depo({ 'PLAN.md': planMetni }, { R }); OC = stub(T, govde, stubOpt); }
const commit0 = () => { CP = commit(R); };
const ortam = (ek = {}) => ({ STUB_DIR: T, MDK_OPENCODE: OC, POLL: '1', DENEME: '1', SURE: '30', MDK_KILIT: join(T, 'kilit'), MDK_GECICI_BEKLE_MS: '50', ...ek });
function kosu(ek = {}, run = RUNNER) { SON = kos(run, ['1'], { cwd: R, env: ortam(ek) }); return SON; }
const M = () => metrikler(join(R, 'metrikler.jsonl'));
const gecti = () => M().map((x) => x.gecti).join();
const neden = () => M().map((x) => x.neden ?? '-').join();
const modeller = () => oku(join(T, 'modeller.log')).trim().split('\n').filter(Boolean).join();
const p = (f) => oku(join(R, f));
const temiz = () => git(R, 'status', '--porcelain').stdout === '';
const k = (kosul, mesaj) => kontrol(kosul, mesaj, SON?.cikti);

const V = {
  gecici_basarili() {
    setup(plan('m/a', KAPI), "if (n === 1) olay({ type: 'error', error: { name: 'APIError', data: { message: '429 Too Many Requests' } } }); else yaz('cikti.txt', 'x\\\\n');");
    commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(modeller() === 'm/a,m/a', 'modeller');
    k(neden() === 'oran,-', 'neden'); k(gecti() === 'false,true', 'gecti');
    k(M().map((x) => x.deneme).join() === '1,1', 'deneme');
  },
  hep_gecici() {
    setup(planEskale('m/a, m/b', KAPI), "olay({ type: 'error', error: { name: 'APIError', data: { message: '503 Service Unavailable' } } });"); commit0();
    kosu({ MDK_GECICI_TEKRAR: '1' });
    k(SON.kod === 6, 'çıkış 6'); k(modeller() === 'm/a,m/a,m/b,m/b', 'modeller');
    k(p('durum.json').includes('"durum":"saglayici"'), 'durum'); k(p('durum.json').includes('"neden":"sunucu"'), 'neden');
    const mesaj = iletiBul('saglayici', 'sunucu').ileti;
    k(SON.cikti.includes(mesaj), 'çıktı ileti'); k(temiz(), 'temiz');
  },
  kalici() {
    setup(plan('m/a, m/b', KAPI), "if (M === 'm/a') olay({ type: 'error', error: { name: 'APIError', data: { message: 'Invalid API key' } } }); else yaz('cikti.txt', 'x\\n');"); commit0();
    kosu();
    k(SON.kod === 0, 'çıkış 0'); k(modeller() === 'm/a,m/b', 'modeller');
    k(neden() === 'kimlik,-', 'neden');
  },
  bilinmeyen() {
    setup(plan('m/a', KAPI), "olay({ type: 'error', error: { name: 'APIError', data: { message: 'Failed to execute statement' } } }); yaz('cikti.txt', 'x\\n');"); commit0();
    kosu();
    k(SON.kod === 0, 'çıkış 0'); k(modeller() === 'm/a', 'tek çağrı');
  },
  bekleme() {
    setup(plan('m/a', KAPI), "if (n === 1) olay({ type: 'error', error: { name: 'APIError', data: { message: 'rate limit' } } }); else yaz('cikti.txt', 'x\\n');"); commit0();
    kosu({ MDK_GECICI_BEKLE_MS: '1200' });
    k(SON.kod === 0, 'çıkış 0'); k(SON.sn >= 1.2, 'süre'); k(modeller() === 'm/a,m/a', 'modeller');
  },
  metin() {
    setup(plan('m/a', KAPI), "metin('429 rate limit hatasını düzelttim'); yaz('cikti.txt', 'x\\n');"); commit0();
    kosu();
    k(SON.kod === 0, 'çıkış 0'); k(modeller() === 'm/a', 'tek çağrı');
  },
};

let secilen = process.argv.slice(2);
if (!secilen.length) secilen = Object.keys(V);
for (const v of secilen) {
  if (!V[v]) { console.log(`bilinmeyen vaka: ${v}`); process.exit(64); }
  vaka(v); SON = null; V[v]();
}
bitir();
