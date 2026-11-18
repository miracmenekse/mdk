# Epic 55 Uygulama Planı: Depo / Kod Haritası Desteği

## Hedef
Dış bağımlılık gerektirmeden projenin dışa aktarılan sembol (`export function/const/class` + satır no) ve yerel bağımlılık (`import ... from './...'`) haritasını çıkararak adımın hedef dosyalarına göre önceliklendirilmiş biçimde istem bağlamına eklemek.

## Değişiklikler
- `mdk-ortak.mjs`: `depoHaritasi({ kok, sorgu, adimBlok, butce = 1200 })` işlevi dışa aktarılır.
- `mdk-adim.mjs`: `MDK_HARITA=1` veya `- Harita: evet` / `Harita: evet` olduğunda `depoHaritasi` çıktısı istem bağlamına eklenir.

## Doğrulama
- `node test/depo-haritasi.test.mjs`
