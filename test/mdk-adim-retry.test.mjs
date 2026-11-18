// Kapı (adım 222): Koşturucuda Retry-After bekleme, zaman aşımı tekrarı ve kalıcı hatalarda beklemeden geçiş
import { KOK, commit, denetci, depo, gecici, join, kos, metrikler, oku, stub } from './yardim.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-adim-retry.test');
const VAR = (f) => `node -e "process.exit(require('fs').existsSync('${f}')?0:1)"`;
const KAPI = `  - Kapı: \`${VAR('cikti.txt')}\``;
const plan = (m, adim) => `Yürütücü: opencode\nModeller: ${m}\n\n## K\n- [ ] 1. İş\n${adim}\n`;

let T, R, OC, SON;
function setup(planMetni, govde) {
  T = gecici();
  R = join(T, 'repo');
  depo({ 'PLAN.md': planMetni }, { R });
  OC = stub(T, govde);
  commit(R);
}
const ortam = (ek = {}) => ({
  STUB_DIR: T,
  MDK_OPENCODE: OC,
  MDK_ONKONTROL_YOK: '1',
  POLL: '1',
  DENEME: '1',
  SURE: '30',
  MDK_KILIT: join(T, 'kilit'),
  MDK_GECICI_BEKLE_MS: '40',
  ...ek,
});
const kosu = (ek = {}) => {
  SON = kos(RUNNER, ['1'], { cwd: R, env: ortam(ek) });
  return SON;
};
const M = () => metrikler(join(R, 'metrikler.jsonl'));
const neden = () => M().map((x) => x.neden ?? '-').join();
const modeller = () => oku(join(T, 'modeller.log')).trim().split('\n').filter(Boolean).join();
const k = (kosul, mesaj) => kontrol(kosul, mesaj, SON?.cikti);

// 1. Retry-After süresine uygun bekleme ve aynı modelde yeniden deneme
vaka('retry_after_bekleme');
setup(
  plan('m/a', KAPI),
  "if (n === 1) olay({ type: 'error', error: { name: 'APIError', data: { message: '429 Too Many Requests, retry in 900 ms' } } }); else yaz('cikti.txt', 'x\\n');"
);
kosu({ MDK_GECICI_BEKLE_MS: '20' });
k(SON.kod === 0, 'çıkış 0 olmalı');
k(SON.cikti.includes('900 ms bekleyip yeniden deniyorum'), 'Retry-After süresi (900 ms) beklenmeli');
k(modeller() === 'm/a,m/a', 'aynı model yeniden denenmeli');
k(neden() === 'oran,-', 'neden oran sonra başarılı olmalı');

// 2. Zaman aşımı (zaman_asimi) geçici hata olarak aynı modelde yeniden denenmeli
vaka('zaman_asimi_tekrar');
setup(
  plan('m/a', KAPI),
  "if (n === 1) olay({ type: 'error', error: { name: 'APIError', data: { message: '408 Request Timeout' } } }); else yaz('cikti.txt', 'x\\n');"
);
kosu();
k(SON.kod === 0, 'zaman aşımı sonrası yeniden deneme çıkış 0 olmalı');
k(modeller() === 'm/a,m/a', 'zaman aşımında aynı model yeniden denenmeli');
k(neden() === 'zaman_asimi,-', 'neden zaman_asimi olarak kaydedilmeli');

// 3. Kota ve kimlik hatalarında beklemeden doğrudan sıradaki modele geçiş
vaka('kota_ve_kimlik_beklemeden_gecis');
setup(
  plan('m/a, m/b, m/c', KAPI),
  "if (M === 'm/a') olay({ type: 'error', error: { name: 'APIError', data: { message: 'Free usage limit reached' } } }); else if (M === 'm/b') olay({ type: 'error', error: { name: 'APIError', data: { message: '401 Unauthorized' } } }); else yaz('cikti.txt', 'x\\n');"
);
kosu({ MDK_GECICI_BEKLE_MS: '5000' });
k(SON.kod === 0, 'üçüncü modelle çıkış 0 olmalı');
k(modeller() === 'm/a,m/b,m/c', 'kota ve kimlikte tekrar yapmadan sıradaki modele geçmeli');
k(neden() === 'kota,kimlik,-', 'nedenler kota, kimlik ve başarı olmalı');
k(!SON.cikti.includes('bekleyip yeniden deniyorum'), 'kalıcı hatada bekleme yapılmamalı');

bitir();
