# Bağlam bütçesi

Kaynak: yapılacaklar 13 (opencode-orchestrator-kit, BMAD) + gözlem: adım 7 ~730 bin token harcadı.

## Problem ve hipotez
Model ne kadar dosya okuyacağına kendi karar veriyor; bazı story'ler ortalamanın 5-10 katı token yakıyor. Hipotez: rol başına okuma sınırı (dosya/satır) ve durumu dosyada tutmak harcamayı öngörülür kılar.

## Kapsam
Rol başına sınır (PLAN ya da ayar dosyası), isteme eklenmesi, aşımda uyarı ve metrik.

## Başarı ölçütü
Story başına token dağılımının üst ucu düşer; aşım metrikte görünür.
