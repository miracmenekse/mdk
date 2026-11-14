// mdk-figma.mjs kapı testi: başlat/durdur/durum, PID, çift başlatma, ölen bun, eklenti kopyası.
// Sahte bun .mjs (koşturucu node ile başlatır): Windows'ta da çalışır.
import { KOK, denetci, existsSync, gecici, join, kos, mkdirSync, oku, uyu, writeFileSync } from './yardim.mjs';
import { resolve } from 'node:path';

const RUNNER = join(KOK, 'mdk-figma.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-figma.test');
const T = gecici(), TTF = join(T, 'ttf'), PIDF = join(T, 'figma.pid');
mkdirSync(join(TTF, 'src', 'cursor_mcp_plugin'), { recursive: true });
writeFileSync(join(TTF, 'src', 'socket.ts'), 'socket\n');
for (const f of ['code.js', 'ui.html', 'setcharacters.js']) writeFileSync(join(TTF, 'src', 'cursor_mcp_plugin', f), `${f}\n`);
const CANLI = join(T, 'bun-canli.mjs'), OLU = join(T, 'bun-olu.mjs');
writeFileSync(CANLI, "if (process.argv[2] === 'run') setTimeout(() => {}, 300000); else process.exit(1);\n");
writeFileSync(OLU, 'process.exit(1);\n');
const env = (ek = {}) => ({ MDK_TTF_DIR: TTF, MDK_BUN: CANLI, MDK_FIGMA_PID: PIDF, MDK_FIGMA_PORT: '3055', HOME: T, USERPROFILE: T, ...ek });
let SON;
const kosu = (args, ek) => (SON = kos(RUNNER, args, { cwd: KOK, env: env(ek) }));
const k = (c, m) => kontrol(c, m, SON?.cikti);
const canli = (p) => { try { process.kill(Number(p), 0); return true; } catch { return false; } };

try {
  vaka('durum_bas'); kosu(['durum']); k(SON.kod === 3 && SON.cikti.includes('çalışmıyor'), 'başta çalışmıyor (3)');
  vaka('start'); kosu(['start']); await uyu(200);
  const PID = oku(PIDF).trim();
  k(SON.kod === 0 && SON.cikti.includes('başlatıldı'), 'başlatıldı'); k(existsSync(PIDF) && canli(PID), 'PID canlı');
  k(SON.cikti.includes(`pid=${PID}`) && SON.cikti.includes('port=3055'), 'pid/port');
  vaka('start2'); kosu(['start']); k(SON.kod === 0 && SON.cikti.includes('zaten çalışıyor') && oku(PIDF).trim() === PID, 'aynı PID');
  vaka('durum'); kosu(['durum']); k(SON.kod === 0 && SON.cikti.includes('çalışıyor') && SON.cikti.includes(`pid=${PID}`), 'çalışıyor');
  vaka('stop'); kosu(['stop']); await uyu(500);
  k(SON.kod === 0 && !canli(PID) && !existsSync(PIDF), 'durdu'); k(SON.cikti.includes('durduruldu') && SON.cikti.includes(`pid=${PID}`), 'mesaj');
  vaka('stop2'); kosu(['stop']); k(SON.kod === 0 && SON.cikti.includes('çalışmıyor'), 'ikinci stop');
  vaka('olen_bun'); kosu(['start'], { MDK_BUN: OLU }); await uyu(600); k(SON.kod === 1 && !existsSync(PIDF), 'ölen bun: 1, PID yok');
  vaka('eklenti');
  const HEDEF = join(T, 'eklenti'); kosu(['eklenti', HEDEF]);
  k(SON.kod === 0, 'çıkış 0');
  for (const f of ['code.js', 'ui.html', 'setcharacters.js', 'manifest.json']) k(existsSync(join(HEDEF, f)), `${f} var`);
  for (const f of ['code.js', 'ui.html', 'setcharacters.js']) k(oku(join(HEDEF, f)) === oku(join(TTF, 'src', 'cursor_mcp_plugin', f)), `${f} aynı`);
  const man = oku(join(HEDEF, 'manifest.json'));
  k(man === oku(join(KOK, 'figma', 'eklenti-manifest.json')), 'manifest aynı');
  k(JSON.parse(man).networkAccess?.allowedDomains?.includes('ws://localhost:3055'), 'ws://localhost:3055 izinli'); k(!man.includes('google-analytics'), 'analitik yok');
  k(SON.cikti.trim() === resolve(HEDEF, 'manifest.json'), 'manifest yolu basıldı');
  vaka('bilinmeyen'); kosu(['xyz']); k(SON.kod === 2 && /kullanım/i.test(SON.cikti), 'çıkış 2');
} finally {
  const p = oku(PIDF).trim(); if (p && canli(p)) try { process.kill(Number(p)); } catch {}
}
bitir();
