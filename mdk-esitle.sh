#!/usr/bin/env bash
# Kullanım: bash ~/mdk/mdk-esitle.sh
# Mac ve Ubuntu VM'de OpenCode ayarlarını, Claude kurallarını, yerel proje planlarını ve zombi oturumları eşitler.
set -euo pipefail

mkdir -p ~/.config/opencode ~/.claude/skills/ba-pm-bakis

cat > ~/.config/opencode/AGENTS.md <<'EOF'
# OpenCode çalışma kuralları

Planı Claude yazar, sen yalnızca verilen adımı uygularsın.

- Görevde verilen adımı yap, başka adıma ya da kapsam dışı bir şeye dokunma.
- `PLAN.md`, `test/` ve `kapi/` altındaki dosyalar ve `*.test.*` dosyaları kapıdır: değiştirme ya da silme (yalnızca kapı üretme görevindeysen istenen kapı dosyasını yaz). Bunlara dokunulursa betik denemeyi kapıyı çalıştırmadan reddeder. Yeni dosya eklemek serbest.
- Adımdaki "Kapı" komutu bittiğinde çıkış kodu 0 vermeli. Bitirmeden YALNIZCA adımda verilen `- Kapı:` komutunu kendin çalıştırıp dene.
- ASLA `bash test/hepsi.sh` veya `bash test/mdk-adim.test.sh` çalıştırma; tam regresyon paketini çalıştırıcı (`mdk-adim.sh`) zaten kendisi koşar.
- Adım metninde dosya:satır aralığı verilmişse dosyayı baştan sona okuma; doğrudan o satır aralığını oku ve düzenle.
- Plan yanlış, eksik ya da bir kapı adımla çelişiyorsa tahmin yürütme: `SORUN.md` yaz ve dur. En fazla 10 satır: çelişen iki beklenti (dosya:satır ile) ve Claude'dan istenen karar. Bu metin sonraki denemeye aynen verilir, kısa tut.
- Küçük, okunur kod yaz; yeni bağımlılık ekleme. Node ya da yerleşik araçlar yetiyorsa onları kullan.
- `sudo`, `git push`, proje dışına yazma yok.
- Dil: yorumlar ve kullanıcıya dönük metinler Türkçe, kod adları İngilizce/Türkçe mevcut koda uysun.
EOF

cat > ~/.config/opencode/opencode.jsonc <<'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "edit": "allow",
    "bash": {
      "*": "allow",
      "sudo *": "deny",
      "git push*": "deny"
    },
    "shell": {
      "*": "allow",
      "sudo *": "deny",
      "git push*": "deny"
    },
    "external_directory": "deny"
  }
}
EOF

cat > ~/.claude/skills/ba-pm-bakis/SKILL.md <<'EOF'
---
name: ba-pm-bakis
description: YALNIZCA yeni bir Faz (büyük mimari/ekran kararı) başlarken Faz başına 1 kez ya da kullanıcı açıkça "persona çalıştır / alternatif üret / BA-PM bakışı / kroki çiz" dediğinde yükle. Kullanıcının doğrudan tarif ettiği işlerde ve Faz içi alt adımlarda YÜKLEME.
---

# BA/PM bakışı (Koşullu: Faz Başında 1 Kez veya Kullanıcı İsteğiyle)

**NE ZAMAN ÇALIŞIR / NE ZAMAN ATLANIR:**
- **ATLA (Doğrudan Kip — Varsayılan):** Kullanıcı ne istediğini doğrudan tarif ettiyse, mevcut bir ekrana/modüle özellik ekleniyorsa veya Faz içi alt adımlar yazılıyorsa persona turu, benchmark, hipotez tablosu ve `etki/*.html` krokisi **YAPMA**. Doğrudan `PLAN.md`'ye adımı yaz ve `mdk-adim.sh` başlat.
- **ÇALIŞTIR (Derin Kip):** Yalnızca (a) sıfırdan yeni bir Faz / büyük mimari veya ekran tasarımı başlarken **Faz başına 1 kez**, ya da (b) kullanıcı sohbette açıkça istediğinde / adıma `- Persona: sor`, `- Etki: etki/<ad>.html`, `- İncele: evet` bayrağı koyduğunda çalıştır.

## 1. Yeni Faz başında (kısa, 1-3 satır her biri; alt adımlarda tekrarlama)
- **Problem ve hipotez:** Kim hangi sorunu yaşıyor? Neyi doğru varsayıyoruz? Bu iş hangi varsayımı doğrular ya da çürütür?
- **İş değeri / başarı ölçütü:** Bittiğinde hangi iş sonucu değişmiş olacak, nasıl anlaşılır?
- **Akış ve kullanım kolaylığı:** Kullanıcı kaç adımda amacına varır? Hata ve boş durumda ne görür?
- **Riskler ve açık sorular.**

## 2. Kapılar ve Adım Boyutu (kalite + hız)
Her adımın kapısı çalıştırılabilir olsun (çıkış kodu 0).
- **Kapıları OpenCode Go Üretir (Claude Elle Yazmaz):**
  - Claude `PLAN.md`'ye yalnız adımın `Ne:` açıklamasını (hedef `dosya:satır-aralığı` ile) ve `- Kapı:` komutunu yazar; test dosyasını elle yazmaz.
  - `mdk-adim.sh <no>` çalıştığında test dosyası (`*.test.mjs`, `test/*.test.sh`, `kapi/*`) diskte yoksa önce `Görev kapi:` (`opencode-go/gemini-4-argon`) ile test dosyasını üretir, mevcut kodda KIRMIZI olduğunu doğrular ve hemen ardından `Görev kod:` modeliyle kodu yazdırır.
  - Küçük/mekanik adımlarda ayrı test dosyası açmak yerine tek satırlık `node -e "import assert from 'node:assert/strict'; ..."` kapısı veya mevcut test dosyası kullanılır.
- **Adım Boyutu ("Dikey Özellik Dilimi" Kuralı):**
  - İşleri aşırı küçük mikro-adımlara (1 satır, 20 satır) **BÖLME**; her adım ~90 sn açılış ve ~100k token sabit yük taşır.
  - **1 adım = 1 tam dikey dilim (1–3 dosya, ~60–250 satır değişiklik, 1 kapı).** Aynı dosyaya (`ciz.mjs`, `sunucu.mjs`) dokunan ardışık değişiklikleri tek adımda birleştir.
  - Bir işi yalnızca **(a)** farklı dosyalara dokunduğu için `mdk-paralel.sh` ile gerçekten paralel koşabilecekse veya **(b)** 250+ satırı aşıyorsa böl.
  - Adımın `Ne:` satırına Claude'un zaten bildiği hedef dosya ve satır aralığını (`panel/sunucu.mjs:190-245` gibi) mutlaka yaz ki model dosya aramakla istek harcamasın.
- **Yürütücü ve Eskale:**
  - Varsayılan yürütücü her zaman `opencode`'dur. `mdk-adim.sh` içinde `Görev kod:` modelleri geçemezse betik otomatik olarak `Görev eskale:` (`opencode-go/qwen3.8-max`) modelini dener; `kodcu`ya (Haiku) yalnız çıkış 2 dönerse gidilir.
  - Yalnız `mdk-adim.sh`'in süreç öldürme/reset çekirdeğine dokunan adımlar `kodcu`/Claude'undur; diğer tüm kod ve test adımları `opencode`'da koşar.

## 3. UI / akış kararında seçenek üret (Yalnız Faz başında veya `- Persona: sor` istendiğinde)
Karar büyük bir Faz kararıysa veya kullanıcı "personalara sor / alternatif üret" dediyse:
1. `personalar.md`'den (yoksa `~/mdk/personalar.md`) iş türüne göre alan seç: `proje-gelistirme`, `sunum`, `arastirma`; uymuyorsa aynı kart biçiminde yeni alan taslağı yaz. Alandan 3 kart seç, en az biri karşı çıkan (seçim kuralı dosyada). Dosyayı değiştirince `node persona-denetle.mjs` (mdk kökünde) ile biçimi denetle.
2. Personaları Claude alt ajanında DEĞİL, OpenCode'da PLAN'daki `Görev persona:` modeliyle (OpenCode Go; varsayılan gpt-6-luna), her kart ayrı oturumda çalıştır: soruyu bir dosyaya yaz, sonra `~/mdk/persona-tur.sh <alan> <soru-dosyası> "<kart 1>" "<kart 2>" "<kart 3>"` ya da adımın altına `- Persona: sor` ekleyerek `mdk-adim.sh`'in otomatik koşturmasını sağla.
3. Kartın sayısal ya da evet/hayır hükmüne güvenme; kendin sına.
4. Benchmark: yalnızca sıfırdan yeni bir Faz tasarımında benzer 3 ürünü web aramasıyla bul, kaynak ver; bulunamazsa "doğrulanamadı" yaz.
5. Tek tablo: **Seçenek | Adım sayısı | Kullanıcıya değer | Uygulama maliyeti (token) | Risk | Kaynak/Persona**.
6. Kural: en az bir seçenek kullanıcının önerisinden **yaklaşım olarak** farklı olsun. Öneri ver ve nedenini tek cümleyle söyle.
7. Kararı `personalar.md` "Karar günlüğü"ne satır olarak yaz; alan ilk kez kullanıldıysa `Durum: denendi` yap.

## 4. Etki taslağı (Yalnız yeni ekran Fazında veya kullanıcı `- Etki:` istediğinde)
Küçük UI değişikliklerinde kroki çizme. Yalnızca yeni bir ekran/düzen Fazında veya kullanıcı istediğinde gri tonlu "önce/sonra" kroki hazırla (`etki/<özellik>.html`). Adıma `- Etki: etki/<özellik>.html` ve `- Değer: 1-5` ekle; karar panelin Etki kartından gelir (`etki/kararlar.jsonl`); taslağı yazınca `node ~/mdk/karar-bekle.mjs <proje>`'yi Monitor ile izle.

## 5. Kullanıcıya sorma
En fazla 3 soru, her birinin önerilen varsayılanı olsun. Yanıt gelmezse varsayılanla ilerle. Karar kullanıcıya ait değilse sorma.

## 6. Teslimde
Raporu "ne yapıldı" yerine "hipotez ve iş değeri açısından ne değişti, neyi doğruladı/çürüttü" diye yaz.
EOF

# ~/.claude/CLAUDE.md içindeki "## Görev dağıtımı (modeller)" bölümünü güncelle (makineye özgü üst kısmı koru)
if [ -f ~/.claude/CLAUDE.md ]; then
  node -e '
    const fs = require("fs");
    const p = process.env.HOME + "/.claude/CLAUDE.md";
    const s = fs.readFileSync(p, "utf8");
    const idx = s.indexOf("## Görev dağıtımı");
    const ust = idx >= 0 ? s.slice(0, idx).trimEnd() : s.trimEnd();
    const yeni = `## Görev dağıtımı (modeller)

- Plan modunda yapılan planı onaylanınca proje kökünde PLAN.md'\''ye yaz: işleri aşırı küçük mikro-adımlara BÖLME; 1 tam dikey özellik dilimi = 1 adım (1–3 dosya, ~60–250 satır değişiklik, 1 kapı). Yalnızca farklı dosyalarda paralel (\`mdk-paralel.sh\`) koşabilecek işleri veya 250+ satırı aşan işleri böl. Her adımda değiştirilecek dosya ve satır aralığını (\`dosya:bas-bit\`) \`Ne:\` içine yaz.
- Varsayılan yürütücü her zaman \`Yürütücü: opencode\`'\''dur (UI, sunucu, betik dahil). Adımlara peşinen \`Yürütücü: kodcu\` yazma.
  - \`opencode\`: kodu ve kapı test dosyasını kendin elle yazma, \`kodcu\`ya da verme. PLAN.md'\''ye yalnızca adımın \`Ne:\` tanımını ve \`- Kapı:\` komutunu yaz, commit et ve proje kökünde \`~/mdk/mdk-adim.sh <no>\` çalıştır:
    - Kapı test dosyası (\`*.test.mjs\` / \`test/*.test.sh\` / \`kapi/*\`) diskte yoksa \`mdk-adim.sh\` önce \`Görev kapi:\` (\`opencode-go/gemini-4-argon\`) ile testi yazdırıp kırmızı doğrular, ardından \`Görev <tür>:\` modelleriyle kodu yazdırır. Küçük işlerde ayrı dosya yerine tek satırlık \`node -e "... assert ..."\` kapısı yaz.
    - \`Görev kod:\` modelleri geçemezse \`mdk-adim.sh\` otomatik olarak önce \`Görev eskale:\` (\`opencode-go/qwen3.8-max\`) modelini dener; \`kodcu\`ya (Haiku) YALNIZCA \`mdk-adim.sh\` çıkış 2 (tüm Go + eskale modelleri tükendi) verdiğinde devret.
    - Bağımsız (farklı dosyalara dokunan) adımları paralel koştur: \`~/mdk/mdk-paralel.sh <no> <no>...\`.
    - Her adımdan sonra tek tek \`mdk-incele.sh\` ÇALIŞTIRMA; yalnız adımda \`- İncele: evet\` varsa ya da bir Faz bittiğinde son adımda \`~/mdk/mdk-incele.sh <no>\` çalıştır; diff'\''i yalnız uyum < 80 ise kendin oku.
  - **Yalın Kip vs. BA/PM & Persona Kipi:**
    - Kullanıcı işi doğrudan tarif ettiğinde veya Faz içi alt adımlarda persona turu (\`persona-tur.sh\`), benchmark araması ve etki krokisi (\`etki/*.html\`) ÇALIŞTIRMA; doğrudan PLAN.md'\''ye yazıp \`mdk-adim.sh\` başlat.
    - BA/PM bakışı, persona turu ve etki krokisi YALNIZCA: (1) sıfırdan yeni bir Faz / büyük mimari-ekran kararı başlarken Faz başına 1 kez, YA DA (2) kullanıcı açıkça istediğinde / adıma \`- Persona: sor\`, \`- Etki: etki/<ad>.html\`, \`- İncele: evet\` bayrağı eklendiğinde çalışır.
- Ekran/arayüz tasarımı sıfırdan istenirse \`tasarimci\` alt ajanına ver (tasarim.md'\''ye yazar), kodlamasını yine \`opencode\` yapar.
- Genel sohbet ve soru-cevap için alt ajan kullanma.
`;
    fs.writeFileSync(p, ust + "\n\n" + yeni);
  '
fi

# Yerel projelerdeki (dbeaver-mm, adimadim, demo-akis) PLAN.md model sırasını güncelle (glm-5.3-flash -> deepseek -> glm-5.3)
for pf in ~/projects/dbeaver-mm/PLAN.md ~/adimadim/PLAN.md ~/demo-akis/PLAN.md; do
  [ -f "$pf" ] || continue
  sed -i -E 's/^Modeller: opencode-go\/glm-5\.3-flash, opencode-go\/glm-5\.3, opencode-go\/deepseek-v4\.1-flash$/Modeller: opencode-go\/glm-5.3-flash, opencode-go\/deepseek-v4.1-flash, opencode-go\/glm-5.3/' "$pf"
  sed -i -E 's/^Görev kod: opencode-go\/glm-5\.3-flash, opencode-go\/glm-5\.3, opencode-go\/deepseek-v4\.1-flash$/Görev kod: opencode-go\/glm-5.3-flash, opencode-go\/deepseek-v4.1-flash, opencode-go\/glm-5.3/' "$pf"
done

# opencode.db içinde yarım kalmış (son mesajı idle olmayan) zombi oturumları interrupt et
OC=${MDK_OPENCODE:-$HOME/.local/opt/opencode-v2/node_modules/.bin/opencode}
if [ -x "$OC" ]; then
  sids=$(node -e 'try{const db=new(require("node:sqlite").DatabaseSync)(process.env.OPENCODE_DB||require("os").homedir()+"/.local/share/opencode/opencode.db",{readOnly:true});const q=db.prepare("select s.id,(select type from session_message m where m.session_id=s.id order by seq desc limit 1) ty from session_v2 s where (s.title like \"adim-%\" or s.title like \"kapi-%\" or s.title like \"persona-%\") and s.time_idle is null");for(const r of q.all())if(r.id&&/^ses_/.test(r.id)&&r.ty&&r.ty!=="idle")console.log(r.id)}catch{}' 2>/dev/null || true)
  for sid in $sids; do "$OC" api POST "/api/session/$sid/interrupt" >/dev/null 2>&1 || true; done
fi

echo "mdk-esitle tamam: AGENTS.md, opencode.jsonc, CLAUDE.md, SKILL.md ve yerel PLAN.md dosyaları güncellendi."
