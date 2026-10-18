import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { denetle, sayim } from '../persona-denetle.mjs';

const kart = (ad, bosKorluk = false) =>
  `### ${ad}\n- **Optimize eder:** a\n- **Sorusu:** b\n- **Körlüğü:** ${bosKorluk ? '' : 'c'}\n- **Ne zaman:** d\n- **Ayrışma ekseni:** e\n\n`;
const alan = (ad, durum, kartlar) => `## Alan: ${ad}\nDurum: ${durum}\n\n${kartlar.join('')}`;
const GUNLUK = '| Tarih | Alan | Karar | Kartlar | Eksen | Kazanan |\n|---|---|---|---|---|---|\n';
const dosya = (...parcalar) => `# Düşünme personaları\n\n## Ortak\nher alanda geçerli\n\n${parcalar.join('\n')}`;

// geçerli dosya: bulgu yok, sayım doğru
const iyi = dosya(
  alan('proje-gelistirme', 'denendi', [kart('Minimalist'), kart('Geliştirici'), kart('Denetçi')]),
  alan('sunum', 'denenmemiş', [kart('Dinleyici'), kart('Jüri'), kart('Anlatıcı')]),
  `## Karar günlüğü\n${GUNLUK}` +
    '| 2026-10-17 | proje-gelistirme | Geçmiş görünümü | Minimalist, Geliştirici, Denetçi | ayrı bölüm mü; satıra gömülü mü | Minimalist, Geliştirici |\n' +
    '| 2026-10-18 | sunum | Açılış | Dinleyici, Jüri | akış | benchmark |\n',
);
assert.deepEqual(denetle(iyi), []);
const s = sayim(iyi);
assert.deepEqual(s['proje-gelistirme/Minimalist'], { kullanim: 1, kazanma: 1 });
assert.deepEqual(s['proje-gelistirme/Denetçi'], { kullanim: 1, kazanma: 0 });
assert.deepEqual(s['sunum/Jüri'], { kullanim: 1, kazanma: 0 });
assert.deepEqual(s['sunum/Anlatıcı'], { kullanim: 0, kazanma: 0 });

// kötü dosya: her kural kendi bulgusunu verir
const kotu = dosya(
  alan('proje-gelistirme', 'denendi', [kart('Minimalist'), kart('Geliştirici', true), kart('Denetçi'), kart('Denetçi')]),
  alan('sunum', 'denenmemiş', [kart('Dinleyici'), kart('Jüri')]),
  alan('arastirma', 'belki', [kart('Hakem'), kart('Avukat'), kart('Uygulayıcı')]),
  alan('bos', 'denendi', [kart('K1'), kart('K2'), kart('K3')]),
  `## Karar günlüğü\n${GUNLUK}` +
    '| 2026-10-17 | proje-gelistirme | iyi | Minimalist, Denetçi | e | Minimalist |\n' +
    '| 2026-10-17 | yok-alan | x | Minimalist | e | Minimalist |\n' +
    '| 2026-10-17 | proje-gelistirme | x | Minimalist, Hayalet | e | Minimalist |\n' +
    '| 2026-10-17 | proje-gelistirme | x | Minimalist |  | Denetçi |\n',
);
const sonuc = denetle(kotu);
assert.deepEqual(
  sonuc.map((x) => `${x.ad}:${x.seviye}`).sort(),
  [
    'Denetçi:HATA', // yinelenen ad
    'Geliştirici:HATA', // Körlüğü boş
    'Geliştirici:UYARI', // denendi alanda hiç kullanılmadı
    'K1:UYARI', 'K2:UYARI', 'K3:UYARI',
    'arastirma:HATA', // Durum geçersiz
    'bos:HATA', // denendi ama günlük satırı yok
    'günlük 2:HATA', // alan yok
    'günlük 3:HATA', // kart alanda yok
    'günlük 4:HATA', // eksen boş
    'günlük 4:HATA', // kazanan kartlarda yok
    'sunum:HATA', // 3'ten az kart
  ].sort(),
);
assert.ok(sonuc.every((x) => typeof x.mesaj === 'string' && x.mesaj.length > 0));

// sınır: boş dosya ve alansız dosya
assert.deepEqual(denetle('').map((x) => `${x.ad}:${x.seviye}`), ['dosya:HATA']);
assert.deepEqual(denetle('# Başlık\nmetin\n').map((x) => `${x.ad}:${x.seviye}`), ['dosya:HATA']);

// yalnızca UYARI: çıkış 0
const uyari = iyi.replace('Minimalist, Geliştirici, Denetçi |', 'Minimalist, Geliştirici |');
assert.deepEqual(denetle(uyari).map((x) => `${x.ad}:${x.seviye}`), ['Denetçi:UYARI']);

// komut satırı
const KOMUT = fileURLToPath(new URL('../persona-denetle.mjs', import.meta.url));
const d = mkdtempSync(join(tmpdir(), 'pd-'));
const yaz = (ad, icerik) => { writeFileSync(join(d, ad), icerik); return join(d, ad); };
let r = spawnSync(process.execPath, [KOMUT, yaz('kotu.md', kotu)], { encoding: 'utf8' });
assert.equal(r.status, 1, 'HATA varsa çıkış 1');
assert.match(r.stdout, /Geliştirici: HATA: /);
assert.match(r.stdout, /günlük 2: HATA: /);
r = spawnSync(process.execPath, [KOMUT, yaz('iyi.md', iyi)], { encoding: 'utf8' });
assert.equal(r.status, 0);
assert.match(r.stdout, /personalar tamam/);
r = spawnSync(process.execPath, [KOMUT, yaz('uyari.md', uyari)], { encoding: 'utf8' });
assert.equal(r.status, 0, 'yalnızca UYARI varsa çıkış 0');
assert.match(r.stdout, /Denetçi: UYARI: /);
r = spawnSync(process.execPath, [KOMUT, yaz('iyi.md', iyi), '--sayim'], { encoding: 'utf8' });
assert.match(r.stdout, /^proje-gelistirme\/Minimalist: kullanım 1, kazanma 1$/m);
assert.match(r.stdout, /^sunum\/Anlatıcı: kullanım 0, kazanma 0$/m);
r = spawnSync(process.execPath, [KOMUT, join(d, 'yok.md')], { encoding: 'utf8' });
assert.equal(r.status, 1, 'dosya yoksa çıkış 1');
console.log('persona-denetle ok');
