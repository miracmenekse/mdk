// Kapı (adım 72): OpenCode v2 veritabanı (session_v2 + session_message). Kullanım: node panel/telemetri-v2.test.mjs
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { telemetri } from './telemetri.mjs';

const d = mkdtempSync(join(tmpdir(), 'tel-v2-'));
const yol = join(d, 'opencode.db');
const db = new DatabaseSync(yol);
db.exec(`create table session (id text, directory text);
  create table message (id text, session_id text, data text);
  create table session_v2 (id text, directory text, model text);
  create table session_message (id text, session_id text, type text, seq integer, data text);`);
const asistan = (model, t, bas, son) => JSON.stringify({ time: { created: bas, completed: son }, model, cost: 0, tokens: t });
const ekle = db.prepare('insert into session_message values (?, ?, ?, ?, ?)');
db.prepare('insert into session_v2 values (?, ?, ?)').run('s1', '/a/proje', '{}');
db.prepare('insert into session_v2 values (?, ?, ?)').run('s2', '/a/proje-baska', '{}');
db.prepare('insert into session_v2 values (?, ?, ?)').run('s3', '/a/proje/alt', '{}');
ekle.run('m1', 's1', 'assistant', 1, asistan({ id: 'x-free', providerID: 'opencode' }, { input: 100, output: 10, reasoning: 5, cache: { read: 1000, write: 0 } }, 1000, 3000));
ekle.run('m2', 's1', 'user', 2, JSON.stringify({ text: 'merhaba' }));
ekle.run('m3', 's1', 'assistant', 3, asistan({ id: 'x-free', providerID: 'opencode' }, { input: 20, output: 4, reasoning: 0, cache: { read: 1100, write: 0 } }, 4000, 5000));
ekle.run('m4', 's2', 'assistant', 1, asistan({ id: 'x-free', providerID: 'opencode' }, { input: 999, output: 9, reasoning: 0, cache: { read: 0, write: 0 } }, 0, 1));
ekle.run('m5', 's3', 'assistant', 1, asistan({ id: 'y', providerID: 'openrouter' }, { input: 7, output: 3, reasoning: 0, cache: { read: 0, write: 0 } }, 0, 1));
ekle.run('m6', 's1', 'assistant', 4, 'bozuk{');
// v1 tablosundaki eski kopya: v2 tabloları varken ikinci kez sayılmamalı
db.prepare('insert into session values (?, ?)').run('s1', '/a/proje');
db.prepare('insert into message values (?, ?, ?)').run('e1', 's1', JSON.stringify({ role: 'assistant', providerID: 'opencode', modelID: 'x-free', cost: 0, tokens: { input: 5000, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } }));
db.close();

const t = telemetri(yol, null, '/a/proje');
assert.equal(t.var, true);
assert.equal(t.kapsam, 'proje');
const x = t.modeller.find((m) => m.model === 'opencode/x-free');
const y = t.modeller.find((m) => m.model === 'openrouter/y');
assert.ok(x && y, 'model adı providerID/id');
assert.equal(t.modeller.length, 2, 'başka dizin (proje-baska) sayılmaz, alt dizin sayılır');
assert.equal(x.mesaj, 2);
assert.equal(x.giris, 120, 'v1 message tablosundaki eski kopya sayılmaz; s2 sayılmaz');
assert.equal(x.cikis, 14);
assert.equal(x.akil, 5);
assert.equal(x.cacheOkuma, 2100);
assert.equal(x.toplam, 120 + 14 + 5 + 2100);
assert.ok(Math.abs(x.toksn - 14 / 3) < 1e-9, 'hız: çıkış / süre');

// v2 tabloları yoksa eski yol aynen çalışır
const d1 = mkdtempSync(join(tmpdir(), 'tel-v1-'));
const yol1 = join(d1, 'opencode.db');
const db1 = new DatabaseSync(yol1);
db1.exec('create table session (id text, directory text); create table message (id text, session_id text, data text);');
db1.prepare('insert into session values (?, ?)').run('s1', '/a/proje');
db1.prepare('insert into message values (?, ?, ?)').run('e1', 's1', JSON.stringify({ role: 'assistant', providerID: 'opencode', modelID: 'x-free', cost: 0, tokens: { input: 50, output: 1, reasoning: 0, cache: { read: 0, write: 0 } } }));
db1.close();
const t1 = telemetri(yol1, null, '/a/proje');
assert.equal(t1.modeller[0].model, 'opencode/x-free');
assert.equal(t1.modeller[0].giris, 50);
console.log('telemetri-v2.test ok');
