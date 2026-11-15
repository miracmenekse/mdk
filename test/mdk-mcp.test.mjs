// Kapı: MDK MCP sunucusu (mdk-mcp.mjs) stdio üzerinden JSON-RPC 2.0 konuşur; betikler sahte .mjs ile sınanır.
// Kullanım (proje kökünde): node test/mdk-mcp.test.mjs
import { spawn } from 'node:child_process';
import { KOK, denetci, gecici, join, oku, uyu, temizEnv, existsSync, writeFileSync } from './yardim.mjs';

const { vaka, kontrol, bitir } = denetci('mdk-mcp.test');
const SUNUCU = join(KOK, 'mdk-mcp.mjs');
const BETIKLER = ['mdk-epic', 'mdk-adim', 'karar-bekle', 'mdk-rol', 'mdk-paralel', 'mdk-incele'];
const GEREKLI = ['mdk_durum', 'mdk_epic', 'mdk_adim_kos', 'mdk_paralel', 'mdk_karar_oku', 'mdk_rol', 'mdk_incele'];

const D = gecici('mdk-mcp-betik-'); // sahte betikler ve argv kayıtları
const K = gecici('mdk-mcp-proje-'); // MDK_PROJE: proje kökü
writeFileSync(join(K, 'durum.json'), '{"adim":7}');
// sahte betik: argümanlarını <D>/<ad>.mjs.argv'ye yazar; mdk-epic SAHTE_EPIC_KOD ile çıkabilir, aksi halde "tamam <args>"
for (const ad of BETIKLER) {
  writeFileSync(join(D, `${ad}.mjs`), `import fs from 'node:fs';
const a = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(join(D, ad + '.mjs.argv'))}, a.join('\\n'));
if ('${ad}' === 'mdk-epic' && process.env.SAHTE_EPIC_KOD) { console.log('hata'); process.exit(Number(process.env.SAHTE_EPIC_KOD)); }
console.log('tamam ' + a.join(' '));
`);
}
const argv = (ad) => oku(join(D, `${ad}.mjs.argv`)).split('\n');
const txt = (o) => o?.result?.content?.[0]?.text ?? '';

// sunucuyu başlatır; yanıtları satır satır toplar, id'ye göre bekletir
function sunucuBaslat(ek = {}) {
  const c = spawn(process.execPath, [SUNUCU], { cwd: KOK, env: temizEnv({ MDK_PROJE: K, MDK_MCP_BETIK_DIZINI: D, ...ek }), stdio: ['pipe', 'pipe', 'pipe'] });
  const satir = []; let tampon = '', sayac = 0;
  c.stdout.on('data', (x) => { tampon += x; let i; while ((i = tampon.indexOf('\n')) >= 0) { satir.push(tampon.slice(0, i)); tampon = tampon.slice(i + 1); } });
  c.stderr.on('data', () => {});
  const bekle = async (kosul, ms = 10000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      for (const s of satir) { let o; try { o = JSON.parse(s); } catch { continue; } if (kosul(o)) return o; }
      await uyu(20);
    }
    return null;
  };
  const gonder = (o) => c.stdin.write(JSON.stringify(o) + '\n');
  return {
    bekle,
    ham: (m) => c.stdin.write(m + '\n'),
    bildirim: (method) => gonder({ jsonrpc: '2.0', method }),
    cagir: (method, params = {}) => { const n = ++sayac; gonder({ jsonrpc: '2.0', id: n, method, params }); return bekle((o) => o.id === n); },
    arac: (ad, arguments_) => { const n = ++sayac; gonder({ jsonrpc: '2.0', id: n, method: 'tools/call', params: { name: ad, arguments: arguments_ } }); return bekle((o) => o.id === n); },
    kapat: () => { c.stdin.end(); c.kill(); },
  };
}

const s = sunucuBaslat();
try {
  // (1) initialize
  vaka('initialize');
  let o = await s.cagir('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } });
  kontrol(o?.result?.serverInfo?.name === 'mdk', 'serverInfo.name mdk değil', JSON.stringify(o));
  kontrol(o?.result?.capabilities?.tools !== undefined, 'capabilities.tools yok', JSON.stringify(o));
  s.bildirim('notifications/initialized'); // yanıt gelmemeli; sonraki isteklerin id'leri yine eşleşir

  // (2) tools/list
  vaka('tools/list');
  o = await s.cagir('tools/list');
  const araclar = o?.result?.tools || [];
  const adlar = araclar.map((a) => a.name);
  for (const g of GEREKLI) kontrol(adlar.includes(g), `${g} araç listesinde yok`, adlar.join(', '));
  kontrol(araclar.length > 0 && araclar.every((a) => a.inputSchema?.type === 'object'), 'bir aracın inputSchema.type object değil');

  // (3) mdk_durum
  vaka('mdk_durum');
  o = await s.arac('mdk_durum', {});
  kontrol(txt(o).includes('çıkış 0'), 'mdk_durum metni "çıkış 0" içermiyor', txt(o));
  kontrol(txt(o).includes('durum') && txt(o).includes('"adim":7'), 'durum.json içeriği metinde yok', txt(o));

  // (4) mdk_epic ac / karar
  vaka('mdk_epic ac');
  o = await s.arac('mdk_epic', { islem: 'ac', ad: 'Yeni iş', dosya: 'is.md' });
  kontrol(JSON.stringify(argv('mdk-epic')) === JSON.stringify(['ac', 'Yeni iş', 'is.md']), 'ac argv yanlış', argv('mdk-epic').join('|'));
  vaka('mdk_epic karar');
  o = await s.arac('mdk_epic', { islem: 'karar', no: 3, deger: 'onay' });
  kontrol(JSON.stringify(argv('mdk-epic')) === JSON.stringify(['karar', '3', 'onay']), 'karar argv yanlış', argv('mdk-epic').join('|'));

  // (5) sahte betik hata kodu verirse isError
  vaka('mdk_epic çıkış 3');
  const s2 = sunucuBaslat({ SAHTE_EPIC_KOD: '3' });
  try {
    o = await s2.arac('mdk_epic', { islem: 'durum' });
    kontrol(o?.result?.isError === true && txt(o).includes('çıkış 3'), 'çıkış 3 isError değil', txt(o));
  } finally { s2.kapat(); }

  // (6) geçersiz argüman
  vaka('mdk_epic geçersiz işlem');
  o = await s.arac('mdk_epic', { islem: 'sil' });
  kontrol(o?.result?.isError === true && txt(o).includes('geçersiz argüman'), 'geçersiz işlem hata vermedi', txt(o));

  // (7) mdk_adim_kos arka: hemen döner, süreç sonra argv yazar
  vaka('mdk_adim_kos arka');
  const t0 = Date.now();
  o = await s.arac('mdk_adim_kos', { no: 5 });
  const sn = (Date.now() - t0) / 1000;
  kontrol(sn < 3, `arka koşu ${sn} sn sürdü (<3 beklenir)`);
  kontrol(txt(o).includes('başladı: adım 5'), 'arka metni "başladı: adım 5" içermiyor', txt(o));
  const t1 = Date.now();
  while (!existsSync(join(D, 'mdk-adim.mjs.argv')) && Date.now() - t1 < 5000) await uyu(50);
  kontrol(argv('mdk-adim').includes('5'), 'arka süreç adım 5 ile çağrılmadı', argv('mdk-adim').join('|'));
  vaka('mdk_adim_kos eşzamanlı');
  o = await s.arac('mdk_adim_kos', { no: 5, arka: false });
  kontrol(txt(o).includes('tamam 5'), 'eşzamanlı koşu "tamam 5" içermiyor', txt(o));

  // (8) mdk_rol
  vaka('mdk_rol');
  o = await s.arac('mdk_rol', { rol: 'kodcu', hedef: '4' });
  kontrol(JSON.stringify(argv('mdk-rol')) === JSON.stringify(['kodcu', '4']), 'rol argv yanlış', argv('mdk-rol').join('|'));
  o = await s.arac('mdk_rol', { rol: 'x', hedef: '4' });
  kontrol(o?.result?.isError === true, 'geçersiz rol hata vermedi', txt(o));

  // (9) diğer araçlar (paralel arka, karar okuma, inceleme)
  vaka('mdk_paralel ve diğerleri');
  o = await s.arac('mdk_paralel', { nolar: [4, 5] });
  const t2 = Date.now();
  while (!existsSync(join(D, 'mdk-paralel.mjs.argv')) && Date.now() - t2 < 5000) await uyu(50);
  kontrol(JSON.stringify(argv('mdk-paralel')) === JSON.stringify(['4', '5']), 'paralel argv yanlış', argv('mdk-paralel').join('|'));
  o = await s.arac('mdk_karar_oku', {});
  kontrol(JSON.stringify(argv('karar-bekle')) === JSON.stringify(['--bir-kez', K]), 'karar_oku argv yanlış', argv('karar-bekle').join('|'));
  o = await s.arac('mdk_incele', { no: 4 });
  kontrol(JSON.stringify(argv('mdk-incele')) === JSON.stringify(['4']), 'incele argv yanlış', argv('mdk-incele').join('|'));

  // (10) hatalı girdiler sunucuyu düşürmez
  vaka('bozuk JSON, bilinmeyen yöntem, bilinmeyen araç');
  s.ham('{oops');
  o = await s.bekle((x) => x.id === null && x.error?.code === -32700);
  kontrol(o !== null, 'bozuk JSON için -32700 yanıtı gelmedi');
  o = await s.cagir('ping');
  kontrol(o?.id !== undefined && JSON.stringify(o?.result) === '{}', 'bozuk satırdan sonra ping yanıtlanmadı', JSON.stringify(o));
  o = await s.cagir('bilinmeyen/yontem');
  kontrol(o?.error?.code === -32601, 'bilinmeyen yöntem -32601 değil', JSON.stringify(o));
  o = await s.arac('yok_arac', {});
  kontrol(o?.result?.isError === true, 'bilinmeyen araç isError değil', JSON.stringify(o));
} finally {
  s.kapat();
}
bitir();
