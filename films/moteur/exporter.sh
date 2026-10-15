#!/bin/sh
# Exporte un film rendu : master 1440 x 1800 60 i/s avec son, version LinkedIn 1080 x 1350 30 i/s, vignette.
# Usage : sh exporter.sh <film> <date> <temps_vignette>     exemple : sh exporter.sh dirigeants 2026-10-15 1.45
set -e
FILM=$1; DATE=$2; TV=$3
ICI=$(cd "$(dirname "$0")/.." && pwd)
R=$ICI/$FILM/rendus
L=$ICI/livrables
mkdir -p "$L"
BASE="$L/${DATE}_film-${FILM}"
ffmpeg -v error -y -i "$R/master_video.mp4" -i "$R/son.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 \
  -movflags +faststart -shortest "${BASE}_master-1440x1800-60ips.mp4"
ffmpeg -v error -y -i "${BASE}_master-1440x1800-60ips.mp4" -vf "scale=1080:1350:flags=lanczos,fps=30" \
  -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 17 -maxrate 14M -bufsize 28M -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "${BASE}_linkedin-1080x1350-30ips.mp4"
ffmpeg -v error -y -ss "$TV" -i "${BASE}_master-1440x1800-60ips.mp4" -frames:v 1 -vf "scale=1080:1350:flags=lanczos" -q:v 2 \
  "${BASE}_vignette-1080x1350.jpg"
ls -la "$L" | grep "$FILM"
