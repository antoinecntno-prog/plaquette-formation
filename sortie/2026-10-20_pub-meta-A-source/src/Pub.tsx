import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate,
  spring, staticFile, useCurrentFrame,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import timings from './timings.json';

// ---------- constantes ----------
export const FPS = 30;
const BORDEAUX = '#6E1E2B';
const OCRE = '#C98A2E';
const DARK = '#2A0C12';
const WHITE = '#FFFFFF';
const INK = '#2A0C12';          // texte sur fond blanc
const GREY = '#6B5A5E';         // texte secondaire sur blanc
const FONT = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SAFE = {top: 270, bottom: 1250, left: 110, right: 970};
const SW = SAFE.right - SAFE.left;

type W = {t: string; s: number; e: number};
const words: W[] = timings.words as W[];
const ws = (i: number) => words[i].s;
const we = (i: number) => words[i].e;
const PH = [0, 9, 16, 30, 47, 56, 67];
const P = (k: number) => ws(PH[k - 1]);
const DURATION: number = timings.duration;

const OUT = Easing.out(Easing.cubic);
const IN = Easing.in(Easing.cubic);
const INOUT = Easing.inOut(Easing.quad);
const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const prog = (t: number, start: number, dur: number, ease = OUT) =>
  interpolate(t, [start, start + dur], [0, 1], {...clampOpt, easing: ease});
// ressort sans rebond (registre éditorial) ou avec léger dépassement (registre objet)
const sp = (t: number, start: number, cfg?: {damping?: number; stiffness?: number; mass?: number}) =>
  spring({frame: Math.max(0, (t - start) * FPS), fps: FPS, config: {damping: 26, stiffness: 120, mass: 1, ...(cfg || {})}});

// entrée éditoriale : glissement amorti, flou qui se résorbe, aucune oscillation
const enterStyle = (t: number, start: number, o: {dx?: number; dy?: number; blur?: number; scale?: number; dur?: number} = {}): React.CSSProperties => {
  const {dx = 0, dy = 70, blur = 14, scale = 1, dur = 0.7} = o;
  if (t < start) return {opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(${scale})`};
  const p = prog(t, start, dur, Easing.bezier(0.2, 0.9, 0.2, 1));
  const op = prog(t, start, dur * 0.45, Easing.out(Easing.quad));
  const v = 1 - p;
  return {
    opacity: op,
    transform: `translate(${(dx * v).toFixed(2)}px, ${(dy * v).toFixed(2)}px) scale(${(scale + (1 - scale) * p).toFixed(4)})`,
    filter: v > 0.02 ? `blur(${(blur * v * v).toFixed(2)}px)` : undefined,
  };
};
// sortie : anticipation (léger recul) puis départ accéléré avec flou de mouvement
const exitStyle = (t: number, end: number, o: {dy?: number; dx?: number; dur?: number; anticip?: number; blur?: number} = {}): React.CSSProperties | null => {
  const {dy = -140, dx = 0, dur = 0.42, anticip = 0.18, blur = 16} = o;
  const start = end - dur;
  if (t < start - anticip) return null;
  const a = anticip > 0 ? interpolate(t, [start - anticip, start], [0, 1], {...clampOpt, easing: INOUT}) : 0;
  const p = prog(t, start, dur, Easing.bezier(0.6, 0, 0.9, 0.2));
  const op = interpolate(p, [0.3, 1], [1, 0], clampOpt);
  const back = 0.08;
  return {
    opacity: op,
    transform: `translate(${(-dx * back * a * (1 - p) + dx * p).toFixed(2)}px, ${(-dy * back * a * (1 - p) + dy * p).toFixed(2)}px)`,
    filter: p > 0.01 ? `blur(${(blur * p).toFixed(2)}px)` : undefined,
  };
};
const useT = () => useCurrentFrame() / FPS;

// ---------- polices ----------
const useFonts = () => {
  const [h] = useState(() => delayRender('DM Sans'));
  useEffect(() => {
    Promise.all([
      loadFont({family: 'DM Sans', url: staticFile('fonts/DMSans-latin.woff2'), weight: '100 1000'}),
      loadFont({family: 'DM Sans', url: staticFile('fonts/DMSans-latinext.woff2'), weight: '100 1000'}),
    ]).then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
};

// ---------- instants de bascule ----------
// tache floue 1 : du blanc vers le fond chaud, couvre l'écran à P4 ; tache 2 : retour au blanc à P7
const COVER1 = () => P(4) - 0.08;
const COVER2 = () => P(7) - 0.08;
const isDark = (t: number) => t >= COVER1() && t < COVER2();

// ---------- fond blanc à arcs (référence) ----------
const ArcsBg: React.FC<{t: number; visible: boolean}> = ({t, visible}) => {
  if (!visible) return null;
  const breathe = 1 + 0.03 * Math.sin(t * 0.5);
  const drift = Math.sin(t * 0.28) * 30;
  const ring = (c: string, a: number) => `repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 150px, ${c.replace('A', String(a))} 215px, rgba(0,0,0,0) 290px)`;
  return (
    <AbsoluteFill style={{background: WHITE, overflow: 'hidden'}}>
      {/* grands arcs dont le centre est hors cadre, à gauche */}
      <div style={{
        position: 'absolute', left: -1900, top: -700, width: 3000, height: 3000, borderRadius: '50%',
        background: ring('rgba(201,138,46,A)', 0.34),
        filter: 'blur(34px)', opacity: 0.9,
        maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 70%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 70%)',
        transform: `translate(${drift}px, ${-drift * 0.5}px) scale(${breathe})`,
      }} />
      <div style={{
        position: 'absolute', left: -600, top: 900, width: 3000, height: 3000, borderRadius: '50%',
        background: ring('rgba(110,30,43,A)', 0.16),
        filter: 'blur(40px)', opacity: 0.8,
        maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,1) 44%, rgba(0,0,0,0) 62%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,1) 44%, rgba(0,0,0,0) 62%)',
        transform: `translate(${-drift * 0.7}px, ${drift * 0.4}px) scale(${2 - breathe})`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(90deg, rgba(110,30,43,0.028) 0px, rgba(110,30,43,0.028) 16px, rgba(0,0,0,0) 16px, rgba(0,0,0,0) 60px)',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0) 38%)',
        WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0) 38%)',
        transform: `translateX(${Math.sin(t * 0.22) * 26}px)`,
      }} />
    </AbsoluteFill>
  );
};

// ---------- fond chaud plein cadre (paysage abstrait de la référence) ----------
const WarmBg: React.FC<{t: number; visible: boolean}> = ({t, visible}) => {
  if (!visible) return null;
  const k = t * 0.35;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${DARK} 0%, #4A1420 42%, ${BORDEAUX} 62%, #A8552F 84%, ${OCRE} 100%)`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -300 + Math.sin(k) * 40, top: 820, width: 1700, height: 1100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,138,46,0.75) 0%, rgba(201,138,46,0) 65%)', filter: 'blur(30px)'}} />
      <div style={{position: 'absolute', left: 200 + Math.cos(k * 0.8) * 30, top: -300, width: 1400, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,42,60,0.8) 0%, rgba(140,42,60,0) 65%)', filter: 'blur(30px)'}} />
      {/* collines */}
      <div style={{position: 'absolute', left: -500, top: 1560 + Math.sin(k * 0.6) * 6, width: 1700, height: 700, borderRadius: '50%', background: 'rgba(74,20,32,0.85)', filter: 'blur(6px)'}} />
      <div style={{position: 'absolute', left: 400, top: 1640 + Math.cos(k * 0.5) * 6, width: 1600, height: 700, borderRadius: '50%', background: 'rgba(42,12,18,0.9)', filter: 'blur(6px)'}} />
      <div style={{position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 14px, rgba(0,0,0,0) 14px, rgba(0,0,0,0) 50px)', maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0) 50%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0) 50%)'}} />
    </AbsoluteFill>
  );
};

// ---------- tache floue de transition ----------
const Blob: React.FC<{t: number; cover: number; fromLeft: boolean}> = ({t, cover, fromLeft}) => {
  const start = cover - 0.6, end = cover + 0.5;
  if (t < start || t > end) return null;
  const grow = prog(t, start, 0.6, Easing.bezier(0.5, 0, 0.3, 1));
  const fade = t > cover ? prog(t, cover, 0.5, Easing.in(Easing.quad)) : 0;
  const scale = 0.15 + 1.25 * grow;
  const x = fromLeft ? -1400 + 1600 * grow : 1400 - 1600 * grow;
  return (
    <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
      <div style={{
        position: 'absolute', left: 540 - 1500, top: 960 - 1500, width: 3000, height: 3000, borderRadius: '50%',
        background: `radial-gradient(circle, ${OCRE} 0%, #B3663A 30%, ${BORDEAUX} 58%, rgba(110,30,43,0.95) 70%, rgba(110,30,43,0) 74%)`,
        filter: 'blur(28px)', opacity: 1 - fade,
        transform: `translate(${x}px, ${(fromLeft ? 1 : -1) * 500 * (1 - grow)}px) scale(${scale})`,
      }} />
    </AbsoluteFill>
  );
};

// ---------- sous-titres (typographie de la référence) ----------
type Chunk = {from: number; to: number; kw: number[]; y: number; size: number};
const TOP = 310;
const CHUNKS: Chunk[] = [
  {from: 0, to: 8, kw: [4, 5], y: 560, size: 62},
  {from: 9, to: 15, kw: [14, 15], y: TOP, size: 54},
  {from: 16, to: 25, kw: [23, 24, 25], y: TOP, size: 54},
  {from: 26, to: 29, kw: [29], y: TOP, size: 54},
  {from: 30, to: 33, kw: [32, 33], y: 600, size: 78},
  {from: 34, to: 42, kw: [41, 42], y: TOP, size: 54},
  {from: 43, to: 46, kw: [43], y: TOP, size: 54},
  {from: 47, to: 50, kw: [], y: TOP, size: 54},
  {from: 51, to: 55, kw: [51, 52], y: TOP, size: 54},
  {from: 56, to: 60, kw: [57], y: TOP, size: 54},
  {from: 61, to: 66, kw: [65, 66], y: TOP, size: 54},
  {from: 67, to: 73, kw: [69, 70], y: 470, size: 60},
];
const LEAD = 0.05;

const ChunkView: React.FC<{c: Chunk; t: number; exitAt: number | null}> = ({c, t, exitAt}) => {
  const dark = isDark(ws(c.from));
  const exStart = exitAt !== null ? Math.min(we(c.to) + 0.02, exitAt - 0.18) : null;
  const ex = exStart !== null ? exitStyle(t, exStart + 0.2, {dy: -36, dur: 0.2, anticip: 0, blur: 8}) : null;
  const els: React.ReactNode[] = [];
  for (let i = c.from; i <= c.to; i++) {
    const w = words[i];
    const st = w.s - LEAD;
    const p = prog(t, st, 0.42, Easing.bezier(0.2, 0.9, 0.2, 1));
    const op = prog(t, st, 0.2, Easing.out(Easing.quad));
    const v = 1 - p;
    const isKw = c.kw.includes(i);
    els.push(
      <span key={i} style={{
        display: 'inline-block', marginRight: '0.26em', willChange: 'transform',
        color: isKw ? OCRE : (dark ? WHITE : INK),
        opacity: op, transform: `translateY(${(v * 34).toFixed(2)}px)`,
        filter: v > 0.03 ? `blur(${(v * v * 10).toFixed(2)}px)` : undefined,
      }}>{w.t}</span>,
    );
  }
  return (
    <div style={{
      position: 'absolute', left: SAFE.left, width: SW, top: c.y, textAlign: 'center', fontFamily: FONT,
      fontWeight: 700, fontSize: c.size, lineHeight: 1.14, letterSpacing: -0.5,
      textShadow: dark ? '0 2px 18px rgba(20,4,8,0.35)' : 'none', ...(ex || {}),
    }}>{els}</div>
  );
};
const Captions: React.FC = () => {
  const t = useT();
  let idx = -1;
  for (let k = 0; k < CHUNKS.length; k++) if (t >= ws(CHUNKS[k].from) - LEAD) idx = k;
  if (idx < 0) return null;
  const cur = CHUNKS[idx];
  const prev = idx > 0 ? CHUNKS[idx - 1] : null;
  const curStart = ws(cur.from) - LEAD;
  return (
    <>
      {prev && t < curStart + 0.05 ? <ChunkView c={prev} t={t} exitAt={curStart} /> : null}
      <ChunkView c={cur} t={t} exitAt={null} />
    </>
  );
};

// ---------- briques ----------
const Avatar: React.FC<{size: number; bg: string; style?: React.CSSProperties}> = ({size, bg, style}) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: bg, position: 'relative', overflow: 'hidden',
    boxShadow: `0 0 0 ${Math.round(size * 0.06)}px ${OCRE}, 0 8px 22px rgba(42,12,18,0.25)`, ...style,
  }}>
    <div style={{position: 'absolute', left: '50%', top: '20%', width: '32%', height: '32%', marginLeft: '-16%', borderRadius: '50%', background: 'rgba(255,255,255,0.94)'}} />
    <div style={{position: 'absolute', left: '50%', top: '60%', width: '66%', height: '60%', marginLeft: '-33%', borderRadius: '50% 50% 0 0', background: 'rgba(255,255,255,0.94)'}} />
  </div>
);
const Pointer: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <svg width="42" height="42" viewBox="0 0 24 24" style={{display: 'block', filter: 'drop-shadow(0 4px 8px rgba(42,12,18,0.25))', ...style}}>
    <path d="M4 3l16 7.5-7 1.8L9.5 20z" fill={OCRE} stroke={WHITE} strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
const Check: React.FC<{size?: number}> = ({size = 20}) => (
  <svg width={size} height={size} viewBox="0 0 20 20" style={{display: 'block'}}>
    <circle cx="10" cy="10" r="9" fill={OCRE} />
    <path d="M5.5 10.5l3 3 6-6.5" stroke={WHITE} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Mic: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
);
const Wave: React.FC = () => (
  <svg width="26" height="22" viewBox="0 0 26 24" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><path d="M3 10v4M8 6v12M13 3v18M18 7v10M23 10v4" /></svg>
);

// ---------- scène A : fenêtres de chat ----------
const PROMPTS = [
  'Résume la réunion fournisseur.',
  'Réponds au client sur le délai.',
  'Compare les devis reçus.',
  'Classe les mails par urgence.',
];
const AVATARS = [
  'linear-gradient(135deg, #E0B15A, #C98A2E)',
  'linear-gradient(135deg, #B04A5C, #6E1E2B)',
  'linear-gradient(135deg, #F0D08A, #C98A2E)',
  'linear-gradient(135deg, #8C2A3C, #2A0C12)',
];
const WIN = {w: 720, h: 150, pitch: 140, y0: 470};
const ChatWindow: React.FC<{i: number; t: number; tIn: number; tLabel: number; frozen: number}> = ({i, t, tIn, tLabel, frozen}) => {
  const left = i % 2 === 0 ? 110 : 250;
  const top = WIN.y0 + i * WIN.pitch;
  const fromLeft = i % 2 === 0;
  const en = enterStyle(t, tIn, {dx: fromLeft ? -420 : 420, dy: 30, blur: 24, dur: 0.85});
  const typed = Math.max(0, Math.floor((t - (tIn + 0.4)) * 34));
  const text = PROMPTS[i].slice(0, typed);
  const blink = frozen > 0 ? 1 : (Math.floor(t * 2.6) % 2 === 0 ? 1 : 0);
  const lab = prog(t, tLabel, 0.45);
  const avatarRight = i % 2 === 0;
  const hover = Math.sin(t * 1.3 + i) * 3;
  return (
    <div style={{position: 'absolute', left, top, width: WIN.w, height: WIN.h, ...en}}>
      <div style={{
        position: 'absolute', inset: 0, background: WHITE, borderRadius: 22,
        boxShadow: '0 24px 60px rgba(42,12,18,0.16), 0 2px 6px rgba(42,12,18,0.06)', padding: '24px 32px 20px 32px', boxSizing: 'border-box',
        fontFamily: FONT, color: GREY,
      }}>
        <div style={{fontSize: 27, lineHeight: 1.3, fontWeight: 400, minHeight: 40, paddingRight: 190, whiteSpace: 'nowrap', overflow: 'hidden'}}>
          {text}
          <span style={{display: 'inline-block', width: 3, height: 27, background: OCRE, marginLeft: 3, verticalAlign: '-5px', opacity: blink}} />
        </div>
        <div style={{position: 'absolute', left: 28, bottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, color: INK}}>
          <span style={{fontSize: 30, lineHeight: '20px', fontWeight: 400, marginRight: 4}}>+</span>
          <span style={{padding: '6px 14px', borderRadius: 8, background: '#F3ECEC', fontWeight: 700}}>Chat</span>
          <span style={{padding: '6px 14px', borderRadius: 8, color: GREY}}>Dossier</span>
        </div>
        <div style={{position: 'absolute', right: 28, bottom: 18, display: 'flex', alignItems: 'center', gap: 16, fontSize: 20, color: INK}}>
          <span><b>Modèle</b> <span style={{color: GREY}}>standard</span></span><Mic /><Wave />
        </div>
        <div style={{
          position: 'absolute', right: avatarRight ? 118 : 30, top: 22, display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 19, fontWeight: 700, color: OCRE, opacity: lab, transform: `translateY(${((1 - lab) * -10).toFixed(2)}px)`,
        }}>
          <Check /> Compte ouvert
        </div>
      </div>
      <Avatar size={76} bg={AVATARS[i]} style={{position: 'absolute', left: avatarRight ? WIN.w - 48 : -62, top: (avatarRight ? -40 : 30) + hover}} />
      <Pointer style={{position: 'absolute', left: avatarRight ? WIN.w - 92 : -88, top: (avatarRight ? -8 : 104) + hover * 0.6, transform: avatarRight ? 'none' : 'scaleX(-1)'}} />
    </div>
  );
};
const SceneChats: React.FC = () => {
  const t = useT();
  const p2 = P(2), p3 = P(3), c1 = COVER1();
  const tIns = [p2 + 0.05, p2 + 0.42, p2 + 0.8, p2 + 1.18];
  if (t < tIns[0] || t > c1 + 0.1) return null;
  const ex = exitStyle(t, c1 + 0.05, {dy: -260, dur: 0.5, anticip: 0.22});
  const g = prog(t, p3 - 0.05, 0.7, INOUT);
  const frozenStyle: React.CSSProperties = {
    filter: g > 0 ? `grayscale(${g.toFixed(3)}) brightness(${(1 - 0.08 * g).toFixed(3)})` : undefined,
    opacity: 1 - 0.42 * g,
    transform: `scale(${(1 - 0.02 * g).toFixed(4)})`,
    transformOrigin: '50% 70%',
  };
  const tLabs = tIns.map((x) => x + 0.8);
  return (
    <AbsoluteFill style={ex || {}}>
      <AbsoluteFill style={frozenStyle}>
        {[0, 1, 2, 3].map((i) => <ChatWindow key={i} i={i} t={t} tIn={tIns[i]} tLabel={tLabs[i]} frozen={g} />)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- scène B : table vue de dessus ----------
const SEATS = [{x: -130, y: -190}, {x: 130, y: -190}, {x: -130, y: 190}, {x: 130, y: 190}, {x: 320, y: 0}];
const SEAT_BG = [AVATARS[0], AVATARS[1], AVATARS[2], AVATARS[3], 'linear-gradient(135deg, #D9A24A, #8C2A3C)'];
const SceneTable: React.FC = () => {
  const t = useT();
  const tIn = ws(34) - 0.1, p5 = P(5);
  if (t < tIn || t > p5 + 0.1) return null;
  const ex = exitStyle(t, p5 + 0.05, {dy: -220, dur: 0.45, anticip: 0.2});
  const table = enterStyle(t, tIn, {dy: 90, blur: 16, scale: 0.92, dur: 0.8});
  const arrivals = [ws(36) - 0.05, ws(37) + 0.05, ws(39), ws(41), ws(43)];
  const cx = 540, cy = 790;
  return (
    <AbsoluteFill style={ex || {}}>
      <div style={{position: 'absolute', left: cx - 250, top: cy - 125, width: 500, height: 250, ...table}}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 90,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))',
          backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          border: '2px solid rgba(255,255,255,0.35)', boxShadow: '0 30px 70px rgba(20,4,8,0.35)',
        }} />
        <div style={{position: 'absolute', left: 70, right: 70, top: 118, height: 2, background: 'rgba(255,255,255,0.22)'}} />
      </div>
      {SEATS.map((s, i) => {
        const a = arrivals[i];
        const n = Math.hypot(s.x, s.y) || 1;
        const k = sp(t, a, {damping: 15, stiffness: 120});   // registre objet : léger dépassement
        const op = prog(t, a, 0.25);
        const v = Math.max(0, 1 - k);
        return (
          <div key={i} style={{position: 'absolute', left: cx + s.x - 42, top: cy + s.y - 42, width: 84, height: 84, opacity: t < a ? 0 : op,
            transform: `translate(${((s.x / n) * 200 * v).toFixed(2)}px, ${((s.y / n) * 200 * v).toFixed(2)}px) scale(${(0.6 + 0.4 * k).toFixed(4)})`,
            filter: v > 0.03 ? `blur(${(v * v * 18).toFixed(2)}px)` : undefined}}>
            <Avatar size={84} bg={SEAT_BG[i]} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- scène C : frise J0 à J30 (panneau givré) + compteur ----------
const ROWS = [
  {label: 'Journée sur site', from: 0, to: 1.4, kind: 'bar', color: WHITE},
  {label: 'Usage, semaine 1', from: 1.4, to: 8, kind: 'bar', color: OCRE},
  {label: 'Usage, semaine 2', from: 8, to: 15, kind: 'bar', color: OCRE},
  {label: 'Usage, semaine 3', from: 15, to: 22, kind: 'bar', color: OCRE},
  {label: 'Usage, semaine 4', from: 22, to: 29, kind: 'bar', color: OCRE},
  {label: 'Point de résultat', from: 30, to: 30, kind: 'dot', color: WHITE},
];
const SceneGantt: React.FC = () => {
  const t = useT();
  const p5 = P(5), p6 = P(6);
  if (t < p5 - 0.3 || t > p6 + 0.1) return null;
  const ex = exitStyle(t, p6 + 0.05, {dy: -220, dur: 0.45, anticip: 0.2});
  const panel = enterStyle(t, p5 - 0.05, {dy: 110, blur: 18, dur: 0.8});
  const PX = SAFE.left, PY = 470, PW = SW, PH_ = 420;
  const X0 = PX + 300, X1 = PX + PW - 40, Y0 = PY + 86, PITCH = 50, DAY = (X1 - X0) / 30;
  const cStart = ws(50) - 0.05, cEnd = we(52);
  const n = Math.round(interpolate(t, [cStart, cEnd], [0, 60], {...clampOpt, easing: Easing.inOut(Easing.cubic)}));
  const swapAt = ws(55) - 0.05;
  const counter = enterStyle(t, ws(49) - 0.05, {dy: 70, blur: 14});
  const sw = prog(t, swapAt, 0.5, Easing.bezier(0.2, 0.9, 0.2, 1));
  return (
    <AbsoluteFill style={ex || {}}>
      <div style={{position: 'absolute', left: PX, top: PY, width: PW, height: PH_, ...panel, fontFamily: FONT}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 24, background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 30px 70px rgba(20,4,8,0.3)'}} />
        {/* en-têtes de colonnes */}
        {[{d: 0, l: 'J0'}, {d: 30, l: 'J30'}].map((h) => (
          <div key={h.l} style={{position: 'absolute', left: X0 - PX + h.d * DAY - 60, width: 120, top: 26, textAlign: 'center', fontSize: 22, fontWeight: 700, color: WHITE, letterSpacing: 1}}>{h.l}</div>
        ))}
        {[0, 10, 20, 30].map((d) => (
          <div key={d} style={{position: 'absolute', left: X0 - PX + d * DAY, top: 64, width: 1, height: ROWS.length * PITCH + 20, background: 'rgba(255,255,255,0.22)'}} />
        ))}
        {ROWS.map((r, i) => {
          const st = p5 + 0.1 + i * 0.3;
          const f = prog(t, st, 0.6, Easing.bezier(0.2, 0.9, 0.2, 1));
          const lab = prog(t, st - 0.1, 0.35);
          const y = Y0 - PY + i * PITCH;
          return (
            <div key={i}>
              <div style={{position: 'absolute', left: 30, right: 30, top: y + 40, height: 1, background: 'rgba(255,255,255,0.14)'}} />
              <div style={{position: 'absolute', left: 30, top: y + 4, width: 260, opacity: lab, transform: `translateX(${((1 - lab) * -12).toFixed(2)}px)`, fontSize: 22, fontWeight: 700, color: WHITE}}>{r.label}</div>
              {r.kind === 'bar' ? (
                <div style={{position: 'absolute', left: X0 - PX + r.from * DAY, top: y + 6, height: 26, borderRadius: 6, width: Math.max(0, (r.to - r.from) * DAY * f), background: r.color, opacity: 0.92}} />
              ) : (
                <div style={{position: 'absolute', left: X0 - PX + 30 * DAY - 16, top: y + 3, width: 32, height: 32, borderRadius: '50%', border: `4px solid ${OCRE}`, background: WHITE, boxSizing: 'border-box', transform: `scale(${sp(t, st, {damping: 12, stiffness: 160}).toFixed(4)})`, opacity: t < st ? 0 : 1, boxShadow: '0 0 0 8px rgba(201,138,46,0.3)'}} />
              )}
            </div>
          );
        })}
        {[0, 10, 20, 30].map((d) => (
          <div key={d} style={{position: 'absolute', left: X0 - PX + d * DAY - 30, width: 60, top: PH_ - 36, textAlign: 'center', fontSize: 18, color: 'rgba(255,255,255,0.7)'}}>J{d}</div>
        ))}
      </div>
      <div style={{position: 'absolute', left: SAFE.left, width: SW, top: 920, textAlign: 'center', fontFamily: FONT, ...counter}}>
        <div style={{position: 'relative', height: 120}}>
          <div style={{position: 'absolute', inset: 0, opacity: 1 - sw, transform: `translateY(${(-sw * 30).toFixed(2)}px)`, filter: sw > 0.02 ? `blur(${(sw * 10).toFixed(2)}px)` : undefined}}>
            <div style={{fontSize: 110, fontWeight: 700, color: WHITE, lineHeight: 1}}>{n}<span style={{fontSize: 46, marginLeft: 12, color: 'rgba(255,255,255,0.8)'}}>min</span></div>
          </div>
          <div style={{position: 'absolute', inset: 0, opacity: sw, transform: `translateY(${((1 - sw) * 40).toFixed(2)}px)`, filter: sw < 0.98 ? `blur(${((1 - sw) * 10).toFixed(2)}px)` : undefined}}>
            <div style={{fontSize: 110, fontWeight: 700, color: OCRE, lineHeight: 1}}>1 h<span style={{fontSize: 46, marginLeft: 14, color: WHITE}}>/ semaine</span></div>
          </div>
        </div>
        <div style={{fontSize: 24, color: 'rgba(255,255,255,0.8)', marginTop: 4}}>par participant</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scène D : fiche de résultat + tampon ----------
const Dots: React.FC<{t: number; times: number[]}> = ({t, times}) => (
  <div style={{display: 'flex', gap: 14}}>
    {times.map((st, k) => {
      const s = sp(t, st, {damping: 13, stiffness: 180});
      return (
        <div key={k} style={{width: 30, height: 30, borderRadius: '50%', border: '3px solid #E6D9DB', boxSizing: 'border-box', position: 'relative'}}>
          <div style={{position: 'absolute', inset: -3, borderRadius: '50%', background: OCRE, transform: `scale(${Math.min(1.15, s).toFixed(4)})`, opacity: t >= st ? 1 : 0}} />
        </div>
      );
    })}
  </div>
);
const SceneFiche: React.FC = () => {
  const t = useT();
  const p6 = P(6), c2 = COVER2();
  if (t < p6 - 0.3 || t > c2 + 0.1) return null;
  const ex = exitStyle(t, c2 + 0.05, {dy: -220, dur: 0.45, anticip: 0.2});
  const card = enterStyle(t, p6 - 0.05, {dy: 120, blur: 18, scale: 0.96, dur: 0.8});
  const r1 = [0, 1, 2, 3, 4].map((k) => ws(56) + 0.25 + k * 0.13);
  const r2 = [0, 1, 2, 3, 4].map((k) => ws(58) - 0.05 + k * 0.13);
  const tStamp = we(59) - 0.05;
  const stS = sp(t, tStamp, {damping: 13, stiffness: 150});
  const stOp = prog(t, tStamp, 0.12);
  return (
    <AbsoluteFill style={ex || {}}>
      <div style={{position: 'absolute', left: 160, top: 500, width: 760, ...card, fontFamily: FONT}}>
        <div style={{background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: 24, boxShadow: '0 30px 70px rgba(20,4,8,0.35)', padding: '40px 46px 44px', color: INK}}>
          <div style={{fontSize: 34, fontWeight: 700}}>Fiche de résultat</div>
          <div style={{fontSize: 21, color: GREY, marginTop: 4}}>Relevé à trente jours</div>
          <div style={{height: 2, background: '#EFE6E7', margin: '26px 0 10px'}} />
          {[{l: 'Usage', ts: r1}, {l: 'Temps gagné', ts: r2}].map((row, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0', borderBottom: i === 0 ? '1px solid #EFE6E7' : 'none'}}>
              <div style={{fontSize: 30, fontWeight: 700}}>{row.l}</div>
              <Dots t={t} times={row.ts} />
            </div>
          ))}
        </div>
      </div>
      <div style={{
        position: 'absolute', left: 470, top: 850, padding: '12px 28px', border: `6px solid ${BORDEAUX}`, borderRadius: 12,
        color: BORDEAUX, fontFamily: FONT, fontWeight: 700, fontSize: 46, background: 'rgba(255,255,255,0.92)',
        boxShadow: '0 12px 30px rgba(20,4,8,0.25)', whiteSpace: 'nowrap',
        opacity: stOp, transform: `rotate(-8deg) scale(${(1.9 - 0.9 * Math.min(1, stS)).toFixed(4)})`, transformOrigin: '50% 50%',
      }}>Vérifié à J30</div>
    </AbsoluteFill>
  );
};

// ---------- scène E : appel à l'action ----------
const SceneCta: React.FC = () => {
  const t = useT();
  const p7 = P(7);
  if (t < p7 - 0.3) return null;
  const btn = enterStyle(t, p7 + 0.1, {dy: 120, blur: 18, scale: 0.95, dur: 0.8});
  const url = enterStyle(t, p7 + 0.45, {dy: 50, blur: 10});
  const breathe = 1 + 0.01 * Math.sin((t - p7) * 2.0);
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 220, top: 740, width: 640, height: 124, ...btn}}>
        <div style={{
          position: 'absolute', inset: 0, background: OCRE, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: WHITE, fontSize: 46, fontWeight: 700, boxShadow: '0 22px 50px rgba(201,138,46,0.35)', transform: `scale(${breathe.toFixed(4)})`,
        }}>Audit gratuit · 30 min</div>
      </div>
      <div style={{position: 'absolute', left: SAFE.left, width: SW, top: 905, textAlign: 'center', fontSize: 44, fontWeight: 700, color: INK, ...url}}>antoinecontino.fr</div>
    </AbsoluteFill>
  );
};

// ---------- composition ----------
export const Pub: React.FC = () => {
  useFonts();
  const t = useT();
  const dark = isDark(t);
  return (
    <AbsoluteFill style={{background: WHITE}}>
      <ArcsBg t={t} visible={!dark} />
      <WarmBg t={t} visible={dark} />
      <SceneChats />
      <SceneTable />
      <SceneGantt />
      <SceneFiche />
      <SceneCta />
      <Captions />
      <Blob t={t} cover={COVER1()} fromLeft />
      <Blob t={t} cover={COVER2()} fromLeft={false} />
      <Audio src={staticFile('voix.wav')} />
    </AbsoluteFill>
  );
};
