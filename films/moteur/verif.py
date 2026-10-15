# Contrôles d'acceptation d'un film exporté.
# Usage : python3 -I verif.py <master.mp4> <dossier_sortie> [secondes_accroche]
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

src, sortie = sys.argv[1], sys.argv[2]
t_accroche = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0
os.makedirs(sortie, exist_ok=True)
W, H, IPS = 1440, 1800, 60
POLICE = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf", 40)

def image(t):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.4f}", "-i", src, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return Image.frombytes("RGB", (W, H), raw)

rapport = {}
# 1. Une image par temps, avec les marges de sécurité de LinkedIn en surimpression.
vignettes = []
for n in range(1, 55):
    t = (n - 1) * 0.5 + 0.25
    im = image(t).convert("RGBA")
    voile = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(voile)
    for r in [(0, 0, W, 150), (0, H - 150, W, H), (0, 0, 100, H), (W - 100, 0, W, H)]:
        d.rectangle(r, fill=(220, 30, 30, 70))
    d.rectangle((100, 150, W - 100, H - 150), outline=(220, 30, 30, 255), width=4)
    im = Image.alpha_composite(im, voile).convert("RGB")
    ImageDraw.Draw(im).text((116, 160), f"temps {n}  {t:.2f} s", fill=(220, 30, 30), font=POLICE)
    vignettes.append(im.resize((288, 360)))
for k in range(3):
    planche = Image.new("RGB", (288 * 6, 360 * 3), "white")
    for i, v in enumerate(vignettes[k * 18:(k + 1) * 18]):
        planche.paste(v, ((i % 6) * 288, (i // 6) * 360))
    planche.save(os.path.join(sortie, f"temps_marges_{k + 1}.jpg"), quality=85)

# 2. Sauts d'une image : différence d'image plus de 3 fois celle des voisines.
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", "scale=360:450,format=gray", "-f", "rawvideo", "-"],
                     capture_output=True, check=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, 450, 360).astype(np.float32)
dif = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
sauts = []
for i, v in enumerate(dif):
    vois = np.r_[dif[max(0, i - 3):i], dif[i + 1:i + 4]]
    m = float(np.median(vois)) if len(vois) else 0.0
    if v > 3 * m and v > 1.5:
        sauts.append({"image": i + 1, "t": round((i + 1) / IPS, 3), "diff": round(float(v), 2), "voisines": round(m, 2)})
rapport["images"] = int(f.shape[0])
rapport["sauts"] = sauts

# 3. Dernière image et première image.
a = f[0].astype(np.float32); b = f[-1].astype(np.float32)
pleine0 = np.asarray(image(0.0), np.float32); pleine1 = np.asarray(image((f.shape[0] - 1) / IPS), np.float32)
rapport["premiere_derniere"] = {"ecart_moyen": round(float(np.abs(pleine0 - pleine1).mean()), 3), "ecart_max": float(np.abs(pleine0 - pleine1).max())}

# 4. Accroche à 2,0 s.
image(t_accroche).save(os.path.join(sortie, "accroche_2s.jpg"), quality=90)

# 5. Loudness intégrée.
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", src, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
if "I:" in r:
    rapport["lufs"] = float(r[r.rindex("I:"):].split()[1])
    rapport["crete_dbfs"] = float(r[r.rindex("Peak:"):].split()[1])
json.dump(rapport, open(os.path.join(sortie, "rapport.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps(rapport, ensure_ascii=False, indent=1))
