import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { snapshot } from './durum.mjs';
import { suAnHtml } from './ciz.mjs';
import { iletiBul } from '../mdk-hata.mjs';

const KOK = mkdtempSync(join(tmpdir(), 'aciklama-'));
// gerçek OpenCode/Claude verisine ve ağa dokunma
process.env.OPENCODE_DB = join(KOK, 'opencode-yok.db');
process.env.CLAUDE_PROJECTS = join(KOK, 'claude-yok');

const PLAN = 'Yürütücü: opencode\nModeller: a/x\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n';

function temp() {
  const d = mkdtempSync(join(KOK, 'vaka-'));
  writeFileSync(join(d, 'PLAN.md'), PLAN);
  return d;
}

const satir = (o) => JSON.stringify({ model: 'a/x', ...o });

// (1) durum.json'da neden varsa onun iletisi
{
  const d = temp();
  writeFileSync(join(d, 'durum.json'), JSON.stringify({ adim: 1, durum: 'saglayici', neden: 'kota' }));
  const s = snapshot(d);
  const beklenen = iletiBul('saglayici', 'kota');
  assert.ok(beklenen?.ileti && beklenen?.oneri, 'iletiBul kota iletisi dönmeli');
  assert.deepEqual(s.simdi.aciklama, beklenen);
}

// (2) durum.json'da neden yoksa metriklerdeki adım 1'in SON kaydının nedeni
{
  const d = temp();
  writeFileSync(join(d, 'durum.json'), JSON.stringify({ adim: 1, durum: 'eskale' }));
  // dosya sırasındaki son adım-1 kaydı 'kapi'; öncesinde 'sure' ve başka adımın 'kota' kaydı var
  writeFileSync(join(d, 'metrikler.jsonl'), [
    satir({ ts: 1, adim: 1, neden: 'sure' }),
    satir({ ts: 2, adim: 2, neden: 'kota' }),
    satir({ ts: 3, adim: 1, neden: 'kapi' }),
  ].join('\n') + '\n');
  const s = snapshot(d);
  const beklenen = iletiBul('eskale', 'kapi');
  assert.ok(beklenen?.ileti && beklenen?.oneri, 'iletiBul eskale iletisi dönmeli');
  assert.deepEqual(s.simdi.aciklama, beklenen);
  assert.notDeepEqual(s.simdi.aciklama, iletiBul('eskale', 'sure'), 'ilk adım-1 kaydı kullanılmamalı');
  assert.notDeepEqual(s.simdi.aciklama, iletiBul('eskale', 'kota'), 'başka adımın kaydı kullanılmamalı');
}

// (3) sade akış durumlarında ve neden olsa bile aciklama yok
for (const durum of ['calisiyor', 'gecti', 'regresyon', 'persona', 'kapi_yaziliyor']) {
  const d = temp();
  writeFileSync(join(d, 'durum.json'), JSON.stringify({ adim: 1, durum, neden: 'kota' }));
  const s = snapshot(d);
  assert.ok(!Object.prototype.hasOwnProperty.call(s.simdi, 'aciklama'), `${durum}: aciklama alanı eklenmemeli`);
}

// (4) durum.json yokken çökmez, simdi null
{
  const d = temp();
  let s;
  assert.doesNotThrow(() => { s = snapshot(d); });
  assert.equal(s.simdi, null);
}

const ts = 1700000000000;

// (5) aciklama varsa .ana bloğunun ardına kaçışlı ileti + öneri eklenir
{
  const h = suAnHtml(
    { adim: 1, baslik: 'İş', durum: 'saglayici', ts, aciklama: { ileti: 'A <b> mesaj', oneri: 'B öneri' } },
    ts,
  );
  assert.equal((h.match(/class="aciklama"/g) || []).length, 1, 'aciklama bir kez geçmeli');
  assert.ok(h.includes('<b>A &lt;b&gt; mesaj</b>'), 'ileti <b> içinde ve kaçışlı olmalı');
  assert.ok(h.includes('<span>B öneri</span>'), 'öneri <span> içinde olmalı');
  assert.ok(!h.includes('<b> mesaj'), 'ham <b> etiketi bulunmamalı');
  assert.ok(/<\/div><div class="aciklama"><b>A &lt;b&gt; mesaj<\/b><span>B öneri<\/span><\/div>\s*$/.test(h),
    'aciklama .ana bloğunun ardına eklenmeli');
}

// (5b) öneri de esc ile kaçışlanır
{
  const h = suAnHtml(
    { adim: 1, baslik: 'İş', durum: 'saglayici', ts, aciklama: { ileti: 'düz', oneri: 'C <i>öneri</i>' } },
    ts,
  );
  assert.ok(h.includes('<span>C &lt;i&gt;öneri&lt;/i&gt;</span>'), 'öneri kaçışlı olmalı');
  assert.ok(!h.includes('<i>öneri</i>'), 'ham öneri etiketi bulunmamalı');
}

// (6) aciklama yoksa ek blok çizilmez
{
  const h = suAnHtml({ adim: 1, baslik: 'İş', durum: 'saglayici', ts }, ts);
  assert.equal((h.match(/class="aciklama"/g) || []).length, 0);
}

// (7) eksik durumlar Türkçe etiketle yazılır, ham anahtar görünmez
function durumEtiketi(h) {
  const m = h.match(/<span class="etiket">durum<\/span><b>([\s\S]*?)<\/b>/);
  return m ? m[1] : null;
}
for (const durum of ['kilit', 'kapi_hata', 'ortam_hatasi', 'kapi_yaziliyor', 'persona']) {
  const h = suAnHtml({ adim: 1, baslik: 'İş', durum, ts }, ts);
  const etiket = durumEtiketi(h);
  assert.ok(etiket && etiket.length > 0, `${durum}: durum etiketi boş olmamalı`);
  assert.notEqual(etiket, durum, `${durum}: ham anahtar gösterilmemeli`);
  if (durum.includes('_')) assert.ok(!etiket.includes('_'), `${durum}: Türkçe etiket olmalı`);
}

console.log('aciklama.test ok');
