import SwiftUI
import WebKit
import Combine

@MainActor
final class WebGorunumModeli: ObservableObject {
    @Published var url: URL?
    @Published var hataVar: Bool = false
    @Published var formAcik: Bool = false

    private var zamanlayici: Timer?
    weak var webView: WKWebView?

    init(url: URL? = PanelAdresi.aktifURL()) {
        self.url = url
        if url == nil {
            self.formAcik = true
        }
    }

    func webViewBagla(_ webView: WKWebView) {
        self.webView = webView
        if url != nil {
            yukle()
        }
    }

    func yukle() {
        guard let url = url, let webView = webView else { return }
        let istek = URLRequest(url: url, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 10.0)
        webView.load(istek)
    }

    func hataOlustu() {
        guard !formAcik else { return }
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

    func yenile() {
        guard !formAcik else { return }
        yukle()
    }

    func adresiDegistirFormunuAc() {
        zamanlayiciyiDurdur()
        hataVar = false
        formAcik = true
    }

    func baglan(yeniURL: URL) {
        self.url = yeniURL
        self.formAcik = false
        self.hataVar = false
        yukle()
    }

    func webProcessOldu() {
        webView?.reload()
    }

    private func zamanlayiciyiBaslat() {
        guard zamanlayici == nil else { return }
        zamanlayici = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self = self, self.hataVar, !self.formAcik else { return }
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

final class WebViewKoordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
    var model: WebGorunumModeli

    init(model: WebGorunumModeli) {
        self.model = model
    }

    private func enUstGorunumDenetleyicisi() -> UIViewController? {
        let sahneler = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let pencere = sahneler.flatMap(\.windows).first(where: \.isKeyWindow)
        var vc = pencere?.rootViewController
        while let sunulan = vc?.presentedViewController {
            vc = sunulan
        }
        return vc
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        guard let vc = enUstGorunumDenetleyicisi() else {
            completionHandler()
            return
        }
        let uyari = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        uyari.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in completionHandler() })
        vc.present(uyari, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        guard let vc = enUstGorunumDenetleyicisi() else {
            completionHandler(false)
            return
        }
        let uyari = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        uyari.addAction(UIAlertAction(title: "Vazgeç", style: .cancel) { _ in completionHandler(false) })
        uyari.addAction(UIAlertAction(title: "Evet", style: .destructive) { _ in completionHandler(true) })
        vc.present(uyari, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        guard let vc = enUstGorunumDenetleyicisi() else {
            completionHandler(nil)
            return
        }
        let uyari = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        uyari.addTextField { $0.text = defaultText }
        uyari.addAction(UIAlertAction(title: "Vazgeç", style: .cancel) { _ in completionHandler(nil) })
        uyari.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in completionHandler(uyari.textFields?.first?.text) })
        vc.present(uyari, animated: true)
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
        webView.uiDelegate = context.coordinator
        model.webViewBagla(webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // Dinamik güncellemeler model üzerinden yürütülür
    }
}
