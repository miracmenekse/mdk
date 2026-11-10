#!/usr/bin/env bash
# Kullanım (proje kökünde): mdk-adim.sh <adım-no> [plan-dosyası]
# PLAN.md adımını ücretsiz modellerden başlayarak OpenCode'a yaptırır, "Kapı" komutuyla doğrular.
# Çıkış: 0 geçti | 2 eskale (modeller tükendi, kodcu/Claude devralsın) | 3 bu adım opencode'un değil | 4 ön koşul | 5 taslak onayı bekliyor | 6 sağlayıcı yanıt vermiyor | 8 modeller kilitli (tavan doldu)
set -uo pipefail
# donmuş kopya: bir adım mdk-adim.sh'i değiştirse ya da git geri alsa da çalışan betik etkilenmez
export MDK_SELF_DIR="${MDK_SELF_DIR:-$(cd "$(dirname "$0")" && pwd)}"
if [ -z "${MDK_DONMUS:-}" ]; then
  mkdir -p .mdk-log && cp "$0" .mdk-log/mdk-adim.run.sh && MDK_DONMUS=1 exec bash .mdk-log/mdk-adim.run.sh "$@"
fi
N=${1:?adım no}; PLAN=${2:-PLAN.md}
DENEME=${DENEME:-2}   # model başına deneme
SURE=${SURE:-600}     # deneme başına saniye
POLL=${POLL:-3}       # süreç izleme aralığı, saniye
ILK=${ILK:-75}        # ilk olay bu kadar saniyede gelmezse sağlayıcı yanıt vermiyor sayılır (Go ilk yanıtı ~63 sn sürebiliyor)
OC=${MDK_OPENCODE:-$HOME/.local/opt/opencode-v2/node_modules/.bin/opencode}   # v2: v1 ücretsiz modellerde hata veriyor (#59387)
KOTA_KALIP="Free usage limit|Go usage limit|GoUsageLimitError|provider\.quota"
# kesilen oturumu arka plan servisinde de durdurur (yoksa çalışmaya devam eder ve servis restart'ta hortlar)
oturum_kapat() { # $1=log dosyası, $2=başlık (adim-$N / kapi-$N)
  local sid
  sid=$(grep -m1 -oE '"sessionID":"ses_[^"]+"' "$1" 2>/dev/null | cut -d'"' -f4 || true)
  if [ -z "$sid" ] && [ -n "${2:-}" ] && { [ "${MDK_OPENCODE:-}" != opencode ] || [ -n "${OPENCODE_DB:-}" ]; }; then
    sid=$(node -e 'try{const db=new(require("node:sqlite").DatabaseSync)(process.env.OPENCODE_DB||require("os").homedir()+"/.local/share/opencode/opencode.db",{readOnly:true});const r=db.prepare("select id from session_v2 where title=? order by time_created desc limit 1").get(process.argv[1]);if(r&&/^ses_/.test(r.id))process.stdout.write(r.id)}catch{}' "$2" 2>/dev/null || true)
  fi
  [[ "${sid:-}" == ses_* ]] && "$OC" api POST "/api/session/$sid/interrupt" >/dev/null 2>&1 || true
}
# başlangıçta yarım kalmış (son mesajı idle olmayan) eski adim-/kapi-/persona- oturumlarını sustur
zombi_temizle() {
  [ -z "${MDK_OPENCODE:-}" ] || return 0
  local sids
  sids=$(node -e 'try{const db=new(require("node:sqlite").DatabaseSync)(process.env.OPENCODE_DB||require("os").homedir()+"/.local/share/opencode/opencode.db",{readOnly:true});const q=db.prepare("select s.id,(select type from session_message m where m.session_id=s.id order by seq desc limit 1) ty from session_v2 s where (s.title like \"adim-%\" or s.title like \"kapi-%\" or s.title like \"persona-%\") and s.time_idle is null");for(const r of q.all())if(r.id&&/^ses_/.test(r.id)&&r.ty&&r.ty!=="idle")console.log(r.id)}catch{}' 2>/dev/null || true)
  for sid in $sids; do "$OC" api POST "/api/session/$sid/interrupt" >/dev/null 2>&1 || true; done
}
zombi_temizle
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
# otomatik eskale modelleri: Görev kod/vb. modelleri gerçek hatayla tükenirse kodcu öncesi Görev eskale: denenir
ESKALE_MODELLER=()
if [ "$gorev" != eskale ] && ! grep -q '^\s*- Modeller:' <<<"$blok"; then
  eskale_satir=$(grep -m1 -oP '^Görev eskale: \K.*' "$PLAN" || true)
  if [ -n "$eskale_satir" ]; then
    IFS=, read -ra E_ADAY <<<"$(tr -d ' ' <<<"$eskale_satir")"
    for em in "${E_ADAY[@]}"; do
      [[ " ${MODELLER[*]} " == *" $em "* ]] || ESKALE_MODELLER+=("$em")
    done
  fi
fi
# token bütçesi (model başına): adım satırı önceliklidir, yoksa dosya başındaki Bütçe; ikisi de yoksa denetim yok
butce=$(grep -m1 -oP '^\s*- Bütçe: \K[0-9]+' <<<"$blok" || grep -m1 -oP '^Bütçe: \K[0-9]+' "$PLAN" || true)

# geri alma güvenliği: temiz git ağacı şart (kontrol noktası = HEAD)
git rev-parse --git-dir >/dev/null 2>&1 || { echo "git deposu değil"; exit 4; }
git check-ignore -q .mdk-log || { echo ".gitignore'a .mdk-log/, durum.json, metrikler.jsonl ekle"; exit 4; }
[ -z "$(git status --porcelain)" ] || { echo "çalışma ağacı kirli; önce commit et"; exit 4; }
CP=$(git rev-parse HEAD)
# küçük JSON yardımcıları (jq yok); ön kontrol de durum yazdığı için yukarıda tanımlı
yaz_durum() { D_ADIM=$N D_BASLIK=$baslik D_MODEL=${1:-} D_DENEME=${2:-0} D_DURUM=$3 D_DOSYA=$DURUM node -e '
  const e=process.env; require("fs").writeFileSync(e.D_DOSYA, JSON.stringify({adim:+e.D_ADIM,baslik:e.D_BASLIK,
  model:e.D_MODEL,deneme:+e.D_DENEME,durum:e.D_DURUM,deney:e.MDK_DENEY||null,ts:Date.now()}))'; }
# taslak onayı: etki taslağı olan adım, insan onayı yoksa opencode hiç çağrılmadan durur
if grep -q '^\s*- Etki:' <<<"$blok" && ! grep -q '^\s*- Onay: evet\b' <<<"$blok"; then
  echo "adım $N taslak onayı bekliyor: PLAN.md'ye \"- Onay: evet\" ekle"; exit 5
fi
# ön kontrol: regresyon kapıları HEAD'de kırmızıysa hiçbir model geçemez (adım 70: 7 deneme boşa gitti)
# hızlı kip (HEPSI_HIZLI=1): mdk-adim.test.sh atlanır; kırmızıda durum.json "regresyon_kirmizi", kırmızı satırları çıktıda
if [ -f test/hepsi.sh ] && [ -z "${MDK_ONKONTROL_YOK:-}" ]; then
  yaz_durum "" 0 regresyon
  ok=$(env -u MDK_DONMUS -u MDK_METRIK -u MDK_DURUM -u MDK_PLAN_DOKUNMA -u MDK_KILIT HEPSI_HIZLI=1 bash test/hepsi.sh 2>&1) || { yaz_durum "" 0 regresyon_kirmizi; echo "adım $N başlamadı: test/hepsi.sh HEAD'de kırmızı (kapıyı düzelt):"; grep 'BAŞARISIZ' <<<"$ok"; tail -5 <<<"$ok"; exit 4; }
fi
# adım bazlı persona turu: "- Persona: sor" varsa kodlamadan önce persona takımını koşturur ve özeti isteme bağlar
persona_ipucu=""
if grep -q '^\s*- Persona:\s*sor\b' <<<"$blok" && [ -f "$MDK_SELF_DIR/persona-takim-tur.mjs" ] && [ -f persona/takim.json ]; then
  yaz_durum "" 0 persona
  printf '%s\n' "$blok" >"$LOGD/persona-soru-$N.txt"
  p_model=$(grep -m1 -oP '^Görev persona: \K[^, ]+' "$PLAN" || echo "opencode/beam-free")
  p_dizin=$(env -u MDK_DONMUS -u MDK_METRIK -u MDK_DURUM -u MDK_PLAN_DOKUNMA -u MDK_KILIT node "$MDK_SELF_DIR/persona-takim-tur.mjs" "$LOGD/persona-soru-$N.txt" "$p_model" 2>/dev/null | tail -1 || true)
  if [ -n "$p_dizin" ] && [ -f "$p_dizin/ozet.md" ]; then
    persona_ipucu="Persona takımı görüşleri (uygularken dikkate al):
$(cat "$p_dizin/ozet.md")"
    if [ "${MDK_PLAN_DOKUNMA:-0}" != 1 ]; then
      sed -i -E "s|^(\s*- Persona:)\s*sor\b|\1 $p_dizin|" "$PLAN"
      git add "$PLAN" && git commit -qm "adım $N: persona turu ($p_dizin)"; CP=$(git rev-parse HEAD)
    fi
  fi
fi
yaz_metrik() { M_JSON="$1" M_DOSYA=$METRIK node -e 'require("fs").appendFileSync(process.env.M_DOSYA, process.env.M_JSON+"\n")'; }
topla() { node -e '                       // step_finish olaylarından token, maliyet, etkin token (önbellekten okuma hariç), istek
  let t=0,c=0,e=0,ss=0,sf=0,cur=new Set(); for (const l of require("fs").readFileSync(process.argv[1],"utf8").split("\n")) {
    try { const x=JSON.parse(l);
      if (x.type==="step_start") ss++       // v2: son adımda step_finish gelmez, istek step_start sayısından sayılır
      if (x.type==="step_finish") { const k=x.part.tokens, top=k.total ?? (k.input+k.output+(k.reasoning||0)+(k.cache?.read||0)+(k.cache?.write||0)); t+=top; c+=x.part.cost||0; e+=top-(k.cache?.read||0); sf++ }
      if (x.type==="assistant" && x.model_call_id) cur.add(x.model_call_id)   // cursor-agent: istek = farklı model çağrısı
      if (x.type==="result" && x.usage) { const u=x.usage, top=u.inputTokens+u.outputTokens+u.cacheReadTokens+u.cacheWriteTokens; t+=top; e+=top-u.cacheReadTokens } } catch {} }
  console.log(t, c, e, Math.max(ss,sf)+cur.size)' "$1"; }

# izinler: yasaklar yalnız kural metninde değil izinde de durur (adım 105: model test/hepsi.sh koşup 600 sn'yi yaktı).
# Canlı doğrulandı (opencode 1.19.5): edit kalıbı göreli yola bakar, son eşleşen kural geçer, reddedilen çağrı modele hata döner, koşu sürer.
# kod: kapı dosyaları yazılamaz; kapi: yalnız eksik kapı dosyaları yazılabilir. Adımın kendi Kapı'sında geçen betik yasaklanmaz.
# Kabukla dolanma hâlâ mümkün: koşu sonrası kurcalama tespiti yerinde kalır.
# MDK_SADE=1 (deneysel, varsayılan kapalı): bağlamı küçük tutmayı dener; K73 ölçümünde (n=1) token azaltmadı, glm adım sayısını 22→37 artırdı.
izin_kur() { # $1=kod|kapi
  export OPENCODE_CONFIG_CONTENT=$(IZ_TUR=$1 IZ_KAPILAR="${KAPILAR[*]}" IZ_EKSIK=$(printf '%s\n' "${EKSIK_KAPILAR[@]}") IZ_SADE=${MDK_SADE:-0} node -e '
    const e=process.env, kabuk={"*":"allow","sudo *":"deny","git push*":"deny","git stash*":"deny"};
    for (const b of ["test/hepsi.sh","mdk-adim.test.sh"]) if (!e.IZ_KAPILAR.includes(b)) kabuk["*"+b+"*"]="deny";
    const edit = e.IZ_TUR==="kapi" ? {"*":"deny"} : {"*":"allow","PLAN.md":"deny","test/*":"deny","kapi/*":"deny","*.test.*":"deny"};
    if (e.IZ_TUR==="kapi") for (const f of e.IZ_EKSIK.split("\n").filter(Boolean)) edit[f]="allow";
    const c={permission:{edit,bash:kabuk,shell:kabuk,external_directory:"deny"}};   // shell, external_directory: v2 adları
    if (e.IZ_SADE==="1") Object.assign(c,{compaction:{auto:true,prune:true},tool_output:{max_lines:300,max_bytes:20000},experimental:{batch_tool:true}});
    process.stdout.write(JSON.stringify(c))')
}
if [ "${MDK_SADE:-0}" = 1 ]; then
  SADE_IPUCU="Verimlilik: dosyaları baştan sona okuma: önce grep -n ile yeri bul, sonra yalnız gereken satır aralığını oku. Birbirinden bağımsız okumaları tek adımda birlikte yap. Uzun çıktıları (derleme, test) tail ile kısalt."
else
  SADE_IPUCU=""
fi
# yürütücü yalıtımı: Claude'un CLAUDE.md'si ve ~/.claude/skills listesi yürütücüye gitmez (proje AGENTS.md'si gider).
# Kurallar tek dosyadan isteme eklenir; böylece cursor dalı da aynı kuralları alır. MDK_CLAUDE_KURAL=1 eski davranışı açar.
[ "${MDK_CLAUDE_KURAL:-0}" = 1 ] || export OPENCODE_DISABLE_CLAUDE_CODE=1
KURALLAR=$(cat "$MDK_SELF_DIR/yurutucu-kurallar.md" 2>/dev/null || true)
PROJE_KURAL=$(awk '/^Kurallar/{on=1} on&&/^[[:space:]]*$/{exit} on{print}' "$PLAN")   # PLAN başındaki "Kurallar (tüm adımlar için):" bloğu; model PLAN.md'yi açmadan görsün

# Cursor CLI (cursor/<model>; ücretsiz planda yalnız cursor/auto): --force yok, izin listesi proje .cursor/cli.json'da.
# Dosya her denemeden önce yeniden yazılır (model değiştirse de sonraki deneme etkilenmez) ve git'ten gizlenir.
CURSOR_IZIN='{"permissions":{"allow":["Read(**)","Write(**)","Shell(bash)","Shell(sh)","Shell(node)","Shell(npm)","Shell(npx)","Shell(git)","Shell(grep)","Shell(sed)","Shell(awk)","Shell(cat)","Shell(ls)","Shell(head)","Shell(tail)","Shell(wc)","Shell(find)","Shell(sort)","Shell(diff)","Shell(mkdir)","Shell(cp)","Shell(mv)","Shell(rm)","Shell(touch)","Shell(chmod)","Shell(echo)","Shell(test)","Shell(python3)"],"deny":["Shell(sudo)","Shell(git push)"]}}'
cursor_izin() { mkdir -p .cursor; printf '%s\n' "$CURSOR_IZIN" >.cursor/cli.json
  grep -qxF .cursor/cli.json "$(git rev-parse --git-path info/exclude)" 2>/dev/null || echo .cursor/cli.json >>"$(git rev-parse --git-path info/exclude)"; }
# tek koşu (kapı üretimi ve adım aynı döngüyü kullanır): modeli başlatır, izler, gerekirse öldürür. Sonuç: neden, yurm, t0
calistir() { # $1=model $2=oturum başlığı $3=istem $4=log $5=bütçe denetimi (1: açık)
  local cm=$1 bas=$2 ist=$3 log=$4 bd=${5:-0} pid el tok
  t0=$(date +%s); neden=""
  # setsid: süreç kendi grubunun lideri olur (pgid = pid); durdururken grup topluca öldürülür
  # stdin kapalı: süreç grubunda tty okuması takılıyordu
  if [[ $cm == cursor/* ]]; then
    yurm=cursor; cursor_izin
    env -u MDK_DONMUS -u MDK_METRIK -u MDK_DURUM -u MDK_PLAN_DOKUNMA -u MDK_KILIT setsid "${MDK_CURSOR:-cursor-agent}" -p --output-format stream-json --trust --model "${cm#cursor/}" "$ist" </dev/null >"$log" 2>"$log.err" &
  else
    yurm=opencode
    # v2 (adım 72): v1 ücretsiz modellerde "Unexpected server error" veriyor
    OPENCODE_LOG_LEVEL=error env -u MDK_DONMUS -u MDK_METRIK -u MDK_DURUM -u MDK_PLAN_DOKUNMA -u MDK_KILIT setsid "$OC" run -m "$cm" --title "$bas" --format json --print-logs \
      "$ist" </dev/null >"$log" 2>"$log.err" &
  fi
  pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    sleep "$POLL"
    el=$(( $(date +%s) - t0 ))
    if grep -qE "$KOTA_KALIP" "$log.err" 2>/dev/null || grep -qE '"type":"error".*('"$KOTA_KALIP"')' "$log" 2>/dev/null; then neden=kota   # kota dolu: stderr'deki log ya da v2'nin stdout error olayı (yalnız error olayı: araç çıktısında geçen metin sayılmaz); ILK'yı bekleme
    elif [ ! -s "$log" ] && [ "$el" -ge "$ILK" ]; then neden=yanit_yok
    elif [ "$el" -ge "$SURE" ]; then neden=sure
    elif [ "$bd" = 1 ] && [ -n "$butce" ]; then   # ponytail: bütçe yoklama aralığında ölçülür, tek tur bütçeyi biraz aşabilir; sert sınır için token akışı izlenmeli
      read -r _ _ tok _ < <(topla "$log"); [ $((harcanan + tok)) -gt "$butce" ] && neden=butce   # bütçe etkin token: önbellekten yeniden okunan bağlam sayılmaz
    fi
    [ -z "$neden" ] || { kill -TERM -- -"$pid" 2>/dev/null; sleep 2; kill -KILL -- -"$pid" 2>/dev/null; break; }
  done
  wait "$pid" 2>/dev/null
  # hızlı kota çıkışı: Go kota hatası POLL (3 sn) dolmadan çıkabilir; çıktıktan sonra da kontrol et
  [ -z "$neden" ] && [ "$yurm" = opencode ] && { grep -qE "$KOTA_KALIP" "$log.err" 2>/dev/null || grep -qE '"type":"error".*('"$KOTA_KALIP"')' "$log" 2>/dev/null; } && neden=kota
  # ponytail: Cursor kota metni henüz görülmedi, tahmin; gerçek mesaj görülünce daralt
  [ -z "$neden" ] && [ "$yurm" = cursor ] && grep -qiE "usage limit|rate limit|upgrade to|quota" "$log.err" 2>/dev/null && neden=kota
  pgrep -g "$pid" >/dev/null && kill -KILL -- -"$pid" 2>/dev/null   # grupta kalan yetim süreç
  [ -n "$neden" ] && [ "$yurm" = opencode ] && oturum_kapat "$log" "$bas"
  return 0
}

EKSIK_KAPILAR=(); izin_kur kod
# otomatik kapı üretimi: adımdaki .test.mjs/.test.sh veya kapi/* dosyası diskte yoksa ve PLAN'da Görev kapi: varsa önce kapıyı yazdır
mapfile -t EKSIK_KAPILAR < <(printf '%s\n' "${KAPILAR[@]}" | grep -oE '([A-Za-z0-9_./-]+\.test\.(mjs|sh)|kapi/[A-Za-z0-9_./-]+\.(sh|py|mjs|java))' | grep -v '^kapi/derle\.sh$' | sort -u | while read -r tf; do [ -n "$tf" ] && [ ! -f "$tf" ] && echo "$tf"; done)
if [ ${#EKSIK_KAPILAR[@]} -gt 0 ]; then
  kapi_satir=$(grep -m1 -oP '^Görev kapi: \K.*' "$PLAN" || true)
  if [ -n "$kapi_satir" ]; then
    IFS=, read -ra KAPI_MOD <<<"$(tr -d ' ' <<<"$kapi_satir")"
    eksik_str="${EKSIK_KAPILAR[*]}"; kapi_ok=0; kd=0; harcanan=0
    izin_kur kapi
    for km in "${KAPI_MOD[@]}"; do
      kd=$((kd+1)); yaz_durum "$km" "$kd" kapi_yaziliyor
      klog="$LOGD/kapi$N-$(date +%s).jsonl"
      kistem="$KURALLAR

Görev: KAPI ÜRETME. Aşağıdaki adım için YALNIZCA şu eksik kapı test dosyasını yaz: $eksik_str. Üretim koduna dokunma.
Yazdığın test mevcut kodda KIRMIZI (çıkış != 0) olmalı, adımın 'Ne:' maddesi uygulandığında YEŞİL (çıkış 0) olmalı.
Kapı metnindeki her iddiayı ayrı bir assert ile ve davranışı ÇALIŞTIRARAK doğrula (modülü içe aktar, süreci ya da sunucuyu başlat); yalnız kaynak dosyada metin arayan test zayıf kapıdır. Başarı, hata ve sınır durumunu kapsa.
$PROJE_KURAL
Adım (PLAN.md adım $N; metnin tamamı burada):
$blok"
      calistir "$km" "kapi-$N" "$kistem" "$klog" 0; kneden=$neden
      hepsi_var=1; for tf in "${EKSIK_KAPILAR[@]}"; do [ -f "$tf" ] || hepsi_var=0; done
      git add -A
      diger=$(git diff --cached --name-only "$CP" | grep -vxFf <(printf '%s\n' "${EKSIK_KAPILAR[@]}") || true)
      if [ -z "$kneden" ]; then
        if [ "$hepsi_var" != 1 ]; then kneden=kapi_eksik          # istenen dosya yazılmadı
        elif [ -n "$diger" ]; then kneden=kapi_kapsam             # başka dosyaya dokundu
        else
          # doğru nedenle kırmızı: sözdizimi bozuk test de "kırmızı"dır ama hiçbir şeyi sınamaz
          for tf in "${EKSIK_KAPILAR[@]}"; do
            case $tf in *.mjs) node --check "$tf" ;; *.sh) bash -n "$tf" ;; esac >/dev/null 2>&1 || kneden=kapi_sozdizimi
          done
          if [ -z "$kneden" ]; then
            kirmizi=0
            for k in "${KAPILAR[@]}"; do
              env -u MDK_DONMUS -u MDK_METRIK -u MDK_DURUM -u MDK_PLAN_DOKUNMA -u MDK_KILIT bash -c "$k" >"$klog.kapi" 2>&1 || { kirmizi=1; break; }
            done
            [ "$kirmizi" = 1 ] || kneden=kapi_yesil               # kod yazılmadan geçen kapı hiçbir şeyi sınamıyor
          fi
        fi
      fi
      read -r tok mal etkin istek < <(topla "$klog")
      knedenj=null; [ -z "$kneden" ] || knedenj="\"$kneden\""
      # kapı üretimi de ölçülür; tur=kapi satırları model/adım istatistiğine girmez (panel ayrı sayar)
      yaz_metrik "{\"tur\":\"kapi\",\"ts\":$(date +%s),\"adim\":$N,\"yurutucu\":\"$yurm\",\"model\":\"$km\",\"gorev\":\"kapi\",\"deneme\":$kd,\"gecti\":$([ -z "$kneden" ] && echo true || echo false),\"sure_sn\":$(( $(date +%s)-t0 )),\"token\":$tok,\"etkin\":$etkin,\"istek\":$istek,\"maliyet\":$mal,\"neden\":$knedenj}"
      if [ -z "$kneden" ]; then
        # zayıf kapı uyarısı (reddetmez): yalnız kaynak metni arayan test; planlayan görsün
        for tf in "${EKSIK_KAPILAR[@]}"; do
          [ -f "$MDK_SELF_DIR/kapi-denetle.mjs" ] && node "$MDK_SELF_DIR/kapi-denetle.mjs" --dosya "$tf" 2>/dev/null || true
        done
        git diff --cached --quiet || { git commit -qm "adım $N kapısı: $eksik_str ($km)"; CP=$(git rev-parse HEAD); }
        kapi_ok=1; break
      fi
      echo "adım $N: kapı üretimi başarısız ($km: $kneden)"
      rm -f "${EKSIK_KAPILAR[@]}"; git reset -q --hard "$CP"; git clean -fdq
    done
    izin_kur kod
    [ "$kapi_ok" = 1 ] || { yaz_durum "" 0 kapi_hata; echo "adım $N: eksik kapı ($eksik_str) üretilemedi veya kırmızı doğrulanamadı"; exit 4; }
  fi
fi
# yerel/ignore'lu kapi/ dizini varsa (dbeaver-mm, adimadim) kurcalama tespiti için özetini al
kapi_imza=""
[ -d kapi ] && kapi_imza=$(find kapi -type f -exec cksum {} + 2>/dev/null | sort || true)
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
    istem="$KURALLAR

Aşağıdaki adımı yap, yalnızca onu (PLAN.md adım $N; metnin tamamı burada).
$PROJE_KURAL
Adım:
$blok
$persona_ipucu
$SADE_IPUCU
$ipucu"
    calistir "$m" "adim-$N" "$istem" "$log" 1
    # 0-sn doktor: CLI argüman/ikili hatası varsa (0 olay + stderr'de CLI hatası) diğer modelleri boşuna deneme
    if [ -z "$neden" ] && [ ! -s "$log" ] && grep -qiE "Unknown argument|Positionals:|command not found|No such file" "$log.err" 2>/dev/null; then
      kilit_birak; yaz_durum "$m" "$d" ortam_hatasi
      echo "adım $N: çalıştırıcı/ortam hatası ($m):" >&2; head -5 "$log.err" >&2
      git reset -q --hard "$CP"; git clean -fdq; exit 4
    fi
    # kurcalama: model kapı dosyasını (test/, *.test.*, PLAN.md) değiştirip ya da silip geçmesin
    git add -A
    # SORUN.md: model bir sorun bildirdiyse kapı geçse bile deneme başarısız; içerik sonraki denemeye ipucu olur
    if [ -f SORUN.md ]; then   # kopya her zaman alınır (reset/clean silmeden önce); etiket yalnızca önceliği boşsa
      cp SORUN.md "$LOGD/sorun-$N-$(date +%s).md"; sorun_icerik=$(cat SORUN.md)
      [ -n "$neden" ] || neden=sorun
    fi
    if [ -z "$neden" ]; then
      kurcalama=$(git diff --cached --name-only --no-renames --diff-filter=MD "$CP" | grep -E '(^|/)test/|^kapi/|\.test\.[a-z]+$|^PLAN\.md$' || true)
      if [ -z "$kurcalama" ] && [ -n "$kapi_imza" ]; then
        yeni_kapi_imza=$(find kapi -type f -exec cksum {} + 2>/dev/null | sort || true)
        [ "$yeni_kapi_imza" = "$kapi_imza" ] || kurcalama="kapi/"
      fi
      if [ -n "$kurcalama" ]; then
        printf 'kurcalama: kapı dosyaları değiştirilmiş, kapı çalıştırılmadı:\n%s\nKapı dosyalarını değiştirme.\n' "$kurcalama" >"$log.kapi"
        neden=kurcalama
      else
        for k in "${KAPILAR[@]}"; do   # ilk başarısız kapıda dur; o kapının çıktısı $log.kapi'de kalır
          env -u MDK_DONMUS -u MDK_METRIK -u MDK_DURUM -u MDK_PLAN_DOKUNMA -u MDK_KILIT bash -c "$k" >"$log.kapi" 2>&1 || { neden=kapi; break; }   # MDK_DONMUS iç değişken: kapıdaki mdk-adim.test.sh donmuş kopya vakasını bozuyordu
        done
        # kapı sonrası regresyon: adım kapısı geçse de başka test kırıldıysa deneme başarısız (adım 121: kapı geçti, denge testi bozuldu, elle düzeltildi)
        if [ -z "$neden" ] && [ -f test/hepsi.sh ] && [ -z "${MDK_ONKONTROL_YOK:-}" ]; then
          yaz_durum "$m" "$d" regresyon
          env -u MDK_DONMUS -u MDK_METRIK -u MDK_DURUM -u MDK_PLAN_DOKUNMA -u MDK_KILIT HEPSI_HIZLI=1 bash test/hepsi.sh >"$log.kapi" 2>&1 || neden=regresyon
        fi
      fi
    fi
    git add -A; read -r ek sil dos < <(git diff --cached --numstat | awk '{a+=$1;s+=$2;f++} END{print a+0,s+0,f+0}')
    read -r tok mal etkin istek < <(topla "$log"); harcanan=$((harcanan + etkin))
    nedenj=null; [ -z "$neden" ] || nedenj="\"$neden\""
    yaz_metrik "{\"ts\":$(date +%s),\"adim\":$N,\"yurutucu\":\"$yurm\",\"model\":\"$m\",\"gorev\":\"$gorev\",\"deneme\":$d,\"gecti\":$([ -z "$neden" ] && echo true || echo false),\"sure_sn\":$(( $(date +%s)-t0 )),\"token\":$tok,\"etkin\":$etkin,\"istek\":$istek,\"deney\":$deneyj,\"sade\":${MDK_SADE:-0},\"maliyet\":$mal,\"eklenen\":$ek,\"silinen\":$sil,\"dosya\":$dos,\"neden\":$nedenj}"
    if [ -z "$neden" ]; then
      [ "${MDK_PLAN_DOKUNMA:-0}" = 1 ] || sed -i -E "s/^- \[ \] $N\./- [x] $N./" "$PLAN"; git add -A
      git commit -qm "adım $N: $baslik ($m, deneme $d)"; yaz_durum "$m" "$d" gecti
      if grep -qiE '^\s*-\s+(İncele|Incele):\s*evet\b' <<<"$blok" && [ -f "$MDK_SELF_DIR/mdk-incele.sh" ]; then
        env -u MDK_DONMUS -u MDK_METRIK -u MDK_DURUM -u MDK_PLAN_DOKUNMA -u MDK_KILIT bash "$MDK_SELF_DIR/mdk-incele.sh" "$N" "$PLAN" || true
      fi
      echo "adım $N geçti ($m, deneme $d)"; exit 0
    fi
    case $neden in
      kapi|kurcalama) ipucu="Önceki deneme kapıyı geçemedi. Kapı çıktısının sonu:
$(tail -c 1500 "$log.kapi")" ;;
      regresyon)      ipucu="Önceki deneme adım kapısını geçti ama regresyonu bozdu (başka bir test kırıldı). O davranışı koruyarak adımı yeniden yap; kırılan testi değiştirme. Çıktının sonu:
$(grep 'BAŞARISIZ' "$log.kapi" | head -5)
$(tail -c 1200 "$log.kapi")" ;;
      sure)           ipucu="Önceki deneme $SURE sn içinde bitmedi; işi daha küçük tut." ;;
      sorun)          ipucu="Önceki deneme SORUN.md bıraktı; sorunu gider ve adımı yeniden yap. SORUN.md:
$sorun_icerik" ;;
    esac
    git reset -q --hard "$CP"; git clean -fdq    # temiz başlangıç (ignore'lanan metrik/log dosyaları kalır)
    [ "$neden" = kota ] && kota_goruldu=1
    echo "adım $N: $m deneme $d başarısız ($neden)"
    case $neden in yanit_yok|kota) ;; *) SAGLAYICI=0 ;; esac   # kota/sessizlik model değil sağlayıcı sorunu: eskale etme
    [ "$neden" = sorun ] && [ "$d" = "$DENEME" ] && { durdu=sorun; break; }   # SORUN.md çözülmediyse diğer modelleri boşuna deneme
    [ "$neden" = butce ] && { durdu=butce; break; }   # bu modelin bütçesi bitti: sıradaki modele geç
    case $neden in yanit_yok|kota) break ;; esac   # sessiz/kotalı modeli yeniden denemek boşuna: sıradaki modele geç
  done
  kilit_birak
  [ "$durdu" = sorun ] && break
done
if [ "${#bekleyen[@]}" -gt 0 ] && [ "$durdu" != sorun ]; then
  aday=("${bekleyen[@]}")
  if [ $denendi = 0 ]; then   # tüm kalan modeller kilitli: bekle, tavan dolunca çık (model çağrılmadan)
    [ $((beklenen + KILIT_BEKLE)) -gt "$KILIT_TAVAN" ] && { yaz_durum "" 0 kilit; echo "adım $N: modeller $KILIT_TAVAN sn kilitli kaldı"; exit 8; }
    sleep "$KILIT_BEKLE"; beklenen=$((beklenen + KILIT_BEKLE))
  fi
elif [ "${eskale_denendi:-0}" = 0 ] && [ $SAGLAYICI = 0 ] && [ "$durdu" != sorun ] && [ ${#ESKALE_MODELLER[@]} -gt 0 ]; then
  eskale_denendi=1; DENEME=1; gorev=eskale; aday=("${ESKALE_MODELLER[@]}")
else
  break
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
