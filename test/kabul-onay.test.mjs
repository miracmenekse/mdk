// Kapı (adım 175): kabul ölçütleri onaylanmadan story koşmaz.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { KOK, commit, depo, existsSync, gecici, kos, stub } from './yardim.mjs';
import { baslat } from '../panel/sunucu.mjs';
import { drawerHtml } from '../panel/ciz.mjs';

const RUNNER = join(KOK, 'mdk-adim.mjs');
const VAR = (f) => `node -e "process.exit(require('fs').existsSync('${f}')?0:1)"`;
const KAPI = `  - Kapı: \`${VAR('cikti.txt')}\``;
const YAZ = "yaz('cikti.txt', 'x\\n');";

let T, R, OC;
function setup(planMetni, govde) {
  T = gecici();
  R = join(T, 'repo');
  depo({ 'PLAN.md': planMetni }, { R });
  OC = stub(T, govde);
}
const ortam = (ek = {}) => ({ STUB_DIR: T, MDK_OPENCODE: OC, POLL: '1', DENEME: '1', SURE: '30', MDK_KILIT: join(T, 'kilit'), ...ek });
const kosu = (ek = {}) => kos(RUNNER, ['1'], { cwd: R, env: ortam(ek) });

const planZorunlu = (adim) => `Kabul onayı: zorunlu\n\nYürütücü: opencode\nModeller: m/a\n\n## K\n- [ ] 1. İş\n${adim}\n`;
const planNormal = (adim) => `Yürütücü: opencode\nModeller: m/a\n\n## K\n- [ ] 1. İş\n${adim}\n`;

// A — koşturucu
{
  setup(planZorunlu(`${KAPI}\n  - Kabul: x`), YAZ);
  commit(R);
  const s = kosu();
  assert.equal(s.kod, 5, s.cikti);
  assert.ok(s.cikti.includes('onay bekliyor'), s.cikti);
  assert.ok(!existsSync(join(T, 'sayac')), 'opencode çağrılmamalı');
}

{
  setup(planZorunlu(`${KAPI}\n  - Kabul: x\n  - Kabul onayı: evet`), YAZ);
  commit(R);
  const s = kosu();
  assert.equal(s.kod, 0, s.cikti);
}

{
  setup(planNormal(KAPI), YAZ);
  commit(R);
  const s = kosu();
  assert.equal(s.kod, 0, s.cikti);
  assert.ok(s.cikti.includes('UYARI: adım 1 için kabul ölçütü yazılmamış'), s.cikti);
}

{
  setup(planNormal(`${KAPI}\n  - Kabul: x`), YAZ);
  commit(R);
  const s = kosu();
  assert.equal(s.kod, 0, s.cikti);
  assert.ok(!s.cikti.includes('UYARI: adım 1 için kabul ölçütü yazılmamış'), s.cikti);
}

// B — sunucu
{
  const d = mkdtempSync(join(tmpdir(), 'kabul-onay-'));
  writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. Bir\n  - Kapı: `true`\n- [ ] 2. İki\n  - Kabul: birinci\n  - Kabul: ikinci\n');
  const srv = await baslat(d, 0);
  const kok = `http://127.0.0.1:${srv.port}`;
  const planPath = join(d, 'PLAN.md');

  async function post(govde) {
    const r = await fetch(`${kok}/api/kabul-onay`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof govde === 'string' ? govde : JSON.stringify(govde),
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: r.status, json, text };
  }

  // (5) ilk onay
  const before5 = readFileSync(planPath, 'utf8');
  const r5 = await post({ adim: 2 });
  assert.equal(r5.status, 200, r5.text);
  assert.deepEqual(r5.json, { tamam: true }, r5.text);
  const after5 = readFileSync(planPath, 'utf8');
  assert.equal((after5.match(/- Kabul onayı: evet/g) || []).length, 1, after5);
  const lines = after5.split('\n');
  const idx = lines.findIndex((l) => l.trim() === '- Kabul: ikinci');
  assert.ok(idx >= 0, after5);
  assert.equal(lines[idx + 1].trim(), '- Kabul onayı: evet', after5);
  assert.equal(lines[idx + 1].match(/^\s*/)[0], lines[idx].match(/^\s*/)[0], after5);
  const beforeLines = before5.split('\n');
  const afterLines = after5.split('\n');
  const s2Before = beforeLines.findIndex((l) => /^- \[ \] 2\./.test(l));
  const s2After = afterLines.findIndex((l) => /^- \[ \] 2\./.test(l));
  assert.deepEqual(beforeLines.slice(0, s2Before), afterLines.slice(0, s2After), 'adım 1 bloğu değişmemeli');

  // (6) tekrar → dosya değişmez
  const before6 = readFileSync(planPath, 'utf8');
  const r6 = await post({ adim: 2 });
  assert.equal(r6.status, 200, r6.text);
  assert.deepEqual(r6.json, { tamam: true }, r6.text);
  const after6 = readFileSync(planPath, 'utf8');
  assert.equal(after6, before6, 'dosya değişmemeli');

  // (7) Kabul satırı olmayan adım / olmayan adım → 400
  const before7 = readFileSync(planPath, 'utf8');
  const r7a = await post({ adim: 1 });
  assert.equal(r7a.status, 400, r7a.text);
  const r7b = await post({ adim: 99 });
  assert.equal(r7b.status, 400, r7b.text);
  const after7 = readFileSync(planPath, 'utf8');
  assert.equal(after7, before7, 'dosya değişmemeli');

  // (8) 3 KB gövde → 413
  const before8 = readFileSync(planPath, 'utf8');
  const buyuk = JSON.stringify({ adim: 2, pad: 'x'.repeat(3000) });
  const r8 = await post(buyuk);
  assert.equal(r8.status, 413, r8.text);
  const after8 = readFileSync(planPath, 'utf8');
  assert.equal(after8, before8, 'dosya değişmemeli');

  await srv.kapat();
}

// C — drawerHtml
{
  const h9 = drawerHtml({ no: 2, kabul: ['a'], kabulZorunlu: true, kabulOnay: false, bitti: false });
  assert.ok(h9.includes('id="kabul-onayla"'), h9);
  assert.ok(h9.includes('data-adim="2"'), h9);

  const h10 = drawerHtml({ no: 2, kabul: ['a'], kabulZorunlu: true, kabulOnay: true, bitti: false });
  assert.ok(!h10.includes('id="kabul-onayla"'), h10);
  assert.ok(h10.includes('ölçütler onaylandı'), h10);

  const h11a = drawerHtml({ no: 2, kabul: ['a'], kabulZorunlu: false, kabulOnay: false, bitti: false });
  assert.ok(!h11a.includes('id="kabul-onayla"'), h11a);

  const h11b = drawerHtml({ no: 2, kabul: ['a'], kabulZorunlu: true, kabulOnay: false, bitti: true });
  assert.ok(!h11b.includes('id="kabul-onayla"'), h11b);
}

console.log('kabul-onay.test ok');
