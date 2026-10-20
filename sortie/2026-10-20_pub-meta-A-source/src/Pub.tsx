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
const FONT = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SAFE = {top: 270, bottom: 1250, left: 110, right: 970};

type W = {t: string; s: number; e: number};
const words: W[] = timings.words as W[];
const ws = (i: number) => words[i].s;
const we = (i: number) => words[i].e;
// premier mot de chaque phrase (1..7)
const PH = [0, 9, 16, 30, 47, 56, 67];
const P = (k: number) => ws(PH[k - 1]);
const VOICE_END: number = timings.voiceEnd;
const DURATION: number = timings.duration;

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const prog = (t: number, start: number, dur: number, ease = EASE) =>
  interpolate(t, [start, start + dur], [0, 1], {...clampOpt, easing: ease});

const sp = (t: number, start: number, cfg?: {damping?: number; stiffness?: number; mass?: number}) =>
  spring({
    frame: Math.max(0, (t - start) * FPS),
    fps: FPS,
    config: {damping: 18, stiffness: 120, mass: 1, ...(cfg || {})},
  });

// entrée : glissement + flou de mouvement + amorti
const enterStyle = (
  t: number, start: number,
  o: {dx?: number; dy?: number; blur?: number; scale?: number; cfg?: any} = {},
): React.CSSProperties => {
  const {dx = 0, dy = 90, blur = 16, scale = 1, cfg} = o;
  if (t < start) return {opacity: 0, transform: `translate(${dx}px, ${dy}px)`};
  const p = sp(t, start, cfg);
  const op = prog(t, start, 0.3, Easing.out(Easing.quad));
  const v = Math.max(0, 1 - p);
  const sc = scale + (1 - scale) * p;
  return {
    opacity: op,
    transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px) scale(${sc})`,
    filter: v > 0.015 ? `blur(${blur * v * v}px)` : undefined,
  };
};

// sortie : anticipation (recul) puis glissement accéléré avec flou
const exitStyle = (
  t: number, end: number,
  o: {dy?: number; dx?: number; dur?: number; anticip?: number; blur?: number} = {},
): React.CSSProperties | null => {
  const {dy = -160, dx = 0, dur = 0.45, anticip = 0.2, blur = 18} = o;
  const start = end - dur;
  if (t < start - anticip) return null;
  const a = anticip > 0 ? interpolate(t, [start - anticip, start], [0, 1], {...clampOpt, easing: Easing.inOut(Easing.quad)}) : 0;
  const p = prog(t, start, dur, EASE_IN);
  const op = interpolate(p, [0.25, 1], [1, 0], clampOpt);
  const back = 0.09; // recul relatif avant le départ
  return {
    opacity: op,
    transform: `translate(${-dx * back * a * (1 - p) + dx * p}px, ${-dy * back * a * (1 - p) + dy * p}px)`,
    filter: p > 0.01 ? `blur(${blur * p}px)` : undefined,
  };
};

const merge = (...s: (React.CSSProperties | null | undefined)[]): React.CSSProperties => {
  // combine transforms / filters / opacities
  const out: React.CSSProperties = {};
  const tr: string[] = [];
  const fl: string[] = [];
  let op = 1;
  for (const x of s) {
    if (!x) continue;
    if (x.transform) tr.push(String(x.transform));
    if (x.filter) fl.push(String(x.filter));
    if (x.opacity !== undefined) op *= Number(x.opacity);
  }
  out.transform = tr.join(' ') || undefined;
  out.filter = fl.join(' ') || undefined;
  out.opacity = op;
  return out;
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

// ---------- fond ----------
const BLOBS = [
  {c: BORDEAUX, x: 180, y: 520, r: 920, ph: 0.0, sp: 0.42},
  {c: OCRE, x: 960, y: 1480, r: 820, ph: 2.1, sp: 0.35},
  {c: '#8C2A3C', x: 1020, y: 260, r: 720, ph: 4.0, sp: 0.5},
  {c: OCRE, x: 60, y: 1760, r: 620, ph: 1.2, sp: 0.3},
];
const Bg: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{background: DARK, overflow: 'hidden'}}>
      {BLOBS.map((b, i) => {
        const dx = Math.sin(t * b.sp + b.ph) * 46;
        const dy = Math.cos(t * b.sp * 0.8 + b.ph) * 34;
        const sc = 1 + 0.07 * Math.sin(t * b.sp * 0.9 + b.ph + 1);
        return (
          <div key={i} style={{
            position: 'absolute', left: b.x - b.r, top: b.y - b.r, width: b.r * 2, height: b.r * 2,
            borderRadius: '50%', opacity: 0.85,
            background: `radial-gradient(circle, ${b.c} 0%, ${b.c}B3 22%, ${b.c}40 48%, ${b.c}00 68%)`,
            transform: `translate(${dx}px, ${dy}px) scale(${sc})`,
          }} />
        );
      })}
      {/* stries verticales douces, comme la référence */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 16px, rgba(255,255,255,0) 16px, rgba(255,255,255,0) 54px)',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.35) 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.35) 100%)',
        transform: `translateX(${Math.sin(t * 0.25) * 30}px)`,
      }} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 55%, rgba(42,12,18,0) 40%, rgba(42,12,18,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

// ---------- sous-titres ----------
type Chunk = {from: number; to: number; kw: number[]};
const CHUNKS: Chunk[] = [
  {from: 0, to: 8, kw: [4, 5]},
  {from: 9, to: 15, kw: [14, 15]},
  {from: 16, to: 25, kw: [23, 24, 25]},
  {from: 26, to: 29, kw: [29]},
  {from: 30, to: 33, kw: [32, 33]},
  {from: 34, to: 42, kw: [41, 42]},
  {from: 43, to: 46, kw: [43]},
  {from: 47, to: 50, kw: []},
  {from: 51, to: 55, kw: [51, 52]},
  {from: 56, to: 60, kw: [57]},
  {from: 61, to: 66, kw: [65, 66]},
  {from: 67, to: 73, kw: [69, 70]},
];
const LEAD = 0.06; // les mots apparaissent un peu avant la voix

const ChunkView: React.FC<{c: Chunk; t: number; exitAt: number | null}> = ({c, t, exitAt}) => {
  // la sortie commence dès la fin du dernier mot et s'achève avant le premier mot du bloc suivant
  const exStart = exitAt !== null ? Math.min(we(c.to) + 0.02, exitAt - 0.16) : null;
  const ex = exStart !== null ? exitStyle(t, exStart + 0.18, {dy: -40, dur: 0.18, anticip: 0, blur: 10}) : null;
  const wordsEl: React.ReactNode[] = [];
  for (let i = c.from; i <= c.to; i++) {
    const w = words[i];
    const st = w.s - LEAD;
    const p = sp(t, st, {damping: 22, stiffness: 170});
    const op = prog(t, st, 0.16, Easing.out(Easing.quad));
    const isKw = c.kw.includes(i);
    wordsEl.push(
      <span key={i} style={{
        display: 'inline-block', marginRight: '0.26em',
        color: isKw ? OCRE : WHITE,
        opacity: op, transform: `translateY(${(1 - p) * 18}px)`,
      }}>{w.t}</span>,
    );
  }
  return (
    <div style={{
      position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: 1082,
      textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 52, lineHeight: 1.18,
      color: WHITE, textShadow: '0 2px 14px rgba(0,0,0,0.35)', ...(ex || {}),
    }}>{wordsEl}</div>
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

// ---------- scène A : fenêtres de chat ----------
const PROMPTS = [
  'Résume le compte rendu de la réunion fournisseur.',
  'Rédige la réponse au client sur le délai de livraison.',
  'Prépare le tableau comparatif des devis reçus.',
  'Classe les mails de la semaine par urgence.',
];
const AVATARS = [
  'linear-gradient(135deg, #E0B15A, #C98A2E)',
  'linear-gradient(135deg, #B04A5C, #6E1E2B)',
  'linear-gradient(135deg, #F0D08A, #C98A2E)',
  'linear-gradient(135deg, #8C2A3C, #2A0C12)',
];

const Avatar: React.FC<{size: number; bg: string; style?: React.CSSProperties}> = ({size, bg, style}) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: bg, position: 'relative', overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)', border: `${Math.max(2, size * 0.05)}px solid ${WHITE}`, ...style,
  }}>
    <div style={{position: 'absolute', left: '50%', top: '22%', width: '32%', height: '32%', marginLeft: '-16%', borderRadius: '50%', background: 'rgba(255,255,255,0.92)'}} />
    <div style={{position: 'absolute', left: '50%', top: '62%', width: '64%', height: '60%', marginLeft: '-32%', borderRadius: '50% 50% 0 0', background: 'rgba(255,255,255,0.92)'}} />
  </div>
);

const Check: React.FC<{size?: number; color?: string}> = ({size = 18, color = OCRE}) => (
  <svg width={size} height={size} viewBox="0 0 20 20" style={{display: 'block'}}>
    <circle cx="10" cy="10" r="9" fill={color} />
    <path d="M5.5 10.5l3 3 6-6.5" stroke={WHITE} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChatWindow: React.FC<{i: number; t: number; tIn: number; tLabel: number; frozen: number}> = ({i, t, tIn, tLabel, frozen}) => {
  const left = i % 2 === 0 ? 150 : 290;
  const top = 330 + i * 158;
  const fromLeft = i % 2 === 0;
  const en = enterStyle(t, tIn, {dx: fromLeft ? -260 : 260, dy: 40, blur: 22, cfg: {damping: 20, stiffness: 95}});
  const typed = Math.max(0, Math.floor((t - (tIn + 0.35)) * 30));
  const text = PROMPTS[i].slice(0, typed);
  const blink = frozen > 0 ? 1 : (Math.floor(t * 2.6) % 2 === 0 ? 1 : 0);
  const lab = sp(t, tLabel, {damping: 16, stiffness: 150});
  const labOp = prog(t, tLabel, 0.2);
  return (
    <div style={{position: 'absolute', left, top, width: 640, height: 150, ...en}}>
      <div style={{
        position: 'absolute', inset: 0, background: WHITE, borderRadius: 18,
        boxShadow: '0 18px 50px rgba(20,4,8,0.35)', padding: '26px 28px 22px 32px', boxSizing: 'border-box',
        fontFamily: FONT, color: DARK,
      }}>
        <div style={{fontSize: 25, lineHeight: 1.3, fontWeight: 400, minHeight: 66, paddingRight: 150}}>
          {text}
          <span style={{display: 'inline-block', width: 3, height: 26, background: OCRE, marginLeft: 3, verticalAlign: '-5px', opacity: blink}} />
        </div>
        <div style={{position: 'absolute', left: 32, bottom: 20, fontSize: 17, color: '#8A7478', fontWeight: 400}}>Nouvelle conversation</div>
        <div style={{position: 'absolute', right: 22, bottom: 18, width: 34, height: 34, borderRadius: 8, background: OCRE, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width="18" height="18" viewBox="0 0 20 20"><path d="M10 16V4M4.5 9.5L10 4l5.5 5.5" stroke={WHITE} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div style={{
          position: 'absolute', right: 24, top: 22, display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 18, fontWeight: 700, color: OCRE, opacity: labOp, transform: `translateY(${(1 - lab) * -12}px) scale(${0.85 + 0.15 * lab})`,
        }}>
          <Check size={20} /> Compte ouvert
        </div>
      </div>
      <Avatar size={46} bg={AVATARS[i]} style={{position: 'absolute', left: -20, top: -16}} />
    </div>
  );
};

const SceneChats: React.FC = () => {
  const t = useT();
  const p1 = P(1), p2 = P(2), p3 = P(3), p4 = P(4);
  const ex = exitStyle(t, p4 + 0.05, {dy: -220, dur: 0.5, anticip: 0.22});
  if (t > p4 + 0.1) return null;
  const g = prog(t, p3 - 0.05, 0.7, Easing.inOut(Easing.quad));
  const frozenStyle: React.CSSProperties = {
    filter: g > 0 ? `grayscale(${g}) brightness(${1 - 0.22 * g})` : undefined,
    opacity: 1 - 0.38 * g,
    transform: `scale(${1 - 0.025 * g})`,
    transformOrigin: '50% 60%',
  };
  const tIns = [-0.3, p1 + 0.5, p1 + 1.15, p1 + 1.8];
  const tLabs = [p2 + 0.05, p2 + 0.4, p2 + 0.75, p2 + 1.1];
  return (
    <AbsoluteFill style={ex || {}}>
      <AbsoluteFill style={frozenStyle}>
        {[0, 1, 2, 3].map((i) => (
          <ChatWindow key={i} i={i} t={t} tIn={tIns[i]} tLabel={tLabs[i]} frozen={g} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- scène B : carton titre + table ----------
const SEATS = [
  {x: -125, y: -190}, {x: 125, y: -190}, {x: -125, y: 190}, {x: 125, y: 190}, {x: 310, y: 0},
];
const SEAT_BG = [AVATARS[0], AVATARS[1], AVATARS[2], AVATARS[3], 'linear-gradient(135deg, #D9A24A, #8C2A3C)'];

const SceneTitle: React.FC = () => {
  const t = useT();
  const p4 = P(4), p5 = P(5);
  if (t < p4 - 0.3 || t > p5 + 0.1) return null;
  const ex = exitStyle(t, p5 + 0.05, {dy: -200, dur: 0.45, anticip: 0.2});
  const title = enterStyle(t, p4 - 0.05, {dy: 110, blur: 20, cfg: {damping: 19, stiffness: 100}});
  const tTable = ws(36) - 0.15;
  const table = enterStyle(t, tTable, {dy: 60, blur: 14, scale: 0.9, cfg: {damping: 18, stiffness: 110}});
  const arrivals = [ws(36) + 0.1, ws(38) - 0.05, ws(39) + 0.05, ws(41), ws(43)];
  const cx = 540, cy = 800;
  return (
    <AbsoluteFill style={ex || {}}>
      <div style={{
        position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: 330, textAlign: 'center',
        fontFamily: FONT, fontWeight: 700, fontSize: 76, lineHeight: 1.08, color: WHITE, ...title,
      }}>
        <div>L'Accélérateur IA</div>
        <div style={{color: OCRE}}>30 jours</div>
      </div>
      <div style={{position: 'absolute', left: cx - 240, top: cy - 125, width: 480, height: 250, ...table}}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 80,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))',
          border: '2px solid rgba(255,255,255,0.28)', boxShadow: 'inset 0 0 60px rgba(255,255,255,0.06), 0 20px 50px rgba(20,4,8,0.35)',
        }} />
        <div style={{position: 'absolute', left: 60, right: 60, top: 118, height: 2, background: 'rgba(255,255,255,0.18)', borderRadius: 2}} />
      </div>
      {SEATS.map((s, i) => {
        const a = arrivals[i];
        const n = Math.hypot(s.x, s.y) || 1;
        const en = enterStyle(t, a, {dx: (s.x / n) * 170, dy: (s.y / n) * 170, blur: 18, scale: 0.7, cfg: {damping: 15, stiffness: 120}});
        return (
          <div key={i} style={{position: 'absolute', left: cx + s.x - 40, top: cy + s.y - 40, width: 80, height: 80, ...en}}>
            <Avatar size={80} bg={SEAT_BG[i]} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- scène C : frise J0 à J30 + compteur ----------
const ROWS = [
  {label: 'J0', sub: 'Journée sur site', from: 0, to: 1.4, kind: 'bar', color: WHITE},
  {label: 'Semaine 1', sub: 'Usage', from: 1.4, to: 8, kind: 'bar', color: OCRE},
  {label: 'Semaine 2', sub: 'Usage', from: 8, to: 15, kind: 'bar', color: OCRE},
  {label: 'Semaine 3', sub: 'Usage', from: 15, to: 22, kind: 'bar', color: OCRE},
  {label: 'Semaine 4', sub: 'Usage', from: 22, to: 29, kind: 'bar', color: OCRE},
  {label: 'J30', sub: 'Point de résultat', from: 30, to: 30, kind: 'dot', color: WHITE},
];
const SceneGantt: React.FC = () => {
  const t = useT();
  const p5 = P(5), p6 = P(6);
  if (t < p5 - 0.3 || t > p6 + 0.1) return null;
  const ex = exitStyle(t, p6 + 0.05, {dy: -200, dur: 0.45, anticip: 0.2});
  const panel = enterStyle(t, p5 - 0.05, {dy: 100, blur: 18, cfg: {damping: 19, stiffness: 100}});
  const X0 = 420, X1 = 960, Y0 = 330, PITCH = 62, DAY = (X1 - X0) / 30;
  // compteur
  const cStart = ws(50) - 0.05, cEnd = we(52);
  const n = Math.round(interpolate(t, [cStart, cEnd], [0, 60], {...clampOpt, easing: Easing.inOut(Easing.cubic)}));
  const swapAt = ws(55) - 0.05;
  const counter = enterStyle(t, ws(49) - 0.05, {dy: 70, blur: 14, cfg: {damping: 18, stiffness: 110}});
  const sw = sp(t, swapAt, {damping: 18, stiffness: 130});
  const swOp = prog(t, swapAt, 0.2);
  return (
    <AbsoluteFill style={ex || {}}>
      <div style={{position: 'absolute', inset: 0, ...panel, fontFamily: FONT}}>
        {/* grille */}
        {[0, 10, 20, 30].map((d) => (
          <div key={d}>
            <div style={{position: 'absolute', left: X0 + d * DAY, top: Y0 - 10, width: 1, height: ROWS.length * PITCH + 14, background: 'rgba(255,255,255,0.14)'}} />
            <div style={{position: 'absolute', left: X0 + d * DAY - 30, width: 60, top: Y0 + ROWS.length * PITCH + 12, textAlign: 'center', fontSize: 20, color: 'rgba(255,255,255,0.65)', fontWeight: 400}}>J{d}</div>
          </div>
        ))}
        {ROWS.map((r, i) => {
          const st = p5 + 0.12 + i * 0.3;
          const f = prog(t, st, 0.55);
          const lab = prog(t, st - 0.08, 0.3);
          const y = Y0 + i * PITCH;
          return (
            <div key={i}>
              <div style={{position: 'absolute', left: SAFE.left, top: y - 2, width: 290, opacity: lab, transform: `translateX(${(1 - lab) * -14}px)`}}>
                <span style={{fontSize: 24, fontWeight: 700, color: r.kind === 'dot' || i === 0 ? OCRE : WHITE}}>{r.label}</span>
                <span style={{fontSize: 20, fontWeight: 400, color: 'rgba(255,255,255,0.72)', marginLeft: 10}}>{r.sub}</span>
              </div>
              {r.kind === 'bar' ? (
                <div style={{
                  position: 'absolute', left: X0 + r.from * DAY, top: y + 2, height: 28, borderRadius: 7,
                  width: Math.max(0, (r.to - r.from) * DAY * f), background: r.color, opacity: 0.95,
                  boxShadow: r.color === OCRE ? '0 6px 18px rgba(201,138,46,0.35)' : '0 6px 18px rgba(255,255,255,0.2)',
                }} />
              ) : (
                <div style={{
                  position: 'absolute', left: X0 + 30 * DAY - 17, top: y - 1, width: 34, height: 34, borderRadius: '50%',
                  border: `4px solid ${OCRE}`, background: WHITE, transform: `scale(${sp(t, st, {damping: 12, stiffness: 160})})`,
                  boxShadow: '0 0 0 8px rgba(201,138,46,0.25)',
                }} />
              )}
            </div>
          );
        })}
        {/* liaison J0 vers J30 */}
        <div style={{position: 'absolute', left: X0, top: Y0 + 5 * PITCH + 15, height: 2, width: 30 * DAY * prog(t, p5 + 0.3, 1.6), background: 'rgba(255,255,255,0.25)'}} />
      </div>
      <div style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: 790, textAlign: 'center', fontFamily: FONT, ...counter}}>
        <div style={{position: 'relative', height: 170}}>
          <div style={{position: 'absolute', inset: 0, opacity: 1 - swOp, transform: `translateY(${-sw * 30}px)`}}>
            <div style={{fontSize: 136, fontWeight: 700, color: WHITE, lineHeight: 1}}>{n}<span style={{fontSize: 56, marginLeft: 14, color: 'rgba(255,255,255,0.8)'}}>min</span></div>
          </div>
          <div style={{position: 'absolute', inset: 0, opacity: swOp, transform: `translateY(${(1 - sw) * 40}px)`}}>
            <div style={{fontSize: 136, fontWeight: 700, color: OCRE, lineHeight: 1}}>1 h<span style={{fontSize: 56, marginLeft: 16, color: WHITE}}>/ semaine</span></div>
          </div>
        </div>
        <div style={{fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,0.78)', marginTop: 6}}>par participant</div>
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
          <div style={{position: 'absolute', inset: -3, borderRadius: '50%', background: OCRE, transform: `scale(${Math.min(1.15, s)})`, opacity: t >= st ? 1 : 0}} />
        </div>
      );
    })}
  </div>
);

const SceneFiche: React.FC = () => {
  const t = useT();
  const p6 = P(6), p7 = P(7);
  if (t < p6 - 0.3 || t > p7 + 0.1) return null;
  const ex = exitStyle(t, p7 + 0.05, {dy: -200, dur: 0.45, anticip: 0.2});
  const card = enterStyle(t, p6 - 0.05, {dy: 120, blur: 18, scale: 0.96, cfg: {damping: 19, stiffness: 100}});
  const r1 = [0, 1, 2, 3, 4].map((k) => ws(56) + 0.25 + k * 0.13);
  const r2 = [0, 1, 2, 3, 4].map((k) => ws(58) - 0.05 + k * 0.13);
  const tStamp = we(59) - 0.05;
  const stS = sp(t, tStamp, {damping: 13, stiffness: 150});
  const stOp = prog(t, tStamp, 0.12);
  return (
    <AbsoluteFill style={ex || {}}>
      <div style={{position: 'absolute', left: 160, top: 390, width: 760, ...card, fontFamily: FONT}}>
        <div style={{background: WHITE, borderRadius: 22, boxShadow: '0 24px 60px rgba(20,4,8,0.4)', padding: '40px 46px 44px', color: DARK}}>
          <div style={{fontSize: 34, fontWeight: 700}}>Fiche de résultat</div>
          <div style={{fontSize: 21, color: '#8A7478', marginTop: 4}}>Relevé à trente jours</div>
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
        position: 'absolute', left: 470, top: 740, padding: '12px 28px', border: `6px solid ${BORDEAUX}`, borderRadius: 12,
        color: BORDEAUX, fontFamily: FONT, fontWeight: 700, fontSize: 46, letterSpacing: 0.5, background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 12px 30px rgba(20,4,8,0.25)', whiteSpace: 'nowrap',
        opacity: stOp, transform: `rotate(-8deg) scale(${1.9 - 0.9 * Math.min(1, stS)})`, transformOrigin: '50% 50%',
      }}>Vérifié à J30</div>
    </AbsoluteFill>
  );
};

// ---------- scène E : appel à l'action ----------
const SceneCta: React.FC = () => {
  const t = useT();
  const p7 = P(7);
  if (t < p7 - 0.3) return null;
  const btn = enterStyle(t, p7 - 0.05, {dy: 140, blur: 20, scale: 0.94, cfg: {damping: 16, stiffness: 100}});
  const url = enterStyle(t, p7 + 0.3, {dy: 60, blur: 12, cfg: {damping: 18, stiffness: 110}});
  const breathe = 1 + 0.012 * Math.sin((t - p7) * 2.2);
  const glow = 0.5 + 0.2 * Math.sin((t - p7) * 2.2);
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 540 - 420, top: 700 - 300, width: 840, height: 600, borderRadius: '50%', background: `radial-gradient(circle, rgba(201,138,46,${glow * 0.45}) 0%, rgba(201,138,46,0) 60%)`}} />
      <div style={{position: 'absolute', left: 220, top: 640, width: 640, height: 124, ...btn}}>
        <div style={{
          position: 'absolute', inset: 0, background: OCRE, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: WHITE, fontSize: 46, fontWeight: 700, boxShadow: '0 22px 50px rgba(201,138,46,0.35)', transform: `scale(${breathe})`,
        }}>Audit gratuit · 30 min</div>
      </div>
      <div style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: 816, textAlign: 'center', fontSize: 44, fontWeight: 700, color: WHITE, ...url}}>antoinecontino.fr</div>
    </AbsoluteFill>
  );
};

// ---------- composition ----------
export const Pub: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: DARK}}>
      <Bg />
      <SceneChats />
      <SceneTitle />
      <SceneGantt />
      <SceneFiche />
      <SceneCta />
      <Captions />
      <Audio src={staticFile('voix.wav')} />
    </AbsoluteFill>
  );
};
