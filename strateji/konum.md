# mdk konumu (taslak — karar kullanıcının)

Tarih: 2026-11-15. Dayanak: `rakipler.md`. Bu sayfa karar değil, karara hazırlık.

## Amaç (kullanıcı tanımı)
Teknik olmayan insanlar için; bilişsel yükü ekranlarla azaltan, düşük maliyetli geliştirme ürünü. İşi uzmanına (doğru modele/araca) verir.

## İki bacak
1. **mdk kendini geliştirir** (bu depo).
2. **mdk ile proje geliştirilir** (easyFUT, dbeaver-mm) → maliyet ve süre kanıtı buradan çıkar.

## Pazardaki ihtiyaç adayları (hangisine cevap olacağı seçilecek)
| # | İhtiyaç | Kanıt | mdk'de karşılığı | Eksik |
|---|---|---|---|---|
| A | Öngörülebilir, düşük maliyet | Lovable/Bolt/Replit kredi şikâyetleri | Ücretsiz modeller, abonelik kullanımı, bütçe, metrik | Abonelik seçme ekranı |
| B | "Ajan bozdu, düzeltirken para yaktı" | Replit döngü şikâyeti | Kapı + regresyon + eskale | Teknik olmayana kapıyı anlatan dil |
| C | Ne olduğunu anlamak (kara kutu değil) | (doğrulanmadı) | Panel, etki krokisi, Epic/Story | Gerçek kullanıcı denemesi |
| D | Kurulumsuz başlamak | Rakiplerin tek tık açılması | **Yok** — terminal, Claude Code, OpenCode gerekiyor | En büyük açık |

## Hedef kitle seçenekleri
1. **Teknik olmayan kurucu / öğrenci** — en büyük kitle, ama D açığı kapanmadan ulaşılamaz; rakip Lovable.
2. **Yarı teknik, bütçesi dar kişi** (öğrenci, serbest çalışan; terminal açabilir ama kod yazmaz) — bugünkü ürüne en yakın; rakip dyad, spec-kit.
3. **Küçük ekipte iş tarafı yöneticisi** (geliştiriciyle çalışır, işi panelden izler/onaylar) — panel ve onay akışı tam buna göre.

Öneri: 2 ile başla, 1'e doğru git. Gerekçe: bugünkü kurulumla ulaşılabilen tek kitle 2; D açığı kapandıkça 1'e açılır.

## Ticarileşme kapısı
Şu ikisi geçmeden fiyat/lisans konuşulmaz: (a) terminalsiz kurulum, (b) üç gerçek kişinin baştan sona bir iş bitirmesi.

## Açık sorular
- Claude Code zorunlu mu kalacak, yoksa planlayan da değiştirilebilir mi (Gemini, Copilot)?
- Dil: Türkçe mi kalacak? Türkçe arayüz yerel pazarda fark, küresel pazarda engel.
- Lisans: açık kaynak mı, kapalı mı?
