// mdk-adim.mjs testi: sahte opencode (.mjs) ile, geçici git deposunda, ağsız ve hızlı.
// Kullanım: node test/mdk-adim.test.mjs [vaka|grup ...]   (boşsa hepsi; grup: temel)
import { KOK, commit, denetci, depo, existsSync, gecici, git, join, kos, kosArka, metrikler, mkdirSync, oku, readFileSync, stub, uyu, writeFileSync, yetimVar } from './yardim.mjs';
import { copyFileSync, readdirSync } from 'node:fs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-adim.test');
// kapılar bash'siz de (Windows cmd) çalışsın: node -e
const VAR = (f) => `node -e "process.exit(require('fs').existsSync('${f}')?0:1)"`;
const KAPI = `  - Kapı: \`${VAR('cikti.txt')}\``;
const plan = (m, adim) => `Yürütücü: opencode\nModeller: ${m}\n\n## K\n- [ ] 1. İş\n${adim}\n`;
const YAZ = "yaz('cikti.txt', 'x\\n');";

let T, R, CP, OC, SON;
function setup(planMetni, govde, stubOpt) { T = gecici(); R = join(T, 'repo'); depo({ 'PLAN.md': planMetni }, { R }); OC = stub(T, govde, stubOpt); }
const commit0 = () => { CP = commit(R); };
const ortam = (ek = {}) => ({ STUB_DIR: T, MDK_OPENCODE: OC, POLL: '1', DENEME: '1', SURE: '30', MDK_KILIT: join(T, 'kilit'), ...ek });
function kosu(ek = {}, run = RUNNER) { SON = kos(run, ['1'], { cwd: R, env: ortam(ek) }); return SON; }
const M = () => metrikler(join(R, 'metrikler.jsonl'));
const gecti = () => M().map((x) => x.gecti).join();
const neden = () => M().map((x) => x.neden ?? '-').join();
const modeller = () => oku(join(T, 'modeller.log')).trim().split('\n').filter(Boolean).join();
const p = (f) => oku(join(R, f));
const temiz = () => git(R, 'status', '--porcelain').stdout === '';
const head = () => git(R, 'rev-parse', 'HEAD').stdout.trim();
const k = (kosul, mesaj) => kontrol(kosul, mesaj, SON?.cikti);
const izin = (n) => JSON.parse(oku(join(T, `izin-${n}.json`))).permission;

const V = {
  gecer() {
    setup(plan('m/a', KAPI), YAZ); commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(/^- \[x\] 1\./m.test(p('PLAN.md')), '[x]');
    k(/^adım 1:/.test(git(R, 'log', '-1', '--format=%s').stdout), 'commit konusu');
    k(gecti() === 'true', 'gecti'); k(p('durum.json').includes('"durum":"gecti"'), 'durum gecti');
  },
  ikinci() {
    setup(plan('m/a', KAPI), "if (n === 1) yaz('kalinti.txt', 'x'); else yaz('cikti.txt', 'x');"); commit0(); kosu({ DENEME: '2' });
    k(SON.kod === 0, 'çıkış 0'); k(gecti() === 'false,true', 'gecti listesi'); k(!existsSync(join(R, 'kalinti.txt')), 'kalıntı temizlendi');
  },
  eskale() {
    setup(plan('m/a, m/b', KAPI), ''); commit0(); kosu();
    k(SON.kod === 2, 'çıkış 2'); k(gecti() === 'false,false', 'gecti'); k(p('durum.json').includes('eskale'), 'durum eskale');
    k(temiz() && head() === CP, 'ağaç temiz, HEAD aynı'); k(modeller() === 'm/a,m/b', 'model sırası');
  },
  donmus() { // model koşu sırasında koşturucu modüllerini bozsa da donmuş kopya etkilenmez
    setup(plan('m/a', KAPI), "for (const f of ['mdk-adim.mjs','mdk-ortak.mjs','mdk-adim-kapi.mjs']) fs.appendFileSync(f, 'KOTU (((\\n'); " + YAZ);
    for (const f of ['mdk-adim.mjs', 'mdk-ortak.mjs', 'mdk-adim-kapi.mjs']) copyFileSync(join(KOK, f), join(R, f));
    commit0(); kosu({}, join(R, 'mdk-adim.mjs'));
    k(SON.kod === 0, 'çıkış 0'); k(existsSync(join(R, '.mdk-log/donmus/mdk-adim.mjs')) && !p('.mdk-log/donmus/mdk-ortak.mjs').includes('KOTU'), 'donmuş kopya sağlam');
  },
  kurcalama() {
    setup(plan('m/a', '  - Kapı: `node x.test.mjs`'), "yaz('x.test.mjs', 'process.exit(0)\\n');");
    writeFileSync(join(R, 'x.test.mjs'), 'process.exit(1)\n'); commit0(); kosu();
    k(SON.kod === 2, 'çıkış 2'); k(SON.cikti.includes('kurcalama'), 'kurcalama mesajı'); k(p('x.test.mjs').includes('exit(1)'), 'kapı geri alındı');
  },
  coklu() {
    setup(plan('m/a', `  - Kapı: \`${VAR('a.txt')}\`\n  - Kapı: \`${VAR('b.txt')}\``), "yaz('a.txt','x'); if (n === 2) yaz('b.txt','x');"); commit0(); kosu({ DENEME: '2' });
    k(SON.kod === 0, 'çıkış 0'); k(gecti() === 'false,true', 'tüm kapılara bakılır');
  },
  onay() {
    setup(plan('m/a', `${KAPI}\n  - Etki: etki/a.html`), YAZ); commit0(); kosu();
    k(SON.kod === 5, 'onaysız 5'); k(!existsSync(join(T, 'sayac')), 'opencode çağrılmadı');
    setup(plan('m/a', `${KAPI}\n  - Etki: etki/a.html\n  - Onay: evet`), YAZ); commit0(); kosu();
    k(SON.kod === 0, 'onaylı 0');
  },
  neden() {
    setup(plan('m/a', KAPI), "if (n === 2) " + YAZ); commit0(); kosu({ DENEME: '2' });
    k(SON.kod === 0, 'çıkış 0'); k(neden() === 'kapi,-', 'neden listesi');
  },
  sure() {
    setup(plan('m/a', KAPI), "yetim('yetim-31338'); await uyu(60);"); commit0(); kosu({ SURE: '2' });
    k(SON.kod === 2, 'çıkış 2'); k(SON.sn < 25, 'süre'); k(neden() === 'sure', 'neden sure'); k(!yetimVar('yetim-31338'), 'süreç grubu temizlendi');
  },
  yanit_yok() {
    setup(plan('m/a, m/b', KAPI), "yetim('yetim-31339'); await uyu(60);"); commit0(); kosu({ ILK: '2', SURE: '60' });
    k(SON.kod === 6, 'çıkış 6'); k(SON.sn < 25, 'süre'); k(neden() === 'yanit_yok,yanit_yok', 'model başına tek deneme');
    k(!yetimVar('yetim-31339'), 'yetim yok'); k(head() === CP, 'HEAD aynı');
    setup(plan('m/a, m/b', KAPI), "if (M === 'm/a') { yetim('yetim-31339'); await uyu(60); } else " + YAZ); commit0(); kosu({ ILK: '2', SURE: '60' });
    k(SON.kod === 0, 'ikinci model geçer'); k(neden() === 'yanit_yok,-', 'neden'); k(!yetimVar('yetim-31339'), 'yetim yok');
  },
  kota() { // stderr'deki "Free usage limit" satırı: ILK beklenmeden model bırakılır, hepsi kotaysa 6
    const hata = 'timestamp=x level=ERROR message="stream error" error.error="AI_APICallError: Free usage limit reached. Free models work in OpenCode"';
    setup(plan('m/a, m/b', KAPI), `process.stderr.write(${JSON.stringify(hata + '\n')}); yetim('yetim-31340'); await uyu(60);`); commit0(); kosu({ ILK: '30', SURE: '60' });
    k(SON.kod === 6, 'çıkış 6'); k(SON.sn < 15, 'ILK beklenmedi'); k(neden() === 'kota,kota', 'neden kota'); k(SON.cikti.includes('kota'), 'mesaj');
    k(!yetimVar('yetim-31340'), 'yetim yok'); k(head() === CP, 'HEAD aynı');
    setup(plan('m/a, m/b', KAPI), `if (M === 'm/a') { process.stderr.write(${JSON.stringify(hata + '\n')}); await uyu(60); } else ${YAZ}`); commit0(); kosu({ ILK: '30', SURE: '60' });
    k(SON.kod === 0, 'ikinci model'); k(SON.sn < 15, 'hızlı'); k(neden() === 'kota,-', 'neden');
    k(readFileSync(RUNNER, 'utf8').includes('--print-logs'), 'gerçek opencode hatayı yalnız --print-logs ile stderr\'e yazar');
  },
  butce() {
    setup(plan('m/a', `${KAPI}\n  - Bütçe: 1000`), "olay({type:'step_finish',part:{tokens:{total:600},cost:0}}); await uyu(1); olay({type:'step_finish',part:{tokens:{total:600},cost:0}}); yetim('yetim-31337'); await uyu(60);");
    commit0(); kosu();
    k(SON.kod === 2, 'çıkış 2'); k(SON.sn < 25, 'süre'); k(neden() === 'butce', 'neden butce'); k(!yetimVar('yetim-31337'), 'yetim yok');
  },
  butce_model() { // bütçe model başınadır
    setup(plan('m/a, m/b', `${KAPI}\n  - Bütçe: 1000`), "if (M === 'm/a') { olay({type:'step_finish',part:{tokens:{total:1200},cost:0}}); await uyu(60); } else { olay({type:'step_finish',part:{tokens:{total:900},cost:0}}); " + YAZ + ' }');
    commit0(); kosu();
    k(SON.kod === 0, 'ikinci model geçer'); k(neden() === 'butce,-', 'aşan model ikinci kez denenmez');
    setup(plan('m/a, m/b', `${KAPI}\n  - Bütçe: 1000`), "olay({type:'step_finish',part:{tokens:{total:1200},cost:0}}); await uyu(60);"); commit0(); kosu();
    k(SON.kod === 2, 'çıkış 2'); k(neden() === 'butce,butce', 'neden');
  },
  butce_ok() {
    setup(plan('m/a', `${KAPI}\n  - Bütçe: 100000`), YAZ); commit0(); kosu(); k(SON.kod === 0, 'çıkış 0');
  },
  sorun() {
    setup(plan('m/a', KAPI), "yaz('SORUN.md', 'plan eksik\\n'); " + YAZ); commit0(); kosu();
    k(SON.kod === 2, 'SORUN.md varsa başarısız'); k(readdirSync(join(R, '.mdk-log')).some((f) => f.startsWith('sorun-1-')), 'reset öncesi kopya');
    k(neden() === 'sorun', 'neden sorun'); k(head() === CP, 'HEAD aynı');
  },
  once() {
    setup(plan('m/a, m/b', KAPI), ''); commit0(); kosu({ ONCE: 'm/b' }); k(modeller() === 'm/b,m/a', 'ONCE önce');
  },
  deney() {
    setup(plan('m/a', KAPI), YAZ + " olay({type:'step_finish',part:{tokens:{total:50},cost:0}});"); commit0(); kosu();
    k(M()[0]?.istek === 2, 'istek 2'); k(M()[0]?.deney === null, 'deney null');
    setup(plan('m/a', KAPI), YAZ); commit0(); kosu({ MDK_METRIK: join(T, 'dis.jsonl'), MDK_DURUM: join(T, 'dis-durum.json'), MDK_DENEY: 'L1' });
    k(SON.kod === 0, 'çıkış 0'); k(!existsSync(join(R, 'metrikler.jsonl')) && !existsSync(join(R, 'durum.json')), 'dışarıya yazıldı');
    const r = metrikler(join(T, 'dis.jsonl'))[0] || {}; k(r.deney === 'L1' && r.istek === 1 && r.gecti, 'dış metrik');
    const d = JSON.parse(oku(join(T, 'dis-durum.json')) || '{}'); k(d.deney === 'L1' && d.durum === 'gecti', 'dış durum');
  },
  v2() { // v2 biçimi: step_finish'te total yok, son adımda step_finish yok
    setup(plan('m/a', KAPI), YAZ + `
olay({type:'step_start'});
olay({type:'step_finish',part:{tokens:{input:100,output:10,reasoning:5,cache:{read:1000,write:0}},cost:0}});
olay({type:'step_start'});
olay({type:'step_finish',part:{tokens:{input:20,output:4,reasoning:0,cache:{read:1100,write:0}},cost:0}});
olay({type:'step_start'}); metin('bitti');`, { son: false });
    commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(M()[0]?.token === 2239, 'token'); k(M()[0]?.etkin === 139, 'etkin'); k(M()[0]?.istek === 3, 'istek');
    const argv = oku(join(T, 'argv')).split('\n');
    k(!argv.includes('--standalone') && !argv.includes('--log-level'), 'bayraklar'); k(/^error$/im.test(oku(join(T, 'loglevel'))), 'OPENCODE_LOG_LEVEL');
    const c = oku(join(T, 'izin-1.json')); k(c.includes('"external_directory":"deny"') && c.includes('"shell":{'), 'v2 izinleri');
  },
  v1_token() { setup(plan('m/a', KAPI), YAZ); commit0(); kosu(); k(M()[0]?.token === 100, 'token 100'); },
  v2_kota() {
    const hata = { type: 'error', error: { type: 'provider.error', message: 'Free usage limit reached. Free models work in OpenCode' } };
    setup(plan('m/a, m/b', KAPI), `olay(${JSON.stringify(hata)}); await uyu(60);`); commit0(); kosu({ ILK: '30', SURE: '60' });
    k(SON.kod === 6, 'çıkış 6'); k(SON.sn < 15, 'hızlı'); k(neden() === 'kota,kota', 'neden');
  },
  cursor() { // cursor/<model> cursor-agent ile koşar; token result.usage'dan; izinler .cursor/cli.json'da
    setup(plan('cursor/auto', KAPI), ''); commit0();
    const cur = join(T, 'cursor-agent.mjs');
    writeFileSync(cur, `import fs from 'node:fs'; const D=process.env.STUB_DIR;
fs.writeFileSync(D+'/argv', process.argv.slice(2).join('\\n')+'\\n'); try { fs.copyFileSync('.cursor/cli.json', D+'/izin'); } catch {}
fs.writeFileSync('cikti.txt','x');
for (const o of [{type:'system',subtype:'init',model:'Auto'},{type:'assistant',model_call_id:'a1',message:{}},{type:'assistant',model_call_id:'a1',message:{}},{type:'assistant',model_call_id:'a2',message:{}},{type:'assistant',message:{}},{type:'result',subtype:'success',is_error:false,usage:{inputTokens:100,outputTokens:10,cacheReadTokens:1000,cacheWriteTokens:5}}]) console.log(JSON.stringify(o));
`);
    kosu({ MDK_CURSOR: cur });
    k(SON.kod === 0, 'çıkış 0'); k(modeller() === '', 'opencode çağrılmadı');
    const m = M()[0] || {}; k(m.yurutucu === 'cursor' && m.model === 'cursor/auto', 'yürütücü'); k(m.token === 1115 && m.etkin === 115, 'token'); k(m.istek === 2, 'istek');
    const a = oku(join(T, 'argv')).split('\n');
    k(a.includes('-p') && a.includes('--trust') && a.includes('stream-json') && a[a.indexOf('--model') + 1] === 'auto', 'argümanlar');
    k(!a.some((x) => ['--force', '--yolo', '-f'].includes(x)), 'her şeye izin yok');
    k(oku(join(T, 'izin')).includes('"Shell(git push)"') && oku(join(T, 'izin')).includes('"Shell(sudo)"'), 'izin listesi');
    k(temiz(), 'izin dosyası ağacı kirletmez'); k(!git(R, 'log', '-1', '--name-only', '--format=').stdout.includes('.cursor/'), 'commit\'e girmez');
  },
  cursor_kota() {
    setup(plan('cursor/auto', KAPI), ''); commit0();
    const cur = join(T, 'cursor-agent.mjs'); writeFileSync(cur, "process.stderr.write('Error: You have hit your usage limit. Upgrade to Pro\\n'); process.exit(1);\n");
    kosu({ MDK_CURSOR: cur, DENEME: '2' });
    k(SON.kod === 6, 'çıkış 6'); k(neden() === 'kota', 'neden kota');
  },
  v2_kota_metin() { // araç çıktısında geçen "Free usage limit" metni kota sayılmaz
    setup(plan('m/a', KAPI), YAZ + " olay({type:'tool_use',part:{state:{output:'grep -q Free usage limit'}}}); await uyu(2);"); commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(neden() === '-', 'neden yok');
  },
  gorev() {
    setup(gplan('  - Görev: kapi\n' + KAPI), YAZ); commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(modeller() === 'm/kapi1', 'Görev kapi modeli'); k(M()[0]?.gorev === 'kapi', 'metrik görev');
  },
  gorev_adim() {
    setup(gplan('  - Görev: kapi\n  - Modeller: m/ozel\n' + KAPI), YAZ); commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(modeller() === 'm/ozel', 'adım Modeller önce');
  },
  gorev_yok() {
    setup(gplan('  - Görev: uydurma\n' + KAPI), YAZ); commit0(); kosu();
    k(SON.kod === 4, 'çıkış 4'); k(SON.cikti.includes('uydurma') && SON.cikti.includes('kod') && SON.cikti.includes('kapi'), 'geçerli türler'); k(!existsSync(join(T, 'modeller.log')), 'model çağrılmadı');
  },
  gorev_varsayilan() {
    setup(gplan(KAPI), "if (M === 'm/kod2') " + YAZ); commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(modeller() === 'm/kod1,m/kod2', 'model sırası'); k(M().map((x) => x.gorev).join() === 'kod,kod', 'görev kod');
  },
  async kilit_bekle() { // tek model kilitli: B bekler, A bitince alır; bekleme deneme sayılmaz
    const { A, B, K } = ikiDepo('m/a', "await uyu(4); " + YAZ, YAZ);
    const { a, b } = await kosAB(A, B, K);
    k(a.kod === 0 && b.kod === 0, 'ikisi de geçer'); k(b.sn >= 2, 'B bekledi');
    k(metrikler(join(B.R, 'metrikler.jsonl')).length === 1, 'bekleme deneme sayılmaz'); k(!oku(join(B.R, 'metrikler.jsonl')).includes('kilitli'), 'kilitli yok');
    k(readdirSync(K).includes('m_a'), 'kilit işareti m_a');
  },
  async kilit_ikinci() { // iki model: B kilitli m/a'yı atlar, beklemeden m/b'yi alır
    const { A, B, K } = ikiDepo('m/a, m/b', "await uyu(4); " + YAZ, YAZ);
    const { b } = await kosAB(A, B, K);
    k(b.kod === 0 && b.sn < 3, 'B beklemeden geçer'); k(oku(join(B.T, 'modeller.log')).trim() === 'm/b', 'B m/b'); k(oku(join(A.T, 'modeller.log')).trim() === 'm/a', 'A m/a');
  },
  async kilit_tavan() { // tüm modeller kilitli ve tavan dolar: çıkış 8, model çağrılmaz
    const { A, B, K } = ikiDepo('m/a', "await uyu(8); " + YAZ, YAZ);
    const { b } = await kosAB(A, B, K, { MDK_KILIT_TAVAN: '2' });
    k(b.kod === 8 && b.sn < 6, 'çıkış 8'); k(!existsSync(join(B.T, 'modeller.log')), 'model çağrılmadı');
  },
  plan_dokunma() {
    setup(plan('m/a', KAPI), YAZ); commit0(); kosu({ MDK_PLAN_DOKUNMA: '1' });
    k(SON.kod === 0, 'çıkış 0'); k(/^- \[ \] 1\./m.test(p('PLAN.md')), '[x] işaretlenmez'); k(/^adım 1:/.test(git(R, 'log', '-1', '--format=%s').stdout), 'commit'); k(temiz(), 'temiz');
  },
  ortam_yalitim() { // dış koşunun iç değişkenleri kapıya sızmaz
    const g = `node -e "process.exit(require('fs').existsSync('cikti.txt')&&!['MDK_METRIK','MDK_DURUM','MDK_PLAN_DOKUNMA','MDK_KILIT'].some(k=>process.env[k])?0:1)"`;
    setup(plan('m/a', `  - Kapı: \`${g}\``), YAZ); commit0();
    kosu({ MDK_METRIK: join(T, 'dis.jsonl'), MDK_DURUM: join(T, 'dis.json'), MDK_PLAN_DOKUNMA: '1', MDK_KILIT: join(T, 'k') });
    k(SON.kod === 0, 'çıkış 0'); k(oku(join(T, 'dis.jsonl')).includes('"gecti":true'), 'dış metrik');
  },
  onkontrol_durum() { // ön regresyon hızlı kipte koşar, sürerken durum.json "regresyon"
    setup(plan('m/a', KAPI), YAZ);
    yazHepsi("fs.writeFileSync(process.env.STUB_DIR + '/onk.txt', 'hizli=' + (process.env.HEPSI_HIZLI || '') + ' durum=' + (fs.existsSync('durum.json') ? fs.readFileSync('durum.json', 'utf8') : ''));");
    commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(/^hizli=1 /.test(oku(join(T, 'onk.txt'))), 'HEPSI_HIZLI=1'); k(oku(join(T, 'onk.txt')).includes('"durum":"regresyon"'), 'durum regresyon');
    k(p('durum.json').includes('"durum":"gecti"'), 'sonunda gecti');
  },
  onkontrol_kirmizi() {
    setup(plan('m/a', KAPI), YAZ); yazHepsi("console.log('BAŞARISIZ: panel/x.test.mjs'); process.exit(1);"); commit0(); kosu();
    k(SON.kod === 4, 'çıkış 4'); k(!existsSync(join(T, 'modeller.log')), 'model çağrılmadı'); k(p('durum.json').includes('"durum":"regresyon_kirmizi"'), 'durum'); k(SON.cikti.includes('panel/x.test.mjs'), 'kırmızı satır');
  },
  onkontrol_onay() {
    setup(plan('m/a', `${KAPI}\n  - Etki: etki/a.html`), YAZ); yazHepsi("fs.writeFileSync(process.env.STUB_DIR + '/onk.txt', '');"); commit0(); kosu();
    k(SON.kod === 5, 'çıkış 5'); k(!existsSync(join(T, 'onk.txt')), 'ön regresyon koşmadı'); k(!p('durum.json').includes('regresyon'), 'durum takılı değil');
  },
  regresyon_sonra() { // adım kapısı geçse de regresyon kırıldıysa deneme başarısız; çıktı sonraki denemeye ipucu
    setup(plan('m/a', KAPI), YAZ + " if (n === 1) yaz('bozuk.txt', 'x');");
    yazHepsi("if (fs.existsSync('bozuk.txt')) { console.log('BAŞARISIZ: panel/denge.test.mjs'); process.exit(1); }"); commit0(); kosu({ DENEME: '2' });
    k(SON.kod === 0, 'çıkış 0'); k(gecti() === 'false,true', 'gecti'); k(neden() === 'regresyon,-', 'neden');
    k(oku(join(T, 'istem-2.txt')).includes('panel/denge.test.mjs'), 'ipucu ikinci istemde'); k(!existsSync(join(R, 'bozuk.txt')), 'temiz');
    setup(plan('m/a', KAPI), YAZ + " yaz('bozuk.txt', 'x');"); yazHepsi("if (fs.existsSync('bozuk.txt')) process.exit(1);"); commit0(); kosu();
    k(SON.kod === 2, 'tek denemede kalır'); k(/^- \[ \] 1\./m.test(p('PLAN.md')) && temiz(), 'geçmiş sayılmaz, ağaç temiz');
  },
  izin_kural() { // yasaklar izinde; kurallar ve proje kuralları istemde; Claude kuralları yürütücüye gitmez
    setup(kplan('m/kapi'), `if (M === 'm/kapi') { ${KAPI_IYI} } else yaz('yeni.mjs', 'export const x = 1;\\n');`); commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(modeller() === 'm/kapi,m/kod', 'model sırası');
    let c = izin(1); k(c.edit['*'] === 'deny' && c.edit['yeni.test.mjs'] === 'allow', 'kapı izinleri');
    c = izin(2);
    k([c.edit['*'], c.edit['PLAN.md'], c.edit['test/*'], c.edit['*.test.*'], c.edit['kapi/*']].join() === 'allow,deny,deny,deny,deny', 'kod edit izinleri');
    k([c.bash['*'], c.bash['*test/hepsi.mjs*'], c.bash['*mdk-adim.test.mjs*'], c.bash['git push*'], c.bash['git stash*'], c.bash['sudo *']].join() === 'allow,deny,deny,deny,deny,deny', 'kod kabuk izinleri');
    k(JSON.stringify(c.shell) === JSON.stringify(c.bash) && c.external_directory === 'deny', 'v2 adları');
    k(oku(join(T, 'yalitim-1.txt')) === '1' && oku(join(T, 'yalitim-2.txt')) === '1', 'yalıtım');
    const i1 = oku(join(T, 'istem-1.txt')), i2 = oku(join(T, 'istem-2.txt'));
    k(i1.includes('Yürütücü kuralları') && i2.includes('Yürütücü kuralları'), 'yürütücü kuralları istemde');
    k(i2.includes('Yalnız yerleşik modüller') && i2.includes('yeni.mjs x=1'), 'proje kuralı + adım'); k(i1.includes('KAPI ÜRETME') && !i2.includes('KAPI ÜRETME'), 'kapı istemi ayrı');
    // adımın kendi kapısındaki betik yasaklanmaz; MDK_CLAUDE_KURAL=1 yalıtımı kapatır
    setup(plan('m/a', `  - Kapı: \`node test/mdk-adim.test.mjs || ${VAR('cikti.txt')}\``), YAZ); commit0(); kosu({ MDK_CLAUDE_KURAL: '1' });
    k(SON.kod === 0, 'çıkış 0'); c = izin(1);
    k(String(c.bash['*mdk-adim.test.mjs*']) === 'undefined' && c.bash['*test/hepsi.mjs*'] === 'deny', 'kapıdaki betik serbest'); k(oku(join(T, 'yalitim-1.txt')) === '', 'yalıtım kapalı');
  },
  kapi_metrik() {
    setup(kplan('m/kapi'), `if (M === 'm/kapi') { ${KAPI_IYI} } else yaz('yeni.mjs', 'export const x = 1;\\n');`); commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(M().map((x) => `${x.tur || 'adim'}:${x.model}:${x.gecti}`).join() === 'kapi:m/kapi:true,adim:m/kod:true', 'metrik satırları');
    const r = M()[0] || {}; k(`${r.gorev},${r.deneme},${r.token},${typeof r.sure_sn}` === 'kapi,1,100,number', 'kapı metriği');
    k(/^adım 1 kapısı: yeni\.test\.mjs \(m\/kapi\)/m.test(git(R, 'log', '--format=%s').stdout), 'kapı commit\'i');
  },
  kapi_sozdizimi() { // sözdizimi bozuk ya da kod yazılmadan yeşil kapı reddedilir, sıradaki kapı modeli denenir
    setup(kplan('m/k1, m/k2, m/k3'), `if (M === 'm/k1') yaz('yeni.test.mjs', 'import {\\n'); else if (M === 'm/k2') yaz('yeni.test.mjs', 'process.exit(0)\\n'); else if (M === 'm/k3') { ${KAPI_IYI} } else yaz('yeni.mjs', 'export const x = 1;\\n');`);
    commit0(); kosu();
    k(SON.kod === 0, 'çıkış 0'); k(modeller() === 'm/k1,m/k2,m/k3,m/kod', 'model sırası'); k(neden() === 'kapi_sozdizimi,kapi_yesil,-,-', 'nedenler'); k(p('yeni.test.mjs').includes('assert.equal'), 'iyi kapı');
    setup(kplan('m/k1'), "yaz('yeni.test.mjs', 'import {\\n');"); commit0(); kosu();
    k(SON.kod === 4 && modeller() === 'm/k1', 'kod modeli çağrılmaz'); k(!existsSync(join(R, 'yeni.test.mjs')) && temiz(), 'temiz');
  },
};
const gplan = (adim) => `Yürütücü: opencode\nModeller: m/genel\nGörev kod: m/kod1, m/kod2\nGörev kapi: m/kapi1\n\n## K\n- [ ] 1. İş\n${adim}\n`;
const kplan = (kapi) => `Yürütücü: opencode\nModeller: m/kod\nGörev kod: m/kod\nGörev kapi: ${kapi}\n\nKurallar (tüm adımlar için):\n- Yalnız yerleşik modüller.\n\n## K\n- [ ] 1. İş\n  - Ne: yeni.mjs x=1 dışa aktarır\n  - Kapı: \`node yeni.test.mjs\`\n`;
const KAPI_IYI = "yaz('yeni.test.mjs', 'import assert from \"node:assert\"; import { x } from \"./yeni.mjs\"; assert.equal(x, 1);\\n');";
function yazHepsi(govde) { mkdirSync(join(R, 'test'), { recursive: true }); writeFileSync(join(R, 'test/hepsi.mjs'), `import fs from 'node:fs';\n${govde}\n`); }
function ikiDepo(m, govdeA, govdeB) {
  const K = gecici('kilit-');
  setup(plan(m, KAPI), govdeA); commit0(); const A = { T, R, OC };
  setup(plan(m, KAPI), govdeB); commit0(); const B = { T, R, OC };
  return { A, B, K };
}
async function kosAB(A, B, K, ek = {}) { // A arka planda, A kilidi alınca B
  const env = (x) => ({ STUB_DIR: x.T, MDK_OPENCODE: x.OC, POLL: '1', DENEME: '1', SURE: '30', MDK_KILIT: K, MDK_KILIT_BEKLE: '1', ...ek });
  const ap = kosArka(RUNNER, ['1'], { cwd: A.R, env: env(A) });
  // A kilidi alana kadar bekle (sabit süre değil: Node koşturucusunun açılışı makineye göre değişir)
  for (let i = 0; i < 100 && !readdirSync(K).some((f) => f.endsWith('.kilit')); i++) await uyu(100);
  const b = await kosArka(RUNNER, ['1'], { cwd: B.R, env: env(B) });
  const a = await ap; T = B.T; R = B.R; SON = b;
  return { a, b };
}

const TEMEL = ['gecer', 'ikinci', 'eskale', 'donmus', 'kurcalama'];
let secilen = process.argv.slice(2);
if (!secilen.length) secilen = Object.keys(V);
secilen = secilen.flatMap((x) => (x === 'temel' ? TEMEL : [x]));
for (const v of secilen) {
  if (!V[v]) { console.log(`bilinmeyen vaka: ${v}`); process.exit(64); }
  vaka(v); SON = null; await V[v]();
}
bitir();
