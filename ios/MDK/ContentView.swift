import SwiftUI

struct ContentView: View {
    let url: URL

    var body: some View {
        WebView(url: url)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
