#!/usr/bin/env node
// MDK MCP sunucusu: MCP destekleyen ana yürütücüler (Claude, Antigravity) MDK'yı araçlarla yönetir.
// Taşıma: stdio, satır satır JSON-RPC 2.0. MCP SDK yok; yalnız Node yerleşikleri.
// Proje kökü MDK_PROJE (yoksa çalışma dizini). Betikler bu dosyanın klasöründen; MDK_MCP_BETIK_DIZINI ile değişir (test için).
import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = process.env.MDK_PROJE || process.cwd();
const BETIK_DIZIN = process.env.MDK_MCP_BETIK_DIZINI || dirname(fileURLToPath(import.meta.url));
const yol = (ad) => join(BETIK_DIZIN, ad);
const metin = (t, hata = false) => ({ content: [{ type: 'text', text: t }], isError: hata });
const gecersiz = (alan) => metin(`geçersiz argüman: ${alan}`, true);
const tamSayi = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const EPIC_ISLEMLER = ['ac', 'tartis', 'karar', 'gelistir', 'figma', 'durum'];

// Betiği koşar ve bitmesini bekler; metin: 'çıkış <kod>' + stdout + stderr
function calistir(betik, args) {
  return new Promise((coz) => {
    const c = spawn(process.execPath, [yol(betik), ...args], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    c.stdout.on('data', (x) => (out += x));
    c.stderr.on('data', (x) => (err += x));
    c.on('error', (e) => coz(metin(`çıkış 1\n${e.message}`, true)));
    c.on('close', (kod) => coz(metin(`çıkış ${kod}\n${out}${err}`, kod !== 0)));
  });
}

// Uzun koşuyu ayrık süreç olarak başlatır; çıktısı .mdk-log günlüğüne gider, beklenmez
function arkaKos(betik, args, etiket, dosyaAd) {
  const dizin = join(KOK, '.mdk-log');
  mkdirSync(dizin, { recursive: true });
  const log = join(dizin, `mcp-${dosyaAd}-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
  const fd = openSync(log, 'a');
  const c = spawn(process.execPath, [yol(betik), ...args], { cwd: KOK, detached: true, stdio: ['ignore', fd, fd] });
  closeSync(fd);
  c.on('error', () => {});
  c.unref();
  return metin(`başladı: ${etiket} (pid ${c.pid}, günlük ${log}); durum için mdk_durum`);
}

const ARAC = {
  mdk_durum: {
    aciklama: 'Epic ve story durumunu getirir (mdk-epic.mjs durum); kökte durum.json varsa içeriğini de ekler.',
    sema: { type: 'object', properties: {} },
    async cagir() {
      const r = await calistir('mdk-epic.mjs', ['durum']);
      const d = join(KOK, 'durum.json');
      if (existsSync(d)) r.content[0].text += `\n${readFileSync(d, 'utf8')}`;
      return r;
    },
  },
  mdk_epic: {
    aciklama: 'Epic işlemi: ac (ad ve dosya ile yeni Epic), tartis, karar (deger: onay/red notu), gelistir, figma (deger: url), durum. no: Epic numarası.',
    sema: {
      type: 'object',
      properties: {
        islem: { type: 'string', enum: EPIC_ISLEMLER },
        no: { type: 'integer' }, ad: { type: 'string' }, dosya: { type: 'string' }, deger: { type: 'string' },
      },
      required: ['islem'],
    },
    async cagir(a) {
      if (!EPIC_ISLEMLER.includes(a.islem)) return gecersiz('islem');
      if (a.islem === 'ac') return a.ad && a.dosya ? calistir('mdk-epic.mjs', ['ac', a.ad, a.dosya]) : gecersiz(a.ad ? 'dosya' : 'ad');
      if (a.islem === 'durum') return calistir('mdk-epic.mjs', ['durum']);
      if (!tamSayi(a.no)) return gecersiz('no');
      if (a.islem === 'karar' || a.islem === 'figma') return a.deger ? calistir('mdk-epic.mjs', [a.islem, String(a.no), a.deger]) : gecersiz('deger');
      return calistir('mdk-epic.mjs', [a.islem, String(a.no)]);
    },
  },
  mdk_adim_kos: {
    aciklama: 'Story koşar (mdk-adim.mjs). arka varsayılan true: uzun koşu arka planda başlar, durum mdk_durum ile sorulur; arka false ise bitmesi beklenir.',
    sema: { type: 'object', properties: { no: { type: 'integer' }, arka: { type: 'boolean' } }, required: ['no'] },
    async cagir(a) {
      if (!tamSayi(a.no)) return gecersiz('no');
      const no = String(a.no);
      return a.arka === false ? calistir('mdk-adim.mjs', [no]) : arkaKos('mdk-adim.mjs', [no], `adım ${no}`, `adim-${no}`);
    },
  },
  mdk_paralel: {
    aciklama: 'Bağımsız story\'leri paralel koşar (mdk-paralel.mjs). arka varsayılan true; mdk_adim_kos ile aynı kural.',
    sema: { type: 'object', properties: { nolar: { type: 'array', items: { type: 'integer' }, minItems: 1 }, arka: { type: 'boolean' } }, required: ['nolar'] },
    async cagir(a) {
      if (!Array.isArray(a.nolar) || !a.nolar.length || !a.nolar.every(tamSayi)) return gecersiz('nolar');
      const n = a.nolar.map(String);
      return a.arka === false ? calistir('mdk-paralel.mjs', n) : arkaKos('mdk-paralel.mjs', n, `paralel ${n.join(' ')}`, 'paralel');
    },
  },
  mdk_karar_oku: {
    aciklama: 'Bekleyen panel kararlarını bir kez okur (karar-bekle.mjs --bir-kez).',
    sema: { type: 'object', properties: {} },
    cagir: () => calistir('karar-bekle.mjs', ['--bir-kez', KOK]),
  },
  mdk_rol: {
    aciklama: 'Kodcu (story, hedef = adım no) ya da tasarımcı (hedef = iş dosyası) rolünü ana yürütücünün ucuz modeliyle çağırır (mdk-rol.mjs).',
    sema: {
      type: 'object',
      properties: { rol: { type: 'string', enum: ['kodcu', 'tasarimci'] }, hedef: { type: 'string' } },
      required: ['rol', 'hedef'],
    },
    cagir(a) {
      if (!['kodcu', 'tasarimci'].includes(a.rol)) return gecersiz('rol');
      if (!a.hedef) return gecersiz('hedef');
      return calistir('mdk-rol.mjs', [a.rol, String(a.hedef)]);
    },
  },
  mdk_incele: {
    aciklama: 'Bir story\'nin diff\'ini inceler (mdk-incele.mjs <no>).',
    sema: { type: 'object', properties: { no: { type: 'integer' } }, required: ['no'] },
    cagir: (a) => (tamSayi(a.no) ? calistir('mdk-incele.mjs', [String(a.no)]) : gecersiz('no')),
  },
};

const yaz = (o) => process.stdout.write(JSON.stringify(o) + '\n');
const sonuc = (id, result) => ({ jsonrpc: '2.0', id, result });
const hata = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

// Tek bir JSON-RPC isteğini yanıtlar; bildirimde null döner
async function yanitla(o) {
  const { id, method, params } = o;
  switch (method) {
    case 'initialize':
      return sonuc(id, { protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'mdk', version: '1' } });
    case 'notifications/initialized':
      return null;
    case 'ping':
      return sonuc(id, {});
    case 'tools/list':
      return sonuc(id, { tools: Object.entries(ARAC).map(([ad, t]) => ({ name: ad, description: t.aciklama, inputSchema: t.sema })) });
    case 'tools/call': {
      const ad = params?.name;
      if (!Object.hasOwn(ARAC, ad)) return sonuc(id, metin(`bilinmeyen araç: ${ad}`, true));
      try { return sonuc(id, await ARAC[ad].cagir(params.arguments ?? {})); }
      catch (e) { return sonuc(id, metin(`araç hatası: ${e.message}`, true)); }
    }
    default:
      return id === undefined ? null : hata(id, -32601, `bilinmeyen yöntem: ${method}`);
  }
}

// Bir satırı işler; hata olsa bile süreç düşmez
function isle(satir) {
  let o;
  try { o = JSON.parse(satir); } catch { return yaz(hata(null, -32700, 'bozuk JSON')); }
  if (typeof o !== 'object' || o === null || Array.isArray(o)) return yaz(hata(null, -32600, 'geçersiz istek'));
  yanitla(o).then(
    (r) => r && yaz(r),
    (e) => o.id !== undefined && yaz(hata(o.id, -32603, `iç hata: ${e.message}`)),
  );
}

let tampon = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (x) => {
  tampon += x;
  let i;
  while ((i = tampon.indexOf('\n')) >= 0) {
    const satir = tampon.slice(0, i).trim();
    tampon = tampon.slice(i + 1);
    if (satir) isle(satir);
  }
});
process.stdin.on('end', () => { if (tampon.trim()) isle(tampon.trim()); tampon = ''; });
process.stdout.on('error', () => process.exit(0));
