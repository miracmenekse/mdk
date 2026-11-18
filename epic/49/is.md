# Panel bilinen kusurları: Araştırma sekmesi details çakışması ve karar şeridi güncel adım sıralaması

1. Araştırma sekmesine geçilince URL parçası `#arastirma` olduğu için, `<details>` içinde yer alan `<section id="arastirma">` hedef alınarak tarayıcı tarafından eski notlar akordiyonu kendiliğinden açılıyor. İçteki bölüm `id="arastirma-eski"` (veya `ara-eski`) yapılarak bu çakışma giderilecek.
2. Karar şeridi (`kararSeridiHtml`), bekleyenler arasından en küçük numarayı seçtiği için eski pasif adımlar (ör. Faz 16) şeridi kilitliyor ve yeni bekleyen adımlar görünmüyor. Şerit bekleyenler arasından en güncel (`no`'su en büyük) adımı gösterecek şekilde güncellenecek.
