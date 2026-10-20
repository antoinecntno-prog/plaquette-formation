# Source Remotion de la pub Meta A (version 3)

Composition `Pub3`, 1080 x 1920, 30 images/s. Les scènes suivent la référence plan par plan : `src/v3/Scenes1.tsx` (titres, cartes, fenêtres), `Scenes2.tsx` (disque, paysage, cadre givré, planning), `Scenes3.tsx` (arc, carte et barre, encre, forêt, appel à l'action). Les fonds de verre cannelé sont dans `Backgrounds.tsx`, la chronologie des fonds et le placement des sons dans `Pub3.tsx`.

Reconstruire :

1. `npm install`
2. Voix : placer les fichiers de `sources_audio/` dans `<travail>/audio` (voix_v4.mp3, words_v4.json) et `<travail>/iatest` (t_ia_tiret*, s4*), copier `tools/script.txt` dans `<travail>/tools`, puis `python3 tools/build_voice.py <travail>` avec ce dossier comme `<travail>/pub`. Le script écrit `public/voix.wav` et `src/timings.json`.
3. Sons : `tools/make_sound.sh . sources_audio/m1.mp3` (effets de synthèse et musique remodelée). Clic, pop, frappe et tampon viennent d'ElevenLabs et sont déjà dans `public/sfx`.
4. Rendu : `tools/finalize.sh <travail> <dossier de sortie>` produit la version avec musique, la version sans musique (son à -14 LUFS) et la planche.

Le fond de forêt se régénère avec `python3 tools/gen_forest.py public/bg_pines.jpg`.
