/* Showreel « Formation IA » d'Antoine Contino. 15 s, 1920 × 1080, rendu image par image.
   Monde repris du site : nuit bleu encre, lumière de lampe, ocre de patron, Instrument Serif et Inter.
   Fil conducteur : un fil de couture en lumière de lampe, qui devient mètre ruban puis cadran. */
'use strict';

const W = 1920, H = 1080, FPS = 60, DUREE = 15;
const C = {
  nuit: '#060509', nuit2: '#0D0C12', ciel: '#041A36', ciel2: '#072347',
  lampe: '#F7E495', bordeaux: '#6E1A2C', ocre: '#A96F14',
  texte: '#FFFFFF', texte2: '#E6E2D9', attenue: '#B8B2A2', attenueCiel: '#B9C4D6',
};
const SERIF = '"Instrument Serif", Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';
const TAU = Math.PI * 2;

/* ---------- Maths ---------- */
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
function bezier(x1, y1, x2, y2) {
  const f = (t, a1, a2) => ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 28; i++) { t = (lo + hi) / 2; if (f(t, x1, x2) < x) lo = t; else hi = t; }
    return f(t, y1, y2);
  };
}
const E = {
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inCubic: x => x * x * x,
  inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outQuart: x => 1 - Math.pow(1 - x, 4),
  outBack: x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  snap: bezier(0.16, 1, 0.3, 1),
  swift: bezier(0.75, 0, 0.15, 1),
  inStrong: bezier(0.7, 0, 0.84, 0),
  enroule: bezier(0.6, 0, 0.2, 1),
  soft: bezier(0.45, 0, 0.2, 1),
};
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function monotone(pts) {
  const n = pts.length, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), d = [], m = [];
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = 0; m[n - 1] = 0;
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return x => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

/* ---------- Toiles ---------- */
function toile(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const sortie = document.getElementById('c');
const out = sortie.getContext('2d');
const scCv = toile(), sc = scCv.getContext('2d');
const accCv = toile(), acc = accCv.getContext('2d');
const tmpCv = toile(), tmp = tmpCv.getContext('2d');
const rCv = toile(), rC = rCv.getContext('2d');
const fxCv = toile(), fx = fxCv.getContext('2d');
const gCv = toile(), gC = gCv.getContext('2d');
const bloomCv = toile(W / 4, H / 4), bloom = bloomCv.getContext('2d');
const bloom2Cv = toile(W / 8, H / 8), bloom2 = bloom2Cv.getContext('2d');

/* ---------- Texte ---------- */
function police(c, size, fam = SERIF, weight = 400, ls = 0) {
  c.font = `${weight} ${size}px ${fam}`;
  c.letterSpacing = ls + 'px';
}
const mesures = new Map();
function decoupe(c, str) {
  const cle = c.font + '|' + c.letterSpacing + '|' + str;
  let v = mesures.get(cle);
  if (!v) {
    const chars = [...str], xs = [];
    let pre = '';
    for (const ch of chars) { pre += ch; xs.push(c.measureText(pre).width - c.measureText(ch).width); }
    v = { chars, xs, w: c.measureText(str).width };
    mesures.set(cle, v);
  }
  return v;
}
/* Lettres qui montent derrière un masque, décalées une à une. */
function monte(c, str, o) {
  police(c, o.size, o.fam || SERIF, o.weight || 400, o.ls ?? -o.size * 0.022);
  const m = decoupe(c, str);
  let x0 = o.x;
  if (o.align === 'center') x0 -= m.w / 2; else if (o.align === 'right') x0 -= m.w;
  const ease = o.ease || E.snap, st = o.stagger ?? 0.028, dur = o.dur ?? 0.9;
  c.save();
  if (o.clip !== false) { c.beginPath(); c.rect(x0 - o.size, o.y - o.size * 1.02, m.w + o.size * 2, o.size * 1.34); c.clip(); }
  c.fillStyle = o.color; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  for (let i = 0; i < m.chars.length; i++) {
    const ch = m.chars[i];
    if (ch === ' ') continue;
    const s0 = o.t0 + i * st;
    const p = ease(prog(o.t, s0, s0 + dur));
    if (p <= 0) continue;
    let dy = (1 - p) * o.size * 1.08, rot = (1 - p) * 0.22 * (o.rot ?? 1), al = clamp(p * 2.2);
    if (o.tOut != null) {
      const so = o.tOut + i * (o.staggerOut ?? 0.012);
      const q = E.inStrong(prog(o.t, so, so + (o.durOut ?? 0.42)));
      dy -= q * o.size * 1.15; rot -= q * 0.12; al *= 1 - q * 0.4;
    }
    c.save();
    c.translate(x0 + m.xs[i], o.y + dy);
    c.rotate(rot);
    c.globalAlpha *= al * (o.alpha ?? 1);
    c.fillText(ch, 0, 0);
    c.restore();
  }
  c.restore();
  return { x0, w: m.w, xs: m.xs };
}
function texte(c, str, x, y, o) {
  police(c, o.size, o.fam || SANS, o.weight || 400, o.ls ?? 0);
  c.fillStyle = o.color; c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic';
  c.fillText(str, x, y);
  c.textAlign = 'left';
}

/* ---------- Chemins et fil ---------- */
function chemin(pts) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, L, len: L[L.length - 1] };
}
const echantillonne = (fn, n) => { const p = []; for (let i = 0; i <= n; i++) p.push(fn(i / n)); return chemin(p); };
const melange = (a, b, m) => chemin(a.pts.map((p, i) => ({ x: lerp(p.x, b.pts[i].x, m), y: lerp(p.y, b.pts[i].y, m) })));
function point(path, d) {
  const { pts, L } = path;
  if (d <= 0) return { x: pts[0].x, y: pts[0].y, i: 0 };
  if (d >= path.len) { const q = pts[pts.length - 1]; return { x: q.x, y: q.y, i: pts.length - 1 }; }
  let lo = 0, hi = L.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (L[mid] <= d) lo = mid; else hi = mid; }
  const f = (d - L[lo]) / (L[hi] - L[lo] || 1);
  return { x: lerp(pts[lo].x, pts[hi].x, f), y: lerp(pts[lo].y, pts[hi].y, f), i: lo };
}
function trace(c, path, d0, d1) {
  const a = point(path, d0), b = point(path, d1);
  c.beginPath(); c.moveTo(a.x, a.y);
  for (let i = a.i + 1; i <= b.i; i++) c.lineTo(path.pts[i].x, path.pts[i].y);
  c.lineTo(b.x, b.y);
}
function halo(c, x, y, r, a) {
  if (a <= 0) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,250,228,${a})`);
  g.addColorStop(0.07, `rgba(255,242,196,${0.75 * a})`);
  g.addColorStop(0.28, `rgba(247,228,149,${0.22 * a})`);
  g.addColorStop(1, 'rgba(247,228,149,0)');
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
}
/* Le fil : points de couture en lumière de lampe, avec aiguille lumineuse en tête. */
function fil(c, path, u0, u1, o = {}) {
  const d0 = u0 * path.len, d1 = u1 * path.len;
  if (d1 - d0 < 1) return;
  const w = o.w ?? 4, a = o.a ?? 1;
  c.save();
  c.globalAlpha *= a; c.lineCap = 'round'; c.lineJoin = 'round';
  trace(c, path, d0, d1);
  c.strokeStyle = 'rgba(247,228,149,0.09)'; c.lineWidth = w * 6; c.stroke();
  c.setLineDash([o.dash ?? 19, o.gap ?? 12]); c.lineDashOffset = o.off ?? 0;
  c.strokeStyle = C.lampe; c.lineWidth = w;
  c.shadowColor = 'rgba(247,228,149,0.85)'; c.shadowBlur = o.glow ?? 14;
  c.stroke();
  c.restore();
  if (o.aiguille) {
    const p = point(path, d1), q = point(path, Math.max(0, d1 - (o.trainee ?? 170)));
    c.save(); c.globalAlpha *= o.aiguille * a;
    const g = c.createLinearGradient(q.x, q.y, p.x, p.y);
    g.addColorStop(0, 'rgba(255,248,220,0)'); g.addColorStop(1, 'rgba(255,248,220,0.95)');
    trace(c, path, Math.max(0, d1 - (o.trainee ?? 170)), d1);
    c.strokeStyle = g; c.lineWidth = w * 0.9; c.lineCap = 'round'; c.stroke();
    c.restore();
    halo(c, p.x, p.y, o.halo ?? 110, o.aiguille * a);
  }
}

/* ---------- Décor ---------- */
const ETOILES = (() => { const r = mulberry32(11); return Array.from({ length: 280 }, () => ({ x: r() * W * 1.3 - W * 0.15, y: r() * H, s: 0.5 + Math.pow(r(), 3) * 1.9, ph: r() * TAU, f: 0.8 + r() * 3.2, a: 0.25 + r() * 0.65, z: 0.25 + r() * 0.75 })); })();
const POUSSIERE = (() => { const r = mulberry32(5); return Array.from({ length: 90 }, () => ({ x: r() * W, y: r() * H, s: 0.7 + r() * 1.8, ph: r() * TAU, vx: 4 + r() * 10, vy: 3 + r() * 9, a: 0.2 + r() * 0.6 })); })();
function nuit(c, t, o = {}) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#061632'); g.addColorStop(0.58, '#060C1A'); g.addColorStop(1, C.nuit);
  c.fillStyle = g; c.fillRect(-10, -10, W + 20, H + 20);
  etoiles(c, t, o.px || 0, o.etoiles ?? 1);
  if (o.lampe) lueur(c, o.lampe.x, o.lampe.y, o.lampe.r, o.lampe.a);
}
function etoiles(c, t, px, k) {
  const span = W * 1.3;
  c.save();
  for (const s of ETOILES) {
    const a = s.a * (0.55 + 0.45 * Math.sin(t * s.f + s.ph)) * k * (1 - (s.y / H) * 0.85);
    if (a <= 0.02) continue;
    let x = s.x + px * s.z; x = ((x + W * 0.15) % span + span) % span - W * 0.15;
    c.fillStyle = `rgba(226,232,255,${a})`;
    c.beginPath(); c.arc(x, s.y, s.s, 0, TAU); c.fill();
  }
  c.restore();
}
function lueur(c, x, y, r, a, rgb = '247,205,120') {
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.45, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
}
function poussiere(c, t, cx, cy, rad, k = 1) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const p of POUSSIERE) {
    const x = ((p.x + t * p.vx) % W + W) % W, y = ((p.y - t * p.vy + Math.sin(t * 0.8 + p.ph) * 10) % H + H) % H;
    const d = Math.hypot(x - cx, y - cy) / rad;
    const a = p.a * k * Math.exp(-d * d * 2.2) * (0.5 + 0.5 * Math.sin(t * 2.2 + p.ph));
    if (a < 0.02) continue;
    c.fillStyle = `rgba(247,228,149,${a})`;
    c.beginPath(); c.arc(x, y, p.s, 0, TAU); c.fill();
  }
  c.restore();
}

/* ---------- Scène 1 : la couture s'ouvre sur le titre ---------- */
const S1 = {};
function prepareS1() {
  const size = 190; police(out, size, SERIF, 400, -size * 0.022);
  S1.size = size; S1.t1 = 'L’IA simplifiée,'; S1.t2 = 'taillée sur mesure';
  S1.w1 = out.measureText(S1.t1).width; S1.w2 = out.measureText(S1.t2).width;
  S1.r = size * 0.05;
  const gap = size * 0.03, plein = S1.w2 + gap + 2 * S1.r;
  S1.x1 = W / 2 - S1.w1 / 2; S1.x2 = W / 2 - plein / 2;
  S1.y1 = 500; S1.y2 = 686;
  S1.px = S1.x2 + S1.w2 + gap + S1.r; S1.py = S1.y2 - S1.r * 1.15;
  const avant = out.measureText('taillée ').width;
  S1.couture = echantillonne(u => ({ x: lerp(-90, W + 90, u), y: 540 + 16 * Math.sin(u * TAU * 1.25 + 0.5) }), 260);
  S1.souligne = echantillonne(u => ({ x: lerp(S1.x2 + avant + 4, S1.x2 + S1.w2 - 6, u), y: S1.y2 + 40 + 2.5 * Math.sin(u * TAU * 2.5) }), 260);
}
function camS1(t) {
  const zp = prog(t, 2.35, 2.96);
  const push = 1 + 0.03 * E.soft(prog(t, 0.95, 2.4));
  const z = push * Math.pow(170, Math.pow(zp, 2.1));
  const e = E.inOutCubic(zp);
  return { zp, z, fx: lerp(S1.px, W / 2, e), fy: lerp(S1.py, H / 2, e) };
}
function scene1(c, t) {
  const k = camS1(t);
  c.save();
  const bz = 1 + (k.z - 1) * 0.02;
  c.translate(W / 2, H / 2); c.scale(bz, bz); c.translate(-W / 2, -H / 2);
  nuit(c, t, { px: -t * 14, lampe: { x: 260, y: 1180, r: 1250, a: 0.16 } });
  poussiere(c, t, 380, 950, 700, 0.8);
  c.restore();

  c.save();
  c.translate(k.fx, k.fy); c.scale(k.z, k.z); c.translate(-S1.px, -S1.py);
  monte(c, S1.t1, { x: S1.x1, y: S1.y1, size: S1.size, color: C.texte, t, t0: 1.0, stagger: 0.03, dur: 1.0 });
  monte(c, S1.t2, { x: S1.x2, y: S1.y2, size: S1.size, color: C.attenue, t, t0: 1.18, stagger: 0.026, dur: 1.0 });
  const pp = E.outBack(prog(t, 1.72, 2.08));
  if (pp > 0) {
    c.fillStyle = C.lampe; c.beginPath(); c.arc(S1.px, S1.py, S1.r * pp, 0, TAU); c.fill();
    halo(c, S1.px, S1.py, 70 * pp, 0.55 * (1 - k.zp));
  }
  c.restore();

  // Les deux moitiés du noir s'écartent le long de la couture
  const sp = E.swift(prog(t, 0.78, 1.32));
  if (sp < 1) {
    const d = sp * (H / 2 + 140);
    const pts = S1.couture.pts;
    c.save(); c.fillStyle = C.nuit;
    c.save(); c.translate(0, -d); c.beginPath(); c.moveTo(-100, -200); c.lineTo(W + 100, -200);
    for (let i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i].x, pts[i].y);
    c.closePath(); c.fill();
    c.strokeStyle = `rgba(247,228,149,${0.7 * (1 - sp)})`; c.lineWidth = 2; c.shadowColor = C.lampe; c.shadowBlur = 24;
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); if (sp > 0) c.stroke();
    c.restore();
    c.save(); c.translate(0, d); c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.lineTo(W + 100, H + 200); c.lineTo(-100, H + 200); c.closePath(); c.fill();
    c.strokeStyle = `rgba(247,228,149,${0.7 * (1 - sp)})`; c.lineWidth = 2; c.shadowColor = C.lampe; c.shadowBlur = 24;
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); if (sp > 0) c.stroke();
    c.restore();
    c.restore();
  }
  // Éclair le long de la couture à l'ouverture
  if (t > 0.76 && t < 1.4) {
    const a = Math.exp(-(t - 0.78) * 7) * 0.75;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, 540 - 90, 0, 540 + 90);
    g.addColorStop(0, 'rgba(247,228,149,0)'); g.addColorStop(0.5, `rgba(255,240,190,${a})`); g.addColorStop(1, 'rgba(247,228,149,0)');
    c.fillStyle = g; c.fillRect(0, 540 - 90, W, 180);
    c.restore();
  }

  // Le fil : couture plein écran, puis soulignement de « sur mesure »
  c.save();
  c.translate(k.fx, k.fy); c.scale(k.z, k.z); c.translate(-S1.px, -S1.py);
  if (t >= 0.1 && t < 1.0) {
    const u = E.swift(prog(t, 0.1, 0.74));
    fil(c, S1.couture, 0, u, { w: 4.2, aiguille: 1 - prog(t, 0.72, 0.8), trainee: 260 });
  } else if (t >= 1.0) {
    const m = E.swift(prog(t, 0.98, 1.74));
    const p = m >= 1 ? S1.souligne : melange(S1.couture, S1.souligne, m);
    fil(c, p, 0, 1, { w: lerp(4.2, 3.6, m), aiguille: Math.sin(m * Math.PI) * 0.7, trainee: 120 });
  }
  c.restore();
  // Petit point de lumière avant l'entrée de l'aiguille
  if (t < 0.2) halo(c, 0, 540 + 16 * Math.sin(0.5), 160, 0.35 * prog(t, 0, 0.12));
  return k;
}

/* ---------- Scène 2 : les dossiers anonymisés ---------- */
const S2 = { cx: 1452, cy: 560 };
const DOCS_ARRIERE = [
  { titre: 'Devis', dx: -262, dy: -40, r: -0.2 },
  { titre: 'Fiche technique', dx: -150, dy: -178, r: -0.095 },
  { titre: 'Appel d’offres', dx: 150, dy: -186, r: 0.085 },
  { titre: 'Relance client', dx: 330, dy: -120, r: 0.2 },
  { titre: 'Chiffrage', dx: -300, dy: 200, r: -0.13 },
];
const RECTO = { w: 520, h: 690, dx: -6, dy: 44, r: -0.03 };
const CHAMPS = [
  { label: 'Client', valeur: 'Durand SA', jeton: '[CLIENT]', y: 176 },
  { label: 'Présents', valeur: 'M. Leroy, Mme Petit', jeton: '[SALARIÉ], [SALARIÉ]', y: 228 },
  { label: 'Fournisseur', valeur: 'Garnier et Fils', jeton: '[FOURNISSEUR]', y: 280 },
  { label: 'Rédigé par', valeur: 'Julie Martin', jeton: '[NOM]', y: 632 },
];
const faisceauY = t => lerp(150, 950, E.inOutCubic(prog(t, 3.42, 4.36)));
function prepareS2() {
  const r = mulberry32(21);
  for (const d of DOCS_ARRIERE) d.barres = Array.from({ length: 11 }, () => 0.45 + r() * 0.5);
  RECTO.barres = Array.from({ length: 9 }, () => 0.62 + r() * 0.36);
  for (const ch of CHAMPS) {
    const ys = S2.cy + RECTO.dy - RECTO.h / 2 + ch.y - 8;
    let lo = 3.3, hi = 4.5;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (faisceauY(m) < ys) lo = m; else hi = m; }
    ch.tDeclic = lo;
  }
}
function papier(c, w, h, ombre) {
  const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0, '#EEEBE4'); g.addColorStop(0.55, '#D2CEC5'); g.addColorStop(1, '#9C988F');
  c.fillStyle = g; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 6); c.fill();
  if (ombre > 0) { c.fillStyle = `rgba(6,5,9,${ombre})`; c.fill(); }
}
function barres(c, x, y, w, ws, pas, col) {
  c.fillStyle = col;
  ws.forEach((k, i) => { c.beginPath(); c.roundRect(x, y + i * pas, w * k, 9, 4.5); c.fill(); });
}
function docArriere(c, d) {
  const w = 420, h = 560;
  papier(c, w, h, 0.42);
  texte(c, d.titre, -w / 2 + 34, -h / 2 + 62, { size: 25, weight: 500, color: '#15121A' });
  c.fillStyle = 'rgba(21,18,26,0.25)'; c.fillRect(-w / 2 + 34, -h / 2 + 84, w - 68, 1.5);
  barres(c, -w / 2 + 34, -h / 2 + 116, w - 68, d.barres, 30, 'rgba(60,56,64,0.45)');
}
function brouille(str, n, seed) {
  const jeu = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*';
  let s = '';
  for (let i = 0; i < n; i++) s += jeu[Math.floor(hash(seed * 13.7 + i * 7.3) * jeu.length)];
  return s;
}
function champ(c, ch, idx, t, x0, y0) {
  const y = y0 + ch.y;
  texte(c, ch.label, x0 + 38, y, { size: 18, color: '#6A665E' });
  const vx = x0 + 172;
  const u = t - ch.tDeclic;
  police(c, 21, SANS, 500, 0);
  if (u < 0) { c.fillStyle = '#16131A'; c.fillText(ch.valeur, vx, y); return; }
  if (u < 0.5) {
    const q = clamp((u - 0.08) / 0.42);
    const n = Math.round(lerp(ch.valeur.length, ch.jeton.length, q));
    let s = '';
    const seed = Math.floor(t * 30) + idx * 100;
    const brut = brouille('', n, seed);
    for (let i = 0; i < n; i++) s += q > 0.25 + (i / n) * 0.7 ? ch.jeton[i] ?? brut[i] : brut[i];
    if (u < 0.08) s = ch.valeur;
    const w = c.measureText(s).width;
    c.fillStyle = C.lampe; c.beginPath(); c.roundRect(vx - 8, y - 21, w + 16, 30, 6); c.fill();
    c.fillStyle = C.nuit; c.fillText(s, vx, y);
    return;
  }
  police(c, 20, SANS, 500, 0.6);
  const w = c.measureText(ch.jeton).width;
  const flash = Math.exp(-(u - 0.5) * 10);
  c.fillStyle = C.nuit; c.beginPath(); c.roundRect(vx - 8, y - 21, w + 16, 30, 6); c.fill();
  if (flash > 0.02) { c.strokeStyle = `rgba(247,228,149,${flash})`; c.lineWidth = 2; c.stroke(); }
  c.fillStyle = C.lampe; c.fillText(ch.jeton, vx, y);
}
function docRecto(c, t) {
  const { w, h } = RECTO, x0 = -w / 2, y0 = -h / 2;
  papier(c, w, h, 0);
  police(c, 50, SERIF, 400, -0.8); c.fillStyle = '#15121A'; c.fillText('Compte rendu', x0 + 38, y0 + 90);
  c.fillStyle = 'rgba(21,18,26,0.22)'; c.fillRect(x0 + 38, y0 + 118, w - 76, 1.5); c.fillRect(x0 + 38, y0 + 314, w - 76, 1.5);
  barres(c, x0 + 38, y0 + 348, w - 76, RECTO.barres, 28, 'rgba(60,56,64,0.42)');
  c.fillStyle = 'rgba(21,18,26,0.22)'; c.fillRect(x0 + 38, y0 + 598, w - 76, 1.5);
  CHAMPS.forEach((ch, i) => champ(c, ch, i, t, x0, y0));
}
function faisceau(c, y, a) {
  const x0 = 980, x1 = 1900, w = x1 - x0;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, y - 180, 0, y);
  g.addColorStop(0, 'rgba(247,228,149,0)'); g.addColorStop(1, `rgba(247,228,149,${0.16 * a})`);
  const m = c.createLinearGradient(x0, 0, x1, 0);
  m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.12, 'rgba(0,0,0,1)'); m.addColorStop(0.88, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  fx.save(); fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, W, H);
  fx.fillStyle = g; fx.fillRect(x0, y - 180, w, 180);
  fx.fillStyle = `rgba(255,246,210,${0.95 * a})`; fx.fillRect(x0, y - 1.5, w, 3);
  fx.fillStyle = `rgba(247,228,149,${0.3 * a})`; fx.fillRect(x0, y - 7, w, 14);
  fx.globalCompositeOperation = 'destination-in'; fx.fillStyle = m; fx.fillRect(x0, y - 200, w, 220);
  fx.restore();
  c.drawImage(fxCv, 0, 0);
  c.restore();
}
function scene2(c, t, o = {}) {
  c.save();
  c.fillStyle = C.nuit2; c.fillRect(-10, -10, W + 20, H + 20);
  lueur(c, 240, 60, 1500, 0.11);
  lueur(c, 1750, 1000, 900, 0.35, '7,35,71');
  const z = lerp(1.24, 1, E.snap(prog(t, 2.5, 3.7)));
  c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
  poussiere(c, t, 500, 250, 800, 0.7);

  const sortieT = 4.95;
  const docs = [...DOCS_ARRIERE.map((d, i) => ({ d, i })), { d: RECTO, i: 5, recto: true }];
  for (const { d, i, recto } of docs) {
    const ti = 2.6 + i * 0.055;
    const p = E.snap(prog(t, ti, ti + 0.95));
    if (p <= 0) continue;
    const so = sortieT + (5 - i) * 0.028;
    const q = E.inStrong(prog(t, so, so + 0.44));
    if (q >= 1) continue;
    const sgn = i % 2 ? 1 : -1;
    const x = S2.cx + d.dx + (1 - p) * 420 - q * 2700;
    const y = S2.cy + d.dy + (1 - p) * 860 + q * 120 * sgn;
    c.save();
    c.translate(x, y);
    c.rotate(d.r + (1 - p) * 0.55 * sgn - q * 0.35);
    const s = lerp(0.72, recto ? 1 : 0.92, p);
    c.scale(s, s);
    c.globalAlpha = clamp(p * 3);
    if (recto) docRecto(c, t); else docArriere(c, d);
    c.restore();
  }
  const fa = prog(t, 3.36, 3.46) * (1 - prog(t, 4.3, 4.42));
  if (fa > 0) faisceau(c, faisceauY(t), fa);

  monte(c, 'Vos dossiers,', { x: 140, y: 470, size: 118, color: C.texte, t, t0: 2.86, stagger: 0.03, tOut: 4.6 });
  monte(c, 'anonymisés d’abord.', { x: 140, y: 590, size: 118, color: C.attenue, t, t0: 3.0, stagger: 0.026, tOut: 4.64 });
  const sa = E.snap(prog(t, 3.95, 4.6)) * (1 - E.soft(prog(t, 4.72, 4.95)));
  if (sa > 0) {
    c.save(); c.globalAlpha = sa;
    texte(c, 'Rien de ce qui identifie quelqu’un n’entre dans l’outil.', 143, 684 + (1 - sa) * 22, { size: 27, color: C.texte2 });
    c.restore();
  }
  c.restore();
}

/* ---------- Scènes 3 et 4 : le mètre ruban, puis le cadran des heures gagnées ---------- */
const PX = 640, TAPE_Y = 655, HW = 55, PLAY_X = 760, H0 = 8.72, H1 = 17.2, R_ANNEAU = 600;
const PAN = monotone([[5.35, 8.64], [5.8, 8.8], [6.35, 9.95], [6.85, 11.35], [7.35, 13.8], [7.95, 16.15], [8.3, 17.0], [9.0, 17.0]]);
const ETAPES = [
  { h: 9.0, t: 'Votre objectif d’abord', m: 'Matin', rang: 0 },
  { h: 9.75, t: 'Les règles, et vos dossiers anonymisés', rang: 1 },
  { h: 10.5, t: 'La configuration de votre compte', b: 'Étape essentielle', rang: 0 },
  { h: 11.5, t: 'Vos tâches, une par une', m: 'Fin de matinée et après-midi', rang: 1 },
  { h: 14.0, t: 'Un outil construit par vous', rang: 0 },
  { h: 16.25, t: 'Clôture', m: '16 h 15', rang: 1 },
];
const RANG_Y = [482, 366];
const rotAnneau = t => 0.62 * Math.PI * E.outCubic(prog(t, 9.15, 11.2)) + 0.04 * Math.max(0, t - 9.15);
function geo(t) {
  if (t < 9.15) {
    const cc = E.enroule(prog(t, 8.48, 9.15));
    return { Ha: PAN(t), k: cc / R_ANNEAU, th0: Math.PI, Ax: lerp(PLAY_X, 960, cc), Ay: lerp(TAPE_Y, 540 + R_ANNEAU, cc) };
  }
  const th0 = Math.PI + rotAnneau(t);
  return { Ha: 17, k: 1 / R_ANNEAU, th0, Ax: 960 + Math.sin(th0) * R_ANNEAU, Ay: 540 - Math.cos(th0) * R_ANNEAU };
}
function pt(g, h) {
  const s = (g.Ha - h) * PX, th = g.th0 + g.k * s;
  let x, y;
  if (g.k < 1e-9) { x = g.Ax + s * Math.cos(g.th0); y = g.Ay + s * Math.sin(g.th0); }
  else { x = g.Ax + (Math.sin(th) - Math.sin(g.th0)) / g.k; y = g.Ay - (Math.cos(th) - Math.cos(g.th0)) / g.k; }
  return { x, y, tx: Math.cos(th), ty: Math.sin(th), nx: -Math.sin(th), ny: Math.cos(th), th };
}
function decale(ps, d) { return ps.map(p => ({ x: p.x + p.nx * d, y: p.y + p.ny * d })); }
function ligne(c, ps) { c.beginPath(); ps.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); }
function ruban(c, t, g, pousse) {
  const hw = HW * pousse;
  if (hw < 0.4) return;
  let hMin = H0 - 0.1;
  if (g.k > 1e-9) hMin = Math.max(hMin, H1 - (TAU - 0.2) / g.k / PX);
  const hDeb = Math.max(hMin, H0);
  const ps = [];
  for (let h = hDeb; h < H1; h += 1 / 40) ps.push(pt(g, h));
  ps.push(pt(g, H1));
  c.save();
  c.lineCap = 'butt'; c.lineJoin = 'round';
  ligne(c, ps); c.strokeStyle = C.ocre; c.lineWidth = hw * 2; c.stroke();
  ligne(c, decale(ps, hw * 0.55)); c.strokeStyle = 'rgba(255,214,140,0.13)'; c.lineWidth = hw * 0.8; c.stroke();
  ligne(c, decale(ps, -hw * 0.72)); c.strokeStyle = 'rgba(40,18,0,0.22)'; c.lineWidth = hw * 0.56; c.stroke();
  ligne(c, decale(ps, hw - 1.2)); c.strokeStyle = 'rgba(255,226,160,0.55)'; c.lineWidth = 1.6; c.stroke();
  ligne(c, decale(ps, -hw + 1.2)); c.strokeStyle = 'rgba(30,14,0,0.5)'; c.lineWidth = 1.6; c.stroke();
  // Couture du bord bas, fixée au ruban
  c.setLineDash([13, 9]); c.lineDashOffset = (hDeb - H0) * PX;
  ligne(c, decale(ps, -hw + 13 * pousse)); c.strokeStyle = 'rgba(247,228,149,0.8)'; c.lineWidth = 2.4; c.lineCap = 'round'; c.stroke();
  c.setLineDash([]);
  // Graduations
  const vague = t < 6.2;
  for (let m = Math.ceil(hDeb * 12); m <= Math.floor(H1 * 12); m++) {
    const h = m / 12, p = pt(g, h);
    if (p.x < -140 || p.x > W + 140 || p.y < -140 || p.y > H + 140) continue;
    let a = 1;
    if (vague) a = prog(t, 5.42 + (p.x / W) * 0.34, 5.6 + (p.x / W) * 0.34);
    if (a <= 0) continue;
    const heure = m % 12 === 0, demi = m % 6 === 0, quart = m % 3 === 0;
    const len = (heure ? 52 : demi ? 34 : quart ? 25 : 15) * pousse;
    c.strokeStyle = `rgba(10,6,4,${0.82 * a})`; c.lineWidth = heure ? 3.2 : demi ? 2.4 : 1.7;
    const ex = p.x + p.nx * hw, ey = p.y + p.ny * hw;
    c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - p.nx * len, ey - p.ny * len); c.stroke();
    if (heure) {
      c.save();
      c.translate(p.x - p.tx * 11 + p.nx * (hw - 27 * pousse), p.y - p.ty * 11 + p.ny * (hw - 27 * pousse));
      c.rotate(p.th - Math.PI);
      police(c, 42 * pousse, SERIF, 400, 0);
      c.textBaseline = 'middle'; c.fillStyle = `rgba(10,6,4,${0.9 * a})`; c.fillText(String(Math.round(h)), 0, 2);
      c.restore();
    }
  }
  // Embout de laiton
  if (hMin < H0) {
    const a = pt(g, H0 - 0.1), b = pt(g, H0);
    const gr = c.createLinearGradient(a.x + a.nx * hw, a.y + a.ny * hw, a.x - a.nx * hw, a.y - a.ny * hw);
    gr.addColorStop(0, '#E9CF8A'); gr.addColorStop(0.5, '#B38A3E'); gr.addColorStop(1, '#6E5020');
    c.fillStyle = gr; c.beginPath();
    c.moveTo(a.x + a.nx * hw * 1.08, a.y + a.ny * hw * 1.08); c.lineTo(b.x + b.nx * hw * 1.08, b.y + b.ny * hw * 1.08);
    c.lineTo(b.x - b.nx * hw * 1.08, b.y - b.ny * hw * 1.08); c.lineTo(a.x - a.nx * hw * 1.08, a.y - a.ny * hw * 1.08); c.closePath(); c.fill();
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    c.fillStyle = 'rgba(40,24,6,0.7)';
    for (const s of [-1, 1]) { c.beginPath(); c.arc(mx + a.nx * hw * 0.5 * s, my + a.ny * hw * 0.5 * s, 4 * pousse, 0, TAU); c.fill(); }
  }
  c.restore();
}
function etape(c, st, x, a) {
  const pIn = clamp((1760 - x) / 430);
  if (pIn <= 0 || x < -1000) return;
  const y = RANG_Y[st.rang], haut = TAPE_Y - HW;
  const cp = E.snap(clamp(pIn * 1.7));
  const yFin = y + (st.m || st.b ? 52 : 22);
  c.save(); c.globalAlpha *= a;
  c.strokeStyle = 'rgba(247,228,149,0.5)'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(x, haut); c.lineTo(x, lerp(haut, yFin, cp)); c.stroke();
  c.fillStyle = C.lampe; c.beginPath(); c.arc(x, haut, 5.5 * cp, 0, TAU); c.fill();
  const dx = PLAY_X - x;
  if (dx > 0 && dx < 320) {
    const q = dx / 320;
    c.strokeStyle = `rgba(247,228,149,${(1 - q) * 0.9})`; c.lineWidth = 2;
    c.beginPath(); c.arc(x, haut, 6 + q * 70, 0, TAU); c.stroke();
    halo(c, x, haut, 90, (1 - q) * 0.6);
  }
  monte(c, st.t, { x: x + 18, y, size: 50, color: C.texte, t: pIn, t0: 0.18, stagger: 0.011, dur: 0.55 });
  const la = E.snap(prog(pIn, 0.45, 1));
  if (la > 0) {
    c.save(); c.globalAlpha *= la;
    if (st.m) texte(c, st.m, x + 20, y + 40 + (1 - la) * 12, { size: 21, weight: 500, color: C.ocre });
    if (st.b) {
      police(c, 17, SANS, 500, 0.2);
      const w = c.measureText(st.b).width;
      c.strokeStyle = 'rgba(247,228,149,0.7)'; c.lineWidth = 1.2;
      c.beginPath(); c.roundRect(x + 19, y + 17 + (1 - la) * 12, w + 18, 28, 6); c.stroke();
      c.fillStyle = C.lampe; c.fillText(st.b, x + 28, y + 37 + (1 - la) * 12);
    }
    c.restore();
  }
  c.restore();
}
function lecture(Ha) {
  let h = Math.floor(Ha), m = Math.round(((Ha - h) * 60) / 5) * 5;
  if (m >= 60) { h += 1; m = 0; }
  if (h < 9) { h = 9; m = 0; }
  return `${h} h ${String(m).padStart(2, '0')}`;
}
function dixHeures(c, t, a) {
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  const size = 152, ls = -size * 0.02;
  police(c, size, SERIF, 400, ls);
  const m1 = decoupe(c, '10 h gagnées');
  const x0 = 960 - m1.w / 2, y1 = 498, y2 = 648;
  const p = E.outQuart(prog(t, 9.2, 10.3)), u = 10 * p, lh = size * 0.98;
  const colX = x0 + m1.xs[1], colW = m1.xs[2] - m1.xs[1];
  const apparait = E.snap(prog(t, 9.12, 9.5));
  // Colonne des unités
  c.save(); c.beginPath(); c.rect(colX - 12, y1 - size * 0.84, colW + 24, size * 1.06); c.clip();
  c.fillStyle = C.lampe; c.textAlign = 'center';
  const base = Math.floor(u), f = u - base;
  for (let k = 0; k < 2; k++) c.fillText(String((base + k) % 10), colX + colW / 2, y1 + (k - f) * lh + (1 - apparait) * size);
  c.restore();
  // Colonne des dizaines
  const tp = E.snap(clamp(u - 9));
  if (tp > 0) {
    c.save(); c.beginPath(); c.rect(x0 - 14, y1 - size * 0.84, m1.xs[1] + 16, size * 1.06); c.clip();
    police(c, size, SERIF, 400, ls); c.fillStyle = C.lampe; c.textAlign = 'left';
    c.fillText('1', x0, y1 + (1 - tp) * lh);
    c.restore();
  }
  monte(c, ' h gagnées', { x: x0 + m1.xs[2], y: y1, size, ls, color: C.lampe, t, t0: 9.22, stagger: 0.032 });
  monte(c, 'chaque semaine', { x: 960, align: 'center', y: y2, size, ls, color: C.lampe, t, t0: 9.4, stagger: 0.028 });
  // Ligne de preuve, découverte par un balayage
  const wp = E.soft(prog(t, 9.95, 10.55));
  if (wp > 0) {
    police(c, 26, SANS, 500, 0.5);
    const s = 'Dernière dirigeante formée · 08.09.2026';
    const w = c.measureText(s).width, sx = 960 - w / 2;
    c.save(); c.beginPath(); c.rect(sx - 4, 700, (w + 8) * wp, 80); c.clip();
    c.fillStyle = C.attenueCiel; c.fillText(s, sx, 752);
    c.restore();
    if (wp < 1) { c.fillStyle = C.lampe; c.fillRect(sx + (w + 8) * wp - 2, 724, 2.5, 36); }
  }
  c.restore();
}
function scene34(c, t) {
  const fz = prog(t, 11.0, 11.5);
  const z = Math.pow(11, E.inCubic(fz));
  const base = c.getTransform();
  c.save();
  c.translate(960, 540); c.scale(z, z); c.translate(-960, -540);
  const g = geo(t);
  nuit(c, t, { px: -(g.Ha - 8.64) * PX * 0.05 - t * 10, lampe: { x: 160, y: 1180, r: 1300, a: 0.1 } });
  // Le ciel remplit le cadran
  const cxA = g.k > 1e-9 ? g.Ax - Math.sin(g.th0) / g.k : 960, cyA = g.k > 1e-9 ? g.Ay + Math.cos(g.th0) / g.k : 540;
  const sp = E.snap(prog(t, 8.95, 9.6));
  if (sp > 0 && g.k > 1e-9) {
    const rin = (1 / g.k - HW - 1) * sp;
    c.save(); c.beginPath(); c.arc(cxA, cyA, rin, 0, TAU); c.clip();
    const gr = c.createLinearGradient(0, cyA - 600, 0, cyA + 600);
    gr.addColorStop(0, C.ciel); gr.addColorStop(1, C.ciel2);
    c.fillStyle = gr; c.fillRect(cxA - 700, cyA - 700, 1400, 1400);
    lueur(c, 960, 540, 620, 0.1, '120,160,220');
    etoiles(c, t, -t * 20, 0.45);
    c.restore();
    if (sp < 1) {
      c.strokeStyle = `rgba(247,228,149,${0.8 * (1 - sp)})`; c.lineWidth = 2;
      c.beginPath(); c.arc(cxA, cyA, rin, 0, TAU); c.stroke();
    }
  }
  // Textes et repères de la journée
  const a3 = 1 - prog(t, 8.42, 8.66);
  if (a3 > 0) {
    monte(c, 'De 9 h à 17 h,', { x: 120, y: 190, size: 92, color: C.texte, t, t0: 5.55, stagger: 0.026, tOut: 8.36 });
    monte(c, 'dans vos locaux.', { x: 120, y: 280, size: 92, color: C.attenue, t, t0: 5.68, stagger: 0.024, tOut: 8.4 });
  }
  // Scène 5 visible dans le trou du cadran pendant la traversée
  if (fz > 0) dixHeures(c, t, 1 - E.soft(prog(t, 10.98, 11.22)));
  else if (t > 9.05) dixHeures(c, t, 1);
  if (fz > 0) {
    c.save();
    c.beginPath(); c.arc(960, 540, R_ANNEAU - HW - 1, 0, TAU); c.clip();
    c.setTransform(base);
    c.globalAlpha = E.soft(prog(t, 11.0, 11.3));
    scene5(c, t);
    c.restore();
  }
  ruban(c, t, g, E.snap(prog(t, 5.3, 5.72)));
  if (a3 > 0 && t > 5.3) {
    c.save(); c.globalAlpha = a3;
    for (const st of ETAPES) etape(c, st, PLAY_X + (st.h - g.Ha) * PX, 1);
    const pa = E.snap(prog(t, 5.55, 5.95));
    if (pa > 0) {
      const y0 = TAPE_Y - (HW + 36) * pa, y1 = TAPE_Y + (HW + 30) * pa;
      c.strokeStyle = C.lampe; c.lineWidth = 2.5; c.shadowColor = C.lampe; c.shadowBlur = 16;
      c.beginPath(); c.moveTo(PLAY_X, y0); c.lineTo(PLAY_X, y1); c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = C.lampe; c.beginPath(); c.moveTo(PLAY_X - 9, y0 - 12); c.lineTo(PLAY_X + 9, y0 - 12); c.lineTo(PLAY_X, y0); c.closePath(); c.fill();
      halo(c, PLAY_X, y0 - 4, 70, 0.5 * pa);
      c.globalAlpha = a3 * pa;
      texte(c, lecture(g.Ha), PLAY_X, 868 + (1 - pa) * 30, { size: 104, fam: SERIF, color: C.lampe, align: 'center', ls: -2 });
    }
    c.restore();
  }
  c.restore();
  return g;
}

/* ---------- Scène 5 : Antoine Contino ---------- */
const S5 = { x: 300, y: 312, w: 456, h: 456 };
let portraitCv;
function preparePortrait(img) {
  portraitCv = toile(800, 800);
  const p = portraitCv.getContext('2d');
  p.filter = 'grayscale(0.55) contrast(1.1) brightness(0.9)';
  p.drawImage(img, 0, 0, 800, 800);
  p.filter = 'none';
  p.globalCompositeOperation = 'soft-light';
  const g = p.createLinearGradient(0, 0, 800, 800);
  g.addColorStop(0, 'rgba(247,215,140,0.95)'); g.addColorStop(1, 'rgba(7,35,71,0.95)');
  p.fillStyle = g; p.fillRect(0, 0, 800, 800);
  p.globalCompositeOperation = 'multiply';
  const v = p.createRadialGradient(300, 330, 120, 400, 400, 620);
  v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(1, 'rgba(20,24,40,1)');
  p.fillStyle = v; p.fillRect(0, 0, 800, 800);
  const m = 22;
  S5.cadre = echantillonne(u => {
    const x0 = S5.x - m, y0 = S5.y - m, w = S5.w + 2 * m, h = S5.h + 2 * m, per = 2 * (w + h);
    let d = u * per;
    if (d < w) return { x: x0 + d, y: y0 };
    d -= w; if (d < h) return { x: x0 + w, y: y0 + d };
    d -= h; if (d < w) return { x: x0 + w - d, y: y0 + h };
    d -= w; return { x: x0, y: y0 + h - d };
  }, 320);
}
function fondS5(c, a = 1) {
  c.save(); c.globalAlpha *= a;
  c.fillStyle = C.nuit2; c.fillRect(-10, -10, W + 20, H + 20);
  lueur(c, 120, -60, 1500, 0.13);
  lueur(c, 1800, 1080, 900, 0.3, '7,35,71');
  c.restore();
}
function scene5(c, t, o = {}) {
  if (o.fond !== false) fondS5(c);
  const ex = E.inStrong(prog(t, 12.95, 13.36));
  const ent = lerp(0.8, 1, E.outCubic(prog(t, 10.98, 11.9)));
  c.save();
  c.translate(960, 540); c.scale(ent, ent); c.translate(-960, -540);
  c.translate(-460 * ex, 0);
  c.globalAlpha *= 1 - ex;
  poussiere(c, t, 420, 300, 700, 0.6);
  // Portrait dévoilé de haut en bas
  const rv = E.snap(prog(t, 11.18, 11.75));
  if (rv > 0) {
    const s = lerp(1.22, 1, E.outCubic(prog(t, 11.18, 12.5)));
    c.save();
    c.beginPath(); c.roundRect(S5.x, S5.y, S5.w, S5.h * rv, 8); c.clip();
    const cx = S5.x + S5.w / 2, cy = S5.y + S5.h / 2;
    c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy);
    c.drawImage(portraitCv, S5.x, S5.y, S5.w, S5.h);
    c.restore();
    if (rv < 1) { c.fillStyle = C.lampe; c.fillRect(S5.x, S5.y + S5.h * rv - 1, S5.w, 2); halo(c, S5.x + S5.w / 2, S5.y + S5.h * rv, 160, 0.4); }
  }
  if (t < 12.95) {
    const u = E.swift(prog(t, 11.08, 11.74));
    fil(c, S5.cadre, 0, u, { w: 3.4, aiguille: 1 - prog(t, 11.7, 11.82), trainee: 150 });
  }
  monte(c, 'Antoine Contino', { x: 862, y: 506, size: 138, color: C.texte, t, t0: 11.22, stagger: 0.026 });
  const la = E.snap(prog(t, 11.55, 12.1)), lb = E.snap(prog(t, 11.68, 12.25));
  c.save(); c.globalAlpha *= la;
  texte(c, 'Formateur IA · COO d’IFS, atelier textile des Vosges', 866, 584 + (1 - la) * 20, { size: 29, color: C.attenue });
  c.restore();
  c.save(); c.globalAlpha *= lb;
  texte(c, 'Certification HarvardX CS50AI, janvier 2026', 866, 636 + (1 - lb) * 20, { size: 29, weight: 500, color: C.lampe });
  c.restore();
  c.restore();
}

/* ---------- Scène 6 : l'appel final, sur la boucle vidéo du site ---------- */
const S6 = {};
const IMAGES_BOUCLE = [];
const VIDEO_DEBUT = 84;
function prepareS6() {
  const size = 124; police(out, size, SERIF, 400, -size * 0.022);
  S6.size = size;
  const w2 = out.measureText('de 30 minutes').width;
  S6.souligne = echantillonne(u => ({ x: lerp(960 - w2 / 2 + 2, 960 + w2 / 2 - 8, u), y: 416 + 2.5 * Math.sin(u * TAU * 3) }), 320);
}
function imageBoucle(t) {
  const i = clamp(Math.floor((t - 12.95) * 24), 0, IMAGES_BOUCLE.length - 1);
  return IMAGES_BOUCLE[i];
}
function scene6(c, t) {
  c.fillStyle = C.nuit; c.fillRect(-10, -10, W + 20, H + 20);
  const a = E.soft(prog(t, 12.98, 13.55));
  const img = imageBoucle(t);
  const push = lerp(1.0, 1.065, E.soft(prog(t, 12.95, 15)));
  const s = 1.8 * push, lx = 700, ly = 650;
  c.save();
  c.globalAlpha = a;
  c.translate(lx, ly); c.scale(s, s); c.translate(-480, -360);
  c.filter = 'blur(1.6px) brightness(0.86) saturate(0.95)';
  c.drawImage(img, 0, 0);
  c.filter = 'none';
  c.restore();
  // Voile pour la lisibilité du haut
  const g = c.createLinearGradient(0, 0, 0, 820);
  g.addColorStop(0, 'rgba(6,5,9,0.9)'); g.addColorStop(0.5, 'rgba(6,5,9,0.62)'); g.addColorStop(1, 'rgba(6,5,9,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, 820);
  const bas = c.createLinearGradient(0, 820, 0, H);
  bas.addColorStop(0, 'rgba(6,5,9,0)'); bas.addColorStop(1, 'rgba(6,5,9,0.7)');
  c.fillStyle = bas; c.fillRect(0, 820, W, H - 820);
  // Pulsation de la lampe
  const pulse = Math.exp(-Math.pow((t - 14.12) / 0.28, 2));
  lueur(c, lx, ly - 10, 520, 0.08 + 0.22 * pulse);

  const ba = E.snap(prog(t, 13.45, 13.95));
  if (ba > 0) {
    c.save(); c.globalAlpha = ba;
    texte(c, 'Antoine Contino', 72, 88 - (1 - ba) * 14, { size: 42, fam: SERIF, color: C.texte, ls: -0.6 });
    texte(c, 'Formation IA pour dirigeants', 73, 118 - (1 - ba) * 14, { size: 17, color: C.attenue, ls: 0.2 });
    c.restore();
  }
  monte(c, 'Réserver un audit IA', { x: 960, align: 'center', y: 264, size: S6.size, color: C.texte, t, t0: 13.18, stagger: 0.024 });
  monte(c, 'de 30 minutes', { x: 960, align: 'center', y: 384, size: S6.size, color: C.attenue, t, t0: 13.32, stagger: 0.026 });
  const ua = E.snap(prog(t, 13.72, 14.3));
  if (ua > 0) {
    c.save(); c.globalAlpha = ua;
    texte(c, 'plaquette-formation.netlify.app', 960, 500 + (1 - ua) * 18, { size: 30, weight: 500, color: C.texte, align: 'center', ls: 0.3 });
    c.restore();
  }
}

/* ---------- Composition ---------- */
const CHOCS = [[0.8, 11], [2.95, 7], [5.33, 5], [9.15, 9], [11.46, 8], [13.2, 5]];
function secousse(t) {
  let x = 0, y = 0;
  for (const [th, a] of CHOCS) {
    if (t < th || t > th + 0.8) continue;
    const k = a * Math.exp(-(t - th) * 9);
    x += k * Math.sin(t * 91 + th * 7); y += k * Math.cos(t * 77 + th * 3);
  }
  return { x, y };
}
function aberration(t) {
  let d = 0;
  for (const [th, a] of CHOCS) if (t >= th) d += a * 0.55 * Math.exp(-(t - th) * 11);
  for (const ch of CHAMPS) { const u = t - ch.tDeclic - 0.5; if (u >= 0) d += 3 * Math.exp(-u * 18); }
  const ip = prog(t, 2.35, 2.96); d += 6 * Math.pow(ip, 3) * (t < 2.97 ? 1 : 0);
  return d;
}
function scene(c, t) {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = C.nuit; c.fillRect(0, 0, W, H);
  const sh = secousse(t);
  c.translate(sh.x, sh.y);
  if (t < 2.97) {
    const k = scene1(c, t);
    if (k.zp > 0) {
      const R = S1.r * k.z;
      if (R > 2) {
        c.save();
        c.beginPath(); c.arc(k.fx, k.fy, R, 0, TAU); c.clip();
        scene2(c, t);
        c.restore();
        const ea = 1 - prog(R, 700, 1300);
        if (ea > 0) {
          c.save(); c.strokeStyle = `rgba(247,228,149,${ea})`; c.lineWidth = 3 + R * 0.006; c.shadowColor = C.lampe; c.shadowBlur = 30;
          c.beginPath(); c.arc(k.fx, k.fy, R, 0, TAU); c.stroke(); c.restore();
        }
      }
    }
  } else if (t < 11.5) {
    if (t >= 5.1) scene34(c, t);
    if (t < 5.45) {
      c.save(); c.globalAlpha = 1 - prog(t, 5.15, 5.45);
      scene2(c, t);
      c.restore();
    }
    if (t >= 4.95 && t < 5.7) {
      const u = E.swift(prog(t, 4.95, 5.34));
      const p = echantillonne(v => ({ x: lerp(W + 90, -90, v), y: TAPE_Y + 5 * Math.sin(v * TAU * 2) * (1 - prog(t, 5.3, 5.5)) }), 200);
      fil(c, p, 0, u, { w: 4, a: 1 - prog(t, 5.36, 5.62), aiguille: 1 - prog(t, 5.3, 5.4), trainee: 260 });
    }
  } else if (t < 12.95) {
    scene5(c, t);
  } else {
    scene6(c, t);
    if (t < 13.4) {
      fondS5(c, 1 - E.soft(prog(t, 12.95, 13.3)));
      scene5(c, t, { fond: false });
    }
    const m = E.swift(prog(t, 12.95, 13.62));
    const p = m >= 1 ? S6.souligne : melange(S5.cadre, S6.souligne, m);
    fil(c, p, 0, 1, { w: lerp(3.4, 3.6, m), aiguille: Math.sin(m * Math.PI) * 0.8, trainee: 140 });
  }
  c.restore();
}

/* Flou de bouger : moyenne de sous-images sur un obturateur à 180° dans les passages rapides. */
const FENETRES = [[2.28, 2.97, 16], [4.88, 5.46, 10], [8.45, 9.32, 10], [9.32, 10.25, 6], [10.95, 11.55, 14], [12.9, 13.5, 8]];
const OBTURATEUR = 0.5 / FPS;
function nbEchantillons(t) { for (const [a, b, n] of FENETRES) if (t >= a && t < b) return n; return 1; }

function post(t) {
  out.save();
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.globalCompositeOperation = 'source-over'; out.globalAlpha = 1;
  const d = aberration(t);
  if (d > 0.4) {
    rC.globalCompositeOperation = 'source-over'; rC.fillStyle = '#000'; rC.fillRect(0, 0, W, H);
    rC.drawImage(scCv, d, 0); rC.globalCompositeOperation = 'multiply'; rC.fillStyle = '#f00'; rC.fillRect(0, 0, W, H);
    gC.globalCompositeOperation = 'source-over'; gC.fillStyle = '#000'; gC.fillRect(0, 0, W, H);
    gC.drawImage(scCv, -d, 0); gC.globalCompositeOperation = 'multiply'; gC.fillStyle = '#0ff'; gC.fillRect(0, 0, W, H);
    out.drawImage(rCv, 0, 0);
    out.globalCompositeOperation = 'lighter'; out.drawImage(gCv, 0, 0);
    out.globalCompositeOperation = 'source-over';
  } else out.drawImage(scCv, 0, 0);
  // Halo de lumière (bloom) sur les hautes lumières
  bloom.clearRect(0, 0, W / 4, H / 4);
  bloom.filter = 'brightness(0.72) contrast(4) blur(6px)';
  bloom.drawImage(sortie, 0, 0, W / 4, H / 4);
  bloom.filter = 'none';
  bloom2.clearRect(0, 0, W / 8, H / 8);
  bloom2.filter = 'blur(9px)';
  bloom2.drawImage(bloomCv, 0, 0, W / 8, H / 8);
  bloom2.filter = 'none';
  out.globalCompositeOperation = 'screen';
  out.globalAlpha = 0.2; out.drawImage(bloomCv, 0, 0, W, H);
  out.globalAlpha = 0.22; out.drawImage(bloom2Cv, 0, 0, W, H);
  out.globalAlpha = 1; out.globalCompositeOperation = 'source-over';
  out.drawImage(vignetteCv, 0, 0);
  // Grain
  const f = Math.round(t * FPS);
  out.globalCompositeOperation = 'overlay'; out.globalAlpha = 0.085;
  out.translate(-Math.floor(hash(f) * 256), -Math.floor(hash(f + 0.5) * 256));
  out.fillStyle = GRAINS[f % GRAINS.length]; out.fillRect(0, 0, W + 256, H + 256);
  out.restore();
}
let vignetteCv, GRAINS = [];
function prepareFinitions() {
  vignetteCv = toile();
  const v = vignetteCv.getContext('2d');
  const g = v.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.36)');
  v.fillStyle = g; v.fillRect(0, 0, W, H);
  const r = mulberry32(99);
  for (let k = 0; k < 6; k++) {
    const cv = toile(256, 256), cc = cv.getContext('2d');
    const im = cc.createImageData(256, 256);
    for (let i = 0; i < im.data.length; i += 4) { const n = 128 + (r() + r() + r() - 1.5) * 150; im.data[i] = im.data[i + 1] = im.data[i + 2] = clamp(n, 0, 255); im.data[i + 3] = 255; }
    cc.putImageData(im, 0, 0);
    GRAINS.push(out.createPattern(cv, 'repeat'));
  }
}

window.renderFrame = function (t) {
  const n = nbEchantillons(t);
  if (n === 1) scene(sc, t);
  else {
    acc.globalCompositeOperation = 'source-over';
    for (let j = 0; j < n; j++) {
      const tt = t + OBTURATEUR * (j / (n - 1) - 0.5);
      scene(tmp, tt);
      acc.globalAlpha = 1 / (j + 1);
      acc.drawImage(tmpCv, 0, 0);
    }
    acc.globalCompositeOperation = 'source-over'; acc.globalAlpha = 1;
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.fillStyle = C.nuit; sc.fillRect(0, 0, W, H);
    sc.drawImage(accCv, 0, 0);
  }
  post(t);
  return true;
};

/* Évènements pour la bande son, calculés sur la même horloge que l'image. */
window.evenementsSon = function () {
  const ev = [];
  ev.push({ type: 'aiguille', t0: 0.1, t1: 0.74, gain: 1 });
  ev.push({ type: 'aiguille', t0: 4.95, t1: 5.34, gain: 0.8 });
  ev.push({ type: 'aiguille', t0: 11.36, t1: 12.02, gain: 0.6 });
  ev.push({ type: 'aiguille', t0: 12.98, t1: 13.6, gain: 0.55 });
  for (const [th, a] of CHOCS) ev.push({ type: 'choc', t: th, gain: a / 11 });
  ev.push({ type: 'souffle', t0: 2.3, t1: 2.95, gain: 1 });
  ev.push({ type: 'souffle', t0: 4.88, t1: 5.34, gain: 0.7 });
  ev.push({ type: 'montee', t0: 8.45, t1: 9.15, gain: 1 });
  ev.push({ type: 'souffle', t0: 10.95, t1: 11.46, gain: 0.9 });
  ev.push({ type: 'souffle', t0: 12.9, t1: 13.2, gain: 0.6 });
  ev.push({ type: 'faisceau', t0: 3.42, t1: 4.36, gain: 1 });
  for (const ch of CHAMPS) { ev.push({ type: 'brouille', t: ch.tDeclic + 0.08, gain: 0.7 }); ev.push({ type: 'declic', t: ch.tDeclic + 0.5, gain: 1 }); }
  // Heures qui passent sous le curseur, étapes franchies
  let prev = PAN(5.35);
  for (let f = Math.round(5.35 * FPS) + 1; f <= Math.round(8.4 * FPS); f++) {
    const tt = f / FPS, h = PAN(tt);
    for (let m = Math.floor(prev * 4) + 1; m <= Math.floor(h * 4); m++) ev.push({ type: 'tic', t: tt, gain: m % 4 === 0 ? 1 : 0.45 });
    ETAPES.forEach((st, i) => { if (prev < st.h && h >= st.h) ev.push({ type: 'note', t: tt, gain: 0.8, degre: i }); });
    prev = h;
  }
  // Compteur des 10 heures
  let pu = 0;
  for (let f = Math.round(9.2 * FPS); f <= Math.round(10.3 * FPS); f++) {
    const tt = f / FPS, u = Math.floor(10 * E.outQuart(prog(tt, 9.2, 10.3)));
    if (u > pu) { ev.push({ type: 'cran', t: tt, gain: 0.9 }); pu = u; }
  }
  ev.push({ type: 'carillon', t: 14.12, gain: 1 });
  return ev;
};

function chargeImage(src) { return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; }); }
window.PRET = (async () => {
  const f1 = new FontFace('Instrument Serif', 'url(../../site/fonts/instrument-serif-latin.woff2)', { weight: '400' });
  const f2 = new FontFace('Inter', 'url(../../site/fonts/inter-latin.woff2)', { weight: '400 500' });
  await Promise.all([f1.load(), f2.load()]);
  document.fonts.add(f1); document.fonts.add(f2);
  const portrait = await chargeImage('../../site/images/portrait.webp');
  const n = Math.ceil((DUREE - 12.95) * 24) + 2;
  for (let i = 0; i < n; i++) IMAGES_BOUCLE.push(await chargeImage(`boucle/f${String(VIDEO_DEBUT + i + 1).padStart(3, '0')}.jpg`));
  prepareS1(); prepareS2(); preparePortrait(portrait); prepareS6(); prepareFinitions();
  return true;
})();
