@echo off
cd /d "%~dp0"
node mdk-doktor.mjs
node mdk-panel.mjs start . 4747
start http://127.0.0.1:4747
