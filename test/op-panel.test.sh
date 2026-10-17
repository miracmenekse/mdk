#!/usr/bin/env bash
# op-panel.sh testi: başlat/durdur/durum, pid dosyası, çift başlatma, yetim süreç yok.
RUNNER=$(cd "$(dirname "$0")/.." && pwd)/op-panel.sh
FAIL=0
kontrol() { eval "$1" || { echo "BAŞARISIZ: $1"; FAIL=1; }; }
T=$(mktemp -d)
printf 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n' >"$T/PLAN.md"
PORT=$(node -e 'const s=require("net").createServer().listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')
trap 'bash "$RUNNER" stop "$T" "$PORT" >/dev/null 2>&1' EXIT

bash "$RUNNER" durum "$T" "$PORT" >"$T/c1" 2>&1; K1=$?
kontrol '[ "$K1" = 1 ] && grep -q "çalışmıyor" "$T/c1"'

bash "$RUNNER" start "$T" "$PORT" >"$T/c2" 2>&1; K2=$?
kontrol '[ "$K2" = 0 ]'
kontrol '[ -f "$T/.op-log/panel.pid" ]'
PID=$(cat "$T/.op-log/panel.pid" 2>/dev/null)
for _ in $(seq 1 25); do curl -s "http://127.0.0.1:$PORT/api/durum" | grep -q kategoriler && break; sleep 0.2; done
kontrol 'curl -s "http://127.0.0.1:$PORT/api/durum" | grep -q kategoriler'
kontrol 'kill -0 "$PID" 2>/dev/null'

bash "$RUNNER" start "$T" "$PORT" >"$T/c3" 2>&1; K3=$?
kontrol '[ "$K3" = 0 ] && grep -q "zaten çalışıyor" "$T/c3"'
kontrol '[ "$(cat "$T/.op-log/panel.pid")" = "$PID" ]'   # ikinci başlatma yeni süreç açmamalı

bash "$RUNNER" durum "$T" "$PORT" >"$T/c4" 2>&1; K4=$?
kontrol '[ "$K4" = 0 ] && grep -q "çalışıyor" "$T/c4" && grep -q "pid=$PID" "$T/c4" && grep -q "$PORT" "$T/c4"'

bash "$RUNNER" stop "$T" "$PORT" >"$T/c5" 2>&1; K5=$?
kontrol '[ "$K5" = 0 ]'
sleep 0.5
kontrol '! kill -0 "$PID" 2>/dev/null'
kontrol '[ ! -f "$T/.op-log/panel.pid" ]'
kontrol '! curl -s -m 2 "http://127.0.0.1:$PORT/api/durum" >/dev/null 2>&1'

bash "$RUNNER" stop "$T" "$PORT" >"$T/c6" 2>&1; K6=$?
kontrol '[ "$K6" = 0 ] && grep -q "çalışmıyor" "$T/c6"'

[ $FAIL = 0 ] && echo "op-panel.test ok" || { echo "op-panel.test BAŞARISIZ"; exit 1; }
