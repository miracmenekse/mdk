// Kapı (adım 198): Adım kontrol noktası (checkpoint etiketi) ve panelden "Bu adımı geri al"
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { KOK, commit, denetci, depo, gecici, git, kos, oku, writeFileSync } from './yardim.mjs';
import { baslat } from '../panel/sunucu.mjs';
import { drawerHtml } from '../panel/ciz.mjs';

const BETIK = join(KOK, 'mdk-geri-al.mjs');
const { vaka, kontrol, bitir } = denetci('geri-al.test');

// (1) geçici depoda PLAN.md (- [ ] 1. İş), ardından cikti.txt yazılıp PLAN.md - [x] 1. İş yapılarak
// adım 1: İş (m/a, deneme 1) konusuyla commit edilir ve git tag mdk/adim-1 HEAD atılır
// → node mdk-geri-al.mjs 1 çıkış 0, çıktıda "geri alındı: adım 1", cikti.txt silinmiş,
// PLAN.md'de - [ ] 1. İş, mdk/adim-1 etiketi silinmiş, git status --porcelain boş
vaka('1 etiketli adım 1 geri alma');
{
  const T = gecici();
  const R = join(T, 'repo');
  depo({ 'PLAN.md': '- [ ] 1. İş\n' }, { R });
  commit(R, 'c0');

  writeFileSync(join(R, 'cikti.txt'), 'merhaba\n');
  writeFileSync(join(R, 'PLAN.md'), '- [x] 1. İş\n');
  commit(R, 'adım 1: İş (m/a, deneme 1)');
  git(R, 'tag', 'mdk/adim-1', 'HEAD');

  const s = kos(BETIK, ['1'], { cwd: R });
  kontrol(s.kod === 0, 'çıkış 0 olmalı', s.cikti);
  kontrol(s.cikti.includes('geri alındı: adım 1'), 'çıktıda "geri alındı: adım 1" olmalı', s.cikti);
  kontrol(!existsSync(join(R, 'cikti.txt')), 'cikti.txt silinmiş olmalı');
  const plan = oku(join(R, 'PLAN.md'));
  kontrol(plan.includes('- [ ] 1. İş'), 'PLAN.md içinde "- [ ] 1. İş" olmalı', plan);
  kontrol(!plan.includes('- [x] 1. İş'), 'PLAN.md içinde "- [x] 1. İş" kalmamalı', plan);
  const tagSonuc = git(R, 'tag', '-l', 'mdk/adim-1').stdout.trim();
  kontrol(tagSonuc === '', 'mdk/adim-1 etiketi silinmiş olmalı', tagSonuc);
  const st = git(R, 'status', '--porcelain').stdout.trim();
  kontrol(st === '', 'git status --porcelain boş olmalı', st);
}

// (2) etiket yokken yalnız "adım 2: İş" commit konusu varken
// node mdk-geri-al.mjs 2 → yine çıkış 0 ve geri alır
vaka('2 etiketsiz commit konusundan adım 2 geri alma');
{
  const T = gecici();
  const R = join(T, 'repo');
  depo({ 'PLAN.md': '- [ ] 2. İş\n' }, { R });
  commit(R, 'c0');

  writeFileSync(join(R, 'dosya2.txt'), 'kod2\n');
  writeFileSync(join(R, 'PLAN.md'), '- [x] 2. İş\n');
  commit(R, 'adım 2: İş');

  const s = kos(BETIK, ['2'], { cwd: R });
  kontrol(s.kod === 0, 'çıkış 0 olmalı', s.cikti);
  kontrol(s.cikti.includes('geri alındı: adım 2'), 'çıktıda "geri alındı: adım 2" olmalı', s.cikti);
  kontrol(!existsSync(join(R, 'dosya2.txt')), 'dosya2.txt silinmiş olmalı');
  const plan = oku(join(R, 'PLAN.md'));
  kontrol(plan.includes('- [ ] 2. İş'), 'PLAN.md içinde "- [ ] 2. İş" olmalı', plan);
  kontrol(!plan.includes('- [x] 2. İş'), 'PLAN.md içinde "- [x] 2. İş" kalmamalı', plan);
  const st = git(R, 'status', '--porcelain').stdout.trim();
  kontrol(st === '', 'git status --porcelain boş olmalı', st);
}

// (3) olmayan adım 99 → çıkış 4; kirli ağaç → çıkış 4; argümansız → çıkış 2
vaka('3 hata durumları (olmayan adım, kirli ağaç, argümansız)');
{
  const T = gecici();
  const R = join(T, 'repo');
  depo({ 'PLAN.md': '- [ ] 1. İş\n' }, { R });
  commit(R, 'c0');

  // Olmayan adım 99
  const sYok = kos(BETIK, ['99'], { cwd: R });
  kontrol(sYok.kod === 4, 'olmayan adım 99 için çıkış 4 olmalı', sYok.cikti);
  kontrol(sYok.cikti.includes('adım 99 için commit bulunamadı'), 'commit bulunamadı uyarısı olmalı', sYok.cikti);

  // Kirli ağaç
  writeFileSync(join(R, 'kirli.txt'), 'kirli');
  const sKirli = kos(BETIK, ['1'], { cwd: R });
  kontrol(sKirli.kod === 4, 'çalışma ağacı kirliyken çıkış 4 olmalı', sKirli.cikti);
  kontrol(sKirli.cikti.includes('çalışma ağacı kirli'), 'çalışma ağacı kirli iletisi basılmalı', sKirli.cikti);
  git(R, 'clean', '-fd');

  // Argümansız
  const sArgYok = kos(BETIK, [], { cwd: R });
  kontrol(sArgYok.kod === 2, 'argümansız çağrıda çıkış 2 olmalı', sArgYok.cikti);

  // Pozitif tamsayı olmayan argüman
  const sGecersiz = kos(BETIK, ['abc'], { cwd: R });
  kontrol(sGecersiz.kod === 2, 'sayısal olmayan adım için çıkış 2 olmalı', sGecersiz.cikti);

  const sSifir = kos(BETIK, ['0'], { cwd: R });
  kontrol(sSifir.kod === 2, '0 adım no için çıkış 2 olmalı', sSifir.cikti);

  const sEksi = kos(BETIK, ['-1'], { cwd: R });
  kontrol(sEksi.kod === 2, 'negatif adım no için çıkış 2 olmalı', sEksi.cikti);
}

// (4) drawerHtml({ no: 3, baslik: 'İş', bitti: true, izleyici: false })
// → id="adim-geri-al" ve data-adim="3" içerir; bitti: false ya da izleyici: true iken düğme yok
vaka('4 drawerHtml geri alma düğmesi');
{
  const h1 = drawerHtml({ no: 3, baslik: 'İş', bitti: true, izleyici: false });
  kontrol(h1.includes('id="adim-geri-al"'), 'bitti: true ve izleyici: false iken id="adim-geri-al" bulunmalı', h1);
  kontrol(h1.includes('data-adim="3"'), 'data-adim="3" bulunmalı', h1);
  kontrol(h1.includes('Bu adımı geri al'), '"Bu adımı geri al" metni bulunmalı', h1);

  const h2 = drawerHtml({ no: 3, baslik: 'İş', bitti: false, izleyici: false });
  kontrol(!h2.includes('id="adim-geri-al"'), 'bitti: false iken geri al düğmesi olmamalı', h2);

  const h3 = drawerHtml({ no: 3, baslik: 'İş', bitti: true, izleyici: true });
  kontrol(!h3.includes('id="adim-geri-al"'), 'izleyici: true iken geri al düğmesi olmamalı', h3);

  const h4 = drawerHtml({ no: 3, baslik: 'İş', bitti: false, izleyici: true });
  kontrol(!h4.includes('id="adim-geri-al"'), 'bitti: false ve izleyici: true iken geri al düğmesi olmamalı', h4);
}

// (5) sunucu (baslat(R, 0)): POST /api/adim-geri-al { adim: 1 } (adım 1 commit'li depoda)
// → 200 { tamam: true, adim: 1 }, PLAN.md'de - [ ] 1. İş; olmayan adım { adim: 99 } → 400
vaka('5 panel sunucusu POST /api/adim-geri-al');
{
  const T = gecici();
  const R = join(T, 'repo');
  depo({ 'PLAN.md': '- [ ] 1. İş\n' }, { R });
  commit(R, 'c0');

  writeFileSync(join(R, 'cikti.txt'), 'içerik 1\n');
  writeFileSync(join(R, 'PLAN.md'), '- [x] 1. İş\n');
  commit(R, 'adım 1: İş');
  git(R, 'tag', 'mdk/adim-1', 'HEAD');

  const srv = await baslat(R, 0);
  const kokUrl = `http://127.0.0.1:${srv.port}`;

  async function post(govde) {
    const r = await fetch(`${kokUrl}/api/adim-geri-al`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof govde === 'string' ? govde : JSON.stringify(govde),
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: r.status, json, text };
  }

  try {
    const r1 = await post({ adim: 1 });
    kontrol(r1.status === 200, 'adım 1 için durum 200 olmalı', r1.text);
    kontrol(r1.json?.tamam === true, 'json.tamam true olmalı', r1.text);
    kontrol(r1.json?.adim === 1, 'json.adim 1 olmalı', r1.text);
    const plan = oku(join(R, 'PLAN.md'));
    kontrol(plan.includes('- [ ] 1. İş'), 'geri alma sonrası PLAN.md içinde "- [ ] 1. İş" olmalı', plan);
    kontrol(!plan.includes('- [x] 1. İş'), 'PLAN.md içinde "- [x] 1. İş" kalmamalı', plan);

    const r99 = await post({ adim: 99 });
    kontrol(r99.status === 400, 'olmayan adım 99 için durum 400 olmalı', r99.text);

    const rGecersiz = await post({ adim: 'abc' });
    kontrol(rGecersiz.status === 400, 'geçersiz adım için durum 400 olmalı', rGecersiz.text);
  } finally {
    await srv.kapat();
  }
}

bitir();
