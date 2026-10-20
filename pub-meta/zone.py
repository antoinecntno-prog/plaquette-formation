"""Contrôle de zone utile : signale tout pixel marqué hors de la zone utile Meta.
Usage: python3 -I zone.py dossier_images
"""
import sys, os
from PIL import Image
import numpy as np
TOP, BOTTOM, LEFT, RIGHT = 270, 1920 - 670, 110, 1080 - 110
bad = 0
for name in sorted(os.listdir(sys.argv[1])):
    if not name.endswith(('.jpg', '.png')):
        continue
    im = np.asarray(Image.open(os.path.join(sys.argv[1], name)).convert('RGB')).astype(int)
    h, w, _ = im.shape
    # couleur de fond = couleur la plus fréquente sur les bords
    border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
    vals, counts = np.unique(border, axis=0, return_counts=True)
    order = counts.argsort()[::-1]
    bgs = [vals[order[0]]]
    if len(order) > 1 and counts[order[1]] > 0.1 * counts.sum():
        bgs.append(vals[order[1]])  # image de bascule : deux aplats
    mask = np.ones(im.shape[:2], dtype=bool)
    for bg in bgs:
        mask &= np.abs(im - bg).max(axis=2) > 80  # ignore les icônes à faible opacité (décor)
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        print(f'{name}: vide'); continue
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    out = []
    if y0 < TOP: out.append(f'haut {y0}')
    if y1 > BOTTOM: out.append(f'bas {y1}')
    if x0 < LEFT: out.append(f'gauche {x0}')
    if x1 > RIGHT: out.append(f'droite {x1}')
    if out:
        bad += 1
        print(f'{name}: HORS ZONE ({", ".join(out)}) bbox x{x0}-{x1} y{y0}-{y1}')
    else:
        print(f'{name}: ok bbox x{x0}-{x1} y{y0}-{y1}')
print('images hors zone :', bad)
