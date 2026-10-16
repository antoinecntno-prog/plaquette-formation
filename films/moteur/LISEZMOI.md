# Rendre un film

Il faut Node 22 avec Playwright, Chromium, ffmpeg, et Python 3 avec numpy et Pillow.

1. **Aperçu image par image** : `node moteur/rendu.mjs fixes dirigeants/index.html sortie 1.6,12.65,21.3`
2. **Vidéo sans son** (4 sous-images fusionnées par image, 60 i/s) : `node moteur/rendu.mjs video dirigeants/index.html dirigeants/rendus/master_video.mp4 0 27`
3. **Bande son** (coupe de la musique, bruitages calés sur leur pic, -14 LUFS) : `python3 moteur/son.py dirigeants/son.json dirigeants/rendus/son.wav`
4. **Export** (master avec son, version LinkedIn, vignette) : `sh moteur/exporter.sh dirigeants 2026-10-15 1.45`
5. **Contrôles** : `python3 moteur/verif.py livrables/<master>.mp4 dirigeants/rendus/verif` et `node moteur/taille-texte.mjs dirigeants/index.html`

Toutes les commandes partent du dossier `films/`. Chaque style se calcule depuis le temps dans `seek(t)`, donc une image se rend seule, dans n'importe quel ordre.

## Médias à retélécharger

Les sons et le plan réel restent hors du dépôt : la licence Mixkit interdit de redistribuer les fichiers bruts, et la musique ElevenLabs n'a pas à être publiée. La fiche `2026-10-15_films-lancement_credits.md` donne leurs numéros.

- **Musique** : composition ElevenLabs du flux bD6YfgilrUWgBVUzoBYZ (variante f9Law0nb5Y9T5jgYSQXB), enregistrée sous `medias/sons/musique-elevenlabs-premium.mp3`. Elle reste hors du dépôt public avec les autres sons.
- **Bruitages** : chaque numéro de `dirigeants/son.json` va dans `medias/sons/bruitages/<numéro>.mp3`, depuis `https://assets.mixkit.co/active_storage/sfx/<numéro>/<numéro>-preview.mp3`.
- **Plan réel** : la version 4K du plan n° 1735, puis un encodage VP9 tout en images clés, car le Chromium de Playwright ne lit pas le H.264 :
  `ffmpeg -ss 2.0 -t 3.0 -i 1735-2160.mp4 -vf "crop=1728:2160:140:0,scale=1440:1800:flags=lanczos" -an -c:v libvpx-vp9 -g 1 -keyint_min 1 -crf 16 -b:v 0 -deadline good -cpu-used 2 -row-mt 1 -pix_fmt yuv420p medias/plans/reel_dirigeants_intra.webm`
