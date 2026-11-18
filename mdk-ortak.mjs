// Koşturucuların ortak parçaları (mdk-adim, mdk-incele, persona-tur, mdk-paralel). Yan etkisiz: yalnız dışa aktarım.
// Bash sürümlerindeki awk/grep/sed/setsid/flock parçalarının JS karşılığı; Windows'ta da çalışır.
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync, writeSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const WIN = process.platform === 'win32';
// komut bir .mjs/.js betiğiyse (testlerdeki sahte opencode/cursor/bun) node ile başlatılır: Windows'ta da çalışır
export const komutHazirla = (komut, args = []) => (/\.(mjs|cjs|js)$/i.test(komut) ? [process.execPath, [komut, ...args]] : [komut, args]);
const satirlar = (m) => m.split(/\r?\n/);
const oku = (yol) => { try { return readFileSync(yol, 'utf8'); } catch { return ''; } };

// adım bloğu: "- [ ]/[x] N." satırından bir sonraki adım ya da "## " satırına kadar
export function adimBlogu(plan, n) {
  const bas = new RegExp(`^- \\[[ x]\\] ${n}\\.`);
  const cikti = []; let on = false;
  for (const l of satirlar(plan)) {
    if (!on) { if (bas.test(l)) { on = true; cikti.push(l); } continue; }
    if (/^- \[/.test(l) || /^## /.test(l)) break;
    cikti.push(l);
  }
  return on ? cikti.join('\n') : '';
}

// adımın Epic'i: adımın üstündeki son "## " başlığından ilk "- [" satırına kadarki metin (başlık hariç)
export function epicBlogu(plan, n) {
  const bas = new RegExp(`^- \\[[ x]\\] ${n}\\.`);
  let b = '', on = false;
  for (const l of satirlar(plan)) {
    if (bas.test(l)) return b;
    if (/^## /.test(l)) { b = ''; on = true; continue; }
    if (on && /^- \[/.test(l)) on = false;
    if (on) b += l + '\n';
  }
  return '';
}

// "^<ad>: (.*)" ilk eşleşme
export function planSatiri(metin, ad) {
  const kacik = ad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = metin.match(new RegExp(`^${kacik}: (.*)$`, 'm'));
  return m ? m[1] : null;
}

export const modelListesi = (satir) => (satir || '').replace(/\s+/g, '').split(',').filter(Boolean);

export function opencodeSec(dir) {
  if (process.env.MDK_OPENCODE) return process.env.MDK_OPENCODE;
  const r = spawnSync(process.execPath, [join(dir, 'oc-sec.mjs')], { encoding: 'utf8' });
  return (r.stdout || '').trim() || 'opencode';
}

// step_finish (v1), step_start (v2), cursor-agent assistant/result, agy stream-json olaylarından ölçüm
export function olaylariTopla(log) {
  let token = 0, maliyet = 0, etkin = 0, ss = 0, sf = 0, agyIstek = 0; const cur = new Set();
  const okunanDosyalar = new Set();
  let okunanSatir = 0;
  for (const l of satirlar(oku(log))) {
    let x; try { x = JSON.parse(l); } catch { continue; }
    if (!x || typeof x !== 'object') continue;
    if (x.type === 'step_start') ss++;
    if (x.type === 'step_finish' && x.part?.tokens) {
      const k = x.part.tokens;
      const top = k.total ?? ((k.input || 0) + (k.output || 0) + (k.reasoning || 0) + (k.cache?.read || 0) + (k.cache?.write || 0));
      token += top; maliyet += x.part.cost || 0; etkin += top - (k.cache?.read || 0); sf++;
    }
    if (x.type === 'assistant' && x.model_call_id) cur.add(x.model_call_id);
    if (x.type === 'result' && x.usage) {
      const u = x.usage, top = (u.inputTokens || 0) + (u.outputTokens || 0) + (u.cacheReadTokens || 0) + (u.cacheWriteTokens || 0);
      token += top; etkin += top - (u.cacheReadTokens || 0);
    }
    if (x.event === 'step_update' && x.step_update?.step_type === 'agent_response' && x.step_update?.state === 'DONE') {
      agyIstek++;
    }
    if (x.event === 'result' && x.result?.usage) {
      const u = x.result.usage;
      const cr = u.cache_read_tokens || 0;
      const inp = u.input_tokens || 0;
      const out = u.output_tokens || 0;
      const th = u.thinking_tokens || 0;
      const freshInp = inp >= cr ? inp - cr : inp;
      const fresh = Math.max(0, freshInp + out + th);
      token += Math.max(u.total_tokens || 0, fresh + cr);
      etkin += fresh;
    }
    if (x.type === 'tool_use' && x.part?.tool === 'read' && x.part?.state?.status === 'completed') {
      const dosya = x.part.state.input?.filePath || x.part.state.input?.path;
      if (dosya) okunanDosyalar.add(dosya);
      const out = typeof x.part.state.output === 'string' ? x.part.state.output : '';
      const cm = out.match(/<content>([\s\S]*?)<\/content>/);
      if (cm) {
        okunanSatir += cm[1] ? cm[1].split(/\r?\n/).length : 0;
      } else if (out) {
        okunanSatir += out.split(/\r?\n/).length;
      }
    }
    if (x.event === 'step_update' && x.step_update?.state === 'DONE' && (x.step_update?.tool_name === 'read_file' || x.step_update?.tool_name === 'view_file')) {
      const params = x.step_update.parameters || x.step_update.tool_info?.parameters;
      const dosya = params?.Path || params?.AbsolutePath;
      if (dosya) okunanDosyalar.add(dosya);
      const sLine = params?.StartLine;
      const eLine = params?.EndLine;
      if (sLine !== undefined && eLine !== undefined && Number(eLine) >= Number(sLine)) {
        okunanSatir += Number(eLine) - Number(sLine) + 1;
      } else {
        const out = x.step_update.tool_info?.output ?? x.step_update.output ?? '';
        const m = String(out).match(/(\d+)\s+lines\b/i);
        if (m) okunanSatir += Number(m[1]) || 0;
      }
    }
  }
  return { token, maliyet, etkin, istek: Math.max(ss, sf) + cur.size + agyIstek, okunanDosya: okunanDosyalar.size, okunanSatir };
}

export function metinAyikla(log) {
  let m = '';
  for (const l of satirlar(oku(log))) {
    try {
      const x = JSON.parse(l);
      if (x?.type === 'text') m += x.part?.text ?? '';
      else if (x?.event === 'result' && typeof x.result?.response === 'string') m += x.result.response;
    } catch {}
  }
  return m;
}

export function oturumKimligi(log) {
  const m = oku(log).match(/"sessionID":"(ses_[^"]+)"/);
  return m ? m[1] : null;
}

const dbYolu = () => process.env.OPENCODE_DB || join(homedir(), '.local', 'share', 'opencode', 'opencode.db');
// node:sqlite eşzamanlı içe aktarılamadığı için önceden yüklenir; yoksa db adımları sessizce atlanır
let SQLITE = null;
try { SQLITE = (await import('node:sqlite')).DatabaseSync; } catch {}
function db() { try { return SQLITE ? new SQLITE(dbYolu(), { readOnly: true }) : null; } catch { return null; } }

const kes = (oc, sid) => { try { const [k, a] = komutHazirla(oc, ['api', 'POST', `/api/session/${sid}/interrupt`]); spawnSync(k, a, { stdio: 'ignore', timeout: 15000 }); } catch {} };

// kesilen oturumu arka plan servisinde de durdurur (yoksa çalışmaya devam eder)
export function oturumKapat(oc, log, baslik) {
  let sid = oturumKimligi(log);
  if (!sid && baslik && (process.env.MDK_OPENCODE !== 'opencode' || process.env.OPENCODE_DB)) {
    const d = db();
    try { const r = d?.prepare('select id from session_v2 where title=? order by time_created desc limit 1').get(baslik); if (r && /^ses_/.test(r.id)) sid = r.id; } catch {}
    try { d?.close(); } catch {}
  }
  if (sid && sid.startsWith('ses_')) kes(oc, sid);
}

// yarım kalmış (son mesajı idle olmayan) eski adim-/kapi-/persona- oturumlarını sustur
export function zombiOturumlar() {
  const d = db(); if (!d) return [];
  try {
    const q = d.prepare("select s.id,(select type from session_message m where m.session_id=s.id order by seq desc limit 1) ty from session_v2 s where (s.title like 'adim-%' or s.title like 'kapi-%' or s.title like 'persona-%') and s.time_idle is null");
    return q.all().filter((r) => r.id && /^ses_/.test(r.id) && r.ty && r.ty !== 'idle').map((r) => r.id);
  } catch { return []; } finally { try { d.close(); } catch {} }
}
export function zombiTemizle(oc) {
  if (process.env.MDK_OPENCODE) return;
  for (const sid of zombiOturumlar()) kes(oc, sid);
}

export const canli = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

// süreç ağacını öldür: POSIX'te grup (detached → pgid = pid), Windows'ta taskkill /T
export function agacOldur(pid, sinyal = 'SIGKILL') {
  if (!pid) return;
  try {
    if (WIN) spawnSync('taskkill', ['/T', '/F', '/PID', String(pid)], { stdio: 'ignore' });
    else process.kill(-pid, sinyal);
  } catch {}
}

const uyu = (ms) => new Promise((coz) => setTimeout(coz, ms));

// tek koşu: süreci başlatır (stdin kapalı), izler, gerekirse öldürür. → {kod, neden, pid}
// ilk: log boşken bu kadar sn → yanit_yok; sure: toplam sn → sure; durdur({gecen}) bir neden dönerse o neden
export async function kos({ komut, args = [], cwd, env, log, ilk = 75, sure = 600, poll = 3000, durdur }) {
  const out = openSync(log, 'w'), err = openSync(log + '.err', 'w');
  let kod = null, bitti = false, neden = null;
  const t0 = Date.now();
  let c;
  try {
    // Windows: shell:false şart. cmd.exe istem metnini (çok satır, tırnak, & | > %) bozar; .cmd/.bat sarmalayıcısı
    // shell'siz başlatılamaz → aşağıdaki hata yolu "command not found" yazar, koşturucu ortam hatası (çıkış 4) verir.
    const [k, a] = komutHazirla(komut, args);
    c = spawn(k, a, { cwd, env: env || process.env, detached: !WIN, stdio: ['ignore', out, err], windowsHide: true, shell: false });
  } catch (e) {
    writeSync(err, `${komut}: command not found (${e.message})\n`);
  }
  closeSync(out); closeSync(err);
  if (!c) return { kod: 127, neden: null, pid: 0 };
  const bitis = new Promise((coz) => {
    c.on('exit', (k, s) => { kod = k ?? (s ? 128 : 1); bitti = true; coz(); });
    c.on('error', (e) => { try { const f = openSync(log + '.err', 'a'); writeSync(f, `${komut}: command not found (${e.code || e.message})${WIN ? ' — Windows: .cmd sarmalayıcısı yerine gerçek .exe yolunu MDK_OPENCODE / MDK_CURSOR ile ver' : ''}\n`); closeSync(f); } catch {} kod = 127; bitti = true; coz(); });
  });
  while (!bitti) {
    await Promise.race([bitis, uyu(poll)]);
    if (bitti) break;
    const gecen = (Date.now() - t0) / 1000;
    let boyut = 0; try { boyut = statSync(log).size; } catch {}
    if (durdur) neden = durdur({ gecen }) || null;
    if (!neden && boyut === 0 && gecen >= ilk) neden = 'yanit_yok';
    else if (!neden && gecen >= sure) neden = 'sure';
    if (neden) {
      agacOldur(c.pid, 'SIGTERM');
      await Promise.race([bitis, uyu(2000)]);
      agacOldur(c.pid, 'SIGKILL');
      await Promise.race([bitis, uyu(1000)]);
      break;
    }
  }
  agacOldur(c.pid, 'SIGKILL'); // grupta kalan yetim süreç
  return { kod, neden, pid: c.pid };
}

// model kilidi: paralel koşularda aynı model aynı anda denenmesin. <dizin>/<model> işaret dosyası kalır (bash/flock
// sürümüyle aynı görünüm); asıl kilit <dizin>/<model>.kilit, içinde sahibin PID'i. Sahibi ölmüşse (çökme) bayat
// kilit temizlenip yeniden alınır. Alınamazsa null.
export function kilitAl(dizin, model) {
  const yol = join(dizin, model.replaceAll('/', '_')), kilit = yol + '.kilit';
  try { closeSync(openSync(yol, 'a')); } catch {}
  for (let i = 0; i < 2; i++) {
    try {
      const fd = openSync(kilit, 'wx'); writeSync(fd, String(process.pid)); closeSync(fd);
      return { yol: kilit };
    } catch (e) {
      if (e.code !== 'EEXIST') return null;
      const sahip = Number(oku(kilit).trim());
      if (sahip && canli(sahip)) return null;
      try { unlinkSync(kilit); } catch {}
    }
  }
  return null;
}
export function kilitBirak(k) {
  if (!k) return;
  try { if (Number(oku(k.yol).trim()) === process.pid) unlinkSync(k.yol); } catch {}
}

// graphify dilimi: adımın konusuyla ilgili dosya/fonksiyon ve satır bağlamı (isteğe bağlı)
export function grafDilimi({ kok = process.cwd(), sorgu = '', komut, butce, guncelle = true } = {}) {
  try {
    if (process.env.MDK_GRAF !== '1') return '';
    if (!sorgu || !String(sorgu).trim()) return '';
    const git = spawnSync('git', ['check-ignore', '-q', 'graphify-out'], { cwd: kok });
    if (git.status !== 0) return '';
    const kmt = komut || process.env.MDK_GRAPHIFY || 'graphify';
    if (guncelle !== false) {
      const [uk, ua] = komutHazirla(kmt, ['update', '.']);
      spawnSync(uk, ua, { cwd: kok, timeout: 60000, stdio: 'ignore' });
    }
    const B = butce || Number(process.env.MDK_GRAF_BUTCE) || 1500;
    const [qk, qa] = komutHazirla(kmt, ['query', sorgu, '--budget', String(B)]);
    const res = spawnSync(qk, qa, { cwd: kok, timeout: 30000, encoding: 'utf8' });
    if (res.error || res.status !== 0 || !res.stdout || !res.stdout.trim()) return '';
    return res.stdout.trim().slice(0, 8000);
  } catch {
    return '';
  }
}

// çalışma ağacı kilidi: aynı depoda aynı anda birden fazla koşturucu çalışmasın
export function agacKilidi(kok = process.cwd()) {
  const dizin = join(kok, '.mdk-log');
  const yol = join(dizin, 'agac.kilit');
  try { mkdirSync(dizin, { recursive: true }); } catch {}
  const birak = () => {
    try {
      if (Number(oku(yol).trim()) === process.pid) unlinkSync(yol);
    } catch {}
  };
  for (let i = 0; i < 2; i++) {
    try {
      const fd = openSync(yol, 'wx');
      try { writeSync(fd, String(process.pid)); } finally { closeSync(fd); }
      return { ok: true, birak };
    } catch (e) {
      if (e.code !== 'EEXIST') return { ok: false, sahip: null };
      const raw = oku(yol).trim();
      const sahip = Number(raw);
      if (Number.isInteger(sahip) && sahip > 0 && canli(sahip)) {
        return { ok: false, sahip };
      }
      try { unlinkSync(yol); } catch {}
    }
  }
  return { ok: false, sahip: null };
}

// yalıtılmış deneme worktree'si: adımı geçici kopyada sına
export function denemeWorktreeAc(kok = process.cwd(), adimNo = 0) {
  try {
    const yol = join(kok, '.mdk-log', 'wt', `adim-${adimNo}-${process.pid}`);
    try {
      spawnSync('git', ['worktree', 'remove', '--force', yol], { cwd: kok, stdio: 'ignore' });
      rmSync(yol, { recursive: true, force: true });
    } catch {}
    mkdirSync(join(kok, '.mdk-log', 'wt'), { recursive: true });
    const res = spawnSync('git', ['worktree', 'add', '--detach', yol, 'HEAD'], { cwd: kok, stdio: 'ignore' });
    if (res.status !== 0 || res.error) return null;
    const kapat = () => {
      try {
        spawnSync('git', ['worktree', 'remove', '--force', yol], { cwd: kok, stdio: 'ignore' });
        rmSync(yol, { recursive: true, force: true });
      } catch {}
    };
    return { yol, kapat };
  } catch {
    return null;
  }
}

export function denemeWorktreeAktar(wtYol, kok = process.cwd()) {
  try {
    const res = spawnSync('git', ['status', '--porcelain', '-uall'], { cwd: wtYol, encoding: 'utf8' });
    if (res.status !== 0 || res.error) return false;
    const satirlar = (res.stdout || '').split(/\r?\n/).filter(Boolean);
    for (const sat of satirlar) {
      if (sat.slice(0, 2).includes('R') || sat.includes(' -> ')) {
        const parcalar = sat.slice(3).trim().split(' -> ');
        const eski = parcalar[0].replace(/^"|"$/g, '').trim();
        const yeni = parcalar[1].replace(/^"|"$/g, '').trim();
        try { rmSync(join(kok, eski), { recursive: true, force: true }); } catch {}
        if (
          yeni !== '.mdk-log' &&
          !yeni.startsWith('.mdk-log/') &&
          !yeni.startsWith('.mdk-log\\') &&
          yeni !== 'durum.json' &&
          yeni !== 'metrikler.jsonl'
        ) {
          const hy = join(kok, yeni);
          mkdirSync(dirname(hy), { recursive: true });
          copyFileSync(join(wtYol, yeni), hy);
        }
        continue;
      }
      const kod = sat.slice(0, 2);
      let dosya = sat.slice(3).trim();
      if (dosya.startsWith('"') && dosya.endsWith('"')) {
        dosya = dosya.slice(1, -1);
      }
      if (
        dosya === '.mdk-log' ||
        dosya.startsWith('.mdk-log/') ||
        dosya.startsWith('.mdk-log\\') ||
        dosya === 'durum.json' ||
        dosya === 'metrikler.jsonl'
      ) {
        continue;
      }
      const kaynakYol = join(wtYol, dosya);
      const hedefYol = join(kok, dosya);
      if (kod.includes('D') || !existsSync(kaynakYol)) {
        try { rmSync(hedefYol, { recursive: true, force: true }); } catch {}
      } else {
        mkdirSync(dirname(hedefYol), { recursive: true });
        copyFileSync(kaynakYol, hedefYol);
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Salt okunur agy çağrısı: plan kipinde, model verilmişse --model ile başlar.
export function agySaltOkuArgs(ad, istem) {
  return [...(ad === 'varsayilan' ? [] : ['--model', ad]), '--mode', 'plan', '--output-format', 'stream-json', '-p', istem];
}

// Yalıtılmış çalışma alanının etkin olup olmadığını denetler (MDK_YALITIM=1, adımda - Yalıtım: evet ya da PLAN başında Yalıtım: evet).
export function yalitimEtkinMi(planMetni = '', adimBlok = '', env = process.env) {
  if (env.MDK_YALITIM === '0') return false;
  if (env.MDK_YALITIM === '1') return true;
  if (adimBlok && /^\s*-\s*(?:Yalıtım|Yalitim):\s*evet\b/im.test(adimBlok)) return true;
  if (planMetni) {
    const ust = planMetni.split(/^##\s/m)[0] || '';
    if (/^(?:Yalıtım|Yalitim):\s*evet\b/im.test(ust)) return true;
  }
  return false;
}

// Başarısız denemede çalışma ağacını hedef commit'e temiz geri alır (.mdk-log, durum.json, metrikler.jsonl korunur).
export function temizGeriAl(kok = process.cwd(), hedefCommit = 'HEAD') {
  try {
    const r1 = spawnSync('git', ['reset', '--hard', hedefCommit], { cwd: kok, stdio: 'ignore' });
    const r2 = spawnSync('git', ['clean', '-fdq', '-e', '.mdk-log', '-e', 'durum.json', '-e', 'metrikler.jsonl', '-e', 'hakem.jsonl'], { cwd: kok, stdio: 'ignore' });
    return r1.status === 0 && r2.status === 0;
  } catch {
    return false;
  }
}

// Sıfır bağımlılıklı yerel depo / kod haritası: dışa aktarılan sembolleri (satır numarasıyla) ve yerel bağımlılıkları çıkarır.
export function depoHaritasi({ kok = process.cwd(), sorgu = '', adimBlok = '', butce = 1200 } = {}) {
  try {
    const ATLA_DIZIN = new Set(['.git', '.mdk-log', 'node_modules', 'graphify-out', 'test', 'kapi', 'epic', 'persona-tur']);
    const dosyalar = [];
    const tara = (dizin, goreceli = '', derinlik = 0) => {
      if (derinlik > 2) return;
      let girdiler = [];
      try { girdiler = readdirSync(dizin, { withFileTypes: true }); } catch { return; }
      for (const g of girdiler) {
        if (g.name.startsWith('.')) continue;
        const rel = goreceli ? `${goreceli}/${g.name}` : g.name;
        if (g.isDirectory()) {
          if (!ATLA_DIZIN.has(g.name)) tara(join(dizin, g.name), rel, derinlik + 1);
        } else if (/\.(mjs|js)$/i.test(g.name) && !/\.test\.(mjs|js)$/i.test(g.name)) {
          dosyalar.push(rel);
        }
      }
    };
    tara(kok);
    if (!dosyalar.length) return '';

    const hedefSet = new Set();
    for (const m of String(adimBlok || '').matchAll(/`([\w./-]+\.(?:mjs|js))(?::[\d,-]+)?`/g)) {
      hedefSet.add(m[1]);
    }
    const kelimeler = String(`${sorgu || ''} ${adimBlok || ''}`)
      .toLowerCase()
      .match(/[a-z0-9ğüşıöç_]{3,}/g) || [];

    const satirListesi = [];
    for (const rel of dosyalar.sort()) {
      const icerik = oku(join(kok, rel));
      if (!icerik) continue;
      const semboller = [];
      const s = icerik.split(/\r?\n/);
      for (let i = 0; i < s.length; i++) {
        const m = s[i].match(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/);
        if (m) semboller.push(`${m[1]}:L${i + 1}`);
      }
      const bagimliliklar = [];
      for (const m of icerik.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
        if (!bagimliliklar.includes(m[1])) bagimliliklar.push(m[1]);
      }
      if (!semboller.length && !bagimliliklar.length) continue;

      let puan = hedefSet.has(rel) ? 100 : 0;
      const kucukRel = rel.toLowerCase();
      for (const k of kelimeler) {
        if (kucukRel.includes(k)) puan += 5;
        if (semboller.some((sym) => sym.toLowerCase().includes(k))) puan += 3;
      }
      const sembolBilgi = semboller.length ? semboller.join(', ') : '(yok)';
      const bagBilgi = bagimliliklar.length ? ` -> ${bagimliliklar.join(', ')}` : '';
      satirListesi.push({ rel, puan, metin: `${rel}: ${sembolBilgi}${bagBilgi}` });
    }

    satirListesi.sort((a, b) => b.puan - a.puan || a.rel.localeCompare(b.rel));
    const secilen = [];
    let toplam = 0;
    for (const oge of satirListesi) {
      const ek = (secilen.length ? 1 : 0) + oge.metin.length;
      if (toplam + ek > butce) break;
      secilen.push(oge.metin);
      toplam += ek;
    }
    return secilen.join('\n');
  } catch {
    return '';
  }
}


