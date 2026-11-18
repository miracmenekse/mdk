// Kapı (adım 219): Yapılacaklar silme saf işlevi ve API uç noktası desteği
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { yapilacakOku, yapilacakEkle, yapilacakSil } from '../panel/yapilacak.mjs';
import { baslat } from '../panel/sunucu.mjs';
import { depo, commit, git } from './yardim.mjs';

// 1. Saf işlev testleri
const l0 = [
  { id: 1, baslik: 'İş 1', not: '', durum: 'bekliyor', epic: null },
  { id: 2, baslik: 'İş 2', not: '', durum: 'ertelendi', epic: null },
];
const l1 = yapilacakSil(l0, 1);
assert.equal(l1.length, 1, 'silinen öğe listeden çıkmalı');
assert.equal(l1[0].id, 2, 'kalan öğe id 2 olmalı');
assert.equal(l0.length, 2, 'orijinal liste mutasyona uğramamalı');

assert.throws(() => yapilacakSil(l0, 99), /iş bulunamadı/, 'olmayan id hata fırlatmalı');

// 2. Sunucu API testleri
const R = depo({ 'PLAN.md': '# MDK\n', '.gitignore': 'durum.json\nmetrikler.jsonl\n.mdk-log/\n' });
commit(R, 'ilk');
const s = await baslat(R, 0);
const kok = `http://127.0.0.1:${s.port}`;
const sonKonu = () => git(R, 'log', '-1', '--format=%s').stdout.trim();
const temiz = () => git(R, 'status', '--porcelain').stdout.trim() === '';

const post = (govde) =>
  fetch(`${kok}/api/yapilacak`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(govde),
  });

// İki iş ekle
let r1 = await post({ islem: 'ekle', baslik: 'İlk iş' });
assert.equal(r1.status, 200);
let r2 = await post({ islem: 'ekle', baslik: 'İkinci iş' });
assert.equal(r2.status, 200);
assert.equal(yapilacakOku(R).length, 2);

// id 1'i sil
let rSil = await post({ islem: 'sil', id: 1 });
assert.equal(rSil.status, 200, 'silme işlemi 200 dönmeli');
let jSil = await rSil.json();
assert.equal(jSil.tamam, true);
assert.equal(jSil.liste.length, 1);
assert.equal(jSil.liste[0].id, 2);
assert.equal(yapilacakOku(R).length, 1);
assert.equal(yapilacakOku(R)[0].id, 2);
assert.ok(temiz(), 'silme sonrası git deposu temiz olmalı');
assert.equal(sonKonu(), 'yapılacak: sil #1', 'commit konusu doğru olmalı');

// Olmayan id silme
let rHata = await post({ islem: 'sil', id: 99 });
assert.equal(rHata.status, 400, 'olmayan id 400 dönmeli');

// id parametresi eksik silme
let rEksik = await post({ islem: 'sil' });
assert.equal(rEksik.status, 400, 'id eksikken 400 dönmeli');

await s.kapat();
console.log('yapilacak-sil-api.test ok');
