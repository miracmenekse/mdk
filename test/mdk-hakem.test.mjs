// mdk-hakem.mjs testi: hakemAyristir doğrudan + sahte opencode ile geçici git deposunda, ağsız.
import { KOK, commit, denetci, depo, existsSync, gecici, join, kos, oku, stub, writeFileSync } from './yardim.mjs';
import { hakemAyristir } from '../mdk-hakem.mjs';

const RUNNER = join(KOK, 'mdk-hakem.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-hakem.test');
let T, R, SON;

function planMetni(hakemSatiri, incelemeSatiri, kabulSatiri) {
  const satirlar = ['Yürütücü: opencode', 'Modeller: m/a'];
  if (hakemSatiri) satirlar.push(hakemSatiri);
  if (incelemeSatiri) satirlar.push(incelemeSatiri);
  satirlar.push('', '## K', '- [x] 1. İş', '  - Ne: NE-ISARET');
  if (kabulSatiri) satirlar.push('  ' + kabulSatiri);
  satirlar.push('  - Kapı: `node t.test.mjs`');
  return satirlar.join('\n') + '\n';
}

function setup(y1, y2, opts = {}) {
  T = gecici(); R = join(T, 'proje');
  writeFileSync(join(T, 'y1'), y1); writeFileSync(join(T, 'y2'), y2);
  stub(T, "const f = [D + '/y1', D + '/y2']; metin(fs.readFileSync(f[(n - 1) % f.length], 'utf8'));");
  const plan = opts.plan || planMetni('Görev hakem: m/h1, m/h2', null, '- Kabul: bir; iki');
  depo({ 'PLAN.md': plan, 't.test.mjs': 'BENZERSIZ_TEST_IZI' }, { R });
  commit(R, 'ilk');
  if (opts.commit !== false) {
    writeFileSync(join(R, 'x.txt'), 'BENZERSIZ_KOD_IZI\n');
    commit(R, opts.commitMsg || 'adım 1: İş (m/yazan, deneme 1)');
  }
}

const kosu = (n = 1, ek = []) => (SON = kos(RUNNER, [String(n), ...ek], { cwd: R, env: { STUB_DIR: T, MDK_OPENCODE: join(T, 'opencode.mjs'), POLL: '1' } }));
const k = (c, m) => kontrol(c, m, SON?.cikti);
const modeller = () => (existsSync(join(T, 'modeller.log')) ? oku(join(T, 'modeller.log')).trim().split('\n').filter(Boolean) : []);
const hakemDosya = () => join(R, 'hakem.jsonl');

// A: hakemAyristir doğrudan
vaka('A1 temel geçmedi');
const a1 = hakemAyristir('ÖLÇÜT 1: GEÇTİ - tamam\nÖLÇÜT 2: GEÇMEDİ - eksik\nHÜKÜM: GEÇTİ', 2);
k(a1?.hukum === 'gecmedi', 'hüküm gecmedi');
k(Array.isArray(a1?.olcutler) && a1.olcutler.length === 2, 'iki ölçüt');
k(a1?.olcutler?.[0]?.sonuc === 'gecti' && a1?.olcutler?.[0]?.gerekce === 'tamam', 'ölçüt 1');
k(a1?.olcutler?.[1]?.sonuc === 'gecmedi' && a1?.olcutler?.[1]?.gerekce === 'eksik', 'ölçüt 2');

vaka('A2 süs ve harfsiz');
const a2 = hakemAyristir('Önce düşüneyim.\n**OLCUT 1**: gecti — iyi\n- Ölçüt 2: Geçti: iyi\n', 2);
k(a2?.hukum === 'gecti', 'hüküm gecti');
k(a2?.olcutler?.every((o) => o.sonuc === 'gecti') === true, 'tümü gecti');
k(a2?.olcutler?.every((o) => o.gerekce === 'iyi') === true, 'gerekçeler');

vaka('A3 eksik ölçüt');
k(hakemAyristir('ÖLÇÜT 1: GEÇTİ - a', 3) === null, 'null');

vaka('A4 HÜKÜM kullanılır');
const a4 = hakemAyristir('ÖLÇÜT 1: GEÇTİ - a\nHUKUM: GECMEDI', 3);
k(a4?.hukum === 'gecmedi', 'hüküm gecmedi');
k(a4?.olcutler?.length === 1 && a4?.olcutler?.[0]?.gerekce === 'a', 'tek ölçüt');

vaka('A5 bozuk metin');
k(hakemAyristir('merhaba', 2) === null, 'merhaba null');
k(hakemAyristir('', 2) === null, 'boş null');
k(hakemAyristir('merhaba', 1) === null, 'merhaba 1 null');
k(hakemAyristir('', 1) === null, 'boş 1 null');

vaka('A6 aynı ölçüt sonuncusu');
const a6 = hakemAyristir('ÖLÇÜT 1: GEÇMEDİ - ilk\nÖLÇÜT 1: GEÇTİ - son', 1);
k(a6?.hukum === 'gecti', 'hüküm gecti');
k(a6?.olcutler?.[0]?.sonuc === 'gecti' && a6?.olcutler?.[0]?.gerekce === 'son', 'sonuncusu');

// B: betik
vaka('B7 yeşil');
setup('ÖLÇÜT 1: GEÇTİ - a\nÖLÇÜT 2: GEÇTİ - b\nHÜKÜM: GEÇTİ', 'x');
kosu(1);
k(SON.kod === 0, 'çıkış 0');
const satirlar7 = oku(hakemDosya()).trim().split('\n').filter(Boolean);
k(satirlar7.length === 1, 'tek satır');
const j7 = JSON.parse(satirlar7[0]);
k(j7.adim === 1 && j7.hukum === 'gecti' && j7.model === 'm/h1' && j7.yazan === 'm/yazan', 'kayıt');
k(Array.isArray(j7.olcutler) && j7.olcutler[1]?.metin === 'iki', 'ölçüt 2 metin');
const istem7 = oku(join(T, 'istem-1.txt'));
k(istem7.includes('bir') && istem7.includes('iki') && istem7.includes('BENZERSIZ_TEST_IZI') && istem7.includes('BENZERSIZ_KOD_IZI'), 'istem içeriği');
k(SON.cikti.includes('HÜKÜM: GEÇTİ'), 'çıktı');

vaka('B8 yedek model');
setup('anlamadım', 'ÖLÇÜT 1: GEÇMEDİ - z\nÖLÇÜT 2: GEÇMEDİ - t\nHÜKÜM: GEÇMEDİ');
kosu(1);
k(SON.kod === 0, 'çıkış 0');
k(modeller().join(',') === 'm/h1,m/h2', 'iki model');
const j8 = JSON.parse(oku(hakemDosya()).trim().split('\n').filter(Boolean).pop());
k(j8.model === 'm/h2' && j8.hukum === 'gecmedi', 'yedek kayıt');

vaka('B9 iki model bozuk');
setup('anlamadım', 'olmaz');
kosu(1);
k(SON.kod === 2, 'çıkış 2');
k(!existsSync(hakemDosya()), 'hakem.jsonl yok');

vaka('B10 model filtresi');
setup('ÖLÇÜT 1: GEÇTİ - a\nÖLÇÜT 2: GEÇTİ - b\nHÜKÜM: GEÇTİ', 'x', { plan: planMetni('Görev hakem: m/yazan, m/h2', null, '- Kabul: bir; iki') });
kosu(1);
k(modeller().join(',') === 'm/h2', 'yalnız m/h2');
setup('ÖLÇÜT 1: GEÇTİ - a\nÖLÇÜT 2: GEÇTİ - b\nHÜKÜM: GEÇTİ', 'x', { plan: planMetni('Görev hakem: m/yazan', null, '- Kabul: bir; iki') });
kosu(1);
k(modeller().join(',') === 'm/yazan', 'm/yazan çağrıldı');
const j10 = JSON.parse(oku(hakemDosya()).trim().split('\n').filter(Boolean).pop());
k(j10.ayniModel === true, 'ayniModel true');

vaka('B11 model kaynağı');
setup('ÖLÇÜT 1: GEÇTİ - a\nÖLÇÜT 2: GEÇTİ - b\nHÜKÜM: GEÇTİ', 'x', { plan: planMetni(null, 'Görev inceleme: m/i', '- Kabul: bir; iki') });
kosu(1);
k(modeller().join(',') === 'm/i', 'inceleme modeli');
setup('ÖLÇÜT 1: GEÇTİ - a\nÖLÇÜT 2: GEÇTİ - b\nHÜKÜM: GEÇTİ', 'x', { plan: planMetni(null, null, '- Kabul: bir; iki') });
kosu(1);
k(SON.kod === 4, 'çıkış 4');
k(!existsSync(join(T, 'modeller.log')), 'model çağrılmadı');

vaka('B12 ön koşul');
setup('ÖLÇÜT 1: GEÇTİ - a\nÖLÇÜT 2: GEÇTİ - b\nHÜKÜM: GEÇTİ', 'x', { plan: planMetni('Görev hakem: m/h1, m/h2', null, null) });
kosu(1);
k(SON.kod === 4, 'Kabul yok çıkış 4');
k(!existsSync(join(T, 'modeller.log')), 'Kabul yok model yok');
setup('ÖLÇÜT 1: GEÇTİ - a\nÖLÇÜT 2: GEÇTİ - b\nHÜKÜM: GEÇTİ', 'x', { commit: false });
kosu(1);
k(SON.kod === 4, 'commit yok çıkış 4');
k(!existsSync(join(T, 'modeller.log')), 'commit yok model yok');

bitir();
