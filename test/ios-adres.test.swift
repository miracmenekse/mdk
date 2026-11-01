// Kapı (adım 116): PanelAdresi.cozumle saf işlev denetimi.
import Foundation
func bak(_ girdi: String, _ beklenen: String?, sat: Int = #line) {
  let s = PanelAdresi.cozumle(girdi)?.absoluteString
  if s != beklenen { print("BAŞARISIZ satır \(sat): '\(girdi)' → \(s ?? "nil"), beklenen \(beklenen ?? "nil")"); exit(1) }
}
@main struct T { static func main() {
  bak("mac.tail1a2b.ts.net", "https://mac.tail1a2b.ts.net")
  bak("  MAC.tail1a2b.ts.net/  ", "https://mac.tail1a2b.ts.net")
  bak("https://mac.tail1a2b.ts.net/", "https://mac.tail1a2b.ts.net")
  bak("http://mac.tail1a2b.ts.net", nil)      // uzak düz http reddedilir
  bak("http://127.0.0.1:4747", "http://127.0.0.1:4747") // simülatör/yerel istisna
  bak("http://localhost:4747/", "http://localhost:4747")
  bak("", nil); bak("   ", nil); bak("mac tail", nil); bak("ftp://mac.ts.net", nil); bak("https://", nil)
  print("ios-adres.test ok")
} }
