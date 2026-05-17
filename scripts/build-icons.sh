#!/usr/bin/env bash
# Resize the source icon (1024x1024) into 16/48/128 PNGs used by the extension.
# Usage: scripts/build-icons.sh path/to/icon-source.png
set -euo pipefail

SOURCE="${1:-icons/icon-source.png}"
if [[ ! -f "$SOURCE" ]]; then
  echo "Source icon not found: $SOURCE" >&2
  echo "Place a 1024x1024 PNG at $SOURCE or pass a path as the first argument." >&2
  exit 1
fi

for SIZE in 16 48 128; do
  OUT="icons/icon${SIZE}.png"
  sips -s format png -Z "$SIZE" "$SOURCE" --out "$OUT" >/dev/null
  echo "wrote $OUT"
done

echo "done. reload the extension in chrome://extensions to see the new icon."
