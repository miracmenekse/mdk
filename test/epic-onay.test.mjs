// mdk-adim.mjs Epic çözüm onayı kapısı: Tartışma'lı Epic onaysızsa adım hiç koşmaz (çıkış 5).
import { KOK, commit, denetci, depo, existsSync, gecici, join, kos, oku, readFileSync, stub, writeFileSync } from './yardim.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const { vaka, kontrol, bitir } = denetci('epic-onay.test');
const T = gecici();
const OC = stub(T, "yaz(process.env.ISARET, 'cagrildi\\n');", { son: false });
let say = 0, R, SON;
function depoKur(govde) { say++; R = join(T, `r${say}`); depo({ 'PLAN.md': `Yürütücü: opencode\nModeller: m/a\n\n${govde}\n` }, { R }); commit(R, 'ilk'); }
const kosu = () => (SON = kos(RUNNER, ['1'], { cwd: R, env: { ISARET: join(T, `isaret-${say}`), STUB_DIR: T, MDK_OPENCODE: OC, MDK_ONKONTROL_YOK: '1', MDK_METRIK: join(T, `metrik-${say}.jsonl`), MDK_DURUM: join(T, `durum-${say}.json`), MDK_KILIT: join(T, `kilit-${say}`), POLL: '1', DENEME: '1', SURE: '30' } }));
const k = (c, m) => kontrol(c, m, SON?.cikti);
const isaret = () => existsSync(join(T, `isaret-${say}`));
const EPIC9 = '## Epic 9 — Deneme\n- Tartışma: epic/9\n- [ ] 1. İş\n  - Kapı: `node -e "0"`';

vaka('onaysiz'); // çıkış 5, uyarı, model çağrılmaz, PLAN değişmez
depoKur(EPIC9); const once = readFileSync(join(R, 'PLAN.md'), 'utf8'); kosu();
k(SON.kod === 5, 'çıkış 5'); k(SON.cikti.includes('Epic çözüm onayı bekliyor'), 'uyarı'); k(!isaret(), 'model çağrılmadı'); k(oku(join(R, 'PLAN.md')) === once, 'PLAN değişmedi');

vaka('onayli'); // Epic bloğuna "- Onay: evet" eklenip commit: adım koşar
depoKur(EPIC9);
writeFileSync(join(R, 'PLAN.md'), 'Yürütücü: opencode\nModeller: m/a\n\n## Epic 9 — Deneme\n- Tartışma: epic/9\n- Onay: evet\n- [ ] 1. İş\n  - Kapı: `node -e "0"`\n');
commit(R, 'onay'); kosu();
k(SON.kod !== 5, 'çıkış 5 değil'); k(!SON.cikti.includes('Epic çözüm onayı'), 'uyarı yok'); k(isaret(), 'model çağrıldı');

vaka('tartismasiz'); // Epic'te "- Tartışma:" yok: adım koşar
depoKur('## Epic 9 — Deneme\n- [ ] 1. İş\n  - Kapı: `node -e "0"`'); kosu();
k(SON.kod !== 5, 'çıkış 5 değil'); k(isaret(), 'model çağrıldı');

vaka('baska_epic_onayi'); // "- Onay: evet" yalnız önceki Epic 8'de: çıkış 5
depoKur('## Epic 8 — Önceki\n- Onay: evet\n- [x] 8. Eski iş\n  - Kapı: `node -e "0"`\n\n' + EPIC9); kosu();
k(SON.kod === 5, 'çıkış 5'); k(SON.cikti.includes('Epic çözüm onayı bekliyor'), 'uyarı'); k(!isaret(), 'model çağrılmadı');
bitir();
