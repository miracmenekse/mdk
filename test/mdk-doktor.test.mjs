// mdk-doktor.mjs kapı testi: ön koşul denetimi (Node, Git, Yürütücü, GH), CLI JSON/metin modları ve başlatıcılar.
// Kullanım: node test/mdk-doktor.test.mjs
import { statSync } from 'node:fs';
import { KOK, WIN, denetci, existsSync, gecici, join, kos, oku, writeFileSync } from './yardim.mjs';

const { vaka, kontrol, bitir } = denetci('mdk-doktor.test');
const BETIK = join(KOK, 'mdk-doktor.mjs');

// modül yoksa içe aktarma null döner; kontroller kırmızı olarak raporlanır
const mod = await import('../mdk-doktor.mjs').catch(() => null);
const doktorRaporu = mod?.doktorRaporu;

// Geçici klasörde sahte .mjs araçları (çıkış 0 veren iyi.mjs ve çıkış 1 veren kotu.mjs)
const T = gecici('mdk-doktor-');
const iyiMjs = join(T, 'iyi.mjs');
const kotuMjs = join(T, 'kotu.mjs');
const yokMjs = join(T, 'olmayan-arac.mjs');

writeFileSync(iyiMjs, "console.log('versiyon 1.0.0'); process.exit(0);\n");
writeFileSync(kotuMjs, "process.exit(1);\n");

// (1) tüm zorunlu araçlar iyi.mjs, gh kotu.mjs -> tamam === true, araclar 4 öğe, gh.kurulu === false ve gh.zorunlu === false
vaka('1 tüm zorunlu araçlar iyi, isteğe bağlı gh kötü -> tamam: true');
kontrol(typeof doktorRaporu === 'function', 'doktorRaporu dışa aktarılmış bir fonksiyon olmalı');

const env1 = {
  MDK_DOKTOR_NODE: iyiMjs,
  MDK_DOKTOR_GIT: iyiMjs,
  MDK_AGY: iyiMjs,
  MDK_CLAUDE: kotuMjs,
  MDK_OPENCODE: yokMjs,
  MDK_GH: kotuMjs,
};

const r1 = doktorRaporu ? doktorRaporu(env1) : null;
kontrol(r1 && r1.tamam === true, 'r1.tamam true olmalı (tüm zorunlular kurulu)', JSON.stringify(r1));
kontrol(Array.isArray(r1?.araclar) && r1.araclar.length === 4, 'r1.araclar 4 öğe içermeli');

const node1 = r1?.araclar?.find((a) => a.ad === 'node');
kontrol(node1?.kurulu === true, 'node.kurulu true olmalı');
kontrol(node1?.zorunlu === true, 'node.zorunlu true olmalı');
kontrol(node1?.baslik === 'Node.js çalışma zamanı', 'node.baslik doğru olmalı');
kontrol(node1?.oneri?.includes('nodejs.org'), 'node.oneri nodejs.org içermeli', node1?.oneri);

const git1 = r1?.araclar?.find((a) => a.ad === 'git');
kontrol(git1?.kurulu === true, 'git.kurulu true olmalı');
kontrol(git1?.zorunlu === true, 'git.zorunlu true olmalı');
kontrol(git1?.baslik === 'Git sürüm kontrolü', 'git.baslik doğru olmalı');

const yur1 = r1?.araclar?.find((a) => a.ad === 'yurutucu');
kontrol(yur1?.kurulu === true, 'yurutucu.kurulu true olmalı');
kontrol(yur1?.zorunlu === true, 'yurutucu.zorunlu true olmalı');
kontrol(yur1?.baslik === 'Yapay zeka yürütücüsü', 'yurutucu.baslik doğru olmalı');
kontrol(yur1?.surum?.includes('agy'), 'yurutucu.surum kurulu aracı (agy) içermeli', yur1?.surum);

const gh1 = r1?.araclar?.find((a) => a.ad === 'gh');
kontrol(gh1?.kurulu === false, 'gh.kurulu false olmalı');
kontrol(gh1?.zorunlu === false, 'gh.zorunlu false olmalı (isteğe bağlı)');
kontrol(gh1?.baslik === 'GitHub CLI (radar için isteğe bağlı)', 'gh.baslik doğru olmalı');
kontrol(gh1?.oneri?.includes('cli.github.com'), 'gh.oneri cli.github.com içermeli', gh1?.oneri);

// (2) MDK_DOKTOR_GIT olmayan yol -> tamam === false, git.kurulu === false, git.oneri 'git' içerir
vaka('2 MDK_DOKTOR_GIT olmayan yol -> tamam: false, git.kurulu: false, git.oneri');
const env2 = {
  MDK_DOKTOR_NODE: iyiMjs,
  MDK_DOKTOR_GIT: yokMjs,
  MDK_AGY: iyiMjs,
  MDK_CLAUDE: kotuMjs,
  MDK_OPENCODE: yokMjs,
  MDK_GH: iyiMjs,
};

const r2 = doktorRaporu ? doktorRaporu(env2) : null;
kontrol(r2 && r2.tamam === false, 'r2.tamam false olmalı (git eksik)', JSON.stringify(r2));
const git2 = r2?.araclar?.find((a) => a.ad === 'git');
kontrol(git2?.kurulu === false, 'git.kurulu false olmalı');
kontrol(git2?.zorunlu === true, 'git.zorunlu true olmalı');
kontrol(git2?.oneri?.includes('git') && git2?.oneri?.includes('git-scm.com'), 'git.oneri git ve git-scm.com içermeli', git2?.oneri);

// (3) MDK_AGY, MDK_CLAUDE, MDK_OPENCODE üçü de olmayan yol -> tamam === false, yurutucu.kurulu === false; yalnız MDK_AGY = iyi.mjs -> yurutucu.kurulu === true
vaka('3 yürütücü denetimi: üçü de yoksa false, biri varsa true, birden çoksa virgüllü');
const env3a = {
  MDK_DOKTOR_NODE: iyiMjs,
  MDK_DOKTOR_GIT: iyiMjs,
  MDK_AGY: yokMjs,
  MDK_CLAUDE: kotuMjs,
  MDK_OPENCODE: yokMjs,
  MDK_GH: iyiMjs,
};

const r3a = doktorRaporu ? doktorRaporu(env3a) : null;
kontrol(r3a && r3a.tamam === false, 'r3a.tamam false olmalı (yürütücü yok)', JSON.stringify(r3a));
const yur3a = r3a?.araclar?.find((a) => a.ad === 'yurutucu');
kontrol(yur3a?.kurulu === false, 'yur3a.kurulu false olmalı');
kontrol(
  yur3a?.oneri?.includes('Antigravity') && yur3a?.oneri?.includes('Claude Code') && yur3a?.oneri?.includes('OpenCode'),
  'yur3a.oneri agy, claude ve opencode alternatiflerini içermeli',
  yur3a?.oneri
);

// yalnız MDK_AGY = iyi.mjs
const env3b = {
  MDK_DOKTOR_NODE: iyiMjs,
  MDK_DOKTOR_GIT: iyiMjs,
  MDK_AGY: iyiMjs,
  MDK_CLAUDE: yokMjs,
  MDK_OPENCODE: yokMjs,
  MDK_GH: iyiMjs,
};
const r3b = doktorRaporu ? doktorRaporu(env3b) : null;
kontrol(r3b && r3b.tamam === true, 'r3b.tamam true olmalı');
const yur3b = r3b?.araclar?.find((a) => a.ad === 'yurutucu');
kontrol(yur3b?.kurulu === true, 'yur3b.kurulu true olmalı (yalnız agy var)');
kontrol(yur3b?.surum?.includes('agy'), 'yur3b.surum agy içermeli', yur3b?.surum);

// çoklu yürütücü: MDK_AGY ve MDK_CLAUDE iyi.mjs
const env3c = {
  MDK_DOKTOR_NODE: iyiMjs,
  MDK_DOKTOR_GIT: iyiMjs,
  MDK_AGY: iyiMjs,
  MDK_CLAUDE: iyiMjs,
  MDK_OPENCODE: kotuMjs,
  MDK_GH: iyiMjs,
};
const r3c = doktorRaporu ? doktorRaporu(env3c) : null;
const yur3c = r3c?.araclar?.find((a) => a.ad === 'yurutucu');
kontrol(yur3c?.kurulu === true, 'yur3c.kurulu true olmalı');
kontrol(yur3c?.surum?.includes('agy') && yur3c?.surum?.includes('claude'), 'yur3c.surum agy ve claude içermeli', yur3c?.surum);

// (4) CLI node mdk-doktor.mjs --json (hepsi iyi) -> çıkış 0, stdout geçerli JSON ve tamam: true; bir zorunlu eksik -> çıkış 1
vaka('4 CLI sınaması (--json ve insan çıktısı, başarı ve hata kodları)');
const envHepsiIyi = {
  MDK_DOKTOR_NODE: iyiMjs,
  MDK_DOKTOR_GIT: iyiMjs,
  MDK_AGY: iyiMjs,
  MDK_CLAUDE: kotuMjs,
  MDK_OPENCODE: yokMjs,
  MDK_GH: iyiMjs,
};

// 4a: --json ile başarı
const rCli1 = kos(BETIK, ['--json'], { env: envHepsiIyi });
kontrol(rCli1.kod === 0, 'CLI --json başarı durumunda çıkış 0 olmalı', `kod: ${rCli1.kod}, cikti: ${rCli1.cikti}`);
let parsed1 = null;
try {
  parsed1 = JSON.parse(rCli1.cikti);
} catch (e) {
  kontrol(false, `CLI --json geçerli JSON basmalı: ${e.message}`, rCli1.cikti);
}
kontrol(parsed1?.tamam === true, 'CLI --json parse tamam: true olmalı', JSON.stringify(parsed1));
kontrol(parsed1?.araclar?.length === 4, 'CLI --json parse araclar 4 öğe olmalı');

// 4b: normal insan formatında başarı
const rCli2 = kos(BETIK, [], { env: envHepsiIyi });
kontrol(rCli2.kod === 0, 'CLI normal çıktı başarı durumunda çıkış 0 olmalı', `kod: ${rCli2.kod}`);
kontrol(rCli2.cikti.includes('✓'), 'CLI çıktısında onay işareti (✓) olmalı', rCli2.cikti);

// 4c: bir zorunlu eksik (git yok) -> --json ile çıkış 1 ve tamam: false
const rCli3 = kos(BETIK, ['--json'], { env: env2 });
kontrol(rCli3.kod === 1, 'CLI --json zorunlu eksikken çıkış 1 olmalı', `kod: ${rCli3.kod}, cikti: ${rCli3.cikti}`);
let parsed3 = null;
try {
  parsed3 = JSON.parse(rCli3.cikti);
} catch (e) {
  kontrol(false, `CLI --json hata durumunda da geçerli JSON basmalı: ${e.message}`, rCli3.cikti);
}
kontrol(parsed3?.tamam === false, 'CLI --json parse tamam: false olmalı', JSON.stringify(parsed3));

// 4d: bir zorunlu eksik -> normal insan formatında çıkış 1 ve ✗ işareti ile öneri
const rCli4 = kos(BETIK, [], { env: env2 });
kontrol(rCli4.kod === 1, 'CLI normal çıktı zorunlu eksikken çıkış 1 olmalı', `kod: ${rCli4.kod}`);
kontrol(rCli4.cikti.includes('✗'), 'CLI çıktısında hata işareti (✗) olmalı', rCli4.cikti);
kontrol(rCli4.cikti.includes('git-scm.com'), 'CLI çıktısında git kurulum önerisi yer almalı', rCli4.cikti);

// (5) kökte MDK-Baslat.command ve MDK-Baslat.cmd dosyaları var ve mdk-panel.mjs start ile 127.0.0.1:4747 içerir
vaka('5 kökte çift tıklanır başlatıcı dosyaları (macOS .command ve Windows .cmd)');
const commandYol = join(KOK, 'MDK-Baslat.command');
const cmdYol = join(KOK, 'MDK-Baslat.cmd');

kontrol(existsSync(commandYol), 'MDK-Baslat.command kökte bulunmalı');
const commandIcerik = oku(commandYol);
kontrol(commandIcerik.includes('#!/usr/bin/env bash'), 'MDK-Baslat.command bash shebang içermeli');
kontrol(commandIcerik.includes('node mdk-doktor.mjs'), 'MDK-Baslat.command node mdk-doktor.mjs çalıştırmalı');
kontrol(commandIcerik.includes('mdk-panel.mjs start'), 'MDK-Baslat.command mdk-panel.mjs start içermeli');
kontrol(commandIcerik.includes('127.0.0.1:4747'), 'MDK-Baslat.command 127.0.0.1:4747 içermeli');
kontrol(commandIcerik.includes('open http://127.0.0.1:4747'), 'MDK-Baslat.command tarayıcı açma (open http://127.0.0.1:4747) içermeli');
if (!WIN) {
  try {
    const st = statSync(commandYol);
    const calistirilabilir = (st.mode & 0o111) !== 0;
    kontrol(calistirilabilir, 'MDK-Baslat.command çalıştırılabilir (chmod 0755) olmalı');
  } catch (e) {
    kontrol(false, `MDK-Baslat.command stat okunamadı: ${e.message}`);
  }
}

kontrol(existsSync(cmdYol), 'MDK-Baslat.cmd kökte bulunmalı');
const cmdIcerik = oku(cmdYol);
kontrol(cmdIcerik.includes('@echo off'), 'MDK-Baslat.cmd @echo off içermeli');
kontrol(cmdIcerik.includes('node mdk-doktor.mjs'), 'MDK-Baslat.cmd node mdk-doktor.mjs çalıştırmalı');
kontrol(cmdIcerik.includes('mdk-panel.mjs start'), 'MDK-Baslat.cmd mdk-panel.mjs start içermeli');
kontrol(cmdIcerik.includes('127.0.0.1:4747'), 'MDK-Baslat.cmd 127.0.0.1:4747 içermeli');
kontrol(cmdIcerik.includes('start http://127.0.0.1:4747'), 'MDK-Baslat.cmd tarayıcı açma (start http://127.0.0.1:4747) içermeli');

bitir();
