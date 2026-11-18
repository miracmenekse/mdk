// Kapı (adım 223): Uygulama planlarının (epic/<no>/plan.md ve is.md) MDK panelinde görüntülenmesi ve onaylanabilmesi
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { epicDrawerHtml, epicImza } from '../panel/ciz.mjs';
import { baslat } from '../panel/sunucu.mjs';

// 1. epicDrawerHtml: plan metni varken UYGULAMA PLANI bölümü ve onay formu görünmeli
const epikPlanli = {
  no: '51',
  ad: 'Epic 51 — Sağlayıcı Hataları',
  statu: 'analiz',
  onay: false,
  plan: '# Hedef\nRetry-After desteği\n## Adımlar\n- Zaman aşımı sınıflandırması\n- Akıllı bekleme <script>x</script>',
};
const hPlan = epicDrawerHtml(epikPlanli, null);
assert.match(hPlan, /<h3 class="drawer-bolum">UYGULAMA PLANI<\/h3>/, 'UYGULAMA PLANI başlığı olmalı');
assert.ok(hPlan.includes('<h4>Hedef</h4>'), '# başlığı h4 olarak biçimlenmeli');
assert.ok(hPlan.includes('<h4>Adımlar</h4>'), '## başlığı h4 olarak biçimlenmeli');
assert.ok(hPlan.includes('<li>Zaman aşımı sınıflandırması</li>'), 'liste maddeleri çizilmeli');
assert.ok(hPlan.includes('&lt;script&gt;x&lt;/script&gt;'), 'HTML kaçışı yapılmalı');
assert.ok(hPlan.includes('data-hedef="plan"'), 'bölüm navigasyonunda plan noktası olmalı');
assert.ok(hPlan.includes('Çözümü onayla'), 'tartışma olmasa bile plan varken onay düğmesi görünmeli');

// 2. epicImza: plan metni değiştiğinde imza değişmeli
const imza1 = epicImza({ no: '51', plan: 'kısa plan' }, null);
const imza2 = epicImza({ no: '51', plan: 'daha uzun bir uygulama planı metni' }, null);
assert.notEqual(imza1, imza2, 'plan uzunluğu değişince imza değişmeli');

// 3. GET /api/epic: epic/<no>/plan.md ve epic/<no>/is.md dosyalarını döndürmeli
const kok = mkdtempSync(join(tmpdir(), 'mdk-epic-plan-'));
mkdirSync(join(kok, 'epic', '51'), { recursive: true });
writeFileSync(join(kok, 'PLAN.md'), '# MDK\n\n## Epic 51 — Retry-After\n- Durum: analiz\n');
writeFileSync(join(kok, 'epic', '51', 'is.md'), '# İş Tanımı\nDetaylar burada.\n');
writeFileSync(join(kok, 'epic', '51', 'plan.md'), '## Uygulama Planı\n- Adım 1\n- Adım 2\n');

const s = await baslat(kok, 0);
try {
  const res = await fetch(`http://127.0.0.1:${s.port}/api/epic?no=51`);
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.equal(j.no, '51');
  assert.ok(j.plan && j.plan.includes('Uygulama Planı'), '/api/epic plan.md içeriğini döndürmeli');
  assert.ok(j.is && j.is.includes('İş Tanımı'), '/api/epic is.md içeriğini döndürmeli');
} finally {
  await s.kapat();
}

console.log('epic-plan-gorunum.test ok');
