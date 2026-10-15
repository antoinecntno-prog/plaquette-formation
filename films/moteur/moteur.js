// Moteur commun des films de lancement antoinecontino.fr.
// Règle : chaque style se calcule depuis le temps dans seek(t). Aucune transition CSS,
// aucun minuteur, aucun état porté d'une image à l'autre.

export const W = 1440, H = 1800;
export const BPM = 120, TEMPS = 60 / BPM;
export const temps = n => (n - 1) * TEMPS;          // début du temps n (1 à 54)
export const SVGNS = 'http://www.w3.org/2000/svg';

// Couleurs reprises de site/css/site.css.
export const C = {
  fond: '#EAF1F9', carte: '#FFFFFF', bord: '#D6E0EC', nuit: '#0E1A2B', nuit2: '#1C2E4D',
  texte: '#223047', attenue: '#526076', attenueNuit: '#A7B3C6', vert: '#15803D', vertClair: '#4ADE80',
  ocre: '#A96F14', heure: '#8A5A10', lampe: '#F7E495', surligne: '#FBEBA6', ciel: '#041A36',
};

// ---------- Mathématiques ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const prog = (t, t0, d) => clamp((t - t0) / d);
export const lisse = p => p * p * (3 - 2 * p);
export const entreSort = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const sort = p => 1 - Math.pow(1 - p, 3);
export const entre = p => p * p * p;
export const sortExpo = p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));

// Ressort : réponse indicielle fermée d'un oscillateur amorti, de 0 vers 1.
export const RESSORTS = {
  vif: { f: 3.0, z: 0.62 },
  doux: { f: 2.0, z: 0.9 },
  rebond: { f: 3.4, z: 0.45 },
  sec: { f: 4.6, z: 0.78 },
  camera: { f: 1.6, z: 0.95 },
  lent: { f: 1.2, z: 1.0 },
};
export function ressort(t, r = RESSORTS.vif) {
  if (typeof r === 'string') r = RESSORTS[r];
  if (t <= 0) return 0;
  const w0 = 2 * Math.PI * r.f, z = r.z;
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
  }
  return 1 - (1 + w0 * t) * Math.exp(-w0 * t);
}
// Valeur à plusieurs cibles : somme d'un ressort par changement. cles = [[t, valeur, ressort?], ...]
export function piste(t, v0, cles) {
  let v = v0, prec = v0;
  for (const [tk, vk, r] of cles) { v += (vk - prec) * ressort(t - tk, r || RESSORTS.vif); prec = vk; }
  return v;
}
// Même principe avec des courbes d'accélération à durée fixe. cles = [[t, valeur, durée, courbe?], ...]
export function glisse(t, v0, cles, courbe = entreSort) {
  let v = v0, prec = v0;
  for (const [tk, vk, dk, e] of cles) { v += (vk - prec) * (e || courbe)(prog(t, tk, dk)); prec = vk; }
  return v;
}

// ---------- DOM ----------
const memo = new WeakMap();
export function el(tag, attrs = {}, parent = null) {
  const svg = tag.startsWith('svg:');
  const e = svg ? document.createElementNS(SVGNS, tag.slice(4)) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v);
  }
  if (parent) parent.appendChild(e);
  return e;
}
// Écrit un style seulement s'il change.
export function st(e, props) {
  let c = memo.get(e);
  if (!c) { c = {}; memo.set(e, c); }
  for (const k in props) {
    const v = props[k];
    if (c[k] === v) continue;
    c[k] = v;
    if (k.startsWith('--')) e.style.setProperty(k, v); else e.style[k] = v;
  }
}
export function at(e, attrs) {
  let c = memo.get(e);
  if (!c) { c = {}; memo.set(e, c); }
  for (const k in attrs) {
    const v = String(attrs[k]);
    if (c['@' + k] === v) continue;
    c['@' + k] = v;
    e.setAttribute(k, v);
  }
}
export const visible = (e, oui) => st(e, { visibility: oui ? 'inherit' : 'hidden' });

// ---------- Caméra ----------
// La caméra cadre le point (x, y) du monde au centre de l'image, à l'échelle s.
export function camera(monde, x, y, s, rot = 0) {
  st(monde, { transform: `translate(${W / 2}px,${H / 2}px) rotate(${rot}deg) scale(${s}) translate(${-x}px,${-y}px)` });
}

// ---------- Texte qui monte hors d'une ligne de masque ----------
export function texteMasque(parent, html, style = {}) {
  const m = el('div', { class: 'masque' }, parent);
  const i = el('div', { class: 'masque-in', html }, m);
  Object.assign(m.style, style);
  return { m, i };
}
export function monte(tm, p) { st(tm.i, { transform: `translateY(${((1 - p) * 112).toFixed(3)}%)` }); }

// ---------- Mot-marque qui s'écrase dans son point ----------
// Chaque lettre se rapproche du point du même facteur k et sa largeur dessinée suit (échelle horizontale :
// Instrument Serif n'a pas d'axe de largeur), donc les lettres restent jointives.
export class MotMarque {
  constructor(parent, texte, { police, taille, couleur, espacement = 0, indicePoint }) {
    this.racine = el('div', { class: 'motmarque' }, parent);
    Object.assign(this.racine.style, { position: 'absolute', left: '0', top: '0', width: '0', height: '0' });
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${taille}px ${police}`;
    this.lettres = [];
    let x = 0;
    for (let i = 0; i < texte.length; i++) {
      const avant = ctx.measureText(texte.slice(0, i)).width + i * espacement;
      const apres = ctx.measureText(texte.slice(0, i + 1)).width + (i + 1) * espacement;
      this.lettres.push({ ch: texte[i], x: avant, w: apres - avant });
      x = apres;
    }
    this.largeur = x - espacement;
    const mp = ctx.measureText('.');
    const lp = this.lettres[indicePoint];
    this.diametre = mp.actualBoundingBoxRight + mp.actualBoundingBoxLeft;
    this.pointX = lp.x - mp.actualBoundingBoxLeft + this.diametre / 2;            // depuis le début du mot
    this.pointY = -(mp.actualBoundingBoxAscent - mp.actualBoundingBoxDescent) / 2; // depuis la ligne de base
    this.indicePoint = indicePoint;
    for (const [i, l] of this.lettres.entries()) {
      if (i === indicePoint) continue;
      l.e = el('span', { text: l.ch }, this.racine);
      Object.assign(l.e.style, {
        position: 'absolute', left: '0', top: '0', font: `${taille}px ${police}`, color: couleur,
        lineHeight: '1', whiteSpace: 'pre', transformOrigin: '0 0',
      });
    }
    this.taille = taille;
    const m = ctx.measureText('a');
    this.ascent = m.fontBoundingBoxAscent;
  }
  // cx, cy : centre visé du mot entier (ligne de base décalée), k : 1 = mot ouvert, 0 = tout dans le point.
  poser(cx, cy, k) {
    const x0 = cx - this.largeur / 2, base = cy + this.taille * 0.33;
    const px = x0 + this.pointX;
    for (const [i, l] of this.lettres.entries()) {
      if (i === this.indicePoint) continue;
      const g = px + (x0 + l.x - px) * k;
      st(l.e, {
        transform: `translate(${g.toFixed(2)}px,${(base - this.ascent).toFixed(2)}px) scaleX(${Math.max(k, 0.0001).toFixed(4)})`,
        visibility: k > 0.015 ? 'inherit' : 'hidden',
      });
    }
    return { x: px, y: base + this.pointY, d: this.diametre };
  }
}

// ---------- Iris à six lames ----------
// Ouverture hexagonale de rayon a. Chaque lame : ses deux sommets, les deux prolongements d'arêtes
// et le PETIT arc du cercle extérieur entre eux.
export function cheminsIris(cx, cy, a, R, rot = 0, n = 6) {
  const V = [], E = [];
  for (let i = 0; i < n; i++) {
    const t = rot + (i * 2 * Math.PI) / n;
    V.push([cx + a * Math.cos(t), cy + a * Math.sin(t)]);
  }
  // Prolongement de l'arête i (V[i] -> V[i+1]) au-delà de V[i+1] jusqu'au cercle extérieur.
  for (let i = 0; i < n; i++) {
    const p = V[i], q = V[(i + 1) % n];
    let dx = q[0] - p[0], dy = q[1] - p[1];
    const L = Math.hypot(dx, dy) || 1;
    dx /= L; dy /= L;
    if (a < 0.01) { const t = rot + ((i + 1) * 2 * Math.PI) / n + Math.PI / 2 + Math.PI / n; dx = Math.cos(t); dy = Math.sin(t); }
    // q + s d sur le cercle de rayon R : |q - c + s d| = R
    const ox = q[0] - cx, oy = q[1] - cy;
    const b = ox * dx + oy * dy, c = ox * ox + oy * oy - R * R;
    const s = -b + Math.sqrt(Math.max(0, b * b - c));
    E.push([q[0] + s * dx, q[1] + s * dy]);
  }
  const chemins = [];
  for (let i = 0; i < n; i++) {
    const v0 = V[i], v1 = V[(i + 1) % n], e1 = E[i], e0 = E[(i - 1 + n) % n];
    const a1 = Math.atan2(e1[1] - cy, e1[0] - cx), a0 = Math.atan2(e0[1] - cy, e0[0] - cx);
    let d = a0 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const balayage = d > 0 ? 1 : 0;
    const f = x => x.toFixed(2);
    chemins.push(`M${f(v0[0])},${f(v0[1])}L${f(v1[0])},${f(v1[1])}L${f(e1[0])},${f(e1[1])}A${R},${R} 0 0 ${balayage} ${f(e0[0])},${f(e0[1])}Z`);
  }
  return chemins;
}

// ---------- Verre liquide ----------
// Carte de déplacement d'un rectangle arrondi, découpée en neuf morceaux statiques (coins et bords)
// assemblés dans le filtre : la taille du verre peut changer sans recharger d'image.
function carteMorceau(type, r, biseau, q = 1) {
  // type : 'hg','hd','bg','bd' (coins de r x r) ou 'h','b','g','d' (bandes de 4 x r ou r x 4)
  const coin = type.length === 2;
  const w = coin ? r : (type === 'h' || type === 'b' ? 4 : r);
  const h = coin ? r : (type === 'h' || type === 'b' ? r : 4);
  const cw = Math.max(1, Math.round(w * q)), ch = Math.max(1, Math.round(h * q));
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(cw, ch);
  for (let j = 0; j < ch; j++) {
    for (let i = 0; i < cw; i++) {
      const x = (i + 0.5) / q, y = (j + 0.5) / q;
      let nx = 0, ny = 0, e;
      if (coin) {
        const cx = type[1] === 'g' ? r : 0, cy = type[0] === 'h' ? r : 0;
        const dx = x - cx, dy = y - cy, dd = Math.hypot(dx, dy);
        const dans = (type[1] === 'g' ? dx < 0 : dx > 0) && (type[0] === 'h' ? dy < 0 : dy > 0);
        if (dans) { e = r - dd; nx = dx / (dd || 1); ny = dy / (dd || 1); }
        else {
          // Partie du coin hors de la zone de l'arc : bord droit le plus proche.
          const ex = type[1] === 'g' ? x : r - x, ey = type[0] === 'h' ? y : r - y;
          if ((type[1] === 'g' ? dx >= 0 : dx <= 0) && (type[0] === 'h' ? dy >= 0 : dy <= 0)) e = 1e9;
          else if (type[1] === 'g' ? dx >= 0 : dx <= 0) { e = ey; ny = type[0] === 'h' ? -1 : 1; }
          else { e = ex; nx = type[1] === 'g' ? -1 : 1; }
        }
      } else {
        if (type === 'h') { e = y; ny = -1; } else if (type === 'b') { e = r - y; ny = 1; }
        else if (type === 'g') { e = x; nx = -1; } else { e = r - x; nx = 1; }
      }
      const k = 4 * (j * cw + i);
      let m = 0;
      if (e >= 0 && e < biseau) m = Math.pow(1 - e / biseau, 2.2);
      if (e < 0) m = 0;
      img.data[k] = 128 + Math.round(127 * nx * m);
      img.data[k + 1] = 128 + Math.round(127 * ny * m);
      img.data[k + 2] = 128;
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv.toDataURL('image/png');
}

let defs = null, compteurVerre = 0;
export function defsSVG() {
  if (defs) return defs;
  const svg = el('svg:svg', { width: '0', height: '0', style: 'position:absolute;width:0;height:0' }, document.body);
  defs = el('svg:defs', {}, svg);
  // Goo : flou plus seuil alpha, puis la source composée par-dessus pour garder le verre net à l'intérieur.
  defs.insertAdjacentHTML('beforeend', `
    <filter id="goo" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="flou"/>
      <feColorMatrix in="flou" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" result="seuil"/>
      <feComposite in="SourceGraphic" in2="seuil" operator="atop"/>
    </filter>`);
  return defs;
}
const chargements = [];
export const attendreImages = () => Promise.all(chargements);

// Crée le filtre d'un verre (taille de travail fixe w x h, marge m autour pour échantillonner le décor).
function filtreVerre(id, r, biseau, force) {
  const d = defsSVG();
  const f = el('svg:filter', { id, x: '0', y: '0', width: '1', height: '1', filterUnits: 'objectBoundingBox', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' }, d);
  el('svg:feFlood', { 'flood-color': 'rgb(128,128,128)', result: 'neutre' }, f);
  const morceaux = {};
  for (const t of ['hg', 'hd', 'bg', 'bd', 'h', 'b', 'g', 'd']) {
    const url = carteMorceau(t, r, biseau, 1);
    const im = new Image(); im.src = url; chargements.push(im.decode());
    morceaux[t] = el('svg:feImage', { href: url, preserveAspectRatio: 'none', result: 'm' + t }, f);
  }
  const fus = el('svg:feMerge', { result: 'carte' }, f);
  el('svg:feMergeNode', { in: 'neutre' }, fus);
  for (const t of Object.keys(morceaux)) el('svg:feMergeNode', { in: 'm' + t }, fus);
  const canaux = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const echelles = [1, 1.07, 1.14];
  const dep = [];
  canaux.forEach((cn, i) => {
    const dm = el('svg:feDisplacementMap', { in: 'SourceGraphic', in2: 'carte', scale: force * echelles[i], xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' + i }, f);
    dep.push(dm);
    el('svg:feColorMatrix', { in: 'd' + i, type: 'matrix', values: `${cn[0]} 0 0 0 0  0 ${cn[1]} 0 0 0  0 0 ${cn[2]} 0 0  0 0 0 1 0`, result: 'c' + i }, f);
  });
  el('svg:feComposite', { in: 'c0', in2: 'c1', operator: 'arithmetic', k2: '1', k3: '1', result: 'c01' }, f);
  el('svg:feComposite', { in: 'c01', in2: 'c2', operator: 'arithmetic', k2: '1', k3: '1' }, f);
  return { f, morceaux, dep };
}

// Un élément de verre : sa propre copie du décor, déformée par sa carte, plus un liseré de lumière.
// decor(conteneur) construit une copie du décor ; majDecor(copie, t) la met à jour comme l'original.
export class Verre {
  constructor(parent, { r = 60, biseau = 46, force = 70, marge = 60, teinte = 'rgba(255,255,255,0.10)', ombre = true, decor, classe = '' }) {
    this.id = 'verre' + (++compteurVerre);
    this.r = r; this.marge = marge;
    this.filtre = filtreVerre(this.id, r, biseau, force);
    this.racine = el('div', { class: 'verre ' + classe }, parent);
    this.cadre = el('div', { class: 'verre-cadre' }, this.racine);
    this.enveloppe = el('div', { class: 'verre-env' }, this.cadre);
    this.enveloppe.style.filter = `url(#${this.id})`;
    this.interieur = el('div', { class: 'verre-int' }, this.enveloppe);
    this.copie = decor ? decor(this.interieur) : null;
    this.teinte = el('div', { class: 'verre-teinte' }, this.cadre);
    this.teinte.style.background = teinte;
    this.bord = el('div', { class: 'verre-bord' }, this.racine);
    this.contenu = el('div', { class: 'verre-contenu' }, this.racine);
    if (ombre) this.racine.classList.add('verre-ombre');
  }
  // x, y : coin haut gauche dans le repère du décor ; w, h : taille ; s : échelle autour du centre.
  poser({ x, y, w, h, s = 1, sx = 1, sy = 1, r = null, opacite = 1 }) {
    const rr = r == null ? Math.min(this.r, w / 2, h / 2) : r;
    const m = this.marge;
    const ex = s * sx, ey = s * sy;
    st(this.racine, {
      transform: `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) translate(${w / 2}px,${h / 2}px) scale(${ex.toFixed(4)},${ey.toFixed(4)}) translate(${-w / 2}px,${-h / 2}px)`,
      width: w + 'px', height: h + 'px', opacity: opacite, visibility: opacite > 0.001 && ex > 0.001 && ey > 0.001 ? 'inherit' : 'hidden',
      borderRadius: rr + 'px',
    });
    st(this.cadre, { borderRadius: rr + 'px' });
    st(this.bord, { borderRadius: rr + 'px' });
    st(this.enveloppe, { left: -m + 'px', top: -m + 'px', width: w + 2 * m + 'px', height: h + 2 * m + 'px' });
    // Contre-transformation : la copie du décor reste alignée sur le décor réel malgré l'échelle.
    const inv = `translate(${m + w / 2}px,${m + h / 2}px) scale(${(1 / Math.max(ex, 1e-4)).toFixed(5)},${(1 / Math.max(ey, 1e-4)).toFixed(5)}) translate(${-(x + w / 2)}px,${-(y + h / 2)}px)`;
    st(this.interieur, { transform: inv });
    // Carte en neuf morceaux, posée dans le repère de l'enveloppe.
    const c = (t, X, Y, Wd, Ht) => at(this.filtre.morceaux[t], { x: X.toFixed(2), y: Y.toFixed(2), width: Math.max(0, Wd).toFixed(2), height: Math.max(0, Ht).toFixed(2) });
    const R = Math.min(this.r, w / 2, h / 2);
    c('hg', m, m, R, R); c('hd', m + w - R, m, R, R); c('bg', m, m + h - R, R, R); c('bd', m + w - R, m + h - R, R, R);
    c('h', m + R, m, w - 2 * R, R); c('b', m + R, m + h - R, w - 2 * R, R);
    c('g', m, m + R, R, h - 2 * R); c('d', m + w - R, m + R, R, h - 2 * R);
  }
}

// Verre en forme de lettre : champ de distance calculé sur canvas pour la carte, le masque et les reflets.
export function carteGlyphe(ch, police, taille, biseau = 26) {
  const pad = Math.ceil(biseau + 10);
  const mes = document.createElement('canvas').getContext('2d');
  mes.font = `${taille}px ${police}`;
  const m = mes.measureText(ch);
  const w = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + 2 * pad;
  const h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + 2 * pad;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.font = `${taille}px ${police}`; ctx.fillStyle = '#fff';
  ctx.fillText(ch, pad + m.actualBoundingBoxLeft, pad + m.actualBoundingBoxAscent);
  const a = ctx.getImageData(0, 0, w, h).data;
  const dedans = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) dedans[i] = a[4 * i + 3] > 127 ? 1 : 0;
  // Distance au bord (transformée de distance euclidienne en deux passes, Felzenszwalb).
  const INF = 1e12;
  const dt1 = (f, n) => {
    const d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    return d;
  };
  const dist = new Float64Array(w * h);
  const col = new Float64Array(h), lig = new Float64Array(w);
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) col[y] = dedans[y * w + x] ? INF : 0; const r = dt1(col, h); for (let y = 0; y < h; y++) dist[y * w + x] = r[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) lig[x] = dist[y * w + x]; const r = dt1(lig, w); for (let x = 0; x < w; x++) dist[y * w + x] = Math.sqrt(r[x]); }
  const carte = ctx.createImageData(w, h), reflet = ctx.createImageData(w, h), masque = ctx.createImageData(w, h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, k = 4 * i;
    const e = dist[i];
    // Normale sortante = gradient décroissant de la distance intérieure.
    const gx = -(dist[i + 1] - dist[i - 1]) / 2, gy = -(dist[i + w] - dist[i - w]) / 2;
    const gl = Math.hypot(gx, gy) || 1;
    const mm = dedans[i] ? Math.pow(1 - clamp(e / biseau), 2.0) : 0;
    carte.data[k] = 128 + Math.round(127 * (gx / gl) * mm);
    carte.data[k + 1] = 128 + Math.round(127 * (gy / gl) * mm);
    carte.data[k + 2] = 128; carte.data[k + 3] = 255;
    masque.data[k] = masque.data[k + 1] = masque.data[k + 2] = 255;
    masque.data[k + 3] = dedans[i] ? 255 : 0;
    // Reflet : lumière venue du haut gauche sur le biseau.
    const lum = dedans[i] ? clamp(((-gx / gl) * 0.55 + (-gy / gl) * 0.83)) * Math.pow(1 - clamp(e / (biseau * 0.7)), 1.6) : 0;
    const filet = dedans[i] ? clamp(1 - Math.abs(e - 1.6) / 1.6) : 0;
    const bas = dedans[i] ? clamp(((gx / gl) * 0.3 + (gy / gl) * 0.95)) * Math.pow(1 - clamp(e / (biseau * 0.5)), 2) : 0;
    reflet.data[k] = reflet.data[k + 1] = reflet.data[k + 2] = 255;
    reflet.data[k + 3] = Math.round(255 * clamp(Math.max(lum * 0.95, filet * 0.7, bas * 0.35)));
  }
  const versURL = d => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(d, 0, 0); return c.toDataURL('image/png'); };
  return { w, h, pad, carte: versURL(carte), masque: versURL(masque), reflet: versURL(reflet), gauche: m.actualBoundingBoxLeft, haut: m.actualBoundingBoxAscent };
}

export class LettreVerre {
  constructor(parent, ch, { police, taille, biseau = 26, force = 60, decor }) {
    this.g = carteGlyphe(ch, police, taille, biseau);
    this.id = 'verre' + (++compteurVerre);
    const d = defsSVG();
    const f = el('svg:filter', { id: this.id, x: '0', y: '0', width: '1', height: '1', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' }, d);
    const im = new Image(); im.src = this.g.carte; chargements.push(im.decode());
    el('svg:feImage', { href: this.g.carte, x: '0', y: '0', width: this.g.w, height: this.g.h, preserveAspectRatio: 'none', result: 'carte' }, f);
    [[1, 0, 0, 1], [0, 1, 0, 1.07], [0, 0, 1, 1.14]].forEach(([r, g, b, s], i) => {
      el('svg:feDisplacementMap', { in: 'SourceGraphic', in2: 'carte', scale: force * s, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' + i }, f);
      el('svg:feColorMatrix', { in: 'd' + i, type: 'matrix', values: `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`, result: 'c' + i }, f);
    });
    el('svg:feComposite', { in: 'c0', in2: 'c1', operator: 'arithmetic', k2: '1', k3: '1', result: 'c01' }, f);
    el('svg:feComposite', { in: 'c01', in2: 'c2', operator: 'arithmetic', k2: '1', k3: '1' }, f);
    this.racine = el('div', { class: 'lettre-verre' }, parent);
    Object.assign(this.racine.style, { position: 'absolute', left: '0', top: '0', width: this.g.w + 'px', height: this.g.h + 'px', transformOrigin: '50% 60%' });
    this.ombre = el('div', {}, this.racine);
    Object.assign(this.ombre.style, { position: 'absolute', inset: '0', background: 'rgba(14,26,43,0.35)', WebkitMaskImage: `url(${this.g.masque})`, maskImage: `url(${this.g.masque})`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', transform: 'translate(0px,14px)', filter: 'blur(10px)' });
    this.vue = el('div', {}, this.racine);
    Object.assign(this.vue.style, { position: 'absolute', inset: '0', WebkitMaskImage: `url(${this.g.masque})`, maskImage: `url(${this.g.masque})`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', overflow: 'hidden' });
    this.env = el('div', {}, this.vue);
    Object.assign(this.env.style, { position: 'absolute', left: '0', top: '0', width: this.g.w + 'px', height: this.g.h + 'px', filter: `url(#${this.id})` });
    this.interieur = el('div', {}, this.env);
    Object.assign(this.interieur.style, { position: 'absolute', left: '0', top: '0', transformOrigin: '0 0' });
    this.copie = decor ? decor(this.interieur) : null;
    this.teinte = el('div', {}, this.vue);
    Object.assign(this.teinte.style, { position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.16)' });
    this.reflet = el('img', { src: this.g.reflet }, this.racine);
    Object.assign(this.reflet.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%' });
  }
  // x, y : position de l'origine du glyphe (coin haut gauche de la boîte, marge comprise).
  poser(x, y, s = 1, opacite = 1) {
    const g = this.g;
    st(this.racine, { transform: `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${s.toFixed(4)})`, opacity: opacite, visibility: s > 0.002 && opacite > 0.002 ? 'inherit' : 'hidden' });
    const ox = g.w / 2, oy = g.h * 0.6;
    const inv = `translate(${ox}px,${oy}px) scale(${(1 / Math.max(s, 1e-4)).toFixed(5)}) translate(${-(x + ox)}px,${-(y + oy)}px)`;
    st(this.interieur, { transform: inv });
  }
}

// ---------- Curseur ----------
export class Curseur {
  constructor(parent) {
    this.racine = el('div', { class: 'curseur' }, parent);
    this.racine.innerHTML = `<svg width="56" height="80" viewBox="0 0 28 40"><path d="M2 2 L2 31 L9 24.5 L13.6 35.5 L18.4 33.5 L13.9 22.8 L23.2 22.8 Z" fill="#0E1A2B" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
    this.anneau = el('div', { class: 'curseur-anneau' }, parent);
  }
  // appui : 0 à 1 (enfoncement), clic : temps écoulé depuis le dernier clic (anneau qui s'ouvre).
  poser(x, y, { appui = 0, visible: v = true, clic = -1, echelle = 1 } = {}) {
    const s = echelle * (1 - 0.14 * appui);
    st(this.racine, { transform: `translate(${(x - 4).toFixed(2)}px,${(y - 4).toFixed(2)}px) scale(${s.toFixed(4)})`, visibility: v ? 'inherit' : 'hidden' });
    if (clic >= 0 && clic < 0.45 && v) {
      const p = sort(clic / 0.45);
      st(this.anneau, { transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(${(0.3 + 0.9 * p).toFixed(3)})`, opacity: (1 - p) * 0.7, visibility: 'inherit' });
    } else st(this.anneau, { visibility: 'hidden' });
  }
}

// ---------- Plan vidéo ----------
// Vidéo réencodée en images clés seules, chargée en blob, et attente de 'seeked' avant chaque image.
export class Plan {
  constructor(parent, url) { this.url = url; this.parent = parent; }
  async charger() {
    const b = await (await fetch(this.url)).blob();
    this.video = document.createElement('video');
    this.video.muted = true; this.video.playsInline = true; this.video.preload = 'auto';
    this.video.src = URL.createObjectURL(b);
    await new Promise((r, x) => {
      this.video.addEventListener('loadeddata', r, { once: true });
      this.video.addEventListener('error', () => x(new Error('vidéo illisible : ' + this.url)), { once: true });
      setTimeout(() => x(new Error('vidéo non chargée en 20 s : ' + this.url)), 20000);
    });
    this.canvas = el('canvas', { width: this.video.videoWidth, height: this.video.videoHeight }, this.parent);
    this.ctx = this.canvas.getContext('2d');
    this.temps = -1;
  }
  async aller(t) {
    const v = this.video;
    const cible = clamp(t, 0, v.duration - 0.001);
    if (Math.abs(cible - this.temps) < 1e-4) return;
    await new Promise(r => { v.addEventListener('seeked', r, { once: true }); v.currentTime = cible; });
    this.ctx.drawImage(v, 0, 0);
    this.temps = cible;
  }
}

// ---------- Homographie : rectangle w x h vers un quadrilatère (matrix3d CSS) ----------
export function matrice3d(w, h, q) {
  // q : [[x0,y0] haut gauche, [x1,y1] haut droit, [x2,y2] bas droit, [x3,y3] bas gauche]
  const [x0, y0] = q[0], [x1, y1] = q[1], [x2, y2] = q[2], [x3, y3] = q[3];
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det, hh = (dx1 * dy3 - dx3 * dy1) / det;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
  // Mise à l'échelle du carré unité vers w x h.
  const A = a / w, B = b / h, D = d / w, E = e / h, G = g / w, Hh = hh / h;
  return `matrix3d(${A},${D},0,${G},${B},${E},0,${Hh},0,0,1,0,${c},${f},0,1)`;
}

// ---------- Film ----------
// construire() bâtit le DOM une fois ; rendre(t) pose tous les styles pour le temps t.
export function film({ duree, construire, rendre }) {
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  window.duree = duree;
  window.prete = (async () => {
    await Promise.all(['400 100px "Instrument Serif"', '400 40px "Inter"', '500 40px "Inter"', '600 40px "Inter"'].map(f => document.fonts.load(f, 'antoinecontino.fr Àéèçù’')));
    await document.fonts.ready;
    await construire();
    await attendreImages();
    await Promise.all([...document.images].map(i => (i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = r; i.onerror = r; }))));
    await rendre(0); await raf(); await raf();
    return true;
  })();
  window.seek = async t => {
    const tt = ((t % duree) + duree) % duree;
    await rendre(tt);
    await raf(); await raf();
  };
  // Lecture en direct dans un navigateur (aperçu), sans effet sur le rendu image par image.
  window.lire = () => {
    const t0 = performance.now();
    const boucle = async () => { await window.seek((performance.now() - t0) / 1000); requestAnimationFrame(boucle); };
    boucle();
  };
}
