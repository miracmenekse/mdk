// Kapı: YenilemeKarari.swift birim testi (swiftc). Yalnız macOS.
import { swiftTest, yalnizMac } from './ios-ortak.mjs';
yalnizMac();
swiftTest('ios/MDK/YenilemeKarari.swift', 'test/ios-yenile.test.swift');
