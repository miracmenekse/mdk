#!/usr/bin/env bash
# mdk-adim.sh testi: sahte `opencode` ile, geçici git deposunda, ağsız ve hızlı.
# Kullanım: bash test/mdk-adim.test.sh [vaka|grup ...]   (boşsa hepsi; grup: temel)
RUNNER=$(cd "$(dirname "$0")/.." && pwd)/mdk-adim.sh
FAIL=0; CASE=""
TEMEL="gecer ikinci eskale donmus kurcalama"
HEPSI="$TEMEL coklu onay neden sure yanit_yok kota butce butce_model butce_ok sorun once"   # deney: adım 70 bitince eklenir

kontrol() { eval "$1" || { echo "BAŞARISIZ [$CASE]: $1  (çıktı: $T/cikti.txt)"; FAIL=1; }; }
plan() { printf 'Yürütücü: opencode\nModeller: %s\n\n## K\n- [ ] 1. İş\n%s\n' "$1" "$2"; }

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
}
commit0() { git add -A; git commit -qm c0; CP=$(git rev-parse HEAD); }
kos() { # ortam değişkenleri argüman olarak; adım 1'i çalıştırır
  local t0=$(date +%s)
  ( cd "$R"; env PATH="$T/bin:$PATH" POLL=1 DENEME="${DENEME:-1}" SURE="${SURE:-30}" "$@" bash "${RUN:-$RUNNER}" 1 ) >"$T/cikti.txt" 2>&1
  KOD=$?; SN=$(( $(date +%s)-t0 ))
}
metrik() { node -e 'const r=require("fs").readFileSync("metrikler.jsonl","utf8").trim().split("\n").map(JSON.parse);console.log(eval(process.argv[1]))' "$1"; }
gecti_listesi() { metrik 'r.map(x=>x.gecti).join()'; }
neden_listesi() { metrik 'r.map(x=>x.neden??"-").join()'; }
yetim() { pgrep -f "sleep $1" >/dev/null; }

c_gecer() {
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; }'; commit0; kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol 'grep -q "^- \[x\] 1\." PLAN.md'
  kontrol 'git log -1 --format=%s | grep -q "^adım 1:"'
  kontrol '[ "$(gecti_listesi)" = true ]'
  kontrol 'grep -q "\"durum\":\"gecti\"" durum.json'
}
c_ikinci() {
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ if [ "$2" = 1 ]; then echo x > kalinti.txt; else echo x > cikti.txt; fi; }'; commit0
  DENEME=2 kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$(gecti_listesi)" = false,true ]'
  kontrol '[ ! -f kalinti.txt ]'   # ilk denemenin kalıntısı temizlenmeli
}
c_eskale() {
  setup "$(plan 'm/a, m/b' '  - Kapı: `test -f cikti.txt`')" 'davran(){ :; }'; commit0; kos
  kontrol '[ "$KOD" = 2 ]'
  kontrol '[ "$(gecti_listesi)" = false,false ]'
  kontrol 'grep -q eskale durum.json'
  kontrol '[ -z "$(git status --porcelain)" ] && [ "$(git rev-parse HEAD)" = "$CP" ]'
  kontrol '[ "$(paste -sd, "$T/modeller.log")" = m/a,m/b ]'
}
c_donmus() {
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ echo "echo KOTU (((" >> mdk-adim.sh; echo x > cikti.txt; }'
  cp "$RUNNER" mdk-adim.sh; commit0; RUN=./mdk-adim.sh kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ -f .mdk-log/mdk-adim.run.sh ]'
}
c_kurcalama() {
  setup "$(plan m/a '  - Kapı: `node x.test.mjs`')" 'davran(){ echo "process.exit(0)" > x.test.mjs; }'
  echo "process.exit(1)" >x.test.mjs; commit0; kos
  kontrol '[ "$KOD" = 2 ]'
  kontrol 'grep -q kurcalama "$T/cikti.txt"'
  kontrol 'grep -q "exit(1)" x.test.mjs'
}
c_coklu() {
  setup "$(plan m/a '  - Kapı: `test -f a.txt`
  - Kapı: `test -f b.txt`')" 'davran(){ echo x > a.txt; [ "$2" = 2 ] && echo x > b.txt; }'; commit0
  DENEME=2 kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$(gecti_listesi)" = false,true ]'   # tek kapıya bakan çalıştırıcı ilk denemede geçerdi
}
c_onay() {
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`
  - Etki: etki/a.html')" 'davran(){ echo x > cikti.txt; }'; commit0; kos
  kontrol '[ "$KOD" = 5 ]'
  kontrol '[ ! -f "$T/sayac" ]'   # onaysız adımda opencode hiç çağrılmamalı
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`
  - Etki: etki/a.html
  - Onay: evet')" 'davran(){ echo x > cikti.txt; }'; commit0; kos
  kontrol '[ "$KOD" = 0 ]'
}
c_neden() {
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ [ "$2" = 2 ] && echo x > cikti.txt; }'; commit0
  DENEME=2 kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$(neden_listesi)" = kapi,- ]'
}
c_sure() {
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ (sleep 31338 &); sleep 60; }'; commit0
  SURE=2 kos
  kontrol '[ "$KOD" = 2 ]'
  kontrol '[ "$SN" -lt 25 ]'
  kontrol '[ "$(neden_listesi)" = sure ]'
  kontrol '! yetim 31338'   # süreç grubu temizlenmeli
}
c_yanit_yok() {
  # sağlayıcı sessiz (kota/ağ): ilk olay ILK sn içinde gelmezse süreç öldürülür, neden yanit_yok;
  # tüm modeller sessizse çıkış 6 (model hatası değil), biri yanıt verirse normal akış
  setup "$(plan 'm/a, m/b' '  - Kapı: `test -f cikti.txt`')" 'davran(){ (sleep 31339 &); sleep 60; }'; commit0
  ILK=2 SURE=60 kos
  kontrol '[ "$KOD" = 6 ]'
  kontrol '[ "$SN" -lt 25 ]'
  kontrol '[ "$(neden_listesi)" = yanit_yok,yanit_yok ]'   # model başına tek deneme: sessiz modeli tekrar denemek boşuna
  kontrol '! yetim 31339'
  kontrol '[ "$(git rev-parse HEAD)" = "$CP" ]'
  setup "$(plan 'm/a, m/b' '  - Kapı: `test -f cikti.txt`')" 'davran(){ if [ "$1" = m/a ]; then (sleep 31339 &); sleep 60; else echo x > cikti.txt; fi; }'; commit0
  ILK=2 SURE=60 kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$(neden_listesi)" = yanit_yok,- ]'
  kontrol '! yetim 31339'
}
c_kota() {
  # ücretsiz kota doldu: opencode hatayı yalnız log'a yazıp sessizce yeniden dener; çalıştırıcı stderr'deki
  # "Free usage limit" satırını görünce ILK'yı beklemeden modeli bırakır, neden kota; hepsi kotaysa çıkış 6 (eskale yok)
  local hata='timestamp=x level=ERROR message="stream error" error.error="AI_APICallError: Free usage limit reached. Free models work in OpenCode"'
  setup "$(plan 'm/a, m/b' '  - Kapı: `test -f cikti.txt`')" "davran(){ echo '$hata' >&2; (sleep 31340 &); sleep 60; }"; commit0
  ILK=30 SURE=60 kos
  kontrol '[ "$KOD" = 6 ]'
  kontrol '[ "$SN" -lt 15 ]'   # ILK (30 sn) beklenmemeli
  kontrol '[ "$(neden_listesi)" = kota,kota ]'
  kontrol 'grep -q kota "$T/cikti.txt"'
  kontrol '! yetim 31340'
  kontrol '[ "$(git rev-parse HEAD)" = "$CP" ]'
  setup "$(plan 'm/a, m/b' '  - Kapı: `test -f cikti.txt`')" "davran(){ if [ \"\$1\" = m/a ]; then echo '$hata' >&2; sleep 60; else echo x > cikti.txt; fi; }"; commit0
  ILK=30 SURE=60 kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$SN" -lt 15 ]'
  kontrol '[ "$(neden_listesi)" = kota,- ]'
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; }'; commit0; kos
  kontrol 'grep -q -- "--print-logs" "$RUNNER" && grep -q -- "--log-level ERROR" "$RUNNER"'   # gerçek opencode hatayı yalnız böyle stderr'e yazar
}
c_butce() {
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`
  - Bütçe: 1000')" 'davran(){ echo "{\"type\":\"step_finish\",\"part\":{\"tokens\":{\"total\":600},\"cost\":0}}"; sleep 1
    echo "{\"type\":\"step_finish\",\"part\":{\"tokens\":{\"total\":600},\"cost\":0}}"; (sleep 31337 &); sleep 60; }'; commit0
  kos
  kontrol '[ "$KOD" = 2 ]'
  kontrol '[ "$SN" -lt 25 ]'
  kontrol '[ "$(neden_listesi)" = butce ]'
  kontrol '! yetim 31337'
}
c_butce_model() {
  # bütçe model başınadır: m/a aşınca m/b kendi bütçesiyle denenir ve geçebilir
  setup "$(plan 'm/a, m/b' '  - Kapı: `test -f cikti.txt`
  - Bütçe: 1000')" 'davran(){ if [ "$1" = m/a ]; then echo "{\"type\":\"step_finish\",\"part\":{\"tokens\":{\"total\":1200},\"cost\":0}}"; sleep 60;
    else echo "{\"type\":\"step_finish\",\"part\":{\"tokens\":{\"total\":900},\"cost\":0}}"; echo x > cikti.txt; fi; }'; commit0
  kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$(neden_listesi)" = butce,- ]'   # aşan model ikinci kez denenmez
  setup "$(plan 'm/a, m/b' '  - Kapı: `test -f cikti.txt`
  - Bütçe: 1000')" 'davran(){ echo "{\"type\":\"step_finish\",\"part\":{\"tokens\":{\"total\":1200},\"cost\":0}}"; sleep 60; }'; commit0
  kos
  kontrol '[ "$KOD" = 2 ]'
  kontrol '[ "$(neden_listesi)" = butce,butce ]'
}
c_butce_ok() {
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`
  - Bütçe: 100000')" 'davran(){ echo x > cikti.txt; }'; commit0; kos
  kontrol '[ "$KOD" = 0 ]'
}
c_sorun() {
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ echo "plan eksik" > SORUN.md; echo x > cikti.txt; }'; commit0; kos
  kontrol '[ "$KOD" = 2 ]'   # kapı geçse bile SORUN.md varsa deneme başarısız
  kontrol 'ls .mdk-log/sorun-1-* >/dev/null 2>&1'   # reset öncesi kopyalanmalı
  kontrol '[ "$(neden_listesi)" = sorun ]'
  kontrol '[ "$(git rev-parse HEAD)" = "$CP" ]'
}
c_once() {
  setup "$(plan 'm/a, m/b' '  - Kapı: `test -f cikti.txt`')" 'davran(){ :; }'; commit0; kos ONCE=m/b
  kontrol '[ "$(paste -sd, "$T/modeller.log")" = m/b,m/a ]'
}
c_deney() {   # adım 70: istek sayısı, deney etiketi, metrik/durum dosyası dışarıda
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; echo "{\"type\":\"step_finish\",\"part\":{\"tokens\":{\"total\":50},\"cost\":0}}"; }'; commit0
  kos
  kontrol '[ "$(metrik "r[0].istek")" = 2 ]'
  kontrol '[ "$(metrik "r[0].deney")" = null ]'
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; }'; commit0
  kos MDK_METRIK="$T/dis.jsonl" MDK_DURUM="$T/dis-durum.json" MDK_DENEY=L1
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ ! -e metrikler.jsonl ] && [ ! -e durum.json ]'
  kontrol 'node -e "const r=JSON.parse(require(\"fs\").readFileSync(\"$T/dis.jsonl\",\"utf8\").trim());process.exit(r.deney===\"L1\"&&r.istek===1&&r.gecti?0:1)"'
  kontrol 'node -e "const d=JSON.parse(require(\"fs\").readFileSync(\"$T/dis-durum.json\",\"utf8\"));process.exit(d.deney===\"L1\"&&d.durum===\"gecti\"?0:1)"'
}

SECILEN=${*:-$HEPSI}; SECILEN=${SECILEN//temel/$TEMEL}
for CASE in $SECILEN; do
  declare -F "c_$CASE" >/dev/null || { echo "bilinmeyen vaka: $CASE"; exit 64; }
  echo "· $CASE"; "c_$CASE"; cd /
done
[ $FAIL = 0 ] && echo "mdk-adim.test ok" || { echo "mdk-adim.test BAŞARISIZ"; exit 1; }
