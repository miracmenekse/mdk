import SwiftUI

struct HataGorunumu: View {
    let yenidenDene: () -> Void
    let adresiDegistir: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "wifi.slash")
                .font(.system(size: 56))
                .foregroundColor(.secondary)

            VStack(spacing: 8) {
                Text("Mac'e ulaşılamıyor")
                    .font(.title2)
                    .fontWeight(.bold)
                    .multilineTextAlignment(.center)

                Text("Mac uyuyor ya da panel kapalı")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 12) {
                Button(action: yenidenDene) {
                    Text("Yeniden dene")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }

                Button(action: adresiDegistir) {
                    Text("Adresi değiştir")
                        .font(.subheadline)
                        .foregroundColor(.accentColor)
                        .padding(.vertical, 8)
                }
            }
            .padding(.horizontal, 36)
            .padding(.top, 12)

            Spacer()
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
    }
}

struct ContentView: View {
    @StateObject private var model: WebGorunumModeli

    init(url: URL) {
        _model = StateObject(wrappedValue: WebGorunumModeli(url: url))
    }

    var body: some View {
        ZStack {
            WebView(model: model)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .ignoresSafeArea()

            if model.hataVar {
                HataGorunumu(
                    yenidenDene: {
                        model.yenidenDene()
                    },
                    adresiDegistir: {
                        model.yeniAdresGirdisi = model.url.absoluteString
                        model.adresDegistirAcik = true
                    }
                )
                .ignoresSafeArea()
            }
        }
        .alert("Adresi değiştir", isPresented: $model.adresDegistirAcik) {
            TextField("Panel adresi", text: $model.yeniAdresGirdisi)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled(true)
            Button("Bağlan") {
                model.adresiDegistir(yeniGirdi: model.yeniAdresGirdisi)
            }
            Button("Vazgeç", role: .cancel) {}
        } message: {
            Text("Yeni panel adresini girin (ör. http://127.0.0.1:4747)")
        }
    }
}
