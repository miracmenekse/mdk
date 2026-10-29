#!/usr/bin/env bash
# Kullanım (proje kökünde): mdk-paralel.sh <no> <no>...
# Her adımı kendi git worktree'sinde (dal mdk/<no>, ana dalın HEAD'inden) mdk-adim.sh ile paralel koşturur.
# Geçenleri numara sırasıyla ana dala cherry-pick eder ve PLAN.md'de [x] işaretler.
# Çıkış: 0 hepsi işlendi | 2 en az bir adım geçmedi (geçenler işlendi) | 9 çakışma | 4 argüman yok ya da ana ağaç kirli
set -uo pipefail
[ $# -gt 0 ] || { echo "kullanım: mdk-paralel.sh <no> <no>..." >&2; exit 4; }
SELF=$(cd "$(dirname "$0")" && pwd)
ANA=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "git deposu değil" >&2; exit 4; }
cd "$ANA" || exit 4
[ -z "$(git status --porcelain)" ] || { echo "ana ağaç kirli; önce commit et" >&2; exit 4; }

NOS=$(printf '%s\n' "$@" | sort -n)
ALAN=$(basename "$ANA"); WTD=$(dirname "$ANA")/.mdk-wt
LOGD=$ANA/.mdk-log; mkdir -p "$LOGD" "$WTD"
M0=$(cat metrikler.jsonl 2>/dev/null | wc -l)
declare -A PID RC SN MOD CP

git worktree prune
for n in $NOS; do
  wt=$WTD/$ALAN-$n
  [ -e "$wt" ] && git worktree remove --force "$wt"
  rm -f "$LOGD/paralel-$n.son"
  if ! git worktree add -q -B "mdk/$n" "$wt" HEAD 2>"$LOGD/paralel-$n.log"; then
    RC[$n]=4; SN[$n]=0; echo "worktree açılamadı: adım $n" >&2; continue
  fi
  ( s=$(date +%s)
    ( cd "$wt" && MDK_PLAN_DOKUNMA=1 MDK_METRIK="$ANA/metrikler.jsonl" MDK_DURUM="$ANA/durum.json" bash "$SELF/mdk-adim.sh" "$n" ) >"$LOGD/paralel-$n.log" 2>&1
    echo "$? $(( $(date +%s)-s ))" >"$LOGD/paralel-$n.son" ) &
  PID[$n]=$!
done

for n in $NOS; do
  [ -n "${PID[$n]:-}" ] && wait "${PID[$n]}"
  if [ -z "${RC[$n]:-}" ]; then
    read -r RC[$n] SN[$n] <"$LOGD/paralel-$n.son" 2>/dev/null || { RC[$n]=4; SN[$n]=0; }
  fi
  MOD[$n]=$(tail -n +$((M0 + 1)) metrikler.jsonl 2>/dev/null | grep "\"adim\":$n," | tail -1 | grep -oP '"model":"\K[^"]*')
  MOD[$n]=${MOD[$n]:--}
done

sonuc() { case $1 in 0) echo geçti;; 2) echo eskale;; 4) echo "ön koşul";; 6) echo sağlayıcı;; 8) echo kilitli;; *) echo "hata $1";; esac; }

# geçenleri numara sırasıyla ana dala al; çakışmada dur (yarım kalan cherry-pick iptal edilir)
CAKISMA=""
for n in $NOS; do
  [ "${RC[$n]}" = 0 ] || continue
  mapfile -t C < <(git rev-list --reverse "HEAD..mdk/$n")
  if [ ${#C[@]} -gt 0 ] && ! git cherry-pick "${C[@]}" >"$LOGD/cp-$n.log" 2>&1; then
    git cherry-pick --abort >/dev/null 2>&1 || true
    CP[$n]=çakıştı; CAKISMA=$n; break
  fi
  CP[$n]=alındı
  sed -i -E "s/^- \[ \] $n\./- [x] $n./" PLAN.md
  if ! git diff --quiet -- PLAN.md; then
    git add PLAN.md && git commit -qm "adım $n: [x] işaretlendi (paralel)"
  fi
done

# biten worktree'leri sil; dallar kalır
for n in $NOS; do
  wt=$WTD/$ALAN-$n
  [ -e "$wt" ] && git worktree remove --force "$wt"
done
git worktree prune

echo "| adım | model | sonuç | sn |"
echo "|---|---|---|---|"
for n in $NOS; do
  s=$(sonuc "${RC[$n]}")
  [ "${RC[$n]}" = 0 ] && [ -z "${CP[$n]:-}" ] && s="$s, işlenmedi"
  [ -n "${CP[$n]:-}" ] && s="$s, ana dala ${CP[$n]}"
  echo "| $n | ${MOD[$n]} | $s | ${SN[$n]} |"
done

if [ -n "$CAKISMA" ]; then
  echo "ÇAKIŞMA: adım $CAKISMA (dal mdk/$CAKISMA) ana dala alınamadı; sonraki adımlar işlenmedi" >&2
  exit 9
fi
for n in $NOS; do [ "${RC[$n]}" = 0 ] || exit 2; done
exit 0
