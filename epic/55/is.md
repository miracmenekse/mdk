# Epic 55 — Depo / kod haritası desteği

## Amaç
Adım geliştirirken modellerin dosya aramakla token harcamasını önlemek için projenin sembol ve bağımlılık haritasının (repo map) çıkarılması ve bağlama eklenmesi.

## Kapsam
1. `mdk-ortak.mjs`: Sıfır bağımlılıklı yerel `depoHaritasi({ kok, sorgu, adimBlok, butce })` işlevi (kaynak dosyalardaki `export` sembollerini satır numaralarıyla ve yerel `import` bağımlılıklarını çıkarıp adıma göre önceliklendirir).
2. `mdk-adim.mjs`: `MDK_HARITA=1`, `- Harita: evet` ya da `Harita: evet` ile depo haritasının istem bağlamına eklenmesi.
