#!/usr/bin/env bash
# Tüm kapı testlerini çalıştırır (regresyon). Kullanım (proje kökünde): bash test/hepsi.sh
cd "$(dirname "$0")/.." || exit 1
FAIL=0
# ileride commit edilen kırmızı kapı: yalnız bitmemiş adımların Kapı'larında geçen test dosyası atlanır;
# bitmiş bir adımda da geçiyorsa koşar (regresyon korunur). Adım 70 bu yüzden 7 denemede geçemedi.
bekleyen=$(node -e '
  const t=require("fs").readFileSync("PLAN.md","utf8"); const bitti=new Set(), acik=new Set(); let k=null;
  for (const l of t.split("\n")) {
    const a=l.match(/^- \[([ x])\] \d+\./); if (a) { k = a[1]==="x" ? bitti : acik; continue; }
    if (/^#/.test(l)) { k=null; continue; }
    const m=k && l.match(/^\s*- Kapı: `(.*)`/); if (m) for (const f of m[1].match(/[\w./-]+\.test\.(mjs|sh)/g)||[]) k.add(f);
  }
  console.log([...acik].filter((f)=>!bitti.has(f)).join("\n"))' 2>/dev/null)
atla() { grep -qxF "$1" <<<"$bekleyen"; }
for t in panel/*.test.mjs etki/*.test.mjs test/*.test.mjs; do
  [ -f "$t" ] || continue
  atla "$t" && { echo "atlandı (bekleyen adımın kapısı): $t"; continue; }
  out=$(node "$t" 2>&1) || { echo "BAŞARISIZ: $t"; echo "$out" | tail -5; FAIL=1; }
done
# HEPSI_HIZLI=1 (adım 91): ön kontrol kipi; mdk-adim.test.sh yavaştır, onu atlar
for t in test/mdk-adim.test.sh test/mdk-panel.test.sh; do
  [ -f "$t" ] || continue
  [ "${HEPSI_HIZLI:-}" = 1 ] && [ "$t" = test/mdk-adim.test.sh ] && { echo "atlandı (hızlı): $t"; continue; }
  atla "$t" && { echo "atlandı (bekleyen adımın kapısı): $t"; continue; }
  out=$(bash "$t" 2>&1) || { echo "BAŞARISIZ: $t"; echo "$out" | tail -8; FAIL=1; }
done
[ $FAIL = 0 ] && echo "hepsi ok" || exit 1
