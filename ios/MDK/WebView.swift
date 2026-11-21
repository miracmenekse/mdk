import SwiftUI
import WebKit
import Combine

@MainActor
final class WebGorunumModeli: ObservableObject {
    @Published var url: URL
    @Published var hataVar: Bool = false
    @Published var adresDegistirAcik: Bool = false
    @Published var yeniAdresGirdisi: String = ""

    private var zamanlayici: Timer?
    weak var webView: WKWebView?

    init(url: URL) {
        self.url = url
    }

    func webViewBagla(_ webView: WKWebView) {
        self.webView = webView
        yukle()
    }

    func yukle() {
        guard let webView = webView else { return }
        let istek = URLRequest(url: url, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 10.0)
        webView.load(istek)
    }

    func hataOlustu() {
        hataVar = true
        zamanlayiciyiBaslat()
    }

    func basariliOldu() {
        hataVar = false
        zamanlayiciyiDurdur()
    }

    func yenidenDene() {
        yukle()
    }

    func adresiDegistir(yeniGirdi: String) {
        if let yeniURL = PanelAdresi.cozumle(yeniGirdi) {
            UserDefaults.standard.set(yeniURL.absoluteString, forKey: "panelAdresi")
            self.url = yeniURL
            hataVar = false
            yukle()
        }
    }

    func webProcessOldu() {
        webView?.reload()
    }

    private func zamanlayiciyiBaslat() {
        guard zamanlayici == nil else { return }
        zamanlayici = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self = self, self.hataVar else { return }
                self.yukle()
            }
        }
    }

    private func zamanlayiciyiDurdur() {
        zamanlayici?.invalidate()
        zamanlayici = nil
    }

    deinit {
        zamanlayici?.invalidate()
    }
}

final class WebViewKoordinator: NSObject, WKNavigationDelegate {
    var model: WebGorunumModeli

    init(model: WebGorunumModeli) {
        self.model = model
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
            return
        }
        model.hataOlustu()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
            return
        }
        model.hataOlustu()
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if let httpResponse = navigationResponse.response as? HTTPURLResponse, httpResponse.statusCode >= 500 {
            decisionHandler(.cancel)
            model.hataOlustu()
            return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        model.basariliOldu()
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        model.webProcessOldu()
    }
}

struct WebView: UIViewRepresentable {
    @ObservedObject var model: WebGorunumModeli

    func makeCoordinator() -> WebViewKoordinator {
        WebViewKoordinator(model: model)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        model.webViewBagla(webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // Yeniden yükleme veya dinamik güncellemeler gerekirse burada ele alınır
    }
}
