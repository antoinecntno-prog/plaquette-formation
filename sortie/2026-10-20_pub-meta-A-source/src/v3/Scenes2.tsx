import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Img, staticFile} from 'remotion';
import {backOut, Avatar, clampOpt, Cursor, E_IN, E_INOUT, E_OUT, enter, exit, f2, FONT, GREY, INK, Mark, mix, OCRE, BORDEAUX, P, prog, SAFE_MASK, sp, ws, we, WHITE, DURATION} from './lib';
import {FlyTitle, smear} from './Text';

import {TL, KeptWindow} from './Scenes1';
export {KeptWindow};

// ---------- Repères de la deuxième partie
export const TL2 = {
  diskEnd: TL.disk + 1.2,
  line: ws(33) - 0.05,            // soulignement sous le titre complet (réf. 10,15 s)
  stroke: ws(33) + 0.02,          // le contour givré se dessine (réf. 10,25 s)
  titleOut: ws(34) - 0.2,         // le titre se floute (réf. 11,2 s)
  morph: ws(34),                  // le cadre devient le panneau du planning (réf. 11,4 à 11,9 s)
  content: ws(34) + 0.3,
  exit: P(5) - 0.57,              // le panneau recule et se dissout (réf. 19,0 s)
  cut5: P(5) - 0.17,              // coupe vers l'arc (réf. 19,6 s)
};

// Paysage clair, voile ocre réglable (fort dans le disque, léger ensuite), halo orangé en haut à droite
export const Landscape: React.FC<{t: number; tint: number; bleach?: number; mask?: string}> = ({t, tint, bleach = 0, mask}) => {
  const z = 1.42 + 0.05 * prog(t, TL.disk, 7, (x: number) => x);
  const img = (extra: React.CSSProperties) => (
    <Img src={staticFile('bg_landscape.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
      transform: `translateY(-390px) scale(${z.toFixed(4)})`, transformOrigin: '540px 960px', ...extra}} />
  );
  const fg = 'linear-gradient(180deg, transparent 1450px, #000 1680px)';
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#E8DFD8', ...(mask ? {maskImage: mask, WebkitMaskImage: mask} : {})}}>
      {img({filter: 'brightness(1.1) contrast(1.18) saturate(0.6)'})}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,248,242,0.55) 0%, rgba(255,248,242,0.25) 45%, rgba(255,248,242,0) 62%)', mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 560px 760px at 1080px 920px, rgba(226,120,40,0.7) 0%, rgba(226,120,40,0.3) 50%, rgba(226,120,40,0) 100%)', mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 460px 70px at 880px 935px, rgba(214,100,30,0.9) 0%, rgba(214,100,30,0.35) 55%, rgba(214,100,30,0) 100%)', mixBlendMode: 'multiply'}} />
      {/* bichromie ocre : l'image passe en niveaux de gris puis prend la couleur de marque */}
      {tint > 0 && img({filter: 'grayscale(1) brightness(1.18) contrast(1.15)', opacity: tint})}
      {tint > 0 && <AbsoluteFill style={{background: OCRE, opacity: tint, mixBlendMode: 'multiply'}} />}
      {tint > 0 && <AbsoluteFill style={{background: '#E6A450', opacity: 0.2 * tint, mixBlendMode: 'screen'}} />}
      {bleach > 0 && <AbsoluteFill style={{background: '#FBF8F6', opacity: 0.85 * bleach}} />}
    </AbsoluteFill>
  );
};
export const tintAt = (t: number) => 1 - 0.8 * prog(t, TL2.stroke, 0.1, E_INOUT);

// ---------- Disque ocre qui révèle le paysage (réf. 9,07 à 9,73 s) : bord adouci, liseré blanc au front
export const diskGeom = (t: number) => {
  const g = prog(t, TL.disk, 1.2, Easing.out(Easing.quad));
  return {g, cx: -1400 + 700 * g, cy: 960, r: 1400 + 1100 * g};
};
export const DiskLayer: React.FC<{t: number}> = ({t}) => {
  if (t < TL.disk || t > TL2.diskEnd + 0.05) return null;
  const {cx, cy, r} = diskGeom(t);
  const m = `radial-gradient(circle at ${f2(cx)}px ${f2(cy)}px, #000 ${f2(r - 100)}px, transparent ${f2(r)}px)`;
  return (
    <AbsoluteFill>
      <Landscape t={t} tint={1} mask={m} />
      {/* boule d'encre ocre pleine au départ, essuyée depuis la gauche pour révéler le paysage */}
      {(() => {
        const wpe = -300 + 1600 * prog(t, TL.disk + 0.1, 0.4, E_INOUT);
        const op = 1 - prog(t, TL.disk + 0.12, 0.3, E_INOUT);
        if (op <= 0) return null;
        const mm = `${m}, linear-gradient(90deg, transparent ${f2(wpe - 250)}px, #000 ${f2(wpe)}px)`;
        return <AbsoluteFill style={{maskImage: mm, WebkitMaskImage: mm, maskComposite: 'intersect', WebkitMaskComposite: 'source-in', opacity: op,
          background: `radial-gradient(circle at ${f2(cx)}px ${f2(cy)}px, #D99A40 0px, #C98A2E ${f2(0.7 * r)}px, #B97A22 ${f2(r)}px)`} as React.CSSProperties} />;
      })()}
      <AbsoluteFill style={{background: `radial-gradient(circle at ${f2(cx)}px ${f2(cy)}px, rgba(255,255,255,0) ${f2(r - 90)}px, rgba(255,255,255,0.7) ${f2(r - 30)}px, rgba(255,255,255,0.25) ${f2(r + 10)}px, rgba(255,255,255,0) ${f2(r + 60)}px)`,
        filter: 'blur(14px)'}} />
    </AbsoluteFill>
  );
};

// Dalle de verre givré qui traverse derrière le titre (réf. 9,45 à 9,85 s)
export const GlassSlab: React.FC<{t: number}> = ({t}) => {
  const t0 = TL.disk + 0.4;
  if (t < t0 || t > t0 + 0.72) return null;
  const p = prog(t, t0, 0.7, Easing.out(Easing.cubic));
  const left = -380 + 1560 * p;
  const m = 'linear-gradient(90deg, transparent 0, #000 70px, #000 300px, transparent 380px)';
  return (
    <div style={{position: 'absolute', top: 0, height: 1920, left, width: 380, overflow: 'hidden', maskImage: m, WebkitMaskImage: m}}>
      <div style={{position: 'absolute', top: 0, left: -left, width: 1080, height: 1920}}><Landscape t={t} tint={0.1} /></div>
      <div style={{position: 'absolute', top: 0, bottom: 0, right: 40, width: 18, background: 'rgba(255,255,255,0.6)', filter: 'blur(6px)'}} />
      {[0.2, 0.45].map((q) => <div key={q} style={{position: 'absolute', top: 0, bottom: 0, left: `${q * 100}%`, width: 1, background: 'rgba(255,255,255,0.3)'}} />)}
    </div>
  );
};

// ---------- Cadre givré : soulignement, contour qui se dessine, puis panneau du planning (réf. 10,15 à 19,5 s)
const R1 = {x: 170, y: 770, w: 740, h: 215};
const R2 = {x: 135, y: 430, w: 810, h: 800};
const rectAt = (t: number) => {
  const m = prog(t, TL2.morph, 0.4, Easing.inOut(Easing.cubic));
  return {x: R1.x + (R2.x - R1.x) * m, y: R1.y + (R2.y - R1.y) * m, w: R1.w + (R2.w - R1.w) * m, h: R1.h + (R2.h - R1.h) * m, m};
};
const sceneXf = (t: number) => {
  const push = prog(t, TL2.morph + 0.1, TL2.exit - TL2.morph - 0.1, (x: number) => x);
  const ex = prog(t, TL2.exit, 0.35, (x: number) => x * x);
  return {s: (1 + 0.06 * push) * (1 - 0.15 * ex), blur: 10 * ex, op: 1 - prog(t, TL2.exit + 0.2, 0.15)};
};
export const GlassPanel: React.FC<{t: number}> = ({t}) => {
  if (t < TL2.line || t >= TL2.cut5) return null;
  const r = rectAt(t);
  const line = prog(t, TL2.line, 0.12, E_OUT);
  const st = prog(t, TL2.stroke, 0.1, (x: number) => x);
  const fill = prog(t, TL2.stroke, 0.1);
  const xf = sceneXf(t);
  const stroke = 1 - r.m;                       // le panneau du planning n'a pas de contour
  const rad = 14 + 14 * r.m;
  const W2 = r.w, H2 = r.h, cxm = W2 / 2;
  const half = (dir: number) => `M ${f2(cxm)} ${f2(H2)} L ${f2(cxm - dir * (cxm - rad))} ${f2(H2)} Q ${f2(cxm - dir * cxm)} ${f2(H2)} ${f2(cxm - dir * cxm)} ${f2(H2 - rad)} L ${f2(cxm - dir * cxm)} ${f2(rad)} Q ${f2(cxm - dir * cxm)} 0 ${f2(cxm - dir * (cxm - rad))} 0 L ${f2(cxm)} 0`;
  return (
    <AbsoluteFill style={{transform: `scale(${xf.s.toFixed(4)})`, transformOrigin: '540px 830px', opacity: xf.op, filter: xf.blur > 0.05 ? `blur(${f2(xf.blur)}px)` : undefined}}>
      <div style={{position: 'absolute', left: r.x, top: r.y, width: W2, height: H2, borderRadius: rad, opacity: fill,
        background: r.m < 0.5 ? `rgba(90,40,10,${(0.12 * (1 - 2 * r.m)).toFixed(3)})` : `rgba(255,255,255,${(0.12 + 0.1 * r.m).toFixed(3)})`, backdropFilter: 'blur(24px) saturate(1.1)', WebkitBackdropFilter: 'blur(24px) saturate(1.1)'}} />
      <svg style={{position: 'absolute', left: r.x, top: r.y, overflow: 'visible'}} width={W2} height={H2}>
        {[1, -1].map((d) => <path key={d} d={half(d)} pathLength={1} fill="none" stroke={`rgba(255,255,255,${(0.75 * stroke).toFixed(3)})`} strokeWidth={1.5}
          strokeDasharray="1 1" strokeDashoffset={1 - st} />)}
      </svg>
      {st < 1 && <div style={{position: 'absolute', left: R1.x + R1.w / 2 - (R1.w / 2) * line, top: R1.y + R1.h - 1, width: R1.w * line, height: 1.5, background: 'rgba(255,255,255,0.85)'}} />}
      <S5Content t={t} r={r} />
    </AbsoluteFill>
  );
};

// ---------- Scène 4 : titre blanc sur le paysage teinté (réf. 9,23 à 11,2 s)
export const S4Title: React.FC<{t: number; ready: boolean}> = ({t, ready}) => {
  if (t < ws(30) - 0.2 || t > TL2.titleOut + 0.2) return null;
  const out = prog(t, TL2.titleOut, 0.15, E_IN);
  return (
    <AbsoluteFill style={{opacity: 1 - out, filter: out > 0.01 ? `blur(${f2(16 * out)}px)` : undefined}}>
      <div style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 2px 12px rgba(90,40,10,0.5))'}}><FlyTitle t={t} ready={ready} size={70} y={875} dark={false} weight={700} lines={[
        [{i: 30, from: [0, 26]}, {i: 31, from: [0, 26]}],
        [{i: 32, from: [0, 26]}, {i: 33, from: [0, 26]}],
      ]} /></div>
    </AbsoluteFill>
  );
};

// ---------- Scène 5 : planning J0 à J30 dans le panneau givré, barres en cascade (réf. 12,1 à 16,8 s)
const X0 = 380, X1 = 770, DAY = (X1 - X0) / 30, Y0 = 124, PITCH = 104;
const ROWS = [
  {label: 'Une journée chez vous', sub: '7 h sur site', bars: [{from: 0, to: 1, at: ws(36)}]},
  {label: 'Vos vrais dossiers', bars: [{from: 0, to: 1, at: ws(41)}]},
  {label: 'Cinq personnes au plus', people: ws(43)},
  {label: 'Usage, semaines 1 et 2', bars: [{from: 1, to: 8, at: ws(42) + 0.1}, {from: 8, to: 15, at: ws(42) + 0.45}]},
  {label: 'Usage, semaines 3 et 4', bars: [{from: 15, to: 22, at: ws(46) - 0.05}, {from: 22, to: 29, at: ws(46) + 0.3}]},
  {label: 'Point de résultat', end: P(5) - 0.6},
];
const S5Content: React.FC<{t: number; r: {x: number; y: number; w: number; h: number; m: number}}> = ({t, r}) => {
  if (t < TL2.content) return null;
  const c = prog(t, TL2.content, 0.25, E_OUT);
  const bl = 8 * (1 - c);
  return (
    <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, opacity: c, filter: bl > 0.1 ? `blur(${f2(bl)}px)` : undefined, fontFamily: FONT, color: INK}}>
      <div style={{position: 'absolute', left: X0 - 6, top: 32, fontSize: 22, fontWeight: 700, letterSpacing: 0.6, lineHeight: 1.1}}>JOURNÉE<br />SUR SITE</div>
      <div style={{position: 'absolute', left: X1 - 200, width: 210, textAlign: 'right', top: 32, fontSize: 22, fontWeight: 700, letterSpacing: 0.6, lineHeight: 1.1}}>POINT DE<br />RÉSULTAT</div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 100, height: 1.5, background: 'rgba(255,255,255,0.8)'}} />
      {[0, 30].map((d) => <div key={d} style={{position: 'absolute', left: X0 + d * DAY, top: 100, width: 1.5, height: ROWS.length * PITCH + 10, background: 'rgba(255,255,255,0.8)'}} />)}
      {ROWS.map((row, k) => {
        const y = Y0 + k * PITCH;
        return (
          <div key={k}>
            <div style={{position: 'absolute', left: 30, top: y, width: X0 - 50}}>
              <div style={{fontSize: 28, fontWeight: 700, lineHeight: 1.08}}>{row.label}</div>
              {row.sub && <div style={{fontSize: 24, color: '#3E3536', marginTop: 4}}>{row.sub}</div>}
            </div>
            <div style={{position: 'absolute', left: 30, right: 30, top: y + PITCH - 16, height: 1, background: 'rgba(255,255,255,0.6)'}} />
            {row.bars && row.bars.map((b, q) => {
              const f = prog(t, b.at, 0.45, Easing.out(Easing.quad));
              const w = Math.max(90, (b.to - b.from) * DAY);
              const left = b.from === 0 ? X0 : X0 + b.from * DAY;
              return <div key={q} style={{position: 'absolute', left: Math.min(left, X1 - w), top: y + 8, height: 30, borderRadius: 7, width: w * f, opacity: f > 0 ? 1 : 0,
                background: b.from === 0 ? OCRE : 'rgba(201,138,46,0.72)'}} />;
            })}
            {row.people !== undefined && (
              <div style={{position: 'absolute', left: X0 + 6, top: y - 4, display: 'flex', gap: 6}}>
                {[0, 1, 2, 3, 4].map((q) => {
                  const s = sp(t, row.people! + q * 0.09, {damping: 12, stiffness: 190});
                  return <div key={q} style={{transform: `scale(${Math.min(1.1, s).toFixed(4)})`, opacity: t >= row.people! + q * 0.09 ? 1 : 0}}><Avatar size={50} i={q} /></div>;
                })}
              </div>
            )}
            {row.end !== undefined && (() => {
              const s = prog(t, row.end, 0.3, backOut(1.7));
              return <div style={{position: 'absolute', left: X1 - 40, top: y + 2, width: 42, height: 42, borderRadius: 9, background: OCRE, boxShadow: '0 0 0 7px rgba(201,138,46,0.28)',
                transform: `scale(${Math.max(0, s).toFixed(4)})`, opacity: t >= row.end ? 1 : 0}} />;
            })()}
          </div>
        );
      })}
      {[0, 10, 20, 30].map((d) => <div key={d} style={{position: 'absolute', left: X0 + d * DAY - 30, width: 60, textAlign: 'center', top: Y0 + ROWS.length * PITCH + 4, fontSize: 22, fontWeight: 700}}>J{d}</div>)}
    </div>
  );
};
// Fin du planning : le paysage blanchit, quelques traits de verre passent (réf. 19,0 à 19,6 s)
export const bleachAt = (t: number) => prog(t, TL2.exit, 0.35, E_IN);
export const BleachStreaks: React.FC<{t: number}> = ({t}) => {
  const t0 = TL2.exit + 0.25;
  if (t < t0 || t >= TL2.cut5) return null;
  const p = prog(t, t0, TL2.cut5 - t0, (x: number) => x);
  return (
    <AbsoluteFill>
      {[120, 380, 640, 900].map((x, k) => <div key={k} style={{position: 'absolute', top: 0, bottom: 0, left: x - 200 + 400 * p + k * 20, width: 44, background: 'rgba(255,255,255,0.4)', filter: 'blur(8px)'}} />)}
    </AbsoluteFill>
  );
};

