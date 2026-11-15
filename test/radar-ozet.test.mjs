import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { denetci, existsSync, gecici, kos, oku, stub } from './yardim.mjs';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const RUNNER = join(KOK, 'mdk-radar.mjs');
const { kontrol, vaka, bitir } = denetci('radar-ozet.test');

const FAKE_GH = `import { readFileSync } from 'node:fs';
const repo = process.argv.find((a) => typeof a === 'string' && a.startsWith('repos/'));
let map = {};
try { map = JSON.parse(readFileSync(process.env.FAKE_GH_MAP, 'utf8')); } catch {}
const veri = repo ? map[repo.slice('repos/'.length)] : undefined;
if (!veri || veri.fail) process.exit(1);
process.stdout.write(JSON.stringify(veri.data));
`;

function ghYolu(T) { return join(T, 'gh.mjs'); }
function haritaYaz(T, map) { writeFileSync(join(T, 'gh-map.json'), JSON.stringify(map)); }
function planYaz(T) { writeFileSync(join(T, 'PLAN.md'), 'Görev arastirma: m/bir, m/iki\n'); }
function radarYaz(T, urun = 'Ürünümüz için rakip takibi') {
  mkdirSync(join(T, 'strateji'), { recursive: true });
  writeFileSync(join(T, 'strateji', 'radar.json'), JSON.stringify({
    esik: { sicramaYuzde: 25, sicramaMutlak: 500, durmusGun: 30 },
    urun,
    izle: [{ repo: 'a/one', grup: 'G1' }],
  }));
}
function mapYildiz(yildiz) {
  return { 'a/one': { data: { stargazers_count: yildiz, license: { spdx_id: 'MIT' }, pushed_at: new Date().toISOString(), description: 'desc one' } } };
}
function tara(T, map, envEk = {}) {
  haritaYaz(T, map);
  return kos(RUNNER, [], { cwd: T, env: { MDK_GH: ghYolu(T), FAKE_GH_MAP: join(T, 'gh-map.json'), ...envEk } });
}
function sonucOku(T) { return JSON.parse(oku(join(T, 'strateji', 'radar-sonuc.json'))); }

vaka('basari');
let T = gecici();
planYaz(T); radarYaz(T);
writeFileSync(join(T, 'gh.mjs'), FAKE_GH);
const OC1 = stub(T, "metin('Rakip hızla büyüyor; kurulumuna bak.');");
tara(T, mapYildiz(1000), { MDK_OPENCODE: OC1, STUB_DIR: T });
const SON1 = tara(T, mapYildiz(1300), { MDK_OPENCODE: OC1, STUB_DIR: T });
const R1 = sonucOku(T);
const D1 = R1.degisenler[0];
const A1 = R1.adaylar.find((a) => a.repo === 'a/one');
kontrol(SON1.kod === 0, 'çıkış 0', SON1.cikti);
kontrol(D1 && D1.not === 'Rakip hızla büyüyor; kurulumuna bak.', 'not cümle', SON1.cikti);
kontrol(A1 && A1.yildiz === 1300, 'aday yildiz gh', SON1.cikti);
const I1 = oku(join(T, 'istem-1.txt'));
kontrol(I1.includes('Ürünümüz için rakip takibi') && I1.includes('a/one'), 'istem urun+repo', I1);
kontrol(existsSync(join(T, 'sayac')) && oku(join(T, 'sayac')) === '1', 'bir çağrı', SON1.cikti);
const ARGV1 = oku(join(T, 'argv'));
kontrol(ARGV1.includes('--format') && ARGV1.includes('json') && ARGV1.includes('--title') && ARGV1.includes('radar'), 'argv', ARGV1);
kontrol(oku(join(T, 'loglevel')).trim() === 'error', 'loglevel error', oku(join(T, 'loglevel')));

vaka('sayi_korunur');
T = gecici();
planYaz(T); radarYaz(T);
writeFileSync(join(T, 'gh.mjs'), FAKE_GH);
const OC2 = stub(T, "metin('yıldız 999999');");
tara(T, mapYildiz(1000), { MDK_OPENCODE: OC2, STUB_DIR: T });
const SON2 = tara(T, mapYildiz(1300), { MDK_OPENCODE: OC2, STUB_DIR: T });
const R2 = sonucOku(T);
const A2 = R2.adaylar.find((a) => a.repo === 'a/one');
const D2 = R2.degisenler[0];
kontrol(SON2.kod === 0, 'çıkış 0', SON2.cikti);
kontrol(A2 && A2.yildiz === 1300, 'yildiz gh sayısı', SON2.cikti);
kontrol(A2 && A2.lisans === 'MIT', 'lisans', SON2.cikti);
kontrol(D2 && D2.fark === '+300 yıldız (%30)', 'fark', SON2.cikti);
kontrol(D2 && D2.not === 'yıldız 999999', 'not yanıt', SON2.cikti);

vaka('ikinci_model');
T = gecici();
planYaz(T); radarYaz(T);
writeFileSync(join(T, 'gh.mjs'), FAKE_GH);
const OC3 = stub(T, "if (M === 'm/bir') { } else { metin('İkinci model cümlesi.'); }");
tara(T, mapYildiz(1000), { MDK_OPENCODE: OC3, STUB_DIR: T });
const SON3 = tara(T, mapYildiz(1300), { MDK_OPENCODE: OC3, STUB_DIR: T });
const R3 = sonucOku(T);
const D3 = R3.degisenler[0];
kontrol(SON3.kod === 0, 'çıkış 0', SON3.cikti);
kontrol(D3 && D3.not === 'İkinci model cümlesi.', 'ikinci cümle', SON3.cikti);
kontrol(oku(join(T, 'modeller.log')) === 'm/bir\nm/iki\n', 'modeller sırası', oku(join(T, 'modeller.log')));
kontrol(existsSync(join(T, 'sayac')) && oku(join(T, 'sayac')) === '2', 'iki çağrı', SON3.cikti);

vaka('opencode_hata');
T = gecici();
planYaz(T); radarYaz(T);
writeFileSync(join(T, 'gh.mjs'), FAKE_GH);
const OC4 = stub(T, "process.exit(1);");
tara(T, mapYildiz(1000), { MDK_OPENCODE: OC4, STUB_DIR: T });
const SON4 = tara(T, mapYildiz(1300), { MDK_OPENCODE: OC4, STUB_DIR: T });
const R4 = sonucOku(T);
const A4 = R4.adaylar.find((a) => a.repo === 'a/one');
const D4 = R4.degisenler[0];
kontrol(SON4.kod === 0, 'çıkış 0', SON4.cikti);
kontrol(D4 && D4.not === null, 'not null', SON4.cikti);
kontrol(A4 && A4.yildiz === 1300, 'adaylar dolu', SON4.cikti);

vaka('ozetsiz');
T = gecici();
planYaz(T); radarYaz(T);
writeFileSync(join(T, 'gh.mjs'), FAKE_GH);
const OC5 = stub(T, "metin('çağrılmasın');");
tara(T, mapYildiz(1000), { MDK_OPENCODE: OC5, STUB_DIR: T });
const SON5 = tara(T, mapYildiz(1300), { MDK_OPENCODE: OC5, STUB_DIR: T, MDK_RADAR_OZETSIZ: '1' });
kontrol(SON5.kod === 0, 'çıkış 0', SON5.cikti);
kontrol(!existsSync(join(T, 'sayac')), 'opencode çağrılmadı', SON5.cikti);

vaka('ilk_tarama');
T = gecici();
planYaz(T); radarYaz(T);
writeFileSync(join(T, 'gh.mjs'), FAKE_GH);
const OC6 = stub(T, "metin('çağrılmasın');");
const SON6 = tara(T, mapYildiz(1000), { MDK_OPENCODE: OC6, STUB_DIR: T });
const R6 = sonucOku(T);
kontrol(SON6.kod === 0, 'çıkış 0', SON6.cikti);
kontrol(Array.isArray(R6.degisenler) && R6.degisenler.length === 0, 'değişen yok', SON6.cikti);
kontrol(!existsSync(join(T, 'sayac')), 'opencode çağrılmadı', SON6.cikti);

bitir();
