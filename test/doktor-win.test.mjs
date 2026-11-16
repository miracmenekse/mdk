// Doktor Windows kapı testi (adım 205).
import { KOK, denetci, gecici, join, oku, writeFileSync } from './yardim.mjs';
import { baslat } from '../panel/sunucu.mjs';

const { vaka, kontrol, bitir } = denetci('doktor-win.test');

vaka('1 komutHazirla Windows/non-Windows davranışları');
const mod = await import('../mdk-doktor.mjs').catch(() => null);
const komutHazirla = mod?.komutHazirla;
kontrol(typeof komutHazirla === 'function', 'komutHazirla dışa aktarılmış bir fonksiyon olmalı');

const k1 = komutHazirla?.('claude', ['--version'], 'win32');
kontrol(Array.isArray(k1) && k1.length === 3, 'win32 uzantısız komut 3 öğe dönmeli', JSON.stringify(k1));
kontrol(k1?.[0] === 'claude', 'ilk öğe komut olmalı', JSON.stringify(k1));
kontrol(Array.isArray(k1?.[1]) && k1[1].length === 1 && k1[1][0] === '--version', 'ikinci öğe args olmalı', JSON.stringify(k1));
kontrol(k1?.[2]?.shell === true, 'win32 uzantısız komutta shell true olmalı', JSON.stringify(k1?.[2]));
kontrol(JSON.stringify(k1?.[2]) === JSON.stringify({ shell: true }), 'win32 shell seçeneği {shell:true} olmalı', JSON.stringify(k1?.[2]));

const k2 = komutHazirla?.('C:/x/opencode.cmd', [], 'win32');
kontrol(k2?.[2]?.shell === true, 'win32 .cmd komutta shell true olmalı', JSON.stringify(k2?.[2]));

const k3 = komutHazirla?.('claude', [], 'linux');
kontrol(!k3?.[2]?.shell, 'linux platformunda shell truthy olmamalı', JSON.stringify(k3?.[2]));

const k4 = komutHazirla?.('a.mjs', ['-v'], 'win32');
kontrol(k4?.[0] === process.execPath, '.mjs komutunda node çalıştırılmalı', JSON.stringify(k4));
kontrol(Array.isArray(k4?.[1]) && k4[1].length === 2 && k4[1][0] === 'a.mjs' && k4[1][1] === '-v', '.mjs args korunmalı', JSON.stringify(k4));
kontrol(!k4?.[2]?.shell, '.mjs komutunda shell truthy olmamalı', JSON.stringify(k4?.[2]));

vaka('2 panel /api/doktor önbelleği ve yenile sorgusu');
const T = gecici('doktor-win-');
const sayacDosyasi = join(T, 'sayac.txt');
const sahteGit = join(T, 'git.mjs');
writeFileSync(sahteGit, `import { appendFileSync } from 'node:fs';\nappendFileSync(${JSON.stringify(sayacDosyasi)}, 'x\\n');\nconsole.log('git version 1');\n`);

const onceki = process.env.MDK_DOKTOR_GIT;
process.env.MDK_DOKTOR_GIT = sahteGit;

let srv = null;
try {
  srv = await baslat(T, 0);
  const kokUrl = `http://127.0.0.1:${srv.port}`;

  const r1 = await fetch(`${kokUrl}/api/doktor`);
  const j1 = await r1.json().catch(() => null);
  await fetch(`${kokUrl}/api/doktor`);
  const satir1 = oku(sayacDosyasi).split('\n').filter(Boolean).length;

  const r2 = await fetch(`${kokUrl}/api/doktor?yenile=1`);
  const j2 = await r2.json().catch(() => null);
  const satir2 = oku(sayacDosyasi).split('\n').filter(Boolean).length;

  kontrol(r1.status === 200, 'ilk /api/doktor yanıtı 200 olmalı', `status: ${r1.status}`);
  kontrol(Array.isArray(j1?.araclar), 'ilk yanıt araclar dizisi içermeli', JSON.stringify(j1));
  kontrol(satir1 === 1, 'iki normal istekte sahte git bir kez çağrılmalı', `satir: ${satir1}`);

  kontrol(r2.status === 200, '/api/doktor?yenile=1 yanıtı 200 olmalı', `status: ${r2.status}`);
  kontrol(Array.isArray(j2?.araclar), 'yenile yanıt araclar dizisi içermeli', JSON.stringify(j2));
  kontrol(satir2 === 2, 'yenile=1 taze denetim yapmalı', `satir: ${satir2}`);
} finally {
  await srv?.kapat?.();
  if (onceki === undefined) delete process.env.MDK_DOKTOR_GIT;
  else process.env.MDK_DOKTOR_GIT = onceki;
}

vaka('3 panel/index.html yenile sorgusu içerir');
const html = oku(join(KOK, 'panel', 'index.html'));
kontrol(html.includes('/api/doktor?yenile=1'), 'panel/index.html /api/doktor?yenile=1 içermeli');

bitir();
