// Composants partagés par les deux films : icônes, horloge, calendrier, lignes de la carte sombre.
import { el, st, at, C, clamp, ressort, sort, prog, texteMasque, monte } from './moteur.js';

// Icônes au trait, viewBox 24.
export const ICONES = {
  calendrier: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  horloge: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  guillemets: '<path d="M10 7c-3 1-4.5 3.2-4.5 6.5V17h4.5v-4.5H7.5M19 7c-3 1-4.5 3.2-4.5 6.5V17H19v-4.5h-2.5"/>',
  usine: '<path d="M3 20V10l5 3V10l5 3V6h4v14z"/><path d="M3 20h18"/>',
  envoi: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  document: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h6M9.5 15.5h6"/>',
  coche: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  etincelle: '<path d="M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9-1.9 5.6-1.9-5.6-5.6-1.9 5.6-1.9z"/>',
  groupe: '<circle cx="9" cy="8.5" r="3"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M15 14.3c2.7-.3 5.5 1.5 5.5 4.7"/>',
  cadenas: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  lune: '<path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z"/>',
  cartes: '<rect x="3.5" y="7.5" width="12" height="13" rx="2"/><path d="M8 4.5h10.5a2 2 0 0 1 2 2V17"/>',
  question: '<path d="M9.2 9.2a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.2-1.5 2.3v.5"/><path d="M12 17.6v.1"/>',
};
export function icone(parent, nom, { taille = 48, couleur = '#fff', epaisseur = 2 } = {}) {
  const s = el('svg:svg', { width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none', stroke: couleur, 'stroke-width': epaisseur, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  s.innerHTML = ICONES[nom];
  return s;
}

// Coche verte qui se dessine : p de 0 à 1.
export class Coche {
  constructor(parent, taille = 64) {
    this.svg = el('svg:svg', { width: taille, height: taille, viewBox: '0 0 24 24' }, parent);
    this.rond = el('svg:circle', { cx: 12, cy: 12, r: 11, fill: C.vert }, this.svg);
    this.trait = el('svg:path', { d: 'M6.5 12.5l3.8 3.8L17.8 8.6', fill: 'none', stroke: '#fff', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 20, 'stroke-dashoffset': 20 }, this.svg);
  }
  poser(pRond, pTrait) {
    st(this.svg, { transform: `scale(${Math.max(0, pRond).toFixed(4)})`, visibility: pRond > 0.002 ? 'inherit' : 'hidden' });
    at(this.trait, { 'stroke-dashoffset': (20 * (1 - clamp(pTrait))).toFixed(2) });
  }
}

// Horloge de tuile : aiguilles posées par angle (degrés).
export class Horloge {
  constructor(parent, taille = 56, couleur = C.ocre, fond = 'rgba(255,255,255,0.9)') {
    this.svg = el('svg:svg', { width: taille, height: taille, viewBox: '0 0 24 24' }, parent);
    el('svg:circle', { cx: 12, cy: 12, r: 10.5, fill: fond, stroke: couleur, 'stroke-width': 1.8 }, this.svg);
    this.h = el('svg:line', { x1: 12, y1: 12, x2: 12, y2: 7.2, stroke: couleur, 'stroke-width': 2, 'stroke-linecap': 'round' }, this.svg);
    this.m = el('svg:line', { x1: 12, y1: 12, x2: 12, y2: 4.6, stroke: couleur, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, this.svg);
    el('svg:circle', { cx: 12, cy: 12, r: 1.3, fill: couleur }, this.svg);
  }
  poser(minutes) {
    at(this.m, { transform: `rotate(${(minutes * 6).toFixed(2)} 12 12)` });
    at(this.h, { transform: `rotate(${(minutes * 0.5 + 300).toFixed(2)} 12 12)` });
  }
}

// Calendrier de semaine. Les cellules apparaissent avec p, le bloc libre se soulève avec lift.
export class Calendrier {
  constructor(parent, { largeur = 1100, hauteur = 760, jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], lignes = 5, blocs = [], libre, taillePolice = 34, fond = '#fff', grille = '#D6E0EC', titre = null }) {
    this.L = largeur; this.Hh = hauteur; this.jours = jours; this.lignes = lignes;
    this.racine = el('div', { class: 'calendrier' }, parent);
    Object.assign(this.racine.style, { position: 'absolute', left: '0', top: '0', width: largeur + 'px', height: hauteur + 'px', background: fond, borderRadius: '28px', overflow: 'hidden' });
    const ent = Math.round(hauteur * 0.16);
    this.ent = ent;
    const cw = largeur / jours.length, rh = (hauteur - ent) / lignes;
    this.cw = cw; this.rh = rh;
    this.entetes = jours.map((j, i) => {
      const d = el('div', { text: j }, this.racine);
      Object.assign(d.style, { position: 'absolute', left: i * cw + 'px', top: '0', width: cw + 'px', height: ent + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 ${taillePolice}px Inter`, color: C.attenue });
      return d;
    });
    for (let i = 1; i < jours.length; i++) { const l = el('div', {}, this.racine); Object.assign(l.style, { position: 'absolute', left: i * cw + 'px', top: ent + 'px', width: '2px', height: hauteur - ent + 'px', background: grille }); }
    for (let j = 0; j <= lignes; j++) { const l = el('div', {}, this.racine); Object.assign(l.style, { position: 'absolute', left: '0', top: ent + j * rh + 'px', width: largeur + 'px', height: '2px', background: grille }); }
    this.blocs = blocs.map(b => {
      const d = el('div', {}, this.racine);
      Object.assign(d.style, { position: 'absolute', left: b.jour * cw + 10 + 'px', top: ent + b.ligne * rh + 8 + 'px', width: cw - 20 + 'px', height: b.duree * rh - 16 + 'px', borderRadius: '14px', background: b.couleur || '#C9D6E6', transformOrigin: '50% 0' });
      return d;
    });
    if (libre) {
      this.libreCase = { x: libre.jour * cw + 10, y: ent + libre.ligne * rh + 8, w: cw - 20, h: rh - 16 };
      this.creux = el('div', {}, this.racine);
      Object.assign(this.creux.style, { position: 'absolute', left: this.libreCase.x + 'px', top: this.libreCase.y + 'px', width: this.libreCase.w + 'px', height: this.libreCase.h + 'px', borderRadius: '14px', border: `3px dashed ${C.vert}` });
    }
  }
  poser(p) {
    this.blocs.forEach((b, i) => st(b, { transform: `scaleY(${clamp(ressort(p - i * 0.03, 'vif'), 0, 1.2).toFixed(4)})` }));
  }
}

// Ligne de la carte sombre : pastille d'icône, texte qui monte, coche éventuelle, sous-ligne.
export class Rang {
  constructor(parent, { html, icone: ic, image, coche = false, sous = null, taille = 74 }) {
    this.racine = el('div', { class: 'rang' }, parent);
    Object.assign(this.racine.style, { position: 'absolute', left: '0', top: '0', display: 'flex', alignItems: 'center', gap: '30px' });
    this.pastille = el('div', {}, this.racine);
    Object.assign(this.pastille.style, { width: '100px', height: '100px', borderRadius: '50%', background: C.nuit2, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 100px', overflow: 'hidden' });
    if (image) { const im = el('img', { src: image }, this.pastille); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'cover' }); }
    else icone(this.pastille, ic, { taille: 54, couleur: C.lampe, epaisseur: 1.9 });
    const bloc = el('div', {}, this.racine);
    Object.assign(bloc.style, { display: 'flex', flexDirection: 'column', gap: '6px' });
    const ligne = el('div', {}, bloc);
    Object.assign(ligne.style, { display: 'flex', alignItems: 'center', gap: '22px' });
    this.texte = texteMasque(ligne, html, {});
    Object.assign(this.texte.i.style, { font: `400 ${taille}px "Instrument Serif"`, color: '#fff', lineHeight: '1.08', whiteSpace: 'nowrap', letterSpacing: '-0.01em' });
    if (coche) this.coche = new Coche(ligne, 66);
    if (sous) {
      this.sous = texteMasque(bloc, sous, {});
      Object.assign(this.sous.i.style, { font: '500 40px Inter', color: C.attenueNuit, whiteSpace: 'nowrap' });
    }
  }
  poser(x, y, pIcone, pTexte, pCoche = 0, pSous = 0) {
    st(this.racine, { transform: `translate(${x}px,${y}px)` });
    st(this.pastille, { transform: `scale(${Math.max(0, pIcone).toFixed(4)})`, visibility: pIcone > 0.002 ? 'inherit' : 'hidden' });
    monte(this.texte, pTexte);
    if (this.coche) this.coche.poser(ressort(pCoche, 'rebond'), clamp((pCoche - 0.08) / 0.3));
    if (this.sous) monte(this.sous, pSous);
  }
}
