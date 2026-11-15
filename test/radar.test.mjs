import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { farkBul } from '../mdk-radar.mjs';
import { denetci, gecici, kos, oku } from './yardim.mjs';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const RUNNER = join(KOK, 'mdk-radar.mjs');
const { kontrol, vaka, bitir } = denetci('radar.test');

const FAKE_GH = `import { readFileSync } from 'node:fs';
const repo = process.argv.find((a) => typeof a === 'string' && a.startsWith('repos/'));
let map = {};
try { map = JSON.parse(readFileSync(process.env.FAKE_GH_MAP, 'utf8')); } catch {}
const veri = repo ? map[repo.slice('repos/'.length)] : undefined;
if (!veri || veri.fail) process.exit(1);
process.stdout.write(JSON.stringify(veri.data));
`;

let SON;
let T;

function ghYolu() { return join(T, 'gh.mjs'); }
function haritaYaz(map) { writeFileSync(join(T, 'gh-map.json'), JSON.stringify(map)); }

vaka('ilk_tarama');
T = gecici();
mkdirSync(join(T, 'strateji'), { recursive: true });
const radar1 = { esik: { sicramaYuzde: 25, sicramaMutlak: 500, durmusGun: 30 }, izle: [
  { repo: 'a/one', grup: 'G1' },
  { repo: 'a/two', grup: 'G2' },
  { repo: 'a/three', grup: 'G3' },
] };
writeFileSync(join(T, 'strateji', 'radar.json'), JSON.stringify(radar1));
const recent = new Date().toISOString();
const map1 = {
  'a/one': { data: { stargazers_count: 1000, license: { spdx_id: 'MIT' }, pushed_at: recent, description: 'desc one' } },
  'a/two': { data: { stargazers_count: 1000, license: { spdx_id: 'Apache-2.0' }, pushed_at: recent, description: 'desc two' } },
  'a/three': { data: { stargazers_count: 500, license: { spdx_id: 'BSD-3-Clause' }, pushed_at: recent, description: 'desc three' } },
};
writeFileSync(join(T, 'gh.mjs'), FAKE_GH);
haritaYaz(map1);
SON = kos(RUNNER, [], { cwd: T, env: { MDK_GH: ghYolu(), FAKE_GH_MAP: join(T, 'gh-map.json') } });
kontrol(SON.kod === 0, 'ilk tarama çıkış 0', SON.cikti);
const ilkSonuc = JSON.parse(oku(join(T, 'strateji', 'radar-sonuc.json')));
kontrol(ilkSonuc.ilk === true, 'ilk:true');
kontrol(Array.isArray(ilkSonuc.degisenler) && ilkSonuc.degisenler.length === 0, 'degisenler boş');
kontrol(ilkSonuc.adaylar.length === 3, '3 aday');
for (const aday of ilkSonuc.adaylar) {
  const beklenen = map1[aday.repo].data;
  kontrol(aday.yildiz === beklenen.stargazers_count, `${aday.repo} yildiz`, SON.cikti);
  kontrol(aday.lisans === beklenen.license.spdx_id, `${aday.repo} lisans`, SON.cikti);
  kontrol(aday.son === beklenen.pushed_at.slice(0, 10), `${aday.repo} son`, SON.cikti);
  kontrol(aday.aciklama === beklenen.description, `${aday.repo} aciklama`, SON.cikti);
  kontrol(aday.kaynak === 'api', `${aday.repo} kaynak:api`, SON.cikti);
}
kontrol(SON.cikti.includes('radar: 3 aday, 0 değişiklik'), 'stdout ilk', SON.cikti);
kontrol(/^\d{4}-\d{2}-\d{2}T/.test(ilkSonuc.ts), 'ts ISO');

vaka('ikinci_tarama');
radar1.izle.push({ repo: 'a/four', grup: 'G4' });
writeFileSync(join(T, 'strateji', 'radar.json'), JSON.stringify(radar1));
const eskiTarih = new Date(Date.now() - 200 * 86400000).toISOString();
map1['a/one'].data.stargazers_count = 1300;
map1['a/two'].data.stargazers_count = 1100;
map1['a/three'].data.pushed_at = eskiTarih;
map1['a/four'] = { data: { stargazers_count: 10, license: { spdx_id: 'Apache-2.0' }, pushed_at: recent, description: 'desc four' } };
haritaYaz(map1);
SON = kos(RUNNER, [], { cwd: T, env: { MDK_GH: ghYolu(), FAKE_GH_MAP: join(T, 'gh-map.json') } });
kontrol(SON.kod === 0, 'ikinci tarama çıkış 0', SON.cikti);
const ikinciSonuc = JSON.parse(oku(join(T, 'strateji', 'radar-sonuc.json')));
kontrol(ikinciSonuc.ilk === false, 'ilk:false');
kontrol(ikinciSonuc.degisenler.length === 3, '3 değişiklik');
const degOne = ikinciSonuc.degisenler.find((d) => d.repo === 'a/one');
const degFour = ikinciSonuc.degisenler.find((d) => d.repo === 'a/four');
const degThree = ikinciSonuc.degisenler.find((d) => d.repo === 'a/three');
kontrol(!!degOne && degOne.tur === 'sicradi', 'a/one sicradi');
kontrol(!ikinciSonuc.degisenler.some((d) => d.repo === 'a/two'), 'a/two değişmez');
kontrol(!!degFour && degFour.tur === 'yeni', 'a/four yeni');
kontrol(!!degThree && degThree.tur === 'durdu', 'a/three durdu');
kontrol(JSON.stringify(ikinciSonuc.onceki.adaylar) === JSON.stringify(ilkSonuc.adaylar), 'onceki.adaylar ilk taramanın adayları');
kontrol(ikinciSonuc.onceki.ts === ilkSonuc.ts, 'onceki.ts');
kontrol(SON.cikti.includes('radar: 4 aday, 3 değişiklik'), 'stdout ikinci', SON.cikti);

vaka('bir_depo_hata');
T = gecici();
mkdirSync(join(T, 'strateji'), { recursive: true });
const radar2 = { esik: { sicramaYuzde: 25, sicramaMutlak: 500, durmusGun: 30 }, izle: [
  { repo: 'a/one', grup: 'G1' },
  { repo: 'a/two', grup: 'G2' },
  { repo: 'a/three', grup: 'G3' },
] };
writeFileSync(join(T, 'strateji', 'radar.json'), JSON.stringify(radar2));
writeFileSync(join(T, 'gh.mjs'), FAKE_GH);
const map2 = {
  'a/one': { data: { stargazers_count: 1000, license: { spdx_id: 'MIT' }, pushed_at: recent, description: 'desc one' } },
  'a/two': { fail: true },
  'a/three': { data: { stargazers_count: 500, license: { spdx_id: 'BSD-3-Clause' }, pushed_at: recent, description: 'desc three' } },
};
haritaYaz(map2);
SON = kos(RUNNER, [], { cwd: T, env: { MDK_GH: ghYolu(), FAKE_GH_MAP: join(T, 'gh-map.json') } });
kontrol(SON.kod === 0, 'bir depo hata çıkış 0', SON.cikti);
const hataSonuc = JSON.parse(oku(join(T, 'strateji', 'radar-sonuc.json')));
const hataliAday = hataSonuc.adaylar.find((a) => a.repo === 'a/two');
kontrol(JSON.stringify(hataliAday) === JSON.stringify({ repo: 'a/two', grup: 'G2', hata: 'alinamadi' }), 'hatalı aday', SON.cikti);
const doluAday = hataSonuc.adaylar.find((a) => a.repo === 'a/one');
kontrol(doluAday && doluAday.kaynak === 'api' && doluAday.yildiz === 1000, 'diğerleri dolu', SON.cikti);
kontrol(SON.cikti.includes('radar: 3 aday, 0 değişiklik'), 'stdout bir hata', SON.cikti);

vaka('tum_depolar_hata');
T = gecici();
mkdirSync(join(T, 'strateji'), { recursive: true });
const radar3 = { esik: { sicramaYuzde: 25, sicramaMutlak: 500, durmusGun: 30 }, izle: [
  { repo: 'a/one', grup: 'G1' },
  { repo: 'a/two', grup: 'G2' },
] };
writeFileSync(join(T, 'strateji', 'radar.json'), JSON.stringify(radar3));
writeFileSync(join(T, 'gh.mjs'), FAKE_GH);
const mapOk = {
  'a/one': { data: { stargazers_count: 1000, license: { spdx_id: 'MIT' }, pushed_at: recent, description: 'desc one' } },
  'a/two': { data: { stargazers_count: 500, license: { spdx_id: 'MIT' }, pushed_at: recent, description: 'desc two' } },
};
const mapFail = { 'a/one': { fail: true }, 'a/two': { fail: true } };
haritaYaz(mapOk);
SON = kos(RUNNER, [], { cwd: T, env: { MDK_GH: ghYolu(), FAKE_GH_MAP: join(T, 'gh-map.json') } });
kontrol(SON.kod === 0, 'önce başarılı tarama', SON.cikti);
const oncekiOk = JSON.parse(oku(join(T, 'strateji', 'radar-sonuc.json')));
haritaYaz(mapFail);
SON = kos(RUNNER, [], { cwd: T, env: { MDK_GH: ghYolu(), FAKE_GH_MAP: join(T, 'gh-map.json') } });
kontrol(SON.kod === 1, 'tüm depolar hata çıkış 1', SON.cikti);
const hataTum = JSON.parse(oku(join(T, 'strateji', 'radar-sonuc.json')));
kontrol(JSON.stringify(hataTum.adaylar) === JSON.stringify(oncekiOk.adaylar), 'adaylar aynen durur', SON.cikti);
kontrol(JSON.stringify(hataTum.degisenler) === JSON.stringify(oncekiOk.degisenler), 'degisenler aynen durur', SON.cikti);
kontrol(JSON.stringify(hataTum.onceki) === JSON.stringify(oncekiOk.onceki), 'onceki aynen durur', SON.cikti);
kontrol(hataTum.ts === oncekiOk.ts, 'ts aynen durur', SON.cikti);
kontrol(!!hataTum.sonHata && typeof hataTum.sonHata.ileti === 'string' && hataTum.sonHata.ileti.length > 0, 'sonHata.ileti dolu', SON.cikti);
haritaYaz(mapOk);
SON = kos(RUNNER, [], { cwd: T, env: { MDK_GH: ghYolu(), FAKE_GH_MAP: join(T, 'gh-map.json') } });
kontrol(SON.kod === 0, 'başarılı tarama çıkış 0', SON.cikti);
const temizSonuc = JSON.parse(oku(join(T, 'strateji', 'radar-sonuc.json')));
kontrol(temizSonuc.sonHata === undefined || temizSonuc.sonHata === null, 'sonHata silinir', SON.cikti);

vaka('radar_json_yok');
T = gecici();
mkdirSync(join(T, 'strateji'), { recursive: true });
SON = kos(RUNNER, [], { cwd: T, env: {} });
kontrol(SON.kod === 2, 'radar.json yok çıkış 2', SON.cikti);
kontrol(SON.cikti.trim().length > 0, 'stderr ileti', SON.cikti);

vaka('farkBul_dogrudan');
const esik = { sicramaYuzde: 25, sicramaMutlak: 500, durmusGun: 90 };
const onceki = [{ repo: 'x', grup: 'g', yildiz: 10000, lisans: 'MIT', son: '2026-01-01', aciklama: 'a', kaynak: 'api' }];
const simdiki = [{ repo: 'x', grup: 'g', yildiz: 10500, lisans: 'MIT', son: '2026-01-01', aciklama: 'a', kaynak: 'api' }];
const fb = farkBul(onceki, simdiki, esik, Date.now());
kontrol(JSON.stringify(fb) === JSON.stringify([{ repo: 'x', tur: 'sicradi', fark: '+500 yıldız (%5)' }]), 'mutlak eşik sicradi', JSON.stringify(fb));
kontrol(JSON.stringify(farkBul([], [simdiki[0]], esik, Date.now())) === '[]', 'önceki boş []');
kontrol(JSON.stringify(farkBul(null, [simdiki[0]], esik, Date.now())) === '[]', 'önceki yok []');
const hataliAday2 = { repo: 'h', grup: 'g', hata: 'alinamadi' };
kontrol(JSON.stringify(farkBul([hataliAday2], [hataliAday2], esik, Date.now())) === '[]', 'hatalı aday tür üretmez');

bitir();
