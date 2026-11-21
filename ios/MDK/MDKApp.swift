import SwiftUI

@main
struct MDKApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView(url: PanelAdresi.aktifURL())
        }
    }
}
