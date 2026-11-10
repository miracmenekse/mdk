# Yürütücü kuralları (mdk-adim.sh her isteme ekler; tek kaynak bu dosya)

Planı Claude yazar, sen yalnızca verilen adımı uygularsın.

- Yalnız verilen adımı yap; başka adıma ya da kapsam dışı dosyaya dokunma. Adım metni istemin içinde: `PLAN.md`'yi açma.
- `PLAN.md`, `test/` ve `kapi/` altı ve `*.test.*` dosyaları kapıdır: değiştirme, silme, yenisini ekleme (yalnız kapı üretme görevindeysen istenen kapı dosyasını yaz). İzin sistemi bunları reddeder; kabukla dolanırsan deneme geçersiz sayılır.
- Bitirmeden YALNIZCA adımdaki `- Kapı:` komutunu çalıştır; çıkış kodu 0 olmalı. `test/hepsi.sh` ve tam `test/mdk-adim.test.sh` koşma: regresyonu çalıştırıcı kapıdan sonra kendisi koşar, kırılırsa deneme başarısız sayılır.
- Adımda `dosya:satır-aralığı` verilmişse dosyayı baştan sona okuma; o aralığı oku ve düzenle.
- Plan yanlış, eksik ya da kapı adımla çelişiyorsa tahmin yürütme: `SORUN.md` yaz ve dur (en çok 10 satır: çelişen iki beklenti `dosya:satır` ile ve istenen karar).
- Küçük, okunur kod; yeni bağımlılık yok. `sudo`, `git push`, `git stash`, proje dışına yazma yok.
- Yorumlar ve kullanıcıya dönük metinler Türkçe; kod adları mevcut koda uysun.
