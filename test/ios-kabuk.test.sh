#!/usr/bin/env bash
# Kapı (adım 114): uygulama derlenir, simülatörde açılır, MDK_PANEL_URL'deki sayfayı yükleyip JS'ini koşar.
source "$(dirname "$0")/ios-ortak.sh"
derle; kur
P=47611
node "$KOK/test/ios-kanit.mjs" $P 40 & K=$!
sleep 1
baslat "http://127.0.0.1:$P"
wait $K || { echo "BAŞARISIZ: uygulama sayfayı yükleyip JS koşmadı"; exit 1; }
xcrun simctl terminate "$UDID" "$PAKET" 2>/dev/null
echo "ios-kabuk.test ok"
