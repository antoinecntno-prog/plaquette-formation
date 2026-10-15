# Rendre un film

Il faut Node 22 avec Playwright, Chromium, ffmpeg, et Python 3 avec numpy et Pillow.

1. **Aperçu image par image** : `node moteur/rendu.mjs fixes dirigeants/index.html sortie 1.6,12.65,21.3`
2. **Vidéo sans son** (4 sous-images fusionnées par image, 60 i/s) : `node moteur/rendu.mjs video dirigeants/index.html dirigeants/rendus/master_video.mp4 0 27`
3. **Bande son** (coupe de la musique, bruitages calés sur leur pic, -14 LUFS) : `python3 moteur/son.py dirigeants/son.json dirigeants/rendus/son.wav`
4. **Export** (master avec son, version LinkedIn, vignette) : `sh moteur/exporter.sh dirigeants 2026-10-15 1.45`
5. **Contrôles** : `python3 moteur/verif.py livrables/<master>.mp4 dirigeants/rendus/verif` et `node moteur/taille-texte.mjs dirigeants/index.html`

Toutes les commandes partent du dossier `films/`. Chaque style se calcule depuis le temps dans `seek(t)`, donc une image se rend seule, dans n'importe quel ordre.
