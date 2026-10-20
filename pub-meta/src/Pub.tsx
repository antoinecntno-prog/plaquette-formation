import React, {useMemo} from 'react';
import {
  AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate,
  delayRender, continueRender,
} from 'remotion';
import timing from './timing.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// Zone utile Meta : 270 px en haut, 670 px en bas, 110 px sur les côtés
export const SAFE = {top: 270, bottom: H - 670, left: 110, right: W - 110};

export const C = {
  bordeaux: '#6E1E2B',
  ocre: '#C98A2E',
  sombre: '#2A0C12',
  blanc: '#FFFFFF',
};

type Theme = {bg: string; fg: string; muted: string; hi: string};
const THEMES: Record<string, Theme> = {
  bordeaux: {bg: C.bordeaux, fg: C.blanc, muted: 'rgba(255,255,255,0.62)', hi: C.ocre},
  ocre: {bg: C.ocre, fg: C.bordeaux, muted: 'rgba(110,30,43,0.62)', hi: C.blanc},
  blanc: {bg: C.blanc, fg: C.bordeaux, muted: 'rgba(110,30,43,0.5)', hi: C.ocre},
  sombre: {bg: C.sombre, fg: C.blanc, muted: 'rgba(255,255,255,0.62)', hi: C.ocre},
};

// ---------- horodatages ----------
type Word = {w: string; n: string; s: number; c: number; l: number; start: number; end: number};
const WORDS = timing.words as Word[];
export const LEAD = 0.35; // silence ajouté avant la voix, en secondes
const AUDIO_END = timing.audio_end + LEAD;

const norm = (w: string) =>
  w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9']/g, '');

// Image où commence un mot donné d'une phrase donnée (première occurrence)
const fWord = (s: number, word: string, which = 0): number => {
  const n = norm(word);
  const hits = WORDS.filter((x) => x.s === s && norm(x.w) === n);
  const hit = hits[which] ?? hits[0];
  if (!hit) throw new Error(`mot introuvable : ${s} ${word}`);
  return Math.round((hit.start + LEAD) * FPS);
};
const fWordEnd = (s: number, word: string): number => {
  const n = norm(word);
  const hit = WORDS.find((x) => x.s === s && norm(x.w) === n);
  if (!hit) throw new Error(`mot introuvable : ${s} ${word}`);
  return Math.round((hit.end + LEAD) * FPS);
};
const fSentence = (s: number): number => {
  const hit = WORDS.find((x) => x.s === s);
  return Math.round((hit!.start + LEAD) * FPS);
};
const fChunk = (s: number, c: number): number => {
  const hit = WORDS.find((x) => x.s === s && x.c === c);
  return Math.round((hit!.start + LEAD) * FPS);
};

// ---------- briques d'animation ----------
const BOUNCE = {damping: 11, stiffness: 190, mass: 0.7};
const SOFT = {damping: 16, stiffness: 140, mass: 0.8};

export const Pop: React.FC<{
  at: number; until?: number; children: React.ReactNode; style?: React.CSSProperties; soft?: boolean;
}> = ({at, until, children, style, soft}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < at) return null;
  if (until !== undefined && frame >= until + 6) return null;
  const s = spring({frame: frame - at, fps, config: soft ? SOFT : BOUNCE});
  let scale = s;
  let opacity = interpolate(frame - at, [0, 4], [0, 1], {extrapolateRight: 'clamp'});
  if (until !== undefined && frame >= until) {
    const p = (frame - until) / 6;
    scale = 1 - 0.4 * p;
    opacity = 1 - p;
  }
  return (
    <div style={{transform: `scale(${scale})`, opacity, transformOrigin: 'center', ...style}}>{children}</div>
  );
};

const Rise: React.FC<{at: number; until?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, until, children, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < at) return null;
  if (until !== undefined && frame >= until + 6) return null;
  const s = spring({frame: frame - at, fps, config: SOFT});
  let opacity = interpolate(frame - at, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
  if (until !== undefined && frame >= until) opacity = 1 - (frame - until) / 6;
  return <div style={{transform: `translateY(${(1 - s) * 40}px)`, opacity, ...style}}>{children}</div>;
};

const fit = (text: string, max = 200) => Math.min(max, Math.floor(800 / (text.length * 0.68)));

const Keyword: React.FC<{text: string; color: string; size?: number; style?: React.CSSProperties}> = ({text, color, size, style}) => (
  <div style={{
    fontFamily: 'DM Sans', fontWeight: 700, fontSize: size ?? fit(text), lineHeight: 0.95, color,
    textAlign: 'center', letterSpacing: '-0.02em', whiteSpace: 'pre', ...style,
  }}>{text}</div>
);

const Line: React.FC<{text: string; color: string; size?: number; bold?: boolean; style?: React.CSSProperties}> = ({text, color, size = 44, bold, style}) => (
  <div style={{
    fontFamily: 'DM Sans', fontWeight: bold ? 700 : 400, fontSize: size, lineHeight: 1.15, color,
    textAlign: 'center', whiteSpace: 'nowrap', ...style,
  }}>{text}</div>
);

// Bloc centré : ligne d'appel + mot clé + ligne dessous
const Center: React.FC<{y?: number; children: React.ReactNode}> = ({y = 740, children}) => (
  <div style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: y, transform: 'translateY(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>{children}</div>
);

// ---------- sous-titres ----------
type Chunk = {s: number; c: number; start: number; end: number; lines: Word[][]};
const CHUNKS: Chunk[] = (() => {
  const map = new Map<string, Chunk>();
  for (const w of WORDS) {
    const k = `${w.s}-${w.c}`;
    if (!map.has(k)) map.set(k, {s: w.s, c: w.c, start: w.start, end: w.end, lines: []});
    const ch = map.get(k)!;
    ch.start = Math.min(ch.start, w.start);
    ch.end = Math.max(ch.end, w.end);
    while (ch.lines.length <= w.l) ch.lines.push([]);
    ch.lines[w.l].push(w);
  }
  return [...map.values()].sort((a, b) => a.start - b.start);
})();

const Subtitles: React.FC<{theme: Theme; y?: number}> = ({theme, y = 1120}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS - LEAD;
  let idx = CHUNKS.findIndex((ch, i) => {
    const next = CHUNKS[i + 1];
    const from = i === 0 ? -99 : ch.start - 0.12;
    const to = next ? next.start - 0.12 : 9999;
    return t >= from && t < to;
  });
  if (idx < 0) idx = CHUNKS.length - 1;
  const ch = CHUNKS[idx];
  const enterF = idx === 0 ? 0 : Math.round((ch.start - 0.12 + LEAD) * FPS);
  const p = idx === 0 ? 1 : interpolate(frame - enterF, [0, 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // mot courant : commencé et le suivant pas encore commencé
  const all = WORDS;
  const curIdx = (() => {
    let k = -1;
    for (let i = 0; i < all.length; i++) if (all[i].start <= t) k = i; else break;
    return k;
  })();
  return (
    <div style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: y, transform: `translateY(calc(-50% + ${(1 - p) * 14}px))`,
      opacity: p, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
      {ch.lines.map((line, li) => (
        <div key={li} style={{display: 'flex', gap: '0.28em', whiteSpace: 'nowrap', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 44, lineHeight: 1.2, textShadow: theme.bg === C.blanc ? 'none' : '0 2px 14px rgba(42,12,18,0.45)'}}>
          {line.map((w, wi) => {
            const gi = all.indexOf(w);
            const state = gi === curIdx ? 'cur' : gi < curIdx ? 'done' : 'todo';
            const color = state === 'cur' ? theme.hi : state === 'done' ? theme.fg : theme.muted;
            const sc = state === 'cur' ? 1.06 : 1;
            return <span key={wi} style={{color, transform: `scale(${sc})`, display: 'inline-block'}}>{w.w}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

// ---------- scènes ----------
const Scene: React.FC<{from: number; to: number; theme: Theme; children: React.ReactNode}> = ({from, to, theme, children}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to + 6) return null;
  // bascule : volet qui descend sur 5 images
  const p = interpolate(frame - from, [0, 5], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const clip = from === 0 ? undefined : `inset(0 0 ${100 - p}% 0)`;
  return (
    <AbsoluteFill style={{backgroundColor: theme.bg, clipPath: clip}}>
      {children}
    </AbsoluteFill>
  );
};

// Scène 1 : pile de mails et de documents
const MailPile: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items = useMemo(() => {
    const cols = 7, rows = 15;
    const out: {x: number; y: number; at: number; kind: number; rot: number}[] = [];
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const n = cols * rows;
    const span = (to - from) * 0.92;
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      out.push({
        x: 30 + c * 150 + (rnd() - 0.5) * 50,
        y: H - 90 - r * 128 + (rnd() - 0.5) * 30,
        at: from + Math.floor((i / n) * span),
        kind: rnd() > 0.45 ? 0 : 1,
        rot: (rnd() - 0.5) * 24,
      });
    }
    return out;
  }, [from, to]);
  return (
    <AbsoluteFill>
      {items.map((it, i) => {
        if (frame < it.at) return null;
        const s = spring({frame: frame - it.at, fps, config: {damping: 12, stiffness: 160, mass: 0.6}});
        return (
          <div key={i} style={{position: 'absolute', left: it.x, top: it.y + (1 - s) * 260, opacity: 0.32 * Math.min(1, s * 1.5),
            transform: `rotate(${it.rot}deg) scale(${0.7 + 0.3 * s})`}}>
            {it.kind === 0 ? (
              <svg width={100} height={70} viewBox="0 0 100 70"><rect x={2} y={2} width={96} height={66} rx={8} fill="none" stroke="#fff" strokeWidth={6} />
                <path d="M4 8 L50 42 L96 8" fill="none" stroke="#fff" strokeWidth={6} strokeLinejoin="round" /></svg>
            ) : (
              <svg width={74} height={92} viewBox="0 0 74 92"><path d="M4 4 H48 L70 26 V88 H4 Z" fill="none" stroke="#fff" strokeWidth={6} strokeLinejoin="round" />
                <path d="M48 4 V26 H70" fill="none" stroke="#fff" strokeWidth={6} strokeLinejoin="round" />
                <path d="M18 44 H56 M18 58 H56 M18 72 H44" stroke="#fff" strokeWidth={6} strokeLinecap="round" /></svg>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Scène 2 : horloge qui accélère
const Clock: React.FC<{from: number; color: string; y: number}> = ({from, color, y}) => {
  const frame = useCurrentFrame();
  const t = Math.max(0, (frame - from) / FPS);
  const minute = 30 * t + 38 * t * t; // accélération
  const hour = minute / 12;
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - from, fps, config: BOUNCE});
  return (
    <div style={{position: 'absolute', left: W / 2 - 150, top: y - 150, transform: `scale(${s})`}}>
      <svg width={300} height={300} viewBox="0 0 300 300">
        <circle cx={150} cy={150} r={138} fill="none" stroke={color} strokeWidth={12} />
        {Array.from({length: 12}).map((_, i) => (
          <line key={i} x1={150} y1={24} x2={150} y2={i % 3 === 0 ? 48 : 38} stroke={color} strokeWidth={i % 3 === 0 ? 10 : 6}
            transform={`rotate(${i * 30} 150 150)`} strokeLinecap="round" />
        ))}
        <line x1={150} y1={150} x2={150} y2={78} stroke={color} strokeWidth={14} strokeLinecap="round" transform={`rotate(${hour} 150 150)`} />
        <line x1={150} y1={150} x2={150} y2={46} stroke={color} strokeWidth={9} strokeLinecap="round" transform={`rotate(${minute} 150 150)`} />
        <circle cx={150} cy={150} r={12} fill={color} />
      </svg>
    </div>
  );
};

// Scène 3 : courbe qui chute
const FallingCurve: React.FC<{at: number; color: string; y: number}> = ({at, color, y}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = interpolate(frame - at, [0, 28], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: W / 2 - 360, top: y - 150}}>
      <svg width={720} height={300} viewBox="0 0 720 300">
        <path d="M0 290 H720" stroke={color} strokeWidth={4} opacity={0.35} />
        <path d="M10 60 C 120 40, 200 70, 280 80 S 420 150, 500 220 S 640 280, 710 288" fill="none" stroke={color} strokeWidth={16}
          strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      </svg>
    </div>
  );
};

// Scène 5 : bulle de citation, mots synchronisés
const Bubble: React.FC<{at: number; y: number}> = ({at, y}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS - LEAD;
  const words = WORDS.filter((w) => w.s === 5 && w.c === 0);
  const lines = [words.filter((w) => w.l === 0), words.filter((w) => w.l === 1)];
  return (
    <Pop at={at} style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: y - 160}}>
      <div style={{position: 'relative', background: C.blanc, borderRadius: 28, padding: '48px 40px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center'}}>
        {lines.map((line, li) => (
          <div key={li} style={{display: 'flex', gap: '0.3em', whiteSpace: 'nowrap', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 72, lineHeight: 1.1, color: C.bordeaux}}>
            {line.map((w, i) => <span key={i} style={{opacity: t >= w.start - 0.05 ? 1 : 0.18}}>{w.w}</span>)}
          </div>
        ))}
        <svg width={70} height={48} viewBox="0 0 70 48" style={{position: 'absolute', left: 90, bottom: -44}}>
          <path d="M0 0 H70 L18 48 Z" fill={C.blanc} />
        </svg>
      </div>
    </Pop>
  );
};

// Scène 6 : dossier ouvert et cinq points
const Folder: React.FC<{at: number; dotsAt: number; y: number}> = ({at, dotsAt, y}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const angles = [-90, -18, 54, 126, 198];
  return (
    <div style={{position: 'absolute', left: W / 2, top: y}}>
      <Pop at={at} style={{position: 'absolute', left: -170, top: -130}}>
        <svg width={340} height={260} viewBox="0 0 340 260">
          <path d="M20 40 H120 L150 70 H320 V240 H20 Z" fill="none" stroke={C.bordeaux} strokeWidth={14} strokeLinejoin="round" />
          <path d="M20 240 L60 120 H338 L300 240 Z" fill={C.bordeaux} stroke={C.bordeaux} strokeWidth={14} strokeLinejoin="round" />
          <path d="M120 150 H250 M110 185 H230" stroke={C.ocre} strokeWidth={12} strokeLinecap="round" />
        </svg>
      </Pop>
      {angles.map((a, i) => {
        const f0 = dotsAt + i * 3;
        if (frame < f0) return null;
        const s = spring({frame: frame - f0, fps, config: BOUNCE});
        const r = 240;
        const x = Math.cos((a * Math.PI) / 180) * r, yy = Math.sin((a * Math.PI) / 180) * r * 0.8;
        return (
          <div key={i} style={{position: 'absolute', left: x - 28, top: yy - 28, width: 56, height: 56, borderRadius: 28, background: C.bordeaux,
            transform: `scale(${s})`, boxShadow: `0 0 0 10px ${C.blanc}`}} />
        );
      })}
    </div>
  );
};

// Scène 7 : compteur
const Counter: React.FC<{at: number; color: string}> = ({at, color}) => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame - at, [0, 16], [0, 10], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return <Keyword text={`${n} H`} color={color} size={290} />;
};

// Scène 8 : calendrier de 30 jours et tampon
const Calendar: React.FC<{from: number; done: number; y: number}> = ({from, done, y}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cols = 6, rows = 5, cell = 66, gap = 10;
  const width = cols * cell + (cols - 1) * gap;
  const height = rows * cell + (rows - 1) * gap;
  const enter = spring({frame: frame - from, fps, config: SOFT});
  const stampAt = done;
  const st = spring({frame: frame - stampAt, fps, config: {damping: 11, stiffness: 260, mass: 0.6}});
  return (
    <div style={{position: 'absolute', left: W / 2 - width / 2, top: y - height / 2, width, height, opacity: Math.min(1, enter * 2), transform: `scale(${0.9 + 0.1 * enter})`}}>
      {Array.from({length: 30}).map((_, k) => {
        const r = Math.floor(k / cols), c = k % cols;
        const tick = from + 4 + Math.floor((k / 29) * (done - from - 8));
        const checked = frame >= tick;
        const s = checked ? spring({frame: frame - tick, fps, config: {damping: 10, stiffness: 300, mass: 0.5}}) : 0;
        return (
          <div key={k} style={{position: 'absolute', left: c * (cell + gap), top: r * (cell + gap), width: cell, height: cell, borderRadius: 10,
            border: `4px solid ${C.blanc}`, background: checked ? C.ocre : 'transparent', boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {checked ? (
              <svg width={36} height={36} viewBox="0 0 36 36" style={{transform: `scale(${s})`}}>
                <path d="M6 19 L15 27 L30 9" fill="none" stroke={C.blanc} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : k === 29 ? (
              <span style={{fontFamily: 'DM Sans', fontWeight: 700, fontSize: 24, color: C.blanc}}>J30</span>
            ) : null}
          </div>
        );
      })}
      {frame >= stampAt ? (
        <div style={{position: 'absolute', left: width / 2, top: height / 2, transform: `translate(-50%, -50%) rotate(-12deg) scale(${0.6 + 0.4 * st})`, opacity: Math.min(1, st * 2),
          border: `10px solid ${C.ocre}`, borderRadius: 14, padding: '6px 28px', background: 'rgba(110,30,43,0.85)'}}>
          <span style={{fontFamily: 'DM Sans', fontWeight: 700, fontSize: 96, color: C.ocre, lineHeight: 1, letterSpacing: '0.02em'}}>Vérifié</span>
        </div>
      ) : null}
    </div>
  );
};

// Scène 9 : flèche qui pointe vers le bas de la zone utile
const Arrow: React.FC<{at: number; y: number}> = ({at, y}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < at) return null;
  const s = spring({frame: frame - at, fps, config: BOUNCE});
  const bob = Math.sin(((frame - at) / fps) * Math.PI * 2 * 1.2) * 14;
  return (
    <div style={{position: 'absolute', left: W / 2 - 60, top: y + bob, transform: `scale(${s})`}}>
      <svg width={120} height={150} viewBox="0 0 120 150">
        <path d="M60 6 V128 M16 86 L60 134 L104 86" fill="none" stroke={C.bordeaux} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ---------- composition ----------
const fontPromise = (() => {
  if (typeof document === 'undefined') return null;
  const bold = new FontFace('DM Sans', `url(${staticFile('fonts/DMSans-Bold.ttf')})`, {weight: '700'});
  const reg = new FontFace('DM Sans', `url(${staticFile('fonts/DMSans-Regular.ttf')})`, {weight: '400'});
  return Promise.all([bold.load(), reg.load()]).then((fs) => { fs.forEach((f) => document.fonts.add(f)); });
})();

export const Pub: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const [handle] = React.useState(() => delayRender('polices'));
  React.useEffect(() => { (fontPromise ?? Promise.resolve()).then(() => continueRender(handle)); }, [handle]);

  // bornes de scènes
  const s1 = 0;
  const s2 = fSentence(2) - 3;
  const s3 = fChunk(3, 1) - 3;
  const s4 = fSentence(4) - 3;
  const s5 = fSentence(5) - 3;
  const s6 = fSentence(6) - 3;
  const s7 = fSentence(7) - 3;
  const s8 = fSentence(8) - 3;
  const s9 = fSentence(9) - 3;
  const end = durationInFrames;
  const T = THEMES;

  return (
    <AbsoluteFill style={{backgroundColor: C.bordeaux}}>
      <Audio src={staticFile('voix.mp3')} startFrom={0} delayRenderTimeoutInMilliseconds={60000} />
      {/* décalage de la voix : silence de LEAD secondes */}
      <Scene from={s1} to={s2} theme={T.bordeaux}>
        <MailPile from={0} to={fWordEnd(1, 'rendus')} />
        <Center>
          <Rise at={fWord(1, 'journées')}><Line text="vos journées sur des" color={C.blanc} /></Rise>
          <Pop at={fWord(1, 'mails')}><Keyword text="MAILS" color={C.blanc} /></Pop>
        </Center>
        <Subtitles theme={T.bordeaux} />
      </Scene>

      <Scene from={s2} to={s3} theme={T.ocre}>
        <Clock from={s2 + 2} color={C.bordeaux} y={470} />
        <Center y={800}>
          <Rise at={fWord(2, 'savez')} until={fWord(3, 'temps') - 4}><Line text="vous savez que" color={C.bordeaux} /></Rise>
          <Pop at={fWord(2, "l'IA")} until={fWord(3, 'temps') - 4}><Keyword text="L'IA" color={C.bordeaux} size={230} /></Pop>
        </Center>
        <Center y={800}>
          <Rise at={fWord(3, 'temps') - 2}><Line text="pour s'y mettre" color={C.bordeaux} /></Rise>
          <Pop at={fWord(3, 'temps')}><Keyword text={"PAS LE\nTEMPS"} color={C.bordeaux} size={170} /></Pop>
        </Center>
        <Subtitles theme={T.ocre} />
      </Scene>

      <Scene from={s3} to={s4} theme={T.sombre}>
        <FallingCurve at={s3 + 4} color={C.ocre} y={470} />
        <Center y={800}>
          <Rise at={fWord(3, 'mois')}><Line text="chaque mois" color={C.blanc} /></Rise>
          <Pop at={fWord(3, 'retard')}><Keyword text="LE RETARD" color={C.blanc} size={130} /></Pop>
          <Rise at={fWord(3, 'creuse')}><Line text="se creuse" color={C.ocre} bold /></Rise>
        </Center>
        <Subtitles theme={T.sombre} />
      </Scene>

      <Scene from={s4} to={s5} theme={T.blanc}>
        <Center y={700}>
          <Rise at={s4 + 2}><Line text="L'Accélérateur IA 30 jours" color={C.bordeaux} bold size={56} /></Rise>
          <Pop at={fWord(4, 'heure')}><Keyword text="1 H" color={C.bordeaux} size={320} /></Pop>
          <Rise at={fWord(4, 'semaine')}><Line text="par semaine" color={C.ocre} bold size={60} /></Rise>
        </Center>
        <Subtitles theme={T.blanc} />
      </Scene>

      <Scene from={s5} to={s6} theme={T.sombre}>
        <Bubble at={fWord(5, 'Former')} y={640} />
        <Subtitles theme={T.sombre} />
      </Scene>

      <Scene from={s6} to={s7} theme={T.ocre}>
        <Center y={700}>
          <Rise at={fWord(6, 'faut')} until={fWord(6, 'chez') - 3}><Line text="en une" color={C.bordeaux} /></Rise>
          <Pop at={fWord(6, 'journée')} until={fWord(6, 'chez') - 3}><Keyword text="JOURNÉE" color={C.bordeaux} size={168} /></Pop>
        </Center>
        <Center y={700}>
          <Rise at={fWord(6, 'viens')} until={fWord(6, 'dossiers') - 3}><Line text="je viens" color={C.bordeaux} /></Rise>
          <Pop at={fWord(6, 'chez')} until={fWord(6, 'dossiers') - 3}><Keyword text="CHEZ VOUS" color={C.bordeaux} size={130} /></Pop>
        </Center>
        <Folder at={fWord(6, 'dossiers')} dotsAt={fWord(6, 'cinq')} y={620} />
        <Center y={900}>
          <Rise at={fWord(6, 'cinq')}><Line text="à cinq au plus" color={C.bordeaux} bold size={56} /></Rise>
        </Center>
        <Subtitles theme={T.ocre} />
      </Scene>

      <Scene from={s7} to={s8} theme={T.blanc}>
        <Center y={700}>
          <Rise at={fWord(7, 'coach')}><Line text="une coach, depuis septembre" color={C.bordeaux} /></Rise>
          <Pop at={fWord(7, 'dix')}><Counter at={fWord(7, 'dix')} color={C.bordeaux} /></Pop>
          <Rise at={fWord(7, 'semaine')}><Line text="par semaine" color={C.ocre} bold size={60} /></Rise>
        </Center>
        <Subtitles theme={T.blanc} />
      </Scene>

      <Scene from={s8} to={s9} theme={T.bordeaux}>
        <Center y={462}>
          <Rise at={fWord(8, 'Résultat')} until={fWord(8, 'manque') - 3}><Line text="résultat vérifié à" color={C.blanc} /></Rise>
          <Pop at={fWord(8, 'trente')} until={fWord(8, 'manque') - 3}><Keyword text={"30\nJOURS"} color={C.blanc} size={130} /></Pop>
        </Center>
        <Center y={462}>
          <Rise at={fWord(8, 'manque') - 1}><Line text="s'il manque, je reviens" color={C.blanc} /></Rise>
          <Pop at={fWord(8, 'frais')}><Keyword text={"SANS\nFRAIS"} color={C.blanc} size={130} /></Pop>
        </Center>
        <Calendar from={s8 + 3} done={fWordEnd(8, 'jours')} y={820} />
        <Subtitles theme={T.bordeaux} />
      </Scene>

      <Scene from={s9} to={end} theme={T.ocre}>
        <Subtitles theme={T.ocre} y={420} />
        <Pop at={fWord(9, 'audit')} soft style={{position: 'absolute', left: 150, width: 780, top: 640}}>
          <div style={{background: C.bordeaux, borderRadius: 18, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{fontFamily: 'DM Sans', fontWeight: 700, fontSize: 68, color: C.blanc, whiteSpace: 'nowrap'}}>Audit gratuit · 30 min</span>
          </div>
        </Pop>
        <Rise at={fWord(9, 'gratuit')} style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: 860}}>
          <Line text="antoinecontino.fr" color={C.bordeaux} bold size={62} />
        </Rise>
        <Arrow at={fWord(9, 'minutes')} y={1040} />
      </Scene>
    </AbsoluteFill>
  );
};
