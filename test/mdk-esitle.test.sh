#!/usr/bin/env bash
# mdk-esitle.sh testi: kurallar esit/ kaynağından kopyalanır, CLAUDE.md'nin makineye özgü üst kısmı korunur, yeniden koşu aynı sonucu verir.
KOK=$(cd "$(dirname "$0")/.." && pwd); FAIL=0
kontrol() { eval "$1" || { echo "BAŞARISIZ: $1"; FAIL=1; }; }
EV=$(mktemp -d); trap 'rm -rf "$EV"' EXIT
mkdir -p "$EV/.claude"; printf '# Bu makine\n\nÖzgü not.\n\n## Görev dağıtımı (modeller)\n- eski bayat kural gemini-4-argon\n' >"$EV/.claude/CLAUDE.md"
MDK_ESITLE_EV=$EV bash "$KOK/mdk-esitle.sh" >/dev/null
kontrol 'cmp -s "$KOK/esit/AGENTS.md" "$EV/.config/opencode/AGENTS.md"'
kontrol 'cmp -s "$KOK/esit/opencode.jsonc" "$EV/.config/opencode/opencode.jsonc"'
kontrol 'cmp -s "$KOK/esit/ba-pm-bakis.SKILL.md" "$EV/.claude/skills/ba-pm-bakis/SKILL.md"'
kontrol 'grep -q "Özgü not." "$EV/.claude/CLAUDE.md" && ! grep -q "eski bayat kural" "$EV/.claude/CLAUDE.md"'
kontrol '[ "$(grep -c "^## Görev dağıtımı" "$EV/.claude/CLAUDE.md")" = 1 ]'
kontrol 'tail -n +5 "$EV/.claude/CLAUDE.md" | cmp -s - "$KOK/esit/gorev-dagitimi.md"'
cp "$EV/.claude/CLAUDE.md" "$EV/once"; MDK_ESITLE_EV=$EV bash "$KOK/mdk-esitle.sh" >/dev/null
kontrol 'cmp -s "$EV/once" "$EV/.claude/CLAUDE.md"'
# model adları kurallarda durmaz (tek kaynak PLAN.md Görev satırları); yürütücü kuralları genel AGENTS.md'de kopyalanmaz
kontrol '! grep -rqE "opencode-go/|gemini-4-argon|qwen3\.8-max|gpt-6-luna" "$KOK/esit" "$KOK/yurutucu-kurallar.md"'
kontrol '! grep -q "SORUN.md" "$KOK/esit/AGENTS.md" && grep -q "SORUN.md" "$KOK/yurutucu-kurallar.md"'
[ $FAIL = 0 ] && echo "mdk-esitle.test ok" || { echo "mdk-esitle.test BAŞARISIZ"; exit 1; }
