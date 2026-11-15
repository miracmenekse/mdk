// Hata sınıflandırma ve sade ileti sözlüğü. Yan etkisiz: yalnız gunlukHatasi dosya okur.
import { readFileSync } from 'node:fs';

const oku = (yol) => { try { return readFileSync(yol, 'utf8'); } catch { return ''; } };
const satirlar = (metin) => metin.split(/\r?\n/);

const KURALLAR = [
  {
    tur: 'kota',
    gecici: false,
    kaliplar: ['free usage limit', 'go usage limit', 'gousagelimiterror', 'provider.quota', 'insufficient_quota', 'quota exceeded'],
  },
  {
    tur: 'kimlik',
    gecici: false,
    kaliplar: ['401', '403', 'invalid api key', 'unauthorized', 'authentication'],
  },
  {
    tur: 'model_yok',
    gecici: false,
    kaliplar: ['model not found', 'providermodelnotfounderror', 'unknown model', 'no such model'],
  },
  {
    tur: 'oran',
    gecici: true,
    kaliplar: ['429', 'rate limit', 'too many requests'],
  },
  {
    tur: 'sunucu',
    gecici: true,
    kaliplar: ['overloaded', 'service unavailable', 'bad gateway', 'internal server error'],
    desenler: [/\b(500|502|503|504|529)\b/],
  },
  {
    tur: 'ag',
    gecici: true,
    kaliplar: ['enotfound', 'econnreset', 'econnrefused', 'etimedout', 'eai_again', 'fetch failed', 'socket hang up'],
  },
];

export function hataSinifla(metin) {
  if (metin === null || metin === undefined) return null;
  const s = String(metin).trim();
  if (!s) return null;
  const kucuk = s.toLowerCase();
  for (const k of KURALLAR) {
    if (k.kaliplar.some((p) => kucuk.includes(p))) return { tur: k.tur, gecici: k.gecici };
    if (k.desenler && k.desenler.some((d) => d.test(s))) return { tur: k.tur, gecici: k.gecici };
  }
  return { tur: 'bilinmeyen', gecici: false };
}

export function gunlukHatasi(logYolu) {
  const icerik = oku(logYolu);
  if (!icerik) {
    const err = hataSinifla(oku(logYolu + '.err'));
    return err && err.tur !== 'bilinmeyen' ? err : null;
  }
  let bilinmeyen = false;
  for (const satir of satirlar(icerik)) {
    if (!satir.includes('"type":"error"')) continue;
    let metin = satir;
    try {
      const olay = JSON.parse(satir);
      const hata = olay && olay.error;
      metin = [hata && hata.name, hata && hata.data && hata.data.message].filter(Boolean).join(' ');
    } catch {
      metin = satir;
    }
    const sinif = hataSinifla(metin);
    if (sinif && sinif.tur !== 'bilinmeyen') return sinif;
    if (sinif) bilinmeyen = true;
  }
  const err = hataSinifla(oku(logYolu + '.err'));
  if (err && err.tur !== 'bilinmeyen') return err;
  return bilinmeyen ? { tur: 'bilinmeyen', gecici: false } : null;
}

export function bekleMs(tekrar, tabanMs = 5000, tavanMs = 60000) {
  return Math.min(tavanMs, tabanMs * 3 ** (tekrar - 1));
}

const ILETILER = {
  kota: {
    ileti: 'Ücretsiz modelin bugünkü kullanım hakkı doldu.',
    oneri: 'Birkaç saat sonra yeniden dene ya da Modeller sekmesinden başka bir model seç.',
  },
  oran: {
    ileti: 'Sağlayıcı kısa süreliğine çok fazla istek aldığı için bekletiyor.',
    oneri: 'Bir iki dakika sonra yeniden dene; sorun sürerse modeli değiştir.',
  },
  sunucu: {
    ileti: 'Model sağlayıcısının sunucusunda geçici bir sorun var.',
    oneri: 'Kısa bir süre bekleyip yeniden dene.',
  },
  ag: {
    ileti: 'İnternet bağlantısı ya da sağlayıcıya erişim kesildi.',
    oneri: 'Bağlantını denetle ve yeniden dene.',
  },
  kimlik: {
    ileti: 'Model sağlayıcısı oturum bilgisini kabul etmedi.',
    oneri: 'Ayarlardan yeniden giriş yap ya da anahtarı güncelle.',
  },
  model_yok: {
    ileti: 'Seçili model sağlayıcıda bulunamadı.',
    oneri: 'Modeller sekmesinden geçerli bir model seç.',
  },
  yanit_yok: {
    ileti: 'Model bu süre içinde yanıt vermedi.',
    oneri: 'Yeniden dene; sık olursa daha hızlı bir model seç.',
  },
  butce: {
    ileti: 'Bu koşu için ayrılan harcama sınırı aşıldı.',
    oneri: 'Sınırı artır ya da daha ucuz bir modelle yeniden başlat.',
  },
  sure: {
    ileti: 'Adım tanımlı süreden uzun sürdü.',
    oneri: 'İşi daha küçük adımlara bölüp yeniden dene.',
  },
  kapi: {
    ileti: 'Adımın doğrulama komutu başarısız oldu.',
    oneri: 'Hata çıktısını inceleyip düzelt, sonra yeniden dene.',
  },
  regresyon: {
    ileti: 'Yapılan değişiklik mevcut testlerden birini bozdu.',
    oneri: 'Kırılan testi düzelt; değişikliği geri almayı da düşün.',
  },
  kurcalama: {
    ileti: 'Korunan dosyalardan biri değiştirilmiş görünüyor.',
    oneri: 'Korunan dosyaları eski haline getir ve yeniden dene.',
  },
  sorun: {
    ileti: 'Plan ile adım arasında bir çelişki saptandı.',
    oneri: 'SORUN.md dosyasındaki notu okuyup planı düzelt.',
  },
  eskale: {
    ileti: 'Bu adım art arda birkaç kez başarısız oldu.',
    oneri: 'Durup sorunu elle incele; gerekirse planı güncelle.',
  },
  saglayici: {
    ileti: 'Model sağlayıcısında bir sorun oluştu.',
    oneri: 'Kısa bir süre sonra yeniden dene.',
  },
  kilit: {
    ileti: 'Başka bir koşu hâlâ çalışıyor gibi görünüyor.',
    oneri: 'O koşunun bitmesini bekle ya da kilidi temizle.',
  },
  kapi_hata: {
    ileti: 'Doğrulama komutu beklenmedik bir hata verdi.',
    oneri: 'Komutu tek başına çalıştırıp çıktısını incele.',
  },
  ortam_hatasi: {
    ileti: 'Gerekli araç ya da ortam ayarı eksik.',
    oneri: 'Kurulumu denetle ve eksikleri tamamla.',
  },
  regresyon_kirmizi: {
    ileti: 'Genel testler bu değişiklikten sonra kırıldı.',
    oneri: 'Kırılan testleri düzelt ve yeniden dene.',
  },
};

export function iletiBul(durum, neden) {
  if (neden && ILETILER[neden]) return ILETILER[neden];
  if (!neden && durum && ILETILER[durum]) return ILETILER[durum];
  return null;
}
