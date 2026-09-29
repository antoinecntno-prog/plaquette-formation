---
name: Antoine Contino · formation IA
description: Deux pages de vente d'une journée de formation IA, en thème jour ou nuit, ouvertes sur la même vidéo de bureau, de jour ou de nuit.
colors:
  bordeaux: "#6E1A2C"
  bordeaux-fonce: "#551422"
  ocre: "#A96F14"
  lampe: "#F7E495"
  ciel: "#041A36"
  ciel-2: "#072347"
  jour-fond: "#FFFFFF"
  jour-fond-alt: "#EAF1F9"
  jour-titre: "#0E1A2B"
  jour-texte: "#223047"
  jour-attenue: "#526076"
  jour-heure: "#8A5A10"
  jour-surligne: "#FBEBA6"
  nuit-fond: "#0A1322"
  nuit-fond-alt: "#0F1B31"
  nuit-carte: "#16243D"
  nuit-titre: "#F4F6FA"
  nuit-texte: "#D6DDE8"
  nuit-attenue: "#A7B3C6"
  nuit-heure: "#E0AC4A"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, Times New Roman, serif"
    fontSize: "clamp(3rem, 1.2rem + 5vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.026em"
  headline:
    fontFamily: "Instrument Serif, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.25rem, 1.2rem + 3vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Instrument Serif, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.625rem, 1.2rem + 0.9vw, 2rem)"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  badge: "8px"
  info: "12px"
  carte: "16px"
  bloc: "24px"
  pilule: "9999px"
spacing:
  gouttiere-mobile: "20px"
  gouttiere: "32px"
  conteneur: "1200px"
  section: "clamp(72px, 9vw, 120px)"
components:
  button-glass:
    backgroundColor: "rgba(255,255,255,0.01)"
    textColor: "#FFFFFF"
    rounded: "{rounded.pilule}"
    padding: "10px 22px"
    height: "44px"
  button-plein:
    backgroundColor: "{colors.bordeaux}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pilule}"
    padding: "10px 22px"
  button-clair:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.bordeaux}"
    rounded: "{rounded.pilule}"
    padding: "20px 48px"
  carte:
    backgroundColor: "{colors.jour-fond}"
    rounded: "{rounded.carte}"
    padding: "24px 28px"
  formule-recommandee:
    backgroundColor: "{colors.bordeaux}"
    textColor: "#FFFFFF"
    rounded: "{rounded.carte}"
    padding: "30px 28px"
---

# Design System: Antoine Contino · formation IA

## Overview

**Creative North Star: "Le bureau, de jour comme de nuit"**

La page s'ouvre sur une vidéo de bureau : un homme concentré qui écrit, casque sur les oreilles. Le thème jour montre la pièce au soleil, le thème nuit la montre à la lampe, avec une étoile filante de temps en temps. Le thème suit le réglage de l'appareil, et le visiteur peut basculer avec le bouton soleil/lune.

Sous la vidéo, la page sert la lecture. En jour, le fond est blanc et les sections alternent avec un ciel pâle. En nuit, le fond est un bleu encre relevé, avec des cartes plus claires. Chaque section se repère au premier coup d'œil : frise horaire, cartes, bande bleu nuit pour la preuve, aplat bleu nuit pour l'appel.

Rejets confirmés par l'utilisateur : fond crème ou blanc cassé, Fraunces, DM Sans, labels en monospace, surtitres, numéros de section, mots en italique de couleur dans les titres, colonnes de gros chiffres, texte en dégradé, blobs et halos décoratifs, et depuis le 29/09/2026 les pages entièrement noires et unies.

**Key Characteristics:**
- Mode clair par défaut quand l'appareil est en clair, pour le confort de lecture.
- Sections distinctes par leur fond, jamais deux fonds identiques à la suite.
- Faits chiffrés surlignés en couleur de lampe, mots clés en gras.
- Boutons en pilule : liquid-glass sur la vidéo, bordeaux plein ailleurs.

## Colors

Identité bordeaux et ocre, deux ciels (jour pâle, nuit profonde) et la lumière de la lampe comme surligneur.

### Primary
- **Bordeaux d'atelier** (bordeaux): accent seulement : boutons pleins, badge « Étape essentielle », texte du bouton blanc de l'appel final.
- **Lumière de lampe** (lampe): surligneur des faits, question de la règle n° 1, faits sur fond sombre.

### Secondary
- **Ocre de patron** (ocre): points de la frise horaire. En texte : jour-heure en clair, nuit-heure en sombre.

### Tertiary
- **Bleu nuit** (jour-titre, #0E1A2B en jour, #1C2E4D en nuit): seule couleur des grands blocs : règle n° 1, dernière journée, formule recommandée, appel final.

### Neutral
- **Jour** : fond blanc, fond alterné ciel pâle, titres bleu encre, texte bleu ardoise.
- **Nuit** : fond bleu encre relevé, fond alterné un cran plus clair, cartes plus claires encore, texte gris bleuté clair.

### Named Rules
**The Lamp Rule.** La couleur de lampe signale un fait vérifiable ou une consigne clé.

**The One Block Color Rule.** Un seul bleu nuit pour tous les grands aplats ; le bordeaux reste un accent de boutons et d'étiquettes.

**The Alternation Rule.** Deux sections voisines n'ont jamais le même fond. Le lecteur sait à tout moment qu'il change de partie.

**The Measured Contrast Rule.** Texte courant à 4,5:1 au moins, titre du haut de page à 3:1, mesurés lettre par lettre sur l'image la plus défavorable de la boucle : la plus claire sous le texte blanc de nuit, la plus sombre sous le texte bleu nuit de jour.

**The Clear Video Rule.** Aucun voile ni fondu sur l'ensemble de la vidéo. Aucun flou non plus. En jour, le titre porte un liseré clair, l'accroche et les boutons se posent sur un panneau clair net aux coins de 24 px, la barre sur une bande claire ; la vidéo rejoint la section suivante par un bord net.

## Typography

**Display Font:** Instrument Serif (Georgia en secours)
**Body Font:** Inter 400 à 600 (police système en secours)

**Character:** une serif de titrage fine et étroite pour les titres, une grotesque neutre en 18 px pour lire longtemps. Polices servies depuis le site.

### Hierarchy
- **Display** (400, clamp(3rem → 6rem), 0,95): le seul H1, en deux tons.
- **Headline** (400, clamp(2,25rem → 3,75rem), 1,02): titres de section.
- **Title** (400, clamp(1,625rem → 2rem), 1,1): étapes, règles, formules, formats.
- **Body** (400, 18 px, 1,65): texte courant, 62 caractères au plus par ligne.
- **Label** (500, 15 px): navigation, boutons, puces.

### Named Rules
**The Roman Rule.** Aucun italique dans les titres.

**The Scan Rule.** Dans chaque paragraphe long, un groupe de mots en gras porte l'idée, pour le lecteur qui survole.

## Layout

Conteneur de 1200 px, gouttières de 32 px (20 px sous 640 px). En-tête de section en deux colonnes 5/7 : titre à gauche, texte ou encart à droite. Déroulé en frise : heures à droite d'une colonne de 20 %, rail vertical avec points, cartes à droite ; sous 1024 px, rail à gauche et heures au-dessus des cartes. Formules en trois cartes, formats et règles en deux colonnes, tout passe en une colonne sous 1024 px.

La navigation se pose sur la vidéo, puis se fixe en haut, plus compacte, dès que le haut de page sort de l'écran. Le bouton de réservation reste ainsi toujours visible.

## Elevation & Depth

Cartes légèrement surélevées par une ombre douce (0 10px 28px -12px à 16 % en jour, plus dense en nuit). La vidéo et la barre fixe floutée portent le reste de la profondeur.

## Shapes

Cartes à 16 px, bloc « Qui je suis » à 24 px, encarts à 12 px, badges à 8 px, boutons et puces en pilule. Aucune bordure latérale colorée.

## Components

### Buttons
- **Sur la vidéo :** liquid-glass du gabarit, texte blanc la nuit, texte bleu nuit sur panneau clair le jour.
- **Ailleurs :** pilule bordeaux pleine, texte blanc ; sur l'aplat bordeaux, pilule blanche, texte bordeaux.
- **Survol / focus :** agrandi à 1,03 au survol, contour bordeaux en jour et lampe en nuit au focus clavier.

### Bouton soleil / lune
- Cercle de 44 px dans la navigation. Libellé accessible selon l'action : « Passer en mode nuit » ou « Passer en mode jour ». Choix gardé sur l'appareil.

### Frise horaire
- Heure en Instrument Serif ocre, point plein aux changements d'heure, point creux pour les étapes suivantes, carte blanche (ou bleu encre relevé en nuit) pour chaque étape.

### Encart d'information
- Icône ocre, texte en gras, fond de carte, pour « 7 h de travail sur site » et « Aucun prérequis technique ».

### Étoile filante
- Traînée blanche qui traverse le ciel de la vidéo de nuit toutes les 2,5 à 11,5 secondes. Absente en jour, en pause et en mouvement réduit.

## Do's and Don'ts

### Do:
- **Do** alterner les fonds de section.
- **Do** surligner les faits chiffrés en couleur de lampe.
- **Do** mesurer le contraste dans les deux thèmes avant de publier.
- **Do** garder la réservation visible grâce à la barre fixe.

### Don't:
- **Don't** poser de fond crème ou blanc cassé.
- **Don't** faire une page entièrement noire et unie.
- **Don't** utiliser Fraunces, DM Sans ou une police monospace.
- **Don't** placer de surtitre ni de numéro de section au-dessus d'un titre.
