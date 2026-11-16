// Ön koşul doktoru: Node, Git, AI yürütücüleri ve gh denetimi
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const komutHazirla = (komut, args = [], platform = process.platform) => {
  // .mjs/.cjs/.js her platformda Node ile çalışır
  if (/\.(mjs|cjs|js)$/i.test(komut)) return [process.execPath, [komut, ...args], {}];
  // Windows'ta uzantısız ya da .cmd/.bat komutlar shell gerektirir (npm ile kurulan claude.cmd vb.)
  if (platform === 'win32' && (/\.(cmd|bat)$/i.test(komut) || !/\.[^\\/]+$/.test(komut))) {
    return [komut, args, { shell: true }];
  }
  return [komut, args, {}];
};

function calistir(komut, args = []) {
  try {
    const [prog, param, secenek] = komutHazirla(komut, args);
    const res = spawnSync(prog, param, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 4000,
      ...secenek,
    });
    if (res.status === 0) {
      return { basarili: true, cikti: (res.stdout || '').trim() };
    }
  } catch {}
  return { basarili: false, cikti: '' };
}

export function doktorRaporu(ortam = process.env) {
  // 1. Node.js
  const nodeRes = calistir(ortam.MDK_DOKTOR_NODE || process.execPath, ['--version']);
  const nodeArac = {
    ad: 'node',
    baslik: 'Node.js çalışma zamanı',
    zorunlu: true,
    kurulu: nodeRes.basarili,
    surum: nodeRes.basarili ? nodeRes.cikti : null,
    oneri: 'https://nodejs.org adresinden Node.js LTS sürümünü indirip kur.',
  };

  // 2. Git
  const gitRes = calistir(ortam.MDK_DOKTOR_GIT || 'git', ['--version']);
  const gitArac = {
    ad: 'git',
    baslik: 'Git sürüm kontrolü',
    zorunlu: true,
    kurulu: gitRes.basarili,
    surum: gitRes.basarili ? gitRes.cikti : null,
    oneri: 'https://git-scm.com adresinden Git kur.',
  };

  // 3. Yapay zeka yürütücüsü
  const yurutucuAdaylar = [
    { ad: 'agy', komut: ortam.MDK_AGY || 'agy' },
    { ad: 'claude', komut: ortam.MDK_CLAUDE || 'claude' },
    { ad: 'opencode', komut: ortam.MDK_OPENCODE || 'opencode' },
  ];
  const bulunanlar = [];
  for (const a of yurutucuAdaylar) {
    const r = calistir(a.komut, ['--version']);
    if (r.basarili) {
      bulunanlar.push(a.ad);
    }
  }
  const yurutucuKurulu = bulunanlar.length > 0;
  const yurutucuArac = {
    ad: 'yurutucu',
    baslik: 'Yapay zeka yürütücüsü',
    zorunlu: true,
    kurulu: yurutucuKurulu,
    surum: yurutucuKurulu ? bulunanlar.join(', ') : null,
    oneri: 'Antigravity (agy), Claude Code (claude) ya da OpenCode (opencode) araçlarından en az birini kur.',
  };

  // 4. GitHub CLI (isteğe bağlı)
  const ghRes = calistir(ortam.MDK_GH || 'gh', ['--version']);
  const ghArac = {
    ad: 'gh',
    baslik: 'GitHub CLI (radar için isteğe bağlı)',
    zorunlu: false,
    kurulu: ghRes.basarili,
    surum: ghRes.basarili ? ghRes.cikti : null,
    oneri: 'Haftalık radar taraması için https://cli.github.com adresinden gh kur (isteğe bağlı).',
  };

  const araclar = [nodeArac, gitArac, yurutucuArac, ghArac];
  const tamam = araclar.filter((a) => a.zorunlu).every((a) => a.kurulu === true);

  return { tamam, araclar };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const jsonMu = process.argv.includes('--json');
  const rapor = doktorRaporu();
  if (jsonMu) {
    console.log(JSON.stringify(rapor, null, 2));
  } else {
    for (const a of rapor.araclar) {
      const isaret = a.kurulu ? '✓' : '✗';
      const detay = a.kurulu ? a.surum : a.oneri;
      console.log(`${isaret} ${a.baslik}: ${detay}`);
    }
    if (rapor.tamam) {
      console.log('\nTüm zorunlu araçlar hazır.');
    } else {
      console.log('\nBazı zorunlu araçlar eksik. Lütfen yukarıdaki önerileri uygulayın.');
    }
  }
  process.exit(rapor.tamam ? 0 : 1);
}
