// Kapı: HEPSI_HIZLI=1 iken hepsi.mjs uzun koşturucu testlerini atlar ve kısa sürer; değişken yoksa atlamaz.
// Kullanım (proje kökünde): node test/hepsi-hizli.test.mjs   (hepsi.mjs bu dosyayı koşmaz: kendini çağırırdı)
import { KOK, denetci, join, oku } from './yardim.mjs';
import { spawnSync } from 'node:child_process';

const { kontrol, bitir } = denetci('hepsi-hizli.test');
const HEPSI = join(KOK, 'test', 'hepsi.mjs');
const t0 = Date.now();
const r = spawnSync(process.execPath, [HEPSI], { cwd: KOK, encoding: 'utf8', env: { ...process.env, HEPSI_HIZLI: '1' }, maxBuffer: 64 << 20 });
const sn = (Date.now() - t0) / 1000, o = (r.stdout || '') + (r.stderr || '');
kontrol(r.status === 0, 'hızlı kip yeşil', o);
kontrol(o.includes('atlandı (hızlı): test/mdk-adim.test.mjs'), 'mdk-adim.test.mjs atlandı');
kontrol(!o.includes('atlandı (hızlı): test/mdk-panel.test.mjs'), 'mdk-panel.test.mjs atlanmamalı');
kontrol(sn < 60, `hızlı kip ${sn} sn sürdü (<60 beklenir)`);
const kaynak = oku(HEPSI);
kontrol(kaynak.includes('HEPSI_HIZLI') && kaynak.includes('atlandı (hızlı)'), 'hepsi.mjs hızlı kipi tanır');
console.log(`(${sn.toFixed(1)} sn)`);
bitir();
