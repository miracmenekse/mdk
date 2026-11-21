#!/usr/bin/env bash
set -e

# MDK iPhone Kurulum Betiği (7 günlük ücretsiz imza ile cihaza yükleme)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KOK="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLE_ID="com.miracmenekse.mdk"

echo "==> Bağlı iPhone aranıyor (xcrun devicectl list devices)..."

# xcrun devicectl list devices ile bağlı fiziksel cihazı ara
# Tablo çıktısında reality=physical olan ve connected/available durumundaki cihazın Identifier'ını al
CIHAZ_ID=$(xcrun devicectl list devices 2>/dev/null | awk '
  /physical/ && !/unavailable|shutdown/ {
    for (i = 1; i <= NF; i++) {
      if ($i ~ /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/ || $i ~ /^[0-9a-fA-F]{24,40}$/) {
        if ($(i+1) == "connected" || $(i+1) == "available") {
          print $i;
          exit;
        }
      }
    }
  }
')

# Eğer bulunamadıysa devicectl filter ile dene
if [ -z "$CIHAZ_ID" ]; then
  CIHAZ_ID=$(xcrun devicectl list devices --filter "Reality = 'physical' AND (State = 'connected' OR State = 'available')" --hide-headers --columns Identifier 2>/dev/null | grep -oE '[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}|[0-9a-fA-F]{24,40}' | head -n 1 || true)
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

echo "==> Uygulama derleniyor ve imzalanıyor (xcodebuild)..."
DERLEME_LOG=$(mktemp)
if ! xcodebuild -project MDK.xcodeproj \
  -scheme MDK \
  -configuration Debug \
  -destination "id=$CIHAZ_ID" \
  -derivedDataPath .derle \
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
