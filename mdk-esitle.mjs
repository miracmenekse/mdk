// OpenCode ayarlarını ve Claude kurallarını esit/ kaynağından kurar, zombi oturumları susturur.
import { mkdirSync, copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

const E = join(dirname(fileURLToPath(import.meta.url)), 'esit');
const ev = process.env.MDK_ESITLE_EV || homedir();

mkdirSync(join(ev, '.config', 'opencode'), { recursive: true });
mkdirSync(join(ev, '.claude', 'skills', 'ba-pm-bakis'), { recursive: true });
copyFileSync(join(E, 'AGENTS.md'), join(ev, '.config', 'opencode', 'AGENTS.md'));
copyFileSync(join(E, 'opencode.jsonc'), join(ev, '.config', 'opencode', 'opencode.jsonc'));
copyFileSync(join(E, 'ba-pm-bakis.SKILL.md'), join(ev, '.claude', 'skills', 'ba-pm-bakis', 'SKILL.md'));

const claudeMd = join(ev, '.claude', 'CLAUDE.md');
if (existsSync(claudeMd)) {
  const s = readFileSync(claudeMd, 'utf8');
  const idx = s.indexOf('## Görev dağıtımı');
  const ust = (idx >= 0 ? s.slice(0, idx) : s).trimEnd();
  writeFileSync(claudeMd, ust + '\n\n' + readFileSync(join(E, 'gorev-dagitimi.md'), 'utf8'));
}

if (process.env.MDK_ESITLE_EV) {
  console.log(`mdk-esitle tamam (deneme evi: ${ev})`);
  process.exit(0);
}

// opencode.db içinde yarım kalmış (son mesajı idle olmayan) zombi oturumları interrupt et
const oc = process.env.MDK_OPENCODE || join(homedir(), '.local/opt/opencode-v2/node_modules/.bin/opencode');
if (existsSync(oc)) {
  try {
    const dbYolu = process.env.OPENCODE_DB || join(homedir(), '.local/share/opencode/opencode.db');
    const db = new DatabaseSync(dbYolu, { readOnly: true });
    const q = db.prepare('select s.id,(select type from session_message m where m.session_id=s.id order by seq desc limit 1) ty from session_v2 s where (s.title like "adim-%" or s.title like "kapi-%" or s.title like "persona-%") and s.time_idle is null');
    for (const r of q.all()) {
      if (r.id && /^ses_/.test(r.id) && r.ty && r.ty !== 'idle') {
        try {
          spawnSync(oc, ['api', 'POST', `/api/session/${r.id}/interrupt`], { stdio: 'ignore' });
        } catch {}
      }
    }
  } catch {}
}

console.log('mdk-esitle tamam: AGENTS.md, opencode.jsonc, CLAUDE.md, SKILL.md esit/ kaynağından kuruldu.');
