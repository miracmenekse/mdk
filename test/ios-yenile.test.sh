#!/usr/bin/env bash
KOK=$(cd "$(dirname "$0")/.." && pwd); D=$(mktemp -d)
swiftc -parse-as-library "$KOK/ios/MDK/YenilemeKarari.swift" "$KOK/test/ios-yenile.test.swift" -o "$D/t" || exit 1
"$D/t"; k=$?; rm -rf "$D"; exit $k
