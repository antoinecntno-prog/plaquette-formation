# Forêt de conifères dans la brume, tons ocre, ciel clair (fond de la scène « résultat vérifié »)
import random, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
W, H = 1080, 1920
out = sys.argv[1]
rng = random.Random(7)
# ciel : brume claire, bandes de nuages ocre
y = np.linspace(0, 1, H)[:, None]
top = np.array([244, 230, 216.0]); mid = np.array([240, 214, 188.0])
sky = top * (1 - y) + mid * y
img = np.repeat(sky[:, None, :], W, axis=1).reshape(H, W, 3) if sky.ndim == 2 else None
img = np.tile(sky[:, None, :], (1, W, 1))
xs = np.linspace(0, 1, W)[None, :]
for cy, amp, col, a in [(520, 70, (226, 160, 98), 0.32), (690, 50, (214, 142, 80), 0.28), (360, 40, (232, 186, 140), 0.25)]:
    yy = np.arange(H)[:, None]
    wave = cy + 30 * np.sin(xs * 6.0 + cy) + 18 * np.sin(xs * 13.0)
    band = np.exp(-((yy - wave) / amp) ** 2) * a
    img = img * (1 - band[..., None]) + np.array(col)[None, None, :] * band[..., None]
# halo chaud en haut à droite
yy, xx = np.mgrid[0:H, 0:W]
g = np.exp(-(((xx - 860) / 520) ** 2 + ((yy - 420) / 420) ** 2)) * 0.45
img = img * (1 - g[..., None]) + np.array([222, 150, 80.0]) * g[..., None]
base = Image.fromarray(np.clip(img, 0, 255).astype('uint8'), 'RGB')

def tree(d, x, ybase, h, col):
    w = h * 0.36
    tiers = 7
    for k in range(tiers):
        f = k / tiers
        ty = ybase - h * f
        tw = w * (1 - f) * 1.05 + 4
        th = h * 0.26
        d.polygon([(x - tw / 2, ty), (x + tw / 2, ty), (x + rng.uniform(-3, 3), ty - th)], fill=col)
    d.rectangle([x - w * 0.04, ybase - 6, x + w * 0.04, ybase + h * 0.05], fill=col)

layers = [  # (ligne d'horizon, hauteur des arbres, couleur, brume)
    (1150, 130, (228, 184, 136), 0.0), (1250, 180, (218, 158, 98), 0.0), (1370, 240, (204, 136, 72), 0.0),
    (1530, 320, (186, 114, 54), 0.0), (1720, 400, (166, 96, 44), 0.0)]
for i, (yb, h, col, _) in enumerate(layers):
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    x = -40
    while x < W + 60:
        hh = h * rng.uniform(0.7, 1.15)
        tree(d, x, yb + rng.uniform(-25, 25), hh, col + (255,))
        x += h * rng.uniform(0.16, 0.3)
    d.rectangle([0, yb + 10, W, H], fill=col + (255,))
    lay = lay.filter(ImageFilter.GaussianBlur(max(0.6, 3.5 - i * 0.7)))
    base.paste(lay, (0, 0), lay)
    # brume entre les plans
    hz = np.zeros((H, W), dtype=float)
    hy = yb - h * 0.2
    hz += np.exp(-((np.arange(H)[:, None] - hy) / 140.0) ** 2) * (0.5 - i * 0.07)
    mist = Image.fromarray(np.clip(np.dstack([np.full((H, W), 246), np.full((H, W), 232), np.full((H, W), 214), hz * 255]), 0, 255).astype('uint8'), 'RGBA')
    base.paste(mist, (0, 0), mist)
base.save(out, quality=92)
print('ok', out)
