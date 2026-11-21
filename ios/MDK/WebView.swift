import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        let istek = URLRequest(url: url)
        webView.load(istek)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // Yeniden yükleme gerekirse burada ele alınır
    }
}
