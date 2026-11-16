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
  console.error('çalışma ağacı kirli');
  process.exit(4);
}

const stRes = git('status', '--porcelain');
if (stRes.status !== 0 || stRes.stdout.trim().length > 0) {
  console.error('çalışma ağacı kirli');
  process.exit(4);
}

let sha = null;
const tagRes = git('rev-parse', '-q', '--verify', `refs/tags/mdk/adim-${N}`);
if (tagRes.status === 0 && tagRes.stdout.trim()) {
  sha = tagRes.stdout.trim();
} else {
  const logRes = git('log', '-1', '--format=%H', `--grep=^adım ${N}: `);
  if (logRes.status === 0 && logRes.stdout.trim()) {
    sha = logRes.stdout.trim();
  }
}

if (!sha) {
  console.error(`adım ${N} için commit bulunamadı`);
  process.exit(4);
}

const revRes = git('revert', '--no-edit', sha);
if (revRes.status !== 0) {
  git('revert', '--abort');
  process.exit(1);
}

if (existsSync(plan)) {
  const metin = readFileSync(plan, 'utf8');
  const yeni = metin.replace(new RegExp(`^- \\[([xX])\\] ${N}\\.`, 'gm'), `- [ ] ${N}.`);
  writeFileSync(plan, yeni);
  git('add', plan);
  git('commit', '--amend', '--no-edit');
}

git('tag', '-d', `mdk/adim-${N}`);
console.log(`geri alındı: adım ${N}`);
process.exit(0);
