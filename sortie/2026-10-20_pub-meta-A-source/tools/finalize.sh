#!/bin/bash
# Rendu final : version avec musique (livrable principal) et version sans musique.
# Son : limiteur léger sur quelques plosives, puis normalisation linéaire en deux passes à -14 LUFS (Meta), crête -1,5 dBTP.
set -e
S="$1"; OUTDIR="$2"
cd "$S/pub"
CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
R="npx remotion render src/index.ts Pub3 --browser-executable=$CHROME --chrome-mode=chrome-for-testing --concurrency=4 --log=error"
norm() {   # $1 = vidéo source (image), $2 = piste son source, $3 = fichier de sortie
  local PRE="alimiter=limit=0.42:attack=2:release=50:level=disabled"
  local J
  J=$(ffmpeg -hide_banner -i "$2" -vn -af "$PRE,loudnorm=I=-14:TP=-2.2:LRA=11:print_format=json" -f null - 2>&1 | python3 -c "import sys,json,re; t=sys.stdin.read(); d=json.loads(t[t.rindex('{'):t.rindex('}')+1]); print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
  set -- "$1" "$2" "$3" $J
  ffmpeg -loglevel error -y -i "$1" -i "$2" -map 0:v -map 1:a -c:v copy \
    -af "$PRE,loudnorm=I=-14:TP=-2.2:LRA=11:measured_I=$4:measured_TP=$5:measured_LRA=$6:measured_thresh=$7:offset=$8:linear=true" \
    -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "$3"
}
$R out/final_raw.mp4 --codec=h264 --audio-codec=aac --audio-bitrate=320k --crf=16 2>&1 | grep -v -E "memory|Memory|docker|Using the lower" || true
$R out/final_audio.wav --codec=wav 2>&1 | grep -v -E "memory|Memory|docker|Using the lower" || true
norm out/final_raw.mp4 out/final_audio.wav "$OUTDIR/2026-10-20_pub-meta-A-abonnements.mp4"
# variante sans musique : même image, piste son rendue sans la musique
cp src/v3/audio.json out/audio_keep.json
python3 - <<'PY'
import json; p='src/v3/audio.json'; d=json.load(open(p)); d['music']=''; json.dump(d, open(p,'w'))
PY
$R out/final_nomusic.wav --codec=wav 2>&1 | grep -v -E "memory|Memory|docker|Using the lower" || true
cp out/audio_keep.json src/v3/audio.json
norm out/final_raw.mp4 out/final_nomusic.wav "$OUTDIR/2026-10-20_pub-meta-A-abonnements-sans-musique.mp4"
"$S/tools/planche.sh" "$OUTDIR/2026-10-20_pub-meta-A-abonnements.mp4" "$OUTDIR/2026-10-20_pub-meta-A-planche.jpg"
for f in "$OUTDIR/2026-10-20_pub-meta-A-abonnements.mp4" "$OUTDIR/2026-10-20_pub-meta-A-abonnements-sans-musique.mp4"; do
  echo "== $f"
  ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate:format=duration -of default=nw=1 "$f"
  ffmpeg -loglevel info -i "$f" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E " I:|Peak:|LRA:" | tail -3
done
