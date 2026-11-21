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

struct AdresFormuGorunumu: View {
    @State private var girdi: String
    @State private var hataMesaji: String?
    let onBaglan: (URL) -> Void

    init(baslangicAdresi: String = "", onBaglan: @escaping (URL) -> Void) {
        _girdi = State(initialValue: baslangicAdresi)
        self.onBaglan = onBaglan
    }

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(spacing: 8) {
                Text("İlk açılış")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                Text("Panel adresi")
                    .font(.title2)
                    .fontWeight(.bold)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 12) {
                TextField("mac.tail….ts.net", text: $girdi)
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true)
                    .keyboardType(.URL)

                if let hata = hataMesaji {
                    Text(hata)
                        .font(.footnote)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                }

                Button(action: baglanDene) {
                    Text("Bağlan")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
            }
            .padding(.horizontal, 36)
            .padding(.top, 8)

            Spacer()
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
    }

    private func baglanDene() {
        if let url = PanelAdresi.cozumle(girdi) {
            hataMesaji = nil
            UserDefaults.standard.set(url.absoluteString, forKey: "panelAdresi")
            onBaglan(url)
        } else {
            hataMesaji = "Geçersiz adres. Lütfen geçerli bir panel adresi girin."
        }
    }
}

struct ContentView: View {
    @StateObject private var model: WebGorunumModeli

    init(url: URL? = PanelAdresi.aktifURL()) {
        _model = StateObject(wrappedValue: WebGorunumModeli(url: url))
    }

    var body: some View {
        ZStack {
            WebView(model: model)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .ignoresSafeArea()

            if model.hataVar && !model.formAcik {
                HataGorunumu(
                    yenidenDene: {
                        model.yenidenDene()
                    },
                    adresiDegistir: {
                        model.adresiDegistirFormunuAc()
                    }
                )
                .ignoresSafeArea()
            }

            if model.formAcik {
                AdresFormuGorunumu(
                    baslangicAdresi: model.url?.absoluteString ?? "",
                    onBaglan: { url in
                        model.baglan(yeniURL: url)
                    }
                )
                .ignoresSafeArea()
            }
        }
    }
}
