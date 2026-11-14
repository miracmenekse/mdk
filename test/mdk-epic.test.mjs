import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../mdk-epic.mjs', import.meta.url));

const FIXTURE = `Yürütücü: opencode
Modeller: m/a

## Faz 20 — Eski
- [x] 1. Bitmiş adım
  - Kapı: \`true\`

## Sonraki iyileştirmeler
- bir madde
`;

function git(repo, args) {
  return spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
}

function depoKur(t, planIcerik) {
  const r = mkdtempSync(join(t, 'repo-'));
  spawnSync('git', ['init', '-q'], { cwd: r });
  spawnSync('git', ['config', 'user.name', 't'], { cwd: r });
  spawnSync('git', ['config', 'user.email', 't@t'], { cwd: r });
  writeFileSync(join(r, 'PLAN.md'), planIcerik);
  writeFileSync(join(r, 'is.txt'), 'is icerigi\n');
  spawnSync('git', ['add', '-A'], { cwd: r });
  spawnSync('git', ['commit', '-qm', 'ilk'], { cwd: r });
  return r;
}

function kos(repo, args, envExtra) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: repo,
    env: { ...process.env, ...(envExtra || {}) },
    encoding: 'utf8',
  });
}

function say(plan, re) {
  return (plan.match(re) || []).length;
}

const t = mkdtempSync(join(tmpdir(), 'mdk-epic-'));

const fakeTartis = join(t, 'fake-tartis.mjs');
writeFileSync(fakeTartis, `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const no = process.argv[2];
if (process.env.FAKE_DURUM === 'fail') {
  console.error('taklit hata');
  process.exit(1);
}
mkdirSync(join('epic', no), { recursive: true });
writeFileSync(join('epic', no, 'tartisma.json'), JSON.stringify({ durum: process.env.FAKE_TARTISMA_DURUM || 'bitti' }) + '\\n');
console.log('FAKE_TARTIS_OK ' + no);
`);
chmodSync(fakeTartis, 0o755);

// tamamlanmış Epic atlanır
const bosRepo = depoKur(t, FIXTURE);
{
  const r = kos(bosRepo, ['durum']);
  assert.equal(r.status, 0, r.stderr + '\n' + r.stdout);
  assert.equal(r.stdout.trim(), '');
}

// ac
const r = depoKur(t, FIXTURE);
const oncePlan = readFileSync(join(r, 'PLAN.md'), 'utf8');
const head0 = git(r, ['rev-parse', 'HEAD']).stdout.trim();

const ra = kos(r, ['ac', 'Müşteri', 'is.txt']);
assert.equal(ra.status, 0, ra.stderr + '\n' + ra.stdout);
assert.equal(ra.stdout.trim(), '21');
const planA = readFileSync(join(r, 'PLAN.md'), 'utf8');
const basA = planA.indexOf('## Epic 21 — Müşteri');
assert.ok(basA >= 0);
assert.ok(planA.slice(basA).startsWith('## Epic 21 — Müşteri\n- Durum: analiz'));
const sonrakiA = planA.indexOf('## Sonraki iyileştirmeler');
assert.ok(basA < sonrakiA);
assert.equal(readFileSync(join(r, 'epic', '21', 'is.md'), 'utf8'), readFileSync(join(r, 'is.txt'), 'utf8'));
const beklenenA = oncePlan.replace('## Sonraki iyileştirmeler', '## Epic 21 — Müşteri\n- Durum: analiz\n\n## Sonraki iyileştirmeler');
assert.equal(planA, beklenenA);
assert.match(git(r, ['log', '-1', '--pretty=%s']).stdout, /epic 21/);
assert.equal(git(r, ['status', '--porcelain']).stdout.trim(), '');

// durum analiz + tartışma yok
{
  const rd = kos(r, ['durum']);
  assert.equal(rd.status, 0, rd.stderr + '\n' + rd.stdout);
  assert.equal(rd.stdout.trim(), 'Epic 21 · analiz · sıradaki: story yaz ya da tartis');
  assert.equal(readFileSync(join(r, 'PLAN.md'), 'utf8'), planA);
}

// tartis başarısız (ayrı depo)
const rFailRepo = depoKur(t, FIXTURE);
kos(rFailRepo, ['ac', 'Müşteri', 'is.txt']);
{
  const rf = kos(rFailRepo, ['tartis', '21'], { MDK_EPIC_TARTIS: fakeTartis, FAKE_DURUM: 'fail' });
  assert.equal(rf.status, 1, rf.stderr + '\n' + rf.stdout);
  assert.ok(rf.stderr.length > 0);
  const pf = readFileSync(join(rFailRepo, 'PLAN.md'), 'utf8');
  assert.ok(!pf.includes('- Tartışma:'));
  assert.equal(git(rFailRepo, ['log', '-1', '--pretty=%s']).stdout.trim(), 'epic 21: ac');
  assert.equal(git(rFailRepo, ['status', '--porcelain']).stdout.trim(), '');
}

// tartis başarılı
const headBeforeTartis = git(r, ['rev-parse', 'HEAD']).stdout.trim();
{
  const rt = kos(r, ['tartis', '21'], { MDK_EPIC_TARTIS: fakeTartis });
  assert.equal(rt.status, 0, rt.stderr + '\n' + rt.stdout);
  assert.ok(rt.stdout.includes('FAKE_TARTIS_OK'));
  const pt = readFileSync(join(r, 'PLAN.md'), 'utf8');
  assert.ok(pt.includes('- Tartışma: epic/21'));
  assert.equal(say(pt, /^- Tartışma:/gm), 1);
  assert.equal(git(r, ['status', '--porcelain']).stdout.trim(), '');
  assert.match(git(r, ['log', '-1', '--pretty=%s']).stdout, /epic 21: tartis/);
}
// durum tartışma bitti + onaysız
{
  const rd = kos(r, ['durum']);
  assert.equal(rd.status, 0, rd.stderr + '\n' + rd.stdout);
  assert.equal(rd.stdout.trim(), 'Epic 21 · analiz · sıradaki: kullanıcı onayı bekleniyor');
}

// karar tartışma yokken (ayrı depo)
const rNoDisc = depoKur(t, FIXTURE);
kos(rNoDisc, ['ac', 'Müşteri', 'is.txt']);
{
  const planBefore = readFileSync(join(rNoDisc, 'PLAN.md'), 'utf8');
  const headBefore = git(rNoDisc, ['rev-parse', 'HEAD']).stdout.trim();
  const rk = kos(rNoDisc, ['karar', '21', 'onay']);
  assert.equal(rk.status, 1, rk.stderr + '\n' + rk.stdout);
  assert.ok(rk.stderr.length > 0);
  assert.equal(readFileSync(join(rNoDisc, 'PLAN.md'), 'utf8'), planBefore);
  assert.equal(git(rNoDisc, ['rev-parse', 'HEAD']).stdout.trim(), headBefore);
  assert.equal(git(rNoDisc, ['status', '--porcelain']).stdout.trim(), '');
}

// karar suruyor
{
  writeFileSync(join(r, 'epic', '21', 'tartisma.json'), JSON.stringify({ durum: 'suruyor' }) + '\n');
  const planBefore = readFileSync(join(r, 'PLAN.md'), 'utf8');
  const headBefore = git(r, ['rev-parse', 'HEAD']).stdout.trim();
  const rk = kos(r, ['karar', '21', 'onay']);
  assert.equal(rk.status, 1, rk.stderr + '\n' + rk.stdout);
  assert.ok(rk.stderr.length > 0);
  assert.equal(readFileSync(join(r, 'PLAN.md'), 'utf8'), planBefore);
  assert.equal(git(r, ['rev-parse', 'HEAD']).stdout.trim(), headBefore);
}

// karar bitti
{
  writeFileSync(join(r, 'epic', '21', 'tartisma.json'), JSON.stringify({ durum: 'bitti' }) + '\n');
  const rk = kos(r, ['karar', '21', 'onay']);
  assert.equal(rk.status, 0, rk.stderr + '\n' + rk.stdout);
  const pk = readFileSync(join(r, 'PLAN.md'), 'utf8');
  assert.ok(pk.includes('- Onay: evet'));
  assert.ok(pk.includes('- Durum: tasarim'));
  assert.equal(say(pk, /^\s*-\s+Durum:/gm), 1);
  assert.equal(git(r, ['status', '--porcelain']).stdout.trim(), '');
  assert.match(git(r, ['log', '-1', '--pretty=%s']).stdout, /epic 21: karar/);
}
// durum tasarim
{
  const rd = kos(r, ['durum']);
  assert.equal(rd.status, 0, rd.stderr + '\n' + rd.stdout);
  assert.equal(rd.stdout.trim(), "Epic 21 · tasarim · sıradaki: story'leri yaz, sonra gelistir");
}

// gelistir adımsız
{
  const planBefore = readFileSync(join(r, 'PLAN.md'), 'utf8');
  const headBefore = git(r, ['rev-parse', 'HEAD']).stdout.trim();
  const rg = kos(r, ['gelistir', '21']);
  assert.equal(rg.status, 1, rg.stderr + '\n' + rg.stdout);
  assert.ok(rg.stderr.length > 0);
  assert.equal(readFileSync(join(r, 'PLAN.md'), 'utf8'), planBefore);
  assert.equal(git(r, ['rev-parse', 'HEAD']).stdout.trim(), headBefore);
}

// adımı ekle
{
  const plan = readFileSync(join(r, 'PLAN.md'), 'utf8').split('\n');
  const idx = plan.findIndex((l) => l.trim() === '- Onay: evet');
  assert.ok(idx >= 0);
  plan.splice(idx + 1, 0, '- [ ] 2. İş', '  - Kapı: `true`');
  writeFileSync(join(r, 'PLAN.md'), plan.join('\n'));
  spawnSync('git', ['add', 'PLAN.md'], { cwd: r });
  spawnSync('git', ['commit', '-qm', 'adim ekle'], { cwd: r });
}

// gelistir başarılı
{
  const rg = kos(r, ['gelistir', '21']);
  assert.equal(rg.status, 0, rg.stderr + '\n' + rg.stdout);
  const pg = readFileSync(join(r, 'PLAN.md'), 'utf8');
  assert.ok(pg.includes('- Durum: gelistirme'));
  assert.equal(say(pg, /^\s*-\s+Durum:/gm), 1);
  assert.equal(git(r, ['status', '--porcelain']).stdout.trim(), '');
  assert.match(git(r, ['log', '-1', '--pretty=%s']).stdout, /epic 21: gelistir/);
}
// durum gelistirme
{
  const rd = kos(r, ['durum', '21']);
  assert.equal(rd.status, 0, rd.stderr + '\n' + rd.stdout);
  assert.equal(rd.stdout.trim(), 'Epic 21 · gelistirme · sıradaki: story koştur (2)');
}

// tartis gelistirme durumunda çıkış 1
{
  const planBefore = readFileSync(join(r, 'PLAN.md'), 'utf8');
  const headBefore = git(r, ['rev-parse', 'HEAD']).stdout.trim();
  const rt = kos(r, ['tartis', '21'], { MDK_EPIC_TARTIS: fakeTartis });
  assert.equal(rt.status, 1, rt.stderr + '\n' + rt.stdout);
  assert.ok(rt.stderr.length > 0);
  assert.equal(readFileSync(join(r, 'PLAN.md'), 'utf8'), planBefore);
  assert.equal(git(r, ['rev-parse', 'HEAD']).stdout.trim(), headBefore);
}

// figma hatalı url
{
  const planBefore = readFileSync(join(r, 'PLAN.md'), 'utf8');
  const headBefore = git(r, ['rev-parse', 'HEAD']).stdout.trim();
  const rf = kos(r, ['figma', '21', 'https://kotu.example.com/x']);
  assert.equal(rf.status, 1, rf.stderr + '\n' + rf.stdout);
  assert.ok(rf.stderr.length > 0);
  assert.equal(readFileSync(join(r, 'PLAN.md'), 'utf8'), planBefore);
  assert.equal(git(r, ['rev-parse', 'HEAD']).stdout.trim(), headBefore);
}

// figma iyi url
{
  const rf = kos(r, ['figma', '21', 'https://www.figma.com/design/a']);
  assert.equal(rf.status, 0, rf.stderr + '\n' + rf.stdout);
  const pf = readFileSync(join(r, 'PLAN.md'), 'utf8');
  assert.ok(pf.includes('- Figma: https://www.figma.com/design/a'));
  assert.equal(say(pf, /^\s*-\s+Figma:/gm), 1);
  assert.equal(git(r, ['status', '--porcelain']).stdout.trim(), '');
  assert.match(git(r, ['log', '-1', '--pretty=%s']).stdout, /epic 21: figma/);
}

// figma ikinci url tek satır
{
  const rf = kos(r, ['figma', '21', 'https://www.figma.com/design/b']);
  assert.equal(rf.status, 0, rf.stderr + '\n' + rf.stdout);
  const pf = readFileSync(join(r, 'PLAN.md'), 'utf8');
  const figmaSatirlari = pf.split('\n').filter((l) => /^\s*-\s+Figma:/.test(l));
  assert.equal(figmaSatirlari.length, 1);
  assert.ok(figmaSatirlari[0].includes('design/b'));
  assert.ok(!figmaSatirlari[0].includes('design/a'));
}

// onaysız gelistir (ayrı depo)
const rOnayRepo = depoKur(t, FIXTURE);
kos(rOnayRepo, ['ac', 'Müşteri', 'is.txt']);
kos(rOnayRepo, ['tartis', '21'], { MDK_EPIC_TARTIS: fakeTartis });
{
  const plan = readFileSync(join(rOnayRepo, 'PLAN.md'), 'utf8').split('\n');
  const idx = plan.findIndex((l) => l.trim() === '## Sonraki iyileştirmeler');
  // adım Epic bloğuna, Sonraki başlığından önce eklenir
  const onayIdx = plan.findIndex((l) => l.startsWith('## Epic 21'));
  const bosIdx = plan.findIndex((l, i) => i > onayIdx && l.trim() === '');
  plan.splice(bosIdx, 0, '- [ ] 2. İş', '  - Kapı: `true`');
  writeFileSync(join(rOnayRepo, 'PLAN.md'), plan.join('\n'));
  spawnSync('git', ['add', 'PLAN.md'], { cwd: rOnayRepo });
  spawnSync('git', ['commit', '-qm', 'adim ekle'], { cwd: rOnayRepo });
}
{
  const rg = kos(rOnayRepo, ['gelistir', '21']);
  assert.equal(rg.status, 1, rg.stderr + '\n' + rg.stdout);
  assert.ok(rg.stderr.length > 0);
}

// olmayan Epic
{
  const rk = kos(r, ['karar', '99', 'onay']);
  assert.equal(rk.status, 1, rk.stderr + '\n' + rk.stdout);
  assert.ok(rk.stderr.length > 0);
}

// bilinmeyen komut
{
  const planBefore = readFileSync(join(r, 'PLAN.md'), 'utf8');
  const headBefore = git(r, ['rev-parse', 'HEAD']).stdout.trim();
  const ru = kos(r, ['bilinmeyen-komut']);
  assert.equal(ru.status, 2, ru.stderr + '\n' + ru.stdout);
  assert.ok(ru.stderr.length > 0);
  assert.equal(readFileSync(join(r, 'PLAN.md'), 'utf8'), planBefore);
  assert.equal(git(r, ['rev-parse', 'HEAD']).stdout.trim(), headBefore);
}

// durum tümü
{
  const rd = kos(r, ['durum']);
  assert.equal(rd.status, 0, rd.stderr + '\n' + rd.stdout);
  assert.equal(rd.stdout.trim(), 'Epic 21 · gelistirme · sıradaki: story koştur (2)');
}

console.log('mdk-epic.test ok');
