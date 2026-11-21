import Foundation

enum YenilemeKarari {
    static let esikSaniye: TimeInterval = 120.0

    static func gerekli(ayrilma: Date?, donus: Date) -> Bool {
        guard let ayrilma = ayrilma else { return false }
        let fark = donus.timeIntervalSince(ayrilma)
        if fark < 0 {
            return false
        }
        return fark >= esikSaniye
    }
}
