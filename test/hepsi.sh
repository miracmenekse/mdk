#!/usr/bin/env bash
# Tüm kapı testlerini çalıştırır (regresyon). Kullanım (proje kökünde): bash test/hepsi.sh
cd "$(dirname "$0")/.." || exit 1
FAIL=0
for t in panel/*.test.mjs etki/*.test.mjs test/*.test.mjs; do
  [ -f "$t" ] || continue
  out=$(node "$t" 2>&1) || { echo "BAŞARISIZ: $t"; echo "$out" | tail -5; FAIL=1; }
done
out=$(bash test/op-adim.test.sh 2>&1) || { echo "BAŞARISIZ: test/op-adim.test.sh"; echo "$out" | tail -8; FAIL=1; }
[ $FAIL = 0 ] && echo "hepsi ok" || exit 1
