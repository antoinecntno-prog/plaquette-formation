// Génère les pages de site/ depuis src/pages, src/partials et src/config.mjs, puis vérifie le résultat.
// Usage : node build.mjs
// Syntaxe des gabarits : {{cle}} texte échappé, {{{cle}}} HTML brut, {{> partiel}}, {{#si cle}}…{{/si}}.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './src/config.mjs';

const RACINE = dirname(fileURLToPath(import.meta.url));
const SRC = join(RACINE, 'src');
const SORTIE = join(RACINE, 'site');
const erreurs = [];

// ---------- Mise en forme ----------
const nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const euros = (n) => `${nombre.format(n).replace(/\u202F/g, '\u00A0')}\u00A0€`;
const echapper = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const insecables = (s) => s.replace(/ (€|%|h\b|:|;|\?|!)/g, ' $1');
const insecablesNombres = (s) => insecables(s)
  .replace(/(\d) (?=\d{3}\b)/g, '$1 ')            // 5 000 ; 537 679 441
  .replace(/\b(\d{2}) (?=\d{2}\b)/g, '$1 ')        // 06 37 26 46 25
  .replace(/\b(\d{5}) /g, '$1 ')                    // 88390 Uxegney
  .replace(/(\d) (jours?|ans?|mois|minutes?|personnes?)\b/g, '$1 $2');
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const enLettres = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];

// ---------- Valeurs dérivées ----------
const c = config;
const ttc = c.prix_journee_equipe_ht * (1 + c.tva / 100);
const sommePile = c.pile.reduce((t, e) => t + (e.valeur ?? 0), 0);
const aFournir = c.pile.filter((e) => e.valeur == null).map((e) => e.nom);
if (sommePile !== c.valeur_totale_pile) {
  erreurs.push(`La somme des valeurs de la pile (${sommePile} €) diffère de valeur_totale_pile (${c.valeur_totale_pile} €).`);
}
// Seuil : prix HT ÷ coût de l'heure ÷ personnes ÷ semaines, pour chaque salaire net de la config.
const lignesSeuil = c.salaires.map((l) => {
  const heure = l.cout_employeur / c.heures_mensuelles;
  const minutes = Math.round((c.prix_journee_equipe_ht / heure / c.personnes_max / c.semaines_travaillees) * 60);
  return { ...l, heure, minutes };
});
const seuilMax = Math.max(...lignesSeuil.map((l) => l.minutes));

const aujourdHui = new Date();
const dateEffetIso = c.date_effet_pages_legales || aujourdHui.toISOString().slice(0, 10);
const dateEffet = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
  .format(new Date(`${dateEffetIso}T12:00:00Z`));

const places = String(c.places_restantes ?? '').trim();
const bonus = c.pile.filter((e) => !e.base);
const base = c.pile.filter((e) => e.base);

// Page /ecoles : piles, totaux et prix TTC, tous tirés de c.ecoles.
const e = c.ecoles;
const avecTva = (ht) => ht * (1 + c.tva / 100);
const somme = (pile) => pile.reduce((t, x) => t + (x.valeur ?? 0), 0);
if (somme(e.pile_atelier) !== e.valeur_atelier) erreurs.push(`ecoles : la pile de l’Atelier fait ${somme(e.pile_atelier)} €, valeur_atelier vaut ${e.valeur_atelier} €.`);
if (somme(e.pile_sprint) !== e.valeur_sprint) erreurs.push(`ecoles : la pile du Sprint fait ${somme(e.pile_sprint)} €, valeur_sprint vaut ${e.valeur_sprint} €.`);
if (e.prix_les_deux_ht !== e.prix_atelier_ht + e.prix_sprint_ht) erreurs.push(`ecoles : prix_les_deux_ht (${e.prix_les_deux_ht} €) diffère de la somme des deux prix, alors qu’aucune remise n’est prévue.`);
const dateLimite = String(e.date_limite_printemps ?? '').trim();
const resultatBts = String(e.resultat_bts_mco ?? '').trim();

const s = c.societe;
const v = {
  nom_offre: c.nom_offre,
  lien_rdv: c.lien_rdv,
  domaine: c.domaine,
  prix_ht: euros(c.prix_journee_equipe_ht),
  prix_ttc: euros(ttc),
  tva: `${c.tva} %`,
  personnes_max: String(c.personnes_max),
  valeur_totale: euros(c.valeur_totale_pile),
  capacite: `${c.capacite} ${c.capacite > 1 ? 'journées' : 'journée'} équipe par mois`,
  places_restantes: places,
  places_texte: places ? `${Number(places) > 1 ? 'Places restantes' : 'Place restante'} ce mois-ci : ${places}` : '',
  essentiel: `${euros(c.essentiel_ht_an)} HT par an`,
  signature: `${euros(c.signature_ht_an)} HT par an`,
  prestige: c.prestige,
  prestige_min: c.prestige.charAt(0).toLowerCase() + c.prestige.slice(1),
  delai_bonus: `${c.delai_bonus_jours} jours`,
  avatar: c.avatar,
  meta_pixel_id: c.meta_pixel_id || '',
  ga_id: c.ga_id || '',
  duree_consentement: `${c.duree_consentement_mois} mois`,
  duree_consentement_mois: String(c.duree_consentement_mois),
  semaines: String(c.semaines_travaillees),
  heures_mensuelles: nombre.format(c.heures_mensuelles),
  hypotheses_salaires: c.hypotheses_salaires,
  seuil_titre: seuilMax <= 60 ? 'une heure par semaine au plus' : `${seuilMax} minutes par semaine au plus`,
  nb_bonus: enLettres[bonus.length] ?? String(bonus.length),
  acompte: insecables(c.acompte),
  delai_paiement: insecables(c.delai_paiement),
  annulation_report: insecables(c.annulation_report),
  Annulation_report: majuscule(insecables(c.annulation_report)),
  frais_deplacement: insecables(c.frais_deplacement),
  Frais_deplacement: majuscule(insecables(c.frais_deplacement)),
  duree_accompagnement: insecables(c.duree_accompagnement),
  tribunal_competent: c.tribunal_competent,
  conservation_prospects: insecables(c.conservation_prospects),
  date_effet: dateEffet,
  date_effet_iso: dateEffetIso,
  raison_sociale: s.raison_sociale,
  forme: insecables(s.forme),
  siege: s.siege,
  rcs: s.rcs,
  tva_intra: s.tva_intra,
  email: s.email,
  telephone: s.telephone,
  telephone_lien: s.telephone_lien,
  hebergeur: s.hebergeur,
  directeur_publication: s.directeur_publication,

  // Page /ecoles
  e_nom_atelier: e.nom_atelier,
  e_nom_atelier_court: e.nom_atelier_court,
  e_nom_sprint: e.nom_sprint,
  e_delai_bonus: `${c.delai_bonus_jours} jours`,
  e_lien_rdv: e.lien_rdv,
  e_prix_atelier_ht: euros(e.prix_atelier_ht),
  e_prix_atelier_ttc: euros(avecTva(e.prix_atelier_ht)),
  e_personnes_atelier: String(e.personnes_atelier),
  e_valeur_atelier: euros(e.valeur_atelier),
  e_prix_sprint_ht: euros(e.prix_sprint_ht),
  e_prix_sprint_ttc: euros(avecTva(e.prix_sprint_ht)),
  e_eleves_sprint: String(e.eleves_sprint),
  e_valeur_sprint: euros(e.valeur_sprint),
  e_prix_les_deux_ht: euros(e.prix_les_deux_ht),
  e_prix_les_deux_ttc: euros(avecTva(e.prix_les_deux_ht)),
  e_mois_suivi_les_deux: enLettres[e.mois_suivi_les_deux] ?? String(e.mois_suivi_les_deux),
  e_valeur_suivi_supp: euros(e.valeur_suivi_supplementaire),
  // Pile des deux offres : l'Accélérateur sans son suivi, puis les six mois de suivi sur une seule ligne.
  e_valeur_atelier_sans_suivi: euros(e.valeur_atelier - e.pile_atelier.find((x) => x.limite).valeur),
  e_valeur_suivi_six_mois: euros(e.pile_atelier.find((x) => x.limite).valeur + e.valeur_suivi_supplementaire),
  e_bonus_les_deux_nom: e.bonus_les_deux.nom,
  e_bonus_les_deux_detail: e.bonus_les_deux.detail,
  e_valeur_bonus_les_deux: euros(e.prix_sprint_ht),
  e_valeur_les_deux: euros(e.valeur_atelier + e.valeur_sprint + e.valeur_suivi_supplementaire + e.prix_sprint_ht),
  e_capacite: `${e.capacite} ${e.capacite > 1 ? 'journées' : 'journée'} écoles par mois`,
  e_date_limite: dateLimite,
  e_resultat_bts_mco: resultatBts,
  e_nb_bonus_atelier: enLettres[e.pile_atelier.filter((x) => !x.base).length],
  e_nb_bonus_sprint: enLettres[e.pile_sprint.filter((x) => !x.base).length],
};

for (const [k, val] of Object.entries(v)) {
  if (typeof val === 'string' && !/^(https?:|\+|mailto:)/.test(val) && !/^\d{4}-\d{2}-\d{2}$/.test(val)) v[k] = insecablesNombres(val);
}

// La pile détaillée des deux offres (/ecoles) doit retomber sur la valeur totale affichée.
{
  const suivi = e.pile_atelier.find((x) => x.limite).valeur;
  const lignes = (e.valeur_atelier - suivi) + e.valeur_sprint + (suivi + e.valeur_suivi_supplementaire) + e.prix_sprint_ht;
  if (lignes !== e.valeur_atelier + e.valeur_sprint + e.valeur_suivi_supplementaire + e.prix_sprint_ht) erreurs.push('ecoles : la pile détaillée des deux offres ne retombe pas sur la valeur totale');
}

// ---------- Fragments générés ----------
const carte = (e) => `<li class="pile-carte${e.base ? ' pile-base' : ''}">
     <p class="pile-type">${e.base ? 'Offre de base' : 'Bonus'}</p>
     <h4>${echapper(e.nom)}</h4>
     <p>${echapper(insecables(e.detail))}</p>
     <p class="pile-regle"><span>Ce que ça règle</span>«&#8239;${echapper(insecables(e.regle))}&#8239;»</p>${e.limite ? `
     <p class="pile-limite">Offert si vous signez le devis sous ${echapper(v.delai_bonus)}.</p>` : ''}
     <p class="pile-valeur">${e.valeur == null ? 'Valeur <strong>[à fournir]</strong>' : e.base ? `Valeur <strong>${euros(e.valeur)}</strong>` : `Valeur <s>${euros(e.valeur)}</s> <strong>Offert</strong>`}</p>
    </li>`;
// Carte d'une pile /ecoles : la ligne « Ce que ça règle » n'apparaît que si l'élément en a une.
const carteEcoles = (x) => `<li class="pile-carte${x.base ? ' pile-base' : ''}">
     <p class="pile-type">${x.base ? 'Offre de base' : 'Bonus'}</p>
     <h4>${echapper(x.nom)}</h4>
     <p>${echapper(insecablesNombres(x.detail))}</p>${x.regle ? `
     <p class="pile-regle"><span>Ce que ça règle</span>«&#8239;${echapper(insecables(x.regle))}&#8239;»</p>` : ''}${x.limite ? `
     <p class="pile-limite">Offert si vous signez le devis sous ${echapper(v.e_delai_bonus)}.</p>` : ''}
     <p class="pile-valeur">${x.base ? `Valeur <strong>${euros(x.valeur)}</strong>` : `Valeur <s>${euros(x.valeur)}</s> <strong>Offert</strong>`}</p>
    </li>`;
// Ligne du détail de la pile, dans le bloc du prix : l'élément et sa valeur.
const ligneDetail = (e) => `<li><span>${e.base ? '' : '<span class="pile-detail-bonus">Bonus</span>'}<strong>${echapper(e.nom)}</strong></span><span class="pile-detail-valeur">${e.valeur == null ? '[à fournir]' : euros(e.valeur)}</span></li>`;
const brut = {
  pile_detail: [...base, ...bonus].map(ligneDetail).join('\n    '),
  pile_base: base.map(carte).join('\n    '),
  pile_bonus: bonus.map(carte).join('\n    '),
  places_ligne: places ? `<p class="places">${echapper(v.places_texte)}.</p>` : '',
  e_pile_atelier_base: e.pile_atelier.filter((x) => x.base).map(carteEcoles).join('\n    '),
  e_pile_atelier_bonus: e.pile_atelier.filter((x) => !x.base).map(carteEcoles).join('\n    '),
  e_pile_sprint_base: e.pile_sprint.filter((x) => x.base).map(carteEcoles).join('\n    '),
  e_pile_sprint_bonus: e.pile_sprint.filter((x) => !x.base).map(carteEcoles).join('\n    '),
  e_cgv_atelier: e.pile_atelier.map((x) => `<li>${echapper(x.nom)}&nbsp;;</li>`).join('\n     ').replace(/&nbsp;;<\/li>$/, '.</li>'),
  e_cgv_sprint: e.pile_sprint.map((x) => `<li>${echapper(x.nom)}&nbsp;;</li>`).join('\n     ').replace(/&nbsp;;<\/li>$/, '.</li>'),
  seuil_lignes: lignesSeuil.map((l) => `<tr><th scope="row">${euros(l.net)}</th><td data-label="Coût de l’heure pour l’entreprise">${euros(Math.round(l.heure * 100) / 100)}</td><td data-label="Seuil par personne et par semaine"><strong>${l.minutes} minutes</strong></td></tr>`).join('\n     '),
};

// ---------- Gabarits ----------
const partiels = Object.fromEntries(
  readdirSync(join(SRC, 'partials')).map((f) => [f.replace(/\.html$/, ''), readFileSync(join(SRC, 'partials', f), 'utf8').trimEnd()]),
);

function rendre(gabarit, nomPage) {
  let h = gabarit;
  for (let i = 0; i < 3; i++) h = h.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => {
    if (!(n in partiels)) { erreurs.push(`${nomPage} : partiel inconnu ${n}`); return ''; }
    return partiels[n];
  });
  h = h.replace(/\{\{#si\s+(\w+)\s*\}\}([\s\S]*?)\{\{\/si\}\}/g, (_, k, bloc) => (v[k] ? bloc : ''));
  h = h.replace(/\{\{\{\s*(\w+)\s*\}\}\}/g, (_, k) => {
    if (k in brut) return brut[k];
    erreurs.push(`${nomPage} : clé brute inconnue ${k}`); return '';
  });
  h = h.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    if (k in v) return echapper(v[k]);
    erreurs.push(`${nomPage} : clé inconnue ${k}`); return '';
  });
  return h;
}

// ---------- Vérifications ----------
function verifier(nom, h) {
  const texte = h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  if (/\{\{|\}\}/.test(h)) erreurs.push(`${nom} : accolades de gabarit restantes`);
  if (/[–—]/.test(texte)) erreurs.push(`${nom} : tiret cadratin ou demi-cadratin`);
  const interdit = texte.match(/qualiopi|opco|\bcpf\b|financement/i);
  if (interdit) erreurs.push(`${nom} : mot absent attendu, trouvé « ${interdit[0]} »`);
  const ecarte = texte.match(/PME industrielles?|hors cible/i);
  if (ecarte) erreurs.push(`${nom} : formule retirée à la demande d’Antoine, trouvé « ${ecarte[0]} »`);
  for (const lien of ['href="#mentions-legales"', 'href="/cgv"', 'href="/confidentialite"']) {
    if (!h.includes(lien)) erreurs.push(`${nom} : lien de pied de page manquant ${lien}`);
  }
  const ids = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of h.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) erreurs.push(`${nom} : ancre #${m[1]} introuvable`);
}

function verifierVente(h, nom = 'index', lien = c.lien_rdv) {
  h = h.slice(h.indexOf('</header>')); // le bouton de la barre du haut renvoie au lien de réservation sans mention RGPD
  const positions = [...h.matchAll(new RegExp(lien.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'g'))].map((m) => m.index);
  if (positions.length < 3) erreurs.push(`${nom} : ${positions.length} lien(s) de réservation, 3 attendus au moins`);
  positions.forEach((p, i) => {
    const fin = positions[i + 1] ?? h.length;
    if (!h.slice(p, fin).includes('href="/confidentialite"')) erreurs.push(`${nom} : le lien de réservation n° ${i + 1} n’est pas suivi du lien vers /confidentialite`);
  });
  const autres = [...h.matchAll(/https:\/\/(?:calendly\.com|cal\.com)\/[^"']+/g)].filter((m) => m[0] !== lien);
  if (autres.length) erreurs.push(`${nom} : un autre lien de réservation que lien_rdv est présent`);
}

// ---------- Génération ----------
const pages = readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'));
const sorties = {};
for (const f of pages) {
  const h = rendre(readFileSync(join(SRC, 'pages', f), 'utf8'), f);
  verifier(f, h);
  if (f === 'index.html') verifierVente(h);
  if (f === 'ecoles.html') {
    verifierVente(h, 'ecoles', e.lien_rdv);
    if (!h.includes('href="/cgv#etablissements"')) erreurs.push('ecoles : aucun lien vers l’article des établissements dans /cgv');
    if (!dateLimite && /réservation avant le/.test(h)) erreurs.push('ecoles : la ligne d’urgence s’affiche alors que date_limite_printemps est vide');
  }
  if (f === 'cgv.html' && !h.includes('id="etablissements"')) erreurs.push('cgv : article des établissements introuvable');
  sorties[f] = h;
}

if (erreurs.length) {
  console.error('Échec de la génération :\n- ' + erreurs.join('\n- '));
  process.exit(1);
}
for (const [f, h] of Object.entries(sorties)) writeFileSync(join(SORTIE, f), h);
console.log(`${Object.keys(sorties).length} pages générées dans site/ : ${Object.keys(sorties).join(', ')}`);
if (aFournir.length) console.warn(`À fournir avant la mise en ligne : valeur de ${aFournir.join(', ')}.`);
console.log(`Pile : ${c.pile.length} éléments, ${euros(sommePile)} ; prix ${v.prix_ht} HT, ${v.prix_ttc} TTC ; date d’effet ${dateEffet}.`);
console.log(`Écoles : Atelier ${euros(somme(e.pile_atelier))} pour ${v.e_prix_atelier_ht} HT (${v.e_prix_atelier_ttc} TTC) ; Sprint ${euros(somme(e.pile_sprint))} pour ${v.e_prix_sprint_ht} HT (${v.e_prix_sprint_ttc} TTC) ; les deux ${v.e_valeur_les_deux} pour ${v.e_prix_les_deux_ht} HT (${v.e_prix_les_deux_ttc} TTC).`);
console.log(`Seuil par salaire net : ${lignesSeuil.map((l) => `${euros(l.net)} → ${euros(Math.round(l.heure * 100) / 100)} de l’heure, ${l.minutes} min`).join(' ; ')}.`);
