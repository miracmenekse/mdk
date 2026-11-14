// persona-tur.mjs varsayılan modelleri PLAN'daki `Görev persona:` satırından alır. Kullanım: node test/persona-gorev.test.mjs
import { cagrilar, ctx, join, kosu, oku, setup } from './persona-ortak.mjs';
import { denetci, writeFileSync } from './yardim.mjs';

const { vaka, kontrol, bitir } = denetci('persona-gorev.test');
const k = (c, m) => kontrol(c, m, ctx.SON?.cikti);
const ekle = (satirlar) => { const p = join(ctx.P, 'PLAN.md'); writeFileSync(p, oku(p).replace(/^(Modeller: .*)$/m, `$1\n${satirlar}`)); };
const modeller = () => cagrilar().map((c) => c.split('|')[0]);

vaka('gorev_persona'); // Görev persona satırı Modeller'in önüne geçer
setup("metin('Seçenek A — x: tamam.');"); ekle('Görev kod: m/kod\nGörev persona: m/p1, m/p2');
kosu(['dev', 'soru.md', 'Kart Bir', 'Kart Üç']);
k(ctx.SON.kod === 0, 'çıkış 0'); k(modeller().sort().join() === 'm/p1,m/p2', 'Görev persona modelleri');

vaka('modeller_yedek'); // Görev persona yoksa Modeller
setup("metin('Seçenek A — x: tamam.');"); ekle('Görev kod: m/kod');
kosu(['dev', 'soru.md', 'Kart Bir', 'Kart Üç']);
k(ctx.SON.kod === 0, 'çıkış 0'); k(!modeller().includes('m/kod') && modeller().includes('m/bir'), 'Modeller yedeği');

vaka('ortam_once'); // PERSONA_MODELLER her şeyin önünde
setup("metin('Seçenek A — x: tamam.');"); ekle('Görev persona: m/p1');
kosu(['dev', 'soru.md', 'Kart Bir'], { PERSONA_MODELLER: 'm/env' });
k(ctx.SON.kod === 0, 'çıkış 0'); k([...new Set(modeller())].join() === 'm/env', 'ortam önce');
bitir();
