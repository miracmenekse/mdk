// Persona takımı (persona/takim.json) ile bir özellik/problem hakkında reasoning turu.
// Her persona ayrı opencode oturumunda kendi merceğiyle görüş yazar; çıktı persona-tur/<zaman>/ozet.md
// (drawer'daki personaBalonlarHtml bunu `## <ad>` bloklarından balonlara çevirir).
// Kullanım: node persona-takim-tur.mjs <soru-dosyası> [model]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const soruDosya = process.argv[2];
const model = process.argv[3] || 'opencode-go/glm-5.3-flash';
const OC = process.env.MDK_OPENCODE || `${process.env.HOME}/.local/opt/opencode-v2/node_modules/.bin/opencode`;
if (!soruDosya) { console.error('kullanım: node persona-takim-tur.mjs <soru-dosyası> [model]'); process.exit(2); }

const soru = readFileSync(soruDosya, 'utf8').trim();
const takim = JSON.parse(readFileSync('persona/takim.json', 'utf8'));
const personalar = takim.personalar || [];
if (personalar.length === 0) { console.error('takımda persona yok'); process.exit(1); }

const zaman = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const dizin = join('persona-tur', zaman);
mkdirSync(dizin, { recursive: true });

const metinCek = (cikti) => {
  let m = '';
  for (const l of cikti.split('\n')) { try { const x = JSON.parse(l); if (x.type === 'text') m += x.part.text; } catch {} }
  return m.trim();
};

let ozet = `# Persona turu (takım)\n\nSoru:\n${soru}\n`;
for (const p of personalar) {
  const istem = `Sen "${p.ad}" personasısın. Optimize ettiğin: ${p.optimize}. Körlüğün (bilerek göz ardı et): ${p.korluk}. Sorduğun mercek sorusu: ${p.soru}\n\n` +
    `Aşağıdaki özellik/problem hakkında KENDİ merceğinle kısa (3-4 cümle) görüşünü yaz: en az bir somut öneri ve bir risk belirt. Kod ya da dosya değiştirme, yalnız görüşünü yaz.\n\nProblem:\n${soru}`;
  const r = spawnSync(OC, ['run', '-m', model, '--format', 'json', '--title', 'persona-takim', istem], {
    encoding: 'utf8', input: '', timeout: 180000, maxBuffer: 50 * 1024 * 1024,
    env: { ...process.env, OPENCODE_LOG_LEVEL: 'error' },
  });
  const metin = metinCek(r.stdout || '') || '(yanıt alınamadı)';
  console.log(`${p.ad}: ${metin.length} karakter`);
  ozet += `\n## ${p.ad}\n\n${metin}\n`;
}
writeFileSync(join(dizin, 'ozet.md'), ozet);
console.log(dizin);
