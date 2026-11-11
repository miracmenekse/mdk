// oc-sec.mjs: opencode ikilisi seçimi
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ocSec } from '../oc-sec.mjs';

const ev = mkdtempSync(join(tmpdir(), 'oc-sec-'));
const kur = (ad, surum) => {
  const d = join(ev, '.local/opt', ad, 'node_modules/.bin');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'opencode'), `#!/bin/sh\necho ${surum}\n`, { mode: 0o755 });
  return join(d, 'opencode');
};
try {
  const env = {};
  // hiçbiri yok → v2 (bugünkü varsayılan)
  assert.match(ocSec({ env, ev }), /opencode-v2/);
  // yalnız v2 → v2
  const v2 = kur('opencode-v2', '0.0.0-dev-202611092046');
  assert.equal(ocSec({ env, ev }), v2);
  // v2 dev + v1 var → v1 (gerçek --version ile)
  const v1 = kur('opencode-v1', '1.19.5');
  assert.equal(ocSec({ env, ev }), v1);
  // v2 kararlı sürüm → v2 (Mac durumu: v1 ücretsiz modellerde hata veriyor)
  assert.equal(ocSec({ env, ev, surum: () => '1.20.0' }), v2);
  // sürüm okunamazsa → v2 (bugünkü davranış)
  assert.equal(ocSec({ env, ev, surum: () => '' }), v2);
  // MDK_OPENCODE her zaman kazanır
  assert.equal(ocSec({ env: { MDK_OPENCODE: '/x/opencode' }, ev }), '/x/opencode');
  // CLI: yolu basar
  const cli = execFileSync('node', [new URL('../oc-sec.mjs', import.meta.url).pathname], { env: { ...process.env, HOME: ev, MDK_OPENCODE: '' }, encoding: 'utf8' });
  assert.equal(cli, v1);
  console.log('oc-sec.test ok');
} finally {
  rmSync(ev, { recursive: true, force: true });
}
