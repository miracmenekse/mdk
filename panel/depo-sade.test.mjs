// Kapı (adım 51): depo şeridinde yalnız anlamlı kutular; son liste sürümle yayımlananlar. Kullanım: node panel/depo-sade.test.mjs
import assert from 'node:assert/strict';
import { depo } from './depo.mjs';
import { depoSeritHtml, depoHtml } from './ciz.mjs';

const duz = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const kutular = (h) => [...h.matchAll(/id="(kpi-[a-z]+)"/g)].map((m) => m[1]);
const WIN = { workflowName: 'Windows Release', displayTitle: 'v0.3.6', status: 'completed', conclusion: 'success', headBranch: 'v0.3.6', createdAt: '2026-10-19T12:00:00Z', url: 'u' };
const CODEQL = { ...WIN, workflowName: 'CodeQL', headBranch: 'main' };
const yerel = { dal: 'main', ileri: 2, geri: 0, degisik: [] };

// dbeaver-mm biçimi: sürüm + windows-release → dört kutu sürer
assert.deepEqual(kutular(depoSeritHtml({ var: true, surum: 'v0.3.6', yayimlanmamis: [], ci: [CODEQL, WIN], yerel })),
  ['kpi-surum', 'kpi-yayimlanmamis', 'kpi-ci', 'kpi-yerel']);
// opencode-akis biçimi: etiket yok, CI yok → yalnız yerel
const tek = depoSeritHtml({ var: true, surum: null, yayimlanmamis: null, ci: [], yerel });
assert.deepEqual(kutular(tek), ['kpi-yerel']);
assert.ok(tek.startsWith('<div class="kpi">') && !duz(tek).includes('—'), 'boş kutu yok');
// sürüm var, windows-release yok (yalnız CodeQL) → CI kutusu yok
assert.deepEqual(kutular(depoSeritHtml({ var: true, surum: 'v1', yayimlanmamis: [], ci: [CODEQL], yerel })), ['kpi-surum', 'kpi-yayimlanmamis', 'kpi-yerel']);
// ci null (GitHub'a ulaşılamadı) → CI kutusu yok, çökmez
assert.deepEqual(kutular(depoSeritHtml({ var: true, surum: null, yayimlanmamis: null, ci: null, yerel: {} })), ['kpi-yerel']);
assert.equal(depoSeritHtml(null), '');

// depo(): sürüm varsa son liste sürümden geriye
const cagri = [];
const sahte = (surumVar) => async (k, args) => {
  const a = args.join(' ');
  cagri.push(a);
  if (k === 'gh') return { kod: 0, cikti: '[]' };
  if (a.includes('is-inside-work-tree')) return { kod: 0, cikti: 'true\n' };
  if (a.includes('remote get-url')) return { kod: 0, cikti: 'https://github.com/o/r.git\n' };
  if (a.includes('describe')) return surumVar ? { kod: 0, cikti: 'v2\n' } : { kod: 128, cikti: 'fatal' };
  if (a.includes('log') && a.includes('..')) return { kod: 0, cikti: 'aaa\t2026-10-20T00:00:00Z\tK9\n' };
  if (a.includes('log') && a.includes('-10')) return { kod: 0, cikti: 'bbb\t2026-10-19T00:00:00Z\tK8\n' };
  if (a.includes('abbrev-ref')) return { kod: 0, cikti: 'main\n' };
  if (a.includes('--count')) return { kod: 0, cikti: '0\t0\n' };
  return { kod: 0, cikti: '' };
};
let d = await depo('/x', { calistir: sahte(true) });
const log10 = cagri.filter((a) => a.startsWith('log') && a.includes('-10') && !a.includes('..'));
assert.equal(log10.length, 1);
assert.ok(log10[0].split(' ').includes('v2') && !log10[0].includes('origin/main'), 'sürüm varsa git log -10 <sürüm>: ' + log10[0]);
assert.equal(d.sonK[0].kisa, 'bbb');
let t = duz(depoHtml(d));
assert.ok(t.includes('v2 ile yayımlananlar') && !t.includes('Son K'), t);
cagri.length = 0;
d = await depo('/x', { calistir: sahte(false) });
assert.ok(cagri.some((a) => a.startsWith('log') && a.includes('-10') && a.includes('origin/main')), 'sürüm yoksa origin/main');
t = duz(depoHtml(d));
assert.ok(t.includes("Son commit'ler") && !t.includes('ile yayımlananlar'));
console.log('depo-sade.test ok');
