#!/usr/bin/env bash
# Kullanım (proje kökünde): mdk-adim.sh <adım-no> [plan-dosyası]
# PLAN.md adımını ücretsiz modellerden başlayarak OpenCode'a yaptırır, "Kapı" komutuyla doğrular.
# Çıkış: 0 geçti | 2 eskale (modeller tükendi, kodcu/Claude devralsın) | 3 bu adım opencode'un değil | 4 ön koşul | 5 taslak onayı bekliyor | 6 sağlayıcı yanıt vermiyor | 8 modeller kilitli (tavan doldu)
set -uo pipefail
# donmuş kopya: bir adım mdk-adim.sh'i değiştirse ya da git geri alsa da çalışan betik etkilenmez
if [ -z "${MDK_DONMUS:-}" ]; then
  mkdir -p .mdk-log && cp "$0" .mdk-log/mdk-adim.run.sh && MDK_DONMUS=1 exec bash .mdk-log/mdk-adim.run.sh "$@"
fi
N=${1:?adım no}; PLAN=${2:-PLAN.md}
DENEME=${DENEME:-2}   # model başına deneme
SURE=${SURE:-600}     # deneme başına saniye
POLL=${POLL:-3}       # süreç izleme aralığı, saniye
ILK=${ILK:-90}        # ilk olay bu kadar saniyede gelmezse sağlayıcı yanıt vermiyor sayılır
OC=${MDK_OPENCODE:-$HOME/.local/opt/opencode-v2/node_modules/.bin/opencode}   # v2: v1 ücretsiz modellerde hata veriyor (#59387)
LOGD=.mdk-log; mkdir -p "$LOGD"
# deney koşusu worktree'den ana deponun dosyalarına yazabilsin, panel canlı görsün
METRIK=${MDK_METRIK:-metrikler.jsonl}
DURUM=${MDK_DURUM:-durum.json}
deneyj=$(node -e 'process.stdout.write(process.env.MDK_DENEY?JSON.stringify(process.env.MDK_DENEY):"null")')

# adım bloğu: "- [ ] N." satırından bir sonraki adım/kategoriye kadar
blok=$(awk -v n="$N" '
  $0 ~ "^- \\[[ x]\\] "n"\\." {on=1; print; next}
  on && (/^- \[/ || /^## /) {exit}
  on {print}' "$PLAN")
[ -n "$blok" ] || { echo "adım $N bulunamadı"; exit 4; }
baslik=$(head -1 <<<"$blok" | sed -E 's/^- \[.\] [0-9]+\.\s*//')
head -1 <<<"$blok" | grep -q '^- \[x\]' && { echo "adım $N zaten bitmiş"; exit 0; }

mapfile -t KAPILAR < <(grep -oP '^\s*- Kapı: `\K[^`]+' <<<"$blok")
[ ${#KAPILAR[@]} -gt 0 ] || { echo "adım $N için Kapı yok"; exit 4; }
yur=$(grep -m1 -oP '^\s*- Yürütücü: \K\S+' <<<"$blok" || grep -m1 -oP '^Yürütücü: \K\S+' "$PLAN")
[ "${yur:-kodcu}" = opencode ] || { echo "adım $N yürütücüsü ${yur:-kodcu}"; exit 3; }
# görev türü (adım 82): adım satırı yoksa kod; tanımsız tür modele gitmeden çıkar
gorev=$(grep -m1 -oP '^\s*- Görev: \K\S+' <<<"$blok" || true); gorev=${gorev:-kod}
gorev_satir=$(grep -m1 -oP "^Görev \Q$gorev\E: \K.*" "$PLAN" || true)
if [ -z "$gorev_satir" ] && [ "$gorev" != kod ]; then
  echo "tanımsız görev türü: $gorev (geçerli: $(grep -oP '^Görev \K[^:]+(?=:)' "$PLAN" | paste -sd' ' -))"; exit 4
fi
# model listesi: adım > Görev <tür> > dosya Modeller
modline=$(grep -m1 -oP '^\s*- Modeller: \K.*' <<<"$blok" || true)
[ -n "$modline" ] || modline=$gorev_satir
[ -n "$modline" ] || modline=$(grep -m1 -oP '^Modeller: \K.*' "$PLAN" || true)
IFS=, read -ra MODELLER <<<"$(tr -d ' ' <<<"$modline")"
[ ${#MODELLER[@]} -gt 0 ] || { echo "Modeller satırı yok (adım, Görev ya da PLAN)"; exit 4; }
# ONCE=<model>: listede varsa bu çalıştırmada önce o denenir (listede yoksa yok sayılır)
if [ -n "${ONCE:-}" ] && [[ " ${MODELLER[*]} " == *" $ONCE "* ]]; then
  SIRA=("$ONCE"); for x in "${MODELLER[@]}"; do [ "$x" = "$ONCE" ] || SIRA+=("$x"); done; MODELLER=("${SIRA[@]}")
fi
# token bütçesi (model başına): adım satırı önceliklidir, yoksa dosya başındaki Bütçe; ikisi de yoksa denetim yok
butce=$(grep -m1 -oP '^\s*- Bütçe: \K[0-9]+' <<<"$blok" || grep -m1 -oP '^Bütçe: \K[0-9]+' "$PLAN" || true)

# geri alma güvenliği: temiz git ağacı şart (kontrol noktası = HEAD)
git rev-parse --git-dir >/dev/null 2>&1 || { echo "git deposu değil"; exit 4; }
git check-ignore -q .mdk-log || { echo ".gitignore'a .mdk-log/, durum.json, metrikler.jsonl ekle"; exit 4; }
[ -z "$(git status --porcelain)" ] || { echo "çalışma ağacı kirli; önce commit et"; exit 4; }
CP=$(git rev-parse HEAD)
# ön kontrol: regresyon kapıları HEAD'de kırmızıysa hiçbir model geçemez (adım 70: 7 deneme boşa gitti)
if [ -f test/hepsi.sh ] && [ -z "${MDK_ONKONTROL_YOK:-}" ]; then
  ok=$(env -u MDK_DONMUS -u MDK_METRIK -u MDK_DURUM -u MDK_PLAN_DOKUNMA -u MDK_KILIT bash test/hepsi.sh 2>&1) || { echo "adım $N başlamadı: test/hepsi.sh HEAD'de kırmızı (kapıyı düzelt):"; tail -5 <<<"$ok"; exit 4; }
fi
# taslak onayı: etki taslağı olan adım, insan onayı yoksa opencode hiç çağrılmadan durur
if grep -q '^\s*- Etki:' <<<"$blok" && ! grep -q '^\s*- Onay: evet\b' <<<"$blok"; then
  echo "adım $N taslak onayı bekliyor: PLAN.md'ye \"- Onay: evet\" ekle"; exit 5
fi

# küçük JSON yardımcıları (jq yok)
yaz_durum() { D_ADIM=$N D_BASLIK=$baslik D_MODEL=${1:-} D_DENEME=${2:-0} D_DURUM=$3 D_DOSYA=$DURUM node -e '
  const e=process.env; require("fs").writeFileSync(e.D_DOSYA, JSON.stringify({adim:+e.D_ADIM,baslik:e.D_BASLIK,
  model:e.D_MODEL,deneme:+e.D_DENEME,durum:e.D_DURUM,deney:e.MDK_DENEY||null,ts:Date.now()}))'; }
yaz_metrik() { M_JSON="$1" M_DOSYA=$METRIK node -e 'require("fs").appendFileSync(process.env.M_DOSYA, process.env.M_JSON+"\n")'; }
topla() { node -e '                       // step_finish olaylarından token, maliyet, etkin token (önbellekten okuma hariç), istek
  let t=0,c=0,e=0,ss=0,sf=0,cur=new Set(); for (const l of require("fs").readFileSync(process.argv[1],"utf8").split("\n")) {
    try { const x=JSON.parse(l);
      if (x.type==="step_start") ss++       // v2: son adımda step_finish gelmez, istek step_start sayısından sayılır
      if (x.type==="step_finish") { const k=x.part.tokens, top=k.total ?? (k.input+k.output+(k.reasoning||0)+(k.cache?.read||0)+(k.cache?.write||0)); t+=top; c+=x.part.cost||0; e+=top-(k.cache?.read||0); sf++ }
      if (x.type==="assistant" && x.model_call_id) cur.add(x.model_call_id)   // cursor-agent: istek = farklı model çağrısı
      if (x.type==="result" && x.usage) { const u=x.usage, top=u.inputTokens+u.outputTokens+u.cacheReadTokens+u.cacheWriteTokens; t+=top; e+=top-u.cacheReadTokens } } catch {} }
  console.log(t, c, e, Math.max(ss,sf)+cur.size)' "$1"; }

# başsız çalışmada izin sormasın; sudo/push yasak (AGENTS.md ile birlikte)
IZIN='"permission":{"edit":"allow","bash":{"*":"allow","sudo *":"deny","git push*":"deny"},"shell":{"*":"allow","sudo *":"deny","git push*":"deny"},"external_directory":"deny"}'   # shell, external_directory: v2 adları
# MDK_SADE=1 (deneysel, varsayılan kapalı): bağlamı küçük tutmayı dener; K73 ölçümünde (n=1) token azaltmadı, glm adım sayısını 22→37 artırdı.
# Ölçüm (dbeaver-mm K74): token'ın ~%90'ı her adımda yeniden gönderilen bağlam
# (cache read); bağlamı büyüten tam dosya okumaları ve uzun komut çıktıları. prune eski araç çıktılarını budar,
# tool_output uzun çıktıyı keser, batch_tool birden çok aracı tek adımda çağırır (daha az adım = daha az tekrar).
if [ "${MDK_SADE:-0}" = 1 ]; then
  export OPENCODE_CONFIG_CONTENT="{$IZIN,\"compaction\":{\"auto\":true,\"prune\":true},\"tool_output\":{\"max_lines\":300,\"max_bytes\":20000},\"experimental\":{\"batch_tool\":true}}"
  SADE_IPUCU="Verimlilik: adım metni yukarıda, PLAN.md'yi ve kapı betiklerini okuma. Dosyaları baştan sona okuma: önce grep -n ile yeri bul, sonra yalnız gereken satır aralığını oku. Birbirinden bağımsız okumaları tek adımda birlikte yap. Uzun çıktıları (derleme, test) tail ile kısalt."
else
  export OPENCODE_CONFIG_CONTENT="{$IZIN}"; SADE_IPUCU=""
fi

# Cursor CLI (cursor/<model>; ücretsiz planda yalnız cursor/auto): --force yok, izin listesi proje .cursor/cli.json'da.
# Dosya her denemeden önce yeniden yazılır (model değiştirse de sonraki deneme etkilenmez) ve git'ten gizlenir.
CURSOR_IZIN='{"permissions":{"allow":["Read(**)","Write(**)","Shell(bash)","Shell(sh)","Shell(node)","Shell(npm)","Shell(npx)","Shell(git)","Shell(grep)","Shell(sed)","Shell(awk)","Shell(cat)","Shell(ls)","Shell(head)","Shell(tail)","Shell(wc)","Shell(find)","Shell(sort)","Shell(diff)","Shell(mkdir)","Shell(cp)","Shell(mv)","Shell(rm)","Shell(touch)","Shell(chmod)","Shell(echo)","Shell(test)","Shell(python3)"],"deny":["Shell(sudo)","Shell(git push)"]}}'
cursor_izin() { mkdir -p .cursor; printf '%s\n' "$CURSOR_IZIN" >.cursor/cli.json
  grep -qxF .cursor/cli.json "$(git rev-parse --git-path info/exclude)" 2>/dev/null || echo .cursor/cli.json >>"$(git rev-parse --git-path info/exclude)"; }

ipucu=""; SAGLAYICI=1; durdu=""; kota_goruldu=0; harcanan=0; sorun_icerik=""
# model kilidi (adım 84): paralel koşularda aynı model aynı anda denenmesin; süreç ölünce fd kapanır, kilit düşer
KILIT_DIR=${MDK_KILIT:-$HOME/.cache/mdk/kilit}; mkdir -p "$KILIT_DIR"
KILIT_BEKLE=${MDK_KILIT_BEKLE:-30}; KILIT_TAVAN=${MDK_KILIT_TAVAN:-600}; beklenen=0
kilit_al() { exec {KFD}>"$KILIT_DIR/${1//\//_}" && flock -n "$KFD" || { exec {KFD}>&-; return 1; }; }
kilit_birak() { exec {KFD}>&-; }
aday=("${MODELLER[@]}")
while [ ${#aday[@]} -gt 0 ]; do
bekleyen=(); denendi=0
for m in "${aday[@]}"; do
  kilit_al "$m" || { bekleyen+=("$m"); continue; }; denendi=1   # kilitli model bu turda atlanır, deneme sayılmaz
  harcanan=0   # bütçe model başına: aşan model bırakılır, sıradaki kendi bütçesiyle başlar
  for ((d=1; d<=DENEME; d++)); do
    yaz_durum "$m" "$d" calisiyor
    log="$LOGD/adim$N-$(date +%s).jsonl"; t0=$(date +%s); neden=""
    istem="PLAN.md içindeki $N numaralı adımı yap, yalnızca onu. Adım:
$blok
$SADE_IPUCU
$ipucu"
    # setsid: süreç kendi grubunun lideri olur (pgid = pid); durdururken grup topluca öldürülür
    # stdin kapalı: süreç grubunda tty okuması takılıyordu
    if [[ $m == cursor/* ]]; then
      yurm=cursor; cursor_izin
      setsid "${MDK_CURSOR:-cursor-agent}" -p --output-format stream-json --trust --model "${m#cursor/}" "$istem" </dev/null >"$log" 2>"$log.err" &
    else
      yurm=opencode
      # v2 (adım 72): v1 ücretsiz modellerde "Unexpected server error" veriyor
      OPENCODE_LOG_LEVEL=error setsid "$OC" run --standalone -m "$m" --title "adim-$N" --format json --print-logs \
        "$istem" </dev/null >"$log" 2>"$log.err" &
    fi
    pid=$!
    while kill -0 "$pid" 2>/dev/null; do
      sleep "$POLL"
      el=$(( $(date +%s) - t0 ))
      if grep -q "Free usage limit" "$log.err" 2>/dev/null || grep -q '"type":"error".*Free usage limit' "$log" 2>/dev/null; then neden=kota   # kota dolu: stderr'deki log ya da v2'nin stdout error olayı (yalnız error olayı: araç çıktısında geçen metin sayılmaz); ILK'yı bekleme
      elif [ ! -s "$log" ] && [ "$el" -ge "$ILK" ]; then neden=yanit_yok
      elif [ "$el" -ge "$SURE" ]; then neden=sure
      elif [ -n "$butce" ]; then   # ponytail: bütçe yoklama aralığında ölçülür, tek tur bütçeyi biraz aşabilir; sert sınır için token akışı izlenmeli
        read -r _ _ tok _ < <(topla "$log"); [ $((harcanan + tok)) -gt "$butce" ] && neden=butce   # bütçe etkin token: önbellekten yeniden okunan bağlam sayılmaz
      fi
      [ -z "$neden" ] || { kill -TERM -- -"$pid" 2>/dev/null; sleep 2; kill -KILL -- -"$pid" 2>/dev/null; break; }
    done
    wait "$pid" 2>/dev/null
    # ponytail: Cursor kota metni henüz görülmedi, tahmin; gerçek mesaj görülünce daralt
    [ -z "$neden" ] && [ "$yurm" = cursor ] && grep -qiE "usage limit|rate limit|upgrade to|quota" "$log.err" 2>/dev/null && neden=kota
    pgrep -g "$pid" >/dev/null && kill -KILL -- -"$pid" 2>/dev/null   # grupta kalan yetim süreç
    # kurcalama: model kapı dosyasını (test/, *.test.*, PLAN.md) değiştirip ya da silip geçmesin
    git add -A
    # SORUN.md: model bir sorun bildirdiyse kapı geçse bile deneme başarısız; içerik sonraki denemeye ipucu olur
    if [ -f SORUN.md ]; then   # kopya her zaman alınır (reset/clean silmeden önce); etiket yalnızca önceliği boşsa
      cp SORUN.md "$LOGD/sorun-$N-$(date +%s).md"; sorun_icerik=$(cat SORUN.md)
      [ -n "$neden" ] || neden=sorun
    fi
    if [ -z "$neden" ]; then
      kurcalama=$(git diff --cached --name-only --no-renames --diff-filter=MD "$CP" | grep -E '(^|/)test/|\.test\.[a-z]+$|^PLAN\.md$' || true)
      if [ -n "$kurcalama" ]; then
        printf 'kurcalama: kapı dosyaları değiştirilmiş, kapı çalıştırılmadı:\n%s\nKapı dosyalarını değiştirme.\n' "$kurcalama" >"$log.kapi"
        neden=kurcalama
      else
        for k in "${KAPILAR[@]}"; do   # ilk başarısız kapıda dur; o kapının çıktısı $log.kapi'de kalır
          env -u MDK_DONMUS -u MDK_METRIK -u MDK_DURUM -u MDK_PLAN_DOKUNMA -u MDK_KILIT bash -c "$k" >"$log.kapi" 2>&1 || { neden=kapi; break; }   # MDK_DONMUS iç değişken: kapıdaki mdk-adim.test.sh donmuş kopya vakasını bozuyordu
        done
      fi
    fi
    git add -A; read -r ek sil dos < <(git diff --cached --numstat | awk '{a+=$1;s+=$2;f++} END{print a+0,s+0,f+0}')
    read -r tok mal etkin istek < <(topla "$log"); harcanan=$((harcanan + etkin))
    nedenj=null; [ -z "$neden" ] || nedenj="\"$neden\""
    yaz_metrik "{\"ts\":$(date +%s),\"adim\":$N,\"yurutucu\":\"$yurm\",\"model\":\"$m\",\"gorev\":\"$gorev\",\"deneme\":$d,\"gecti\":$([ -z "$neden" ] && echo true || echo false),\"sure_sn\":$(( $(date +%s)-t0 )),\"token\":$tok,\"etkin\":$etkin,\"istek\":$istek,\"deney\":$deneyj,\"sade\":${MDK_SADE:-0},\"maliyet\":$mal,\"eklenen\":$ek,\"silinen\":$sil,\"dosya\":$dos,\"neden\":$nedenj}"
    if [ -z "$neden" ]; then
      [ "${MDK_PLAN_DOKUNMA:-0}" = 1 ] || sed -i -E "s/^- \[ \] $N\./- [x] $N./" "$PLAN"; git add -A
      git commit -qm "adım $N: $baslik ($m, deneme $d)"; yaz_durum "$m" "$d" gecti
      echo "adım $N geçti ($m, deneme $d)"; exit 0
    fi
    case $neden in
      kapi|kurcalama) ipucu="Önceki deneme kapıyı geçemedi. Kapı çıktısının sonu:
$(tail -c 1500 "$log.kapi")" ;;
      sure)           ipucu="Önceki deneme $SURE sn içinde bitmedi; işi daha küçük tut." ;;
      sorun)          ipucu="Önceki deneme SORUN.md bıraktı; sorunu gider ve adımı yeniden yap. SORUN.md:
$sorun_icerik" ;;
    esac
    git reset -q --hard "$CP"; git clean -fdq    # temiz başlangıç (ignore'lanan metrik/log dosyaları kalır)
    [ "$neden" = kota ] && kota_goruldu=1
    echo "adım $N: $m deneme $d başarısız ($neden)"
    case $neden in yanit_yok|kota) ;; *) SAGLAYICI=0 ;; esac   # kota/sessizlik model değil sağlayıcı sorunu: eskale etme
    [ "$neden" = butce ] && { durdu=butce; break; }   # bu modelin bütçesi bitti: sıradaki modele geç
    case $neden in yanit_yok|kota) break ;; esac   # sessiz/kotalı modeli yeniden denemek boşuna: sıradaki modele geç
  done
  kilit_birak
done
[ ${#bekleyen[@]} -gt 0 ] || break
aday=("${bekleyen[@]}")
if [ $denendi = 0 ]; then   # tüm kalan modeller kilitli: bekle, tavan dolunca çık (model çağrılmadan)
  [ $((beklenen + KILIT_BEKLE)) -gt "$KILIT_TAVAN" ] && { yaz_durum "" 0 kilit; echo "adım $N: modeller $KILIT_TAVAN sn kilitli kaldı"; exit 8; }
  sleep "$KILIT_BEKLE"; beklenen=$((beklenen + KILIT_BEKLE))
fi
done
if [ "$durdu" = butce ]; then
  yaz_durum "" 0 eskale; echo "adım $N eskale: modeller tükendi, en az biri token bütçesini ($butce/model) aştı"; exit 2
fi
if [ $SAGLAYICI = 1 ]; then
  if [ "$kota_goruldu" = 1 ]; then
    yaz_durum "" 0 saglayici; echo "adım $N: ücretsiz kota dolu (tüm modeller kota/sessizlik verdi)"; exit 6
  fi
  yaz_durum "" 0 saglayici; echo "adım $N: sağlayıcı yanıt vermiyor (tüm modeller $ILK sn içinde olay üretmedi)"; exit 6
fi
yaz_durum "" 0 eskale; echo "adım $N eskale: tüm modeller tükendi"; exit 2
