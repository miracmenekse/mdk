#!/usr/bin/env node
// Kullanım: node mdk-geri-al.mjs <adım-no> [plan=PLAN.md]
// Tamamlanan bir story'yi git revert ile geri sarar ve planda yeniden açık gösterir.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function git(...args) {
  return spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 << 20 });
}

const adimArg = process.argv[2];
const N = Number(adimArg);
if (!adimArg || !Number.isInteger(N) || N <= 0) {
  console.error('kullanım: node mdk-geri-al.mjs <adım-no> [plan=PLAN.md]');
  process.exit(2);
}

let plan = 'PLAN.md';
if (process.argv[3]) {
  if (process.argv[3].startsWith('plan=')) {
    plan = process.argv[3].slice(5);
  } else {
    plan = process.argv[3];
  }
}

const topRes = git('rev-parse', '--show-toplevel');
if (topRes.status !== 0 || !topRes.stdout.trim() || resolve(topRes.stdout.trim()) !== resolve('.')) {
  console.error('proje kökünde çalıştır');
  process.exit(4);
}

const stRes = git('status', '--porcelain');
if (stRes.status !== 0 || stRes.stdout.trim().length > 0) {
  console.error('çalışma ağacı kirli');
  process.exit(4);
}

// Adımın tüm commit'leri: konusu "adım N:" ya da "adım N " ile başlar (yeni → eski).
const adimRe = new RegExp(`^adım ${N}[: ]`);
const logRes = git('log', '--format=%H%x09%s');
const adimCommitler = [];
let enEski = null;
if (logRes.status === 0) {
  for (const satir of logRes.stdout.split('\n')) {
    const ayir = satir.indexOf('\t');
    if (ayir < 0) continue;
    const sha = satir.slice(0, ayir);
    const konu = satir.slice(ayir + 1);
    if (adimRe.test(konu)) {
      adimCommitler.push(sha);
      enEski = sha;
    }
  }
}

const tagRes = git('rev-parse', '-q', '--verify', `refs/tags/mdk/adim-${N}`);
const tagSha = tagRes.status === 0 ? tagRes.stdout.trim() : '';

if (adimCommitler.length === 0) {
  if (!tagSha) {
    console.error(`adım ${N} için commit bulunamadı`);
    process.exit(4);
  }
  adimCommitler.push(tagSha);
  enEski = tagSha;
}

// En eski adım commit'inden sonra başka bir adım commit'i varsa hiçbir şeye dokunma.
const sonrakiRes = git('log', '--format=%s', `${enEski}..HEAD`);
if (sonrakiRes.status === 0) {
  const noRe = /^adım (\d+)[: ]/;
  const sonrakiler = new Set();
  for (const konu of sonrakiRes.stdout.split('\n')) {
    const m = noRe.exec(konu);
    if (m && Number(m[1]) !== N) sonrakiler.add(Number(m[1]));
  }
  if (sonrakiler.size > 0) {
    const liste = [...sonrakiler].sort((a, b) => a - b).join(',');
    console.error(`sonraki adımlar var: ${liste}`);
    process.exit(4);
  }
}

// Yeni → eski sırayla geri sar; çakışırsa temiz biçimde dur.
for (const sha of adimCommitler) {
  const revRes = git('revert', '--no-commit', sha);
  if (revRes.status !== 0) {
    if (git('revert', '--abort').status !== 0) git('reset', '--hard', 'HEAD');
    console.error('geri alma çakıştı');
    process.exit(1);
  }
}

// Planda adımı yeniden açık göster ve tüm geri almayı tek commit'te topla.
if (existsSync(plan)) {
  const metin = readFileSync(plan, 'utf8');
  const yeni = metin.replace(new RegExp(`^- \\[([xX])\\] ${N}\\.`, 'gm'), `- [ ] ${N}.`);
  writeFileSync(plan, yeni);
}

git('add', '-A');
git('commit', '--allow-empty', '-m', `adım ${N} geri alındı`);
git('tag', '-d', `mdk/adim-${N}`);
console.log(`geri alındı: adım ${N}`);
process.exit(0);
