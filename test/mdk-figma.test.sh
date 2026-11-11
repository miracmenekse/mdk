#!/usr/bin/env bash
# mdk-figma.sh kapı testi: başlat/durdur/durum, PID, çift başlatma, ölen bun, eklenti kopyası.
RUNNER=$(cd "$(dirname "$0")/.." && pwd)/mdk-figma.sh
FAIL=0
kontrol() { eval "$1" || { echo "BAŞARISIZ: $1"; FAIL=1; }; }

T=$(mktemp -d)
TTF="$T/ttf"
mkdir -p "$TTF/src/cursor_mcp_plugin"
printf 'socket\n' > "$TTF/src/socket.ts"
for f in code.js ui.html setcharacters.js; do printf '%s\n' "$f" > "$TTF/src/cursor_mcp_plugin/$f"; done

BUN_LIVE="$T/bun-live"
cat > "$BUN_LIVE" <<'EOF'
#!/usr/bin/env bash
if [ "$1" = "run" ]; then exec sleep 300; fi
exit 1
EOF
chmod +x "$BUN_LIVE"

BUN_DIE="$T/bun-die"
printf '#!/usr/bin/env bash\nexit 1\n' > "$BUN_DIE"
chmod +x "$BUN_DIE"

PIDF="$T/figma.pid"
export MDK_TTF_DIR="$TTF"
export MDK_BUN="$BUN_LIVE"
export MDK_FIGMA_PID="$PIDF"
export MDK_FIGMA_PORT=3055

cleanup() {
  if [ -f "$PIDF" ]; then
    p=$(cat "$PIDF" 2>/dev/null || true)
    [ -n "$p" ] && kill "$p" 2>/dev/null
    for _ in $(seq 1 20); do kill -0 "$p" 2>/dev/null || break; sleep 0.1; done
  fi
  rm -rf "$T"
}
trap cleanup EXIT

# durum: başta çalışmıyor, çıkış 3
bash "$RUNNER" durum >"$T/durum1" 2>&1; K1=$?
kontrol '[ "$K1" = 3 ]'
kontrol 'grep -q "çalışmıyor" "$T/durum1"'

# start: çıkış 0, başlatıldı, PID dosyası var, süreç canlı
bash "$RUNNER" start >"$T/start1" 2>&1; K2=$?
sleep 0.2
kontrol '[ "$K2" = 0 ]'
kontrol 'grep -q "başlatıldı" "$T/start1"'
kontrol '[ -f "$PIDF" ]'
PID=$(cat "$PIDF" 2>/dev/null)
kontrol 'kill -0 "$PID" 2>/dev/null'
kontrol 'grep -q "pid=$PID" "$T/start1"'
kontrol 'grep -q "port=3055" "$T/start1"'

# ikinci start: zaten çalışıyor, aynı PID
bash "$RUNNER" start >"$T/start2" 2>&1; K3=$?
kontrol '[ "$K3" = 0 ]'
kontrol 'grep -q "zaten çalışıyor" "$T/start2"'
kontrol '[ "$(cat "$PIDF")" = "$PID" ]'

# durum: çalışıyor
bash "$RUNNER" durum >"$T/durum2" 2>&1; K4=$?
kontrol '[ "$K4" = 0 ]'
kontrol 'grep -q "çalışıyor" "$T/durum2"'
kontrol 'grep -q "pid=$PID" "$T/durum2"'

# stop: süreç ölü, PID dosyası yok, durduruldu
bash "$RUNNER" stop >"$T/stop1" 2>&1; K5=$?
sleep 0.5
kontrol '[ "$K5" = 0 ]'
kontrol '! kill -0 "$PID" 2>/dev/null'
kontrol '[ ! -f "$PIDF" ]'
kontrol 'grep -q "durduruldu" "$T/stop1"'
kontrol 'grep -q "pid=$PID" "$T/stop1"'

# ikinci stop: çalışmıyor, çıkış 0
bash "$RUNNER" stop >"$T/stop2" 2>&1; K6=$?
kontrol '[ "$K6" = 0 ]'
kontrol 'grep -q "çalışmıyor" "$T/stop2"'

# hemen ölen bun ile start: çıkış 1, PID dosyası kalmaz
MDK_BUN="$BUN_DIE" bash "$RUNNER" start >"$T/start3" 2>&1; K7=$?
sleep 0.6
kontrol '[ "$K7" = 1 ]'
kontrol '[ ! -f "$PIDF" ]'

# eklenti: üç dosya + manifest kopyalanır
TARGET="$T/eklenti"
bash "$RUNNER" eklenti "$TARGET" >"$T/eklenti_out" 2>&1; K8=$?
kontrol '[ "$K8" = 0 ]'
for f in code.js ui.html setcharacters.js manifest.json; do
  kontrol "[ -f \"$TARGET/$f\" ]"
done
for f in code.js ui.html setcharacters.js; do
  kontrol "cmp -s \"$TTF/src/cursor_mcp_plugin/$f\" \"$TARGET/$f\""
done
kontrol "cmp -s \"$(cd "$(dirname "$0")/.." && pwd)/figma/eklenti-manifest.json\" \"$TARGET/manifest.json\""
kontrol "node -e 'const fs=require(\"fs\");const j=JSON.parse(fs.readFileSync(process.argv[1],\"utf8\"));if(!Array.isArray(j.networkAccess&&j.networkAccess.allowedDomains)||!j.networkAccess.allowedDomains.includes(\"ws://localhost:3055\"))process.exit(1);' \"$TARGET/manifest.json\""
kontrol '! grep -q "google-analytics" "$TARGET/manifest.json"'

if command -v wslpath >/dev/null 2>&1; then
  EXPECTED=$(wslpath -w "$TARGET/manifest.json")
else
  EXPECTED="$TARGET/manifest.json"
fi
kontrol 'grep -Fq "$EXPECTED" "$T/eklenti_out"'

# bilinmeyen alt komut: çıkış 2
bash "$RUNNER" xyz >"$T/xyz" 2>&1; K9=$?
kontrol '[ "$K9" = 2 ]'
kontrol 'grep -qi "kullanım" "$T/xyz"'

if [ "$FAIL" = 0 ]; then
  echo "mdk-figma.test ok"
  exit 0
else
  echo "mdk-figma.test BAŞARISIZ"
  exit 1
fi
