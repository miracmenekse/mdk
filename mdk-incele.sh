#!/usr/bin/env bash
# Kullanım (proje kökünde): mdk-incele.sh <adım-no> [plan-dosyası]
# İşlenmiş bir adımı plana karşı "Görev inceleme:" modelleriyle sordurur (plan ajanı, salt-okunur):
# istem = adım metni + o adımın commit diff'i. Yanıt ilk satırı `UYUM: <0-100>` olan metin olmalı;
# bozuksa yedek model denenir, o da bozuksa çıkış 2. Geçerli sonuç mdk-kayit.mjs ile inceleme kaydı
# olarak yazılır (uyum ≥80 uyumlu, 50-79 kismen, <50 uyumsuz).
# Çıkış: 0 inceleme yazıldı | 2 iki model de yorumlanabilir çıktı vermedi | 4 ön koşul (adım, commit ya da model bulunamadı)
set -uo pipefail
DIR=$(cd "$(dirname "$0")" && pwd)
N=${1:?adım no}; PLAN=${2:-PLAN.md}
POLL=${POLL:-3}       # süreç izleme aralığı, saniye
ILK=${ILK:-90}        # model bu kadar saniyede hiç olay yazmazsa atlanır (kota sessizliği)
SURE=${SURE:-300}     # deneme başına süre sınırı, saniye
OC=${MDK_OPENCODE:-$HOME/.local/opt/opencode-v2/node_modules/.bin/opencode}   # v2: v1 ücretsiz modellerde hata veriyor (#59387)
LOGD=.mdk-log; mkdir -p "$LOGD"

[ -f "$PLAN" ] || { echo "plan dosyası yok: $PLAN"; exit 4; }
# adım bloğu: "- [ ]/[/x] N." satırından bir sonraki adım/kategoriye kadar (mdk-adim.sh ile aynı)
blok=$(awk -v n="$N" '
  $0 ~ "^- \\[[ x]\\] "n"\\." {on=1; print; next}
  on && (/^- \[/ || /^## /) {exit}
  on {print}' "$PLAN")
[ -n "$blok" ] || { echo "adım $N bulunamadı"; exit 4; }

# adımın commit'i: mdk-adim.sh'in "adım N: …" konusu; yoksa HEAD'e düşme
sha=$(git log -1 --format=%H --grep "^adım ${N}: " 2>/dev/null) || true
[ -n "${sha:-}" ] || { echo "adım $N için commit yok ('adım $N: …' konusu)"; exit 4; }
commit_diff=$(git show "$sha")

# model listesi: dosyanın başındaki "Görev inceleme:" satırı
modline=$(grep -m1 -oP '^Görev inceleme: \K.*' "$PLAN" || true)
[ -n "$modline" ] || { echo "PLAN'da 'Görev inceleme:' satırı yok"; exit 4; }
IFS=, read -ra MODELLER <<<"$(tr -d ' ' <<<"$modline")"
[ ${#MODELLER[@]} -gt 0 ] || { echo "'Görev inceleme:' satırı boş"; exit 4; }

# v2 yanıtı: text olaylarının part.text birleşimi
ayikla() { node -e '
  let metin = "";
  for (const satir of require("fs").readFileSync(process.argv[1], "utf8").split("\n")) {
    try { const x = JSON.parse(satir); if (x.type === "text") metin += x.part?.text ?? ""; } catch {}
  }
  process.stdout.write(metin)' "$1" 2>/dev/null; }

istem="Aşağıda bir PLAN.md adımı ve o adıma ait commit diff'i var. Bu bir inceleme görevi: kod yazma, dosya yaratma ya da değiştirme yok (plan ajanı salt-okunur).
İstek: diff'in adımın 'Ne:' maddelerini gerçekten yaptığını, yarım ya da kapıyı geçirmek için boş bırakılmış bir çözüm bırakmadığını değerlendir; iş eksikse ya da anlamsızsa puanı düşür.
Biçim: İLK SATIR tam olarak 'UYUM: <0-100>' olsun; ardından en çok 5 maddede bulgularını yaz.

Adım (${N}):
$blok

Commit diff'i (git show $sha):
$commit_diff"

sinif=""; uyum=""
for m in "${MODELLER[@]}"; do
  log="$LOGD/incele$N-$(date +%s).jsonl"; neden=""
  # setsid: süreç kendi grubunun lideri; bekletince grup topluca öldürülür. stdin kapalı: tty okuması takılmasın
  OPENCODE_LOG_LEVEL=error setsid "$OC" run --standalone --format json -m "$m" --agent plan "$istem" \
    </dev/null >"$log" 2>"$log.err" &
  pid=$!; t0=$SECONDS
  while kill -0 "$pid" 2>/dev/null; do
    sleep "$POLL"
    if [ ! -s "$log" ] && [ $((SECONDS - t0)) -ge "$ILK" ]; then neden=yanit_yok   # kota sessizliği: yedek modele geç
    elif [ $((SECONDS - t0)) -ge "$SURE" ]; then neden=sure
    fi
    [ -z "$neden" ] || { kill -TERM -- -"$pid" 2>/dev/null; sleep 2; kill -KILL -- -"$pid" 2>/dev/null; break; }
  done
  wait "$pid" 2>/dev/null
  pgrep -g "$pid" >/dev/null 2>&1 && kill -KILL -- -"$pid" 2>/dev/null   # grupta kalan yetim süreç
  metin=$(ayikla "$log")
  uyum=$(awk 'NR==1 && $0 ~ /^UYUM: [0-9]+$/ {print substr($0,7); exit}' <<<"$metin")
  if [ -n "$uyum" ] && [ "$uyum" -le 100 ]; then
    maddeler=$(tail -n +2 <<<"$metin" | sed 's/^[ \t]*//; s/[ \t]*$//' | grep -v '^$' | head -n 5 | paste -sd';' -)
    not="UYUM $uyum: $maddeler"
    if   [ "$uyum" -ge 80 ]; then sinif=uyumlu
    elif [ "$uyum" -ge 50 ]; then sinif=kismen
    else                          sinif=uyumsuz
    fi
    node "$DIR/mdk-kayit.mjs" "$N" --inceleme "$sinif" --not "$not"
    break
  fi
  echo "adım $N: $m incelemesi biçimsiz yanıt verdi, yedek modele geçiliyor"
done
[ -n "$sinif" ] || { echo "adım $N: iki model de yorumlanabilir inceleme çıktısı vermedi"; exit 2; }

echo "UYUM: $uyum"
echo "İnceleme: $sinif (metrikler.jsonl'a yazıldı)"
[ "$uyum" -ge 80 ] || echo "uyum < 80: diff'i Claude kendisi okumalı"
exit 0
