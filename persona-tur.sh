#!/usr/bin/env bash
# Kullanım (proje kökünde): persona-tur.sh <alan> <soru-dosyası> "<kart 1>" "<kart 2>" ["<kart 3>" ...]
# Ortam: PERSONA_SURE, PERSONA_ILK, PERSONA_MODELLER, PERSONALAR, PLAN
# Her persona kartını OpenCode'da ayrı oturumda (plan ajanı, salt-okunur) paralel koşturur; çıktı persona-tur/<zaman>/.
# Çıkış: 0 en az 2 geçerli yanıt (tek kartta 1) | 1 yetersiz | 2 hatalı kullanım
set -uo pipefail
[ $# -ge 3 ] || { echo "kullanım: persona-tur.sh <alan> <soru-dosyası> \"<kart 1>\" \"<kart 2>\" [...]" >&2; exit 2; }
ALAN=$1; SORU=$2; shift 2; KARTLAR=("$@")
PERSONALAR=${PERSONALAR:-./personalar.md}; PLAN=${PLAN:-./PLAN.md}
SURE=${PERSONA_SURE:-300}   # kart denemesi başına saniye
ILK=${PERSONA_ILK:-60}   # sessiz model erken atla: ilk çıktı bekleme süresi (saniye)

[ -f "$SORU" ] || { echo "soru dosyası yok: $SORU" >&2; exit 2; }
[ -f "$PERSONALAR" ] || { echo "personalar dosyası yok: $PERSONALAR" >&2; exit 2; }

# başlık bloğu: "## <bölüm>" altındaki "### <başlık>" satırından sonraki ### ya da ## başlığına kadar
# $3=1 ise başlık önekle eşleşir ("### Çıktı biçimi (alt ajana verilir)" gibi)
blok() { awk -v b="$1" -v k="$2" -v o="${3:-0}" '
  /^## /  {bol = (substr($0,4) == b); on=0; next}
  /^### / {h=substr($0,5); on = bol && (o ? index(h,k)==1 : h==k); if (on) print; next}
  on {print}' "$PERSONALAR"; }

grep -qx "## Alan: $ALAN" "$PERSONALAR" || { echo "alan yok: $ALAN" >&2; exit 2; }
for k in "${KARTLAR[@]}"; do
  [ -n "$(blok "Alan: $ALAN" "$k")" ] || { echo "'$ALAN' alanında kart yok: $k" >&2; exit 2; }
done
ORTAK="$(blok Ortak "Çıktı biçimi" 1)

$(blok Ortak "Ayırt edicilik şartı" 1)"

if [ -n "${PERSONA_MODELLER:-}" ]; then IFS=, read -ra MODELLER <<<"${PERSONA_MODELLER// /}"
else IFS=, read -ra MODELLER <<<"$(grep -m1 -oP '^Modeller: \K.*' "$PLAN" 2>/dev/null | tr -d ' ')"; fi
# cursor/* OpenCode'da koşamaz (mdk-adim.sh cursor-agent ile koşturur); persona turunda atlanır
for x in "${!MODELLER[@]}"; do [[ ${MODELLER[$x]} == cursor/* ]] && unset 'MODELLER[x]'; done; MODELLER=("${MODELLER[@]}")
[ ${#MODELLER[@]} -gt 0 ] || { echo "model yok: PLAN'da Modeller satırı ya da PERSONA_MODELLER gerekli" >&2; exit 2; }

# çıktı dizini: aynı saniyede ikinci tur -2, -3… alır (mkdir atomik)
mkdir -p persona-tur; D=persona-tur/$(date +%Y%m%d-%H%M%S); BAS=$D; s=2
until mkdir "$D" 2>/dev/null; do D=$BAS-$s; s=$((s+1)); done

# dosya adı: küçük harf, harf/rakam dışı her dizi tek tire, baş/son tire yok
ad() { node -e 'process.stdout.write(process.argv[1].toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,""))' "$1"; }
# ilk satır token toplamı, kalanı text olaylarının metni. v2 son adımda step_finish yazmaz (tek adımlık yanıtta hiç):
# token oturum kimliğiyle opencode.db'den (session_message) okunur; kayıt yoksa step_finish toplamı
ayikla() { node -e '
  const top=(k)=>k.total ?? ((k.input||0)+(k.output||0)+(k.reasoning||0)+(k.cache?.read||0)+(k.cache?.write||0));
  let t=0,m="",d=0; const ids=new Set(); for (const l of require("fs").readFileSync(process.argv[1],"utf8").split("\n")) {
    try { const x=JSON.parse(l); if (x.sessionID) ids.add(x.sessionID); if (x.type==="text") m+=x.part.text; if (x.type==="step_finish") t+=top(x.part.tokens||{}) } catch {} }
  try { const db=new (require("node:sqlite").DatabaseSync)(process.env.OPENCODE_DB||require("os").homedir()+"/.local/share/opencode/opencode.db",{readOnly:true});
    const q=db.prepare("select data from session_message where session_id=? and type=?");
    for (const id of ids) for (const r of q.all(id,"assistant")) { const k=JSON.parse(r.data).tokens; if (k) d+=top(k) } } catch {}
  process.stdout.write((d||t)+"\n"+m)' "$1" 2>/dev/null; }

kart_kos() {  # $1 kart sırası (0'dan)
  local i=$1 kart=${KARTLAR[$1]} n=${#MODELLER[@]} f m pid t0 durum tok metin
  f="$D/$((i+1))-$(ad "${KARTLAR[$1]}")"
  local istem="Sen şu personasın:
$(blok "Alan: $ALAN" "$kart")

$ORTAK

Problem:
$(cat "$SORU")

Kod ya da dosya değiştirme; yalnız yukarıdaki biçimde yanıt ver."
  for j in 0 1; do   # geçersiz yanıtta sıradaki modelle bir kez daha
    m=${MODELLER[$(( (i+j) % n ))]}; durum=""
    # setsid: süreç kendi grubunun lideri; süre aşılınca grup topluca öldürülür
    # v2 (adım 72): --standalone kendi sunucusu, grup öldürülünce biter; stderr ayrı: log satırı "sessiz" denetimini bozmasın
    OPENCODE_LOG_LEVEL=error setsid "${MDK_OPENCODE:-$HOME/.local/opt/opencode-v2/node_modules/.bin/opencode}" run --standalone --agent plan -m "$m" --title "persona-$ALAN" --format json "$istem" </dev/null >"$f.deneme" 2>>"$f.err" &
    pid=$!; t0=$SECONDS
    while kill -0 "$pid" 2>/dev/null; do
      sleep 1
      if [ ! -s "$f.deneme" ] && (( SECONDS - t0 >= ILK )); then
        kill -KILL -- -"$pid" 2>/dev/null; durum=sessiz; break
      fi
      (( SECONDS - t0 >= SURE )) && { kill -KILL -- -"$pid" 2>/dev/null; durum=sure; break; }
    done
    wait "$pid" 2>/dev/null
    { read -r _; metin=$(cat); } < <(ayikla "$f.deneme")
    cat "$f.deneme" >>"$f.jsonl"; rm -f "$f.deneme"   # ham olaylar: iki deneme de kalır
    [ -n "$durum" ] || { grep -q "Seçenek A" <<<"$metin" && durum=gecerli || durum=gecersiz; }
    [ "$durum" = gecerli ] && break
  done
  read -r tok < <(ayikla "$f.jsonl")   # token: kartın tüm denemeleri
  printf '# %s\n\nModel: %s\nToken: %s\nDurum: %s\n\n%s\n' "$kart" "$m" "$tok" "$durum" "$metin" >"$f.md"
}

for i in "${!KARTLAR[@]}"; do kart_kos "$i" & done
wait

# özet
gecerli=0; satirlar=""; metinler=""
for i in "${!KARTLAR[@]}"; do
  f="$D/$((i+1))-$(ad "${KARTLAR[$i]}").md"
  m=$(grep -m1 -oP '^Model: \K.*' "$f"); t=$(grep -m1 -oP '^Token: \K.*' "$f"); du=$(grep -m1 -oP '^Durum: \K.*' "$f")
  satirlar+="- ${KARTLAR[$i]} · $m · $du · $t token"$'\n'
  [ "$du" = gecerli ] && { gecerli=$((gecerli+1)); metinler+=$'\n'"## ${KARTLAR[$i]}"$'\n\n'"$(tail -n +7 "$f")"$'\n'; }
done
printf '# Persona turu\n\nAlan: %s\n\nSoru:\n%s\n\n%s%s' "$ALAN" "$(cat "$SORU")" "$satirlar" "$metinler" >"$D/ozet.md"
echo "$D"
gerek=2; [ ${#KARTLAR[@]} = 1 ] && gerek=1
[ $gecerli -ge $gerek ]
