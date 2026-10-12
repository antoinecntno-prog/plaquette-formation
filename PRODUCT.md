# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Site statique de quatre pages HTML (offre, écoles, CGV, confidentialité), publié sur Netlify depuis le dossier `site/`. Les pages sont générées par `build.mjs` depuis `src/` et l'objet de configuration unique `src/config.mjs`. CSS et JavaScript natifs, sans framework ni dépendance. Polices, images et vidéo servies depuis le domaine du site.

## Users

Deux publics, une page chacun.

- **Entreprises** (`site/index.html`) : les équipes des PME du Grand Est qui passent des heures à écrire : devis, réponses clients, contrats, comptes rendus, fiches techniques. Antoine demande de dire « PME », sans autre qualificatif.
- **Écoles** (`site/ecoles.html`) : les équipes pédagogiques des écoles, CFA et centres de formation, puis leurs étudiants.

## Product Purpose

Vendre le Sprint de l'heure gagnée (nom choisi le 12/10/2026 avec la formule M-A-G-I-C, ancien nom : L'Atelier Une Heure), une journée équipe sur site construite avec la méthode des offres d'Alex Hormozi : promesse d'au moins une heure gagnée par semaine et par personne dans les 30 jours, pile chiffrée : la journée et le prompt qui écrit vos prompts en offre de base, cinq bonus dont la valeur dépasse celle de l'offre de base, deux garanties nommées, rareté et urgence réelles. Puis un accompagnement annuel à paliers. La page réussit quand le visiteur réserve l'audit gratuit de 30 minutes sur Calendly.

## Positioning

Antoine Contino est formateur IA dans le Grand Est et COO d'IFS, atelier textile des Vosges. Il se sert de l'IA dans son travail de dirigeant depuis quatre ans et forme sur des tâches qu'il connaît de l'intérieur, à partir des dossiers du client anonymisés avant d'entrer dans l'outil.

## Operating Context

- Journée de 9 h à 17 h dans les locaux du client, déroulé proposé le 12/10/2026 : carte des heures perdues avant la journée, configuration du compte en premier, objectif et règles, premier gain avant midi, garantie de midi, un outil par personne l'après-midi, clôture à 16 h 15, bonus du soir, puis visios à J+15 et J+45 et contrôle à J+30.
- Livrables bonus dans `bonus/` : carte des heures perdues et compteur d'heures gagnées (tableurs), kit feu vert DSI, prompt qui écrit vos prompts, trames des visios de déblocage, suivi Signature.
- Accompagnement à l'année en trois paliers : Essentiel, Signature (recommandé), Prestige.
- Tarifs publiés depuis le 12/10/2026, tous tirés de `src/config.mjs` : journée équipe 4 900 € HT pour 5 personnes au plus, Essentiel 1 200 € HT par an, Signature 3 600 € HT par an, Prestige sur échange.
- Réservation : https://calendly.com/antoine-cntno/30min. Contact : antoine.cntno@gmail.com, 06 37 26 46 25.
- Éditeur du site : Industrie Française de Sellerie (IFS), SARL, Uxegney (88).

## Capabilities and Constraints

- Aucun cookie, aucun outil de mesure d'audience, aucune ressource tierce au chargement. Calendly s'ouvre seulement au clic.
- Pages légales : /cgv (vendeur IFS, entre professionnels) et /confidentialite (exigée par Meta pour les publicités et formulaires Lead Ads).
- La boucle vidéo du haut de page (`site/images/boucle.mp4`, 9,5 s, muette) se met en pause au clic et respecte la préférence de mouvement réduit.

## Brand Commitments

- Couleurs d'identité : vert d'action #15803D et ocre #A96F14 ; le bordeaux d'origine a été remplacé par le vert le 05/10/2026.
- Ton direct, entre pairs, promesses mesurées. Première personne.
- Règles d'écriture d'Antoine pour tout texte ajouté : aucun tiret cadratin ou demi-cadratin, aucune tournure qui écarte un terme pour en poser un autre, énumérations de deux éléments ou de quatre et plus.
- Ancienne charte abandonnée le 28/09/2026 : fond crème, Fraunces, DM Sans, labels en monospace.

## Evidence on Hand

- Dernière journée : 8 septembre 2026, dirigeante d'un cabinet de coaching en Moselle, 10 heures gagnées par semaine, passage à l'accompagnement à l'année.
- Une classe de BTS MCO préparée à son oral avec l'IA en 2026.
- Certification HarvardX CS50AI, janvier 2026, vérifiable sur edX (`site/images/certificat-cs50ai.webp`).
- Portrait : `site/images/portrait.webp`.
- Absents, à ne pas inventer : témoignage écrit ou vidéo de la cliente (emplacement prévu en commentaire dans `src/pages/index.html`), logos clients, nombre de personnes formées.

## Product Principles

- Chaque chiffre affiché vient d'une journée réelle et datée, ou d'un calcul sourcé : le seuil de rentabilité par salaire net s'appuie sur le modèle de calcul de l'URSSAF.
- Le visiteur voit la journée heure par heure avant de réserver.
- Une seule action principale par page : réserver l'audit de 30 minutes, suivi à chaque fois du lien vers la politique de confidentialité.
- Les données du client restent anonymes, et la page le dit.

## Accessibility & Inclusion

Cible WCAG 2.2 AA. Contraste de 4,5:1 pour le texte posé sur la vidéo, 3:1 pour le titre. Animation arrêtable (critère 2.2.2), cibles tactiles de 44 px, lecture au clavier et au lecteur d'écran.
