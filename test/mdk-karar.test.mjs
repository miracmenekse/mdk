// mdk-karar.mjs kapı testi: A saf ayrıştırıcı (kararAyristir), B betik (sahte opencode, geçici kök), C uyandırıcı kancası.
// Ağsız; geçici dizinler kullanır, arka plan süreç bırakmaz.
import { KOK, denetci, existsSync, gecici, join, kos, oku, satirlar, stub, writeFileSync, mkdirSync } from './yardim.mjs';
import { kararEkle } from '../panel/karar.mjs';

const d = denetci('mdk-karar.test');
const BETIK = join(KOK, 'mdk-karar.mjs');
const UYANDIR = join(KOK, 'mdk-uyandir.mjs');

// modül yoksa içe aktarma başarısız olur; testler yine tek tek kırmızı raporlanır
const mod = await import('../mdk-karar.mjs').catch(() => null);
const kararAyristir = mod?.kararAyristir;
const A = (metin, secenekler) => (kararAyristir ? kararAyristir(metin, secenekler) : undefined);
const BAS = ['kapi_yanlis', 'model_zayif', 'plan_belirsiz', 'ortam'];
const YOR = ['onay', 'red', 'soru', 'degisiklik'];

// çıktının son JSON satırı (stderr karışsa bile)
const jsonSatir = (cikti) => {
  const s = String(cikti || '').split('\n').filter((l) => l.trim().startsWith('{'));
  if (!s.length) return null;
  try { return JSON.parse(s[s.length - 1]); } catch { return null; }
};

// ---- A: kararAyristir (saf) ----
d.vaka('A1 SEÇİM ve GEREKÇE ayrıştırılır');
let s = A('düşündüm\nSEÇİM: kapi_yanlis\nGEREKÇE: test yanlış dosyayı arıyor', BAS);
d.kontrol(s?.secim === 'kapi_yanlis' && s?.gerekce === 'test yanlış dosyayı arıyor', 'kapi_yanlis / gerekçe bekleniyordu', JSON.stringify(s));

d.vaka('A2 süslü biçim ve büyük-küçük harf kabul edilir, gerekçe yoksa boş');
s = A('**secim**: Onay', YOR);
d.kontrol(s?.secim === 'onay' && s?.gerekce === '', 'onay / boş gerekçe bekleniyordu', JSON.stringify(s));

d.vaka('A2b büyük harfli değer (ı sorunu olmadan) eşleşir');
s = A('SEÇİM: PLAN_BELIRSIZ\nSECIM: MODEL_ZAYIF', BAS);
d.kontrol(s?.secim === 'model_zayif', 'son SECIM satırı MODEL_ZAYIF → model_zayif bekleniyordu', JSON.stringify(s));
s = A('SEÇİM: PLAN_BELIRSIZ', BAS);
d.kontrol(s?.secim === 'plan_belirsiz', 'PLAN_BELIRSIZ → plan_belirsiz bekleniyordu', JSON.stringify(s));

d.vaka('A3 listede olmayan seçenek ve boş metin null');
d.kontrol(A('SEÇİM: belki', BAS) === null, 'listede olmayan seçenek null olmalı');
d.kontrol(A('', BAS) === null, 'boş metin null olmalı');

// ---- B: betik (sahte opencode) ----
const PLAN_KARAR = '# Plan\n\nGörev karar: m/k1, m/k2\n\n## Epic 1 — A\n- [ ] 1. x\n';

// geçici kök: PLAN, girdi (BENZERSIZ_GIRDI içerir) ve sahte opencode; govde sahte modelin davranışı
function kur(plan, govde) {
  const R = gecici('karar-');
  const D = join(R, 'stub');
  writeFileSync(join(R, 'PLAN.md'), plan);
  writeFileSync(join(R, 'g.txt'), 'girdi BENZERSIZ_GIRDI\n');
  stub(D, govde);
  return { R, D };
}
const calistir = (R, D, tur = 'basarisizlik', girdi = 'g.txt') =>
  kos(BETIK, [tur, girdi], { cwd: R, env: { MDK_OPENCODE: join(D, 'opencode.mjs'), STUB_DIR: D } });
const modellerLog = (D) => (existsSync(join(D, 'modeller.log')) ? oku(join(D, 'modeller.log')).trim().split('\n').filter(Boolean) : []);

d.vaka('B4 düzgün yanıt: karar ve model JSON olarak basılır, kararmodel.jsonl tek satır');
{
  const { R, D } = kur(PLAN_KARAR, "metin('SEÇİM: plan_belirsiz\\nGEREKÇE: x');");
  const r = calistir(R, D);
  const j = jsonSatir(r.cikti);
  d.kontrol(r.kod === 0, `çıkış 0 beklendi: ${r.kod}`, r.cikti);
  d.kontrol(j?.secim === 'plan_belirsiz' && j?.model === 'm/k1' && j?.varsayilan === false, 'JSON secim/model/varsayilan bekleniyordu', r.cikti);
  const istem = oku(join(D, 'istem-1.txt'));
  d.kontrol(istem.includes('BENZERSIZ_GIRDI'), 'istem girdi dosyasının içeriğini taşımıyor', istem);
  d.kontrol(istem.includes('kapi_yanlis'), 'istem seçenek listesini taşımıyor', istem);
  d.kontrol(satirlar(join(R, 'kararmodel.jsonl')).length === 1, 'kararmodel.jsonl tek satır olmalı');
}

d.vaka('B5 ilk model bozuk yanıt verirse sıradaki modele geçilir');
{
  const { R, D } = kur(PLAN_KARAR, "metin(n === 1 ? 'bilmem' : 'SEÇİM: ortam\\nGEREKÇE: y');");
  const r = calistir(R, D);
  const j = jsonSatir(r.cikti);
  d.kontrol(r.kod === 0 && j?.model === 'm/k2' && j?.secim === 'ortam', 'm/k2 ve secim ortam bekleniyordu', r.cikti);
}

d.vaka('B6 tüm modeller bozuk → güvenli varsayılan, çıkış 0');
{
  const { R, D } = kur(PLAN_KARAR, "metin('bilmem');");
  const r = calistir(R, D);
  const j = jsonSatir(r.cikti);
  d.kontrol(r.kod === 0 && j?.secim === 'model_zayif' && j?.varsayilan === true, 'model_zayif / varsayilan true bekleniyordu', r.cikti);
  d.kontrol(j?.model === null, 'varsayılanda model null olmalı', r.cikti);
}

d.vaka('B7a PLAN\'da Görev karar yok, Görev hakem var → hakem modeli kullanılır');
{
  const { R, D } = kur('# Plan\n\nGörev hakem: m/h\n\n## Epic 1 — A\n- [ ] 1. x\n', "metin('SEÇİM: ortam\\nGEREKÇE: y');");
  const r = calistir(R, D);
  const j = jsonSatir(r.cikti);
  d.kontrol(modellerLog(D).includes('m/h') && j?.model === 'm/h', 'm/h çağrılmalıydı', r.cikti);
}

d.vaka('B7b iki satır da yok → model çağrılmaz, varsayılan kullanılır');
{
  const { R, D } = kur('# Plan\n\n## Epic 1 — A\n- [ ] 1. x\n', "metin('SEÇİM: ortam');");
  const r = calistir(R, D);
  const j = jsonSatir(r.cikti);
  d.kontrol(modellerLog(D).length === 0, 'model çağrılmamalıydı', modellerLog(D).join(','));
  d.kontrol(r.kod === 0 && j?.varsayilan === true, 'varsayilan true bekleniyordu', r.cikti);
}

d.vaka('B8a bilinmeyen tür → çıkış 2');
{
  const { R, D } = kur(PLAN_KARAR, "metin('SEÇİM: ortam');");
  const r = calistir(R, D, 'xyz');
  d.kontrol(r.kod === 2, `çıkış 2 beklendi: ${r.kod}`, r.cikti);
}

d.vaka('B8b girdi dosyası yok → çıkış 2');
{
  const { R, D } = kur(PLAN_KARAR, "metin('SEÇİM: ortam');");
  const r = calistir(R, D, 'basarisizlik', 'yok.txt');
  d.kontrol(r.kod === 2, `çıkış 2 beklendi: ${r.kod}`, r.cikti);
}

// ---- C: uyandırıcı kancası (yorum → mdk-karar yorum → istem eki) ----
d.vaka('C9 adım yorumu sınıflanır ve istemin sonuna eklenir');
{
  const T = gecici('karar-uyandir-');
  const D = join(T, 'stub');
  const YUR = join(T, 'yurutuculer.json');
  const CAGRI = join(T, 'cagri.log');
  const SAHTE_ANA = join(T, 'sahte-ana.mjs');
  mkdirSync(join(T, 'etki'), { recursive: true });
  mkdirSync(join(T, '.mdk-log'), { recursive: true });
  writeFileSync(YUR, JSON.stringify({ varsayilan: 'claude', liste: [{ ad: 'claude', baslik: 'Claude', planlayici: ['claude', '-p', '{istem}'] }] }));
  writeFileSync(SAHTE_ANA, `import fs from 'node:fs';\nfs.appendFileSync(${JSON.stringify(CAGRI)}, JSON.stringify(process.argv.slice(2)) + '\\n');\n`);
  writeFileSync(join(T, 'PLAN.md'), '# Plan\n\nGörev karar: m/k1\n\n## Epic 4 — B\n- [ ] 8. y\n  - Ne: `b.mjs`\n');
  stub(D, "metin('SEÇİM: degisiklik\\nGEREKÇE: renk istendi');");
  kararEkle(T, { no: 8, tur: 'yorum', metin: 'rengi değiştir' }, 1000);

  const r = kos(UYANDIR, [T, '--bir-kez'], {
    env: { MDK_YURUTUCULER: YUR, MDK_UYANDIR_KOMUT: SAHTE_ANA, MDK_OPENCODE: join(D, 'opencode.mjs'), STUB_DIR: D },
  });
  d.kontrol(r.kod === 0, `uyandır çıkış 0 beklendi: ${r.kod}`, r.cikti);
  const cagri = satirlar(CAGRI).map((l) => JSON.parse(l));
  d.kontrol(cagri.length === 1, `tek çağrı beklendi: ${cagri.length}`, r.cikti);
  const istem = cagri[0] ? String(cagri[0][1]) : '';
  d.kontrol(istem.includes('degisiklik'), 'istem sınıflandırmayı ("degisiklik") taşımıyor', istem);
  d.kontrol(istem.includes('adım 8 yorum: rengi değiştir'), 'istem karar satırını taşımıyor', istem);
  d.kontrol(existsSync(join(T, 'kararmodel.jsonl')), 'kararmodel.jsonl yazılmadı', r.cikti);
}

d.bitir();
