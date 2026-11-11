#!/usr/bin/env bash
# Talk to Figma WebSocket aktarıcısı: kur/start/stop/durum/eklenti.
# Kullanım: mdk-figma.sh start|stop|durum|eklenti [hedef]|kur
# Süreç PID ile yönetilir (pkill -f yok: kendi kabuğunu da öldürür).
KOK=$(cd "$(dirname "$0")" && pwd)
TTF=${MDK_TTF_DIR:-$HOME/projects/cursor-talk-to-figma-mcp}
BUN=${MDK_BUN:-bun}
PIDF=${MDK_FIGMA_PID:-$HOME/.local/share/talk-to-figma/socket.pid}
PORT=${MDK_FIGMA_PORT:-3055}
LOG=$(dirname "$PIDF")/socket.log
komut=${1:-}

calisiyor() { [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF")" 2>/dev/null; }

eklenti() {
  hedef=${1:-}
  if [ -z "$hedef" ]; then
    if [ -d /mnt/c ]; then
      kul=$(cmd.exe /c 'echo %USERNAME%' 2>/dev/null | tr -d '\r')
      hedef="/mnt/c/Users/$kul/talk-to-figma-eklenti"
    else
      hedef="$HOME/talk-to-figma-eklenti"
    fi
  fi
  kaynak="$TTF/src/cursor_mcp_plugin"
  mkdir -p "$hedef" || exit 1
  for f in code.js ui.html setcharacters.js; do
    cp "$kaynak/$f" "$hedef/$f" || { echo "kopyalanamadı: $kaynak/$f" >&2; exit 1; }
  done
  cp "$KOK/figma/eklenti-manifest.json" "$hedef/manifest.json" || exit 1
  yol="$hedef/manifest.json"
  if command -v wslpath >/dev/null 2>&1; then
    yol=$(wslpath -w "$yol")
  fi
  echo "$yol"
}

kur() {
  if [ ! -d "$TTF" ]; then
    git clone https://github.com/grab/cursor-talk-to-figma-mcp "$TTF" || exit 1
    (cd "$TTF" && git checkout ddd90f3) || exit 1
  fi
  if ! (cd "$TTF" && git apply --reverse --check "$KOK/figma/talk-to-figma.patch" >/dev/null 2>&1); then
    (cd "$TTF" && git apply "$KOK/figma/talk-to-figma.patch") || exit 1
  fi
  if [ -z "${BUN_CONFIG_REGISTRY:-}" ]; then
    (cd "$TTF" && BUN_CONFIG_REGISTRY=https://registry.yarnpkg.com "$BUN" install) || exit 1
  fi
  eklenti
  echo "claude mcp add --scope user TalkToFigma -- bun $TTF/src/talk_to_figma_mcp/server.ts"
}

case "$komut" in
  start)
    if calisiyor; then
      echo "zaten çalışıyor pid=$(cat "$PIDF")"
      exit 0
    fi
    mkdir -p "$(dirname "$PIDF")"
    cd "$TTF" || { echo "dizin yok: $TTF" >&2; exit 1; }
    setsid nohup "$BUN" run src/socket.ts >"$LOG" 2>&1 &
    pid=$!
    echo $pid >"$PIDF"
    sleep 0.5   # aktarıcı hemen düşerse "başlatıldı" yalanı söylememek için doğrula
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PIDF"
      echo "başlatılamadı: $(tail -n 2 "$LOG" 2>/dev/null)" >&2
      exit 1
    fi
    echo "başlatıldı pid=$pid port=$PORT"
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
      echo "çalışıyor pid=$(cat "$PIDF")"
      exit 0
    fi
    echo "çalışmıyor"
    exit 3
    ;;
  eklenti)
    eklenti "${2:-}"
    ;;
  kur)
    kur
    ;;
  *)
    echo "kullanım: mdk-figma.sh start|stop|durum|eklenti [hedef]|kur" >&2
    exit 2
    ;;
esac
