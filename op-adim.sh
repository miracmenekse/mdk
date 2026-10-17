#!/usr/bin/env bash
# Kullanım (proje kökünde): op-adim.sh <adım-no> [plan-dosyası]
# PLAN.md adımını ücretsiz modellerden başlayarak OpenCode'a yaptırır, "Kapı" komutuyla doğrular.
# Çıkış: 0 geçti | 2 eskale (modeller tükendi, kodcu/Claude devralsın) | 3 bu adım opencode'un değil | 4 ön koşul
set -uo pipefail
N=${1:?adım no}; PLAN=${2:-PLAN.md}
DENEME=${DENEME:-2}   # model başına deneme
SURE=${SURE:-600}     # deneme başına saniye
LOGD=.op-log; mkdir -p "$LOGD"

# adım bloğu: "- [ ] N." satırından bir sonraki adım/kategoriye kadar
blok=$(awk -v n="$N" '
  $0 ~ "^- \\[[ x]\\] "n"\\." {on=1; print; next}
  on && (/^- \[/ || /^## /) {exit}
  on {print}' "$PLAN")
[ -n "$blok" ] || { echo "adım $N bulunamadı"; exit 4; }
baslik=$(head -1 <<<"$blok" | sed -E 's/^- \[.\] [0-9]+\.\s*//')
head -1 <<<"$blok" | grep -q '^- \[x\]' && { echo "adım $N zaten bitmiş"; exit 0; }

kapi=$(grep -m1 -oP '^\s*- Kapı: `\K[^`]+' <<<"$blok")
[ -n "$kapi" ] || { echo "adım $N için Kapı yok"; exit 4; }
yur=$(grep -m1 -oP '^\s*- Yürütücü: \K\S+' <<<"$blok" || grep -m1 -oP '^Yürütücü: \K\S+' "$PLAN")
[ "${yur:-kodcu}" = opencode ] || { echo "adım $N yürütücüsü ${yur:-kodcu}"; exit 3; }
IFS=, read -ra MODELLER <<<"$(grep -m1 -oP '^Modeller: \K.*' "$PLAN" | tr -d ' ')"
[ ${#MODELLER[@]} -gt 0 ] || { echo "PLAN'da Modeller satırı yok"; exit 4; }

# geri alma güvenliği: temiz git ağacı şart (kontrol noktası = HEAD)
git rev-parse --git-dir >/dev/null 2>&1 || { echo "git deposu değil"; exit 4; }
[ -z "$(git status --porcelain)" ] || { echo "çalışma ağacı kirli; önce commit et"; exit 4; }
CP=$(git rev-parse HEAD)

# küçük JSON yardımcıları (jq yok)
yaz_durum() { D_ADIM=$N D_BASLIK=$baslik D_MODEL=${1:-} D_DENEME=${2:-0} D_DURUM=$3 node -e '
  const e=process.env; require("fs").writeFileSync("durum.json", JSON.stringify({adim:+e.D_ADIM,baslik:e.D_BASLIK,
  model:e.D_MODEL,deneme:+e.D_DENEME,durum:e.D_DURUM,ts:Date.now()}))'; }
yaz_metrik() { M_JSON="$1" node -e 'require("fs").appendFileSync("metrikler.jsonl", process.env.M_JSON+"\n")'; }
topla() { node -e '                       // step_finish olaylarından token+maliyet
  let t=0,c=0; for (const l of require("fs").readFileSync(process.argv[1],"utf8").split("\n")) {
    try { const e=JSON.parse(l); if (e.type==="step_finish") { t+=e.part.tokens.total; c+=e.part.cost||0 } } catch {} }
  console.log(t, c)' "$1"; }

# başsız çalışmada izin sormasın; sudo/push yasak (AGENTS.md ile birlikte)
export OPENCODE_CONFIG_CONTENT='{"permission":{"edit":"allow","bash":{"*":"allow","sudo *":"deny","git push*":"deny"}}}'

ipucu=""
for m in "${MODELLER[@]}"; do
  for ((d=1; d<=DENEME; d++)); do
    yaz_durum "$m" "$d" calisiyor
    log="$LOGD/adim$N-$(date +%s).jsonl"; t0=$(date +%s)
    timeout "$SURE" opencode run -m "$m" --format json \
      "PLAN.md içindeki $N numaralı adımı yap, yalnızca onu. Adım:
$blok
$ipucu" </dev/null >"$log" 2>"$log.err"   # stdin kapalı: timeout'un süreç grubunda tty okuması takılıyordu
    bash -c "$kapi" >"$log.kapi" 2>&1; kod=$?
    git add -A; read -r ek sil dos < <(git diff --cached --numstat | awk '{a+=$1;s+=$2;f++} END{print a+0,s+0,f+0}')
    read -r tok mal < <(topla "$log")
    yaz_metrik "{\"ts\":$(date +%s),\"adim\":$N,\"yurutucu\":\"opencode\",\"model\":\"$m\",\"deneme\":$d,\"gecti\":$([ $kod = 0 ] && echo true || echo false),\"sure_sn\":$(( $(date +%s)-t0 )),\"token\":$tok,\"maliyet\":$mal,\"eklenen\":$ek,\"silinen\":$sil,\"dosya\":$dos}"
    if [ $kod = 0 ]; then
      sed -i -E "s/^- \[ \] $N\./- [x] $N./" "$PLAN"; git add -A
      git commit -qm "adım $N: $baslik ($m, deneme $d)"; yaz_durum "$m" "$d" gecti
      echo "adım $N geçti ($m, deneme $d)"; exit 0
    fi
    ipucu="Önceki deneme kapıyı geçemedi. Kapı çıktısının sonu:
$(tail -c 1500 "$log.kapi")"
    git reset -q --hard "$CP"; git clean -fdq    # temiz başlangıç (ignore'lanan metrik/log dosyaları kalır)
    echo "adım $N: $m deneme $d kapıdan geçemedi"
  done
done
yaz_durum "" 0 eskale; echo "adım $N eskale: tüm modeller tükendi"; exit 2
