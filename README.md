# plaquette-formation

Site d'Antoine Contino, publié sur https://antoinecontino.fr/ (Netlify, dossier publié : `site/`).

- `src/config.mjs` : l'objet de configuration unique. Prix, valeurs de la pile, capacité, places restantes, conditions de vente, durées de conservation et identité de la société.
- `src/pages/` : les gabarits des pages (`index.html` pour l'offre Accélérateur IA 30 jours, `ecoles.html`, `cgv.html`, `confidentialite.html`).
- `src/partials/` : les morceaux communs, dont le pied de page avec les liens Mentions légales, CGV et Confidentialité.
- `build.mjs` : génère les pages de `site/` et vérifie le résultat. La somme des valeurs de la pile doit égaler le total. Le texte ne doit contenir ni tiret cadratin ou demi-cadratin ni mot exclu. Chaque lien de réservation doit être suivi du lien vers /confidentialite, et chaque ancre doit exister.
- `site/` : le site statique servi par Netlify. Les fichiers HTML y sont générés : modifier `src/`, puis lancer la génération.
- `PRODUCT.md` et `DESIGN.md` : contexte produit et système visuel, lus par le skill impeccable.
- `bonus/` : les livrables bonus remis aux clients (tableurs et documents). Ce dossier n'est pas publié.
- `rapports/` : notes de travail datées, dont l'étude des concurrents.

Le seuil de rentabilité affiché par salaire net se calcule depuis `salaires` dans `src/config.mjs`. Le coût employeur de chaque ligne vient du modèle de calcul de l'URSSAF (paquet `modele-social`, celui du simulateur mon-entreprise.urssaf.fr). Pour changer une ligne, refaire le calcul avec ce modèle ou le simulateur, puis reporter le coût employeur mensuel.

## Changer une valeur

1. Modifier la ligne voulue dans `src/config.mjs` (par exemple `places_restantes: 1`).
2. Lancer `node build.mjs` (Node 18 ou plus, aucune dépendance).
3. Le jour de la mise en ligne des pages légales, relancer la génération pour dater les pages, ou renseigner `date_effet_pages_legales`.
