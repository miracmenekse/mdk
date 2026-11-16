// Epic (<no>) için personaların üç turlu tartışması: Değerlendirme → Tartışma → Uzlaşı.
// Her persona kendi opencode oturumunda görüşür; çıktı epic/<no>/tartisma.json'a yazılır
// ve her yanıttan sonra güncellenir. Kullanım:
//   node epic-tartis.mjs <no> [--persona "Ad1,Ad2"] [--neden "<metin>"]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { ocSec } from './oc-sec.mjs';

const arglar = process.argv.slice(2);
const no = arglar[0];
let personaFiltre = null;
let neden = '';
for (let i = 1; i < arglar.length; i++) {
  if (arglar[i] === '--persona') personaFiltre = (arglar[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
  else if (arglar[i] === '--neden') neden = arglar[++i] || '';
}

const OC = ocSec();
const sure = (parseInt(process.env.EPIC_SURE, 10) || 240) * 1000;
let modeller = [];
let ciktiYolu = '';

const cik2 = (ileti) => { console.error(ileti); return 2; };

const metinCek = (cikti) => {
  let m = '';
  for (const l of cikti.split('\n')) { try { const x = JSON.parse(l); if (x.type === 'text') m += x.part.text; } catch {} }
  return m.trim();
};

// Tek opencode çağrısı; süre aşılırsa süreç öldürülür, stdin kapalı.
const calistir = (model, istem) => new Promise((coz) => {
  const p = spawn(OC, ['run', '-m', model, '--format', 'json', '--title', `epic-${no}`, istem], {
    env: { ...process.env, OPENCODE_LOG_LEVEL: 'error' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let cikti = '';
  p.stdout.on('data', (d) => { cikti += d; });
  p.stderr.on('data', () => {});
  const zaman = setTimeout(() => p.kill(), sure);
  p.on('close', () => { clearTimeout(zaman); coz(cikti); });
  p.on('error', () => { clearTimeout(zaman); coz(cikti); });
});

// Bir çağrı: model sırası sira'ya göre döndürülür; boş yanıtta sıradaki modelle bir kez daha denenir.
async function cagir(istem, sira) {
  for (const kayma of [0, 1]) {
    const model = modeller[(sira + kayma) % modeller.length];
    const metin = metinCek(await calistir(model, istem));
    if (metin) return { model, metin };
  }
  return { model: '', metin: '' };
}

async function ana() {
  if (!no) return cik2('kullanım: node epic-tartis.mjs <no> [--persona "Ad1,Ad2"] [--neden "<metin>"]');
  const isYolu = join('epic', no, 'is.md');
  if (!existsSync(isYolu)) return cik2(`epic/${no}/is.md yok`);
  const is = readFileSync(isYolu, 'utf8').trim();

  let personalar = [];
  try { personalar = JSON.parse(readFileSync('persona/takim.json', 'utf8')).personalar || []; } catch {}
  if (personaFiltre) personalar = personalar.filter((p) => personaFiltre.includes(p.ad));
  if (!personalar.length) return cik2('persona/takim.json personalar listesi boş ya da --persona ile hiçbir ad eşleşmedi');

  // Modeller: PLAN.md'deki "Görev persona:" (yoksa "Modeller:") satırı, virgülle ayrılmış.
  try {
    const plan = readFileSync('PLAN.md', 'utf8');
    const satir = (etiket) => {
      // yalnız satır başındaki ilk eşleşme: adım metinlerinde geçen aynı etiket ayar satırı değildir
      const s = plan.split(/\r?\n/).find((x) => x.startsWith(etiket));
      return s ? s.slice(etiket.length) : '';
    };
    modeller = (satir('Görev persona:') || satir('Modeller:')).split(',').map((s) => s.trim()).filter(Boolean);
  } catch {}
  if (!modeller.length) return cik2("PLAN.md'de 'Görev persona:' ya da 'Modeller:' satırı yok");

  // Çıktı dosyası: her yanıttan sonra yeniden yazılır; durum başta 'suruyor'.
  ciktiYolu = join('epic', no, 'tartisma.json');
  mkdirSync(join('epic', no), { recursive: true });
  const sonuc = { epic: no, is, neden, durum: 'suruyor', personalar: personalar.map((p) => ({ ad: p.ad })), turlar: [], cozum: null, ts: '' };
  const yaz = () => { sonuc.ts = new Date().toISOString(); writeFileSync(ciktiYolu, JSON.stringify(sonuc, null, 2) + '\n'); };
  yaz();

  // Tur 1: Değerlendirme — bağımsız ilk görüş; işi YALNIZ kendi merceğiyle değerlendirir.
  const tur1Istem = (p) => `Sen "${p.ad}" personasısın. Optimize ettiğin: ${p.optimize}. Körlüğün (bilerek göz ardı et): ${p.korluk}. Sorduğun mercek sorusu: ${p.soru}\n\n` +
    `Bağımsız ilk görüş: diğer personaların kim olduğunu ya da ne diyeceğini varsayma; yalnız kendi merceğinle yaz.\n\n` +
    `Aşağıdaki işi YALNIZ kendi merceğinle değerlendir: etki, gereksinim, endişe. En çok 120 kelime. Kod ya da dosya değiştirme, yalnız değerlendirmeni yaz.\n\nİş:\n${is}`;
  const tur1 = [];
  for (let i = 0; i < personalar.length; i++) {
    const p = personalar[i];
    const r = await cagir(tur1Istem(p), i);
    tur1.push({ p, i, ...r });
  }
  const gecerli = tur1.filter((r) => r.metin);
  sonuc.turlar.push({ tur: 1, ad: 'Değerlendirme', mesajlar: gecerli.map((r) => ({ persona: r.p.ad, model: r.model, metin: r.metin })) });
  yaz();
  if (gecerli.length < 2) { sonuc.durum = 'yetersiz'; yaz(); console.log(ciktiYolu); return 1; }

  // Tur 2: Tartışma — ardışık yanıt turu; senden önceki yanıtlar eklenir.
  const tur1Bloklar = gecerli.map((r) => `${r.p.ad}:\n${r.metin}`).join('\n\n');
  const tur2Istem = (r, oncekiler) => {
    let istem = `Sen "${r.p.ad}" personasısın. Tur 1 (Değerlendirme) metinleri:\n\n${tur1Bloklar}`;
    if (oncekiler.length > 0) {
      istem += `\n\nTur 2 (Tartışma — senden önceki yanıtlar):\n\n${oncekiler.map((m) => `${m.persona}: ${m.metin}`).join('\n\n')}`;
    }
    istem += `\n\nkatıldığın, itiraz ettiğin ve fikrini değiştirdiğin noktayı yaz. En çok 120 kelime. Kod ya da dosya değiştirme, yalnız metnini yaz.`;
    return istem;
  };
  const tur2Mesajlar = [];
  sonuc.turlar = [sonuc.turlar[0], { tur: 2, ad: 'Tartışma', mesajlar: [] }];
  yaz();
  for (const r of gecerli) {
    const x = await cagir(tur2Istem(r, tur2Mesajlar), r.i);
    if (x.metin) {
      tur2Mesajlar.push({ persona: r.p.ad, model: x.model, metin: x.metin });
      sonuc.turlar = [sonuc.turlar[0], { tur: 2, ad: 'Tartışma', mesajlar: [...tur2Mesajlar] }];
      yaz();
    }
  }

  // Tur 3: Uzlaşı — tek çağrı; tarafsız moderatör yanıtı belli başlıklarla verir.
  const turBloklari = sonuc.turlar.map((t) => `## Tur ${t.tur} (${t.ad})\n\n${t.mesajlar.map((m) => `${m.persona}: ${m.metin}`).join('\n\n')}`).join('\n\n');
  const tur3Istem = `Tarafsız moderatörsün; iş ve iki turun tüm metinleri aşağıda. Ortak uzlaşı metni yaz; yanıtın TAM ŞU başlıkları bu sırayla içersin:\n` +
    `## Çözüm\n## UI/UX etkisi\n## Entegrasyon\n## Anlaşmazlıklar ve açık sorular\n## Tahmini story listesi\n\n` +
    `Görüş ayrılıklarını ve kimlerin hangi noktada ayrıştığını persona adlarıyla (${gecerli.map((r) => r.p.ad).join(', ')}) açıkça an.\n\nİş:\n${is}\n\n${turBloklari}`;
  const tur3 = await cagir(tur3Istem, personalar.length);
  if (!tur3.metin) { sonuc.durum = 'yetersiz'; yaz(); console.log(ciktiYolu); return 1; }
  sonuc.cozum = { model: tur3.model, metin: tur3.metin };
  sonuc.durum = 'bitti';
  yaz();
  console.log(ciktiYolu);
  return 0;
}

process.exitCode = await ana();
