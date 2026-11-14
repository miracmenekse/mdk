// Kapı: PanelAdresi.swift birim testi (swiftc). Yalnız macOS.
import { swiftTest, yalnizMac } from './ios-ortak.mjs';
yalnizMac();
swiftTest('ios/MDK/PanelAdresi.swift', 'test/ios-adres.test.swift');
