#!/usr/bin/env bash
# adım 86: mdk-incele.sh testi. Sahte `opencode` (v2 text olayları) ile, geçici git deposunda, ağsız.
# Kullanım: bash test/mdk-incele.test.sh
KOK=$(cd "$(dirname "$0")/.." && pwd); RUNNER=$KOK/mdk-incele.sh
FAIL=0; CASE=""
kontrol() { eval "$1" || { echo "BAŞARISIZ [$CASE]: $1  (çıktı: $T/cikti.txt)"; FAIL=1; }; }

setup() { # $1 m/i1 yanıtı, $2 m/i2 yanıtı (\n kaçışlı)
  T=$(mktemp -d); R=$T/proje; mkdir -p "$T/bin" "$R"; export STUB_DIR=$T
  printf '%s' "$1" >"$T/y1"; printf '%s' "$2" >"$T/y2"
  cat >"$T/bin/opencode" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$STUB_DIR/argv"
while [ $# -gt 0 ]; do case $1 in -m) M=$2; shift;; --agent) A=$2; shift;; esac; shift; done
echo "$M|$A" >>"$STUB_DIR/cagri.log"
y=$([ "$M" = m/i1 ] && cat "$STUB_DIR/y1" || cat "$STUB_DIR/y2")
node -e 'console.log(JSON.stringify({type:"text",part:{type:"text",text:process.argv[1].replace(/\\n/g,"\n")}}))' "$y"
echo '{"type":"step_finish","part":{"tokens":{"total":100},"cost":0}}'
STUB
  chmod +x "$T/bin/opencode"
  cd "$R" && git init -q && git config user.name t && git config user.email t@t
  printf 'durum.json\nmetrikler.jsonl\n.mdk-log/\n' >.gitignore
  printf 'Yürütücü: opencode\nModeller: m/a\nGörev inceleme: m/i1, m/i2\n\n## K\n- [x] 1. Bir\n  - Ne: NE-ISARET dosyası yaz\n  - Kapı: `test -f x.txt`\n\n- [ ] 2. İki\n  - Ne: başka\n  - Kapı: `true`\n' >PLAN.md
  git add -A; git commit -qm c0
  echo DIFF-ISARET >x.txt; git add -A; git commit -qm "adım 1: Bir (m/a, deneme 1)"
  echo HEAD-ISARET >y.txt; git add -A; git commit -qm "başka iş"
}
kos() { ( cd "$R"; env PATH="$T/bin:$PATH" MDK_OPENCODE=opencode bash "$RUNNER" "$@" ) >"$T/cikti.txt" 2>&1; KOD=$?; cd "$R"; }
satir() { grep '"tur":"inceleme"' metrikler.jsonl 2>/dev/null; }

CASE=uyumlu
setup 'UYUM: 92\n- plana uygun' 'UYUM: 10'; kos 1
kontrol '[ "$KOD" = 0 ]'
kontrol '[ "$(cat $T/cagri.log)" = "m/i1|plan" ]'                     # yalnız ilk model, salt-okunur plan ajanı
kontrol 'grep -q NE-ISARET $T/argv && grep -q DIFF-ISARET $T/argv'     # adım metni + o adımın diff'i
kontrol '! grep -q HEAD-ISARET $T/argv'                                # HEAD'deki ilgisiz commit değil
kontrol 'satir | grep -q "\"adim\":1" && satir | grep -q "\"inceleme\":\"uyumlu\"" && satir | grep -q 92'
kontrol 'grep -q "UYUM: 92" $T/cikti.txt'

CASE=kismen_yedek  # ilk model biçimsiz → yedek; 60 → kismen
setup 'bilmiyorum' 'UYUM: 60\n- eksik vaka'; kos 1
kontrol '[ "$KOD" = 0 ] && [ "$(cut -d"|" -f1 $T/cagri.log | paste -sd,)" = "m/i1,m/i2" ]'
kontrol 'satir | grep -q "\"inceleme\":\"kismen\""'

CASE=uyumsuz
setup 'UYUM: 30\n- yanlış dosya' 'UYUM: 99'; kos 1
kontrol '[ "$KOD" = 0 ] && satir | grep -q "\"inceleme\":\"uyumsuz\""'

CASE=hep_bozuk  # iki model de biçimsiz: çıkış 2, kayıt yok
setup 'olmaz' 'UYUM: yüksek'; kos 1
kontrol '[ "$KOD" = 2 ] && [ -z "$(satir)" ]'

CASE=commit_yok  # adımın commit'i yok: çıkış 4, model çağrılmaz, HEAD'e düşmez
setup 'UYUM: 90' 'UYUM: 90'; kos 2
kontrol '[ "$KOD" = 4 ] && [ ! -f $T/cagri.log ]'

[ $FAIL = 0 ] && echo "mdk-incele.test ok" || { echo "mdk-incele.test BAŞARISIZ"; exit 1; }
