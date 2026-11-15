// mdk-kur.mjs testi: proje kurulumu (planlayıcı kuralları, CLAUDE.md, .agents kuralı, MCP kayıtları, PLAN iskeleti, .gitignore); idempotent.
import { KOK, denetci, depo, existsSync, gecici, join, kos, mkdirSync, oku, writeFileSync } from './yardim.mjs';

const KUR = join(KOK, 'mdk-kur.mjs');
const { vaka, kontrol, bitir } = denetci('mdk-kur.test');
const T = gecici();
const AGY = join(T, 'agy', 'mcp_config.json'); // henüz yok; üst klasörü de kurulum oluşturmalı
const env = { MDK_AGY_MCP: AGY, MDK_AGY: join(T, 'yok-agy') };
const planKaynak = oku(join(KOK, 'esit', 'planlayici.md')).trim();
const json = (yol) => { try { return JSON.parse(oku(yol)); } catch { return {}; } };
const satirVar = (metin, satir) => metin.split('\n').some((s) => s.trim() === satir);

// (1) ilk çalıştırma: iki ana yürütücü de seçili
vaka('1 ilk çalıştırma');
const P1 = depo({}, { R: join(T, 'ornek') }); // git deposu; .gitignore'da üç girdi var, hakem.jsonl eksik
let r = kos(KUR, [P1], { env });
kontrol(r.kod === 0, 'çıkış 0', r.cikti);
kontrol(oku(join(P1, '.mdk', 'planlayici.md')).includes(planKaynak), '.mdk/planlayici.md kaynak kuralı içerir');
kontrol(oku(join(P1, 'CLAUDE.md')).split('\n')[0] === '@.mdk/planlayici.md', 'CLAUDE.md ilk satırı @.mdk/planlayici.md');
kontrol(existsSync(join(P1, '.agents', 'rules', 'mdk.md')), '.agents/rules/mdk.md var');
const mcp1 = json(join(P1, '.mcp.json'));
kontrol(String(mcp1.mcpServers?.mdk?.args?.[0] ?? '').endsWith('mdk-mcp.mjs'), '.mcp.json mcpServers.mdk.args[0] mdk-mcp.mjs ile biter', JSON.stringify(mcp1));
kontrol(mcp1.mcpServers?.mdk?.env?.MDK_PROJE === P1, '.mcp.json env.MDK_PROJE proje yolu', JSON.stringify(mcp1));
const agy1 = json(AGY);
kontrol(Object.keys(agy1.mcpServers ?? {}).some((k) => k.startsWith('mdk-')), 'MDK_AGY_MCP mcpServers altında mdk- anahtarı', JSON.stringify(agy1));
const plan1 = oku(join(P1, 'PLAN.md'));
kontrol(plan1.includes('Görev kod:') && plan1.includes('## Epic 1'), 'PLAN.md iskeleti Görev kod: ve ## Epic 1 içerir');
const gi1 = oku(join(P1, '.gitignore')).split('\n');
kontrol(gi1.filter((x) => x.trim() === '.mdk-log/').length === 1, '.gitignore .mdk-log/ tam bir kez');
kontrol(satirVar(oku(join(P1, '.gitignore')), 'hakem.jsonl'), '.gitignore hakem.jsonl eklendi (eksik girdi tamamlandı)');

// (2) var olan kurallar ve sunucular korunur
vaka('2 var olan dosyalar korunur');
const P2 = depo({}, { R: join(T, 'ikinci') });
writeFileSync(join(P2, 'CLAUDE.md'), '# Proje\nkendi kuralım\n');
writeFileSync(join(P2, '.mcp.json'), '{"mcpServers":{"baska":{"command":"x"}}}');
r = kos(KUR, [P2], { env });
kontrol(r.kod === 0, 'çıkış 0', r.cikti);
const c2 = oku(join(P2, 'CLAUDE.md'));
kontrol(c2.includes('kendi kuralım'), 'CLAUDE.md içindeki kendi kuralım korunur', c2);
kontrol(c2.split('@.mdk/planlayici.md').length === 2, 'CLAUDE.md içinde @.mdk/planlayici.md bir kez', c2);
const mcp2 = json(join(P2, '.mcp.json'));
kontrol(mcp2.mcpServers?.baska?.command === 'x', '.mcp.json baska sunucusu korunur', JSON.stringify(mcp2));
kontrol(!!mcp2.mcpServers?.mdk, '.mcp.json mdk sunucusu eklendi', JSON.stringify(mcp2));

// (3) ikinci çalıştırma: bir şey bozulmaz, değişiklik yok
vaka('3 ikinci çalıştırma idempotent');
const plan2 = oku(join(P2, 'PLAN.md'));
r = kos(KUR, [P2], { env });
kontrol(r.kod === 0, 'çıkış 0', r.cikti);
const c3 = oku(join(P2, 'CLAUDE.md'));
kontrol(c3 === c2, 'CLAUDE.md ikinci çalıştırmada değişmedi', c3);
kontrol(c3.split('@.mdk/planlayici.md').length === 2, 'CLAUDE.md içinde @.mdk/planlayici.md hâlâ bir kez');
const gi = oku(join(P2, '.gitignore')).split('\n');
kontrol(gi.filter((s) => s.trim() === '.mdk-log/').length === 1, '.gitignore .mdk-log/ bir kez');
kontrol(oku(join(P2, 'PLAN.md')) === plan2, 'var olan PLAN.md içeriği değişmedi');
kontrol(r.cikti.includes('aynı:'), 'çıktıda aynı: satırı var', r.cikti);

// (4) --ana claude: yalnız Claude tarafı yazılır
vaka('4 --ana claude');
const P4 = depo({}, { R: join(T, 'dorduncu') });
const AGY4 = join(T, 'agy4', 'mcp_config.json');
r = kos(KUR, [P4, '--ana', 'claude'], { env: { MDK_AGY_MCP: AGY4 } });
kontrol(r.kod === 0, 'çıkış 0', r.cikti);
kontrol(!existsSync(join(P4, '.agents')), '.agents klasörü oluşmadı');
kontrol(!existsSync(AGY4), 'MDK_AGY_MCP dosyası oluşmadı');
kontrol(!!json(join(P4, '.mcp.json')).mcpServers?.mdk, 'claude .mcp.json yazıldı');

// (5) bozuk .mcp.json ezilmez
vaka('5 bozuk .mcp.json');
const P5 = depo({}, { R: join(T, 'besinci') });
writeFileSync(join(P5, '.mcp.json'), '{bozuk');
r = kos(KUR, [P5], { env });
kontrol(r.kod === 4, 'çıkış 4', `kod ${r.kod}: ${r.cikti}`);
kontrol(oku(join(P5, '.mcp.json')) === '{bozuk', 'bozuk .mcp.json değişmedi');

// (6) hatalı girdiler
vaka('6 hatalı girdi');
r = kos(KUR, [join(T, 'yok')], { env });
kontrol(r.kod === 4, 'olmayan dizin çıkış 4', `kod ${r.kod}`);
r = kos(KUR, [], { env });
kontrol(r.kod === 2, 'argümansız çıkış 2', `kod ${r.kod}`);
r = kos(KUR, [P1, '--ana', 'yok'], { env });
kontrol(r.kod === 4 && r.cikti.includes('tanınmayan ana yürütücü'), 'bilinmeyen --ana çıkış 4', r.cikti);

bitir();
