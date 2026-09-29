# Vidéo de jour du haut de page : prompt et cahier des charges

Vidéo de jour livrée le 29/09/2026 et branchée sur le thème jour (`site/images/boucle-jour.mp4`). Ce document garde le prompt pour une prochaine version.

## Méthode conseillée : retoucher la vidéo de nuit

Tu gardes ainsi la scène et les gestes à l’identique, et la bascule jour/nuit montre la même pièce. Envoie `site/images/boucle.mp4` comme vidéo de référence dans un outil de retouche vidéo (Seedance 2.5 en mode « video edit » sur Higgsfield, Runway Aleph, Luma Modify ou équivalent), avec ce prompt :

```
Same scene, same camera framing, same composition and same movements of the man, relit as a bright late-morning day.
Clear blue sky with a few soft white clouds behind the window, trees outside in fresh green daylight.
Warm natural sunlight enters through the window from the right, casting soft sunbeams and gentle shadows across the wooden desk, the books and the open notebook.
The desk lamp is switched off. The laptop screen stays readable and slightly dimmer than the daylight.
Keep the left part of the sky calm and evenly lit, with no sun disk and no lens flare, so text can sit on it.
Photorealistic, natural colors, soft contrast, no stars, no night tones, no text, no watermark.
Seamless loop: the last frame matches the first frame.
```

## Méthode de secours : image, puis animation

1. Génère une image de jour à partir de `site/images/boucle-affiche.jpg` (image de référence), avec la première moitié du prompt ci-dessus.
2. Anime cette image en boucle de 8 à 10 secondes avec : `Subtle ambient loop: the man writes slowly in his notebook, light steam rises from the coffee cup, leaves move gently outside the window. Static camera. Seamless loop.`

## Cahier des charges du fichier

- Format 16:9, 1280 × 720 au moins (1920 × 1080 conseillé).
- Durée de 8 à 10 secondes, en boucle continue, sans son.
- MP4 en H.264, 3 Mo au plus.
- La tête du personnage reste dans la bande de 62 à 77 % de la largeur. Le ciel à gauche reste uni et clair, puisque le titre s'y pose.

## Où déposer les fichiers

- `site/images/boucle-jour.mp4` : la vidéo.
- `site/images/boucle-jour-affiche.jpg` : sa première image, en JPEG qualité 80 environ.

Envoie-moi ensuite la vidéo : je la branche sur le thème jour et je mesure le contraste du titre et de l'accroche sur l'image la plus claire de la boucle avant de publier.
