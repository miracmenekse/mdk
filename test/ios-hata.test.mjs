// Kapı (adım 115): sunucu kapalıyken açılır, sunucu sonradan gelince kendiliğinden panele geçer (yeniden deneme). Yalnız macOS.
import { baslat, canli, derle, dur, kanit, kapat, kur, uyu, yalnizMac } from './ios-ortak.mjs';
yalnizMac();
derle(); kur();
const P = 47612;
baslat(`http://127.0.0.1:${P}`);
await uyu(8000);
if (!canli()) dur('BAŞARISIZ: uygulama hata durumunda kapandı');
if (!(await kanit(P, 40))) dur('BAŞARISIZ: sunucu gelince kendiliğinden yüklenmedi');
kapat();
console.log('ios-hata.test ok');
