// test/adim-yalitim.test.mjs: Yalıtılmış deneme worktree'si (adım 199) kapı testi:
// Koşturucu her denemeyi ana çalışma ağacına dokunmadan geçici bir git worktree'sinde
// koşturur ve testleri orada sınar. Deneme başarısız olursa ana ağaç kirlenmeden
// geçici kopya silinir; deneme geçerse değişiklikler ana ağaca aktarılıp commit edilir.
import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import {
  KOK,
  commit,
  denetci,
  depo,
  existsSync,
  gecici,
  git,
  join,
  kos,
  oku,
  stub,
} from './yardim.mjs';
import * as ortak from '../mdk-ortak.mjs';

const { denemeWorktreeAc, denemeWorktreeAktar } = ortak;
const { vaka, kontrol, bitir } = denetci('adim-yalitim.test');

const RUNNER = join(KOK, 'mdk-adim.mjs');
const VAR = (f) => `node -e "process.exit(require('fs').existsSync('${f}')?0:1)"`;
const KAPI = `  - Kapı: \`${VAR('cikti.txt')}\``;
const plan = (m, adim) => `Yürütücü: opencode\nModeller: ${m}\n\n## K\n- [ ] 1. İş\n${adim}\n`;

try {
  // A, BİRİM (denemeWorktreeAc, denemeWorktreeAktar mdk-ortak.mjs'ten)
  // (1) geçici depoda denemeWorktreeAc(R, 1) → wt.yol var ve içinde PLAN.md var;
  // wt.yol içinde yeni.txt yazılıp denemeWorktreeAktar(wt.yol, R) ve wt.kapat() çağrılınca
  // R/yeni.txt var ve wt.yol silinmiş
  vaka('A1 birim: denemeWorktreeAc ve yeni dosya aktarımı');
  if (typeof denemeWorktreeAc !== 'function' || typeof denemeWorktreeAktar !== 'function') {
    kontrol(false, 'denemeWorktreeAc ve denemeWorktreeAktar mdk-ortak.mjs içinde tanımlı ve dışa aktarılmış olmalı');
  } else {
    const T1 = gecici('yalitim-b1-');
    const R1 = join(T1, 'repo');
    depo({ 'PLAN.md': 'Yürütücü: opencode\n- [ ] 1. İş\n' }, { R: R1 });
    commit(R1, 'ilk');

    const wt1 = denemeWorktreeAc(R1, 1);
    kontrol(wt1 !== null && typeof wt1 === 'object', 'denemeWorktreeAc geçerli bir nesne dönmeli');
    kontrol(Boolean(wt1?.yol && existsSync(wt1.yol)), 'wt.yol dizini mevcut olmalı');
    kontrol(Boolean(wt1?.yol && existsSync(join(wt1.yol, 'PLAN.md'))), 'wt.yol içinde PLAN.md bulunmalı');
    kontrol(
      Boolean(wt1?.yol && (wt1.yol.includes('.mdk-log/wt/adim-1-') || wt1.yol.includes('.mdk-log\\wt\\adim-1-'))),
      'wt.yol <kok>/.mdk-log/wt/adim-1-<pid> yapısında olmalı'
    );

    if (wt1?.yol) {
      writeFileSync(join(wt1.yol, 'yeni.txt'), 'yeni-icerik');
      // alt dizinde dosya oluşturulması ve üst klasörlerinin açılması
      depo({ 'alt/derin.txt': 'derin-icerik' }, { R: wt1.yol });
      const aktar1 = denemeWorktreeAktar(wt1.yol, R1);
      kontrol(aktar1 === true, 'denemeWorktreeAktar true dönmeli');
      if (typeof wt1.kapat === 'function') wt1.kapat();
      kontrol(existsSync(join(R1, 'yeni.txt')), 'R içinde yeni.txt var olmalı');
      kontrol(oku(join(R1, 'yeni.txt')) === 'yeni-icerik', 'R/yeni.txt içeriği doğru aktarılmış olmalı');
      kontrol(existsSync(join(R1, 'alt', 'derin.txt')), 'R içinde alt/derin.txt var olmalı');
      kontrol(!existsSync(wt1.yol), 'wt.kapat() sonrasında wt.yol silinmiş olmalı');
    }
  }

  // (2) wt.yol içinde izlenen bir dosya silinip denemeWorktreeAktar çağrılınca R'de de silinir
  vaka('A2 birim: silinen dosyanın ana depoya yansıması');
  if (typeof denemeWorktreeAc !== 'function' || typeof denemeWorktreeAktar !== 'function') {
    kontrol(false, 'denemeWorktreeAc ve denemeWorktreeAktar mdk-ortak.mjs içinde tanımlı ve dışa aktarılmış olmalı');
  } else {
    const T2 = gecici('yalitim-b2-');
    const R2 = join(T2, 'repo');
    depo({ 'PLAN.md': 'Yürütücü: opencode\n- [ ] 1. İş\n', 'silinecek.txt': 'silinecek-icerik\n' }, { R: R2 });
    commit(R2, 'ilk');

    const wt2 = denemeWorktreeAc(R2, 1);
    kontrol(Boolean(wt2?.yol && existsSync(join(wt2.yol, 'silinecek.txt'))), 'wt.yol içinde silinecek.txt bulunmalı');
    if (wt2?.yol) {
      rmSync(join(wt2.yol, 'silinecek.txt'), { force: true });
      const aktar2 = denemeWorktreeAktar(wt2.yol, R2);
      kontrol(aktar2 === true, 'denemeWorktreeAktar true dönmeli');
      kontrol(!existsSync(join(R2, 'silinecek.txt')), 'silinen dosya denemeWorktreeAktar sonrasında R içinde de silinmiş olmalı');
      if (typeof wt2.kapat === 'function') wt2.kapat();
      kontrol(!existsSync(wt2.yol), 'wt2.kapat() sonrasında wt.yol silinmiş olmalı');
    }
  }

  // A3 sınır durumları: hariç tutulan dosyalar ve geçersiz depoda null dönüşü
  vaka('A3 birim: hariç tutulan dosyalar ve geçersiz depo');
  if (typeof denemeWorktreeAc !== 'function' || typeof denemeWorktreeAktar !== 'function') {
    kontrol(false, 'denemeWorktreeAc ve denemeWorktreeAktar mdk-ortak.mjs içinde tanımlı ve dışa aktarılmış olmalı');
  } else {
    const T3 = gecici('yalitim-b3-');
    const R3 = join(T3, 'repo');
    depo({ 'PLAN.md': 'Yürütücü: opencode\n- [ ] 1. İş\n' }, { R: R3 });
    commit(R3, 'ilk');

    const wt3 = denemeWorktreeAc(R3, 1);
    if (wt3?.yol) {
      writeFileSync(join(wt3.yol, 'durum.json'), '{"durum":"sahte"}');
      writeFileSync(join(wt3.yol, 'metrikler.jsonl'), 'sahte-metrik\n');
      denemeWorktreeAktar(wt3.yol, R3);
      kontrol(!existsSync(join(R3, 'durum.json')), 'durum.json denemeWorktreeAktar ile ana depoya aktarılmamalı');
      kontrol(!existsSync(join(R3, 'metrikler.jsonl')), 'metrikler.jsonl denemeWorktreeAktar ile ana depoya aktarılmamalı');
      if (typeof wt3.kapat === 'function') wt3.kapat();
    }

    const bosDizin = gecici('yalitim-bos-');
    const bosSonuc = denemeWorktreeAc(bosDizin, 1);
    kontrol(bosSonuc === null, 'git deposu olmayan dizinde denemeWorktreeAc null dönmeli');
  }

  // B, ENTEGRASYON (test/mdk-adim.test.mjs:1-28 kurulumu, MDK_ONKONTROL_YOK:'1', MDK_YALITIM:'1')
  // (3) sahte opencode process.cwd() yolunu <T>/calisma-yolu.txt'ye ve cikti.txt'yi process.cwd() içine yazar
  // → mdk-adim.mjs 1 çıkış 0, calisma-yolu.txt .mdk-log/wt/adim-1- içerir (model worktree içinde koşmuş),
  // koşu sonunda ana depoda cikti.txt commit edilmiş ve .mdk-log/wt/ altında worktree kalmamış
  vaka('B1 entegrasyon: başarılı yalıtımlı koşu');
  {
    const T_e1 = gecici('yalitim-e1-');
    const R_e1 = join(T_e1, 'repo');
    depo({ 'PLAN.md': plan('m/a', KAPI) }, { R: R_e1 });
    const OC_e1 = stub(T_e1, "fs.writeFileSync(D + '/calisma-yolu.txt', process.cwd()); yaz('cikti.txt', 'x\\n');");
    commit(R_e1, 'ilk');

    const ortam1 = {
      STUB_DIR: T_e1,
      MDK_OPENCODE: OC_e1,
      POLL: '1',
      DENEME: '1',
      SURE: '30',
      MDK_KILIT: join(T_e1, 'kilit'),
      MDK_ONKONTROL_YOK: '1',
      MDK_YALITIM: '1',
    };
    const son1 = kos(RUNNER, ['1'], { cwd: R_e1, env: ortam1 });
    kontrol(son1.kod === 0, `çıkış 0 olmalı (alınan: ${son1.kod})`, son1.cikti);

    const calismaYolu = oku(join(T_e1, 'calisma-yolu.txt')).trim();
    kontrol(
      calismaYolu.includes('.mdk-log/wt/adim-1-') || calismaYolu.includes('.mdk-log\\wt\\adim-1-'),
      `model worktree içinde koşmalı (calisma-yolu.txt .mdk-log/wt/adim-1- içermeli, alınan: ${calismaYolu})`
    );

    kontrol(existsSync(join(R_e1, 'cikti.txt')), 'ana depoda cikti.txt bulunmalı');
    kontrol(/^adım 1:/.test(git(R_e1, 'log', '-1', '--format=%s').stdout.trim()), 'ana depoda cikti.txt commit edilmiş olmalı');

    const wtDizin1 = join(R_e1, '.mdk-log', 'wt');
    const kalanWt1 = existsSync(wtDizin1) ? readdirSync(wtDizin1).filter((f) => f.startsWith('adim-1-')) : [];
    kontrol(kalanWt1.length === 0, '.mdk-log/wt/ altında geçici worktree kalmamış olmalı');
    kontrol(!git(R_e1, 'worktree', 'list').stdout.includes('adim-1-'), 'git worktree listesinde geçici worktree kalmamış olmalı');
  }

  // (4) sahte opencode bozuk.txt yazar ama kapı (cikti.txt) kırmızı kalır
  // → çıkış 2, ana depoda bozuk.txt yok ve .mdk-log/wt/ temizlenmiş
  vaka('B2 entegrasyon: başarısız koşuda ana ağacın temiz kalması');
  {
    const T_e2 = gecici('yalitim-e2-');
    const R_e2 = join(T_e2, 'repo');
    depo({ 'PLAN.md': plan('m/a', KAPI) }, { R: R_e2 });
    const OC_e2 = stub(T_e2, "fs.writeFileSync(D + '/calisma-yolu-e2.txt', process.cwd()); yaz('bozuk.txt', 'kirli');");
    commit(R_e2, 'ilk');

    const ortam2 = {
      STUB_DIR: T_e2,
      MDK_OPENCODE: OC_e2,
      POLL: '1',
      DENEME: '1',
      SURE: '30',
      MDK_KILIT: join(T_e2, 'kilit'),
      MDK_ONKONTROL_YOK: '1',
      MDK_YALITIM: '1',
    };
    const son2 = kos(RUNNER, ['1'], { cwd: R_e2, env: ortam2 });
    kontrol(son2.kod === 2, `kapı kırmızı kalınca çıkış 2 olmalı (alınan: ${son2.kod})`, son2.cikti);

    const calismaYolu2 = oku(join(T_e2, 'calisma-yolu-e2.txt')).trim();
    kontrol(
      calismaYolu2.includes('.mdk-log/wt/adim-1-') || calismaYolu2.includes('.mdk-log\\wt\\adim-1-'),
      `başarısız koşuda da model worktree içinde koşmalı (calisma-yolu-e2.txt .mdk-log/wt/adim-1- içermeli, alınan: ${calismaYolu2})`
    );

    kontrol(!existsSync(join(R_e2, 'bozuk.txt')), 'başarısız denemede üretilen bozuk.txt ana depoya sızmamalı');

    const wtDizin2 = join(R_e2, '.mdk-log', 'wt');
    const kalanWt2 = existsSync(wtDizin2) ? readdirSync(wtDizin2).filter((f) => f.startsWith('adim-1-')) : [];
    kontrol(kalanWt2.length === 0, '.mdk-log/wt/ altında geçici worktree kalmamış olmalı');
    kontrol(!git(R_e2, 'worktree', 'list').stdout.includes('adim-1-'), 'git worktree listesinde geçici worktree kalmamış olmalı');
  }
} finally {
  bitir();
}
