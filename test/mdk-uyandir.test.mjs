// Karar uyandırıcı (mdk-uyandir.mjs) kapı testi: karar → Epic'in ana yürütücüsü, tekrar yok, kilit, atlama.
// Geçici kök, geçici MDK_YURUTUCULER ve sahte MDK_UYANDIR_KOMUT kullanır; gerçek ana yürütücü çalışmaz, arka plan süreç bırakmaz (--bir-kez).
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { denetci, gecici, kos, oku, KOK, satirlar } from './yardim.mjs';
import { kararEkle } from '../panel/karar.mjs';

const d = denetci('mdk-uyandir');
const BETIK = join(KOK, 'mdk-uyandir.mjs');

const T = gecici('uyandir-');
const YUR = join(T, 'yurutuculer.json');
const CAGRI = join(T, 'cagri.log');
const STUB = join(T, 'sahte-ana.mjs');
const KILIT = join(T, '.mdk-log', 'uyandir-antigravity.kilit');
mkdirSync(join(T, 'etki'), { recursive: true });
mkdirSync(join(T, '.mdk-log'), { recursive: true });

writeFileSync(YUR, JSON.stringify({
  varsayilan: 'claude',
  liste: [
    { ad: 'claude', baslik: 'Claude', planlayici: ['claude', '-p', '{istem}'] },
    { ad: 'antigravity', baslik: 'Antigravity', planlayici: ['agy', '-p', '{istem}'] },
  ],
}));
writeFileSync(STUB, `import fs from 'node:fs';
fs.appendFileSync(${JSON.stringify(CAGRI)}, JSON.stringify(process.argv.slice(2)) + '\\n');
`);
writeFileSync(join(T, 'PLAN.md'), `# Plan

## Epic 3 — A
- Ana: antigravity
- [ ] 7. x
  - Ne: \`a.mjs:1-5\`

## Epic 4 — B
- [ ] 8. y
  - Ne: \`b.mjs\`

## Epic 5 — C
- Ana: yok
- [ ] 9. z
  - Ne: \`c.mjs\`
`);

const env = { MDK_YURUTUCULER: YUR, MDK_UYANDIR_KOMUT: STUB };
const birKez = () => kos(BETIK, [T, '--bir-kez'], { env });
const cagrilar = () => satirlar(CAGRI).map((l) => JSON.parse(l));

// (1) epic 3 onay → Epic'in ana yürütücüsü (antigravity) çağrılır, istem kararı ve kural dosyasını içerir
kararEkle(T, { epic: '3', tur: 'onay' }, 1000);
let r = birKez();
d.vaka('epic kararı ana yürütücüyü uyandırır');
d.kontrol(r.kod === 0, `çıkış 0 beklendi: ${r.kod}`, r.cikti);
d.kontrol(r.cikti.includes('uyandırıldı: antigravity ← epic 3 onay'), 'uyandırıldı satırı yok', r.cikti);
let c = cagrilar();
d.kontrol(c.length === 1, `tek çağrı beklendi: ${c.length}`);
d.kontrol(c[0] && c[0][0] === 'antigravity', `ana yürütücü antigravity değil: ${c[0] && c[0][0]}`);
d.kontrol(c[0] && c[0][1].includes('epic 3 onay'), 'istem karar satırını içermiyor', c[0] && c[0][1]);
d.kontrol(c[0] && c[0][1].includes('.mdk/planlayici.md'), 'istem kural dosyasını göstermiyor', c[0] && c[0][1]);
d.kontrol(existsSync(join(T, 'etki', '.karar-uyandi')), 'etki/.karar-uyandi yazılmadı');
d.kontrol(!existsSync(join(T, 'etki', '.karar-okundu')), 'karar-bekle işaretine dokunulmuş');
d.kontrol(!existsSync(KILIT), 'çağrı bitince kilit silinmedi');

// (2) aynı karar iki kez iletilmez
d.vaka('aynı karar tekrar iletilmez');
r = birKez();
d.kontrol(r.kod === 0, `çıkış 0 beklendi: ${r.kod}`, r.cikti);
d.kontrol(cagrilar().length === 1, 'yeni karar yokken çağrı yapıldı');

// (3) adım 8 (Ana yok → claude) ve adım 7 (Epic 3 → antigravity), ts sırasıyla
d.vaka('adım kararları kendi ana yürütücüsüne gider, sırayla');
kararEkle(T, { no: 8, tur: 'yorum', metin: 'renk koyu' }, 2000);
kararEkle(T, { no: 7, tur: 'onay' }, 3000);
r = birKez();
d.kontrol(r.kod === 0, `çıkış 0 beklendi: ${r.kod}`, r.cikti);
c = cagrilar();
d.kontrol(c.length === 3, `üç çağrı beklendi: ${c.length}`);
d.kontrol(c[1] && c[1][0] === 'claude', `adım 8 claude'a gitmeli: ${c[1] && c[1][0]}`);
d.kontrol(c[1] && c[1][1].includes('adım 8 yorum: renk koyu'), 'adım 8 istemi yanlış', c[1] && c[1][1]);
d.kontrol(c[2] && c[2][0] === 'antigravity', `adım 7 antigravity'ye gitmeli: ${c[2] && c[2][0]}`);
d.kontrol(c[2] && c[2][1].includes('adım 7 onay'), 'adım 7 istemi yanlış', c[2] && c[2][1]);

// (4a) canlı kilit (bu testin pid'i): ana yürütücü meşgulken karar beklemeli, kaybolmamalı
d.vaka('canlı kilit kararı bekletir');
writeFileSync(KILIT, String(process.pid));
kararEkle(T, { epic: '3', tur: 'red', metin: 'geri al' }, 4000);
r = birKez();
d.kontrol(r.kod === 0, `çıkış 0 beklendi: ${r.kod}`, r.cikti);
d.kontrol(cagrilar().length === 3, 'meşgul ana yürütücüye çağrı yapıldı');
unlinkSync(KILIT);
r = birKez();
c = cagrilar();
d.kontrol(c.length === 4, `kilit kalkınca bekleyen karar iletilmeli: ${c.length}`, r.cikti);
d.kontrol(c[3] && c[3][1].includes('epic 3 red: geri al'), 'bekleyen karar yanlış ya da kayıp', c[3] && c[3][1]);

// (4b) ölü pid'li bayat kilit silinir ve karar iletilir
d.vaka('bayat kilit silinir');
writeFileSync(KILIT, '999999');
kararEkle(T, { epic: '3', tur: 'onay' }, 5000);
r = birKez();
c = cagrilar();
d.kontrol(c.length === 5, `bayat kilitten sonra çağrı beklendi: ${c.length}`, r.cikti);
d.kontrol(!existsSync(KILIT), 'bayat kilit silinmedi');

// (5) Ana tanımsız (yok) → atlanır, işaret ilerler, ikinci turda tekrar basılmaz
d.vaka('tanınmayan ana yürütücü kararı atlanır');
kararEkle(T, { epic: '5', tur: 'onay' }, 6000);
r = birKez();
d.kontrol(r.kod === 0, `çıkış 0 beklendi: ${r.kod}`, r.cikti);
d.kontrol(r.cikti.includes('atlandı: epic 5 onay (tanınmayan ana yürütücü)'), 'atlandı satırı yok', r.cikti);
d.kontrol(cagrilar().length === 5, 'tanınmayan ana yürütücüye çağrı yapıldı');
r = birKez();
d.kontrol(!r.cikti.includes('atlandı'), 'atlanan karar ikinci turda yeniden basıldı', r.cikti);

d.bitir();
