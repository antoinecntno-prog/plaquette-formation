import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, Easing, interpolate, spring, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timings from '../timings.json';

export const FPS = 30;
export const W = 1080, H = 1920;
export const SAFE = {top: 270, bottom: 1250, left: 110, right: 970};
export const OCRE = '#C98A2E';
export const BORDEAUX = '#6E1E2B';
export const DARK = '#2A0C12';
export const INK = '#1F1A1B';
export const GREY = '#7A7072';
export const WHITE = '#FFFFFF';
export const FONT = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";

// texte affiché, dans l'ordre exact du script (l'horodatage vient de la voix)
export const SCRIPT = (
  "Vous avez payé des abonnements IA pour vos équipes. Ouvrir les comptes a pris dix minutes. " +
  "Les faire entrer dans le travail de tous les jours, c'est un autre chantier. " +
  "L'Accélérateur IA 30 jours, c'est une journée chez vous, sur vos vrais dossiers. Cinq personnes au plus. " +
  "Chaque participant repart avec une heure gagnée par semaine. " +
  "Résultat vérifié à trente jours. S'il manque, je reviens sans frais. " +
  "Réservez votre audit gratuit de trente minutes."
).split(' ');

type Wd = {t: string; s: number; e: number};
const WORDS: Wd[] = timings.words as Wd[];
if (WORDS.length !== SCRIPT.length) throw new Error(`timings ${WORDS.length} mots, script ${SCRIPT.length}`);
export const ws = (i: number) => WORDS[i].s;
export const we = (i: number) => WORDS[i].e;
export const word = (i: number) => SCRIPT[i];
export const PH = [0, 9, 16, 30, 47, 56, 67, 74];
export const P = (k: number) => ws(PH[k - 1]);
export const DURATION: number = timings.duration;
export const VOICE_END: number = timings.voiceEnd;

export const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const E_OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const E_IN = Easing.bezier(0.64, 0, 0.78, 0);
export const E_INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (t: number, start: number, dur: number, ease = E_OUT) =>
  dur <= 0 ? (t >= start ? 1 : 0) : interpolate(t, [start, start + dur], [0, 1], {...clampOpt, easing: ease});
export const sp = (t: number, start: number, cfg?: {damping?: number; stiffness?: number; mass?: number}) =>
  spring({frame: Math.max(0, (t - start) * FPS), fps: FPS, config: {damping: 20, stiffness: 150, mass: 1, ...(cfg || {})}});
export const f2 = (n: number) => n.toFixed(2);

// entrée : glissement + flou de mouvement qui se résorbe
export const enter = (t: number, start: number, o: {dx?: number; dy?: number; blur?: number; scale?: number; dur?: number; ease?: any} = {}): React.CSSProperties => {
  const {dx = 0, dy = 60, blur = 14, scale = 1, dur = 0.6, ease = E_OUT} = o;
  if (t < start) return {opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(${scale})`};
  const p = prog(t, start, dur, ease);
  const v = 1 - p;
  return {
    opacity: prog(t, start, dur * 0.4, Easing.out(Easing.quad)),
    transform: `translate(${f2(dx * v)}px, ${f2(dy * v)}px) scale(${(scale + (1 - scale) * p).toFixed(4)})`,
    filter: v > 0.02 ? `blur(${f2(blur * v * v)}px)` : undefined,
  };
};
// sortie : léger recul d'anticipation puis départ accéléré flouté
export const exit = (t: number, end: number, o: {dx?: number; dy?: number; blur?: number; dur?: number; scale?: number} = {}): React.CSSProperties | null => {
  const {dx = 0, dy = -80, blur = 16, dur = 0.4, scale = 1} = o;
  const start = end - dur;
  if (t < start - 0.12) return null;
  const a = prog(t, start - 0.12, 0.12, E_INOUT) * (1 - prog(t, start, dur * 0.5));
  const p = prog(t, start, dur, E_IN);
  return {
    opacity: interpolate(p, [0.2, 1], [1, 0], clampOpt),
    transform: `translate(${f2(-dx * 0.06 * a + dx * p)}px, ${f2(-dy * 0.06 * a + dy * p)}px) scale(${(1 + (scale - 1) * p).toFixed(4)})`,
    filter: p > 0.01 ? `blur(${f2(blur * p)}px)` : undefined,
  };
};
export const mix = (...s: (React.CSSProperties | null | undefined)[]): React.CSSProperties => {
  const tr: string[] = [], fl: string[] = []; let op = 1;
  for (const x of s) { if (!x) continue; if (x.transform) tr.push(String(x.transform)); if (x.filter) fl.push(String(x.filter)); if (x.opacity !== undefined) op *= Number(x.opacity); }
  return {transform: tr.join(' ') || undefined, filter: fl.join(' ') || undefined, opacity: op};
};

// polices : le rendu attend le chargement, puis les mesures de texte deviennent fiables
export const useFonts = () => {
  const [h] = useState(() => delayRender('DM Sans'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all([
      loadFont({family: 'DM Sans', url: staticFile('fonts/DMSans-latin.woff2'), weight: '100 1000'}),
      loadFont({family: 'DM Sans', url: staticFile('fonts/DMSans-latinext.woff2'), weight: '100 1000'}),
    ]).then(() => document.fonts.ready).then(() => { setReady(true); continueRender(h); })
      .catch(() => { setReady(true); continueRender(h); });
  }, [h]);
  return ready;
};

// marque neutre : disque ocre et rayons arrondis réguliers (aucun logo de marque)
export const Mark: React.FC<{size: number; t: number; color?: string; style?: React.CSSProperties}> = ({size, t, color = OCRE, style}) => {
  const rays = 12;
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" style={{display: 'block', ...style}}>
      <g transform={`rotate(${f2(t * 18)})`}>
        {Array.from({length: rays}).map((_, i) => (
          <line key={i} x1="0" y1="-22" x2="0" y2="-44" stroke={color} strokeWidth="7" strokeLinecap="round" transform={`rotate(${(360 / rays) * i})`} />
        ))}
      </g>
      <circle r="15" fill={color} />
    </svg>
  );
};

export const AVATAR_BG = [
  'linear-gradient(140deg, #E8B866, #C98A2E)',
  'linear-gradient(140deg, #B5525F, #6E1E2B)',
  'linear-gradient(140deg, #F2D399, #D49A45)',
  'linear-gradient(140deg, #8C2A3C, #3A1018)',
  'linear-gradient(140deg, #D9A24A, #8C2A3C)',
];
export const Avatar: React.FC<{size: number; i: number; ring?: string; style?: React.CSSProperties}> = ({size, i, ring = OCRE, style}) => (
  <div style={{width: size, height: size, borderRadius: '50%', background: AVATAR_BG[i % 5], position: 'relative', overflow: 'hidden',
    boxShadow: `0 0 0 ${Math.round(size * 0.05)}px ${ring}, 0 0 0 ${Math.round(size * 0.09)}px rgba(255,255,255,0.9), 0 10px 24px rgba(42,12,18,0.22)`, ...style}}>
    <div style={{position: 'absolute', left: '50%', top: '19%', width: '34%', height: '34%', marginLeft: '-17%', borderRadius: '50%', background: 'rgba(255,255,255,0.95)'}} />
    <div style={{position: 'absolute', left: '50%', top: '58%', width: '68%', height: '62%', marginLeft: '-34%', borderRadius: '50% 50% 0 0', background: 'rgba(255,255,255,0.95)'}} />
  </div>
);
export const Cursor: React.FC<{size?: number; style?: React.CSSProperties; flip?: boolean}> = ({size = 46, style, flip}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', filter: 'drop-shadow(0 4px 6px rgba(42,12,18,0.25))', transform: flip ? 'scaleX(-1)' : undefined, ...style}}>
    <path d="M3 2.5l17 8-7.2 1.9-3.6 7.1z" fill={OCRE} stroke={WHITE} strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

// masque doux qui garde tout le contenu dans la zone utile Meta (fondu sur ~35 px aux bords)
export const SAFE_MASK: React.CSSProperties = {
  maskImage: 'linear-gradient(90deg, transparent 0px, transparent 100px, #000 138px, #000 942px, transparent 980px), linear-gradient(180deg, transparent 0px, transparent 262px, #000 296px, #000 1222px, transparent 1258px)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent 0px, transparent 100px, #000 138px, #000 942px, transparent 980px), linear-gradient(180deg, transparent 0px, transparent 262px, #000 296px, #000 1222px, transparent 1258px)',
  maskComposite: 'intersect', WebkitMaskComposite: 'source-in',
} as React.CSSProperties;

// flou directionnel (flou de mouvement) : filtre SVG à écart-type différent en x et en y
export const DirBlur: React.FC<{id: string; x: number; y: number}> = ({id, x, y}) => (
  <svg width="0" height="0" style={{position: 'absolute'}}>
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
      <feGaussianBlur stdDeviation={`${Math.max(0, x).toFixed(2)} ${Math.max(0, y).toFixed(2)}`} />
    </filter>
  </svg>
);
export const dirF = (id: string, x: number, y: number) => (x > 0.15 || y > 0.15 ? `url(#${id})` : undefined);
// masque de zone utile avec bornes réglables (fondu de ~32 px)
export const safeMask = (top = 262, bottom = 1258, left = 100, right = 980): React.CSSProperties => {
  const m = `linear-gradient(90deg, transparent 0px, transparent ${left}px, #000 ${left + 36}px, #000 ${right - 36}px, transparent ${right}px), linear-gradient(180deg, transparent 0px, transparent ${top}px, #000 ${top + 32}px, #000 ${bottom - 36}px, transparent ${bottom}px)`;
  return {maskImage: m, WebkitMaskImage: m, maskComposite: 'intersect', WebkitMaskComposite: 'source-in'} as React.CSSProperties;
};
export const backOut = (s = 1.6) => (x: number) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
export const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
