import Foundation

public enum PanelAdresi {
    public static func cozumle(_ girdi: String) -> URL? {
        let temiz = girdi.trimmingCharacters(in: .whitespacesAndNewlines)
        if temiz.isEmpty || temiz.contains(" ") { return nil }

        let ham: String
        if temiz.contains("://") {
            ham = temiz
        } else {
            ham = "https://" + temiz
        }

        guard var bilesenler = URLComponents(string: ham),
              let sema = bilesenler.scheme?.lowercased(),
              let host = bilesenler.host?.lowercased(),
              !host.isEmpty,
              sema == "http" || sema == "https" else {
            return nil
        }

        // Uzak düz http reddedilir (yalnız 127.0.0.1 veya localhost izinli)
        if sema == "http" {
            let yerelMi = host == "127.0.0.1" || host == "localhost"
            if !yerelMi {
                return nil
            }
        }

        bilesenler.scheme = sema
        bilesenler.host = host
        while bilesenler.path.hasSuffix("/") {
            bilesenler.path.removeLast()
        }
        return bilesenler.url
    }

    public static func aktifURL() -> URL? {
        let env = ProcessInfo.processInfo.environment
        if let envUrlStr = env["MDK_PANEL_URL"] ?? env["SIMCTL_CHILD_MDK_PANEL_URL"],
           let url = cozumle(envUrlStr) {
            return url
        }
        if let udStr = UserDefaults.standard.string(forKey: "panelAdresi"),
           let url = cozumle(udStr) {
            return url
        }
        return nil
    }
}
