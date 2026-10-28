// Kapı (adım 68): index.html — karar formu gönderimi ve yeniden çizimde yazılan notun korunması.
// Tarayıcı davranışı burada çalıştırılamaz; asıl doğrulama ekran görüntüsü + elle uçtan uca deneme (Claude).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const h = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const js = h.slice(h.indexOf('<script type="module">'));

// gönderim: submit olayı etkiEl'de, tür düğmeden (submitter), JSON gövde, POST
assert.match(js, /etkiEl\.addEventListener\('submit'/, 'submit dinleyicisi etkiEl üzerinde olmalı');
assert.match(js, /preventDefault\(\)/);
assert.match(js, /\.submitter/, 'tür basılan düğmeden (e.submitter.value) alınmalı');
assert.match(js, /fetch\('\/api\/karar'/);
assert.match(js, /method: 'POST'/);
assert.match(js, /'content-type': 'application\/json'/);
assert.match(js, /JSON\.stringify\(\{[^}]*no[^}]*tur[^}]*metin/, 'gövde {no, tur, metin}');
// hata yanıtı ({hata}) ve ağ hatası kullanıcıya .karar-durum'da gösterilir
assert.match(js, /\.hata/);
assert.match(js, /\.karar-durum/);
assert.match(js, /catch/);
// gönderirken düğmeler kilitlenir
assert.match(js, /disabled = true/);
assert.match(js, /disabled = false/);

// yeniden çizim (SSE) notu silmemeli: çizimden önce metin alanları saklanır, sonra geri yazılır
const ciz = js.slice(js.indexOf('etkiEl.innerHTML = etkiHtml(') - 600, js.indexOf('etkiEl.innerHTML = etkiHtml(') + 600);
assert.match(ciz, /textarea/, 'etkiHtml çiziminin çevresinde textarea değerleri saklanıp geri yüklenmeli');
assert.match(js, /etkiHtml\(d\.etki, \{[^}]*izleyici: d\.kararIzleyici/, 'izleyici durumu etkiHtml\'e verilmeli');

// stil: form ve durum satırı için kurallar
assert.match(h, /form\.karar\s*\{/);
assert.match(h, /\.karar-durum\s*\{/);
console.log('karar-ui.test ok');
