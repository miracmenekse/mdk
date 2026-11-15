// Kullanım (proje kökünde): mdk-adim.mjs <adım-no> [plan-dosyası]
// PLAN.md adımını ücretsiz modellerden başlayarak OpenCode'a yaptırır, "Kapı" komutuyla doğrular.
// Çıkış: 0 geçti | 2 eskale (modeller tükendi, kodcu/Claude devralsın) | 3 bu adım opencode'un değil | 4 ön koşul | 5 taslak ya da Epic çözüm onayı bekliyor | 6 sağlayıcı yanıt vermiyor | 8 modeller kilitli (tavan doldu)
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, writeSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const BURASI = dirname(fileURLToPath(import.meta.url));
const MODULLER = ['mdk-adim.mjs', 'mdk-ortak.mjs', 'mdk-adim-kapi.mjs', 'mdk-hata.mjs'];
// donmuş kopya: bir adım koşturucuyu değiştirse ya da git geri alsa da çalışan koşturucu etkilenmez
if (!process.env.MDK_DONMUS) {
  const asil = process.env.MDK_SELF_DIR || BURASI, d = join('.mdk-log', 'donmus');
  mkdirSync(d, { recursive: true });
  for (const f of MODULLER) if (existsSync(join(BURASI, f))) copyFileSync(join(BURASI, f), join(d, f));
  const r = spawnSync(process.execPath, [join(d, 'mdk-adim.mjs'), ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, MDK_DONMUS: '1', MDK_SELF_DIR: asil } });
  process.exit(r.status ?? 1);
}

const { adimBlogu, epicBlogu, kilitAl, kilitBirak, kos, modelListesi, olaylariTopla, opencodeSec, oturumKapat, planSatiri, zombiTemizle } = await import('./mdk-ortak.mjs');
const { eksikKapilar, izinYapilandirmasi, kabukKos, kapiUret, temizOrtam } = await import('./mdk-adim-kapi.mjs');
// donmuş kopya elde mdk-hata.mjs yoksa (ör. eski bir depo) koşturucu yine açılsın: hata yönetimi devre dışı kalır
const hata = await import('./mdk-hata.mjs').catch(() => ({ gunlukHatasi: () => null, iletiBul: () => null, bekleMs: (t, b = 5000, c = 60000) => Math.min(c, b * 3 ** (t - 1)) }));
const { gunlukHatasi, iletiBul, bekleMs } = hata;

// pipe'a yazılan çıktı process.exit'te kesilmesin: eşzamanlı yaz
const yaz = (s) => writeSync(1, s + '\n');
const hataYaz = (s) => writeSync(2, s + '\n');
const kirp = (s) => s.replace(/\n+$/, '');
const oku = (y) => { try { return readFileSync(y, 'utf8'); } catch { return ''; } };
const sn = () => Math.floor(Date.now() / 1000);
const uyu = (ms) => new Promise((coz) => setTimeout(coz, ms));
const git = (...a) => spawnSync('git', a, { encoding: 'utf8', maxBuffer: 256 << 20 });
const e = process.env;

const SELF = e.MDK_SELF_DIR || BURASI;
const N = process.argv[2];
if (!N) { hataYaz('adım no gerekli'); process.exit(1); }
const PLAN = process.argv[3] || 'PLAN.md';
let DENEME = Number(e.DENEME || 2);   // model başına deneme
const SURE = Number(e.SURE || 600);   // deneme başına saniye
const POLL = Number(e.POLL || 3);     // süreç izleme aralığı, saniye
const ILK = Number(e.ILK || 75);      // ilk olay bu kadar saniyede gelmezse sağlayıcı yanıt vermiyor sayılır
const OC = opencodeSec(SELF);
const KOTA = /Free usage limit|Go usage limit|GoUsageLimitError|provider\.quota/;
zombiTemizle(OC);
const LOGD = '.mdk-log'; mkdirSync(LOGD, { recursive: true });
// deney koşusu worktree'den ana deponun dosyalarına yazabilsin, panel canlı görsün
const METRIK = e.MDK_METRIK || 'metrikler.jsonl';
const DURUM = e.MDK_DURUM || 'durum.json';
const DENEY = e.MDK_DENEY || null;

let plan = oku(PLAN);
const blok = kirp(adimBlogu(plan, N));
if (!blok) { yaz(`adım ${N} bulunamadı`); process.exit(4); }
const ilkSatir = blok.split(/\r?\n/)[0];
const baslik = ilkSatir.replace(/^- \[.\] [0-9]+\.\s*/, '');
if (/^- \[x\]/.test(ilkSatir)) { yaz(`adım ${N} zaten bitmiş`); process.exit(0); }

const KAPILAR = [...blok.matchAll(/^\s*- Kapı: `([^`]+)/gm)].map((m) => m[1]);
if (!KAPILAR.length) { yaz(`adım ${N} için Kapı yok`); process.exit(4); }
const yur = (blok.match(/^\s*- Yürütücü: (\S+)/m) || plan.match(/^Yürütücü: (\S+)/m) || [])[1];
if ((yur || 'kodcu') !== 'opencode') { yaz(`adım ${N} yürütücüsü ${yur || 'kodcu'}`); process.exit(3); }
// görev türü: adım satırı yoksa kod; tanımsız tür modele gitmeden çıkar
let gorev = (blok.match(/^\s*- Görev: (\S+)/m) || [])[1] || 'kod';
const gorevSatir = planSatiri(plan, `Görev ${gorev}`);
if (gorevSatir === null && gorev !== 'kod') {
  yaz(`tanımsız görev türü: ${gorev} (geçerli: ${[...plan.matchAll(/^Görev ([^:]+):/gm)].map((m) => m[1]).join(' ')})`); process.exit(4);
}
// model listesi: adım > Görev <tür> > dosya Modeller
const modline = (blok.match(/^\s*- Modeller: (.*)/m) || [])[1] || gorevSatir || planSatiri(plan, 'Modeller') || '';
let MODELLER = modelListesi(modline);
if (!MODELLER.length) { yaz('Modeller satırı yok (adım, Görev ya da PLAN)'); process.exit(4); }
// ONCE=<model>: listede varsa bu çalıştırmada önce o denenir
if (e.ONCE && MODELLER.includes(e.ONCE)) MODELLER = [e.ONCE, ...MODELLER.filter((x) => x !== e.ONCE)];
// otomatik eskale modelleri: Görev kod/vb. modelleri gerçek hatayla tükenirse kodcu öncesi Görev eskale: denenir
let ESKALE = [];
if (gorev !== 'eskale' && !/^\s*- Modeller:/m.test(blok)) ESKALE = modelListesi(planSatiri(plan, 'Görev eskale') || '').filter((m) => !MODELLER.includes(m));
// token bütçesi (model başına): adım satırı önceliklidir, yoksa dosya başındaki Bütçe
const bm = blok.match(/^\s*- Bütçe: ([0-9]+)/m) || plan.match(/^Bütçe: ([0-9]+)/m);
const butce = bm ? Number(bm[1]) : null;

// geri alma güvenliği: temiz git ağacı şart (kontrol noktası = HEAD)
if (git('rev-parse', '--git-dir').status !== 0) { yaz('git deposu değil'); process.exit(4); }
if (git('check-ignore', '-q', '.mdk-log').status !== 0) { yaz(".gitignore'a .mdk-log/, durum.json, metrikler.jsonl ekle"); process.exit(4); }
if (git('status', '--porcelain').stdout.trim()) { yaz('çalışma ağacı kirli; önce commit et'); process.exit(4); }
let CP = git('rev-parse', 'HEAD').stdout.trim();
const sifirla = () => { git('reset', '-q', '--hard', CP); git('clean', '-fdq'); };
const yazDurum = (model, deneme, durum, neden) => writeFileSync(DURUM, JSON.stringify({ adim: Number(N), baslik, model: model || '', deneme: Number(deneme || 0), durum, ...(neden ? { neden } : {}), deney: DENEY, ts: Date.now() }));
const yazMetrik = (o) => appendFileSync(METRIK, JSON.stringify(o) + '\n');

// taslak onayı: etki taslağı olan adım, insan onayı yoksa opencode hiç çağrılmadan durur
if (/^\s*- Etki:/m.test(blok) && !/^\s*- Onay: evet\b/m.test(blok)) { yaz(`adım ${N} taslak onayı bekliyor: PLAN.md'ye "- Onay: evet" ekle`); process.exit(5); }
// Epic çözüm onayı: tartışması olan Epic'in çözümü onaylanmadıysa adım koşmaz
const epik = epicBlogu(plan, N);
if (/^- Tartışma:/m.test(epik) && !/^- Onay: evet/m.test(epik)) { yaz(`adım ${N}: Epic çözüm onayı bekliyor (panelden onayla; node mdk-epic.mjs karar <no> onay)`); process.exit(5); }
// ön kontrol: regresyon kapıları HEAD'de kırmızıysa hiçbir model geçemez (hızlı kip: uzun koşturucu testleri atlanır; eski projelerde test/hepsi.sh)
const HEPSI = existsSync('test/hepsi.mjs') ? 'test/hepsi.mjs' : existsSync('test/hepsi.sh') ? 'test/hepsi.sh' : '';
const REGRESYON = !!HEPSI && !e.MDK_ONKONTROL_YOK;
const regresyon = () => {
  if (HEPSI.endsWith('.sh')) return kabukKos('bash test/hepsi.sh', { env: temizOrtam({ HEPSI_HIZLI: '1' }) });
  const r = spawnSync(process.execPath, [HEPSI], { env: temizOrtam({ HEPSI_HIZLI: '1' }), encoding: 'utf8', maxBuffer: 256 << 20 });
  return { ok: r.status === 0, metin: (r.stdout || '') + (r.stderr || '') };
};
if (REGRESYON) {
  yazDurum('', 0, 'regresyon');
  const r = regresyon();
  if (!r.ok) {
    yazDurum('', 0, 'regresyon_kirmizi');
    yaz(`adım ${N} başlamadı: ${HEPSI} HEAD'de kırmızı (kapıyı düzelt):`);
    const s = kirp(r.metin).split('\n');
    for (const l of s.filter((x) => x.includes('BAŞARISIZ'))) yaz(l);
    yaz(s.slice(-5).join('\n'));
    process.exit(4);
  }
}
// adım bazlı persona turu: "- Persona: sor" varsa kodlamadan önce persona takımını koşturur ve özeti isteme bağlar
let personaIpucu = '';
if (/^\s*- Persona:\s*sor\b/m.test(blok) && existsSync(join(SELF, 'persona-takim-tur.mjs')) && existsSync('persona/takim.json')) {
  yazDurum('', 0, 'persona');
  const soru = join(LOGD, `persona-soru-${N}.txt`); writeFileSync(soru, blok + '\n');
  const pModel = (plan.match(/^Görev persona: ([^, ]+)/m) || [])[1] || 'opencode/beam-free';
  const r = spawnSync(process.execPath, [join(SELF, 'persona-takim-tur.mjs'), soru, pModel], { env: temizOrtam(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const pDizin = kirp(r.stdout || '').split('\n').pop();
  if (pDizin && existsSync(join(pDizin, 'ozet.md'))) {
    personaIpucu = `Persona takımı görüşleri (uygularken dikkate al):\n${kirp(oku(join(pDizin, 'ozet.md')))}`;
    if (e.MDK_PLAN_DOKUNMA !== '1') {
      writeFileSync(PLAN, oku(PLAN).replace(/^(\s*- Persona:)\s*sor\b/gm, `$1 ${pDizin}`));
      git('add', PLAN); git('commit', '-qm', `adım ${N}: persona turu (${pDizin})`); CP = git('rev-parse', 'HEAD').stdout.trim();
    }
  }
}

const SADE = e.MDK_SADE === '1';
e.OPENCODE_CONFIG_CONTENT = izinYapilandirmasi('kod', KAPILAR, [], SADE);
const SADE_IPUCU = SADE ? 'Verimlilik: dosyaları baştan sona okuma: önce grep -n ile yeri bul, sonra yalnız gereken satır aralığını oku. Birbirinden bağımsız okumaları tek adımda birlikte yap. Uzun çıktıları (derleme, test) tail ile kısalt.' : '';
// yürütücü yalıtımı: Claude'un CLAUDE.md'si ve ~/.claude/skills listesi yürütücüye gitmez. MDK_CLAUDE_KURAL=1 eski davranışı açar.
if (e.MDK_CLAUDE_KURAL !== '1') e.OPENCODE_DISABLE_CLAUDE_CODE = '1';
const KURALLAR = kirp(oku(join(SELF, 'yurutucu-kurallar.md')));
// PLAN başındaki "Kurallar (tüm adımlar için):" bloğu; model PLAN.md'yi açmadan görsün
const PROJE_KURAL = (() => { const c = []; let on = false; for (const l of plan.split(/\r?\n/)) { if (/^Kurallar/.test(l)) on = true; if (on && /^\s*$/.test(l)) break; if (on) c.push(l); } return kirp(c.join('\n')); })();

// Cursor CLI (cursor/<model>): --force yok, izin listesi proje .cursor/cli.json'da; dosya her denemede yeniden yazılır, git'ten gizlenir
const CURSOR_IZIN = '{"permissions":{"allow":["Read(**)","Write(**)","Shell(bash)","Shell(sh)","Shell(node)","Shell(npm)","Shell(npx)","Shell(git)","Shell(grep)","Shell(sed)","Shell(awk)","Shell(cat)","Shell(ls)","Shell(head)","Shell(tail)","Shell(wc)","Shell(find)","Shell(sort)","Shell(diff)","Shell(mkdir)","Shell(cp)","Shell(mv)","Shell(rm)","Shell(touch)","Shell(chmod)","Shell(echo)","Shell(test)","Shell(python3)"],"deny":["Shell(sudo)","Shell(git push)"]}}';
function cursorIzin() {
  mkdirSync('.cursor', { recursive: true }); writeFileSync('.cursor/cli.json', CURSOR_IZIN + '\n');
  const ex = git('rev-parse', '--git-path', 'info/exclude').stdout.trim();
  if (!oku(ex).split('\n').includes('.cursor/cli.json')) { mkdirSync(dirname(ex), { recursive: true }); appendFileSync(ex, '.cursor/cli.json\n'); }
}
const kotaVar = (log) => KOTA.test(oku(log + '.err')) || oku(log).split('\n').some((l) => /"type":"error"/.test(l) && KOTA.test(l.slice(l.indexOf('"type":"error"'))));
// sağlayıcı sorunları: modele değil sağlayıcıya yazılır, eskale edilmez ve kalıcı olanlar sıradaki modele geçer
const SAGLAYICI_TURLER = ['oran', 'sunucu', 'ag', 'kimlik', 'model_yok', 'kota'];
const GECICI_TURLER = ['oran', 'sunucu', 'ag'];
const GECICI_TEKRAR = Number(e.MDK_GECICI_TEKRAR ?? 2);
const GECICI_BEKLE = Number(e.MDK_GECICI_BEKLE_MS || 5000);

let harcanan = 0;
// tek koşu (kapı üretimi ve adım aynı döngüyü kullanır): modeli başlatır, izler, gerekirse öldürür
async function calistir(cm, bas, ist, log, bd) {
  const t0 = sn(); let yurm, komut, args, env;
  if (cm.startsWith('cursor/')) {
    yurm = 'cursor'; cursorIzin();
    komut = e.MDK_CURSOR || 'cursor-agent'; args = ['-p', '--output-format', 'stream-json', '--trust', '--model', cm.slice(7), ist]; env = temizOrtam();
  } else {
    yurm = 'opencode'; komut = OC; args = ['run', '-m', cm, '--title', bas, '--format', 'json', '--print-logs', ist]; env = temizOrtam({ OPENCODE_LOG_LEVEL: 'error' });
  }
  const durdur = () => {
    if (kotaVar(log)) return 'kota'; // kota dolu: stderr'deki log ya da v2'nin stdout error olayı; ILK'yı bekleme
    if (bd && butce !== null && harcanan + olaylariTopla(log).etkin > butce) return 'butce'; // etkin token: önbellekten okunan bağlam sayılmaz
    return null;
  };
  const r = await kos({ komut, args, env, log, ilk: ILK, sure: SURE, poll: POLL * 1000, durdur });
  let neden = r.neden || '';
  if (!neden && yurm === 'opencode' && kotaVar(log)) neden = 'kota'; // hızlı kota çıkışı: süreç POLL dolmadan çıkabilir
  if (!neden && yurm === 'cursor' && /usage limit|rate limit|upgrade to|quota/i.test(oku(log + '.err'))) neden = 'kota'; // tahmin; gerçek mesaj görülünce daralt
  if (!neden && yurm === 'opencode') { // günlükteki hata olayından tür çıkar; bilinmeyen akışı değiştirmez
    const h = gunlukHatasi(log);
    if (h && SAGLAYICI_TURLER.includes(h.tur)) neden = h.tur;
  }
  if (neden && yurm === 'opencode') oturumKapat(OC, log, bas);
  return { neden, yurm, t0 };
}

// otomatik kapı üretimi: adımdaki kapı dosyası diskte yoksa ve PLAN'da Görev kapi: varsa önce kapıyı yazdır
const EKSIK = eksikKapilar(KAPILAR);
if (EKSIK.length && planSatiri(plan, 'Görev kapi') !== null) {
  const yeni = await kapiUret({ n: N, blok, kapilar: KAPILAR, planMetni: plan, kurallar: KURALLAR, projeKural: PROJE_KURAL, cp: CP, logd: LOGD, calistir, yazDurum, yazMetrik, selfDir: SELF, sade: SADE, yazLog: (p, m) => writeFileSync(p, m) });
  if (!yeni) { yazDurum('', 0, 'kapi_hata'); yaz(`adım ${N}: eksik kapı (${EKSIK.join(' ')}) üretilemedi veya kırmızı doğrulanamadı`); process.exit(4); }
  CP = yeni;
}
// yerel/ignore'lu kapi/ dizini varsa kurcalama tespiti için içerik özetini al
function kapiImza() {
  if (!existsSync('kapi')) return '';
  const c = [];
  const gez = (d) => { for (const f of readdirSync(d)) { const p = `${d}/${f}`; if (statSync(p).isDirectory()) gez(p); else c.push(`${p} ${createHash('sha1').update(readFileSync(p)).digest('hex')}`); } };
  try { gez('kapi'); } catch {}
  return c.sort().join('\n');
}
const kapiImzasi = kapiImza();
const sonBayt = (yol, n) => { try { const b = readFileSync(yol); return kirp(b.subarray(Math.max(0, b.length - n)).toString('utf8')); } catch { return ''; } };

let ipucu = '', SAGLAYICI = true, durdu = '', kotaGoruldu = false, sorunIcerik = '', eskaleDenendi = false, saglayiciNeden = '';
// model kilidi: paralel koşularda aynı model aynı anda denenmesin; süreç ölürse bayat kilit sonraki koşuda temizlenir
const KILIT_DIR = e.MDK_KILIT || join(homedir(), '.cache', 'mdk', 'kilit'); mkdirSync(KILIT_DIR, { recursive: true });
const KILIT_BEKLE = Number(e.MDK_KILIT_BEKLE || 30), KILIT_TAVAN = Number(e.MDK_KILIT_TAVAN || 600);
let beklenen = 0, aday = [...MODELLER];
while (aday.length) {
  const bekleyen = []; let denendi = false;
  for (const m of aday) {
    const kilit = kilitAl(KILIT_DIR, m);
    if (!kilit) { bekleyen.push(m); continue; } // kilitli model bu turda atlanır, deneme sayılmaz
    denendi = true; harcanan = 0; // bütçe model başına
    let geciciTekrar = 0, d = 1;
    while (d <= DENEME) {
      yazDurum(m, d, 'calisiyor');
      const log = join(LOGD, `adim${N}-${sn()}.jsonl`);
      const istem = `${KURALLAR}\n\nAşağıdaki adımı yap, yalnızca onu (PLAN.md adım ${N}; metnin tamamı burada).\n${PROJE_KURAL}\nAdım:\n${blok}\n${personaIpucu}\n${SADE_IPUCU}\n${ipucu}`;
      const r = await calistir(m, `adim-${N}`, istem, log, true);
      let neden = r.neden;
      // 0-sn doktor: CLI argüman/ikili hatası varsa (0 olay + stderr'de CLI hatası) diğer modelleri boşuna deneme
      let boyut = 0; try { boyut = statSync(log).size; } catch {}
      if (!neden && boyut === 0 && /Unknown argument|Positionals:|command not found|No such file/i.test(oku(log + '.err'))) {
        kilitBirak(kilit); yazDurum(m, d, 'ortam_hatasi');
        hataYaz(`adım ${N}: çalıştırıcı/ortam hatası (${m}):`); hataYaz(kirp(oku(log + '.err')).split('\n').slice(0, 5).join('\n'));
        sifirla(); process.exit(4);
      }
      git('add', '-A');
      // SORUN.md: model bir sorun bildirdiyse kapı geçse bile deneme başarısız; içerik sonraki denemeye ipucu olur
      if (existsSync('SORUN.md')) {
        copyFileSync('SORUN.md', join(LOGD, `sorun-${N}-${sn()}.md`)); sorunIcerik = kirp(oku('SORUN.md'));
        if (!neden) neden = 'sorun';
      }
      const kapiLog = log + '.kapi';
      if (!neden) {
        // kurcalama: model kapı dosyasını (test/, *.test.*, PLAN.md) değiştirip ya da silip geçmesin
        let kurcalama = git('diff', '--cached', '--name-only', '--no-renames', '--diff-filter=MD', CP).stdout.split('\n').filter((f) => f && /(^|\/)test\/|^kapi\/|\.test\.[a-z]+$|^PLAN\.md$/.test(f));
        if (!kurcalama.length && kapiImzasi && kapiImza() !== kapiImzasi) kurcalama = ['kapi/'];
        if (kurcalama.length) {
          writeFileSync(kapiLog, `kurcalama: kapı dosyaları değiştirilmiş, kapı çalıştırılmadı:\n${kurcalama.join('\n')}\nKapı dosyalarını değiştirme.\n`);
          neden = 'kurcalama';
        } else {
          for (const k of KAPILAR) { // ilk başarısız kapıda dur; o kapının çıktısı kapiLog'da kalır
            const s = kabukKos(k, { env: temizOrtam() }); writeFileSync(kapiLog, s.metin);
            if (!s.ok) { neden = 'kapi'; break; }
          }
          // kapı sonrası regresyon: adım kapısı geçse de başka test kırıldıysa deneme başarısız
          if (!neden && REGRESYON) {
            yazDurum(m, d, 'regresyon');
            const s = regresyon(); writeFileSync(kapiLog, s.metin);
            if (!s.ok) neden = 'regresyon';
          }
        }
      }
      git('add', '-A');
      let ek = 0, sil = 0, dos = 0;
      for (const l of git('diff', '--cached', '--numstat').stdout.split('\n').filter(Boolean)) { const [a, b] = l.split('\t'); ek += Number(a) || 0; sil += Number(b) || 0; dos++; }
      const o = olaylariTopla(log); harcanan += o.etkin;
      yazMetrik({ ts: sn(), adim: Number(N), yurutucu: r.yurm, model: m, gorev, deneme: d, gecti: !neden, sure_sn: sn() - r.t0, token: o.token, etkin: o.etkin, istek: o.istek, deney: DENEY, sade: Number(e.MDK_SADE || 0), maliyet: o.maliyet, eklenen: ek, silinen: sil, dosya: dos, neden: neden || null });
      if (!neden) {
        if (e.MDK_PLAN_DOKUNMA !== '1') writeFileSync(PLAN, oku(PLAN).replace(new RegExp(`^- \\[ \\] ${N}\\.`, 'gm'), `- [x] ${N}.`));
        git('add', '-A'); git('commit', '-qm', `adım ${N}: ${baslik} (${m}, deneme ${d})`); yazDurum(m, d, 'gecti');
        kilitBirak(kilit);
        if (/^\s*-\s+(İncele|Incele):\s*evet\b/im.test(blok) && existsSync(join(SELF, 'mdk-incele.mjs'))) {
          spawnSync(process.execPath, [join(SELF, 'mdk-incele.mjs'), N, PLAN], { stdio: 'inherit', env: temizOrtam() });
        }
        yaz(`adım ${N} geçti (${m}, deneme ${d})`); process.exit(0);
      }
      if (GECICI_TURLER.includes(neden)) {
        saglayiciNeden = neden;
        if (geciciTekrar < GECICI_TEKRAR) {
          geciciTekrar++;
          sifirla();
          const bekle = bekleMs(geciciTekrar, GECICI_BEKLE);
          yaz(`adım ${N}: ${m} deneme ${d} başarısız (${neden}); ${bekle} ms bekleyip yeniden deniyorum`);
          await uyu(bekle);
          continue; // aynı model, aynı deneme numarası: deneme hakkı tüketilmez
        }
        sifirla();
        yaz(`adım ${N}: ${m} deneme ${d} başarısız (${neden})`);
        break; // geçici tekrar sınırı doldu: kota gibi sıradaki modele geç
      }
      if (neden === 'kapi' || neden === 'kurcalama') ipucu = `Önceki deneme kapıyı geçemedi. Kapı çıktısının sonu:\n${sonBayt(kapiLog, 1500)}`;
      else if (neden === 'regresyon') {
        const basarisiz = oku(kapiLog).split('\n').filter((l) => l.includes('BAŞARISIZ')).slice(0, 5).join('\n');
        ipucu = `Önceki deneme adım kapısını geçti ama regresyonu bozdu (başka bir test kırıldı). O davranışı koruyarak adımı yeniden yap; kırılan testi değiştirme. Çıktının sonu:\n${basarisiz}\n${sonBayt(kapiLog, 1200)}`;
      } else if (neden === 'sure') ipucu = `Önceki deneme ${SURE} sn içinde bitmedi; işi daha küçük tut.`;
      else if (neden === 'sorun') ipucu = `Önceki deneme SORUN.md bıraktı; sorunu gider ve adımı yeniden yap. SORUN.md:\n${sorunIcerik}`;
      sifirla(); // temiz başlangıç (ignore'lanan metrik/log dosyaları kalır)
      if (neden === 'kota') kotaGoruldu = true;
      if (SAGLAYICI_TURLER.includes(neden)) saglayiciNeden = neden;
      yaz(`adım ${N}: ${m} deneme ${d} başarısız (${neden})`);
      if (neden !== 'yanit_yok' && !SAGLAYICI_TURLER.includes(neden)) SAGLAYICI = false; // sağlayıcı sorunu: eskale etme
      if (neden === 'sorun' && d === DENEME) { durdu = 'sorun'; break; } // SORUN.md çözülmediyse diğer modelleri boşuna deneme
      if (neden === 'butce') { durdu = 'butce'; break; }               // bu modelin bütçesi bitti: sıradaki modele geç
      if (neden === 'yanit_yok' || neden === 'kota' || neden === 'kimlik' || neden === 'model_yok') break; // yeniden denemek boşuna
      d++;
    }
    kilitBirak(kilit);
    if (durdu === 'sorun') break;
  }
  if (bekleyen.length && durdu !== 'sorun') {
    aday = bekleyen;
    if (!denendi) { // tüm kalan modeller kilitli: bekle, tavan dolunca çık (model çağrılmadan)
      if (beklenen + KILIT_BEKLE > KILIT_TAVAN) { yazDurum('', 0, 'kilit'); yaz(`adım ${N}: modeller ${KILIT_TAVAN} sn kilitli kaldı`); process.exit(8); }
      await uyu(KILIT_BEKLE * 1000); beklenen += KILIT_BEKLE;
    }
  } else if (!eskaleDenendi && !SAGLAYICI && durdu !== 'sorun' && ESKALE.length) {
    eskaleDenendi = true; DENEME = 1; gorev = 'eskale'; aday = ESKALE;
  } else break;
}
if (durdu === 'butce') { yazDurum('', 0, 'eskale'); yaz(`adım ${N} eskale: modeller tükendi, en az biri token bütçesini (${butce}/model) aştı`); process.exit(2); }
if (SAGLAYICI) {
  yazDurum('', 0, 'saglayici', saglayiciNeden || undefined);
  if (kotaGoruldu) yaz(`adım ${N}: ücretsiz kota dolu (tüm modeller kota/sessizlik verdi)`);
  else if (saglayiciNeden) yaz(`adım ${N}: sağlayıcı sorunu (tüm modeller ${saglayiciNeden})`);
  else yaz(`adım ${N}: sağlayıcı yanıt vermiyor (tüm modeller ${ILK} sn içinde olay üretmedi)`);
  const bilgi = saglayiciNeden && iletiBul('saglayici', saglayiciNeden);
  if (bilgi) { yaz(bilgi.ileti); yaz(bilgi.oneri); }
  process.exit(6);
}
yazDurum('', 0, 'eskale'); yaz(`adım ${N} eskale: tüm modeller tükendi`); process.exit(2);
