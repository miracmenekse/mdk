// Epic (<no>) için personaların üç turlu tartışması: Değerlendirme → Tartışma → Uzlaşı.
// Her persona kendi opencode oturumunda görüşür; çıktı epic/<no>/tartisma.json'a yazılır
// ve her yanıttan sonra güncellenir. Kullanım:
//   node epic-tartis.mjs <no> [--persona "Ad1,Ad2"] [--neden "<metin>"]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { ocSec } from './oc-sec.mjs';
import { parse } from './panel/plan.mjs';

const arglar = process.argv.slice(2);
const no = arglar[0];
let personaFiltre = null;
let neden = '';
let odakArg = null;
for (let i = 1; i < arglar.length; i++) {
  if (arglar[i] === '--persona') personaFiltre = (arglar[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
  else if (arglar[i] === '--neden') neden = arglar[++i] || '';
  else if (arglar[i] === '--odak') odakArg = arglar[++i] || '';
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

// Tek çağrı; süre aşılırsa süreç öldürülür, stdin kapalı.
const calistir = (model, istem) => new Promise((coz) => {
  if (model.startsWith('agy/')) {
    const agyBin = process.env.MDK_AGY || 'agy';
    const ad = model.slice(4);
    const args = [...(ad === 'varsayilan' ? [] : ['--model', ad]), '--mode', 'plan', '--output-format', 'text', '-p', istem];
    const p = spawn(agyBin, args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let cikti = '';
    p.stdout.on('data', (d) => { cikti += d; });
    p.stderr.on('data', () => {});
    const zaman = setTimeout(() => p.kill(), sure);
    p.on('close', () => {
      clearTimeout(zaman);
      coz(JSON.stringify({ type: 'text', part: { text: cikti.trim() } }));
    });
    p.on('error', () => { clearTimeout(zaman); coz(''); });
    return;
  }
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
  let odak = odakArg;
  try {
    const plan = readFileSync('PLAN.md', 'utf8');
    const satir = (etiket) => {
      // yalnız satır başındaki ilk eşleşme: adım metinlerinde geçen aynı etiket ayar satırı değildir
      const s = plan.split(/\r?\n/).find((x) => x.startsWith(etiket));
      return s ? s.slice(etiket.length) : '';
    };
    modeller = (satir('Görev persona:') || satir('Modeller:')).split(',').map((s) => s.trim()).filter(Boolean);
    if (!odak) {
      const parsedPlan = parse(plan);
      const kat = (parsedPlan.kategoriler || []).find((k) => String(k.no) === String(no));
      if (kat?.odakPersona) odak = kat.odakPersona;
    }
  } catch {}
  if (!modeller.length) return cik2("PLAN.md'de 'Görev persona:' ya da 'Modeller:' satırı yok");

  let seciliOdak = null;
  if (odak) {
    const bulunan = personalar.find((p) => p.ad.toLowerCase() === odak.toLowerCase());
    if (bulunan) {
      seciliOdak = { ad: bulunan.ad, carpan: 3 };
    } else {
      console.warn(`UYARI: '${odak}' adında persona bulunamadı, varsayılan eşit ağırlık uygulanacak.`);
    }
  }

  // Çıktı dosyası: her yanıttan sonra yeniden yazılır; durum başta 'suruyor'.
  ciktiYolu = join('epic', no, 'tartisma.json');
  mkdirSync(join('epic', no), { recursive: true });
  const sonuc = {
    epic: no,
    is,
    neden,
    odak: seciliOdak,
    durum: 'suruyor',
    personalar: personalar.map((p) => ({ ad: p.ad })),
    turlar: [],
    cozum: null,
    ts: '',
  };
  const yaz = () => { sonuc.ts = new Date().toISOString(); writeFileSync(ciktiYolu, JSON.stringify(sonuc, null, 2) + '\n'); };
  yaz();

  // Tur 1: Değerlendirme — bağımsız ilk görüş; işi YALNIZ kendi merceğiyle değerlendirir.
  const tur1Istem = (p) => `Sen "${p.ad}" personasısın. Optimize ettiğin: ${p.optimize}. Körlüğün (bilerek göz ardı et): ${p.korluk}. Sorduğun mercek sorusu: ${p.soru}\n\n` +
    `Bağımsız ilk görüş: diğer personaların kim olduğunu ya da ne diyeceğini varsayma; yalnız kendi merceğinle yaz.\n\n` +
    `Aşağıdaki işi YALNIZ kendi merceğinle değerlendir: etki, gereksinim, endişe. En çok 120 kelime. Kod ya da dosya değiştirme, yalnız değerlendirmeni yaz.\n\nİş:\n${is}`;
  const tur1 = await Promise.all(personalar.map((p, i) => cagir(tur1Istem(p), i).then((r) => ({ p, i, ...r }))));
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
  let odakMetni = '';
  if (seciliOdak) {
    odakMetni = `\n\nÖNEMLİ (AĞIRLIKLI KARAR MOTORU): Bu iş için stratejik odak persona "${seciliOdak.ad}" olarak belirlenmiştir (çarpan: 3 kat / ×3 ağırlık).\n` +
      `Nihai "## Çözüm" ve "## Tahmini story listesi" çıktısında "${seciliOdak.ad}" personasının öneri ve önceliklerine 3 kat ağırlık vererek kazanan öneriyi belirle.\n` +
      `MUTLAK EMNİYET KURALI: Kırmızı kapı (red gate), model/kota yetersizliği ve bloklayıcı teknik riskler hiçbir ağırlıkla bastırılamaz! Bir emniyet riski varsa, odak persona ağırlığı ne olursa olsun "## Çözüm"ün en başında belirgin bir emniyet uyarısı olarak yer almalıdır.`;
  }
  const turBloklari = sonuc.turlar.map((t) => `## Tur ${t.tur} (${t.ad})\n\n${t.mesajlar.map((m) => `${m.persona}: ${m.metin}`).join('\n\n')}`).join('\n\n');
  const tur3Istem = `Tarafsız moderatörsün; iş ve iki turun tüm metinleri aşağıda. Ortak uzlaşı metni yaz; yanıtın TAM ŞU başlıkları bu sırayla içersin:\n` +
    `## Çözüm\n## UI/UX etkisi\n## Entegrasyon\n## Anlaşmazlıklar ve açık sorular\n## Tahmini story listesi\n\n` +
    `Görüş ayrılıklarını ve kimlerin hangi noktada ayrıştığını persona adlarıyla (${gecerli.map((r) => r.p.ad).join(', ')}) açıkça an.\n\nİş:\n${is}\n\n${turBloklari}${odakMetni}`;
  const tur3 = await cagir(tur3Istem, personalar.length);
  if (!tur3.metin) { sonuc.durum = 'yetersiz'; yaz(); console.log(ciktiYolu); return 1; }
  sonuc.cozum = { model: tur3.model, metin: tur3.metin };
  sonuc.durum = 'bitti';
  yaz();
  console.log(ciktiYolu);
  return 0;
}

process.exitCode = await ana();
