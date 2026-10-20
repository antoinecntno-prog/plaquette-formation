import json, subprocess, sys
S = sys.argv[1]
words = json.load(open(S + "/audio/words_raw.json"))["words"]
words = [w for w in words if w["type"] == "word"]
assert len(words) == 74, len(words)
src = S + "/audio/voix_v1.mp3"
dur = 22.700408
LEAD = 0.3
# pauses ajoutées après le mot d'indice i (fin de phrase ou de proposition)
PAUSES = {8: 0.35, 15: 0.45, 29: 0.6, 42: 0.2, 46: 0.45, 55: 0.45, 60: 0.2, 66: 0.5}
cuts = []  # (temps de coupe dans la source, durée de silence)
for i, p in PAUSES.items():
    mid = (words[i]["end"] + words[i + 1]["start"]) / 2
    cuts.append((mid, p))
cuts.sort()
# segments
parts = []
filt = []
inputs = []
prev = 0.0
k = 0
def sil(d):
    global k
    filt.append(f"anullsrc=r=44100:cl=mono:d={d:.3f}[s{k}]"); parts.append(f"[s{k}]"); k += 1
sil(LEAD)
for (c, p) in cuts:
    filt.append(f"[0:a]atrim=start={prev:.3f}:end={c:.3f},asetpts=PTS-STARTPTS[a{k}]"); parts.append(f"[a{k}]"); k += 1
    sil(p); prev = c
filt.append(f"[0:a]atrim=start={prev:.3f},asetpts=PTS-STARTPTS[a{k}]"); parts.append(f"[a{k}]"); k += 1
TAIL = 2.3
sil(TAIL)
n = len(parts)
fc = ";".join(filt) + ";" + "".join(parts) + f"concat=n={n}:v=0:a=1[out]"
out = S + "/pub/public/voix.wav"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-filter_complex", fc, "-map", "[out]", "-ar", "44100", "-ac", "1", out], check=True)
# décalage des mots
def shift(t):
    d = LEAD
    for (c, p) in cuts:
        if t > c: d += p
    return t + d
W = [{"t": w["text"], "s": round(shift(w["start"]), 3), "e": round(shift(w["end"]), 3)} for w in words]
voice_end = shift(dur)
total = voice_end + TAIL
json.dump({"words": W, "voiceEnd": round(voice_end, 3), "duration": round(total, 3)}, open(S + "/pub/src/timings.json", "w"), ensure_ascii=False, indent=0)
print("voiceEnd", round(voice_end, 2), "duration", round(total, 2))
for i in [0, 9, 16, 30, 47, 56, 67]:
    print("P", i, W[i]["t"], W[i]["s"])
