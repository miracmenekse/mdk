// Kapı: Araştırma sekmesi. Kullanım: node panel/arastirma.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baslat } from './sunucu.mjs';
import { arastirmaHtml } from './ciz.mjs';

const proje = join(dirname(fileURLToPath(import.meta.url)), '..');

// 1) gerçek veri dosyası geçerli
const gercek = JSON.parse(readFileSync(join(proje, 'arastirma/arastirma.json'), 'utf8'));
const ROLLER = ['altlik', 'ornek', 'yan-yana', 'izle', 'kullanma'];
assert.ok(gercek.adaylar.length >= 20, 'en az 20 aday');
assert.ok(gercek.birlesimler.length >= 5, 'en az 5 birleşim');
const adlar = new Set(gercek.adaylar.map((a) => a.repo));
for (const a of gercek.adaylar) {
  assert.match(a.repo, /^[\w.-]+\/[\w.-]+$/, `repo biçimi: ${a.repo}`);
  assert.ok(ROLLER.includes(a.rol), `rol geçersiz: ${a.repo}`);
  for (const k of ['kategori', 'ne', 'alinacak', 'risk', 'kanit']) assert.ok(a[k], `${a.repo}: ${k} boş`);
}
for (const b of gercek.birlesimler) {
  for (const p of b.parcalar) assert.ok(adlar.has(p), `birleşim "${b.ad}" bilinmeyen parça: ${p}`);
  assert.ok(b.deger >= 1 && b.deger <= 5, `${b.ad}: değer 1-5`);
  assert.ok(['S', 'M', 'L'].includes(b.efor), `${b.ad}: efor S/M/L`);
}

// 2) çizim: saf, kaçışlı, boş durum, süzgeç
const veri = {
  tarih: '2026-10-18',
  not: 'n',
  adaylar: [
    { repo: 'a/<img src=x onerror=1>', kategori: 'cizim', yildiz: null, lisans: 'MIT', son: '2026-01-01', dil: 'JS', ne: '<script>alert(1)</script>', rol: 'ornek', alinacak: 'x', risk: 'y', kanit: 'doğrulanamadı' },
    { repo: 'b/ok', kategori: 'kanban', yildiz: 12, lisans: 'MIT', son: '2026-01-02', dil: 'Go', ne: 'iyi', rol: 'altlik', alinacak: 'x', risk: 'y', kanit: 'README okundu' },
  ],
  birlesimler: [{ ad: 'Bir', parcalar: ['b/ok'], ne: 'n', neden: 'd', panelde: 'p', efor: 'S', deger: 4, risk: 'r' }],
  oneri: 'sıra',
};
const h = arastirmaHtml(veri);
assert.ok(!h.includes('<script>') && !h.includes('<img src=x'), 'HTML kaçışlanmamış');
assert.ok(h.includes('b/ok') && h.includes('https://github.com/b/ok'), 'aday bağlantısı yok');
assert.ok(h.includes('rel="noopener noreferrer"') && h.includes('target="_blank"'), 'dış bağlantı güvenli açılmalı');
assert.ok(!h.includes('null'), 'null yıldız "null" yazmamalı');
assert.ok(h.includes('doğrulanamadı'), 'kanıt durumu görünmeli');
assert.ok(h.includes('Bir') && h.includes('sıra'), 'birleşim ve öneri görünmeli');
const sade = arastirmaHtml(veri, { kategori: 'kanban' });
assert.ok(sade.includes('b/ok') && !sade.includes('onerror'), 'kategori süzgeci aday gizlemeli');
assert.ok(sade.includes('Bir'), 'süzgeç birleşimleri gizlememeli');
const bos = arastirmaHtml({ adaylar: [], birlesimler: [] });
assert.ok(/araştırma verisi yok/i.test(bos), 'boş durum metni yok');
assert.ok(/araştırma verisi yok/i.test(arastirmaHtml(null)), 'null veri çökmemeli');

// 3) sunucu: /api/arastirma veriyi verir, dosya yoksa boş şema
const d = mkdtempSync(join(tmpdir(), 'ara-'));
writeFileSync(join(d, 'PLAN.md'), 'Yürütücü: opencode\n\n## K\n- [ ] 1. İş\n  - Kapı: `true`\n');
const s1 = await baslat(d, 0);
let r = await fetch(`http://127.0.0.1:${s1.port}/api/arastirma`);
assert.equal(r.status, 200);
assert.match(r.headers.get('content-type'), /application\/json/);
assert.deepEqual(await r.json(), { adaylar: [], birlesimler: [] });
await s1.kapat();
mkdirSync(join(d, 'arastirma'));
writeFileSync(join(d, 'arastirma/arastirma.json'), JSON.stringify(veri));
const s2 = await baslat(d, 0);
r = await fetch(`http://127.0.0.1:${s2.port}/api/arastirma`);
assert.equal((await r.json()).adaylar.length, 2);
r = await fetch(`http://127.0.0.1:${s2.port}/`);
const sayfa = await r.text();
assert.ok(sayfa.includes('id="arastirma"') && sayfa.includes('/api/arastirma'), 'sayfa araştırma bölümünü yüklemeli');
assert.ok(sayfa.includes('arastirmaHtml'), 'sayfa arastirmaHtml kullanmalı');
await s2.kapat();

// 4) bozuk JSON sunucuyu düşürmez
writeFileSync(join(d, 'arastirma/arastirma.json'), '{bozuk');
const s3 = await baslat(d, 0);
r = await fetch(`http://127.0.0.1:${s3.port}/api/arastirma`);
assert.equal(r.status, 200);
assert.deepEqual(await r.json(), { adaylar: [], birlesimler: [] });
await s3.kapat();
console.log('arastirma.test ok');
