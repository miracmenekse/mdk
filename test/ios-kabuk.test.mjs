// Kapı (adım 114): uygulama derlenir, simülatörde açılır, MDK_PANEL_URL'deki sayfayı yükleyip JS'ini koşar. Yalnız macOS.
import { baslat, derle, dur, kanit, kapat, kur, uyu, yalnizMac } from './ios-ortak.mjs';
yalnizMac();
derle(); kur();
const P = 47611;
const k = kanit(P, 40);
await uyu(1000);
baslat(`http://127.0.0.1:${P}`);
if (!(await k)) dur('BAŞARISIZ: uygulama sayfayı yükleyip JS koşmadı');
kapat();
console.log('ios-kabuk.test ok');
