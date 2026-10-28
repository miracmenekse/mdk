// Canlı sunucu: REST + SSE ile panel verisini 127.0.0.1'de sunar.

import { createServer } from 'node:http';
import { watch, existsSync, readFileSync, realpathSync, mkdirSync } from 'node:fs';
import { join, resolve, isAbsolute, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { snapshot } from './durum.mjs';
import { depo, varsayilanCalistir } from './depo.mjs';
import { parse } from './plan.mjs';
import { kararEkle } from './karar.mjs';

const IP = '127.0.0.1';

export async function baslat(dir, port, { calistir } = {}) {
  const kok = resolve(dir);
  const izlenecekler = ['PLAN.md', 'durum.json', 'metrikler.jsonl'].map((f) => join(kok, f));

  const clientler = new Set();
  let zamanlayici = null;

  // depo durumu git/gh çağırır (yavaş, ağlı): snapshot() senkron kalır, depo ayrı tazelenir
  const cal = calistir ?? varsayilanCalistir(kok);
  let sonDepo = await depo(kok, { calistir: cal }); // ilk /api/durum dolu gelsin
  const durum = () => ({ ...snapshot(kok), depo: sonDepo, ad: basename(kok) }); // ad: başlıkta proje adı

  const gonder = (res) => {
    res.write(`data: ${JSON.stringify(durum())}\n\n`);
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

  let kapandi = false;
  const depoTazele = async () => {
    const d = await depo(kok, { calistir: cal });
    if (kapandi) return;
    sonDepo = d;
    planla();
  };
  // fetch yalnız git deposunda: açılışta beklemeden, sonra 5 dk'da bir; yerel durum dakikada bir
  const fetchVeTazele = async () => {
    await cal('git', ['fetch', '-q', 'origin']);
    await depoTazele();
  };
  const depoSaati = setInterval(depoTazele, 60000);
  depoSaati.unref();
  let fetchSaati = null;
  if (sonDepo.var) {
    fetchVeTazele();
    fetchSaati = setInterval(fetchVeTazele, 5 * 60000);
    fetchSaati.unref();
  }

  // etki/ altındaki kararlar ve taslaklar da paneli yeniden çizdirir.
  // Dizin açılışta yoksa sonradan oluştuğunda (karar ya da elle) izleme başlar;
  // böylece testlerin kendi mkdirSync çağrısı EEXIST ile düşmez.
  let etkiIzleyici = null;
  const etkiIzle = () => {
    if (etkiIzleyici) return;
    try {
      mkdirSync(join(kok, 'etki'), { recursive: true });
      etkiIzleyici = watch(join(kok, 'etki'), () => planla());
    } catch {
      // etki/ oluşturulamıyor ya da izlenemiyorsa karar yine kaydedilir
    }
  };

  let izleyici = null;
  try {
    izleyici = watch(kok, (olay, dosya) => {
      if (dosya === 'etki') etkiIzle();
      if (!dosya || izlenecekler.includes(join(kok, dosya))) planla();
    });
  } catch {
    // dizin yok ya da izlenemiyorsa SSE yalnızca ilk anlık görüntüyü gönderir
  }
  if (existsSync(join(kok, 'etki'))) etkiIzle();

  const hata = (yanit, kod, neden) => {
    yanit.writeHead(kod, { 'content-type': 'application/json; charset=utf-8' });
    yanit.end(JSON.stringify({ hata: neden }));
  };

  const kararAl = (istek, yanit) => {
    const host = String(istek.headers.host || '');
    let ana;
    try {
      ana = new URL(`http://${host}`).hostname;
    } catch {
      ana = '';
    }
    if (ana !== '127.0.0.1' && ana !== 'localhost') {
      hata(yanit, 403, 'istek yerel adresten gelmiyor');
      return;
    }
    const origin = istek.headers.origin;
    if (origin !== undefined && origin !== `http://${host}`) {
      hata(yanit, 403, 'istek kaynağı bu sunucu değil');
      return;
    }

    const tip = String(istek.headers['content-type'] || '');
    if (!tip.startsWith('application/json')) {
      hata(yanit, 415, 'içerik türü application/json olmalı');
      return;
    }

    const parcalar = [];
    let boy = 0;
    let kesildi = false;
    istek.on('data', (parca) => {
      if (kesildi) return;
      boy += parca.length;
      if (boy > 4096) {
        kesildi = true;
        yanit.writeHead(413).end();
        istek.resume(); // kalan gövdeyi boşalt, soketi kapatma
        return;
      }
      parcalar.push(parca);
    });

    istek.on('end', () => {
      if (kesildi) return;

      let girdi;
      try {
        girdi = JSON.parse(Buffer.concat(parcalar).toString('utf8'));
      } catch {
        hata(yanit, 400, 'gövde geçerli JSON değil');
        return;
      }

      let plan;
      try {
        plan = parse(readFileSync(join(kok, 'PLAN.md'), 'utf8'));
      } catch {
        hata(yanit, 404, 'PLAN.md okunamadı');
        return;
      }
      let adim = null;
      for (const kategori of plan.kategoriler) {
        for (const a of kategori.adimlar) {
          if (a.no === girdi?.no) adim = a;
        }
      }
      if (!adim || !adim.etki || adim.bitti) {
        hata(yanit, 404, 'adım yok, etki taşımıyor ya da bitmiş');
        return;
      }

      let karar;
      try {
        karar = kararEkle(kok, girdi);
      } catch (e) {
        hata(yanit, 400, e.message);
        return;
      }

      etkiIzle();
      yanit.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      yanit.end(JSON.stringify({ tamam: true, karar }));
      planla();
    });

    istek.on('error', () => {
      if (kesildi) return;
      kesildi = true;
      hata(yanit, 400, 'istek okunamadı');
    });
  };

  const sunucu = createServer((istek, yanit) => {
    const { pathname } = new URL(istek.url, 'http://x');

    if (istek.method === 'POST' && pathname === '/api/karar') {
      kararAl(istek, yanit);
      return;
    }

    if (istek.method !== 'GET') {
      yanit.writeHead(405).end();
      return;
    }

    if (pathname === '/api/durum') {
      yanit.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      yanit.end(JSON.stringify(durum()));
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
      kapandi = true;
      clearTimeout(zamanlayici);
      clearInterval(depoSaati);
      clearInterval(fetchSaati);
      izleyici?.close();
      etkiIzleyici?.close();
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
