---
name: Antoine Contino · formation IA
description: Deux pages de vente d'une journée de formation IA, posées dans la nuit bleu encre d'une vidéo de bureau éclairé à la lampe.
colors:
  nuit: "#060509"
  nuit-2: "#0D0C12"
  ciel: "#041A36"
  ciel-2: "#072347"
  lampe: "#F7E495"
  bordeaux: "#6E1A2C"
  ocre: "#A96F14"
  texte: "#FFFFFF"
  texte-2: "#E6E2D9"
  attenue: "#B8B2A2"
  attenue-ciel: "#B9C4D6"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, Times New Roman, serif"
    fontSize: "clamp(3rem, 1.2rem + 5vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.026em"
  headline:
    fontFamily: "Instrument Serif, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.375rem, 1.25rem + 3.2vw, 4.25rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Instrument Serif, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.625rem, 1.2rem + 0.9vw, 2rem)"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  etiquette: "6px"
  portrait: "8px"
  formule: "10px"
  pilule: "9999px"
spacing:
  gouttiere-mobile: "20px"
  gouttiere: "32px"
  conteneur: "1280px"
  section: "clamp(88px, 10vw, 144px)"
  colonnes: "64px"
components:
  button-glass:
    backgroundColor: "rgba(255,255,255,0.01)"
    textColor: "{colors.texte}"
    rounded: "{rounded.pilule}"
    padding: "10px 24px"
    height: "44px"
  button-glass-large:
    backgroundColor: "rgba(255,255,255,0.01)"
    textColor: "{colors.texte}"
    rounded: "{rounded.pilule}"
    padding: "20px 56px"
  button-video:
    backgroundColor: "rgba(255,255,255,0.01)"
    textColor: "{colors.texte}"
    rounded: "{rounded.pilule}"
    size: "48px"
  formule-recommandee:
    backgroundColor: "{colors.bordeaux}"
    textColor: "{colors.texte}"
    rounded: "{rounded.formule}"
    padding: "30px 28px"
  badge:
    textColor: "{colors.lampe}"
    rounded: "{rounded.etiquette}"
    padding: "3px 9px"
---

# Design System: Antoine Contino · formation IA

## Overview

**Creative North Star: "Le bureau de nuit"**

Toute la page vient de la boucle vidéo du haut : un homme concentré qui écrit, casque sur les oreilles, dans une pièce bleu encre que seule une lampe de bureau éclaire. Le système reprend cette scène à l'échelle de la page. Le fond reste dans le noir du bas de l'image, une bande de ciel revient pour la preuve datée, et la lumière de la lampe marque les faits que le visiteur doit retenir.

La densité est faible et la lecture se fait en deux colonnes : le titre d'une section à gauche, son texte à droite. Les titres en serif fine et condensée donnent la voix, le texte courant en grotesque reste neutre. Un seul moment animé, l'apparition du haut de page, et une vidéo que le visiteur peut arrêter.

Rejets confirmés par l'utilisateur le 28/09/2026 : fond crème ou blanc cassé, Fraunces, DM Sans, labels en monospace, surtitres, numéros de section, mots en italique de couleur dans les titres, colonnes de gros chiffres, texte en dégradé, grilles de cartes identiques à icône, blobs et halos décoratifs.

**Key Characteristics:**
- Fond nuit (#060509) sous toute la page, dans la continuité du bas de la vidéo.
- Titre du haut de page en deux tons, blanc puis atténué, en romain.
- Faits chiffrés écrits en phrase, en couleur de lampe.
- Boutons arrondis en liquid-glass, seule texture de surface.

## Colors

Une nuit bleu encre prise dans la vidéo, avec deux sources de chaleur : la lampe pour la lumière, le bordeaux et l'ocre pour l'identité.

### Primary
- **Nuit de bureau** (nuit): fond de toutes les sections et du bas du haut de page ; le fondu de la vidéo s'achève sur cette valeur.
- **Lumière de lampe** (lampe): faits chiffrés, question de la règle n° 1, contour de focus, sélection de texte, étiquettes « Étape essentielle » et « Recommandé ».

### Secondary
- **Bordeaux d'atelier** (bordeaux): aplat de la formule recommandée, couleur de la balise theme-color. Jamais en texte sur fond sombre (contraste de 1,5:1).
- **Ocre de patron** (ocre): horaires du déroulé en serif de 26 px (4,8:1 sur la nuit). Jamais en texte sur la bande de ciel.

### Tertiary
- **Ciel de la zone du titre** (ciel) et **ciel près des arbres** (ciel-2): dégradé vertical de la bande « Dernière journée ».

### Neutral
- **Blanc** (texte): titres et texte posé sur la vidéo.
- **Blanc chaud** (texte-2): texte courant.
- **Atténué réchauffé** (attenue): mots secondaires du titre, liens de navigation, textes discrets ; réchauffé vers la lampe depuis le gris du gabarit.
- **Atténué bleuté** (attenue-ciel): remplace l'atténué réchauffé dans la bande de ciel.
- **Filet de lampe** (rgb(247 228 149 / .16)): séparations horizontales de 1 px.

### Named Rules
**The Lamp Rule.** La couleur de lampe signale un fait vérifiable ou une consigne clé. Elle ne décore rien d'autre.

**The Measured Contrast Rule.** Tout texte posé sur la vidéo atteint 4,5:1 (3:1 pour le titre) sur l'image composite la plus claire de la boucle. Quand une zone échoue, on corrige par un dégradé local à cet endroit précis.

## Typography

**Display Font:** Instrument Serif (Georgia en secours)
**Body Font:** Inter 400 et 500 (police système en secours)

**Character:** une serif de titrage fine et étroite, qui écrit comme une plume, face à une grotesque sans effet pour le texte. Les deux polices sont servies depuis le site en sous-ensemble latin.

### Hierarchy
- **Display** (400, clamp(3rem → 6rem), 0,95, -0,026em): le seul H1, en deux tons.
- **Headline** (400, clamp(2,375rem → 4,25rem), 1): titres de section, 16em au plus.
- **Title** (400, clamp(1,625rem → 2rem), 1,1): étapes du déroulé, règles, formules.
- **Body** (400, 17 px, 1,65): texte courant, 38em au plus par ligne.
- **Label** (500, 14 px): navigation, boutons, précisions sous les boutons.

### Named Rules
**The Roman Rule.** Aucun italique dans les titres. Le second ton du H1 passe par la couleur atténuée.

**The Same-Line Rule.** Une information d'appoint sur un titre (« Règle n° 1 », « Les étudiants ») se place sur la même ligne, dans la couleur atténuée, suivie d'un point médian. Jamais au-dessus du titre.

## Layout

Conteneur de 1280 px avec gouttières de 32 px (20 px sous 640 px). Grille de section en deux colonnes 5/7 avec 64 px d'écart ; les étapes du déroulé reprennent la même grille, horaire à gauche, contenu à droite. Marge verticale des sections : clamp(88px, 10vw, 144px).

Haut de page : hauteur d'écran complète. Sur écran large, le bloc texte occupe les 60 % de gauche, le titre reste dans les 38 % du haut. Sous 1024 px ou en portrait, la vidéo se cale à 70 % en largeur, le titre reste en haut et l'accroche descend en bas de l'écran, le personnage visible entre les deux. Les liens de navigation disparaissent sous 1200 px.

## Elevation & Depth

Aucune ombre portée. La profondeur vient de la vidéo, des dégradés sombres qui la fondent dans la page et du flou de 4 px des boutons liquid-glass.

### Named Rules
**The Flat Night Rule.** Les surfaces restent à plat sur la nuit. Seuls deux aplats existent : la bande de ciel et la formule recommandée en bordeaux.

## Shapes

Filets horizontaux de 1 px pour séparer. Boutons en pilule complète, étiquettes à 6 px, portrait à 8 px, formule recommandée à 10 px. Aucune bordure latérale colorée.

## Components

### Buttons
- **Shape:** pilule complète (9999px).
- **Primary:** liquid-glass du gabarit, texte blanc ; 10 px × 24 px en navigation, 20 px × 56 px en grand format ; pleine largeur sous 640 px.
- **Hover / Focus:** agrandi à 1,03 au survol sur pointeur fin, contour de lampe de 2 px au focus clavier.
- **Secondary:** lien souligné blanc, soulignement atténué qui passe à la lampe au survol.

### Navigation
- Nom en Instrument Serif 30 px, mention en Inter 12 px atténuée dessous, jusqu'à quatre liens en 14 px atténués qui passent au blanc au survol, bouton liquid-glass à droite. Posée sur la vidéo, elle défile avec la page.

### Bouton de la vidéo
- Cercle liquid-glass de 48 px (44 px sur mobile) en bas à droite du haut de page. Libellé accessible selon l'état : « Mettre la vidéo en pause » ou « Relancer la vidéo ». Caché tant que le script n'a pas chargé.

### Fait en lumière de lampe
- Phrase complète en Inter 500 couleur lampe ; en Instrument Serif de 30 à 46 px pour la preuve de la dernière journée.

### Formules à l'année
- Lignes séparées par des filets, en trois colonnes (nom, axe, description) ; la formule recommandée reçoit l'aplat bordeaux et l'étiquette « Recommandé » en lampe.

## Do's and Don'ts

### Do:
- **Do** mesurer chaque texte posé sur la vidéo sur l'image composite la plus claire, à 1440 × 900, 1920 × 1080, 768 × 1024 et 390 × 844.
- **Do** servir polices, images et vidéo depuis le domaine du site.
- **Do** démarrer la vidéo par script et la laisser sur l'image d'affiche quand le visiteur demande moins de mouvement.
- **Do** garder les horaires du déroulé dans l'ordre de la journée.

### Don't:
- **Don't** poser de fond crème ou blanc cassé.
- **Don't** utiliser Fraunces, DM Sans ou une police monospace.
- **Don't** placer de surtitre ni de numéro de section au-dessus d'un titre.
- **Don't** afficher un chiffre seul en grand avec une légende dessous.
- **Don't** écrire de texte en bordeaux ou en ocre sur la bande de ciel.
