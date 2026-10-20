# Source Remotion de la pub Meta A

Rendu : `npm install`, copier `public/voix_v1_originale.mp3` en `audio/voix_v1.mp3` et `public/words_raw.json` en `audio/words_raw.json` dans un dossier de travail, lancer `python3 make_audio.py <dossier>` pour produire `public/voix.wav` et `src/timings.json`, puis `npx remotion render src/index.ts Pub out/pub.mp4 --codec=h264 --audio-codec=aac`. La planche se fait avec `planche.sh out/pub.mp4 planche.jpg`.
