# Pub Meta B « une journée »

Composition HyperFrames (HTML + GSAP) de la publicité verticale 1080 x 1920 à 30 i/s qui vend l'Accélérateur IA 30 jours. Structure et rythme repris de la vidéo de référence : un écran par idée, lignes de texte qui glissent une par une sur la voix, chiffres qui rebondissent, poussées latérales entre les écrans, écran fixe d'appel à l'action.

- `index.html` : les onze écrans, la timeline GSAP et les horodatages calés sur la voix.
- `assets/voix.mp3` : voix clonée ElevenLabs (eleven_v4, variante 1), précédée de 0,35 s de silence.
- `assets/words.json` : horodatage de chaque mot, obtenu avec Scribe.
- `FEUILLE-DE-POSES.md` : poses clés, principes d'animation appliqués, commandes de contrôle.
- `zone.py` : contrôle de la zone utile Meta sur un dossier d'images.

## Refaire le rendu

```
npm install hyperframes@0.8.181
npx hyperframes check
npx hyperframes render . --fps 30 -q high -o out/pub.mp4
ffmpeg -i out/pub.mp4 -vf "select='not(mod(n\,30))'" -vsync vfr sec/s%02d.jpg && python3 -I zone.py sec
```
