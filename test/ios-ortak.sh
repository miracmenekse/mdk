# iOS kapılarının ortak işlevleri: derle, simülatöre kur, kanıt sunucusu aç. source edilir.
set -uo pipefail
KOK=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PAKET=com.miracmenekse.mdk
UDID=${MDK_SIM:-561893AD-5010-42ED-AC97-72AD478CA460}  # iPhone 17 Pro, iOS 27
derle() {
  (cd "$KOK/ios" && xcodegen generate --quiet) || { echo "xcodegen başarısız"; exit 1; }
  xcodebuild -project "$KOK/ios/MDK.xcodeproj" -scheme MDK -destination "id=$UDID" \
    -derivedDataPath "$KOK/ios/.derle" CODE_SIGNING_ALLOWED=NO -quiet build || { echo "derleme başarısız"; exit 1; }
  APP="$KOK/ios/.derle/Build/Products/Debug-iphonesimulator/MDK.app"
  [ -d "$APP" ] || { echo "MDK.app üretilmedi"; exit 1; }
}
kur() {
  xcrun simctl boot "$UDID" 2>/dev/null; xcrun simctl bootstatus "$UDID" -b >/dev/null
  xcrun simctl terminate "$UDID" "$PAKET" 2>/dev/null
  xcrun simctl uninstall "$UDID" "$PAKET" 2>/dev/null
  xcrun simctl install "$UDID" "$APP" || { echo "kurulum başarısız"; exit 1; }
}
baslat() { SIMCTL_CHILD_MDK_PANEL_URL="$1" xcrun simctl launch "$UDID" "$PAKET" >/dev/null || { echo "açılmadı"; exit 1; }; }
