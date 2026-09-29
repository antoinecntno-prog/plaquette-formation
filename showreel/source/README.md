# Source du showreel

Animation de 15 s en 1920 × 1080 à 60 images par seconde, dessinée en Canvas 2D et rendue image par image dans Chromium. Polices, portrait et boucle vidéo viennent de `site/`.

- `reel.js` : les six scènes, la composition, le flou de bouger, le bloom, le grain et la liste des évènements sonores.
- `render.cjs` : rendu des images (`frames`), d'images isolées pour contrôle (`stills 1.5,9.8`) et export des évènements sonores (`events`).
- `son.py` : bande son synthétisée à partir de `evenements.json`, calée sur les mêmes instants que l'image.

## Refaire la vidéo

Prérequis : Node avec Playwright, Python avec `numpy`, `scipy` et `imageio-ffmpeg`.

```sh
cd showreel/source
FF=$(python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())")
mkdir -p boucle && $FF -i ../../site/images/boucle.mp4 -q:v 2 boucle/f%03d.jpg
node render.cjs frames 0 900
node render.cjs events && python3 son.py
$FF -framerate 60 -i frames/%05d.png -i son.wav -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest ../showreel.mp4
```

La variable `CHROMIUM` indique un exécutable Chromium précis si Playwright ne trouve pas le sien.
