# Kit feu vert DSI

Bonus du Sprint de l’heure gagnée · Antoine Contino · version du 12 octobre 2026

Ce kit donne à votre DSI, ou à la personne qui gère l’informatique, de quoi valider l’usage de l’IA avant la journée. Il contient quatre pièces :

1. la charte d’usage de l’IA, à adapter puis à signer ;
2. la fiche d’anonymisation, à garder près du poste ;
3. les réglages à vérifier dans l’outil choisi ;
4. la fiche de validation, à renvoyer signée avant la journée.

Une cinquième partie résume le cadre légal. Remplacez les passages entre crochets [ ] par vos informations.

---

## 1. Charte d’usage de l’IA de [nom de l’entreprise]

En vigueur à partir du [date]. Validée par [nom, fonction].

### Article 1. Objet

Cette charte fixe les règles d’usage des outils d’intelligence artificielle générative chez [nom de l’entreprise]. Elle s’applique à toute personne qui se sert de ces outils pour son travail.

### Article 2. Outils autorisés

Les outils autorisés figurent dans ce tableau. Chacun s’utilise avec un compte au nom de l’entreprise.

| Outil | Formule | Compte géré par | Date de validation |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |
| [ ] | [ ] | [ ] | [ ] |

Un outil absent du tableau reste interdit jusqu’à sa validation par [DSI ou direction].

### Article 3. Usages autorisés

- Préparer un premier jet : devis, réponse à un client, compte rendu, fiche, procédure.
- Résumer ou reformuler un document anonymisé.
- Structurer des idées ou préparer une réunion.
- Chercher une formulation ou une méthode.

### Article 4. Données interdites dans l’outil

Ces données n’entrent jamais dans un outil d’IA, même en partie :

- les mots de passe et les codes d’accès ;
- les coordonnées bancaires et les numéros de carte ;
- les données de santé et les données sociales des salariés ;
- les documents d’un client dont le contrat interdit la transmission à un outil tiers ;
- [vos propres cas : plans, secrets de fabrication, prix d’achat].

### Article 5. Anonymisation

Les autres documents entrent dans l’outil après anonymisation, selon la fiche d’anonymisation de ce kit. Rien de ce qui permet de reconnaître une personne ou une entreprise n’entre dans l’outil.

### Article 6. Relecture

Chaque texte produit par l’IA est relu par la personne qui s’en sert avant tout envoi. Cette personne reste responsable de ce qu’elle envoie. L’IA prépare et la personne décide.

### Article 7. Comptes

Chaque personne utilise son compte nominatif. [DSI] crée et ferme les comptes. Au départ d’un salarié, son compte est fermé et ses outils passent à [responsable].

### Article 8. Incident

Une donnée interdite est entrée dans l’outil par erreur : la personne prévient [contact] le jour même. [Contact] supprime la conversation et note l’incident.

Si la donnée concerne une personne, [contact] évalue avec la direction s’il faut prévenir la CNIL. Le délai est de 72 heures après la découverte de l’incident (article 33 du RGPD).

### Article 9. Formation

Chaque utilisateur suit une formation à l’usage de l’IA avant de se servir d’un outil autorisé. [Nom de l’entreprise] garde la trace de ces formations.

Fait à [ville], le [date].
Pour [nom de l’entreprise] : [nom, fonction, signature]

---

## 2. Fiche d’anonymisation

### La règle

Avant de coller un texte dans l’outil, remplacez tout ce qui permet de reconnaître une personne ou une entreprise par un repère entre crochets.

### Ce qu’on remplace

| Dans le document | Repère à mettre |
|---|---|
| Nom d’un client | [CLIENT A], [CLIENT B] |
| Nom d’une personne | [PERSONNE 1], [PERSONNE 2] |
| Nom d’un fournisseur | [FOURNISSEUR A] |
| Adresse ou ville précise | [ADRESSE], [VILLE] |
| Téléphone ou e-mail | [TÉLÉPHONE], [E-MAIL] |
| Numéro de commande ou de contrat | [N° COMMANDE], [N° CONTRAT] |
| SIRET ou numéro de TVA | [SIRET] |
| Montant sensible | [MONTANT] ou un ordre de grandeur |

### La table de correspondance

Gardez la liste des repères dans un fichier à part, hors de l’outil d’IA : [CLIENT A] = le vrai nom. Remettez les vrais noms dans le texte final après la relecture.

### Exemple fictif

Avant :

> Bonjour Monsieur Durand, suite à notre visite du 3 mars dans votre garage de Golbey, voici le devis n° 2026-118 pour la reprise des 12 sièges.

Après :

> Bonjour [PERSONNE 1], suite à notre visite du [DATE] dans votre garage de [VILLE], voici le devis n° [N° DEVIS] pour la reprise des 12 sièges.

Le nombre de sièges reste : il ne permet de reconnaître personne et l’IA en a besoin.

### Les quatre questions avant de coller

1. Un nom de personne reste-t-il dans le texte ?
2. Un nom d’entreprise reste-t-il dans le texte ?
3. Un numéro permet-il de retrouver le dossier ?
4. Le texte contient-il une donnée interdite par l’article 4 de la charte ?

Quatre non : vous pouvez coller.

---

## 3. Réglages à vérifier dans l’outil

Les menus des outils changent souvent. Vérifiez ces réglages le jour de l’installation et notez la date.

| Réglage | Ce qu’on attend | Vérifié le | Par |
|---|---|---|---|
| Usage des conversations pour entraîner les modèles | Coupé dans les paramètres, ou exclu par le contrat | | |
| Type de compte | Formule équipe ou entreprise, au nom de l’entreprise | | |
| Contrat de traitement des données de l’éditeur | Accepté et rangé par [DSI] | | |
| Lieu de stockage des données | Connu et noté | | |
| Durée de conservation des conversations | Connue et réglée au plus court utile | | |
| Accès à la messagerie et aux documents | Limité aux dossiers utiles | | |
| Partage de conversations par lien | Coupé ou réservé aux comptes de l’entreprise | | |
| Double authentification | Activée | | |

Repères par type d’offre, à vérifier sur le site de l’éditeur :

- **Formules pour particuliers, gratuites ou payantes** : l’entraînement sur vos conversations peut être activé par défaut. Un réglage de confidentialité permet de le couper.
- **Formules équipe ou entreprise** : les éditeurs annoncent en général que vos données ne servent pas à l’entraînement. Lisez la clause dans le contrat.
- **IA intégrée à votre suite bureautique** : vérifiez avec votre administrateur que la protection des données de l’entreprise couvre chaque compte.
- **Outil installé sur vos serveurs** : les données restent chez vous. Vérifiez qui lit les journaux d’utilisation.

---

## 4. Fiche de validation DSI

À renvoyer signée à Antoine Contino avant la journée.

| Point | Validé | Remarque |
|---|---|---|
| Outil et formule retenus pour la journée | ☐ | |
| Un compte par participant, créé et testé | ☐ | |
| Réglages de la partie 3 vérifiés | ☐ | |
| Charte adaptée et signée | ☐ | |
| Liste des données interdites complétée | ☐ | |
| Accès à la messagerie et aux documents pendant la journée | ☐ oui ☐ non | |
| Contact en cas d’incident : [nom, téléphone] | ☐ | |

Validé par : [nom, fonction]
Date : [date]
Signature :

---

## 5. Le cadre légal en bref

- **RGPD.** Un texte qui contient des données personnelles reste soumis au RGPD dans un outil d’IA. L’anonymisation avant envoi réduit ce risque. Avec une formule professionnelle, l’éditeur traite en général vos données comme sous-traitant : un contrat encadre ce traitement (article 28 du RGPD).
- **Règlement européen sur l’IA, article 4.** Les entreprises qui utilisent des systèmes d’IA prennent des mesures pour développer la maîtrise de l’IA de leur personnel. L’obligation s’applique depuis le 2 février 2025 (règlement UE 2024/1689). L’accord politique du 7 mai 2026 sur l’omnibus numérique allège sa rédaction : l’entreprise soutient la formation de son personnel sans devoir garantir un niveau précis. Vérifiez la version en vigueur au Journal officiel de l’Union européenne.
- **Vos contrats clients.** Certains clients interdisent de transmettre leurs documents à un outil tiers. Ces documents restent hors de l’outil, même anonymisés.
- **Ce qu’il faut garder.** Rangez la charte signée avec la fiche de validation. Ajoutez la date de la journée de formation et la liste des participants. Ces pièces montrent les mesures prises pour l’article 4.
