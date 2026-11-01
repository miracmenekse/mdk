// Kapı (adım 117): öne dönünce yenileme kararı. Kısa ayrılık yazılan yorumu silmesin.
import Foundation
func bak(_ a: Date?, _ d: Date, _ beklenen: Bool, sat: Int = #line) {
  if YenilemeKarari.gerekli(ayrilma: a, donus: d) != beklenen { print("BAŞARISIZ satır \(sat)"); exit(1) }
}
@main struct T { static func main() {
  let t = Date(timeIntervalSince1970: 1_000_000)
  bak(nil, t, false)
  bak(t, t.addingTimeInterval(5), false)
  bak(t, t.addingTimeInterval(119), false)
  bak(t, t.addingTimeInterval(120), true)
  bak(t, t.addingTimeInterval(7200), true)
  bak(t, t.addingTimeInterval(-60), false)  // saat geri alındı
  print("ios-yenile.test ok")
} }
