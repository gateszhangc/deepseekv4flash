#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
BRAND_DIR="$ROOT_DIR/assets/brand"
FONT_DIR="/Users/a1-6/.codex/skills/canvas-design/canvas-fonts"
DISPLAY_FONT="$FONT_DIR/Tektur-Medium.ttf"
BODY_FONT="$FONT_DIR/InstrumentSans-Regular.ttf"
BG="#051019"
LINE="#6ff9ec"
TEXT="#efffff"
MUTED="#8abeb9"

if [ ! -x "$(command -v magick)" ]; then
  echo "ImageMagick is required." >&2
  exit 1
fi

mkdir -p "$BRAND_DIR"

magick -size 512x512 xc:none \
  -fill none -stroke "$LINE" -strokewidth 18 \
  -draw "roundrectangle 74,74 438,438 88,88" \
  -stroke "#15303d" -strokewidth 8 \
  -draw "line 112,112 400,112" \
  -draw "line 112,400 400,400" \
  -draw "line 112,112 112,400" \
  -draw "line 400,112 400,400" \
  -stroke "$LINE" -strokewidth 22 \
  -draw "path 'M 176,148 L 308,148 242,250 338,250 194,364 244,274 168,274 z'" \
  "$BRAND_DIR/logo-mark.png"

magick -size 256x256 xc:"$BG" \
  -fill none -stroke "$LINE" -strokewidth 12 \
  -draw "roundrectangle 34,34 222,222 46,46" \
  -stroke "#163642" -strokewidth 4 \
  -draw "line 58,58 198,58" \
  -draw "line 58,198 198,198" \
  -stroke "$LINE" -strokewidth 16 \
  -draw "path 'M 86,70 L 152,70 120,122 170,122 98,186 122,136 84,136 z'" \
  "$BRAND_DIR/favicon.png"

magick "$BRAND_DIR/favicon.png" -resize 180x180 "$BRAND_DIR/apple-touch-icon.png"
magick "$BRAND_DIR/favicon.png" "$BRAND_DIR/favicon.ico"

magick -size 1400x400 xc:none \
  \( "$BRAND_DIR/logo-mark.png" -resize 224x224 \) -geometry +62+88 -composite \
  -font "$DISPLAY_FONT" -pointsize 110 -fill "$TEXT" -annotate +324+175 "FLASH VECTOR" \
  -font "$DISPLAY_FONT" -pointsize 54 -fill "$LINE" -annotate +328+260 "DEEPSEEK V4 FLASH GUIDE" \
  -font "$BODY_FONT" -pointsize 24 -fill "$MUTED" -annotate +330+326 "INDEPENDENT KEYWORD LANDING PAGE" \
  "$BRAND_DIR/logo-wordmark.png"

magick -size 1200x630 xc:"$BG" \
  -fill "#0a1f2e" -draw "rectangle 0,0 1200,630" \
  -stroke "#123749" -strokewidth 2 -fill none \
  -draw "line 74,88 1126,88" \
  -draw "line 74,542 1126,542" \
  -draw "line 92,78 92,552" \
  -draw "line 1108,78 1108,552" \
  \( "$BRAND_DIR/logo-mark.png" -resize 244x244 \) -geometry +118+186 -composite \
  -font "$DISPLAY_FONT" -pointsize 98 -fill "$TEXT" -annotate +414+272 "FLASH VECTOR" \
  -font "$DISPLAY_FONT" -pointsize 56 -fill "$LINE" -annotate +416+352 "DEEPSEEK V4 FLASH GUIDE" \
  -font "$BODY_FONT" -pointsize 26 -fill "$MUTED" -annotate +418+420 "Independent overview of the DeepSeek flash model lane" \
  "$BRAND_DIR/social-card.png"
