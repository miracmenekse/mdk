// Adım geçmişi: denemeler (metrik satırları) + adım başına en yeni commit + inceleme.

import { execFileSync } from 'node:child_process';

// adım numarası → en yeni commit (git log yeniden eskiye sıralar; ilk görülen en yenisidir)
function commitHaritasi(dir) {
  const harita = new Map();
  let cikti;
  try {
    cikti = execFileSync('git', ['log', '--format=@%h%x09%cI%x09%s', '--numstat'], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return harita; // git yok ya da depo değil
  }

  let aktif = null;
  for (const satir of cikti.split('\n')) {
    if (satir.startsWith('@')) {
      const [sha, tarih, ...parca] = satir.slice(1).split('\t');
      const mesaj = parca.join('\t');
      const m = mesaj.match(/^adım (\d+):/);
      const no = m ? Number(m[1]) : null;
      aktif = no !== null && !harita.has(no) ? { sha: sha.slice(0, 7), mesaj, tarih, dosya: 0, eklenen: 0, silinen: 0 } : null;
      if (aktif) harita.set(no, aktif);
      continue;
    }
    const p = satir.split('\t');
    if (aktif && p.length === 3) {
      aktif.dosya += 1;
      aktif.eklenen += Number(p[0]) || 0; // ikili dosyalarda "-" → 0
      aktif.silinen += Number(p[1]) || 0;
    }
  }
  return harita;
}

export function gecmis(dir, satirlar) {
  const commitler = commitHaritasi(dir);
  const adimlar = new Map();
  const al = (no) => {
    if (!adimlar.has(no)) adimlar.set(no, { denemeler: [], inceleme: null });
    return adimlar.get(no);
  };

  for (const s of satirlar) {
    if (typeof s.adim !== 'number') continue;
    if (s.tur === 'inceleme') {
      al(s.adim).inceleme = { inceleme: s.inceleme, not: s.not ?? null };
    } else {
      al(s.adim).denemeler.push({
        yurutucu: s.yurutucu ?? 'opencode',
        model: s.model,
        deneme: s.deneme,
        gecti: s.gecti === true,
        neden: s.neden ?? null,
        sure_sn: s.sure_sn ?? null,
        token: s.token ?? null,
      });
    }
  }
  for (const no of commitler.keys()) al(no);

  return [...adimlar.keys()]
    .sort((a, b) => a - b)
    .map((no) => ({ no, ...adimlar.get(no), commit: commitler.get(no) ?? null }));
}
