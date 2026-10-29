#!/usr/bin/env bash
# mdk-adim.sh testi: sahte `opencode` ile, geçici git deposunda, ağsız ve hızlı.
# Kullanım: bash test/mdk-adim.test.sh [vaka|grup ...]   (boşsa hepsi; grup: temel)
RUNNER=$(cd "$(dirname "$0")/.." && pwd)/mdk-adim.sh
FAIL=0; CASE=""
TEMEL="gecer ikinci eskale donmus kurcalama"
HEPSI="$TEMEL coklu onay neden sure yanit_yok kota butce butce_model butce_ok sorun once deney cursor cursor_kota v2 v1_token v2_kota v2_kota_metin gorev gorev_adim gorev_yok gorev_varsayilan kilit_bekle kilit_ikinci kilit_tavan plan_dokunma ortam_yalitim"

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
  ( cd "$R"; env PATH="$T/bin:$PATH" MDK_OPENCODE=opencode POLL=1 DENEME="${DENEME:-1}" SURE="${SURE:-30}" "$@" bash "${RUN:-$RUNNER}" 1 ) >"$T/cikti.txt" 2>&1
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
  kontrol 'grep -q -- "--print-logs" "$RUNNER"'   # gerçek opencode hatayı yalnız böyle stderr'e yazar (seviye: v1 --log-level, v2 OPENCODE_LOG_LEVEL)
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

c_v2() {   # adım 72: OpenCode v2 biçimi (step_finish'te total yok, son adımda step_finish yok), v2 çağrısı
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; }'; commit0
  cat >"$T/bin/opencode" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$@" >"$STUB_DIR/argv"; printf '%s\n' "$OPENCODE_LOG_LEVEL" >"$STUB_DIR/loglevel"; printf '%s\n' "$OPENCODE_CONFIG_CONTENT" >"$STUB_DIR/config"
echo x > cikti.txt
echo '{"type":"step_start"}'
echo '{"type":"step_finish","part":{"tokens":{"input":100,"output":10,"reasoning":5,"cache":{"read":1000,"write":0}},"cost":0}}'
echo '{"type":"step_start"}'
echo '{"type":"step_finish","part":{"tokens":{"input":20,"output":4,"reasoning":0,"cache":{"read":1100,"write":0}},"cost":0}}'
echo '{"type":"step_start"}'
echo '{"type":"text","part":{"text":"bitti"}}'
STUB
  kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$(metrik "r[0].token")" = 2239 ]'      # input+output+reasoning+cache.read+cache.write
  kontrol '[ "$(metrik "r[0].etkin")" = 139 ]'       # cache.read hariç
  kontrol '[ "$(metrik "r[0].istek")" = 3 ]'         # step_start sayısı (son adımda step_finish yok)
  kontrol 'grep -qx -- --standalone "$T/argv"'       # her koşu kendi sunucusu: süreç grubu öldürülünce oturum da biter
  kontrol '! grep -q -- --log-level "$T/argv"'       # v2'de bayrak süzmüyor; ortam değişkeni
  kontrol 'grep -qix error "$T/loglevel"'
  kontrol 'grep -q "\"external_directory\":\"deny\"" "$T/config"'   # v2'de varsayılan allow
  kontrol 'grep -q "\"shell\":{" "$T/config"'                     # v2: bash izni "shell" adını aldı
}
c_v1_token() {   # adım 72: v1 satırı (total var) eskisi gibi sayılır
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; }'; commit0; kos
  kontrol '[ "$(metrik "r[0].token")" = 100 ]'
}
c_v2_kota() {   # adım 72: v2 kota hatasını stdout'ta error olayı olarak basar; ILK beklenmeden bırakılır
  local hata='{"type":"error","error":{"type":"provider.error","message":"Free usage limit reached. Free models work in OpenCode"}}'
  setup "$(plan 'm/a, m/b' '  - Kapı: `test -f cikti.txt`')" "davran(){ echo '$hata'; sleep 60; }"; commit0
  ILK=30 SURE=60 kos
  kontrol '[ "$KOD" = 6 ]'
  kontrol '[ "$SN" -lt 15 ]'
  kontrol '[ "$(neden_listesi)" = kota,kota ]'
}

c_cursor() {   # Cursor CLI: cursor/<model> cursor-agent ile koşar (yalnız Auto), token result.usage'dan, izinler .cursor/cli.json'da
  setup "$(plan cursor/auto '  - Kapı: `test -f cikti.txt`')" 'davran(){ :; }'; commit0
  cat >"$T/bin/cursor-agent" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$@" >"$STUB_DIR/argv"; cp .cursor/cli.json "$STUB_DIR/izin" 2>/dev/null
echo x > cikti.txt
echo '{"type":"system","subtype":"init","model":"Auto"}'
echo '{"type":"assistant","model_call_id":"a1","message":{}}'
echo '{"type":"assistant","model_call_id":"a1","message":{}}'
echo '{"type":"assistant","model_call_id":"a2","message":{}}'
echo '{"type":"assistant","message":{}}'
echo '{"type":"result","subtype":"success","is_error":false,"usage":{"inputTokens":100,"outputTokens":10,"cacheReadTokens":1000,"cacheWriteTokens":5}}'
STUB
  chmod +x "$T/bin/cursor-agent"; kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ ! -s "$T/modeller.log" ]'                 # opencode çağrılmadı
  kontrol '[ "$(metrik "r[0].yurutucu")" = cursor ] && [ "$(metrik "r[0].model")" = cursor/auto ]'
  kontrol '[ "$(metrik "r[0].token")" = 1115 ] && [ "$(metrik "r[0].etkin")" = 115 ]'   # etkin: cacheRead hariç
  kontrol '[ "$(metrik "r[0].istek")" = 2 ]'           # farklı model_call_id sayısı
  kontrol 'grep -qx -- -p "$T/argv" && grep -qx -- --trust "$T/argv" && grep -qx stream-json "$T/argv"'
  kontrol 'grep -A1 -x -- --model "$T/argv" | grep -qx auto'
  kontrol '! grep -qxE -- "--force|--yolo|-f" "$T/argv"'   # her şeye izin yok; izin listesi geçerli
  kontrol 'grep -q "\"Shell(git push)\"" "$T/izin" && grep -q "\"Shell(sudo)\"" "$T/izin"'
  kontrol '[ -z "$(git status --porcelain)" ]'          # izin dosyası ağacı kirletmez, commit'e girmez
  kontrol '! git log -1 --name-only --format= | grep -q "^\.cursor/"'
}
c_cursor_kota() {   # Cursor plan kotası dolunca: kota, model atlanır, sağlayıcı çıkışı (6)
  setup "$(plan cursor/auto '  - Kapı: `test -f cikti.txt`')" 'davran(){ :; }'; commit0
  printf '#!/usr/bin/env bash\necho "Error: You have hit your usage limit. Upgrade to Pro" >&2; exit 1\n' >"$T/bin/cursor-agent"
  chmod +x "$T/bin/cursor-agent"; DENEME=2 kos
  kontrol '[ "$KOD" = 6 ]'
  kontrol '[ "$(neden_listesi)" = kota ]'
}
c_v2_kota_metin() {   # araç çıktısında geçen "Free usage limit" metni (ör. model mdk-adim.sh'i okudu) kota sayılmaz
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; echo "{\"type\":\"tool_use\",\"part\":{\"state\":{\"output\":\"grep -q Free usage limit\"}}}"; sleep 2; }'; commit0
  kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$(neden_listesi)" = - ]'
}

# adım 82: görev türüne göre model zinciri
gplan() { printf 'Yürütücü: opencode\nModeller: m/genel\nGörev kod: m/kod1, m/kod2\nGörev kapi: m/kapi1\n\n## K\n- [ ] 1. İş\n%s\n' "$1"; }
c_gorev() {
  setup "$(gplan '  - Görev: kapi
  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; }'; commit0; kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$(cat $T/modeller.log)" = m/kapi1 ]'
  kontrol '[ "$(metrik "r[0].gorev")" = kapi ]'
}
c_gorev_adim() { # adımdaki Modeller satırı görev satırını geçer
  setup "$(gplan '  - Görev: kapi
  - Modeller: m/ozel
  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; }'; commit0; kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$(cat $T/modeller.log)" = m/ozel ]'
}
c_gorev_yok() { # tanımsız tür: çıkış 4, geçerli türler listelenir, model çağrılmaz
  setup "$(gplan '  - Görev: uydurma
  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; }'; commit0; kos
  kontrol '[ "$KOD" = 4 ]'
  kontrol 'grep -q uydurma $T/cikti.txt && grep -q kod $T/cikti.txt && grep -q kapi $T/cikti.txt'
  kontrol '[ ! -f $T/modeller.log ]'
}
c_gorev_varsayilan() { # Görev alanı yoksa kod; ilk model kalırsa ikinciye geçer
  setup "$(gplan '  - Kapı: `test -f cikti.txt`')" 'davran(){ [ "$1" = m/kod2 ] && echo x > cikti.txt; true; }'; commit0; DENEME=1 kos
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ "$(paste -sd, $T/modeller.log)" = m/kod1,m/kod2 ]'
  kontrol '[ "$(metrik "r.map(x=>x.gorev).join()")" = kod,kod ]'
}

# adım 84: model kilidi ve MDK_PLAN_DOKUNMA
iki_depo() { # $1 model listesi, $2 A'nın davran'ı, $3 B'nin davran'ı; TA/RA, TB/RB
  setup "$(plan "$1" '  - Kapı: `test -f cikti.txt`')" "$2"; commit0; TA=$T; RA=$R
  setup "$(plan "$1" '  - Kapı: `test -f cikti.txt`')" "$3"; commit0; TB=$T; RB=$R
  K=$(mktemp -d)
}
kos_ab() { # A arka planda, 1 sn sonra B önde; B'nin KOD/SN'si; ek ortam argüman
  ( cd "$RA"; env STUB_DIR=$TA PATH="$TA/bin:$PATH" MDK_OPENCODE=opencode POLL=1 DENEME=1 SURE=30 MDK_KILIT=$K MDK_KILIT_BEKLE=1 "$@" bash "$RUNNER" 1 ) >"$TA/cikti.txt" 2>&1 &
  APID=$!; sleep 1; local t0=$(date +%s)
  ( cd "$RB"; env STUB_DIR=$TB PATH="$TB/bin:$PATH" MDK_OPENCODE=opencode POLL=1 DENEME=1 SURE=30 MDK_KILIT=$K MDK_KILIT_BEKLE=1 "$@" bash "$RUNNER" 1 ) >"$TB/cikti.txt" 2>&1
  KOD=$?; SN=$(( $(date +%s)-t0 )); wait $APID; AKOD=$?; T=$TB; R=$RB
}
c_kilit_bekle() { # tek model kilitli: B bekler, A bitince alır; bekleme deneme sayılmaz
  iki_depo m/a 'davran(){ sleep 4; echo x > cikti.txt; }' 'davran(){ echo x > cikti.txt; }'
  kos_ab
  kontrol '[ "$AKOD" = 0 ] && [ "$KOD" = 0 ]'
  kontrol '[ "$SN" -ge 2 ]'
  kontrol '[ "$(cd $RB && metrik "r.length")" = 1 ]'
  kontrol '! grep -q kilitli $RB/metrikler.jsonl'
  kontrol '[ -z "$(ls $K | grep /)" ] && ls $K | grep -q "m_a"'
}
c_kilit_ikinci() { # iki model: B kilitli m/a'yı atlar, beklemeden m/b'yi alır
  iki_depo 'm/a, m/b' 'davran(){ sleep 4; echo x > cikti.txt; }' 'davran(){ echo x > cikti.txt; }'
  kos_ab
  kontrol '[ "$KOD" = 0 ] && [ "$SN" -lt 3 ]'
  kontrol '[ "$(cat $TB/modeller.log)" = m/b ]'
  kontrol '[ "$(cat $TA/modeller.log)" = m/a ]'
}
c_kilit_tavan() { # tüm modeller kilitli ve tavan dolar: çıkış 8, model çağrılmaz
  iki_depo m/a 'davran(){ sleep 8; echo x > cikti.txt; }' 'davran(){ echo x > cikti.txt; }'
  kos_ab MDK_KILIT_TAVAN=2
  kontrol '[ "$KOD" = 8 ] && [ "$SN" -lt 6 ]'
  kontrol '[ ! -f $TB/modeller.log ]'
}
c_plan_dokunma() { # geçen adım commit edilir ama PLAN.md'de [x] işaretlenmez
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt`')" 'davran(){ echo x > cikti.txt; }'; commit0; kos MDK_PLAN_DOKUNMA=1
  kontrol '[ "$KOD" = 0 ]'
  kontrol 'grep -q "^- \[ \] 1\." PLAN.md'
  kontrol 'git log -1 --format=%s | grep -q "^adım 1:"'
  kontrol '[ -z "$(git status --porcelain)" ]'
}

c_ortam_yalitim() { # dış koşunun MDK_METRIK/MDK_DURUM/MDK_PLAN_DOKUNMA'sı kapıya (ve içindeki testlere) sızmaz
  setup "$(plan m/a '  - Kapı: `test -f cikti.txt && [ -z "$MDK_METRIK$MDK_DURUM$MDK_PLAN_DOKUNMA$MDK_KILIT" ]`')" 'davran(){ echo x > cikti.txt; }'; commit0
  kos MDK_METRIK=$T/dis.jsonl MDK_DURUM=$T/dis.json MDK_PLAN_DOKUNMA=1 MDK_KILIT=$T/k
  kontrol '[ "$KOD" = 0 ]'
  kontrol '[ -f $T/dis.jsonl ] && grep -q "\"gecti\":true" $T/dis.jsonl'   # dış koşu yine ana dosyaya yazar
}

SECILEN=${*:-$HEPSI}; SECILEN=${SECILEN//temel/$TEMEL}
for CASE in $SECILEN; do
  declare -F "c_$CASE" >/dev/null || { echo "bilinmeyen vaka: $CASE"; exit 64; }
  echo "· $CASE"; "c_$CASE"; cd /
done
[ $FAIL = 0 ] && echo "mdk-adim.test ok" || { echo "mdk-adim.test BAŞARISIZ"; exit 1; }
