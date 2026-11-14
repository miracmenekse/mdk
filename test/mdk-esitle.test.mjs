// mdk-esitle.mjs testi: kurallar esit/ kaynağından kopyalanır, CLAUDE.md'nin makineye özgü üst kısmı korunur, yeniden koşu aynı sonucu verir.
import { KOK, denetci, gecici, join, kos, mkdirSync, oku, writeFileSync } from './yardim.mjs';
import { readdirSync, statSync } from 'node:fs';

const RUNNER = join(KOK, 'mdk-esitle.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-esitle.test');
const EV = gecici();
mkdirSync(join(EV, '.claude'), { recursive: true });
writeFileSync(join(EV, '.claude/CLAUDE.md'), '# Bu makine\n\nÖzgü not.\n\n## Görev dağıtımı (modeller)\n- eski bayat kural gemini-4-argon\n');
const esitle = () => kos(RUNNER, [], { cwd: KOK, env: { MDK_ESITLE_EV: EV } });

vaka('kopya'); esitle();
kontrol(oku(join(KOK, 'esit/AGENTS.md')) === oku(join(EV, '.config/opencode/AGENTS.md')), 'AGENTS.md');
kontrol(oku(join(KOK, 'esit/opencode.jsonc')) === oku(join(EV, '.config/opencode/opencode.jsonc')), 'opencode.jsonc');
kontrol(oku(join(KOK, 'esit/ba-pm-bakis.SKILL.md')) === oku(join(EV, '.claude/skills/ba-pm-bakis/SKILL.md')), 'SKILL.md');
const c = oku(join(EV, '.claude/CLAUDE.md'));
kontrol(c.includes('Özgü not.') && !c.includes('eski bayat kural'), 'üst kısım korunur, bayat bölüm gider');
kontrol((c.match(/^## Görev dağıtımı/gm) || []).length === 1, 'tek Görev dağıtımı bölümü');
kontrol(c.split('\n').slice(4).join('\n') === oku(join(KOK, 'esit/gorev-dagitimi.md')), 'bölüm kaynağın aynısı');

vaka('tekrar'); esitle(); kontrol(oku(join(EV, '.claude/CLAUDE.md')) === c, 'yeniden koşu aynı');

vaka('model_adi_yok'); // model adları kurallarda durmaz; yürütücü kuralları genel AGENTS.md'de kopyalanmaz
const tum = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? tum(join(d, f)) : [join(d, f)]));
const metin = [...tum(join(KOK, 'esit')), join(KOK, 'yurutucu-kurallar.md')].map(oku).join('\n');
kontrol(!/opencode-go\/|gemini-4-argon|qwen3\.8-max|gpt-6-luna/.test(metin), 'model adı yok');
kontrol(!oku(join(KOK, 'esit/AGENTS.md')).includes('SORUN.md') && oku(join(KOK, 'yurutucu-kurallar.md')).includes('SORUN.md'), 'SORUN.md yalnız yürütücü kurallarında');
bitir();
