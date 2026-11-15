# MDK iş akışı haritası

Görsel sürüm: https://claude.ai/artifact/H3w5aPNvXDs7kSqbNXHKsi

## Renk / rol anahtarı
- 🟦 **Planlayıcı YZ** (bugün Claude Code — Opus/Sonnet; alt ajanlar kodcu=Haiku, tasarimci)
- 🟩 **Yürütücü YZ** (OpenCode üzerinden ücretsiz/Go modeller; `Görev <tür>:` satırlarından)
- ⬜ **Deterministik** (Node betikleri, git, kabuk, test, HTTP sunucu, WebSocket, `gh api`)
- 🟨 **İnsan** (kullanıcı: istek, panelden onay, Figma'da Connect)

## Akış

```mermaid
flowchart TD
  U([🟨 Kullanıcı: iş isteği]) --> P1[🟦 Planlayıcı: işi anla, plan modu]
  P1 --> E1[⬜ mdk-epic.mjs ac → Epic no, PLAN.md commit]
  E1 --> Q{Tartışma istendi mi?}

  Q -- evet --> T1[⬜ mdk-epic.mjs tartis]
  T1 --> T2[🟩 epic-tartis.mjs: persona modelleri 3 tur<br/>Değerlendirme→Tartışma→Uzlaşı]
  T2 --> T3[🟦 Planlayıcı: çözümü sına, etki/ad.html krokisi]
  T3 --> K1[⬜ Panel 127.0.0.1:4747 + karar-bekle.mjs]
  K1 --> H1{🟨 Kullanıcı panelde karar}
  H1 -- figma --> F1[🟦 Planlayıcı + Talk to Figma MCP<br/>⬜ mdk-figma.mjs WebSocket aktarıcı]
  F1 --> K1
  H1 -- red/yorum --> T3
  H1 -- onay --> E2[⬜ mdk-epic.mjs karar onay]

  Q -- hayır, Yalın Kip --> S1
  E2 --> S1[🟦 Planlayıcı: story yaz<br/>Ne: dosya:satır, Kapı, Kabul → PLAN.md, commit]
  S1 --> E3[⬜ mdk-epic.mjs gelistir]
  E3 --> R0[⬜ mdk-adim.mjs N  /  mdk-paralel.mjs N M]

  subgraph Koşturucu [mdk-adim.mjs — deterministik orkestrasyon]
    R0 --> R1[⬜ ön koşullar: git temiz, Onay/Kabul onayı, Yürütücü=opencode]
    R1 --> R2[⬜ ön regresyon: test/hepsi.mjs HIZLI]
    R2 --> G{Kapı dosyası var mı?}
    G -- yok --> G1[🟩 Görev kapi: kapı testini yazdır]
    G1 --> G2[⬜ kırmızı + sözdizimi doğrula, commit]
    G2 --> C1
    G -- var --> C1[🟩 Görev kod: kodu yazdır<br/>istem = yurutucu-kurallar.md + Kurallar + adım]
    C1 --> C2[⬜ izle: kota/yanıt_yok/bütçe/süre, model kilidi]
    C2 --> C3[⬜ kurcalama tespiti → Kapı komutu → kapı sonrası regresyon]
    C3 -- kırmızı --> C4{deneme/model kaldı mı?}
    C4 -- evet --> C5[⬜ git reset, ipucu ekle] --> C1
    C4 -- hayır --> ES[🟩 Görev eskale: modelleri]
    ES -- yine kırmızı --> X2[⬜ çıkış 2]
    C3 -- yeşil --> OK[⬜ PLAN [x], git commit, metrikler.jsonl, durum.json]
    OK --> HK[🟩 Görev hakem: kabul ölçütleri geçti/geçmedi uyarısı]
    HK --> IN{İncele: evet / Faz sonu?}
    IN -- evet --> IN1[🟩 mdk-incele.mjs: Görev inceleme → UYUM 0-100]
  end

  X2 --> KD[🟦 kodcu alt ajanı Haiku elle yazar<br/>⬜ mdk-kayit.mjs ile kaydedilir]
  IN1 -- uyum < 80 --> RV[🟦 Planlayıcı diff'i okur]
  IN -- hayır --> PUSH
  IN1 -- ≥ 80 --> PUSH
  RV --> PUSH[⬜ tam test/hepsi.mjs → git push]
  KD --> PUSH
  PUSH --> PNL[⬜ Panel: durum, metrik, token, maliyet<br/>panel/claude.mjs Claude oturum dosyalarını okur]
```

### Yan akışlar
| Akış | Ne yapar | Tür |
|---|---|---|
| `mdk-esitle.mjs` | `esit/` kurallarını `~/.config/opencode` ve `~/.claude`'a kurar | ⬜ |
| `mdk-radar.mjs` | `gh api` ile rakip depo taraması | ⬜ + özet 🟩 |
| `persona-tur.mjs` / `persona-takim-tur.mjs` (`- Persona: sor`) | personalar paralel görüş verir | 🟩 |
| `persona-denetle.mjs`, `kapi-denetle.mjs` | kart / kapı biçim denetimi | ⬜ |
| `tasarimci` alt ajanı | sıfırdan ekran tasarımı → `tasarim.md` | 🟦 |
| `ba-pm-bakis` becerisi | yeni Faz başında BA/PM bakışı | 🟦 |

## YZ'nin dokunduğu yerler — özet
- **🟦 Planlayıcı (yalnız 6 nokta):** işi anlama, story yazma (`Ne/Kapı/Kabul`), tartışma sonrası çözüm sınama + etki krokisi, Figma kopyası, uyum<80 diff okuma, çıkış 2'de kodcu.
- **🟩 Yürütücü modeller (7 görev türü):** `kapi`, `kod`, `eskale`, `hakem`, `inceleme`, `persona`, `arastirma`/`mekanik`. Hepsi `mdk-ortak.mjs` `kos()` + `opencodeSec()` üzerinden OpenCode'a gider (Cursor için `cursor/` öneki zaten var → çoklu yürütücü için hazır kanca).
- **⬜ Geri kalan her şey deterministik:** Epic durum makinesi, kapı/regresyon, git kontrol noktası/geri alma, kota-kilit-bütçe, metrik, panel, karar izleme.

## Planlayıcının Claude'a bağlı olduğu noktalar (2. aşamanın girdisi)
1. Kurallar `~/.claude/CLAUDE.md` + `mdk/CLAUDE.md` + `~/.claude/skills/ba-pm-bakis` (esitle yalnız `~/.claude`'a yazar).
2. Karar izleme Claude'un `Monitor` aracıyla `karar-bekle.mjs` koşturarak yapılıyor.
3. `kodcu` / `tasarimci` Claude Code alt ajanları.
4. Figma işi Claude'un MCP bağlantısıyla (Talk to Figma).
5. `panel/claude.mjs` token/maliyeti yalnız Claude oturum dosyalarından okur; `mdk-kayit.mjs` yürütücü listesi `kodcu|claude|opencode`.
6. `mdk-adim.mjs` `calistir()` yalnız `opencode` ve `cursor/` dallarını bilir (Antigravity dalı yok).

