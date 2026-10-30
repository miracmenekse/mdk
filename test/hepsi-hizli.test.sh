#!/usr/bin/env bash
# Kapı (adım 91): HEPSI_HIZLI=1 iken hepsi.sh mdk-adim.test.sh'i atlar ve kısa sürer; değişken yoksa atlamaz.
# Kullanım (proje kökünde): bash test/hepsi-hizli.test.sh
cd "$(dirname "$0")/.." || exit 1
t0=$SECONDS; out=$(HEPSI_HIZLI=1 bash test/hepsi.sh 2>&1); kod=$?; sn=$((SECONDS - t0))
[ $kod = 0 ] || { echo "hızlı kip kırmızı: $out" | tail -5; exit 1; }
grep -q "atlandı (hızlı): test/mdk-adim.test.sh" <<<"$out" || { echo "hızlı kipte mdk-adim.test.sh atlanmadı"; exit 1; }
grep -q "mdk-panel.test.sh" <<<"$out" && { echo "mdk-panel.test.sh atlanmamalı (yalnız mdk-adim)"; exit 1; }
[ $sn -lt 60 ] || { echo "hızlı kip $sn sn sürdü (<60 beklenir)"; exit 1; }
grep -q 'HEPSI_HIZLI' test/hepsi.sh && grep -q 'atlandı (hızlı)' test/hepsi.sh || exit 1
echo "hepsi-hizli ok ($sn sn)"
