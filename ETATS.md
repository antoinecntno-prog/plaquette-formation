# Les machines à états du site

Ce fichier liste chaque machine à états du site : ses états, ce qui la fait changer, où elle est écrite et comment la lire. Il sert aux personnes et aux agents qui modifient le site.

Règle commune : chaque machine garde son état à un seul endroit, sous un nom lisible. Dans le navigateur, cet endroit est un attribut du DOM. Dans le build, c'est une valeur de `src/config.mjs`.

## Dans le navigateur (`site/js/site.js`)

Les règles de passage sont dans l'objet `Etats`, en tête du fichier. Elles ne touchent pas au DOM : `build.mjs` charge le même fichier pour vérifier les pages. Dans la console du navigateur, `Etats.bandeau('preferences', 'echap', false)` répond `accueil`.

### Thème

- Où le lire : `html[data-theme]` vaut `jour` ou `nuit`. `html[data-theme-source]` vaut `heure` ou `visiteur`.
- Départ : le choix gardé sur l'appareil (`localStorage`, clé `theme`) gagne. Sinon l'heure décide : jour de 7 h à 20 h.
- Changements : un clic sur `.bouton-theme` inverse le thème et le garde. Un autre onglet du site qui change le thème est suivi.
- Règle : `Etats.themeInitial(memoire, heure)`.
- Le script en ligne de `src/partials/tete-commune.html` pose le thème avant le premier affichage. Le build vérifie qu'il donne le même résultat que `Etats.themeInitial` pour les 24 heures.

### Scène du haut de page

- Où la lire : `.ouverture[data-scene]` vaut `jour` ou `nuit`. La classe `scene-jour` sur `html` suit.
- Règle : `Etats.scene(theme, jourDisponible)`. La scène de jour demande le thème jour et l'attribut `data-jour-disponible="true"` sur la vidéo.

### Vidéo du haut de page

- Où la lire : `.ouverture[data-video]`. Le bouton `.bouton-video[data-etat]` garde `lecture` ou `pause` pour le CSS.
- États : `lecture`, `pause-visiteur`, `pause-mouvement-reduit`, `pause-economie`, `pause-hors-ecran`, `bloquee`.
- `pause-hors-ecran` couvre deux cas : le haut de page est sorti de l'écran, ou l'onglet est en arrière-plan.
- `bloquee` : la lecture est souhaitée, le haut de page est visible, et le navigateur a refusé de lancer la vidéo.
- Changements : clic sur le bouton, défilement, onglet masqué ou revenu, réglage « mouvement réduit » du système.
- Règle : `Etats.video({ enLecture, motifPause, visible })`.

### Étoile filante

- Elle n'a pas d'attribut : elle se déduit de la vidéo. Elle passe seulement en thème nuit, vidéo en lecture, haut de page visible et mouvement autorisé (`etoileAutorisee`).

### Barre fixe

- Où la lire : la classe `fixe` sur `.barre`, posée quand le haut de page sort de l'écran.

### Bandeau cookies

- Où le lire : `.cookies[data-etat]` vaut `ferme`, `accueil` ou `preferences`.
- Table des passages : `Etats.BANDEAU`. Chaque bouton `[data-cookies="action"]` déclenche l'action du même nom : `accepter`, `refuser`, `preferences`, `enregistrer`, `gerer`.
- `demander` est l'action interne qui ouvre le bandeau à la première visite.
- Échap sort des préférences sans rien enregistrer : retour à l'accueil si aucun choix n'existe, fermeture sinon. Règle : `Etats.bandeau(etat, action, choixConnu)`.
- Le focus va au bandeau quand une vue s'ouvre. À la fermeture, il revient au bouton qui l'avait ouvert.
- Le build refuse une action `data-cookies` absente de la table, un état qui ne peut pas se fermer, et une page sans bouton « Gérer mes cookies ».

### Consentement

- Où le lire : `html[data-consentement]` vaut `inconnu`, `tout`, `partiel` ou `aucun`.
- `inconnu` : aucun choix, ou un choix plus vieux que `duree_consentement_mois`. Le bandeau s'ouvre alors à l'accueil.
- Le choix est gardé dans `localStorage`, clé `preferences-cookies`, avec sa date.
- Règle : `Etats.consentement(choix)`.

## Dans le build (`build.mjs` et `src/config.mjs`)

### Palier de prix

- État : `clients_signes`, en tête de `src/config.mjs`. C'est la seule ligne à changer à chaque signature.
- Calculés : le palier, son prix, les places restantes et le prix suivant.
- Passage au palier suivant : il se fait seul quand `clients_signes` atteint un multiple de `clients_par_palier`. Le build s'arrête alors et liste ce qu'il reste à revoir : les totaux des piles et les mentions « prix de lancement ».

### Date d'effet des pages légales

- État : la date écrite dans chaque page légale publiée (`site/cgv.html`, `site/confidentialite.html`).
- Règle : une page dont le texte (le contenu de `<main>`) n'a pas changé garde sa date. Une page dont le texte change prend la date du jour.
- `date_effet_pages_legales` dans la config impose une date aux deux pages.

### Valeur d'un élément de pile

- États : `a-fournir` (valeur absente), `comprise` (offre de base), `offerte` (bonus). Règle : `etatValeur` dans `build.mjs`.
- Une valeur `a-fournir` s'affiche « [à fournir] » et le build le rappelle avant la mise en ligne.

### Blocs affichés ou masqués

- `temoignage_video` : `true` affiche la vidéo témoignage. Le build exige alors les deux fichiers dans `site/images`.
- `resultat_bts_mco` (écoles) et `places_restantes` : une valeur vide masque la ligne.
- Dans un gabarit, `{{#si cle}}…{{/si}}` affiche le bloc quand la clé a une valeur. Le build refuse une clé inconnue.

### Génération

- Tout ou rien : le build écrit les pages seulement si aucune vérification n'échoue. Il signale les clés calculées qu'aucun gabarit n'utilise.

## Vérifier après une modification

1. `node build.mjs` : il vérifie les tables d'états, le script du thème, les actions du bandeau, le palier et les dates.
2. Dans le navigateur, lire les attributs `data-theme`, `data-video`, `data-etat` et `data-consentement` pour confirmer l'état attendu.
