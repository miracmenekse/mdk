import { KOK, commit, denetci, depo, existsSync, gecici, git, join, kos, metrikler, mkdirSync, oku, readFileSync, stub, uyu, writeFileSync } from './yardim.mjs';
import { hataOzeti, boyutDenetle } from '../mdk-denetim.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-denetim.test');

const plan = (m, adim) => `Yürütücü: opencode\nModeller: ${m}\n\n## K\n- [ ] 1. İş\n${adim}\n`;
const VAR = (f) => `node -e "process.exit(require('fs').existsSync('${f}')?0:1)"`;
const KAPI = `  - Kapı: \`${VAR('cikti.txt')}\``;

let T, R, CP, OC, SON;
function setup(planMetni, govde, stubOpt) { T = gecici(); R = join(T, 'repo'); depo({ 'PLAN.md': planMetni }, { R }); OC = stub(T, govde, stubOpt); }
const commit0 = () => { CP = commit(R); };
const ortam = (ek = {}) => ({ STUB_DIR: T, MDK_OPENCODE: OC, POLL: '1', DENEME: '1', SURE: '30', MDK_KILIT: join(T, 'kilit'), ...ek });
function kosu(ek = {}, run = RUNNER) { SON = kos(run, ['1'], { cwd: R, env: ortam(ek) }); return SON; }
const M = () => metrikler(join(R, 'metrikler.jsonl'));

// Bölüm A
vaka('hataozeti_assert');
const dolguSatir = 'x'.repeat(100) + '\n';
const basDolgu = dolguSatir.repeat(30);
const sonDolgu = dolguSatir.repeat(20);
const nodeCiktisi = "AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:\n+ actual - expected\n+ 'a'\n- 'b'\n    at Object.<anonymous> (/x/panel/ornek.test.mjs:12:8)\n    at node:internal/main:1:1";
const metin1 = basDolgu + nodeCiktisi + sonDolgu;
const ozet1 = hataOzeti(metin1);
kontrol(ozet1.includes('AssertionError'), 'AssertionError', ozet1);
kontrol(ozet1.includes("+ 'a'"), '+ a', ozet1);
kontrol(ozet1.includes("- 'b'"), '- b', ozet1);
kontrol(ozet1.includes('ornek.test.mjs:12:8'), 'stack', ozet1);
kontrol(!ozet1.includes('node:internal'), 'node internal yok', ozet1);
kontrol(ozet1.length <= 1500, 'uzunluk', ozet1);
kontrol(!metin1.slice(-1500).includes('AssertionError'), 'kuyruk kanıtı');

vaka('hataozeti_basarisiz');
const metin2 = '· vaka\nBAŞARISIZ [vaka]: çıkış 0\n…';
kontrol(hataOzeti(metin2).includes('BAŞARISIZ [vaka]: çıkış 0'), 'BAŞARISIZ satırı');

vaka('hataozeti_typeerror');
const metin3 = 'TypeError: x is not a function\n    at f (/x/a.mjs:3:1)';
const ozet3 = hataOzeti(metin3);
kontrol(ozet3.includes('TypeError: x is not a function'), 'TypeError satırı', ozet3);
kontrol(ozet3.includes('at f (/x/a.mjs:3:1)'), 'yığın satırı', ozet3);

vaka('hataozeti_taninmayan');
const metin4 = 'z'.repeat(4000);
kontrol(hataOzeti(metin4) === metin4.slice(-1500), 'son 1500 karakter');

vaka('hataozeti_bos');
kontrol(hataOzeti('') === '', 'boş metin');

vaka('hataozeti_sinir');
kontrol(hataOzeti(metin3, 200).length <= 200, 'sinir 200');

vaka('boyut_kucuk');
const r1 = boyutDenetle({ dosya: 1, satir: 10 });
kontrol(r1 && r1.tur === 'kucuk' && typeof r1.ileti === 'string' && r1.ileti.length > 0 && r1.ileti.includes('10'), 'kucuk', JSON.stringify(r1));

vaka('boyut_null1');
kontrol(boyutDenetle({ dosya: 2, satir: 60 }) === null, '60 null');

vaka('boyut_null2');
kontrol(boyutDenetle({ dosya: 3, satir: 250 }) === null, '250 null');

vaka('boyut_buyuk_satir');
const r4 = boyutDenetle({ dosya: 2, satir: 251 });
kontrol(r4 && r4.tur === 'buyuk' && typeof r4.ileti === 'string' && r4.ileti.length > 0 && r4.ileti.includes('251'), 'buyuk satir', JSON.stringify(r4));

vaka('boyut_buyuk_dosya');
const r5 = boyutDenetle({ dosya: 4, satir: 100 });
kontrol(r5 && r5.tur === 'buyuk' && typeof r5.ileti === 'string' && r5.ileti.length > 0 && r5.ileti.includes('100'), 'buyuk dosya', JSON.stringify(r5));

// Bölüm B
vaka('runner_kucuk');
setup(plan('m/a', KAPI), "yaz('cikti.txt', 'x\\n');");
commit0();
kosu();
kontrol(SON.kod === 0, 'çıkış 0', SON.cikti);
kontrol(SON.cikti.includes('UYARI: story boyutu'), 'uyarı var', SON.cikti);
const m7 = M();
kontrol(m7.length === 1 && m7[0].boyut === 'kucuk', 'metrik boyut kucuk', JSON.stringify(m7));

vaka('runner_null');
setup(plan('m/a', KAPI), "yaz('cikti.txt', 'x\\n'.repeat(100));");
commit0();
kosu();
kontrol(SON.kod === 0, 'çıkış 0', SON.cikti);
kontrol(!SON.cikti.includes('UYARI: story boyutu'), 'uyarı yok', SON.cikti);
const m8 = M();
kontrol(m8.length === 1 && m8[0].boyut === null, 'metrik boyut null', JSON.stringify(m8));

vaka('runner_ipucu');
setup(plan('m/a', "  - Kapı: `node kapi.mjs`"), "if (n === 1) yaz('cikti.txt', 'yanlis'); else yaz('cikti.txt', 'dogru');");
writeFileSync(join(R, 'kapi.mjs'), "import fs from 'node:fs';\nimport assert from 'node:assert';\nconst filler = 'x'.repeat(2500);\nprocess.stdout.write(filler);\nconst data = fs.readFileSync('cikti.txt', 'utf8');\nassert.equal(data, 'dogru');\n");
commit0();
kosu({ DENEME: '2' });
kontrol(SON.kod === 0, 'çıkış 0', SON.cikti);
const istem2 = oku(join(T, 'istem-2.txt'));
kontrol(istem2.includes('AssertionError'), 'istem-2 AssertionError', istem2.slice(-500));

bitir();
