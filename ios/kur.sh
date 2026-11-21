#!/usr/bin/env bash
set -e

# MDK iPhone Kurulum Betiği (7 günlük ücretsiz imza ile cihaza yükleme)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KOK="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLE_ID="com.miracmenekse.mdk"

echo "==> Bağlı iPhone aranıyor (xcrun devicectl list devices)..."

# xcrun devicectl list devices çıktısından simülatör olmayan, bağlı/eşli iPhone'u bul
JSON_TMP=$(mktemp)
CIHAZ_ID=""
XCODE_DEST="generic/platform=iOS"
if xcrun devicectl list devices --json-output "$JSON_TMP" >/dev/null 2>&1; then
  BILGI=$(node -e '
    const fs = require("fs");
    try {
      const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const list = d?.result?.devices || [];
      const dev = list.find((x) => {
        const reality = x?.hardwareProperties?.reality || "";
        const type = x?.hardwareProperties?.deviceType || "";
        const pairing = x?.connectionProperties?.pairingState || "";
        const tunnel = x?.connectionProperties?.tunnelState || "";
        if (reality === "simulated") return false;
        if (type && type !== "iPhone") return false;
        return pairing === "paired" || tunnel === "connected" || tunnel === "available";
      });
      if (dev) {
        const id = dev.identifier || "";
        const udid = dev?.hardwareProperties?.udid || "";
        if (id) console.log(id + "\t" + udid);
      }
    } catch {}
  ' "$JSON_TMP" 2>/dev/null || true)
  if [ -n "$BILGI" ]; then
    CIHAZ_ID=$(printf '%s' "$BILGI" | cut -f1)
    UDID=$(printf '%s' "$BILGI" | cut -f2)
    [ -n "$UDID" ] && XCODE_DEST="id=$UDID"
  fi
fi
rm -f "$JSON_TMP"

# JSON alınamazsa tablo çıktısından (simulated/unavailable/shutdown hariç) oku
if [ -z "$CIHAZ_ID" ]; then
  CIHAZ_ID=$(xcrun devicectl list devices 2>/dev/null | awk '
    !/simulated|unavailable|shutdown/ && /(connected|available)/ {
      for (i = 1; i <= NF; i++) {
        if ($i ~ /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/ || $i ~ /^[0-9a-fA-F]{24,40}$/) {
          print $i;
          exit;
        }
      }
    }
  ')
fi

if [ -z "$CIHAZ_ID" ]; then
  echo "HATA: Bağlı fiziksel iPhone bulunamadı!" >&2
  echo "" >&2
  echo "Ne yapılmalı:" >&2
  echo "1. iPhone'unuzu USB kablosuyla Mac'e bağlayın." >&2
  echo "2. iPhone ekranında 'Bu Bilgisayara Güven' sorusunu onaylayıp parolanızı girin." >&2
  echo "3. Ayarlar > Gizlilik ve Güvenlik > Geliştirici Modu'nu açın (cihaz yeniden başlar)." >&2
  echo "4. 'xcrun devicectl list devices' komutunu çalıştırarak cihazın 'connected' göründüğünü doğrulayın." >&2
  echo "5. Cihaz bağlandıktan sonra bu betiği tekrar çalıştırın." >&2
  exit 1
fi

echo "==> Cihaz bulundu: $CIHAZ_ID"

cd "$SCRIPT_DIR"

echo "==> Xcode projesi üretiliyor (xcodegen)..."
if ! xcodegen generate; then
  echo "HATA: xcodegen generate başarısız oldu." >&2
  exit 1
fi

echo "==> Uygulama derleniyor ve imzalanıyor (xcodebuild -destination $XCODE_DEST)..."
DERLEME_LOG=$(mktemp)
if ! xcodebuild -project MDK.xcodeproj \
  -scheme MDK \
  -configuration Debug \
  -destination "$XCODE_DEST" \
  -derivedDataPath .derle \
  -allowProvisioningUpdates \
  build > "$DERLEME_LOG" 2>&1; then
  cat "$DERLEME_LOG" >&2
  if grep -qiE "signing|code signing|provisioning profile|development team|account" "$DERLEME_LOG"; then
    echo "" >&2
    echo "================================================================================" >&2
    echo "UYARI: Kod imzalama hatası tespit edildi!" >&2
    echo "Xcode'da ücretsiz Apple ID / Geliştirici hesabı tanımlamanız gerekiyor:" >&2
    echo "1. Xcode'u açın: Xcode > Settings (veya Preferences) > Accounts sekmesine gidin." >&2
    echo "2. Sol alttaki '+' butonuna tıklayıp Apple ID'nizi ekleyin (ücretsiz hesap yeterlidir)." >&2
    echo "3. ios/project.yml dosyasındaki DEVELOPMENT_TEAM alanını kendi takım kimliğinizle güncelleyin." >&2
    echo "   (Takım kimliğinizi Xcode > Settings > Accounts > Apple ID > Manage Certificates alanında görebilirsiniz)." >&2
    echo "4. Tekrar deneyin: bash ios/kur.sh" >&2
    echo "================================================================================" >&2
  else
    echo "HATA: xcodebuild derleme adımı başarısız oldu." >&2
  fi
  rm -f "$DERLEME_LOG"
  exit 1
fi
rm -f "$DERLEME_LOG"

APP_YOLU="$SCRIPT_DIR/.derle/Build/Products/Debug-iphoneos/MDK.app"
if [ ! -d "$APP_YOLU" ]; then
  echo "HATA: Derlenen uygulama paketi bulunamadı: $APP_YOLU" >&2
  exit 1
fi

echo "==> Cihaza yükleniyor (devicectl device install app)..."
if ! xcrun devicectl device install app --device "$CIHAZ_ID" "$APP_YOLU"; then
  echo "HATA: Uygulama cihaza yüklenemedi (devicectl device install app)." >&2
  exit 1
fi

echo "==> Uygulama başlatılıyor (devicectl device process launch)..."
if ! xcrun devicectl device process launch --device "$CIHAZ_ID" "$BUNDLE_ID"; then
  echo "HATA: Uygulama başlatılamadı (devicectl device process launch)." >&2
  exit 1
fi

echo "==> MDK başarıyla iPhone'a kuruldu ve başlatıldı!"
