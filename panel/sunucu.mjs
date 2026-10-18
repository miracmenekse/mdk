// Canlı sunucu: REST + SSE ile panel verisini 127.0.0.1'de sunar.

import { createServer } from 'node:http';
import { watch, existsSync, readFileSync, realpathSync } from 'node:fs';
import { join, resolve, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { snapshot } from './durum.mjs';

const IP = '127.0.0.1';

export async function baslat(dir, port) {
  const kok = resolve(dir);
  const izlenecekler = ['PLAN.md', 'durum.json', 'metrikler.jsonl'].map((f) => join(kok, f));

  const clientler = new Set();
  let zamanlayici = null;

  const gonder = (res) => {
    res.write(`data: ${JSON.stringify(snapshot(kok))}\n\n`);
  };

  const tumuneGonder = () => {
    zamanlayici = null;
    for (const res of [...clientler]) {
      try {
        gonder(res);
      } catch {
        clientler.delete(res);
      }
    }
  };

  const planla = () => {
    if (!zamanlayici) zamanlayici = setTimeout(tumuneGonder, 150);
  };

  let izleyici = null;
  try {
    izleyici = watch(kok, (olay, dosya) => {
      if (!dosya || izlenecekler.includes(join(kok, dosya))) planla();
    });
  } catch {
    // dizin yok ya da izlenemiyorsa SSE yalnızca ilk anlık görüntüyü gönderir
  }

  const sunucu = createServer((istek, yanit) => {
    const { pathname } = new URL(istek.url, 'http://x');

    if (istek.method !== 'GET') {
      yanit.writeHead(405).end();
      return;
    }

    if (pathname === '/api/durum') {
      yanit.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      yanit.end(JSON.stringify(snapshot(kok)));
      return;
    }

    if (pathname === '/api/arastirma') {
      // dosya yoksa ya da bozuksa boş şema; sunucu düşmez
      let veri = { adaylar: [], birlesimler: [] };
      try {
        veri = JSON.parse(readFileSync(join(kok, 'arastirma', 'arastirma.json'), 'utf8'));
      } catch {}
      yanit.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      yanit.end(JSON.stringify(veri));
      return;
    }

    if (pathname === '/olay') {
      yanit.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      });
      gonder(yanit);
      clientler.add(yanit);
      istek.on('close', () => clientler.delete(yanit));
      return;
    }

    if (pathname === '/') {
      const dosya = join(fileURLToPath(new URL('.', import.meta.url)), 'index.html');
      if (existsSync(dosya)) {
        yanit.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        yanit.end(readFileSync(dosya));
      } else {
        yanit.writeHead(404).end('bulunamadı');
      }
      return;
    }

    if (pathname === '/dosya') {
      // ?yol=etki/... : proje içi .html dosyası; ".." ve mutlak yol reddedilir
      const yol = new URL(istek.url, 'http://x').searchParams.get('yol') || '';
      const gecerli =
        yol !== '' &&
        !yol.startsWith('/') &&
        !isAbsolute(yol) &&
        !yol.split(/[\\/]/).includes('..') &&
        /\.html$/i.test(yol);
      if (!gecerli) {
        yanit.writeHead(400).end('geçersiz yol');
        return;
      }
      let tam;
      try {
        tam = realpathSync(join(kok, yol));
      } catch {
        yanit.writeHead(404).end();
        return;
      }
      const kokGercek = realpathSync(kok);
      if (tam !== kokGercek && !tam.startsWith(kokGercek + sep)) {
        yanit.writeHead(400).end('geçersiz yol');
        return;
      }
      if (!existsSync(tam)) {
        yanit.writeHead(404).end();
        return;
      }
      // ?goster=once|sonra : yalnız o <svg id> figürü görünür (içerik silinmez); sabit stil, kullanıcı girdisi yazılmaz
      const goster = new URL(istek.url, 'http://x').searchParams.get('goster');
      let icerik = readFileSync(tam);
      if (goster !== null) {
        if (goster !== 'once' && goster !== 'sonra') {
          yanit.writeHead(400).end('geçersiz goster');
          return;
        }
        const stil = `<style>body > figure { display: none } body > figure:has(#${goster}) { display: block }</style>`;
        const metin = icerik.toString('utf8');
        icerik = Buffer.from(metin.includes('</head>') ? metin.replace('</head>', stil + '</head>') : stil + metin, 'utf8');
      }
      yanit.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      yanit.end(icerik);
      return;
    }

    if (pathname === '/ciz.mjs') {
      // yalnızca çizim modülü; diğer panel dosyaları sunulmaz
      const dosya = join(fileURLToPath(new URL('.', import.meta.url)), 'ciz.mjs');
      if (existsSync(dosya)) {
        yanit.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
        yanit.end(readFileSync(dosya));
      } else {
        yanit.writeHead(404).end();
      }
      return;
    }

    yanit.writeHead(404).end();
  });

  await new Promise((coz, ret) => {
    sunucu.once('error', ret);
    sunucu.listen(port, IP, () => coz());
  });

  return {
    port: sunucu.address().port,
    kapat() {
      clearTimeout(zamanlayici);
      izleyici?.close();
      for (const res of clientler) res.end();
      clientler.clear();
      sunucu.closeAllConnections();
      return new Promise((coz) => sunucu.close(() => coz()));
    },
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const dizin = process.argv[2] || '.';
  const portu = Number(process.argv[3]) || 4747;
  const s = await baslat(dizin, portu);
  console.log(`http://127.0.0.1:${s.port}  (dizin: ${resolve(dizin)})`);
}
