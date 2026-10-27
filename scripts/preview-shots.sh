#!/usr/bin/env bash
#
# Regenerates the listing previews in docs/preview/ at 1440x810 (16:9), the
# aspect ratio theme directories ask for.
#
# Shoots the built site rather than the dev server: dev builds images on demand,
# and a capture can outrun that and record a broken logo.
#
#   npm run build && npm run preview:shots
#
set -euo pipefail

PORT="${PORT:-4399}"
BASE="http://127.0.0.1:${PORT}"
OUT="docs/preview"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

if [ ! -x "$CHROME" ]; then
  echo "Chrome not found at: $CHROME" >&2
  echo "Set CHROME=/path/to/chrome and try again." >&2
  exit 1
fi

if [ ! -d dist ]; then
  echo "No dist/ — run 'npm run build' first." >&2
  exit 1
fi

# `astro preview` runs as a daemon and will quietly pick a different port if the
# one asked for is taken. Shooting the port we *asked* for photographed whatever
# else was listening on it — ten screenshots of someone else's 404 page, and the
# script still printed "Done". So the port is read back from the server itself.
LOG=/tmp/astro-preview-shots.log
: > "$LOG"
npx astro preview --port "$PORT" --host 127.0.0.1 >"$LOG" 2>&1 &
trap 'npx astro preview stop >/dev/null 2>&1 || true' EXIT

BASE=""
for _ in $(seq 1 60); do
  BASE=$(grep -oE 'http://127\.0\.0\.1:[0-9]+' "$LOG" | head -1 || true)
  [ -n "$BASE" ] && break
  sleep 0.5
done

if [ -z "$BASE" ]; then
  echo "Preview server never reported a URL. See $LOG" >&2
  exit 1
fi
echo "Shooting $BASE"

for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "$BASE/"; then break; fi
  sleep 0.5
done

mkdir -p "$OUT"

while IFS=' ' read -r name path; do
  [ -z "$name" ] && continue

  # A page that does not answer 200 produces a screenshot of an error page,
  # which looks like a finished file and gets shipped to a listing. These
  # screenshots are the first thing a reviewer sees, so a bad one fails here.
  code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}${path}")
  if [ "$code" != "200" ]; then
    echo "  ${path} answered ${code} — not shooting it" >&2
    exit 1
  fi

  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --window-size=1440,810 \
    --virtual-time-budget=9000 \
    --screenshot="/tmp/preview-$name.png" "${BASE}${path}" >/dev/null 2>&1
  sips -s format jpeg -s formatOptions 82 \
    "/tmp/preview-$name.png" --out "$OUT/$name.jpg" >/dev/null
  echo "  $OUT/$name.jpg"
done <<'PAGES'
home /
about /about/
shop /shop/
product /products/handmade-clay-vase/
product-category /product-categories/ceramics/
gallery /photo-gallery/
gifts /gift-and-gift-card/
blog /blog/
blog-post /blog/what-actually-happens-to-clay-in-the-kiln/
contact /contact/
PAGES

echo "Done."
