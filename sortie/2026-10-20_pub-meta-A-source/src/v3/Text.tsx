import React from 'react';
import {measureText} from '@remotion/layout-utils';
import {Easing, spring} from 'remotion';
import {E_OUT, f2, FONT, INK, OCRE, prog, SAFE, word, ws, we, WHITE, Mark} from './lib';
export const E_WORD = Easing.bezier(0.16, 1, 0.3, 1);

const widthOf = (text: string, size: number, weight: number) =>
  measureText({text, fontFamily: 'DM Sans', fontSize: size, fontWeight: String(weight), validateFontIsLoaded: false}).width;

// Titre à la manière de la référence : chaque mot arrive au moment où il est dit, directement à sa place finale
// (la ligne est calculée une fois, rien ne glisse ensuite), avec flou de mouvement et fondu.
export type FlyWord = {i: number; color?: string; from?: [number, number]; mark?: boolean; glow?: boolean};
export const OCRE_TXT = '#A86A1C';   // ocre foncé pour les mots-clés sur fond clair (contraste)
export const FlyTitle: React.FC<{t: number; lines: FlyWord[][]; size: number; y: number; weight?: number; lineH?: number; dark?: boolean; ready: boolean; lead?: number; scale?: number; dur?: number;
  ease?: (x: number) => number; halo?: boolean; gather?: boolean}> =
({t, lines, size, y, weight = 400, lineH = 1.18, dark = true, ready, lead = 0.04, scale = 1, dur = 0.3, ease = E_WORD, halo = false, gather = false}) => {
  if (!ready) return null;
  const gap = size * 0.27;
  const base = dark ? INK : WHITE;
  const markSize = size * 1.35;
  const out: React.ReactNode[] = [];
  lines.forEach((line, li) => {
    const ly = y + (li - (lines.length - 1) / 2) * size * lineH;
    const widths = line.map((w) => (w.mark ? markSize * 0.8 : widthOf(word(w.i), size, weight)));
    const total = widths.reduce((acc, wd, k) => acc + wd + (k ? gap : 0), 0);
    let x = 540 - total / 2;
    // regroupement : la ligne partielle reste centrée, les mots glissent vers leur nouvelle place à chaque mot ajouté
    const t0s = line.map((w) => ws(w.i) - lead + (w.mark ? 0.12 : 0));
    const layoutFor = (n: number) => {
      const tot = widths.slice(0, n).reduce((acc, wd, k) => acc + wd + (k ? gap : 0), 0);
      const pos: number[] = []; let xx = 540 - tot / 2;
      for (let k = 0; k < n; k++) { pos.push(xx); xx += widths[k] + gap; }
      return pos;
    };
    const gx = (k: number) => {
      let v = layoutFor(k + 1)[k];
      for (let j = k + 1; j < line.length; j++) {
        if (t < t0s[j]) break;
        const sp2 = spring({frame: Math.max(0, (t - t0s[j]) * 30), fps: 30, config: {damping: 18, stiffness: 170, mass: 1}});
        v += (layoutFor(j + 1)[k] - layoutFor(j)[k]) * sp2;
      }
      return v;
    };
    // chaque mot reste accroché au précédent : seul le début de ligne glisse vers le centre, aucun chevauchement
    const x0g = gather ? gx(0) : 0;
    let xg = x0g;
    line.forEach((w, k) => {
      const wx = gather ? xg : x;
      xg += widths[k] + gap;
      x += widths[k] + gap;
      const t0 = t0s[k];
      if (t < t0) return;
      const a = prog(t, t0, dur, ease);
      const [fx, fy] = w.from || [0, size * 0.55];
      const v = 1 - a;
      const bl = 8 * (1 - a);
      const style: React.CSSProperties = {
        position: 'absolute', left: wx, top: ly - size * 0.65, height: size * 1.3, display: 'flex', alignItems: 'center',
        transform: `translate(${f2(fx * v)}px, ${f2(fy * v)}px)`,
        opacity: prog(t, t0, 0.07), filter: bl > 0.05 ? `blur(${f2(bl)}px)` : undefined, whiteSpace: 'nowrap',
        fontFamily: FONT, fontSize: size, fontWeight: weight, color: w.color || base, letterSpacing: -0.4,
        textShadow: halo ? '0 0 22px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.7)' : undefined,
      };
      const gp = prog(t, t0, 0.45, E_WORD);
      const gs = gp < 0.7 ? 0.4 + 0.68 * (gp / 0.7) : 1.08 - 0.08 * ((gp - 0.7) / 0.3);
      out.push(
        <div key={`${li}-${k}`} style={style}>
          {w.glow && (
            <div style={{position: 'absolute', left: '50%', top: '50%', width: size * 4.2, height: size * 4.2, marginLeft: -size * 2.1, marginTop: -size * 2.1, zIndex: -1,
              opacity: 0.8 * prog(t, t0, 0.2), filter: 'blur(5px)', transform: `scale(${gs.toFixed(4)}) rotate(${f2(30 * (1 - gp))}deg)`}}>
              <Mark size={size * 4.2} t={t} color="rgba(214,120,60,0.75)" />
            </div>
          )}
          {w.mark ? <div style={{transform: `rotate(${f2(v * -160)}deg) scale(${(0.6 + 0.4 * a).toFixed(4)})`}}><Mark size={markSize} t={t} /></div> : word(w.i)}
        </div>,
      );
    });
  });
  return <div style={{position: 'absolute', inset: 0, transform: `scale(${scale.toFixed(4)})`, transformOrigin: `540px ${y}px`}}>{out}</div>;
};

// Sortie « étirée » de la référence (2,4 s) : glissement latéral, étirement horizontal et flou
export const smear = (t: number, start: number, dur = 0.3): React.CSSProperties | null => {
  if (t < start) return null;
  const p = prog(t, start, dur, (x: number) => x * x);
  return {opacity: 1 - p, transform: `translateX(${f2(-70 * p)}px) scaleX(${(1 + 0.35 * p).toFixed(4)})`, filter: `blur(${f2(14 * p)}px)`};
};

// Sous-titre des scènes d'interface : une ou deux lignes, mot par mot, mise en page figée dès le premier mot
export type Chunk = {from: number; to: number; kw: number[]; kwColor?: string};
export const Caption: React.FC<{t: number; chunks: Chunk[]; y: number; dark: boolean; size?: number; until?: number; start?: number}> = ({t, chunks, y, dark, size = 50, until = 1e9, start = 0}) => {
  let idx = -1;
  for (let k = 0; k < chunks.length; k++) if (t >= ws(chunks[k].from) - 0.06) idx = k;
  if (idx < 0 || t > until || t < start) return null;
  const c = chunks[idx];
  const next = chunks[idx + 1];
  const endAt = next ? ws(next.from) - 0.06 : until;
  const fadeOut = prog(t, Math.min(we(c.to) + 0.25, endAt - 0.16), 0.16);
  const els: React.ReactNode[] = [];
  for (let i = c.from; i <= c.to; i++) {
    const p = prog(t, ws(i) - 0.06, 0.32, E_OUT);
    const kw = c.kw.includes(i);
    els.push(
      <span key={i} style={{display: 'inline-block', marginRight: '0.26em', opacity: p, transform: `translateY(${f2((1 - p) * 22)}px)`,
        filter: p < 0.98 ? `blur(${f2((1 - p) * 6)}px)` : undefined, color: kw ? (c.kwColor || OCRE_TXT) : dark ? INK : WHITE}}>{word(i)}</span>,
    );
  }
  return (
    <div style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: y, textAlign: 'center', fontFamily: FONT, fontSize: size,
      fontWeight: 700, lineHeight: 1.16, letterSpacing: -0.3, opacity: 1 - fadeOut,
      textShadow: dark ? '0 0 22px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.8)' : '0 2px 18px rgba(40,12,8,0.45)'}}>{els}</div>
  );
};
