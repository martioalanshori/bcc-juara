#!/bin/sh
# Ekspor index.html ke presentation.pdf dengan Chrome headless (Windows Git Bash). Lihat README.md.
cd "$(dirname "$0")"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=5000 \
  --run-all-compositor-stages-before-draw \
  --print-to-pdf="$(cygpath -w "$PWD/presentation.pdf")" "file:///$(cygpath -m "$PWD/index.html")" 2>&1 | grep "written"
