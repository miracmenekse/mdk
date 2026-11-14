// Kullanım (proje kökünde): persona-tur.mjs <alan> <soru-dosyası> "<kart 1>" "<kart 2>" ["<kart 3>" ...]
// Ortam: PERSONA_SURE, PERSONA_ILK, PERSONA_MODELLER, PERSONALAR, PLAN
// Her persona kartını OpenCode'da ayrı oturumda (plan ajanı, salt-okunur) paralel koşturur; çıktı persona-tur/<zaman>/.
// Çıkış: 0 en az 2 geçerli yanıt (tek kartta 1) | 1 yetersiz | 2 hatalı kullanım
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kos, metinAyikla, modelListesi, opencodeSec, oturumKapat, planSatiri } from './mdk-ortak.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const OC = opencodeSec(DIR);
const hata = (m) => { console.error(m); process.exit(2); };
const oku = (y) => { try { return readFileSync(y, 'utf8'); } catch { return ''; } };
const kirp = (s) => s.replace(/\n+$/, ''); // $(...) gibi sondaki satır sonlarını at

const [ALAN, SORU, ...KARTLAR] = process.argv.slice(2);
if (KARTLAR.length < 1) hata('kullanım: persona-tur.sh <alan> <soru-dosyası> "<kart 1>" "<kart 2>" [...]');
const PERSONALAR = process.env.PERSONALAR || './personalar.md', PLAN = process.env.PLAN || './PLAN.md';
const SURE = Number(process.env.PERSONA_SURE || 300); // kart denemesi başına saniye
const ILK = Number(process.env.PERSONA_ILK || 60);    // sessiz model erken atla: ilk çıktı bekleme süresi (saniye)

if (!existsSync(SORU)) hata(`soru dosyası yok: ${SORU}`);
if (!existsSync(PERSONALAR)) hata(`personalar dosyası yok: ${PERSONALAR}`);
const pmetin = readFileSync(PERSONALAR, 'utf8').split(/\r?\n/);

// başlık bloğu: "## <bölüm>" altındaki "### <başlık>" satırından sonraki ### ya da ## başlığına kadar; onek: başlık önekle eşleşir
function blok(b, k, onek = false) {
  const c = []; let bol = false, on = false;
  for (const l of pmetin) {
    if (l.startsWith('## ')) { bol = l.slice(3) === b; on = false; continue; }
    if (l.startsWith('### ')) { const h = l.slice(4); on = bol && (onek ? h.startsWith(k) : h === k); if (on) c.push(l); continue; }
    if (on) c.push(l);
  }
  return kirp(c.join('\n'));
}

if (!pmetin.includes(`## Alan: ${ALAN}`)) hata(`alan yok: ${ALAN}`);
for (const k of KARTLAR) if (!blok(`Alan: ${ALAN}`, k)) hata(`'${ALAN}' alanında kart yok: ${k}`);
const ORTAK = `${blok('Ortak', 'Çıktı biçimi', true)}\n\n${blok('Ortak', 'Ayırt edicilik şartı', true)}`;

let MODELLER;
if (process.env.PERSONA_MODELLER) MODELLER = modelListesi(process.env.PERSONA_MODELLER);
else { const p = oku(PLAN); MODELLER = modelListesi(planSatiri(p, 'Görev persona') || planSatiri(p, 'Modeller') || ''); }
MODELLER = MODELLER.filter((m) => !m.startsWith('cursor/')); // cursor/* OpenCode'da koşamaz
if (!MODELLER.length) hata("model yok: PLAN'da Modeller satırı ya da PERSONA_MODELLER gerekli");

// çıktı dizini: aynı saniyede ikinci tur -2, -3… alır (mkdir atomik)
mkdirSync('persona-tur', { recursive: true });
const s2 = (x) => String(x).padStart(2, '0'), t = new Date();
const BAS = `persona-tur/${t.getFullYear()}${s2(t.getMonth() + 1)}${s2(t.getDate())}-${s2(t.getHours())}${s2(t.getMinutes())}${s2(t.getSeconds())}`;
let D = BAS;
for (let s = 2; ; s++) { try { mkdirSync(D); break; } catch { D = `${BAS}-${s}`; } }

const ad = (x) => x.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
const SORU_METNI = kirp(readFileSync(SORU, 'utf8'));

// token: oturum kimliğiyle opencode.db'den (v2 son adımda step_finish yazmaz); kayıt yoksa step_finish toplamı
let SQLITE = null; try { SQLITE = (await import('node:sqlite')).DatabaseSync; } catch {}
const top = (k) => k.total ?? ((k.input || 0) + (k.output || 0) + (k.reasoning || 0) + (k.cache?.read || 0) + (k.cache?.write || 0));
function tokenSay(log) {
  let tt = 0, d = 0; const ids = new Set();
  for (const l of oku(log).split('\n')) { try { const x = JSON.parse(l); if (x.sessionID) ids.add(x.sessionID); if (x.type === 'step_finish') tt += top(x.part.tokens || {}); } catch {} }
  try {
    const db = new SQLITE(process.env.OPENCODE_DB || join(homedir(), '.local/share/opencode/opencode.db'), { readOnly: true });
    const q = db.prepare('select data from session_message where session_id=? and type=?');
    for (const id of ids) for (const r of q.all(id, 'assistant')) { const k = JSON.parse(r.data).tokens; if (k) d += top(k); }
    db.close();
  } catch {}
  return d || tt;
}

async function kartKos(i) {
  const kart = KARTLAR[i], n = MODELLER.length, f = `${D}/${i + 1}-${ad(kart)}`;
  const istem = `Sen şu personasın:\n${blok(`Alan: ${ALAN}`, kart)}\n\n${ORTAK}\n\nProblem:\n${SORU_METNI}\n\nKod ya da dosya değiştirme; yalnız yukarıdaki biçimde yanıt ver.`;
  let m, durum, metin = '';
  for (const j of [0, 1]) { // geçersiz yanıtta sıradaki modelle bir kez daha
    m = MODELLER[(i + j) % n]; durum = '';
    const log = `${f}.deneme`;
    const r = await kos({ komut: OC, args: ['run', '--agent', 'plan', '-m', m, '--title', `persona-${ALAN}`, '--format', 'json', istem],
      env: { ...process.env, OPENCODE_LOG_LEVEL: 'error' }, log, ilk: ILK, sure: SURE, poll: 1000 });
    if (r.neden) { durum = r.neden === 'yanit_yok' ? 'sessiz' : 'sure'; oturumKapat(OC, log, null); }
    metin = kirp(metinAyikla(log));
    appendFileSync(`${f}.jsonl`, oku(log)); appendFileSync(`${f}.err`, oku(`${log}.err`)); // ham olaylar: iki deneme de kalır
    rmSync(log, { force: true }); rmSync(`${log}.err`, { force: true });
    if (!durum) durum = metin.includes('Seçenek A') ? 'gecerli' : 'gecersiz';
    if (durum === 'gecerli') break;
  }
  writeFileSync(`${f}.md`, `# ${kart}\n\nModel: ${m}\nToken: ${tokenSay(`${f}.jsonl`)}\nDurum: ${durum}\n\n${metin}\n`);
}

await Promise.all(KARTLAR.map((_, i) => kartKos(i)));

// özet
let gecerli = 0, satirlar = '', metinler = '';
KARTLAR.forEach((kart, i) => {
  const md = readFileSync(`${D}/${i + 1}-${ad(kart)}.md`, 'utf8');
  const al = (k) => (md.match(new RegExp(`^${k}: (.*)$`, 'm')) || [])[1] || '';
  const du = al('Durum');
  satirlar += `- ${kart} · ${al('Model')} · ${du} · ${al('Token')} token\n`;
  if (du === 'gecerli') { gecerli++; metinler += `\n## ${kart}\n\n${kirp(md.split('\n').slice(6).join('\n'))}\n`; }
});
writeFileSync(`${D}/ozet.md`, `# Persona turu\n\nAlan: ${ALAN}\n\nSoru:\n${SORU_METNI}\n\n${satirlar}${metinler}`);
console.log(D);
process.exit(gecerli >= (KARTLAR.length === 1 ? 1 : 2) ? 0 : 1);
