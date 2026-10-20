#!/bin/bash
# planche de contrôle : une image par seconde, zone utile Meta tracée en filet blanc
set -e
IN="$1"; OUT="$2"
ffmpeg -loglevel error -y -i "$IN" -vf "fps=1,drawbox=x=110:y=270:w=860:h=980:color=white@0.45:t=3,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='%{pts\:hms}':x=20:y=20:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=10,scale=300:-1,tile=6x5:padding=6:margin=6:color=0x2A0C12" -frames:v 1 -q:v 3 "$OUT"
