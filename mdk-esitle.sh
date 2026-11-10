#!/usr/bin/env bash
# Kullanım: bash ~/mdk/mdk-esitle.sh
# Mac ve Ubuntu VM'de OpenCode ayarlarını ve Claude kurallarını depodaki tek kaynaktan (esit/) kurar, zombi oturumları susturur.
# Kaynaklar: esit/AGENTS.md → ~/.config/opencode/AGENTS.md (yalnız genel taban; MDK yürütücü kuralları yurutucu-kurallar.md'de, isteme eklenir)
#            esit/opencode.jsonc → ~/.config/opencode/opencode.jsonc
#            esit/ba-pm-bakis.SKILL.md → ~/.claude/skills/ba-pm-bakis/SKILL.md
#            esit/gorev-dagitimi.md → ~/.claude/CLAUDE.md içindeki "## Görev dağıtımı" bölümü (makineye özgü üst kısım korunur)
set -euo pipefail
E=$(cd "$(dirname "$0")" && pwd)/esit
H=${MDK_ESITLE_EV:-$HOME}   # test için başka ev dizini

mkdir -p "$H/.config/opencode" "$H/.claude/skills/ba-pm-bakis"
cp "$E/AGENTS.md" "$H/.config/opencode/AGENTS.md"
cp "$E/opencode.jsonc" "$H/.config/opencode/opencode.jsonc"
cp "$E/ba-pm-bakis.SKILL.md" "$H/.claude/skills/ba-pm-bakis/SKILL.md"

if [ -f "$H/.claude/CLAUDE.md" ]; then
  E_KAYNAK="$E/gorev-dagitimi.md" E_HEDEF="$H/.claude/CLAUDE.md" node -e '
    const fs = require("fs"), p = process.env.E_HEDEF;
    const s = fs.readFileSync(p, "utf8"), idx = s.indexOf("## Görev dağıtımı");
    const ust = idx >= 0 ? s.slice(0, idx).trimEnd() : s.trimEnd();
    fs.writeFileSync(p, ust + "\n\n" + fs.readFileSync(process.env.E_KAYNAK, "utf8"));
  '
fi

[ -z "${MDK_ESITLE_EV:-}" ] || { echo "mdk-esitle tamam (deneme evi: $H)"; exit 0; }
# opencode.db içinde yarım kalmış (son mesajı idle olmayan) zombi oturumları interrupt et
OC=${MDK_OPENCODE:-$HOME/.local/opt/opencode-v2/node_modules/.bin/opencode}
if [ -x "$OC" ]; then
  sids=$(node -e 'try{const db=new(require("node:sqlite").DatabaseSync)(process.env.OPENCODE_DB||require("os").homedir()+"/.local/share/opencode/opencode.db",{readOnly:true});const q=db.prepare("select s.id,(select type from session_message m where m.session_id=s.id order by seq desc limit 1) ty from session_v2 s where (s.title like \"adim-%\" or s.title like \"kapi-%\" or s.title like \"persona-%\") and s.time_idle is null");for(const r of q.all())if(r.id&&/^ses_/.test(r.id)&&r.ty&&r.ty!=="idle")console.log(r.id)}catch{}' 2>/dev/null || true)
  for sid in $sids; do "$OC" api POST "/api/session/$sid/interrupt" >/dev/null 2>&1 || true; done
fi

echo "mdk-esitle tamam: AGENTS.md, opencode.jsonc, CLAUDE.md, SKILL.md esit/ kaynağından kuruldu."
