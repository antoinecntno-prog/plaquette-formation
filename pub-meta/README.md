# Pub Meta B « une journée »

Source Remotion de la publicité verticale (1080 x 1920, 30 i/s) qui vend l'Accélérateur IA 30 jours.

- `public/voix.mp3` : voix clonée ElevenLabs (modèle eleven_v4, variante 1), précédée de 0,35 s de silence.
- `tools/words.json` : horodatage de chaque mot, obtenu avec Scribe.
- `tools/script.json` : découpage des sous-titres en blocs de deux lignes au plus.
- `tools/align.py` : cale les mots du script sur les horodatages et produit `src/timing.json`.
- `tools/zone.py` : contrôle que rien ne sort de la zone utile Meta sur un dossier d'images.
- `src/Pub.tsx` : scènes, mots clés, graphiques et sous-titres.

## Refaire le rendu

```
npm install
python3 -I tools/align.py tools/script.json tools/words.json src/timing.json
npx remotion render src/index.ts pub out/pub.mp4 --concurrency=4
ffmpeg -i out/pub.mp4 -vf "fps=1" sec/s%02d.jpg && python3 -I tools/zone.py sec
```

Le navigateur est fixé dans `remotion.config.ts` sur le Chromium headless de la session ; sur une autre machine, retirer cette ligne.
