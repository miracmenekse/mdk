#!/usr/bin/env bash
# adım 85: mdk-paralel.sh testi. Sahte `opencode` ile, geçici git deposunda, ağsız.
# Kullanım: bash test/mdk-paralel.test.sh
KOK=$(cd "$(dirname "$0")/.." && pwd); RUNNER=$KOK/mdk-paralel.sh
FAIL=0; CASE=""
kontrol() { eval "$1" || { echo "BAŞARISIZ [$CASE]: $1  (çıktı: $T/cikti.txt)"; FAIL=1; }; }

setup() { # $1 adım 1 Ne, $2 adım 2 Ne, $3 adım 2 kapı dosyası (varsayılan b.txt)
  T=$(mktemp -d); R=$T/proje; mkdir -p "$T/bin" "$R"; export STUB_DIR=$T
  cat >"$T/bin/opencode" <<'STUB'
#!/usr/bin/env bash
A="$*"; while [ $# -gt 0 ]; do case $1 in -m) M=$2; shift;; esac; shift; done
echo "$M" >>"$STUB_DIR/modeller.log"; sleep 3
# istemdeki işarete göre dosya yaz: YAZ:<dosya>=<içerik>
for w in $(grep -oP 'YAZ:\K[^ `]+' <<<"$A"); do echo "${w#*=}" >"${w%%=*}"; done
echo '{"type":"step_finish","part":{"tokens":{"total":100},"cost":0}}'
STUB
  chmod +x "$T/bin/opencode"
  cd "$R" && git init -q -b main && git config user.name t && git config user.email t@t
  printf 'durum.json\nmetrikler.jsonl\n.mdk-log/\n' >.gitignore
  printf 'Yürütücü: opencode\nModeller: m/a, m/b\n\n## K\n- [ ] 1. Bir\n  - Ne: YAZ:%s\n  - Kapı: `test -f %s`\n\n- [ ] 2. İki\n  - Ne: YAZ:%s\n  - Kapı: `test -f %s`\n' "$1" "${1%%=*}" "$2" "${3:-b.txt}" >PLAN.md
  git add -A; git commit -qm c0
}
kos() { local t0=$(date +%s)
  ( cd "$R"; env PATH="$T/bin:$PATH" MDK_OPENCODE=opencode MDK_KILIT=$T/kilit MDK_KILIT_BEKLE=1 POLL=1 DENEME=1 SURE=30 bash "$RUNNER" "$@" ) >"$T/cikti.txt" 2>&1
  KOD=$?; SN=$(( $(date +%s)-t0 )); cd "$R"; }

CASE=ayri  # iki adım ayrı dosyalarda: paralel koşar, ikisi de ana dalda, [x] ana dalda
setup a.txt=A b.txt=B; kos 1 2
kontrol '[ "$KOD" = 0 ]'
kontrol '[ "$SN" -lt 6 ]'                                   # sıralı olsaydı ≥6 sn
kontrol '[ "$(git branch --show-current)" = main ] && [ "$(cat a.txt)" = A ] && [ "$(cat b.txt)" = B ]'
kontrol 'grep -q "^- \[x\] 1\." PLAN.md && grep -q "^- \[x\] 2\." PLAN.md'
kontrol '[ -z "$(git status --porcelain)" ]'
kontrol '[ "$(git worktree list | wc -l)" = 1 ]'           # biten worktree silinir
kontrol 'git rev-parse -q --verify mdk/1 >/dev/null && git rev-parse -q --verify mdk/2 >/dev/null'  # dallar kalır
kontrol '[ "$(grep -c "\"gecti\":true" metrikler.jsonl)" = 2 ]'  # metrik ana depoya
kontrol 'grep -qE "^\|? *1\b.*m/" $T/cikti.txt && grep -qE "^\|? *2\b.*m/" $T/cikti.txt'  # özet tablo

CASE=cakisma  # aynı dosya: 1 işlenir, 2 çakışır → çıkış 9, cherry-pick yarım kalmaz
setup ortak.txt=A ortak.txt=B ortak.txt; kos 1 2
kontrol '[ "$KOD" = 9 ]'
kontrol '[ "$(cat ortak.txt)" = A ] && grep -q "^- \[x\] 1\." PLAN.md && grep -q "^- \[ \] 2\." PLAN.md'
kontrol '[ -z "$(git status --porcelain)" ] && [ ! -e "$(git rev-parse --git-path CHERRY_PICK_HEAD)" ]'
kontrol 'grep -q "mdk/2" $T/cikti.txt'

CASE=kalan  # adım 2 kapıdan kalır: 1 işlenir, çıkış 2
setup a.txt=A yok.txt=x b.txt; kos 1 2
kontrol '[ "$KOD" = 2 ]'
kontrol '[ "$(cat a.txt)" = A ] && grep -q "^- \[x\] 1\." PLAN.md && grep -q "^- \[ \] 2\." PLAN.md'
kontrol '[ -z "$(git status --porcelain)" ]'

CASE=kullanim  # argümansız: çıkış 4, hiçbir şey koşmaz
setup a.txt=A b.txt=B; kos
kontrol '[ "$KOD" = 4 ] && [ ! -f $T/modeller.log ]'

[ $FAIL = 0 ] && echo "mdk-paralel.test ok" || { echo "mdk-paralel.test BAŞARISIZ"; exit 1; }
