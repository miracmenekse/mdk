// iOS kapılarının ortak işlevleri: derle, simülatöre kur, başlat. Yalnız macOS (xcodebuild/simctl); başka yerde atlanır.
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

export const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PAKET = 'com.miracmenekse.mdk';
export const UDID = process.env.MDK_SIM || '561893AD-5010-42ED-AC97-72AD478CA460'; // iPhone 17 Pro, iOS 27
export const uyu = (ms) => new Promise((coz) => setTimeout(coz, ms));
export function yalnizMac() { if (process.platform !== 'darwin') { console.log('atlandı (macOS değil): iOS testi'); process.exit(0); } }
export const dur = (m) => { console.log(m); process.exit(1); };
const kos = (k, a, ek = {}) => spawnSync(k, a, { stdio: 'inherit', ...ek }).status === 0;
const sessiz = (k, a) => spawnSync(k, a, { stdio: 'ignore' });
export const APP = join(KOK, 'ios/.derle/Build/Products/Debug-iphonesimulator/MDK.app');

export function derle() {
  if (!kos('xcodegen', ['generate', '--quiet'], { cwd: join(KOK, 'ios') })) dur('xcodegen başarısız');
  if (!kos('xcodebuild', ['-project', join(KOK, 'ios/MDK.xcodeproj'), '-scheme', 'MDK', '-destination', `id=${UDID}`, '-derivedDataPath', join(KOK, 'ios/.derle'), 'CODE_SIGNING_ALLOWED=NO', '-quiet', 'build'])) dur('derleme başarısız');
  if (!existsSync(APP)) dur('MDK.app üretilmedi');
}
export function kur() {
  sessiz('xcrun', ['simctl', 'boot', UDID]); sessiz('xcrun', ['simctl', 'bootstatus', UDID, '-b']);
  sessiz('xcrun', ['simctl', 'terminate', UDID, PAKET]); sessiz('xcrun', ['simctl', 'uninstall', UDID, PAKET]);
  if (!kos('xcrun', ['simctl', 'install', UDID, APP])) dur('kurulum başarısız');
}
export function baslat(url) {
  if (spawnSync('xcrun', ['simctl', 'launch', UDID, PAKET], { stdio: 'ignore', env: { ...process.env, SIMCTL_CHILD_MDK_PANEL_URL: url } }).status !== 0) dur('açılmadı');
}
export const kapat = () => sessiz('xcrun', ['simctl', 'terminate', UDID, PAKET]);
export const canli = () => (spawnSync('xcrun', ['simctl', 'spawn', UDID, 'launchctl', 'list'], { encoding: 'utf8' }).stdout || '').includes(PAKET);
// kanıt sunucusu (test/ios-kanit.mjs): sayfa yüklenip JS koşunca 0 ile çıkar
export const kanit = (port, sn) => new Promise((coz) => { const c = spawn(process.execPath, [join(KOK, 'test/ios-kanit.mjs'), String(port), String(sn)], { stdio: 'inherit' }); c.on('close', (k) => coz(k === 0)); });
// Swift birim testi: kaynak + test dosyasını derleyip koşar
export function swiftTest(kaynak, test) {
  const D = mkdtempSync(join(tmpdir(), 'ios-swift-'));
  try {
    if (!kos('swiftc', ['-parse-as-library', join(KOK, kaynak), join(KOK, test), '-o', join(D, 't')])) process.exit(1);
    process.exit(spawnSync(join(D, 't'), [], { stdio: 'inherit' }).status ?? 1);
  } finally { rmSync(D, { recursive: true, force: true }); }
}
