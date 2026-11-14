// persona-tur testlerinin ortak kurulumu (persona-tur.test.mjs, persona-gorev.test.mjs)
import { KOK, gecici, join, kos, mkdirSync, oku, readFileSync, stub, writeFileSync } from './yardim.mjs';
import { readdirSync } from 'node:fs';

export const RUNNER = join(KOK, 'persona-tur.mjs');
export const ctx = {};
// govde: sahte opencode davranışı (metin(t) ile yanıt verir); M model, ISTEM istem
export function setup(govde) {
  const T = gecici(); const P = join(T, 'p'); mkdirSync(P, { recursive: true });
  const OC = stub(T, `{ const s = ISTEM.match(/SORU-([A-Z]+)/); if (s) fs.writeFileSync(D + '/istem-' + s[1] + '.txt', ISTEM); }
${govde}
olay({type:'step_finish',part:{tokens:{input:200,output:30,reasoning:20,cache:{read:0,write:0}},cost:0}});`, { son: false });
  writeFileSync(join(P, 'PLAN.md'), 'Yürütücü: opencode\nModeller: m/bir, m/iki, m/uc\n\n## K\n- [ ] 1. İş\n');
  writeFileSync(join(P, 'personalar.md'), `# Personalar
## Ortak
### Çıktı biçimi (alt ajana verilir)
BICIM-KURALI
### Ayırt edicilik şartı
AYIRT-KURALI
### Benchmark (persona değil, kanıt)
BENCH-GIZLI
## Alan: dev
Durum: denenmemiş
### Kart Bir
- **Sorusu:** "SORU-BIR"
### Kart İki / Ek
- **Sorusu:** "SORU-IKI"
### Kart Üç
- **Sorusu:** "SORU-UC"
## Alan: sunum
### Yabancı
- **Sorusu:** "YABANCI"
## Karar günlüğü
`);
  writeFileSync(join(P, 'soru.md'), 'Problem: PROBLEM-METNI\n');
  Object.assign(ctx, { T, P, OC });
}
export const kosu = (args, ek = {}) => (ctx.SON = kos(RUNNER, args, { cwd: ctx.P, env: { STUB_DIR: ctx.T, MDK_OPENCODE: ctx.OC, OPENCODE_DB: join(ctx.T, 'yok.db'), PERSONA_SURE: ek.SURE || '20', ...ek } }));
export const dizinler = () => { try { return readdirSync(join(ctx.P, 'persona-tur')).sort().map((d) => join(ctx.P, 'persona-tur', d)); } catch { return []; } };
export const DIZ = () => dizinler()[0];
export const cagrilar = () => oku(join(ctx.T, 'cagri.log')).split('\n').filter(Boolean);
export { oku, readFileSync, join };
