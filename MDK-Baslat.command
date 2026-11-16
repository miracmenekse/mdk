#!/usr/bin/env bash
cd "$(dirname "$0")"
node mdk-doktor.mjs
node mdk-panel.mjs start . 4747
open http://127.0.0.1:4747
