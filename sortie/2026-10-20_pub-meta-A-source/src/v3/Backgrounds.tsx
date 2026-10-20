import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {f2, OCRE} from './lib';

// Verre cannelé de la référence (0 à 2,5 s : arcs ; 2,5 à 4,8 s : cannelures droites ; 4,8 à 9 s : cannelures fines et pâles).
// Profil mesuré sur la référence : filet blanc net, la teinte fonce lentement sur ~80 % de la bande puis remonte vite au filet suivant.
// curv : 1 = arcs (centre loin à gauche), 0 = cannelures droites. phase : position du motif sur x = 540, continue d'un état à l'autre.
export type FluteMask = 'main' | 'chat' | 'soft' | 'flutes';
const MASKS: Record<FluteMask, string> = {
  main: `linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.85) 22%, #000 40%, #000 100%),
         linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.75) 18%, #000 32%, #000 68%, rgba(0,0,0,0.75) 82%, rgba(0,0,0,0.2) 100%)`,
  chat: `radial-gradient(ellipse 520px 520px at 560px 800px, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.12) 55%, rgba(0,0,0,0.7) 85%, #000 100%),
         linear-gradient(180deg, #000 0%, #000 45%, rgba(0,0,0,0.2) 72%, rgba(0,0,0,0.05) 100%)`,
  flutes: `linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.9) 25%, #000 45%, #000 100%),
         linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 20%, rgba(0,0,0,0.92) 40%, #000 58%, rgba(0,0,0,0.45) 78%, rgba(0,0,0,0.1) 100%)`,
  soft: `linear-gradient(90deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 30%, #000 55%, #000 100%),
         linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 25%, #000 45%, #000 60%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.1) 100%)`,
};
export type Glow = {cx: number; cy: number; rx: number; ry: number};
export const FlutedBg: React.FC<{t: number; curv?: number; period?: number; phase?: number; intensity?: number; mask?: FluteMask; cy?: number; tint?: [number, number, number];
  glow?: Glow; rScale?: number; refract?: number; colRy?: number}> =
({t, curv = 1, period = 210, phase, intensity = 1, mask = 'main', cy = 960, tint = [228, 160, 128], glow, rScale = 1, refract = 0, colRy = 780}) => {
  const P = Math.max(8, period);
  const ph = phase === undefined ? t * 12 : phase;
  const o = intensity;
  const [r, g, b] = tint;
  const c = (a: number) => `rgba(${r},${g},${b},${Math.min(1, a * o).toFixed(3)})`;
  const w = (a: number) => `rgba(255,255,255,${a.toFixed(3)})`;
  const k = (f: number) => f * P;
  const rim = Math.min(1, o + 0.1);
  // profil d'une bande (0 = filet blanc)
  const stops = (d: number) => [
    `${w(rim)} ${f2(d)}px`, `${w(0.85 * rim)} ${f2(d + 2)}px`, `${c(0.42)} ${f2(d + Math.max(6, k(0.04)))}px`,
    `${c(0.5)} ${f2(d + k(0.4))}px`, `${c(0.74)} ${f2(d + k(0.82))}px`, `${c(0.6)} ${f2(d + k(0.92))}px`,
    `${c(0.2)} ${f2(d + k(0.98))}px`, `${w(rim)} ${f2(d + P)}px`,
  ].join(', ');
  let band: string;
  if (curv < 0.01) {
    const d = ((((540 - ph) % P) + P) % P) - P;           // filet à x = 540 - ph (mod P)
    band = `repeating-linear-gradient(90deg, ${stops(d)})`;
  } else {
    const R = (2900 / curv) * rScale;                      // rayon des arcs : grand, cintrage léger
    const cx = 540 - R;
    const d0 = R;                                          // distance du centre au point (540, cy)
    const d = ((((d0 - ph) % P) + P) % P);
    band = `repeating-radial-gradient(circle at ${f2(cx)}px ${f2(cy)}px, ${stops(d)})`;
  }
  // halo : la couleur se concentre autour d'un foyer, le reste du cadre reste blanc (mesuré sur la référence)
  const m = glow
    ? `radial-gradient(ellipse ${f2(glow.rx)}px ${f2(glow.ry)}px at ${f2(glow.cx)}px ${f2(glow.cy)}px, #000 0%, rgba(0,0,0,0.85) 38%, rgba(0,0,0,0.4) 68%, rgba(0,0,0,0.1) 88%, rgba(0,0,0,0) 100%)`
    : MASKS[mask];
  const baseBg = glow ? 'radial-gradient(ellipse 800px 1200px at 330px 880px, #FFFFFF 0%, #FFFFFF 35%, #F8F7F7 100%)'
    : 'linear-gradient(180deg, #F4F3F3 0%, #FBFAFA 30%, #FDFCFC 50%, #FBFAFA 70%, #F4F3F3 100%)';
  // cannelures réfractées : chaque cannelure montre le halo à sa propre hauteur, bords nets
  const cols: React.ReactNode[] = [];
  if (refract > 0) {
    const x0 = ((((540 - ph) % P) + P) % P) - P;
    const base = Math.floor((540 - ph) / P);
    const gx = glow ? glow.cx : 600;
    for (let q = 0; q <= Math.ceil(1080 / P) + 1; q++) {
      const left = x0 + q * P;
      const kk = q - base;
      const ry = colRy * (1 + 0.2 * Math.cos(1.3 * kk));
      const yc = (glow ? glow.cy : 880) + 170 * Math.sin(1.9 * kk + 0.6);
      const xc = P / 2 + Math.max(-0.2 * P, Math.min(0.2 * P, 0.4 * (gx - (left + P / 2))));
      cols.push(
        <div key={q} style={{position: 'absolute', left, top: 0, width: P, height: 1920, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: -30, top: -30, right: -30, bottom: -30, filter: 'blur(10px)',
            background: `radial-gradient(ellipse ${f2(1.6 * P)}px ${f2(ry)}px at ${f2(xc + 30)}px ${f2(yc + 30)}px, rgba(${r},${g},${b},${Math.min(1, 0.95 * o).toFixed(3)}) 0%, rgba(228,160,128,${(0.5 * o).toFixed(3)}) 45%, rgba(255,255,255,0) 100%)`}} />
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(255,255,255,${(0.95 * rim).toFixed(3)}) 0px, rgba(255,255,255,0.12) ${f2(0.25 * P)}px, rgba(255,255,255,0) ${f2(0.8 * P)}px, rgba(255,255,255,0.2) ${f2(P)}px)`}} />
        </div>,
      );
    }
  }
  return (
    <AbsoluteFill style={{background: baseBg, overflow: 'hidden'}}>
      {refract < 1 && <div style={{position: 'absolute', inset: -4, background: band, opacity: 1 - refract, maskImage: m, WebkitMaskImage: m, maskComposite: 'intersect', WebkitMaskComposite: 'source-in', filter: 'blur(1.6px)'} as React.CSSProperties} />}
      {refract > 0 && <div style={{position: 'absolute', inset: 0, opacity: refract, maskImage: m, WebkitMaskImage: m} as React.CSSProperties}>{cols}</div>}
      {!glow && mask !== 'chat' && [[0.28, 0.22, 360, 0.55], [0.8, 0.8, 420, 0.5], [0.62, 0.42, 260, 0.35]].map(([x, y, rr, a], i) => (
        <div key={i} style={{position: 'absolute', left: x * 1080 - rr + 40 * Math.sin(t * 0.4 + i * 2), top: y * 1920 - rr * 1.6 + 60 * Math.cos(t * 0.3 + i), width: rr * 2, height: rr * 3.2,
          borderRadius: '50%', background: `radial-gradient(ellipse, rgba(255,255,255,${a}) 0%, rgba(255,255,255,0) 70%)`}} />
      ))}
    </AbsoluteFill>
  );
};

// Photo plein cadre (paysage ou forêt) avec teinte ocre et poussée lente
export const PhotoBg: React.FC<{t: number; src: string; start: number; tint?: number; blur?: number; zoom?: [number, number]; dur?: number; pos?: string}> =
({t, src, start, tint = 0, blur = 0, zoom = [1.04, 1.12], dur = 12, pos = '50% 50%'}) => {
  const k = Math.min(1, Math.max(0, (t - start) / dur));
  const z = zoom[0] + (zoom[1] - zoom[0]) * k;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#C9A88A'}}>
      <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos,
        transform: `scale(${z.toFixed(4)})`, filter: blur > 0 ? `blur(${f2(blur)}px)` : undefined}} />
      {tint > 0 && <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(150,60,40,${f2(tint * 0.75)}) 0%, rgba(201,138,46,${f2(tint * 0.8)}) 100%)`, mixBlendMode: 'multiply'}} />}
      {tint > 0 && <AbsoluteFill style={{background: OCRE, opacity: tint * 0.35, mixBlendMode: 'screen'}} />}
    </AbsoluteFill>
  );
};
