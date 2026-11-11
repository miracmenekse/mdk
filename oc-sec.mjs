// Hangi opencode ikilisi kullanılacak? Tek kaynak; kabuk betikleri `node oc-sec.mjs` ile yolu alır.
// Kural: MDK_OPENCODE verilmişse o. Yoksa v2 (varsayılan); ancak v2 bir geliştirme derlemesiyse
// (sürümü 0.0.0…, ücretsiz katman "1.18.0 or newer is required" diye reddeder) ve kararlı v1 kuruluysa v1.
// Mac'te v1 ücretsiz modellerde hata verdiği için (#59387) v1'e yalnız bu durumda geçilir.
import { execFileSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const calisir = (y) => { try { accessSync(y, constants.X_OK); return true; } catch { return false; } };

export function ocSec({ env = process.env, ev = homedir(), surum } = {}) {
  if (env.MDK_OPENCODE) return env.MDK_OPENCODE;
  const v2 = `${ev}/.local/opt/opencode-v2/node_modules/.bin/opencode`;
  const v1 = `${ev}/.local/opt/opencode-v1/node_modules/.bin/opencode`;
  if (!calisir(v1)) return v2;
  if (!calisir(v2)) return v1;
  const oku = surum || ((y) => {
    try { return execFileSync(y, ['--version'], { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
    catch { return ''; }
  });
  return /^0\.0\.0/.test(oku(v2)) ? v1 : v2;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(ocSec());
