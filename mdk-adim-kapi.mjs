// mdk-adim: izinler ve otomatik kapı üretimi (mdk-adim.sh izin_kur + kapı üretimi bloğunun karşılığı).
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { modelListesi, olaylariTopla, planSatiri } from './mdk-ortak.mjs';

const WIN = process.platform === 'win32';
const IC_DEGISKENLER = ['MDK_DONMUS', 'MDK_METRIK', 'MDK_DURUM', 'MDK_PLAN_DOKUNMA', 'MDK_KILIT'];

// iç değişkenler kapıya ve yürütücüye sızmasın (dış koşunun metrik/durum/kilit ayarı içteki testleri bozar)
export function temizOrtam(ek = {}) {
  const e = { ...process.env, ...ek };
  for (const k of IC_DEGISKENLER) delete e[k];
  return e;
}

// izinler: yasaklar yalnız kural metninde değil izinde de durur. kod: kapı dosyaları yazılamaz;
// kapi: yalnız eksik kapı dosyaları yazılabilir. Adımın kendi Kapı'sında geçen betik yasaklanmaz.
export function izinYapilandirmasi(tur, kapilar, eksik = [], sade = false) {
  const kapiMetni = kapilar.join(' ');
  const kabuk = { '*': 'allow', 'sudo *': 'deny', 'git push*': 'deny', 'git stash*': 'deny' };
  for (const b of ['test/hepsi.sh', 'mdk-adim.test.sh']) if (!kapiMetni.includes(b)) kabuk[`*${b}*`] = 'deny';
  const edit = tur === 'kapi' ? { '*': 'deny' } : { '*': 'allow', 'PLAN.md': 'deny', 'test/*': 'deny', 'kapi/*': 'deny', '*.test.*': 'deny' };
  if (tur === 'kapi') for (const f of eksik.filter(Boolean)) edit[f] = 'allow';
  const c = { permission: { edit, bash: kabuk, shell: kabuk, external_directory: 'deny' } }; // shell, external_directory: v2 adları
  if (sade === true || sade === '1') Object.assign(c, { compaction: { auto: true, prune: true }, tool_output: { max_lines: 300, max_bytes: 20000 }, experimental: { batch_tool: true } });
  return JSON.stringify(c);
}

// adımdaki .test.mjs/.test.sh ya da kapi/* dosyalarından diskte olmayanlar (kapi/derle.sh hariç), sıralı tekil
export function eksikKapilar(kapilar, kok = '.') {
  const re = /([A-Za-z0-9_./-]+\.test\.(mjs|sh)|kapi\/[A-Za-z0-9_./-]+\.(sh|py|mjs|java))/g;
  const hepsi = new Set();
  for (const k of kapilar) for (const m of k.matchAll(re)) if (m[0] !== 'kapi/derle.sh') hepsi.add(m[0]);
  return [...hepsi].sort().filter((f) => !existsSync(join(kok, f)));
}

const bashVar = () => !WIN || spawnSync('bash', ['-c', 'exit 0'], { stdio: 'ignore' }).status === 0;
// kapı ve regresyon komutu kabukta koşar: POSIX'te bash -c; Windows'ta bash (Git Bash) varsa o, yoksa cmd
export function kabukKos(komut, { env, cwd, cikti } = {}) {
  const r = bashVar()
    ? spawnSync('bash', ['-c', komut], { env, cwd, encoding: 'utf8', maxBuffer: 256 << 20 })
    : spawnSync(komut, { env, cwd, encoding: 'utf8', shell: true, maxBuffer: 256 << 20 });
  const metin = (r.stdout || '') + (r.stderr || '');
  return { ok: r.status === 0, kod: r.status, metin, cikti };
}

const git = (...a) => spawnSync('git', a, { encoding: 'utf8', maxBuffer: 256 << 20 });

// otomatik kapı üretimi: eksik kapı dosyalarını Görev kapi: modellerine yazdırır. Başarıda yeni HEAD, yoksa null.
// ctx: {n, blok, kapilar, planMetni, kurallar, projeKural, cp, logd, calistir, yazDurum, yazMetrik, selfDir, sade, yazLog}
export async function kapiUret(ctx) {
  const { n, blok, kapilar, planMetni, kurallar, projeKural, logd, calistir, yazDurum, yazMetrik, selfDir } = ctx;
  const yazLog = ctx.yazLog || (() => {});
  let cp = ctx.cp;
  const eksik = eksikKapilar(kapilar);
  const modeller = modelListesi(planSatiri(planMetni, 'Görev kapi') || '');
  if (!eksik.length) return cp;
  const eksikStr = eksik.join(' ');
  process.env.OPENCODE_CONFIG_CONTENT = izinYapilandirmasi('kapi', kapilar, eksik, ctx.sade);
  let kd = 0, sonuc = null;
  try {
    for (const km of modeller) {
      kd++; yazDurum(km, kd, 'kapi_yaziliyor');
      const klog = join(logd, `kapi${n}-${Math.floor(Date.now() / 1000)}.jsonl`);
      const kistem = `${kurallar}

Görev: KAPI ÜRETME. Aşağıdaki adım için YALNIZCA şu eksik kapı test dosyasını yaz: ${eksikStr}. Üretim koduna dokunma.
Yazdığın test mevcut kodda KIRMIZI (çıkış != 0) olmalı, adımın 'Ne:' maddesi uygulandığında YEŞİL (çıkış 0) olmalı.
Kapı metnindeki her iddiayı ayrı bir assert ile ve davranışı ÇALIŞTIRARAK doğrula (modülü içe aktar, süreci ya da sunucuyu başlat); yalnız kaynak dosyada metin arayan test zayıf kapıdır. Başarı, hata ve sınır durumunu kapsa.
${projeKural}
Adım (PLAN.md adım ${n}; metnin tamamı burada):
${blok}`;
      const r = await calistir(km, `kapi-${n}`, kistem, klog, false);
      let kneden = r.neden || '';
      const hepsiVar = eksik.every((f) => existsSync(f));
      git('add', '-A');
      const diger = (git('diff', '--cached', '--name-only', cp).stdout || '').split('\n').filter((f) => f && !eksik.includes(f));
      if (!kneden) {
        if (!hepsiVar) kneden = 'kapi_eksik';            // istenen dosya yazılmadı
        else if (diger.length) kneden = 'kapi_kapsam';   // başka dosyaya dokundu
        else {
          // doğru nedenle kırmızı: sözdizimi bozuk test de "kırmızı"dır ama hiçbir şeyi sınamaz
          for (const tf of eksik) {
            let ok = true;
            if (tf.endsWith('.mjs')) ok = spawnSync(process.execPath, ['--check', tf], { stdio: 'ignore' }).status === 0;
            else if (tf.endsWith('.sh') && bashVar()) ok = spawnSync('bash', ['-n', tf], { stdio: 'ignore' }).status === 0;
            if (!ok) kneden = 'kapi_sozdizimi';
          }
          if (!kneden) {
            let kirmizi = false;
            for (const k of kapilar) { const s = kabukKos(k, { env: temizOrtam() }); yazLog(`${klog}.kapi`, s.metin); if (!s.ok) { kirmizi = true; break; } }
            if (!kirmizi) kneden = 'kapi_yesil';         // kod yazılmadan geçen kapı hiçbir şeyi sınamıyor
          }
        }
      }
      const o = olaylariTopla(klog);
      const simdi = Math.floor(Date.now() / 1000);
      // kapı üretimi de ölçülür; tur=kapi satırları model/adım istatistiğine girmez (panel ayrı sayar)
      yazMetrik({ tur: 'kapi', ts: simdi, adim: Number(n), yurutucu: r.yurm, model: km, gorev: 'kapi', deneme: kd, gecti: !kneden, sure_sn: simdi - r.t0, token: o.token, etkin: o.etkin, istek: o.istek, maliyet: o.maliyet, neden: kneden || null });
      if (!kneden) {
        // zayıf kapı uyarısı (reddetmez): yalnız kaynak metni arayan test; planlayan görsün
        const denetle = join(selfDir, 'kapi-denetle.mjs');
        if (existsSync(denetle)) for (const tf of eksik) spawnSync(process.execPath, [denetle, '--dosya', tf], { stdio: ['ignore', 'inherit', 'ignore'] });
        if (git('diff', '--cached', '--quiet').status !== 0) {
          git('commit', '-qm', `adım ${n} kapısı: ${eksikStr} (${km})`);
          cp = git('rev-parse', 'HEAD').stdout.trim();
        }
        sonuc = cp; break;
      }
      console.log(`adım ${n}: kapı üretimi başarısız (${km}: ${kneden})`);
      for (const f of eksik) rmSync(f, { force: true });
      git('reset', '-q', '--hard', cp); git('clean', '-fdq');
    }
  } finally {
    process.env.OPENCODE_CONFIG_CONTENT = izinYapilandirmasi('kod', kapilar, [], ctx.sade);
  }
  return sonuc;
}
