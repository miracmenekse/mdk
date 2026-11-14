// Panel başlat/durdur/durum. Kullanım: mdk-panel.mjs start|stop|durum [dizin] [port]
import { mkdirSync, existsSync, readFileSync, writeFileSync, rmSync, openSync, closeSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const KOK = dirname(fileURLToPath(import.meta.url));
const komut = process.argv[2] || '';
const DIZIN = resolve(process.argv[3] || '.');
const PORT = process.argv[4] || '4747';
const PIDF = join(DIZIN, '.mdk-log', 'panel.pid');

const uyu = (ms) => new Promise((coz) => setTimeout(coz, ms));

function calisiyor() {
  if (!existsSync(PIDF)) return false;
  const pid = Number(readFileSync(PIDF, 'utf8').trim());
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function sonSatirlar(yol, n) {
  try {
    const satirlar = readFileSync(yol, 'utf8').replace(/\n+$/, '').split('\n');
    return satirlar.slice(-n).join('\n');
  } catch {
    return '';
  }
}

switch (komut) {
  case 'start': {
    if (!existsSync(DIZIN)) process.exit(1);
    if (calisiyor()) {
      console.log(`zaten çalışıyor pid=${readFileSync(PIDF, 'utf8').trim()} http://127.0.0.1:${PORT}`);
      process.exit(0);
    }
    const logDizini = join(DIZIN, '.mdk-log');
    mkdirSync(logDizini, { recursive: true });
    const logYolu = join(logDizini, 'panel.log');
    const logFd = openSync(logYolu, 'w');
    const cocuk = spawn(process.execPath, [join(KOK, 'panel', 'sunucu.mjs'), DIZIN, PORT], {
      detached: true,
      stdio: ['ignore', logFd, logFd],
    });
    closeSync(logFd);
    const pid = cocuk.pid;
    cocuk.unref();
    writeFileSync(PIDF, `${pid}\n`);
    await uyu(400); // port doluysa süreç hemen düşer; "başlatıldı" yalanı söylememek için canlılığı doğrula
    if (!calisiyor()) {
      rmSync(PIDF, { force: true });
      console.error(`başlatılamadı (port ${PORT} dolu olabilir): ${sonSatirlar(logYolu, 2)}`);
      process.exit(1);
    }
    console.log(`başlatıldı pid=${pid} http://127.0.0.1:${PORT}`);
    process.exit(0);
  }
  case 'stop': {
    if (!calisiyor()) {
      rmSync(PIDF, { force: true });
      console.log('çalışmıyor');
      process.exit(0);
    }
    const pid = Number(readFileSync(PIDF, 'utf8').trim());
    try {
      process.kill(pid);
    } catch {}
    for (let i = 0; i < 20; i++) {
      try {
        process.kill(pid, 0);
      } catch {
        break;
      }
      await uyu(100);
    }
    rmSync(PIDF, { force: true });
    console.log(`durduruldu pid=${pid}`);
    process.exit(0);
  }
  case 'durum': {
    if (!existsSync(DIZIN)) process.exit(1);
    if (calisiyor()) {
      console.log(`çalışıyor pid=${readFileSync(PIDF, 'utf8').trim()} http://127.0.0.1:${PORT}`);
      process.exit(0);
    }
    console.log('çalışmıyor');
    process.exit(1);
  }
  default: {
    console.error('kullanım: mdk-panel.sh start|stop|durum [dizin] [port]');
    process.exit(2);
  }
}
