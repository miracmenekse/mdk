// Kanıt sunucusu: sayfanın JS'i gerçekten koşup /kanit'i çağırırsa 0 ile çıkar. Kullanım: ios-kanit.mjs <port> <süre sn>
import { createServer } from 'node:http';
const [port, sure] = [Number(process.argv[2]), Number(process.argv[3] || 40)];
const sayfa = '<!doctype html><title>kanit</title><p>kanit</p><script>fetch("/kanit?h="+location.host)</script>';
const s = createServer((i, y) => {
  if (i.url.startsWith('/kanit')) { y.end('ok'); console.log('kanit geldi'); setTimeout(() => process.exit(0), 50); return; }
  y.setHeader('content-type', 'text/html; charset=utf-8'); y.end(sayfa);
});
s.listen(port, '127.0.0.1');
setTimeout(() => { console.error('kanit gelmedi'); process.exit(1); }, sure * 1000);
