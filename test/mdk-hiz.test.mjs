// MDK hızlandırma ve otonomi özellikleri testi:
// - oto_kapi: kapı test dosyası yoksa önce Görev kapi: modeli yazar (kırmızı doğrular), sonra Görev kod: geçirir
// - oto_eskale: Görev kod: modelleri düşerse çıkış 2'den önce Görev eskale: modeli denenir
// - sorun_hizli: ilk model SORUN.md bırakırsa sonraki modeller boşuna denenmez
// - doktor: CLI argüman/ortam hatasında (0 olay + stderr hatası) diğer modeller denenmeden çıkış 4
// - go_kota: kota hatasında model başına tek deneme, sonraki modele geçer
// - oturum_interrupt: süre aşımında oturum arka plan servisinde de kesilir
import { KOK, commit, denetci, depo, existsSync, gecici, join, kos, oku, stub, writeFileSync } from './yardim.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-hiz.test');
const VAR = (f) => `node -e "process.exit(require('fs').existsSync('${f}')?0:1)"`;
let T, R, OC, SON;
function setup(plan, govde, opt) { T = gecici(); R = join(T, 'repo'); depo({ 'PLAN.md': plan }, { R }); commit(R); OC = stub(T, govde, opt); }
const kosu = (ek = {}) => (SON = kos(RUNNER, ['1'], { cwd: R, env: { STUB_DIR: T, MDK_OPENCODE: OC, POLL: '1', DENEME: '1', SURE: '30', MDK_KILIT: join(T, 'kilit'), ...ek } }));
const modeller = () => oku(join(T, 'modeller.log')).trim().split('\n').filter(Boolean).join();
const k = (c, m) => kontrol(c, m, SON?.cikti);

vaka('oto_kapi');
setup(`Yürütücü: opencode\nModeller: m/kod\nGörev kapi: m/kapi\nGörev kod: m/kod\n\n## K\n- [ ] 1. Otomatik kapılı iş\n  - Ne: yeni.mjs yaz\n  - Kapı: \`node yeni.test.mjs\`\n`,
  "if (M === 'm/kapi') yaz('yeni.test.mjs', 'import { existsSync } from \"node:fs\"; if (!existsSync(\"yeni.mjs\")) process.exit(1);\\n'); else yaz('yeni.mjs', 'export const x = 1;\\n');");
kosu();
k(SON.kod === 0, 'çıkış 0'); k(existsSync(join(R, 'yeni.test.mjs')) && existsSync(join(R, 'yeni.mjs')), 'iki dosya'); k(modeller() === 'm/kapi,m/kod', 'model sırası');

vaka('oto_eskale');
setup(`Yürütücü: opencode\nModeller: m/kod1\nGörev kod: m/kod1\nGörev eskale: m/qwen-max\n\n## K\n- [ ] 1. Zor iş\n  - Kapı: \`${VAR('zor.txt')}\`\n`, "if (M === 'm/qwen-max') yaz('zor.txt', 'ok\\n');");
kosu();
k(SON.kod === 0, 'çıkış 0'); k(modeller() === 'm/kod1,m/qwen-max', 'eskale modeli denendi');

vaka('sorun_hizli');
setup(`Yürütücü: opencode\nModeller: m/a, m/b, m/c\nGörev eskale: m/qwen-max\n\n## K\n- [ ] 1. Çelişkili iş\n  - Kapı: \`${VAR('x.txt')}\`\n`, "yaz('SORUN.md', 'kapı çelişkili\\n');");
kosu();
k(SON.kod === 2, 'çıkış 2'); k(modeller() === 'm/a', 'diğer modeller boşuna çağrılmaz');

vaka('doktor');
setup(`Yürütücü: opencode\nModeller: m/a, m/b\n\n## K\n- [ ] 1. Ortam hatası\n  - Kapı: \`${VAR('x.txt')}\`\n`, "process.stderr.write('Unknown argument: standalone\\n'); process.exit(1);", { son: false });
kosu();
k(SON.kod === 4, 'çıkış 4'); k(modeller() === 'm/a', 'ikinci model denenmez'); k(oku(join(R, 'durum.json')).includes('ortam_hatasi'), 'durum ortam_hatasi');

vaka('go_kota');
setup(`Yürütücü: opencode\nModeller: opencode-go/glm-5.3-flash, opencode-go/glm-5.3\n\n## K\n- [ ] 1. Go kota testi\n  - Kapı: \`${VAR('x.txt')}\`\n`,
  "olay({type:'error',error:{type:'provider.quota',message:'Go usage limit exceeded'}});", { son: false });
kosu({ DENEME: '2' });
k(SON.kod === 6, 'çıkış 6'); k(modeller().split(',').length === 2, 'model başına tek deneme'); k(oku(join(R, 'metrikler.jsonl')).includes('"neden":"kota"'), 'neden kota');

vaka('oturum_interrupt');
setup(`Yürütücü: opencode\nModeller: opencode-go/glm-5.3-flash\n\n## K\n- [ ] 1. Interrupt testi\n  - Kapı: \`${VAR('x.txt')}\`\n`,
  "if (A[0] !== 'api') { olay({type:'step_start',sessionID:'ses_testZombi123'}); await uyu(30); }", { son: false });
kosu({ SURE: '2' });
k(SON.kod === 2, 'çıkış 2'); k(oku(join(T, 'interrupt.log')).includes('POST /api/session/ses_testZombi123/interrupt'), 'oturum kesildi');
void writeFileSync;
bitir();
