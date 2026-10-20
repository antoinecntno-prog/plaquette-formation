# Feuille de poses, pub Meta B « une journée »

Registre : éditorial (texte, chiffres, pictogrammes). Lignes de texte en glissé amorti `power3.out`, sans rebond. Rebond `back.out` réservé aux chiffres et aux mots clés géants, comme le « 500 » de la référence. Bascule entre écrans par poussée latérale `power3.inOut` sur 0,45 s, poussée verticale sur l'objection levée et sur l'appel à l'action.

Temps en secondes de la vidéo. La voix commence à 0,35 s.

| Écran | Fond | t | Sujet | Pose clé | Intention |
| --- | --- | --- | --- | --- | --- |
| 1 | bordeaux | 0,00 | « Votre équipe passe ses journées » | visible dès l'image 0, descend de 40 px | une phrase lisible à la première image |
| 1 | bordeaux | 0,08 à 2,8 | 63 icônes mail et document | tombent du haut du cadre, un petit rebond au contact, pile qui monte | la journée qui se remplit |
| 1 | bordeaux | 2,03 | « DES MAILS » | monte de 160 px | mot clé sur « mails » |
| 1 | bordeaux | 2,40 | « ET DES COMPTES RENDUS » | entre par la droite | fin de la phrase |
| 2 | ocre | 3,25 | poussée latérale, horloge qui surgit | aiguilles en accélération continue jusqu'à 6,1 | le temps qui file |
| 2 | ocre | 4,07 / 4,71 / 5,03 | « L'IA POURRAIT » puis « EN FAIRE / UNE BONNE PARTIE » | gauche, droite, droite | la promesse connue de tous |
| 3 | sombre | 6,02 | poussée latérale | | aggravation |
| 3 | sombre | 6,75 | « LE TEMPS » | rebond `back.out(1.4)` | mot clé sur « temps » |
| 3 | sombre | 6,95 / 7,43 | « DE S'Y METTRE / SÉRIEUSEMENT » | droite, gauche | |
| 4 | bordeaux | 8,02 | poussée latérale | | |
| 4 | bordeaux | 8,75 à 10,25 | courbe | se trace en accélérant vers le bas | le retard qui se creuse |
| 4 | bordeaux | 9,23 / 9,79 | « LE RETARD » / « SE CREUSE » | gauche, montée | mots clés |
| 5 | blanc | 10,24 | poussée latérale | | promesse |
| 5 | blanc | 12,35 / 13,07 / 13,23 | « FAIT GAGNER » / « 1 H » / « PAR SEMAINE » | gauche, rebond `back.out(1.6)`, droite | le chiffre arrive avec un rebond |
| 6 | sombre | 15,05 | poussée latérale, bulle qui surgit | mots de l'objection allumés un par un sur la voix | objection |
| 7 | ocre | 17,52 | poussée verticale | | objection levée, rythme plus vif |
| 7 | ocre | 18,43 / 18,59 | « UNE » / « JOURNÉE » | deux rebonds à 0,16 s d'écart | mot clé |
| 8 | blanc | 19,02 | poussée latérale | durées raccourcies à 0,30 et 0,35 s | rythme accéléré |
| 8 | blanc | 19,63 / 20,27 / 20,83 | « CHEZ VOUS » / dossier / « SUR VOS VRAIS DOSSIERS » | gauche, surgit, droite | |
| 8 | blanc | 21,87 / 22,03 | « À CINQ AU PLUS » / cinq points | montée, cinq rebonds décalés de 0,06 s | « à cinq au plus » |
| 9 | bordeaux | 22,52 | poussée latérale | | preuve |
| 9 | bordeaux | 25,11 | « 10 H » | rebond et compteur 0 à 10 en 0,55 s | le chiffre monte |
| 10 | ocre | 26,10 | poussée latérale, calendrier qui apparaît | 30 cases cochées une par une de 26,65 à 28,20 | J30 |
| 10 | ocre | 27,47 / 28,27 | « 30 JOURS » / tampon « Vérifié » | rebond, tampon qui descend de 1,9 à 1 | résultat vérifié |
| 10 | ocre | 29,47 | « SANS FRAIS » | montée | garantie |
| 11 | blanc | 30,02 | poussée verticale | écran tenu jusqu'à 36,3 | appel à l'action |
| 11 | blanc | 30,79 / 30,99 / 31,71 | bouton / antoinecontino.fr / flèche | surgit, monte, rebond puis balancement amorti | « réservez » |

Principes appliqués : staging (une idée par écran, un seul mouvement fort à la fois), slow in et slow out sur chaque ligne, overlapping par décalage des lignes et des points, anticipation réduite au recul de 40 px de la première ligne, timing varié (0,30 s sur l'écran 8, 0,60 s sur les chiffres), follow-through sur la flèche. Écarts volontaires au skill : rebond `back.out` sur les chiffres et les mots clés, demandé par le brief et présent dans la référence.

Commandes passées : `npx hyperframes check` (0 erreur ; 2 avertissements sur le pivot des aiguilles, qui tournent bien autour du centre de l'horloge, et 1 sur la taille du fichier), `npx hyperframes snapshot` à 19 instants, `npx hyperframes render --fps 30 -q high`.
