// Configuration unique du site antoinecontino.fr.
// Chaque prix, valeur et condition affichés sur les pages vient d'ici.
// Après une modification, lancer : node build.mjs (les pages de site/ sont régénérées et vérifiées).

const personnes_max = 5;

export default {
  // ---------- Offre principale ----------
  // Nom construit avec la formule M-A-G-I-C ($100M Offers, ch. 16, p. 174-178) : container « Sprint » + goal « l'heure gagnée ».
  // Écrit sans article : les pages ajoutent « le » ou « Le » selon la phrase.
  nom_offre: 'Sprint de l’heure gagnée',
  avatar: 'PME du Grand Est',
  prix_journee_equipe_ht: 4900,          // € HT, forfait de la journée équipe
  tva: 20,                               // %, le TTC est calculé par le build (4 900 € HT donnent 5 880 € TTC)
  personnes_max,                         // participants au plus par journée
  valeur_totale_pile: 13850,             // €, le build vérifie qu'elle égale la somme des valeurs de la pile
  capacite: 2,                           // journées équipe par mois
  places_restantes: '',                  // vide : la ligne reste masquée ; sinon un nombre, par exemple 1
  essentiel_ht_an: 1200,                 // € HT par an
  signature_ht_an: 3600,                 // € HT par an
  prestige: 'Sur échange, deux clients au plus',
  delai_bonus_jours: 7,                  // jours après l'audit pendant lesquels le bonus des trois mois de suivi reste offert
  lien_rdv: 'https://calendly.com/antoine-cntno/30min',

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
    { nom: 'Carte des heures perdues', base: false, valeur: 700,
      detail: 'Un tableur que chaque personne remplit avant la journée. Je lis vos documents types et je chiffre les heures à reprendre tâche par tâche.',
      regle: 'L’IA ne vaudra pas le prix.' },
    { nom: 'La journée sur vos dossiers', base: true, valeur: 3500,
      detail: `7 h sur site avec ${personnes_max} personnes, sur vos documents réels anonymisés.`,
      regle: 'Les exemples génériques, il faut les transposer seul.' },
    { nom: 'Un outil par personne', base: false, valeur: 7000,
      detail: 'Chaque personne repart avec son outil, en service le soir même.',
      regle: 'Les résultats prendront des mois.' },
    { nom: 'Kit feu vert DSI', base: false, valeur: 700,
      detail: 'Une charte d’usage prête à signer et la fiche d’anonymisation. Votre DSI coche les réglages à vérifier et valide.',
      regle: 'Les outils sont interdits, nos documents sont confidentiels.' },
    { nom: 'Le prompt qui écrit vos prompts', base: false, valeur: 450,
      detail: 'Vous décrivez la tâche comme à un collègue. Il vous pose ses questions puis écrit la consigne complète à donner à l’IA.',
      regle: 'Il faut savoir écrire des prompts.' },
    { nom: 'Deux visios de déblocage', base: false, valeur: 600,
      detail: 'Deux séances de 1 h 30 à J+15 et à J+45. Chacun envoie ce qui coince la veille et on le règle écran partagé.',
      regle: 'Après une formation, tout retombe.' },
    { nom: 'Trois mois de suivi Signature', base: false, valeur: 900, limite: true,
      detail: 'Une visio par mois pendant trois mois à date fixe. Chaque mois a son objectif et part du compteur.',
      regle: 'Après une formation, tout retombe.' },
  ],

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
