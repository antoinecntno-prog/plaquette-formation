// Configuration unique du site antoinecontino.fr.
// Chaque prix, valeur et condition affichés sur les pages vient d'ici.
// Après une modification, lancer : node build.mjs (les pages de site/ sont régénérées et vérifiées).

const personnes_max = 5;
const personnes_atelier_ecoles = 5;

export default {
  // ---------- Offre principale ----------
  // Nom construit avec la formule M-A-G-I-C ($100M Offers, ch. 16, p. 174-178) : container « Accélérateur » + interval « 30 jours », choisi par Antoine le 12/10/2026.
  // Écrit sans article : les pages ajoutent « l’ » ou « L’ » selon la phrase.
  nom_offre: 'Accélérateur IA 30 jours',
  avatar: 'PME du Grand Est',
  prix_journee_equipe_ht: 4900,          // € HT, forfait de la journée équipe
  tva: 20,                               // %, le TTC est calculé par le build (4 900 € HT donnent 5 880 € TTC)
  personnes_max,                         // participants au plus par journée
  valeur_totale_pile: 14600,             // €, le build vérifie qu'elle égale la somme des valeurs de la pile (une valeur null reste à fournir et ne compte pas)
  capacite: 2,                           // journées équipe par mois
  places_restantes: '',                  // vide : la ligne reste masquée ; sinon un nombre, par exemple 1
  essentiel_ht_an: 1200,                 // € HT par an
  signature_ht_an: 3600,                 // € HT par an
  prestige: 'Sur échange, deux clients au plus',
  delai_bonus_jours: 7,                  // jours après l'audit pendant lesquels le bonus des trois mois de suivi reste offert
  lien_rdv: 'https://calendly.com/antoine-cntno/30min',

  // Cookies de mesure. Chaque outil se charge seulement si le visiteur accepte sa famille dans le bandeau cookies.
  meta_pixel_id: '',                     // famille « Publicité » : identifiant du pixel Meta ; vide : aucun script Meta chargé
  ga_id: '',                             // famille « Mesure d'audience » : identifiant Google Analytics 4 (G-XXXXXXX) ; vide : aucun script Google chargé
  duree_consentement_mois: 6,            // durée de validité du choix fait dans le bandeau, puis le bandeau revient

  // Seuil de rentabilité affiché avec son calcul, une ligne par salaire net mensuel.
  // cout_employeur : coût total employeur par mois, calculé avec le modèle de l'URSSAF
  // (paquet modele-social 11.1.0 du 16/07/2026, celui du simulateur mon-entreprise.urssaf.fr),
  // CDI non-cadre à temps plein, entreprise de 20 salariés, règles au 1er juillet 2026.
  salaires: [
    { net: 2000, cout_employeur: 3241 },
    { net: 2500, cout_employeur: 4304 },
    { net: 3000, cout_employeur: 5304 },
    { net: 5000, cout_employeur: 9093 },
  ],
  heures_mensuelles: 151.67,             // heures payées par mois pour 35 h par semaine
  semaines_travaillees: 46,              // semaines par an
  hypotheses_salaires: 'CDI non-cadre à temps plein dans une entreprise de 20 salariés, règles au 1er juillet 2026',

  // La pile, dans l'ordre de l'offre. base: true pour l'offre de base, false pour un bonus.
  pile: [
    { nom: 'La journée sur vos dossiers', base: true, valeur: 3500,
      detail: `7 h sur site avec ${personnes_max} personnes, sur vos documents réels anonymisés. Chacun repart avec son outil, en service le soir même.`,
      regle: 'Les exemples génériques, il faut les transposer seul.' },
    { nom: 'Le prompt qui écrit vos prompts', base: true, valeur: 1400,
      detail: 'Vous décrivez la tâche comme à un collègue. Il vous pose ses questions puis écrit la consigne complète à donner à l’IA.',
      regle: 'Il faut savoir écrire des prompts.' },
    { nom: 'Tom, votre agent IA stratégie', base: false, valeur: 3000,
      detail: 'Tom passe votre activité au crible et vous rend un document de stratégie complet : l’offre, la recherche de clients, les prix et les ventes complémentaires. Chaque recommandation est justifiée. Il applique les leçons que j’ai tirées des livres de stratégie que j’ai étudiés. Fonctionne avec Claude, ChatGPT ou Gemini.',
      regle: 'Nos ventes plafonnent.' },
    { nom: 'Charlie, votre agent IA textes de vente', base: false, valeur: 3000,
      detail: 'Charlie écrit ou corrige vos pages de vente, publicités, mails, séquences de lancement, posts et scripts vidéo. Il corrige un texte en listant chaque modification avec sa règle. Il écrit une pièce seule ou tout le kit de lancement à partir de la stratégie de Tom. Fonctionne avec Claude, ChatGPT ou Gemini.',
      regle: 'On ne sait pas vendre par écrit.' },
    { nom: 'Paul, votre agent IA rendez-vous de vente', base: false, valeur: 1500,
      detail: 'Paul prépare vos rendez-vous, votre pitch, le débrief de l’appel et des jeux de rôle où il joue le prospect. Il applique les leçons que j’ai tirées des livres de vente que j’ai étudiés. Fonctionne avec Claude, ChatGPT ou Gemini.',
      regle: 'Les prospects disent qu’ils vont réfléchir.' },
    { nom: 'Carte des heures perdues', base: false, valeur: 700,
      detail: 'Un tableur que chaque personne remplit avant la journée. Je lis vos documents types et je chiffre les heures à reprendre tâche par tâche.',
      regle: 'L’IA ne vaudra pas le prix.' },
    { nom: 'Deux visios de déblocage', base: false, valeur: 600,
      detail: 'Deux séances de 1 h 30 à J+15 et à J+45. Chacun envoie ce qui coince la veille et on le règle écran partagé.',
      regle: 'Après une formation, tout retombe.' },
    { nom: 'Trois mois de suivi Signature', base: false, valeur: 900, limite: true,
      detail: 'Une visio par mois pendant trois mois à date fixe. Chaque mois a son objectif.',
      regle: 'Après une formation, tout retombe.' },
  ],

  // ---------- Page /ecoles : offres aux établissements d'enseignement ----------
  // Valeurs recommandées le 14/10/2026, encore à valider par Antoine.
  // Le build vérifie que chaque pile égale son total et que le prix des deux ensemble égale la somme des deux prix (aucune remise).
  ecoles: {
    nom_atelier: 'L’Atelier Une Heure, édition établissements',
    nom_atelier_court: 'L’Atelier Une Heure',
    nom_sprint: 'Sprint Examen',
    prix_atelier_ht: 3900,               // € HT, la journée
    personnes_atelier: personnes_atelier_ecoles, // personnes au plus par journée
    valeur_atelier: 11350,               // €, somme de pile_atelier
    prix_sprint_ht: 2400,                // € HT, par classe
    eleves_sprint: 30,                   // élèves au plus par classe
    valeur_sprint: 3300,                 // €, somme de pile_sprint ; valeur des trois agents proposée à 700 € chacun, comme le kit étudiant qu'ils remplacent, à valider
    prix_les_deux_ht: 6300,              // € HT, l'Atelier et le Sprint ensemble
    mois_suivi_les_deux: 6,              // mois de suivi Signature quand l'établissement prend les deux
    capacite: 2,                         // journées écoles par mois
    date_limite_printemps: '',           // vide : la ligne d'urgence des classes d'examen reste masquée ; sinon par exemple « 15 janvier 2027 »
    resultat_bts_mco: '',                // vide : le résultat chiffré de la classe de BTS MCO reste masqué
    lien_rdv: 'https://calendly.com/antoine-cntno/30min',

    // Dans l'ordre de l'offre. base: true pour l'offre de base, false pour un bonus.
    pile_atelier: [
      { nom: 'Carte des heures perdues', base: false, valeur: 700,
        detail: 'Avant la journée, chaque personne liste ses tâches de cours et d’administratif. Je chiffre les heures à reprendre.',
        regle: 'Nous n’avons pas de budget identifié.' },
      { nom: 'La journée sur vos supports', base: true, valeur: 3500,
        detail: `7 h dans vos locaux avec ${personnes_atelier_ecoles} personnes au plus, sur vos supports de cours.`,
        regle: 'Préparer un cours me prend mes soirées.' },
      { nom: 'Un outil par personne', base: true, valeur: 4500,
        detail: 'Chaque personne construit son outil sur la tâche qu’elle a choisie. Il est en service le soir même.',
        regle: 'Les résultats tardent.' },
      { nom: 'Charte IA de l’établissement', base: false, valeur: 700,
        detail: 'Les règles d’usage de l’IA pour vos équipes et vos étudiants. Elle exclut toute donnée personnelle et arrive prête à valider.',
        regle: 'Les données des élèves sont confidentielles.' },
      { nom: 'Le prompt qui écrit vos prompts', base: false, valeur: 450,
        detail: 'Vous décrivez la tâche comme à un collègue. Il vous pose ses questions puis écrit la consigne complète à donner à l’IA.',
        regle: 'Il faut savoir écrire des prompts.' },
      { nom: 'Deux visios de déblocage', base: false, valeur: 600,
        detail: 'Deux séances de 1 h 30 à J+15 et à J+45. Chacun envoie ce qui coince la veille et on le règle écran partagé.',
        regle: 'Après une formation, tout retombe.' },
      { nom: 'Trois mois de suivi Signature pour le référent IA', base: false, valeur: 900,
        detail: 'Une visio par mois à date fixe pendant trois mois avec votre référent IA.',
        regle: 'Après une formation, tout retombe.' },
    ],
    pile_sprint: [
      { nom: 'Séance 1, la méthode', base: true, valeur: 600,
        detail: 'Préparée avec l’enseignant sur le programme de l’examen. Chaque élève apprend à tirer de ses cours des fiches et des quiz avec l’IA. Durée : 3 h.' },
      { nom: 'Séance 2, l’entraînement', base: true, valeur: 600,
        detail: 'Chaque élève révise un vrai chapitre de son programme avec ses fiches et ses quiz. On reprend ensemble ce qui coince. Durée : 3 h.' },
      { nom: 'Luna, l’agent IA des fiches de révision', base: false, valeur: 700,
        detail: 'Luna lit un cours ou un chapitre et en tire une fiche de révision claire, au niveau de l’examen. Fonctionne avec Claude, ChatGPT ou Gemini.',
        regle: 'Faire mes fiches me prend des heures.' },
      { nom: 'Emy, l’agent IA des quiz', base: false, valeur: 700,
        detail: 'Emy crée des quiz à partir des fiches ou des cours, avec la correction de chaque réponse. Fonctionne avec Claude, ChatGPT ou Gemini.',
        regle: 'Je relis mes cours sans savoir si je les retiens.' },
      { nom: 'Alex, l’agent IA des cartes d’apprentissage', base: false, valeur: 700,
        detail: 'Alex transforme un cours en cartes question et réponse. L’élève les revoit à intervalles réguliers jusqu’à l’examen. Fonctionne avec Claude, ChatGPT ou Gemini.',
        regle: 'J’oublie tout le jour de l’examen.' },
    ],
  },

  // ---------- Conditions générales de vente ----------
  acompte: '50 % à la signature du devis, solde à l’issue de la journée',
  delai_paiement: '30 jours à réception de facture',
  annulation_report: 'report ou annulation sans frais jusqu’à 15 jours avant la journée ; passé ce délai, l’acompte reste dû',
  frais_deplacement: 'inclus dans la région Grand Est ; hors Grand Est, facturés au réel sur justificatif',
  duree_accompagnement: '12 mois, sans tacite reconduction ; renouvellement sur proposition écrite à l’échéance',
  tribunal_competent: 'tribunal de commerce d’Épinal',

  // ---------- Politique de confidentialité ----------
  conservation_prospects: '3 ans après le dernier contact',
  date_effet_pages_legales: '',          // vide : date du jour de la génération ; régénérer le jour de la mise en ligne

  // ---------- Identité de la société (mentions légales du site) ----------
  societe: {
    raison_sociale: 'Industrie Française de Sellerie (IFS)',
    forme: 'SARL au capital de 5 000 €',
    siege: '74 route d’Épinal, 88390 Uxegney',
    rcs: 'RCS Épinal 537 679 441',
    tva_intra: 'FR18 537 679 441',
    email: 'antoine.cntno@gmail.com',
    telephone: '06 37 26 46 25',
    telephone_lien: '+33637264625',
    hebergeur: 'Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, États-Unis',
    directeur_publication: 'Antoine Contino',
  },

  domaine: 'https://antoinecontino.fr',
};
