// Yazma izni kararı (adım 111, saf modül).
// Yerel: sunucu.mjs:113/118'deki eski davranışın aynısı; uzak: .mdk-uzak.json'daki
// host + Tailscale kullanıcısıyla açılır.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function uzakAyar(kok) {
  let d;
  try {
    d = JSON.parse(readFileSync(join(kok, '.mdk-uzak.json'), 'utf8'));
  } catch {
    return null;
  }
  if (typeof d !== 'object' || d === null) return null;
  if (typeof d.host !== 'string' || !d.host) return null;
  if (typeof d.kullanici !== 'string' || !d.kullanici) return null;
  return { host: d.host, kullanici: d.kullanici };
}

const NEDEN_HOST = 'istek yerel adresten gelmiyor';
const NEDEN_ORIGIN = 'istek kaynağı bu sunucu değil';

export function yazmaIzni(basliklar, ayar) {
  const host = String(basliklar.host || '');
  let ana;
  try {
    ana = new URL(`http://${host}`).hostname;
  } catch {
    ana = '';
  }

  const vekil =
    basliklar['tailscale-user-login'] !== undefined ||
    basliklar['x-forwarded-for'] !== undefined;
  const yerel = (ana === '127.0.0.1' || ana === 'localhost') && !vekil;
  const origin = basliklar.origin;

  if (yerel) {
    if (origin !== undefined && origin !== `http://${host}`) {
      return { izin: false, neden: NEDEN_ORIGIN };
    }
    return { izin: true, kaynak: 'yerel' };
  }

  // uzak yolu: yalnız geçerli ayar + eşleşen host + kullanici + origin
  if (
    !ayar ||
    typeof ayar.host !== 'string' ||
    !ayar.host ||
    typeof ayar.kullanici !== 'string' ||
    !ayar.kullanici
  ) {
    return { izin: false, neden: NEDEN_HOST };
  }
  if (host.toLowerCase() !== ayar.host.toLowerCase()) {
    return { izin: false, neden: NEDEN_HOST };
  }
  if (String(basliklar['tailscale-user-login'] ?? '') !== String(ayar.kullanici)) {
    return { izin: false, neden: NEDEN_HOST };
  }
  if (
    origin !== undefined &&
    origin.toLowerCase() !== `https://${String(ayar.host).toLowerCase()}`
  ) {
    return { izin: false, neden: NEDEN_ORIGIN };
  }
  return { izin: true, kaynak: 'uzak' };
}
