#!/usr/bin/env bash
# adım 83: persona-tur.sh varsayılan modelleri PLAN'daki `Görev persona:` satırından alır.
# Kullanım: bash test/persona-gorev.test.sh   (setup/kos persona-tur.test.sh'ten)
source <(sed -n '/^RUNNER=/,/^DIZ()/p' "$(dirname "$0")/persona-tur.test.sh")

CASE=gorev_persona  # Görev persona satırı Modeller'in önüne geçer
setup 'yanit "Seçenek A — x: tamam."'
sed -i 's/^Modeller: .*/&\nGörev kod: m\/kod\nGörev persona: m\/p1, m\/p2/' "$T/p/PLAN.md"
kos bash "$RUNNER" dev soru.md "Kart Bir" "Kart Üç"
kontrol '[ $KOD = 0 ]'
kontrol '[ "$(cut -d"|" -f1 "$T/cagri.log" | sort | paste -sd,)" = "m/p1,m/p2" ]'

CASE=modeller_yedek  # Görev persona yoksa Modeller (eski davranış)
setup 'yanit "Seçenek A — x: tamam."'
sed -i 's/^Modeller: .*/&\nGörev kod: m\/kod/' "$T/p/PLAN.md"
kos bash "$RUNNER" dev soru.md "Kart Bir" "Kart Üç"
kontrol '[ $KOD = 0 ]'
kontrol '! grep -q "m/kod" "$T/cagri.log" && grep -q "^m/bir|" "$T/cagri.log"'

CASE=ortam_once  # PERSONA_MODELLER her şeyin önünde
setup 'yanit "Seçenek A — x: tamam."'
sed -i 's/^Modeller: .*/&\nGörev persona: m\/p1/' "$T/p/PLAN.md"
kos env PERSONA_MODELLER=m/env bash "$RUNNER" dev soru.md "Kart Bir"
kontrol '[ $KOD = 0 ]'
kontrol '[ "$(cut -d"|" -f1 "$T/cagri.log" | sort -u)" = m/env ]'

[ $FAIL = 0 ] && echo "persona-gorev.test ok" || { echo "persona-gorev.test BAŞARISIZ"; exit 1; }
