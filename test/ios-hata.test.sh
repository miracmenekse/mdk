#!/usr/bin/env bash
# Kapı (adım 115): sunucu kapalıyken açılır, sunucu sonradan gelince kendiliğinden panele geçer (yeniden deneme).
source "$(dirname "$0")/ios-ortak.sh"
derle; kur
P=47612
baslat "http://127.0.0.1:$P"
sleep 8
xcrun simctl spawn "$UDID" launchctl list 2>/dev/null | grep -q "$PAKET" || { echo "BAŞARISIZ: uygulama hata durumunda kapandı"; exit 1; }
node "$KOK/test/ios-kanit.mjs" $P 40 || { echo "BAŞARISIZ: sunucu gelince kendiliğinden yüklenmedi"; exit 1; }
xcrun simctl terminate "$UDID" "$PAKET" 2>/dev/null
echo "ios-hata.test ok"
