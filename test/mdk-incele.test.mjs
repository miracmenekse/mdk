// mdk-incele.mjs testi: sahte opencode (v2 text olayları) ile, geçici git deposunda, ağsız.
import { KOK, commit, denetci, depo, existsSync, gecici, join, kos, oku, stub, writeFileSync } from './yardim.mjs';

const RUNNER = join(KOK, 'mdk-incele.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-incele.test');
let T, R, SON;
function setup(y1, y2) { // m/i1 ve m/i2 yanıtları
  T = gecici(); R = join(T, 'proje');
  writeFileSync(join(T, 'y1'), y1); writeFileSync(join(T, 'y2'), y2);
  stub(T, "metin(fs.readFileSync(D + (M === 'm/i1' ? '/y1' : '/y2'), 'utf8'));");
  depo({ 'PLAN.md': 'Yürütücü: opencode\nModeller: m/a\nGörev inceleme: m/i1, m/i2\n\n## K\n- [x] 1. Bir\n  - Ne: NE-ISARET dosyası yaz\n  - Kapı: `node -e "0"`\n\n- [ ] 2. İki\n  - Ne: başka\n  - Kapı: `node -e "0"`\n' }, { R });
  commit(R);
  writeFileSync(join(R, 'x.txt'), 'DIFF-ISARET\n'); commit(R, 'adım 1: Bir (m/a, deneme 1)');
  writeFileSync(join(R, 'y.txt'), 'HEAD-ISARET\n'); commit(R, 'başka iş');
}
const kosu = (n) => (SON = kos(RUNNER, [String(n)], { cwd: R, env: { STUB_DIR: T, MDK_OPENCODE: join(T, 'opencode.mjs'), POLL: '1' } }));
const satir = () => oku(join(R, 'metrikler.jsonl')).split('\n').filter((l) => l.includes('"tur":"inceleme"')).join('\n');
const k = (c, m) => kontrol(c, m, SON?.cikti);
const cagri = () => oku(join(T, 'cagri.log')).trim().split('\n').filter(Boolean);

vaka('uyumlu');
setup('UYUM: 92\n- plana uygun', 'UYUM: 10'); kosu(1);
k(SON.kod === 0, 'çıkış 0'); k(cagri().join() === 'm/i1|plan', 'yalnız ilk model, plan ajanı');
const istem = oku(join(T, 'istem-1.txt'));
k(istem.includes('NE-ISARET') && istem.includes('DIFF-ISARET'), 'adım metni + diff'); k(!istem.includes('HEAD-ISARET'), 'ilgisiz commit yok');
k(satir().includes('"adim":1') && satir().includes('"inceleme":"uyumlu"') && satir().includes('92'), 'kayıt'); k(SON.cikti.includes('UYUM: 92'), 'çıktı');

vaka('kismen_yedek'); // ilk model biçimsiz → yedek; 60 → kismen
setup('bilmiyorum', 'UYUM: 60\n- eksik vaka'); kosu(1);
k(SON.kod === 0 && cagri().map((c) => c.split('|')[0]).join() === 'm/i1,m/i2', 'yedek model'); k(satir().includes('"inceleme":"kismen"'), 'kismen');

vaka('uyumsuz');
setup('UYUM: 30\n- yanlış dosya', 'UYUM: 99'); kosu(1);
k(SON.kod === 0 && satir().includes('"inceleme":"uyumsuz"'), 'uyumsuz');

vaka('hep_bozuk'); // iki model de biçimsiz: çıkış 2, kayıt yok
setup('olmaz', 'UYUM: yüksek'); kosu(1);
k(SON.kod === 2 && satir() === '', 'çıkış 2, kayıt yok');

vaka('commit_yok'); // adımın commit'i yok: çıkış 4, model çağrılmaz
setup('UYUM: 90', 'UYUM: 90'); kosu(2);
k(SON.kod === 4 && !existsSync(join(T, 'cagri.log')), 'çıkış 4, model çağrılmadı');
bitir();
