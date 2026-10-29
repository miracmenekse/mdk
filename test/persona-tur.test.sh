#!/usr/bin/env bash
# persona-tur.sh testi (adım 58): sahte `opencode` ile, ağsız. Kullanım: bash test/persona-tur.test.sh
RUNNER=$(cd "$(dirname "$0")/.." && pwd)/persona-tur.sh
FAIL=0; CASE=""
kontrol() { eval "$1" || { echo "BAŞARISIZ [$CASE]: $1"; echo "--- çıktı:"; tail -5 "$T/cikti.txt"; FAIL=1; }; }

setup() { # $1: davran() gövdesi; argümanlar: $M model, $ISTEM istem
  T=$(mktemp -d); mkdir -p "$T/bin" "$T/p"; export STUB_DIR=$T
  cat >"$T/bin/opencode" <<'STUB'
#!/usr/bin/env bash
ARGS="$*"; printf '%s\n' "$@" >"$STUB_DIR/argv"; printf '%s\n' "$OPENCODE_LOG_LEVEL" >"$STUB_DIR/loglevel"
while [ $# -gt 0 ]; do case $1 in -m) M=$2; shift;; --agent) A=$2; shift;; run|--format|json) ;; *) ISTEM=$1;; esac; shift; done
echo "$M|$A" >>"$STUB_DIR/cagri.log"
printf '%s' "$ISTEM" >"$STUB_DIR/istem-$(echo "$ISTEM" | grep -m1 -oP 'SORU-\K[A-Z]+').txt"
source "$STUB_DIR/davran.sh"; davran
echo '{"type":"step_finish","part":{"tokens":{"input":200,"output":30,"reasoning":20,"cache":{"read":0,"write":0}},"cost":0}}'   # v2: total yok
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
kos() { ( cd "$T/p"; env PATH="$T/bin:$PATH" MDK_OPENCODE=opencode OPENCODE_DB="${OPENCODE_DB:-$T/yok.db}" PERSONA_SURE="${SURE:-20}" "$@" ) >"$T/cikti.txt" 2>&1; KOD=$?; }
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

CASE=sessiz  # m/bir hiç çıktı vermez (kota sessizliği) → PERSONA_ILK sn sonra atlanır, m/iki ile geçer
setup 'if [ "$M" = m/bir ]; then sleep 30; fi; yanit "Seçenek A — s"'
t0=$(date +%s); kos env PERSONA_ILK=2 bash "$RUNNER" dev soru.md "Kart Bir"; sn=$(( $(date +%s)-t0 ))
D=$(DIZ); kontrol '[ $KOD = 0 ] && [ $sn -lt 10 ] && grep -q "^Model: m/iki$" "$D/1-kart-bir.md" && grep -q "^Durum: gecerli$" "$D/1-kart-bir.md"'
kontrol '! pgrep -f "sleep 30" >/dev/null'

CASE=hep_sessiz  # iki model de sessiz → durum "sessiz", tur süre dolmadan biter
setup 'sleep 30; yanit "Seçenek A"'
t0=$(date +%s); kos env PERSONA_ILK=2 bash "$RUNNER" dev soru.md "Kart Bir"; sn=$(( $(date +%s)-t0 ))
D=$(DIZ); kontrol '[ $KOD = 1 ] && [ $sn -lt 10 ] && grep -q "^Durum: sessiz$" "$D/1-kart-bir.md" && grep -q "sessiz" "$D/ozet.md"'
kontrol '! pgrep -f "sleep 30" >/dev/null'

CASE=yavas_ama_canli  # ilk olayı hemen yazan model PERSONA_ILK'yı aşsa da öldürülmez
setup 'echo "{\"type\":\"step_start\"}"; sleep 4; yanit "Seçenek A — c"'
kos env PERSONA_ILK=2 bash "$RUNNER" dev soru.md "Kart Bir"
D=$(DIZ); kontrol '[ $KOD = 0 ] && grep -q "^Model: m/bir$" "$D/1-kart-bir.md" && [ "$(wc -l <$T/cagri.log)" = 1 ]'

CASE=hatali_kullanim
setup 'yanit "Seçenek A"'
kos bash "$RUNNER" dev soru.md; kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'
kos bash "$RUNNER" yok soru.md "Kart Bir"; kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'
kos bash "$RUNNER" dev soru.md "Yok Kart"; kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'
kos bash "$RUNNER" dev soru.md "Yabancı"; kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'  # başka alanın kartı
kos bash "$RUNNER" dev yok.md "Kart Bir"; kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'
kontrol '[ ! -s $T/cagri.log ]'

CASE=v2   # OpenCode v2 çağrısı; cursor/* modeller OpenCode'da koşamaz, atlanır
setup 'if [ "$M" = cursor/auto ]; then yanit "Seçenek A"; else yanit "yok"; fi'
PERSONA_MODELLER=m/bir,cursor/auto kos bash "$RUNNER" dev soru.md "Kart Bir"
kontrol '[ $KOD = 1 ] && ! grep -q cursor $T/cagri.log && [ "$(wc -l <$T/cagri.log)" = 2 ]'
kontrol 'grep -qx -- --standalone $T/argv && grep -qix error $T/loglevel'
setup 'yanit "Seçenek A"'; PERSONA_MODELLER=cursor/auto kos bash "$RUNNER" dev soru.md "Kart Bir"
kontrol '[ $KOD = 2 ] && [ ! -e persona-tur ]'   # yalnız cursor modeli: kullanım hatası, tur açılmaz

CASE=v2_token   # v2 token'ı opencode.db'den (oturum kimliğiyle); akışta step_finish olmasa da
setup 'echo "{\"type\":\"step_start\",\"sessionID\":\"ses_X\"}"; yanit "Seçenek A"'
node -e 'const db=new (require("node:sqlite").DatabaseSync)(process.argv[1]); db.exec("create table session_message (id text, session_id text, type text, seq integer, data text)");
  const e=db.prepare("insert into session_message values (?,?,?,?,?)");
  e.run("a","ses_X","assistant",1,JSON.stringify({tokens:{input:1000,output:300,reasoning:200,cache:{read:8000,write:0}}}));
  e.run("b","ses_X","user",2,JSON.stringify({tokens:{input:99999}})); e.run("c","ses_Y","assistant",1,JSON.stringify({tokens:{input:77777}}))' "$T/oc.db" 2>/dev/null
OPENCODE_DB=$T/oc.db kos bash "$RUNNER" dev soru.md "Kart Bir"
D=$(DIZ); kontrol '[ $KOD = 0 ] && grep -q "^Token: 9500$" "$D/1-kart-bir.md"'   # yalnız ses_X'in assistant mesajı

CASE=gitignore; kontrol 'grep -qx "persona-tur/" "$(dirname "$RUNNER")/.gitignore"'

[ $FAIL = 0 ] && echo "persona-tur.test ok" || exit 1
