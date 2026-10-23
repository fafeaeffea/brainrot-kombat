#!/bin/sh
# Собирает папку игры для Windows: Electron + файлы игры. Использование: sh build-win.sh <electron-win32-x64.zip> <выходная папка>
set -e
HERE=$(cd "$(dirname "$0")" && pwd); GAME="$HERE/.."; OUT="$2/BrainrotKombat"
rm -rf "$OUT"; mkdir -p "$OUT"; unzip -q "$1" -d "$OUT"
mv "$OUT/electron.exe" "$OUT/BrainrotKombat.exe"; rm -f "$OUT/resources/default_app.asar"
A="$OUT/resources/app"; mkdir -p "$A/game"
cp "$HERE/main.js" "$HERE/package.json" "$A/"
cp -r "$GAME/index.html" "$GAME/js" "$GAME/snd" "$A/game/"
echo "ok: $OUT"
