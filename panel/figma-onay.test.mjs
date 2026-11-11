import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from './plan.mjs';
import { snapshot } from './durum.mjs';
import { etkiKartiHtml } from './ciz.mjs';

const m = `## Panel
- [ ] 1. Figma geçerli
  - Kapı: \`true\`
  - Figma: https://www.figma.com/design/abc?node-id=1-2
- [ ] 2. Figma geçersiz
  - Kapı: \`true\`
  - Figma: https://kotu.example.com/x
- [ ] 3. Figma yok
  - Kapı: \`true\`
`;
const p = parse(m);
const [a, b, c] = p.kategoriler[0].adimlar;

assert.equal(a.figma, 'https://www.figma.com/design/abc?node-id=1-2', 'geçerli Figma url atanmalı');
assert.equal(b.figma, null, 'geçersiz Figma url null olmalı');
assert.equal(c.figma, null, 'Figma satırı olmayan adımda null olmalı');

const dir = mkdtempSync(join(tmpdir(), 'figma-onay-'));
try {
  writeFileSync(join(dir, 'PLAN.md'), `## Panel\n- [ ] 5. x\n  - Etki: etki/x.html\n  - Figma: https://www.figma.com/design/abc\n`);
  const d = snapshot(dir);
  assert.equal(d.etki.length, 1, 'etki kaydı oluşmalı');
  assert.equal(d.etki[0].figma, 'https://www.figma.com/design/abc', 'durum etki kaydında figma aktarılmalı');
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const url = 'https://www.figma.com/design/abc?a=1&b="2"';
const h = etkiKartiHtml({ no: 5, baslik: 'x', dosya: 'etki/x.html', figma: url, onay: false, bitti: false });
assert.ok(h.includes('Figma güncellendi'), 'figma varken bilgi satırı olmalı');
assert.ok(h.includes('target="_blank"'), 'figma linki yeni sekmede açılmalı');
assert.ok(h.includes('Adımı onayla'), 'figma varken onay düğmesi "Adımı onayla" olmalı');
assert.ok(!h.includes('Taslağı onayla'), 'figma varken taslak düğmesi olmamalı');
assert.ok(h.includes('&quot;'), 'href içindeki tırnak kaçırılmalı');
assert.match(h, /value="onay"/, 'onay düğmesi value değişmemeli');

const h2 = etkiKartiHtml({ no: 5, baslik: 'x', dosya: 'etki/x.html', figma: null, onay: false, bitti: false });
assert.ok(h2.includes('Taslağı onayla'), 'figma yokken taslak düğmesi olmalı');
assert.ok(!h2.includes('Figma güncellendi'), 'figma yokken bilgi satırı olmamalı');

const h3 = etkiKartiHtml({ no: 5, baslik: 'x', dosya: 'etki/x.html', figma: url, onay: true, bitti: false });
assert.ok(h3.includes('onaylandı'), 'onaylı adımda onaylandı olmalı');
assert.ok(h3.includes('Figma güncellendi'), 'onaylı adımda figma satırı görünmeli');
assert.ok(!h3.includes('<form'), 'onaylı adımda form olmamalı');

const h4 = etkiKartiHtml({ no: 5, baslik: 'x', dosya: 'etki/x.html', figma: url, onay: false, bitti: true });
assert.ok(!h4.includes('<form'), 'biten adımda form olmamalı');

console.log('figma-onay.test ok');
