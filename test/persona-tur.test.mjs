// persona-tur.mjs testi: sahte opencode (.mjs) ile, ağsız. Kullanım: node test/persona-tur.test.mjs
import { DIZ, cagrilar, ctx, dizinler, join, kosu, oku, setup } from './persona-ortak.mjs';
import { denetci, existsSync, KOK, yetimVar } from './yardim.mjs';
import { readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const { vaka, kontrol, bitir } = denetci('persona-tur.test');
const k = (c, m) => kontrol(c, m, ctx.SON?.cikti);
const md = (ad) => oku(join(DIZ() || '', ad));
const KARTLAR = ['Kart Bir', 'Kart İki / Ek', 'Kart Üç'];

vaka('gecerli');
setup("metin('Seçenek A — x: tamam.');");
kosu(['dev', 'soru.md', ...KARTLAR]);
k(ctx.SON.kod === 0, 'çıkış 0');
const D = DIZ(); k(D && existsSync(join(D, 'ozet.md')), 'ozet.md');
const son = ctx.SON.cikti.trim().split('\n').pop(); k(D && realpathSync(resolve(ctx.P, son)) === realpathSync(D), 'son satır dizin');
const ls = D ? readdirSync(D) : [];
k(ls.includes('1-kart-bir.md') && ls.some((f) => /^2-kart-.*-ek\.md$/.test(f)) && ls.some((f) => /^3-kart-.*\.md$/.test(f)), 'dosya adları');
k(ls.includes('1-kart-bir.jsonl'), 'ham olaylar');
k(/^Model: m\/bir$/m.test(md('1-kart-bir.md')) && /^Token: 250$/m.test(md('1-kart-bir.md')) && /^Durum: gecerli$/m.test(md('1-kart-bir.md')), 'kart başlıkları');
k(md('1-kart-bir.md').includes('Seçenek A — x: tamam.'), 'yanıt metni');
k(cagrilar().sort().join(' ') === 'm/bir|plan m/iki|plan m/uc|plan', 'kart başına model, plan ajanı');
const I1 = oku(join(ctx.T, 'istem-BIR.txt'));
k(['SORU-BIR', 'BICIM-KURALI', 'AYIRT-KURALI', 'PROBLEM-METNI'].every((x) => I1.includes(x)), 'istem içeriği');
k(!['SORU-IKI', 'BENCH-GIZLI', 'YABANCI'].some((x) => I1.includes(x)), 'istemde başkası yok');
k(md('ozet.md').includes('Kart Bir · m/bir · gecerli · 250 token') && md('ozet.md').includes('PROBLEM-METNI'), 'özet');

vaka('paralel'); // 3 kart x 3 sn: sıralı olsaydı ≥9 sn
setup("await uyu(3); metin('Seçenek A — y');");
kosu(['dev', 'soru.md', ...KARTLAR]);
k(ctx.SON.kod === 0 && ctx.SON.sn < 8, 'paralel');

vaka('gecersiz_sonraki_model'); // m/bir biçimsiz → aynı kart m/iki ile yeniden
setup("if (M === 'm/bir') metin('genel öğüt'); else metin('Seçenek A — z');");
kosu(['dev', 'soru.md', 'Kart Bir', 'Kart Üç']);
k(ctx.SON.kod === 0 && /^Model: m\/iki$/m.test(md('1-kart-bir.md')) && /^Durum: gecerli$/m.test(md('1-kart-bir.md')), 'yedek model');
k(cagrilar().filter((c) => c.startsWith('m/bir|')).length === 1 && cagrilar().length === 3, 'çağrı sayısı');

vaka('ezilen_model');
setup("metin('Seçenek A');");
kosu(['dev', 'soru.md', ...KARTLAR], { PERSONA_MODELLER: 'x/a,x/b' });
k(ctx.SON.kod === 0 && cagrilar().sort().join(' ') === 'x/a|plan x/a|plan x/b|plan', 'PERSONA_MODELLER');

vaka('yetersiz'); // hiçbiri geçerli değil → 1, özet yine yazılır
setup("metin('biçimsiz');");
kosu(['dev', 'soru.md', 'Kart Bir', 'Kart Üç']);
k(ctx.SON.kod === 1 && md('ozet.md').includes('gecersiz'), 'yetersiz');

vaka('tek_gecerli_yetmez'); // 2 karttan 1 geçerli → 1; tek kartlı turda 1 geçerli → 0
setup("if (ISTEM.includes('SORU-BIR')) metin('Seçenek A'); else metin('yok');");
kosu(['dev', 'soru.md', 'Kart Bir', 'Kart Üç']); k(ctx.SON.kod === 1, 'iki kartta 1 yetmez');
kosu(['dev', 'soru.md', 'Kart Bir']); k(ctx.SON.kod === 0, 'tek kartta 1 yeter');
k(dizinler().length === 2, 'aynı saniyedeki ikinci tur ayrı dizine');

vaka('sure'); // takılan süreç öldürülür, durum "sure"
setup("yetim('yetim-persona-41'); await uyu(30); metin('Seçenek A');");
kosu(['dev', 'soru.md', 'Kart Bir'], { SURE: '2' });
k(ctx.SON.kod === 1 && ctx.SON.sn < 15 && /^Durum: sure$/m.test(md('1-kart-bir.md')), 'süre');
k(!yetimVar('yetim-persona-41'), 'yetim yok');

vaka('sessiz'); // m/bir hiç çıktı vermez → PERSONA_ILK sn sonra atlanır, m/iki ile geçer
setup("if (M === 'm/bir') { yetim('yetim-persona-42'); await uyu(30); } metin('Seçenek A — s');");
kosu(['dev', 'soru.md', 'Kart Bir'], { PERSONA_ILK: '2' });
k(ctx.SON.kod === 0 && ctx.SON.sn < 10 && /^Model: m\/iki$/m.test(md('1-kart-bir.md')) && /^Durum: gecerli$/m.test(md('1-kart-bir.md')), 'sessiz atlandı');
k(!yetimVar('yetim-persona-42'), 'yetim yok');

vaka('hep_sessiz');
setup("await uyu(30); metin('Seçenek A');");
kosu(['dev', 'soru.md', 'Kart Bir'], { PERSONA_ILK: '2' });
k(ctx.SON.kod === 1 && ctx.SON.sn < 10 && /^Durum: sessiz$/m.test(md('1-kart-bir.md')) && md('ozet.md').includes('sessiz'), 'hep sessiz');

vaka('yavas_ama_canli'); // ilk olayı hemen yazan model PERSONA_ILK'yı aşsa da öldürülmez
setup("olay({type:'step_start'}); await uyu(4); metin('Seçenek A — c');");
kosu(['dev', 'soru.md', 'Kart Bir'], { PERSONA_ILK: '2' });
k(ctx.SON.kod === 0 && /^Model: m\/bir$/m.test(md('1-kart-bir.md')) && cagrilar().length === 1, 'canlı model beklenir');

vaka('hatali_kullanim');
setup("metin('Seçenek A');");
for (const a of [['dev', 'soru.md'], ['yok', 'soru.md', 'Kart Bir'], ['dev', 'soru.md', 'Yok Kart'], ['dev', 'soru.md', 'Yabancı'], ['dev', 'yok.md', 'Kart Bir']]) {
  kosu(a); k(ctx.SON.kod === 2 && !existsSync(join(ctx.P, 'persona-tur')), `kullanım hatası: ${a.join(' ')}`);
}
k(cagrilar().length === 0, 'model çağrılmadı');

vaka('v2'); // cursor/* modeller OpenCode'da koşamaz, atlanır
setup("if (M === 'cursor/auto') metin('Seçenek A'); else metin('yok');");
kosu(['dev', 'soru.md', 'Kart Bir'], { PERSONA_MODELLER: 'm/bir,cursor/auto' });
k(ctx.SON.kod === 1 && !cagrilar().some((c) => c.includes('cursor')) && cagrilar().length === 2, 'cursor atlandı');
k(!oku(join(ctx.T, 'argv')).split('\n').includes('--standalone') && /^error$/im.test(oku(join(ctx.T, 'loglevel'))), 'v2 çağrısı');
setup("metin('Seçenek A');");
kosu(['dev', 'soru.md', 'Kart Bir'], { PERSONA_MODELLER: 'cursor/auto' });
k(ctx.SON.kod === 2 && !existsSync(join(ctx.P, 'persona-tur')), 'yalnız cursor: kullanım hatası');

vaka('v2_token'); // token opencode.db'den (oturum kimliğiyle)
setup("olay({type:'step_start',sessionID:'ses_X'}); metin('Seçenek A');");
const db = new DatabaseSync(join(ctx.T, 'oc.db'));
db.exec('create table session_message (id text, session_id text, type text, seq integer, data text)');
const e = db.prepare('insert into session_message values (?,?,?,?,?)');
e.run('a', 'ses_X', 'assistant', 1, JSON.stringify({ tokens: { input: 1000, output: 300, reasoning: 200, cache: { read: 8000, write: 0 } } }));
e.run('b', 'ses_X', 'user', 2, JSON.stringify({ tokens: { input: 99999 } })); e.run('c', 'ses_Y', 'assistant', 1, JSON.stringify({ tokens: { input: 77777 } }));
db.close();
kosu(['dev', 'soru.md', 'Kart Bir'], { OPENCODE_DB: join(ctx.T, 'oc.db') });
k(ctx.SON.kod === 0 && /^Token: 9500$/m.test(md('1-kart-bir.md')), 'yalnız ses_X assistant');

vaka('gitignore');
k(oku(join(KOK, '.gitignore')).split('\n').includes('persona-tur/'), '.gitignore persona-tur/');
void writeFileSync;
bitir();
