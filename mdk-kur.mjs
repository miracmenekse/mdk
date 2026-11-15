// Kurulum: bir projeyi ana yürütücülere bağlar. Planlayıcı kuralları projeye yazılır (.mdk/planlayici.md, CLAUDE.md,
// .agents/rules/mdk.md), MDK MCP sunucusu kaydedilir (.mcp.json, Antigravity ayarları), eksik PLAN.md iskeleti ve
// .gitignore girdileri tamamlanır. Her adım idempotent: içerik aynıysa dokunulmaz.
// Kullanım: node mdk-kur.mjs <proje-dizini> [--ana claude,antigravity]
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { anaBul, anaOku } from './mdk-ana.mjs';

const BU = dirname(fileURLToPath(import.meta.url));
const ETIKET = '<!-- mdk-kur tarafından üretildi; kaynağı ~/mdk/esit/planlayici.md -->';
const KURAL_SATIRI = '@.mdk/planlayici.md';
const GITIGNORE = ['.mdk-log/', 'durum.json', 'metrikler.jsonl', 'hakem.jsonl'];

const oku = (yol) => (existsSync(yol) ? readFileSync(yol, 'utf8') : null);
const json = (v) => JSON.stringify(v, null, 2) + '\n';
const err = (m) => process.stderr.write(m + '\n');

// dosyayı yazar; içerik aynıysa dokunmaz
function yaz(yol, icerik) {
  if (oku(yol) === icerik) return console.log(`aynı: ${yol}`);
  mkdirSync(dirname(yol), { recursive: true });
  writeFileSync(yol, icerik);
  console.log(`yazıldı: ${yol}`);
}

// MCP ayar dosyasını okur; yoksa boş nesne, bozuksa hata (dosyaya dokunulmaz)
function mcpOku(yol) {
  const t = oku(yol);
  if (t === null) return {};
  let v;
  try { v = JSON.parse(t); } catch { throw new Error(`bozuk JSON, dokunulmadı: ${yol}`); }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error(`JSON nesnesi değil, dokunulmadı: ${yol}`);
  return v;
}

function mcpEkle(v, ad, proje) {
  v.mcpServers = v.mcpServers ?? {};
  v.mcpServers[ad] = { command: 'node', args: [join(BU, 'mdk-mcp.mjs')], env: { MDK_PROJE: proje } };
}

// CLAUDE.md: kural satırı yoksa en başa eklenir, var olan içerik korunur
function claudeMdIcerik(eski) {
  if (eski === null) return KURAL_SATIRI + '\n';
  if (eski.split('\n').some((s) => s.trim() === KURAL_SATIRI)) return eski;
  return KURAL_SATIRI + '\n' + eski;
}

// .gitignore: eksik girdiler sona eklenir
function gitignoreIcerik(eski) {
  const mevcut = eski ?? '';
  const satirlar = mevcut.split('\n').map((s) => s.trim());
  const eksik = GITIGNORE.filter((s) => !satirlar.includes(s));
  if (eksik.length === 0) return mevcut;
  const onek = mevcut && !mevcut.endsWith('\n') ? mevcut + '\n' : mevcut;
  return onek + eksik.join('\n') + '\n';
}

// Eksik PLAN.md: başlık, yürütücü, planlayıcının Görev/Bütçe satırları (mdk PLAN.md başından), kurallar, Epic 1
function planIskeleti(proje) {
  const ust = (oku(join(BU, 'PLAN.md')) ?? '').split(/^## /m)[0];
  const ayarlar = ust.split('\n').filter((s) => /^Görev [^:]+:/.test(s) || /^Bütçe:/.test(s));
  return [
    `# ${basename(proje)}`,
    '',
    'Yürütücü: opencode',
    ...ayarlar,
    '',
    'Kurallar (tüm adımlar için):',
    "- Kapı dosyalarına ve PLAN.md'ye dokunma.",
    '',
    '## Epic 1 — Başlangıç',
    '',
  ].join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--ana');
  const anaArg = i >= 0 ? args[i + 1] : null;
  if (i >= 0 && anaArg === undefined) { err('Kullanım: node mdk-kur.mjs <proje-dizini> [--ana claude,antigravity]'); return 2; }
  const konum = i >= 0 ? args.filter((_, k) => k !== i && k !== i + 1) : args;
  if (!konum[0]) { err('Kullanım: node mdk-kur.mjs <proje-dizini> [--ana claude,antigravity]'); return 2; }

  const proje = resolve(konum[0]);
  if (!existsSync(proje) || !statSync(proje).isDirectory()) { err(`proje dizini yok: ${konum[0]}`); return 4; }

  const tanim = anaOku();
  const adlar = anaArg !== null ? anaArg.split(',').map((s) => s.trim()).filter(Boolean) : tanim.liste.map((a) => a.ad);
  for (const ad of adlar) if (!anaBul(tanim, ad)) { err(`tanınmayan ana yürütücü: ${ad}`); return 4; }

  const planlayici = oku(join(BU, 'esit', 'planlayici.md'));
  if (planlayici === null) { err('esit/planlayici.md yok (MDK kurulumu eksik)'); return 4; }
  const icerik = `${ETIKET}\n${planlayici}`;

  // Tüm okumalar yazmadan önce: bozuk JSON varsa hiçbir dosya değişmez
  const claudeSecili = adlar.includes('claude');
  const agySecili = adlar.includes('antigravity');
  const agy = process.env.MDK_AGY || 'agy';
  const agyKos = (args) => {
    try {
      const [k, a] = /\.(mjs|cjs|js)$/i.test(agy) ? [process.execPath, [agy, ...args]] : [agy, args];
      return spawnSync(k, a, { encoding: 'utf8' });
    } catch { return { status: null }; }
  };
  const agyVar = agySecili && agyKos(['mcp', 'list']).status === 0;
  const agyYolu = process.env.MDK_AGY_MCP || join(homedir(), '.gemini', 'antigravity', 'mcp_config.json');
  let claudeMcp, agyMcp;
  try {
    if (claudeSecili) claudeMcp = mcpOku(join(proje, '.mcp.json'));
    if (agySecili && !agyVar) agyMcp = mcpOku(agyYolu);
  } catch (e) { err(e.message); return 4; }

  yaz(join(proje, '.mdk', 'planlayici.md'), icerik);

  if (claudeSecili) {
    yaz(join(proje, 'CLAUDE.md'), claudeMdIcerik(oku(join(proje, 'CLAUDE.md'))));
    mcpEkle(claudeMcp, 'mdk', proje);
    yaz(join(proje, '.mcp.json'), json(claudeMcp));
  }

  if (agySecili) {
    yaz(join(proje, '.agents', 'rules', 'mdk.md'), icerik);
    if (agyVar) {
      const ad = `mdk-${basename(proje)}`;
      const res = agyKos(['mcp', 'add', '--env', `MDK_PROJE=${proje}`, ad, 'node', join(BU, 'mdk-mcp.mjs')]);
      if (res.status === 0) {
        console.log(`yazıldı: agy mcp ${ad}`);
      } else {
        err((res.stderr || res.stdout || `${agy} mcp add başarısız`).trim());
        return 4;
      }
    } else {
      mcpEkle(agyMcp, `mdk-${basename(proje)}`, proje);
      yaz(agyYolu, json(agyMcp));
    }
  }

  const plan = join(proje, 'PLAN.md');
  if (oku(plan) === null) yaz(plan, planIskeleti(proje));
  else console.log(`aynı: ${plan} (var, dokunulmadı)`);

  const gi = join(proje, '.gitignore');
  yaz(gi, gitignoreIcerik(oku(gi)));
  return 0;
}

process.exit(main());
