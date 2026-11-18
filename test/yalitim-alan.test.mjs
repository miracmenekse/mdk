// Kapı (adım 225): Yalıtılmış çalışma alanı (yalitimEtkinMi ve temizGeriAl)
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { yalitimEtkinMi, temizGeriAl } from '../mdk-ortak.mjs';
import { depo, commit, oku } from './yardim.mjs';

// 1. yalitimEtkinMi kontrolleri
assert.equal(yalitimEtkinMi('', '', { MDK_YALITIM: '1' }), true, 'MDK_YALITIM=1 etkin olmalı');
assert.equal(yalitimEtkinMi('Yalıtım: evet\n\n## Epic 1', '- [ ] 1. İş', { MDK_YALITIM: '0' }), false, 'MDK_YALITIM=0 devre dışı bırakmalı');
assert.equal(yalitimEtkinMi('', '- [ ] 1. İş\n  - Yalıtım: evet\n', {}), true, 'adımda - Yalıtım: evet etkin olmalı');
assert.equal(yalitimEtkinMi('Yalıtım: evet\n\n## Epic 1\n', '- [ ] 1. İş\n', {}), true, 'PLAN başında Yalıtım: evet etkin olmalı');
assert.equal(yalitimEtkinMi('# MDK\n\n## Epic 1\n', '- [ ] 1. İş\n', {}), false, 'varsayılan kapalı olmalı');

// 2. temizGeriAl: değişiklikleri ve izlenmeyen dosyaları silerken .mdk-log ve durum.json dosyalarını korur
const R = depo({ 'a.txt': 'ilk\n', '.gitignore': '.mdk-log/\ndurum.json\nmetrikler.jsonl\n' });
const cp = commit(R, 'ilk');
writeFileSync(join(R, 'a.txt'), 'degisti\n');
writeFileSync(join(R, 'gecici.txt'), 'silinmeli\n');
mkdirSync(join(R, '.mdk-log'), { recursive: true });
writeFileSync(join(R, '.mdk-log', 'adim1.log'), 'korunmali\n');
writeFileSync(join(R, 'durum.json'), '{"adim":1}\n');

const ok = temizGeriAl(R, cp);
assert.equal(ok, true, 'temizGeriAl başarılı dönmeli');
assert.equal(oku(join(R, 'a.txt')), 'ilk\n', 'değişen dosya ilk haline dönmeli');
assert.equal(existsSync(join(R, 'gecici.txt')), false, 'izlenmeyen dosya silinmeli');
assert.equal(existsSync(join(R, '.mdk-log', 'adim1.log')), true, '.mdk-log korunmalı');
assert.equal(existsSync(join(R, 'durum.json')), true, 'durum.json korunmalı');

console.log('yalitim-alan.test ok');
