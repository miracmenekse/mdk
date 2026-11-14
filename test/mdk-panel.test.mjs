// mdk-panel.mjs testi: başlat/durdur/durum, pid dosyası, çift başlatma, yetim süreç yok.
import { KOK, denetci, existsSync, gecici, join, kos, oku, uyu, writeFileSync } from './yardim.mjs';
import { createServer } from 'node:net';

const RUNNER = join(KOK, 'mdk-panel.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-panel.test');
const T = gecici();
writeFileSync(join(T, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `node -e "0"`\n');
const PORT = await new Promise((coz) => { const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => coz(String(p))); }); });
let SON;
const kosu = (k) => (SON = kos(RUNNER, [k, T, PORT], { cwd: KOK }));
const k = (c, m) => kontrol(c, m, SON?.cikti);
const canli = (p) => { try { process.kill(Number(p), 0); return true; } catch { return false; } };
const durumAl = async () => { try { const r = await fetch(`http://127.0.0.1:${PORT}/api/durum`, { signal: AbortSignal.timeout(2000) }); return await r.text(); } catch { return null; } };

try {
  vaka('durum_bas'); kosu('durum'); k(SON.kod === 1 && SON.cikti.includes('çalışmıyor'), 'başta çalışmıyor (1)');
  vaka('start'); kosu('start');
  k(SON.kod === 0, 'çıkış 0'); k(existsSync(join(T, '.mdk-log/panel.pid')), 'pid dosyası');
  const PID = oku(join(T, '.mdk-log/panel.pid')).trim();
  let d = null; for (let i = 0; i < 25 && !(d || '').includes('kategoriler'); i++) { d = await durumAl(); if (!(d || '').includes('kategoriler')) await uyu(200); }
  k((d || '').includes('kategoriler'), '/api/durum yanıtı'); k(canli(PID), 'süreç canlı');
  vaka('start2'); kosu('start'); k(SON.kod === 0 && SON.cikti.includes('zaten çalışıyor') && oku(join(T, '.mdk-log/panel.pid')).trim() === PID, 'yeni süreç açılmaz');
  vaka('durum'); kosu('durum'); k(SON.kod === 0 && SON.cikti.includes('çalışıyor') && SON.cikti.includes(`pid=${PID}`) && SON.cikti.includes(PORT), 'çalışıyor');
  vaka('stop'); kosu('stop'); await uyu(500);
  k(SON.kod === 0 && !canli(PID) && !existsSync(join(T, '.mdk-log/panel.pid')), 'durdu'); k((await durumAl()) === null, 'port kapandı');
  vaka('stop2'); kosu('stop'); k(SON.kod === 0 && SON.cikti.includes('çalışmıyor'), 'ikinci stop');
} finally { kos(RUNNER, ['stop', T, PORT], { cwd: KOK }); }
bitir();
