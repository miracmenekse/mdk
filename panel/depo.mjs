// Depo durumu: son sürüm etiketi, yayımlanmamış commit'ler, GitHub Actions, yerel kopya.
// Yalnız okur; fetch yapmaz (sunucunun işi). Hiçbir durumda fırlatmaz.

import { execFile } from 'node:child_process';

// varsayılan çalıştırıcı: hiç reddetmez, hata → { kod: 1, cikti: hata metni }
export function varsayilanCalistir(dir) {
  return (komut, argumanlar) => new Promise((coz) => {
    try {
      execFile(komut, argumanlar, { cwd: dir, timeout: 20000 }, (hata, stdout, stderr) => {
        if (hata) coz({ kod: 1, cikti: String(stderr || hata.message) });
        else coz({ kod: 0, cikti: String(stdout) });
      });
    } catch (e) {
      coz({ kod: 1, cikti: String(e?.message ?? e) });
    }
  });
}

// https://github.com/o/r(.git) ya da git@github.com:o/r(.git) → "o/r"; GitHub değilse null
function githubDepo(url) {
  const m = /^(?:https:\/\/(?:[^@/]+@)?github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/\s]+\/[^/\s]+?)(?:\.git)?\/?$/.exec(url.trim());
  return m ? m[1] : null;
}

// "%h\t%cI\t%s" satırları
const commitler = (cikti) => cikti.split('\n').filter(Boolean).map((s) => {
  const [kisa, tarih, ...mesaj] = s.split('\t');
  return { kisa, tarih, mesaj: mesaj.join('\t') };
});

// gh/git çıktısının ilk dolu satırı: panelde gösterilecek kısa neden
const kisaNeden = (r, varsayilan) => (String(r.cikti ?? '').split('\n').map((s) => s.trim()).find(Boolean) || varsayilan).slice(0, 200);

export async function depo(dir, { calistir } = {}) {
  const cal = calistir ?? varsayilanCalistir(dir);
  try {
    if ((await cal('git', ['rev-parse', '--is-inside-work-tree'])).kod !== 0) return { var: false };
    const git = (...a) => cal('git', a);

    const origin = await git('remote', 'get-url', 'origin');
    const sahipDepo = origin.kod === 0 ? githubDepo(origin.cikti) : null;

    const etiket = await git('describe', '--tags', '--abbrev=0', 'origin/main');
    const surum = etiket.kod === 0 ? etiket.cikti.trim() || null : null;

    let yayimlanmamis = null;
    if (surum) {
      const r = await git('log', `${surum}..origin/main`, '--format=%h%x09%cI%x09%s');
      if (r.kod === 0) yayimlanmamis = commitler(r.cikti);
    }

    const son = await git('log', '-10', 'origin/main', '--format=%h%x09%cI%x09%s');
    const sonK = son.kod === 0 ? commitler(son.cikti) : [];

    const dal = await git('rev-parse', '--abbrev-ref', 'HEAD');
    const sayim = await git('rev-list', '--left-right', '--count', 'HEAD...origin/main');
    const [ileri, geri] = sayim.kod === 0 ? sayim.cikti.trim().split(/\s+/).map(Number) : [];
    // porcelain: "XY yol"; satır başı boşluğu anlamlı, kırpılmaz
    const durum = await git('--no-optional-locks', 'status', '--porcelain');
    const yerel = {
      dal: dal.kod === 0 ? dal.cikti.trim() : null,
      ileri: Number.isFinite(ileri) ? ileri : null,
      geri: Number.isFinite(geri) ? geri : null,
      degisik: durum.kod === 0 ? durum.cikti.split('\n').filter((s) => s.trim()).map((s) => s.slice(3)) : [],
    };

    let ci = null;
    let hata = null;
    if (sahipDepo) {
      let r = await cal('gh', ['run', 'list', '-R', sahipDepo, '-L', '5', '--json', 'workflowName,displayTitle,status,conclusion,headBranch,createdAt,url']);
      // eski gh (ör. Ubuntu 2.4) workflowName/displayTitle bilmez: iş akışı adı "name" alanında
      let eski = false;
      if (r.kod !== 0 && /Unknown JSON field/.test(r.cikti)) {
        r = await cal('gh', ['run', 'list', '-R', sahipDepo, '-L', '5', '--json', 'name,status,conclusion,headBranch,createdAt,url']);
        eski = true;
      }
      if (r.kod !== 0) {
        hata = kisaNeden(r, `gh kod ${r.kod}`);
      } else {
        try {
          const v = JSON.parse(r.cikti);
          if (Array.isArray(v)) ci = eski ? v.map(({ name, ...k }) => ({ workflowName: name, ...k })) : v;
          else hata = 'gh beklenmeyen yanıt';
        } catch {
          hata = 'gh yanıtı okunamadı';
        }
      }
    }

    return { var: true, surum, yayimlanmamis, ci, yerel, sonK, hata, ts: Date.now() };
  } catch {
    return { var: false };
  }
}
