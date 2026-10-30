# Revue d'écriture du site, 29 octobre 2026

Méthode : skill orwell, avec les 6 règles d'Orwell, le contrôle STE adapté au français et les règles maison. Textes lus : les pages entreprises et écoles en entier, avec leurs titres et descriptions, telles que générées sur la branche locale `prix-lancement-900`. Les CGV et la politique de confidentialité sont passées au contrôle automatique (longueur, passif, mots à chasser), puis relues sur les passages signalés.

Mise à jour du même jour : le Sprint Examen s'appelle désormais Parcours Révisions IA. Les propositions ci-dessous utilisent le nouveau nom.

Calibrage retenu : pages de vente au plafond de l'article de blog (25 mots par phrase, 5 phrases par paragraphe, latitude moyenne). CGV et confidentialité au plafond de description STE (25 mots), avec la tolérance qu'impose le vocabulaire juridique.

## Verdict

Les pages de vente sont bien écrites. Les phrases font 9 mots en moyenne (9,2 sur la page entreprises, 9,4 sur la page écoles) et aucun paragraphe ne dépasse 5 phrases. Le contrôle ne trouve aucun tiret, aucune opposition-correction et aucun mot à chasser. Le texte s'appuie sur des faits : devis, 7 h sur site, J+15, 11 minutes par semaine.

Quatre défauts reviennent et méritent une passe avant la mise en ligne :

1. Le mot « outil » désigne deux choses différentes (STE, un terme un sens).
2. Huit groupes de trois, hors décisions déjà prises (règle maison).
3. Des « on » et des tournures pronominales cachent qui agit (règle 4).
4. Six phrases dépassent 25 mots sur la page entreprises et cinq sur la page écoles, dont la garantie des 30 jours (34 et 40 mots).

| Contrôle | Entreprises | Écoles | CGV | Confidentialité |
|---|---|---|---|---|
| Phrases de plus de 25 mots | 6 | 5 | 13 | 4 |
| Paragraphes de plus de 5 phrases | 0 | 0 | 0 | 0 |
| Tirets et oppositions-corrections | 0 | 0 | 0 | 0 |
| Passifs relevés | 2, dans des citations de prospects | 3 | 14 | 4 |

## 1. Un terme, un sens

**« Outil » a deux sens.** Le mot désigne ce que chaque personne construit pendant la journée (« Un outil par personne »). Il désigne aussi l'assistant IA du marché : « La journée se fait avec l'outil que votre entreprise autorise », « J'anonymise chaque dossier avant qu'il entre dans l'outil ». Dans « L'outil prend la part répétitive de l'écrit », le lecteur ne sait pas lequel des deux agit. Proposition : garder « outil » pour ce que la personne construit et écrire « l'IA » ou « l'assistant IA » pour le produit du marché.

| Où | Avant | Après |
|---|---|---|
| FAQ « interdits », les deux pages | « La journée se fait avec l'outil que votre entreprise autorise. » | « La journée se fait avec l'assistant IA que votre entreprise autorise. » |
| FAQ « confidentiels » | « J'anonymise chaque dossier avant qu'il entre dans l'outil. » | « J'anonymise chaque dossier avant qu'il entre dans l'IA. » |
| Déroulé, règles du matin | « Rien de ce qui identifie quelqu'un n'entre dans l'outil » | « Rien de ce qui identifie quelqu'un n'entre dans l'IA » |
| Déroulé, 9 h | « L'outil connaît alors votre métier. » | « L'IA connaît alors votre métier. » |
| Bio, les deux pages | « je sais comment ces outils fonctionnent de l'intérieur » | « je sais comment fonctionnent ces assistants IA » ; l'expression « de l'intérieur » revient aussi deux lignes plus haut |

Autres écarts du même type :

- **« Séance »** désigne sur /ecoles les séances de 3 h du Parcours Révisions IA et les visios (« Deux séances de 1 h 30 à J+15 et à J+45 »). Après : « Deux visios de 1 h 30 à J+15 et à J+45 », sur les deux pages.
- **« Élèves » et « étudiants »** alternent sur /ecoles pour le même public. Le titre de l'onglet et le haut de page disent « vos étudiants », la charte dit « vos équipes et vos étudiants », tandis que le Sprint, la FAQ et la description disent « élèves ». Proposition : « élèves » partout, ou « élèves et étudiants » posé une fois puis gardé tel quel.
- **« Le jour de la formation »** apparaît dans le comparatif entreprises, alors que le reste de la page dit « la journée ». Après : « Avant midi, pendant la journée ».
- **« 7 h sur site avec 5 personnes »** laisse croire à cinq personnes exactement, alors que le reste de la page dit « de 1 à 5 personnes » et « 5 personnes au plus ». Après : « 7 h sur site avec 5 personnes au plus ».
- **« Dossiers » et « documents »** désignent la même matière : « La journée sur vos dossiers », puis « sur vos documents réels anonymisés ». Après : « sur vos dossiers réels anonymisés ».
- **« J'anonymise »** sur la page entreprises devient « On anonymise » sur /ecoles. Après : « J'anonymise chaque support avant de l'utiliser. »

## 2. Groupes de trois

| Où | Avant | Après |
|---|---|---|
| Bio, les deux pages (27 mots) | « L'IA fait partie de mon travail de dirigeant depuis quatre ans, sur la veille des appels d'offres, le suivi de production et les contenus commerciaux. » | « L'IA fait partie de mon travail de dirigeant depuis quatre ans. Je m'en sers pour la veille des appels d'offres et le suivi de production. » Ou bien un quatrième usage réel entre dans la liste. |
| Bio, les deux pages | « Je peux vous dire pourquoi l'IA se trompe, où lui faire confiance et comment la régler sur votre métier. » | « Je peux vous dire pourquoi l'IA se trompe et comment la régler sur votre métier. » |
| Fiches des six agents | « Fonctionne avec Claude, ChatGPT ou Gemini. » | Ajouter un quatrième assistant si les agents y tournent vraiment, par exemple Le Chat de Mistral ou Copilot [à vérifier]. Sinon : « Fonctionne avec l'assistant IA de votre choix. » |
| /ecoles, carte du Parcours Révisions IA et introduction | « bac, BTS ou partiels » | « du bac aux partiels » |
| FAQ « Une journée, ça suffit ? » | « La journée lance le travail sur vos vrais dossiers. Les deux visios et la mesure de J+30 prolongent le travail. Les trois mois de suivi Signature prennent ensuite le relais quand vous signez le devis sous 7 jours. » | « La journée lance le travail sur vos vrais dossiers, puis les deux visios et la mesure de J+30 le prolongent jusqu'à J+45. Si vous signez le devis sous 7 jours, les trois mois de suivi Signature prennent la suite. » |
| FAQ « remplacer mes salariés » | « L'outil prend la part répétitive de l'écrit. La personne garde son savoir-faire et la décision. Le temps gagné revient au client et au terrain. » | « L'outil prend la part répétitive de l'écrit, et la personne garde son savoir-faire et la décision. Le temps gagné revient au client et au terrain. » |
| Déroulé, 16 h 15 | « On reprend les problèmes posés dans la journée et les solutions trouvées. Chaque personne note son premier gain. On fixe les dates des deux visios. » | « Nous reprenons les problèmes de la journée et leurs solutions. Chaque personne note son premier gain, puis nous fixons les dates des deux visios. » |
| Déroulé, le premier gain | « Chaque personne traite un vrai dossier avec l'IA. On compare le temps passé au temps habituel. Le premier gain se voit avant midi. » | « Chaque personne traite un vrai dossier avec l'IA et compare le temps passé au temps habituel. Le premier gain se voit avant midi. » |

Rythme : dans le déroulé, cinq étapes de suite comptent exactement trois phrases, de « Votre objectif, puis les règles » à « Les outils en service ». Les deux dernières corrections du tableau cassent cette série.

Gardés parce que ce sont tes décisions : les trois formules à l'année, les trois agents du Parcours Révisions IA et le titre « Trois garanties » sur /ecoles.

## 3. Qui agit

| Où | Avant | Après |
|---|---|---|
| Déroulé, 9 h | « On règle les consignes permanentes et la mémoire. On relie le compte à votre messagerie et à vos documents. » | « Nous réglons les consignes permanentes et la mémoire, puis nous relions le compte à votre messagerie et à vos documents. » Si tu le fais seul, écris « Je ». |
| Visios de déblocage, les deux pages | « Chacun envoie ce qui coince la veille et on le règle écran partagé. » On peut lire « ce qui coinçait la veille ». | « La veille, chacun envoie ce qui coince. Nous le réglons en partage d'écran. » |
| FAQ « Faut-il savoir coder ? » | « Les outils se construisent en français, dans une conversation. » | « Vous construisez vos outils en français, dans une conversation. » |
| FAQ « L'IA se trompe. » | « Chaque outil se teste sur un cas réel et la personne relit tout ce qui sort. L'IA prépare et la personne décide. » | « La personne teste son outil sur un cas réel, puis relit tout ce qui sort avant de s'en servir. » La maxime finale sort, car c'est une morale de fin. |
| FAQ « perdre l'habitude de réfléchir » | « Chaque conversation commence par l'objectif fixé par la personne. L'outil prépare le premier jet et la personne garde la décision. » | « La personne fixe l'objectif au début de chaque conversation. L'outil prépare le premier jet et elle décide. » |

« La personne garde la décision » revient dans trois réponses de suite. Une seule suffit.

## 4. Phrases trop longues

| Où | Mots | Après |
|---|---|---|
| Garantie des 30 jours, entreprises et CGV | 34 | « 30 jours après la journée, si une personne de votre équipe gagne moins d'une heure par semaine, je reviens travailler avec elle. Sans frais, jusqu'à ce qu'elle y arrive. » |
| Garantie des 30 jours, écoles et CGV | 40 | « 30 jours après la journée, si une personne gagne moins d'une heure par semaine sur ses cours ou son administratif, je reviens travailler avec elle. Sans frais, jusqu'à ce qu'elle y arrive. » |
| Conditions de la garantie, les deux pages | 27 | Une liste à puces de quatre conditions. |
| Fiche Tom | 26 | « Tom analyse votre activité. Il vous rend un document de stratégie complet : l'offre, la recherche de clients, les prix et les ventes complémentaires. » Cette version retire aussi le cliché « passer au crible ». |
| Certificat Harvard, les deux pages | 31 | « Le cours d'intelligence artificielle de l'université Harvard, suivi sur edX. Il couvre la recherche, le raisonnement, les probabilités, l'optimisation, l'apprentissage automatique, les réseaux de neurones et le traitement du langage. Des projets à coder en Python complètent les cours. » |
| Note sous le tableau du seuil | 26 | « Coût employeur calculé avec le modèle de l'URSSAF, règles au 1er juillet 2026 : CDI non-cadre à temps plein, entreprise de 20 salariés. » |
| /ecoles, bonus du pack | 32 | « Le Parcours en autonomie dans toutes vos classes : une visio de 1 h 30 et la fiche enseignant. Votre référent IA refait ensuite les deux séances avec chaque classe. » |
| /ecoles, la classe de BTS | 28 | « J'ai préparé une classe de BTS MCO à son oral avec l'IA. Au programme : les questions types du jury, puis un entraînement avec un retour sur chaque passage. » |

La garantie figure mot pour mot dans les CGV : si tu changes sa formulation, il faut changer les deux textes ensemble. « Gagne moins d'une heure » dit la même chose que « ne gagne pas au moins une heure ».

## 5. Images, mots vides, répétitions

- **Signature en haut de page** : « L'IA simplifiée, taillée sur mesure » (entreprises, CGV, confidentialité). « Sur mesure » est la formule toute faite du conseil. Ton métier de couture lui donnerait du sens, mais le lecteur ne le connaît pas encore quand il lit le haut de page. Proposition : « L'IA réglée sur vos dossiers », qui reprend la promesse de la page. Sur /ecoles, « taillée pour vos classes » devient « L'IA réglée sur vos cours ». Ce point reste au choix, car la latitude est moyenne.
- **« Étape essentielle »** (déroulé, 9 h) : l'adjectif ne dit rien, et l'étape se termine déjà par la raison. Proposition : retirer l'étiquette, ou écrire « Sans elle, l'IA ignore votre métier ».
- **« C'est ce qui la rend autonome ensuite. »** (Un outil par personne) : phrase-bilan alors que le fait suffit. Après : « Ensuite, elle corrige son outil seule. »
- **« Il en dit long sur la personne qui le lance. »** (bonus introspection) : formule toute faite, et le lecteur ignore ce que le prompt produit. Proposition : dire ce qu'il rend, [à fournir].
- **« Une attente claire au départ, et on ne part pas dans tous les sens. »** (règle n° 1, les deux pages). Après : « Une attente claire au départ garde l'échange sur son sujet. »
- **« La pratique régulière vous fait aller plus loin avec l'IA. »** (Après la journée) : abstrait. Après : « Les formules à l'année vous donnent un cadre et des rendez-vous fixes pour régler les blocages et cadrer les nouveaux projets. »
- **« L'Accélérateur IA 30 jours s'adresse aux PME du Grand Est. »** répète le surtitre « Formation IA pour les PME du Grand Est ». À couper.
- **« les leçons que j'ai tirées des livres de stratégie que j'ai étudiés »** (Tom, et Paul pour la vente) enchaîne deux relatives. Après : « les leçons que j'ai tirées des livres de stratégie ».
- **« 10 h de temps gagné chaque semaine »** : « h » dit déjà qu'il s'agit de temps. Après : « 10 h gagnées chaque semaine par la dirigeante formée le 8 septembre 2026 en Moselle ». Plus bas, la même donnée s'écrit « 10 heures ».
- **Phrases répétées dans la FAQ entreprises** : « La journée se fait avec l'outil que votre entreprise autorise » revient dans deux réponses (« interdits » et « abonnements »). « J'anonymise chaque dossier avant qu'il entre dans l'outil » revient aussi dans deux réponses (« interdits » et « confidentiels »). Garder chaque phrase dans une seule réponse. Même chose sur /ecoles pour « l'outil que votre établissement autorise ».

## 6. Ambiguïtés de lecture

| Où | Avant | Après |
|---|---|---|
| Le prompt qui écrit vos prompts, les deux pages | « Vous décrivez la tâche comme à un collègue. Il vous pose ses questions… » : « Il » renvoie au collègue, le nom le plus proche. | « Le prompt vous pose ses questions, puis écrit la consigne complète à donner à l'IA. » |
| Charte IA, /ecoles | « Les règles d'usage de l'IA pour vos équipes et vos étudiants. Elle exclut toute donnée personnelle… » : « Elle » n'a pas d'antécédent au singulier. | « La charte fixe les règles d'usage de l'IA pour vos équipes et vos élèves. Elle exclut toute donnée personnelle et arrive prête à valider. » |
| Déroulé, J+30 | « Sous une heure par semaine, je reviens sans frais travailler avec la personne. » | « Si le gain reste sous une heure par semaine, je reviens travailler avec elle sans frais. » |
| FAQ données, /ecoles | « Personne ne saisit de donnée personnelle d'élève ou de personnel » : « personne » revient trois fois. | « Pendant les séances, aucune donnée personnelle d'élève ou de membre du personnel n'entre dans l'IA. » |

## 7. Anglicismes et jargon

- « votre pitch, le débrief de l'appel » (fiche Paul) devient « votre présentation, le bilan de l'appel ».
- « COO d'IFS » : sigle anglais pour un dirigeant de PME lorrain. « Directeur des opérations d'IFS » le traduit. Ce point reste à ton choix.
- « DTF » dans la bio est un sigle du métier textile que le lecteur ignore. Tu peux le retirer de la liste sans perte, car elle garde quatre éléments.
- Gardés : « prompt », parce que tes prospects l'emploient eux-mêmes (« Il faut savoir écrire des prompts ») ; « coaching », parce que c'est l'activité de ta cliente ; « au niveau de l'examen » (Luna), parce que l'expression désigne ici un vrai niveau.

## 8. CGV et confidentialité

Les phrases longues tiennent surtout à l'identification de la société et aux mentions légales (article L441-10, article 28 du RGPD). La précision juridique passe avant le plafond (règle 6). Le passif peut céder la place à l'actif là où l'acteur compte :

| Avant | Après |
|---|---|
| « Les présentes conditions générales de vente (CGV) sont proposées par Industrie Française de Sellerie (IFS), SARL au capital… » (51 mots) | « Industrie Française de Sellerie (IFS) propose les présentes conditions générales de vente (CGV). » Puis l'identification de la société dans une deuxième phrase. |
| « La journée équipe de l'Accélérateur IA 30 jours est facturée au forfait » | « IFS facture la journée équipe de l'Accélérateur IA 30 jours au forfait » |
| « L'acompte versé est remboursé. » (deux fois) | « IFS rembourse l'acompte. » |
| « La journée est alors reportée à une date convenue entre les parties. » | « Les parties conviennent alors d'une nouvelle date. » |

Confidentialité : « refuse tout aussi simplement » reste. L'adverbe dit que refuser est aussi simple qu'accepter, et c'est l'information utile.

## Non couvert

- Le texte des vidéos et des images.
- Le contenu des devis et des mails envoyés après l'audit.

## Suite donnée le 30 octobre 2026

Appliqué sur la branche locale, avec tes corrections :

- L'anonymisation revient à l'équipe du client : « Votre équipe anonymise chaque dossier avant qu'il entre dans l'IA » côté entreprises, « Votre équipe anonymise chaque support avant de l'utiliser » côté écoles.
- /ecoles dit « étudiants » partout, article 10 des CGV compris.
- La bio liste tes usages : suivi de production, tri des mails jusqu'à la boîte vide, veille des appels d'offres, contenus poussés, outils personnalisés pour les collaborateurs.
- Les six agents fonctionnent « avec Claude ou ChatGPT ».
- La signature « L'IA simplifiée, taillée sur mesure » reste telle quelle.
- L'étiquette « Étape essentielle » et l'étape « Bonus : l'introspection » sont retirées.
- « C'est ce qui la rend autonome ensuite » devient « Après la journée, elle sait le régler seule » : la version proposée répétait « corrige » juste après « le corrige elle-même ».
- Toutes les autres propositions sont appliquées.
- La FAQ « ChatGPT et Claude sont interdits chez nous » et son équivalent sur /ecoles disent maintenant que tu travailles avec Claude ou ChatGPT, puis comment la journée répond à la crainte pour les données.
- Le Parcours Révisions IA vise les « classes d'examen du supérieur » : la mention du bac est retirée.
