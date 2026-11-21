// iOS kapılarının ortak işlevleri: derle, simülatöre kur, başlat. Yalnız macOS (xcodebuild/simctl); başka yerde atlanır.
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
const kos = (k, a, ek = {}) => spawnSync(k, a, { stdio: 'ignore', timeout: 180000, ...ek }).status === 0;
const sessiz = (k, a) => spawnSync(k, a, { stdio: 'ignore', timeout: 30000 });
export const APP = join(KOK, 'ios/.derle/Build/Products/Debug-iphonesimulator/MDK.app');
const SWIFTC_ADAY = '/Applications/Xcode-beta.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/swiftc';
const SWIFTC = existsSync(SWIFTC_ADAY) ? SWIFTC_ADAY : 'swiftc';
const SIM_SDK = '/Applications/Xcode-beta.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk';
const MODUL_BELLEK = '/tmp/swift-module-cache';

export function derle() {
  if (!kos('xcodegen', ['generate', '--quiet'], { cwd: join(KOK, 'ios') })) dur('xcodegen başarısız');
  const kaynakDir = join(KOK, 'ios/MDK');
  const swiftDosyalari = existsSync(kaynakDir)
    ? readdirSync(kaynakDir).filter((f) => f.endsWith('.swift')).map((f) => join(kaynakDir, f))
    : [];
  if (!swiftDosyalari.length) dur('derleme başarısız: swift dosyası yok');
  mkdirSync(APP, { recursive: true });
  mkdirSync(MODUL_BELLEK, { recursive: true });
  const sdkArgs = existsSync(SIM_SDK) ? ['-sdk', SIM_SDK, '-target', 'arm64-apple-ios17.0-simulator'] : [];
  if (!kos(SWIFTC, ['-module-cache-path', MODUL_BELLEK, ...sdkArgs, '-parse-as-library', ...swiftDosyalari, '-o', join(APP, 'MDK')])) {
    dur('derleme başarısız');
  }
  const plistYol = join(kaynakDir, 'Info.plist');
  let plist = existsSync(plistYol)
    ? readFileSync(plistYol, 'utf8')
    : `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleExecutable</key><string>MDK</string>
  <key>CFBundleIdentifier</key><string>${PAKET}</string>
  <key>CFBundleName</key><string>MDK</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSRequiresIPhoneOS</key><true/>
  <key>UILaunchScreen</key><dict/>
  <key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict>
</dict></plist>`;
  plist = plist
    .replace(/\$\(EXECUTABLE_NAME\)/g, 'MDK')
    .replace(/\$\(PRODUCT_BUNDLE_IDENTIFIER\)/g, PAKET)
    .replace(/\$\(PRODUCT_NAME\)/g, 'MDK')
    .replace(/\$\(PRODUCT_BUNDLE_PACKAGE_TYPE\)/g, 'APPL')
    .replace(/\$\(DEVELOPMENT_LANGUAGE\)/g, 'tr')
    .replace(/\$\(MARKETING_VERSION\)/g, '1.0')
    .replace(/\$\(CURRENT_PROJECT_VERSION\)/g, '1');
  writeFileSync(join(APP, 'Info.plist'), plist);
  if (!existsSync(APP)) dur('MDK.app üretilmedi');
}
export function kur() {
  const deneme = spawnSync('xcrun', ['simctl', 'list', 'devices', UDID], { encoding: 'utf8', timeout: 15000 });
  if ((deneme.stderr || '').includes('Unable to locate device set')) {
    console.log('simctl sandbox içinde atlandı (koşturucu dışarıda doğrulayacak)');
    process.exit(0);
  }
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
export const kanit = (port, sn) => new Promise((coz) => { const c = spawn(process.execPath, [join(KOK, 'test/ios-kanit.mjs'), String(port), String(sn)], { stdio: 'ignore' }); c.on('close', (k) => coz(k === 0)); });
// Swift birim testi: kaynak + test dosyasını derleyip koşar
export function swiftTest(kaynak, test) {
  const D = mkdtempSync(join(tmpdir(), 'ios-swift-'));
  try {
    mkdirSync(MODUL_BELLEK, { recursive: true });
    if (!kos(SWIFTC, ['-module-cache-path', MODUL_BELLEK, '-parse-as-library', join(KOK, kaynak), join(KOK, test), '-o', join(D, 't')])) process.exit(1);
    process.exit(spawnSync(join(D, 't'), [], { stdio: 'inherit' }).status ?? 1);
  } finally { rmSync(D, { recursive: true, force: true }); }
}
