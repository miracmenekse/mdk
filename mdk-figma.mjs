// Talk to Figma WebSocket aktarıcısı: kur/start/stop/durum/eklenti.
// Kullanım: mdk-figma.mjs start|stop|durum|eklenti [hedef]|kur
// Süreç PID ile yönetilir (pkill -f yok). Windows'ta da çalışır: bash/WSL'e bağlı değil.
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const KOK = dirname(fileURLToPath(import.meta.url));
const EV = homedir();
const TTF = process.env.MDK_TTF_DIR || join(EV, 'projects', 'cursor-talk-to-figma-mcp');
const BUN = process.env.MDK_BUN || 'bun';
const PIDF = process.env.MDK_FIGMA_PID || join(EV, '.local', 'share', 'talk-to-figma', 'socket.pid');
const PORT = process.env.MDK_FIGMA_PORT || '3055';
const LOG = join(dirname(PIDF), 'socket.log');
const KULLANIM = 'kullanım: mdk-figma.sh start|stop|durum|eklenti [hedef]|kur';
const WIN = process.platform === 'win32';

const uyu = (ms) => new Promise((coz) => setTimeout(coz, ms));
const canli = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const pidOku = () => { try { return Number(readFileSync(PIDF, 'utf8').trim()) || 0; } catch { return 0; } };
const calisiyor = () => { const p = pidOku(); return p > 0 && canli(p); };
const sonSatirlar = (yol, n) => { try { return readFileSync(yol, 'utf8').replace(/\n+$/, '').split('\n').slice(-n).join('\n'); } catch { return ''; } };
const hata = (m, kod = 1) => { console.error(m); process.exit(kod); };
// git/bun çağrısı: çıktı kullanıcıya akar; başarısızsa false
const betik = (k) => /\.(mjs|cjs|js)$/i.test(k);
const hazirla = (k, a) => (betik(k) ? [process.execPath, [k, ...a]] : [k, a]);
const kos = (komut, args, ek = {}) => { const [k, a] = hazirla(komut, args); return spawnSync(k, a, { stdio: 'inherit', shell: WIN && komut === BUN && !betik(komut), ...ek }).status === 0; };

function eklenti(hedefArg) {
  const hedef = resolve(hedefArg || join(EV, 'talk-to-figma-eklenti'));
  const kaynak = join(TTF, 'src', 'cursor_mcp_plugin');
  try { mkdirSync(hedef, { recursive: true }); } catch { process.exit(1); }
  for (const f of ['code.js', 'ui.html', 'setcharacters.js']) {
    try { copyFileSync(join(kaynak, f), join(hedef, f)); } catch { hata(`kopyalanamadı: ${join(kaynak, f)}`); }
  }
  try { copyFileSync(join(KOK, 'figma', 'eklenti-manifest.json'), join(hedef, 'manifest.json')); } catch { process.exit(1); }
  console.log(join(hedef, 'manifest.json'));
}

function kur() {
  if (!existsSync(TTF)) {
    if (!kos('git', ['clone', 'https://github.com/grab/cursor-talk-to-figma-mcp', TTF])) process.exit(1);
    if (!kos('git', ['checkout', 'ddd90f3'], { cwd: TTF })) process.exit(1);
  }
  const yama = join(KOK, 'figma', 'talk-to-figma.patch');
  const uygulanmis = spawnSync('git', ['apply', '--reverse', '--check', yama], { cwd: TTF, stdio: 'ignore' }).status === 0;
  if (!uygulanmis && !kos('git', ['apply', yama], { cwd: TTF })) process.exit(1);
  // npm bu ağda engelli olabilir: ayna verilmemişse yarnpkg aynası
  const env = { ...process.env, BUN_CONFIG_REGISTRY: process.env.BUN_CONFIG_REGISTRY || 'https://registry.yarnpkg.com' };
  if (!kos(BUN, ['install'], { cwd: TTF, env })) process.exit(1);
  eklenti();
  console.log(`claude mcp add --scope user TalkToFigma -- bun ${join(TTF, 'src', 'talk_to_figma_mcp', 'server.ts')}`);
}

switch (process.argv[2] || '') {
  case 'start': {
    if (calisiyor()) { console.log(`zaten çalışıyor pid=${pidOku()}`); process.exit(0); }
    mkdirSync(dirname(PIDF), { recursive: true });
    if (!existsSync(TTF)) hata(`dizin yok: ${TTF}`);
    const fd = openSync(LOG, 'w');
    let cocuk;
    try {
      const [k, a] = hazirla(BUN, ['run', 'src/socket.ts']);
      cocuk = spawn(k, a, { cwd: TTF, detached: true, stdio: ['ignore', fd, fd], shell: WIN && !betik(BUN), windowsHide: true });
    } finally { closeSync(fd); }
    cocuk.on('error', () => {});
    const pid = cocuk.pid;
    cocuk.unref();
    if (!pid) { rmSync(PIDF, { force: true }); hata(`başlatılamadı: ${sonSatirlar(LOG, 2)}`); }
    writeFileSync(PIDF, `${pid}\n`);
    await uyu(500); // aktarıcı hemen düşerse "başlatıldı" yalanı söylememek için doğrula
    if (!canli(pid)) { rmSync(PIDF, { force: true }); hata(`başlatılamadı: ${sonSatirlar(LOG, 2)}`); }
    console.log(`başlatıldı pid=${pid} port=${PORT}`);
    process.exit(0);
  }
  case 'stop': {
    if (!calisiyor()) { rmSync(PIDF, { force: true }); console.log('çalışmıyor'); process.exit(0); }
    const pid = pidOku();
    try { process.kill(pid); } catch {}
    for (let i = 0; i < 20 && canli(pid); i++) await uyu(100);
    rmSync(PIDF, { force: true });
    console.log(`durduruldu pid=${pid}`);
    process.exit(0);
  }
  case 'durum':
    if (calisiyor()) { console.log(`çalışıyor pid=${pidOku()}`); process.exit(0); }
    console.log('çalışmıyor');
    process.exit(3);
  case 'eklenti':
    eklenti(process.argv[3]);
    break;
  case 'kur':
    kur();
    break;
  default:
    hata(KULLANIM, 2);
}
