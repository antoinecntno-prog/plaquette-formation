#!/bin/bash
# Effets de synthèse et musique remodelée. Usage : make_sound.sh <dossier pub> <m1.mp3>
# (click, pop, typing et stamp viennent d'ElevenLabs text-to-sound v2, déjà dans public/sfx)
set -e
P="$1"; M="$2"; X="$P/public/sfx"
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.6:c=pink:a=0.6" -f lavfi -i "aevalsrc='0.25*sin(2*PI*(7000*t+5000*t*t))*sin(PI*t/0.5)':d=0.6:s=44100" -filter_complex "[0]aresample=44100,highpass=f=6000,highpass=f=6000,lowpass=f=13000[n];[n][1]amix=inputs=2,afade=t=in:d=0.3:curve=exp,afade=t=out:st=0.35:d=0.25,volume=13.5dB" -ac 1 -ar 44100 "$X/swish.wav"
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.2*(sin(2*PI*9300*t)+sin(2*PI*9800*t)+sin(2*PI*10400*t))*exp(-t/0.35)':d=0.8:s=44100" -af "afade=t=in:d=0.01" "$X/shimmer.wav"
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.9*sin(2*PI*(35*t+145*0.35*(1-exp(-t/0.35))))*exp(-t/0.7)':d=1.8:s=44100" -af "afade=t=in:d=0.004" "$X/subdrop.wav"
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.8*sin(2*PI*(50*t+170*0.06*(1-exp(-t/0.06))))*exp(-t/0.12)+0.3*sin(2*PI*(392*t+400*0.03*(1-exp(-t/0.03))))*exp(-t/0.035)':d=0.4:s=44100" -af "afade=t=in:d=0.003" "$X/thump.wav"
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.35*(sin(2*PI*587.3*t)+0.8*sin(2*PI*987.8*t))*exp(-t/0.15)':d=0.6:s=44100" -af "afade=t=in:d=0.005" "$X/ding.wav"
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.3*(sin(2*PI*587.3*t)+0.45*sin(2*PI*1174.7*t))*exp(-t/0.06)+0.45*sin(2*PI*98*t)*exp(-t/0.07)':d=0.35:s=44100" -af "afade=t=in:d=0.002" "$X/pluck.wav"
# musique : ralentie à 0,92, la batterie tombe sur le disque (8,77 s), intro sans basse, deux arrêts, pause sans basse avant la forêt
ffmpeg -v error -y -i "$M" -af "atempo=0.92,atrim=start=0.48,asetpts=PTS-STARTPTS,afade=t=in:d=0.25,highpass=f=220:enable='lt(t,6.7)',volume='1-clip((t-5.23)/0.03,0,1)*clip((5.53-t)/0.03,0,1)':eval=frame,volume='1-clip((t-8.43)/0.04,0,1)*clip((8.77-t)/0.005,0,1)':eval=frame,highpass=f=280:enable='between(t,17.8,20.5)',bass=g=-6:f=100:enable='gt(t,21.6)',equalizer=f=1500:t=o:w=2:g=-4" -ar 44100 "$P/out/music_shaped.wav"
# musique égalisée en trois bandes, sans compression déclenchée par la voix (pas d'effet de pompage) :
# graves présents sous la voix, médiums en retrait pour laisser la place aux mots, aigus aérés
ffmpeg -v error -y -i "$P/out/music_shaped.wav" -filter_complex "[0:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit=3[a][b][c];[a]lowpass=f=200,lowpass=f=200,volume=5.6dB[lo];[b]highpass=f=200,highpass=f=200,lowpass=f=4000,lowpass=f=4000,volume=-8dB[mid];[c]highpass=f=4000,highpass=f=4000,volume=6dB[hi];[lo][mid][hi]amix=inputs=3:normalize=0" -t 33 "$P/public/music.wav"
