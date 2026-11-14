#!/usr/bin/env bash
# mdk-adim.sh Epic çözüm onayı kapısı: Tartışma'lı Epic onaysızsa adım hiç koşmaz (çıkış 5).
RUNNER=$(cd "$(dirname "$0")/.." && pwd)/mdk-adim.sh
FAIL=0
kontrol() { eval "$1" || { echo "BAŞARISIZ: $1"; FAIL=1; }; }

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

# taklit opencode: çağrıldığında işaret dosyasına yazar
cat >"$T/opencode-taklit" <<'EOF'
#!/usr/bin/env bash
printf 'cagrildi\n' >>"$ISARET"
exit 0
EOF
chmod +x "$T/opencode-taklit"

SAYAC=0
depo() { # $1 = PLAN gövdesi (Epic bölümü); R'yi kurar
  SAYAC=$((SAYAC + 1)); R="$T/r$SAYAC"; mkdir -p "$R"
  if ! (
    cd "$R" || exit 1
    git init -q && git config user.name t && git config user.email t@t || exit 1
    printf 'durum.json\nmetrikler.jsonl\n.mdk-log/\n' >.gitignore
    printf 'Yürütücü: opencode\nModeller: m/a\n\n%s\n' "$1" >PLAN.md
    git add -A && git commit -qm ilk
  ); then
    echo "depo kurulamadı"; exit 1
  fi
}

kos() { # $1 = işaret dosyası; KOD'a çıkış kodunu yazar
  ( cd "$R" || exit 1
    ISARET="$1" MDK_OPENCODE="$T/opencode-taklit" MDK_ONKONTROL_YOK=1 \
      MDK_METRIK="$T/metrik-$SAYAC.jsonl" MDK_DURUM="$T/durum-$SAYAC.json" \
      MDK_KILIT="$T/kilit-$SAYAC" POLL=1 DENEME=1 SURE=30 \
      bash "$RUNNER" 1
  ) >"$T/cikti-$SAYAC.txt" 2>&1
  KOD=$?
}

# (a) onaysız Epic: çıkış 5, uyarı, model çağrılmaz, PLAN değişmez
depo "## Epic 9 — Deneme
- Tartışma: epic/9
- [ ] 1. İş
  - Kapı: \`true\`"
cp "$R/PLAN.md" "$T/once-1"
kos "$T/isaret-1"
kontrol '[ "$KOD" = 5 ]'
kontrol 'grep -q "Epic çözüm onayı bekliyor" "$T/cikti-1.txt"'
kontrol '[ ! -e "$T/isaret-1" ]'
kontrol 'cmp -s "$R/PLAN.md" "$T/once-1"'

# (b) Epic bloğuna "- Onay: evet" eklenip commit: denetim geçer, adım koşar
depo "## Epic 9 — Deneme
- Tartışma: epic/9
- [ ] 1. İş
  - Kapı: \`true\`"
printf '%s\n' 'Yürütücü: opencode' 'Modeller: m/a' '' '## Epic 9 — Deneme' \
  '- Tartışma: epic/9' '- Onay: evet' '- [ ] 1. İş' '  - Kapı: `true`' >"$R/PLAN.md"
git -C "$R" add PLAN.md && git -C "$R" commit -qm onay
kos "$T/isaret-2"
kontrol '[ "$KOD" != 5 ]'
kontrol '! grep -q "Epic çözüm onayı" "$T/cikti-2.txt"'
kontrol '[ -e "$T/isaret-2" ]'

# (c) Epic'te "- Tartışma:" hiç yok: denetim geçer, adım koşar
depo "## Epic 9 — Deneme
- [ ] 1. İş
  - Kapı: \`true\`"
kos "$T/isaret-3"
kontrol '[ "$KOD" != 5 ]'
kontrol '[ -e "$T/isaret-3" ]'

# (d) "- Onay: evet" yalnız önceki Epic 8 bloğunda, Epic 9'da Tartışma var: çıkış 5
depo "## Epic 8 — Önceki
- Onay: evet
- [x] 8. Eski iş
  - Kapı: \`true\`

## Epic 9 — Deneme
- Tartışma: epic/9
- [ ] 1. İş
  - Kapı: \`true\`"
kos "$T/isaret-4"
kontrol '[ "$KOD" = 5 ]'
kontrol 'grep -q "Epic çözüm onayı bekliyor" "$T/cikti-4.txt"'
kontrol '[ ! -e "$T/isaret-4" ]'

if [ "$FAIL" = 0 ]; then
  echo "epic-onay.test ok"
  exit 0
else
  echo "epic-onay.test BAŞARISIZ"
  exit 1
fi
