#!/usr/bin/env bash
# persona-tur.sh testi (adım 58): sahte `opencode` ile, ağsız. Kullanım: bash test/persona-tur.test.sh
RUNNER=$(cd "$(dirname "$0")/.." && pwd)/persona-tur.sh
FAIL=0; CASE=""
kontrol() { eval "$1" || { echo "BAŞARISIZ [$CASE]: $1"; echo "--- çıktı:"; tail -5 "$T/cikti.txt"; FAIL=1; }; }

setup() { # $1: davran() gövdesi; argümanlar: $M model, $ISTEM istem
  T=$(mktemp -d); mkdir -p "$T/bin" "$T/p"; export STUB_DIR=$T
  cat >"$T/bin/opencode" <<'STUB'
#!/usr/bin/env bash
ARGS="$*"
while [ $# -gt 0 ]; do case $1 in -m) M=$2; shift;; --agent) A=$2; shift;; run|--format|json) ;; *) ISTEM=$1;; esac; shift; done
echo "$M|$A" >>"$STUB_DIR/cagri.log"
printf '%s' "$ISTEM" >"$STUB_DIR/istem-$(echo "$ISTEM" | grep -m1 -oP 'SORU-\K[A-Z]+').txt"
source "$STUB_DIR/davran.sh"; davran
echo '{"type":"step_finish","part":{"tokens":{"total":250},"cost":0}}'
STUB
  chmod +x "$T/bin/opencode"; printf 'yanit() { printf "{\\"type\\":\\"text\\",\\"part\\":{\\"type\\":\\"text\\",\\"text\\":\\"%%s\\"}}\\n" "$1"; }\ndavran() { %s\n}\n' "$1" >"$T/davran.sh"
  cd "$T/p"
  cat >PLAN.md <<'P'
Yürütücü: opencode
Modeller: m/bir, m/iki, m/uc

## K
- [ ] 1. İş
P
  cat >personalar.md <<'P'
# Personalar
## Ortak
### Çıktı biçimi (alt ajana verilir)
BICIM-KURALI
### Ayırt edicilik şartı
AYIRT-KURALI
### Benchmark (persona değil, kanıt)
BENCH-GIZLI
## Alan: dev
Durum: denenmemiş
### Kart Bir
- **Sorusu:** "SORU-BIR"
### Kart İki / Ek
- **Sorusu:** "SORU-IKI"
### Kart Üç
- **Sorusu:** "SORU-UC"
## Alan: sunum
### Yabancı
- **Sorusu:** "YABANCI"
## Karar günlüğü
P
  echo "Problem: PROBLEM-METNI" >soru.md
}
kos() { ( cd "$T/p"; env PATH="$T/bin:$PATH" PERSONA_SURE="${SURE:-20}" "$@" ) >"$T/cikti.txt" 2>&1; KOD=$?; }
DIZ() { ls -d "$T"/p/persona-tur/*/ 2>/dev/null | head -1; }

CASE=gecerli
setup 'yanit "Seçenek A — x: tamam."'
kos bash "$RUNNER" dev soru.md "Kart Bir" "Kart İki / Ek" "Kart Üç"
kontrol '[ $KOD = 0 ]'
D=$(DIZ); kontrol '[ -n "$D" ] && [ -f "$D/ozet.md" ]'
SON=$(tail -1 $T/cikti.txt); kontrol '[ "$(cd "$T/p" && realpath "$SON")" = "$(realpath "$D")" ]'  # göreli ya da mutlak
kontrol '[ -f "$D/1-kart-bir.md" ] && ls "$D" | grep -q "^2-kart-.*-ek\.md$" && ls "$D" | grep -q "^3-kart-.*\.md$"'
kontrol 'ls "$D" | grep -q "^1-kart-bir.jsonl$"'
kontrol 'grep -q "^Model: m/bir$" "$D/1-kart-bir.md" && grep -q "^Token: 250$" "$D/1-kart-bir.md" && grep -q "^Durum: gecerli$" "$D/1-kart-bir.md"'
kontrol 'grep -q "Seçenek A — x: tamam." "$D/1-kart-bir.md"'
kontrol 'sort "$T/cagri.log" | tr "\n" " " | grep -q "^m/bir|plan m/iki|plan m/uc|plan $"'
I1=$(cat "$T"/istem-BIR.txt 2>/dev/null)
kontrol '[[ "$I1" == *SORU-BIR* && "$I1" == *BICIM-KURALI* && "$I1" == *AYIRT-KURALI* && "$I1" == *PROBLEM-METNI* ]]'
kontrol '[[ "$I1" != *SORU-IKI* && "$I1" != *BENCH-GIZLI* && "$I1" != *YABANCI* ]]'
kontrol 'grep -q "Kart Bir · m/bir · gecerli · 250 token" "$D/ozet.md" && grep -q "PROBLEM-METNI" "$D/ozet.md"'

CASE=paralel  # 3 kart x 3 sn bekleme: sıralı olsaydı ≥9 sn
setup 'sleep 3; yanit "Seçenek A — y"'
t0=$(date +%s); kos bash "$RUNNER" dev soru.md "Kart Bir" "Kart İki / Ek" "Kart Üç"; sn=$(( $(date +%s)-t0 ))
kontrol '[ $KOD = 0 ] && [ $sn -lt 8 ]'

CASE=gecersiz_sonraki_model  # m/bir biçimsiz yanıt verir → aynı kart m/iki ile yeniden
setup 'if [ "$M" = m/bir ]; then yanit "genel öğüt"; else yanit "Seçenek A — z"; fi'
kos bash "$RUNNER" dev soru.md "Kart Bir" "Kart Üç"
D=$(DIZ)
kontrol '[ $KOD = 0 ] && grep -q "^Model: m/iki$" "$D/1-kart-bir.md" && grep -q "^Durum: gecerli$" "$D/1-kart-bir.md"'
kontrol '[ "$(grep -c "^m/bir|" $T/cagri.log)" = 1 ] && [ "$(wc -l <$T/cagri.log)" = 3 ]'

CASE=ezilen_model
setup 'yanit "Seçenek A"'
kos env PERSONA_MODELLER=x/a,x/b bash "$RUNNER" dev soru.md "Kart Bir" "Kart İki / Ek" "Kart Üç"
kontrol '[ $KOD = 0 ] && [ "$(sort $T/cagri.log | tr "\n" " ")" = "x/a|plan x/a|plan x/b|plan " ]'

CASE=yetersiz  # hiçbiri geçerli değil → çıkış 1, özet yine yazılır
setup 'yanit "biçimsiz"'
kos bash "$RUNNER" dev soru.md "Kart Bir" "Kart Üç"
D=$(DIZ); kontrol '[ $KOD = 1 ] && grep -q "gecersiz" "$D/ozet.md"'

CASE=tek_gecerli_yetmez  # 2 karttan yalnız 1 geçerli → 1; tek kartlı turda 1 geçerli → 0
setup 'if [[ "$ISTEM" == *SORU-BIR* ]]; then yanit "Seçenek A"; else yanit "yok"; fi'
kos bash "$RUNNER" dev soru.md "Kart Bir" "Kart Üç"; kontrol '[ $KOD = 1 ]'
kos bash "$RUNNER" dev soru.md "Kart Bir"; kontrol '[ $KOD = 0 ]'
kontrol '[ "$(ls -d persona-tur/*/ | wc -l)" = 2 ]'  # aynı saniyedeki ikinci tur ayrı dizine (-2) yazar

CASE=sure  # takılan süreç öldürülür, durum "sure"
setup 'sleep 30; yanit "Seçenek A"'
t0=$(date +%s); SURE=2 kos bash "$RUNNER" dev soru.md "Kart Bir"; sn=$(( $(date +%s)-t0 ))
D=$(DIZ); kontrol '[ $KOD = 1 ] && [ $sn -lt 15 ] && grep -q "^Durum: sure$" "$D/1-kart-bir.md"'
kontrol '! pgrep -f "sleep 30" >/dev/null'

CASE=hatali_kullanim
setup 'yanit "Seçenek A"'
kos bash "$RUNNER" dev soru.md; kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'
kos bash "$RUNNER" yok soru.md "Kart Bir"; kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'
kos bash "$RUNNER" dev soru.md "Yok Kart"; kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'
kos bash "$RUNNER" dev soru.md "Yabancı"; kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'  # başka alanın kartı
kos bash "$RUNNER" dev yok.md "Kart Bir"; kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'
kontrol '[ ! -s $T/cagri.log ]'

CASE=gitignore; kontrol 'grep -qx "persona-tur/" "$(dirname "$RUNNER")/.gitignore"'

[ $FAIL = 0 ] && echo "persona-tur.test ok" || exit 1
