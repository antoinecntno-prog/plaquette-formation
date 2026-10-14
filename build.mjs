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
  delai_bonus: `${c.delai_bonus_jours} jours après l’audit`,
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
};

for (const [k, val] of Object.entries(v)) {
  if (typeof val === 'string' && !/^(https?:|\+|mailto:)/.test(val) && !/^\d{4}-\d{2}-\d{2}$/.test(val)) v[k] = insecablesNombres(val);
}

// ---------- Fragments générés ----------
const carte = (e) => `<li class="pile-carte${e.base ? ' pile-base' : ''}">
     <p class="pile-type">${e.base ? 'Offre de base' : 'Bonus'}</p>
     <h4>${echapper(e.nom)}</h4>
     <p>${echapper(insecables(e.detail))}</p>
     <p class="pile-regle"><span>Ce que ça règle</span>«&#8239;${echapper(insecables(e.regle))}&#8239;»</p>${e.limite ? `
     <p class="pile-limite">Offert pour une signature dans les ${echapper(v.delai_bonus)}.</p>` : ''}
     <p class="pile-valeur">${e.valeur == null ? 'Valeur <strong>[à fournir]</strong>' : e.base ? `Valeur <strong>${euros(e.valeur)}</strong>` : `Valeur <s>${euros(e.valeur)}</s> <strong>Offert</strong>`}</p>
    </li>`;
const brut = {
  pile_base: base.map(carte).join('\n    '),
  pile_bonus: bonus.map(carte).join('\n    '),
  places_ligne: places ? `<p class="places">${echapper(v.places_texte)}.</p>` : '',
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

function verifierVente(h) {
  const positions = [...h.matchAll(new RegExp(c.lien_rdv.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'g'))].map((m) => m.index);
  if (positions.length < 3) erreurs.push(`index : ${positions.length} lien(s) de réservation, 3 attendus au moins`);
  positions.forEach((p, i) => {
    const fin = positions[i + 1] ?? h.length;
    if (!h.slice(p, fin).includes('href="/confidentialite"')) erreurs.push(`index : le lien de réservation n° ${i + 1} n’est pas suivi du lien vers /confidentialite`);
  });
  const autres = [...h.matchAll(/https:\/\/calendly\.com\/[^"']+/g)].filter((m) => m[0] !== c.lien_rdv);
  if (autres.length) erreurs.push('index : un autre lien de réservation que lien_rdv est présent');
}

// ---------- Génération ----------
const pages = readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'));
const sorties = {};
for (const f of pages) {
  const h = rendre(readFileSync(join(SRC, 'pages', f), 'utf8'), f);
  verifier(f, h);
  if (f === 'index.html') verifierVente(h);
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
console.log(`Seuil par salaire net : ${lignesSeuil.map((l) => `${euros(l.net)} → ${euros(Math.round(l.heure * 100) / 100)} de l’heure, ${l.minutes} min`).join(' ; ')}.`);
