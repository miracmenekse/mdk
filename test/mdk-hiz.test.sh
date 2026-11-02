#!/usr/bin/env bash
# Yeni MDK hızlandırma ve otonomi özellikleri testi:
# - oto_kapi: kapı test dosyası yoksa önce Görev kapi: modeli yazar (kırmızı doğrular), sonra Görev kod: geçirir
# - oto_eskale: Görev kod: modelleri düşerse çıkış 2'den önce Görev eskale: modeli denenir
# - sorun_hizli: ilk model SORUN.md bırakırsa sonraki modeller boşuna denenmez
# - doktor: CLI argüman/ortam hatasında (0 olay + stderr hatası) diğer modeller denenmeden çıkış 4
RUNNER=$(cd "$(dirname "$0")/.." && pwd)/mdk-adim.sh
FAIL=0; CASE=""
kontrol() { eval "$1" || { echo "BAŞARISIZ [$CASE]: $1  (çıktı: $T/cikti.txt)"; FAIL=1; }; }

setup() { # $1 PLAN içeriği, $2 davran() tanımı
  T=$(mktemp -d); R=$T/repo; mkdir -p "$T/bin" "$R"; export STUB_DIR=$T
  cat >"$T/bin/opencode" <<'STUB'
#!/usr/bin/env bash
while [ $# -gt 0 ]; do case $1 in -m) M=$2; shift;; esac; shift; done
n=$(( $(cat "$STUB_DIR/sayac" 2>/dev/null || echo 0) + 1 )); echo $n >"$STUB_DIR/sayac"
echo "$M" >>"$STUB_DIR/modeller.log"
source "$STUB_DIR/davran.sh"; davran "$M" "$n"
echo '{"type":"step_finish","part":{"tokens":{"total":100},"cost":0}}'
STUB
  chmod +x "$T/bin/opencode"; printf '%s\n' "$2" >"$T/davran.sh"
  cd "$R" && git init -q && git config user.name t && git config user.email t@t
  printf 'durum.json\nmetrikler.jsonl\n.mdk-log/\n' >.gitignore; printf '%s\n' "$1" >PLAN.md
  git add -A; git commit -qm c0
}
kos() {
  ( cd "$R"; env PATH="$T/bin:$PATH" MDK_OPENCODE=opencode POLL=1 DENEME="${DENEME:-1}" SURE="${SURE:-30}" "$@" bash "$RUNNER" 1 ) >"$T/cikti.txt" 2>&1
  KOD=$?
}

CASE=oto_kapi
setup 'Yürütücü: opencode
Modeller: m/kod
Görev kapi: m/kapi
Görev kod: m/kod

## K
- [ ] 1. Otomatik kapılı iş
  - Ne: yeni.mjs yaz
  - Kapı: `node yeni.test.mjs`
' 'davran(){
  if [ "$1" = m/kapi ]; then
    printf "import { existsSync } from \"node:fs\"; if (!existsSync(\"yeni.mjs\")) process.exit(1);\n" > yeni.test.mjs
  else
    echo "export const x = 1;" > yeni.mjs
  fi
}'
kos
kontrol '[ "$KOD" = 0 ]'
kontrol '[ -f "$R/yeni.test.mjs" ] && [ -f "$R/yeni.mjs" ]'
kontrol '[ "$(paste -sd, "$T/modeller.log")" = "m/kapi,m/kod" ]'

CASE=oto_eskale
setup 'Yürütücü: opencode
Modeller: m/kod1
Görev kod: m/kod1
Görev eskale: m/qwen-max

## K
- [ ] 1. Zor iş
  - Kapı: `test -f zor.txt`
' 'davran(){ [ "$1" = m/qwen-max ] && echo ok > zor.txt; true; }'
kos
kontrol '[ "$KOD" = 0 ]'
kontrol '[ "$(paste -sd, "$T/modeller.log")" = "m/kod1,m/qwen-max" ]'

CASE=sorun_hizli
setup 'Yürütücü: opencode
Modeller: m/a, m/b, m/c
Görev eskale: m/qwen-max

## K
- [ ] 1. Çelişkili iş
  - Kapı: `test -f x.txt`
' 'davran(){ echo "kapı çelişkili" > SORUN.md; }'
kos
kontrol '[ "$KOD" = 2 ]'
kontrol '[ "$(cat "$T/modeller.log")" = "m/a" ]'   # m/b, m/c ve m/qwen-max boşuna çağrılmamalı

CASE=doktor
setup 'Yürütücü: opencode
Modeller: m/a, m/b

## K
- [ ] 1. Ortam hatası
  - Kapı: `test -f x.txt`
' 'davran(){ :; }'
cat >"$T/bin/opencode" <<'STUB'
#!/usr/bin/env bash
while [ $# -gt 0 ]; do case $1 in -m) M=$2; shift;; esac; shift; done
echo "$M" >>"$STUB_DIR/modeller.log"
echo "Unknown argument: standalone" >&2
exit 1
STUB
chmod +x "$T/bin/opencode"
kos
kontrol '[ "$KOD" = 4 ]'
kontrol '[ "$(cat "$T/modeller.log")" = "m/a" ]'   # ikinci model denenmeden anında durmalı
kontrol 'grep -q "ortam_hatasi" "$R/durum.json"'

[ $FAIL = 0 ] && echo "mdk-hiz.test ok" || { echo "mdk-hiz.test BAŞARISIZ"; exit 1; }
