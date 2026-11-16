// Kapı (adım 202): Güvenli geri alma (kod + kapı + düzeltme commit'leri, sonraki adım engeli, panel onayı)
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { KOK, commit, denetci, depo, gecici, git, kos, oku, writeFileSync } from './yardim.mjs';

const BETIK = join(KOK, 'mdk-geri-al.mjs');
const { vaka, kontrol, bitir } = denetci('geri-al-guvenli.test');

// (1) kapı + kod commit'leri birlikte geri alınır
vaka('1 kapı ve kod commitleri geri alınır');
{
  const T = gecici();
  const R = join(T, 'repo');
  depo({ 'PLAN.md': '- [ ] 1. A\n- [ ] 2. B\n' }, { R });
  commit(R, 'c0');

  writeFileSync(join(R, 't1.test.mjs'), 'test\n');
  commit(R, 'adım 1 kapısı: t1.test.mjs');

  writeFileSync(join(R, 'a.mjs'), 'export const a = 1\n');
  writeFileSync(join(R, 'PLAN.md'), '- [x] 1. A\n- [ ] 2. B\n');
  commit(R, 'adım 1: A (m, deneme 1)');
  git(R, 'tag', 'mdk/adim-1', 'HEAD');

  const s = kos(BETIK, ['1'], { cwd: R });
  kontrol(s.kod === 0, 'çıkış 0 olmalı', s.cikti);
  kontrol(s.cikti.includes('geri alındı: adım 1'), 'çıktıda "geri alındı: adım 1" olmalı', s.cikti);
  kontrol(!existsSync(join(R, 'a.mjs')), 'a.mjs silinmiş olmalı');
  kontrol(!existsSync(join(R, 't1.test.mjs')), 't1.test.mjs silinmiş olmalı');
  const plan = oku(join(R, 'PLAN.md'));
  kontrol(plan.includes('- [ ] 1. A'), 'PLAN.md içinde "- [ ] 1. A" olmalı', plan);
  kontrol(!plan.includes('- [x] 1. A'), 'PLAN.md içinde "- [x] 1. A" kalmamalı', plan);
  const sonKonu = git(R, 'log', '-1', '--format=%s').stdout.trim();
  kontrol(sonKonu === 'adım 1 geri alındı', 'son commit konusu "adım 1 geri alındı" olmalı', sonKonu);
  const tagSonuc = git(R, 'tag', '-l', 'mdk/adim-1').stdout.trim();
  kontrol(tagSonuc === '', 'mdk/adim-1 etiketi silinmiş olmalı', tagSonuc);
  const st = git(R, 'status', '--porcelain').stdout.trim();
  kontrol(st === '', 'git status --porcelain boş olmalı', st);
}

// (2) sonraki adım varsa reddedilir, hiçbir şeye dokunulmaz
vaka('2 sonraki adım engeli');
{
  const T = gecici();
  const R = join(T, 'repo');
  depo({ 'PLAN.md': '- [ ] 1. A\n- [ ] 2. B\n' }, { R });
  commit(R, 'c0');

  writeFileSync(join(R, 't1.test.mjs'), 'test\n');
  commit(R, 'adım 1 kapısı: t1.test.mjs');
  writeFileSync(join(R, 'a.mjs'), 'export const a = 1\n');
  writeFileSync(join(R, 'PLAN.md'), '- [x] 1. A\n- [ ] 2. B\n');
  commit(R, 'adım 1: A (m, deneme 1)');
  git(R, 'tag', 'mdk/adim-1', 'HEAD');

  writeFileSync(join(R, 'b.mjs'), "import { a } from './a.mjs'\n");
  writeFileSync(join(R, 'PLAN.md'), '- [x] 1. A\n- [x] 2. B\n');
  commit(R, 'adım 2: B (m, deneme 1)');

  const oncekiHead = git(R, 'rev-parse', 'HEAD').stdout.trim();
  const s = kos(BETIK, ['1'], { cwd: R });
  kontrol(s.kod === 4, 'sonraki adım varken çıkış 4 olmalı', s.cikti);
  kontrol(s.cikti.includes('sonraki adımlar var: 2'), 'stderr "sonraki adımlar var: 2" içermeli', s.cikti);
  const sonrakiHead = git(R, 'rev-parse', 'HEAD').stdout.trim();
  kontrol(sonrakiHead === oncekiHead, 'HEAD değişmemiş olmalı');
  kontrol(existsSync(join(R, 'a.mjs')), 'a.mjs hâlâ var olmalı');
  const st = git(R, 'status', '--porcelain').stdout.trim();
  kontrol(st === '', 'git status --porcelain boş olmalı', st);
}

// (3a) düzeltme commit'i de geri alınır
vaka('3a düzeltme commiti de geri alınır');
{
  const T = gecici();
  const R = join(T, 'repo');
  depo({ 'PLAN.md': '- [ ] 1. A\n- [ ] 2. B\n' }, { R });
  commit(R, 'c0');

  writeFileSync(join(R, 't1.test.mjs'), 'test\n');
  commit(R, 'adım 1 kapısı: t1.test.mjs');
  writeFileSync(join(R, 'a.mjs'), 'export const a = 1\n');
  writeFileSync(join(R, 'PLAN.md'), '- [x] 1. A\n- [ ] 2. B\n');
  commit(R, 'adım 1: A (m, deneme 1)');
  git(R, 'tag', 'mdk/adim-1', 'HEAD');

  writeFileSync(join(R, 'd.txt'), 'duzeltme\n');
  commit(R, 'adım 1 düzeltme: x');

  const s = kos(BETIK, ['1'], { cwd: R });
  kontrol(s.kod === 0, 'çıkış 0 olmalı', s.cikti);
  kontrol(!existsSync(join(R, 'a.mjs')), 'a.mjs silinmiş olmalı');
  kontrol(!existsSync(join(R, 't1.test.mjs')), 't1.test.mjs silinmiş olmalı');
  kontrol(!existsSync(join(R, 'd.txt')), 'd.txt silinmiş olmalı');
  const plan = oku(join(R, 'PLAN.md'));
  kontrol(plan.includes('- [ ] 1. A'), 'PLAN.md içinde "- [ ] 1. A" olmalı', plan);
  const st = git(R, 'status', '--porcelain').stdout.trim();
  kontrol(st === '', 'git status --porcelain boş olmalı', st);
}

// (3b) "adım 10" konulu commit "adım 1" ile eşleşmez
vaka('3b adım 10 eşleşmesi yapılmaz');
{
  const T = gecici();
  const R = join(T, 'repo');
  depo({ 'PLAN.md': '- [ ] 1. A\n- [ ] 2. B\n' }, { R });

  writeFileSync(join(R, 'x.txt'), 'x\n');
  commit(R, 'adım 10: X');

  const s = kos(BETIK, ['1'], { cwd: R });
  kontrol(s.kod === 4, 'çıkış 4 olmalı', s.cikti);
  kontrol(s.cikti.includes('adım 1 için commit bulunamadı'), 'commit bulunamadı iletisi olmalı', s.cikti);
}

// (4) kirli ağaç ve kök kontrolü
vaka('4 kirli ağaç ve kök kontrolü');
{
  const T = gecici();
  const R = join(T, 'repo');
  depo({ 'PLAN.md': '- [ ] 1. A\n- [ ] 2. B\n' }, { R });
  commit(R, 'c0');

  writeFileSync(join(R, 'kirli.txt'), 'kirli');
  const sKirli = kos(BETIK, ['1'], { cwd: R });
  kontrol(sKirli.kod === 4, 'çalışma ağacı kirliyken çıkış 4 olmalı', sKirli.cikti);
  kontrol(sKirli.cikti.includes('çalışma ağacı kirli'), 'çalışma ağacı kirli iletisi olmalı', sKirli.cikti);
  git(R, 'clean', '-fd');

  mkdirSync(join(R, 'alt'));
  const sKok = kos(BETIK, ['1'], { cwd: join(R, 'alt') });
  kontrol(sKok.kod === 4, 'alt klasörden çıkış 4 olmalı', sKok.cikti);
  kontrol(sKok.cikti.includes('proje kökünde çalıştır'), 'proje kökünde iletisi olmalı', sKok.cikti);
}

// (5) çakışma durumunda geri alma durur
vaka('5 çakışma durur');
{
  const T = gecici();
  const R = join(T, 'repo');
  depo({ 'PLAN.md': '- [ ] 1. A\n- [ ] 2. B\n', 'x.txt': 'A\n' }, { R });
  commit(R, 'c0');

  writeFileSync(join(R, 'x.txt'), 'B\n');
  writeFileSync(join(R, 'PLAN.md'), '- [x] 1. A\n- [ ] 2. B\n');
  commit(R, 'adım 1: A (m, deneme 1)');
  git(R, 'tag', 'mdk/adim-1', 'HEAD');

  writeFileSync(join(R, 'x.txt'), 'C\n');
  commit(R, 'fix: x');

  const oncekiHead = git(R, 'rev-parse', 'HEAD').stdout.trim();
  const s = kos(BETIK, ['1'], { cwd: R });
  kontrol(s.kod === 1, 'çakışmada çıkış 1 olmalı', s.cikti);
  kontrol(s.cikti.includes('geri alma çakıştı'), 'çakışma iletisi olmalı', s.cikti);
  const sonrakiHead = git(R, 'rev-parse', 'HEAD').stdout.trim();
  kontrol(sonrakiHead === oncekiHead, 'HEAD değişmemiş olmalı');
  kontrol(oku(join(R, 'x.txt')) === 'C\n', 'x.txt çakışma sonrası C kalmalı');
  const st = git(R, 'status', '--porcelain').stdout.trim();
  kontrol(st === '', 'git status --porcelain boş olmalı', st);
}

// (6) panel tıklama işleyicisi onay ve hata iletisi içerir
vaka('6 panel onay ve hata iletisi');
{
  const html = readFileSync(join(KOK, 'panel', 'index.html'), 'utf8');
  const i = html.indexOf("geriAlDugme");
  kontrol(i >= 0, 'adim-geri-al tıklama işleyicisi bulunmalı');
  const pencere = html.slice(i, i + 600);
  kontrol(pencere.includes('confirm('), '600 karakterlik pencerede confirm( olmalı', pencere);
  const beklenenConfirm = 'confirm(`Adım ${adim} geri alınsın mı? Kod değişiklikleri geri sarılır.`)';
  kontrol(pencere.includes(beklenenConfirm), 'onay iletisi confirm(...) içinde olmalı', pencere);
  kontrol(pencere.includes('adim-geri-al-hata'), '600 karakterlik pencerede adim-geri-al-hata olmalı', pencere);
  kontrol(pencere.includes('<p id="adim-geri-al-hata" class="soluk">'), 'hata paragrafı <p id="adim-geri-al-hata" class="soluk"> olarak yazılmalı', pencere);
  kontrol(pencere.includes('geri alma başarısız'), 'yedek hata iletisi geri alma başarısız olmalı', pencere);
}

bitir();
