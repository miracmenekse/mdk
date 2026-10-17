#!/usr/bin/env bash
# Panel başlat/durdur/durum. Kullanım: op-panel.sh start|stop|durum [dizin] [port]
# Süreç PID ile yönetilir (pkill -f yok: kendi kabuğunu da öldürür).
KOK=$(cd "$(dirname "$0")" && pwd)
komut=${1:-}
DIZIN=$(cd "${2:-.}" && pwd) || exit 1
PORT=${3:-4747}
PIDF="$DIZIN/.op-log/panel.pid"

calisiyor() { [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF")" 2>/dev/null; }

case "$komut" in
  start)
    if calisiyor; then
      echo "zaten çalışıyor pid=$(cat "$PIDF") http://127.0.0.1:$PORT"
      exit 0
    fi
    mkdir -p "$DIZIN/.op-log"
    setsid nohup node "$KOK/panel/sunucu.mjs" "$DIZIN" "$PORT" >"$DIZIN/.op-log/panel.log" 2>&1 &
    pid=$!
    echo $pid >"$PIDF"
    sleep 0.4   # port doluysa süreç hemen düşer; "başlatıldı" yalanı söylememek için canlılığı doğrula
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PIDF"
      echo "başlatılamadı (port $PORT dolu olabilir): $(tail -n 2 "$DIZIN/.op-log/panel.log")" >&2
      exit 1
    fi
    echo "başlatıldı pid=$pid http://127.0.0.1:$PORT"
    ;;
  stop)
    if ! calisiyor; then
      rm -f "$PIDF"
      echo "çalışmıyor"
      exit 0
    fi
    pid=$(cat "$PIDF")
    kill "$pid"
    for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || break; sleep 0.1; done
    rm -f "$PIDF"
    echo "durduruldu pid=$pid"
    ;;
  durum)
    if calisiyor; then
      echo "çalışıyor pid=$(cat "$PIDF") http://127.0.0.1:$PORT"
      exit 0
    fi
    echo "çalışmıyor"
    exit 1
    ;;
  *)
    echo "kullanım: op-panel.sh start|stop|durum [dizin] [port]" >&2
    exit 2
    ;;
esac
