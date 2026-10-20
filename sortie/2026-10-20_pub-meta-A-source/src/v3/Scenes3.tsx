import React from 'react';
import {AbsoluteFill, Easing, Img, staticFile, useCurrentFrame} from 'remotion';
import {Avatar, backOut, BORDEAUX, Cursor, DirBlur, dirF, DURATION, E_IN, E_INOUT, E_OUT, expoOut, f2, FONT, GREY, INK, Mark, OCRE, P, prog, safeMask, sp, ws, we, WHITE} from './lib';
import {E_WORD, FlyTitle, OCRE_TXT} from './Text';
import {TL2} from './Scenes2';
import {FlutedBg} from './Backgrounds';

// ---------- Caméra par images clés : point visé F (monde), échelle s, point d'écran C
type Key = {t: number; F: [number, number]; s: number; C?: [number, number]; ease?: (x: number) => number};
const camPath = (t: number, keys: Key[]) => {
  const C0: [number, number] = [540, 960];
  if (t <= keys[0].t) return {F: keys[0].F, s: keys[0].s, C: keys[0].C || C0, v: 0};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const raw = (t - a.t) / Math.max(1e-6, b.t - a.t);
      const e = (b.ease || E_INOUT)(Math.min(1, Math.max(0, raw)));
      const ca = a.C || C0, cb = b.C || C0;
      const lerp = (x: number, y: number) => x + (y - x) * e;
      const dd = 0.01;
      const e2 = (b.ease || E_INOUT)(Math.min(1, raw + dd));
      const v = Math.abs(e2 - e) / dd;          // vitesse relative (pour le flou de mouvement)
      return {F: [lerp(a.F[0], b.F[0]), lerp(a.F[1], b.F[1])] as [number, number], s: lerp(a.s, b.s), C: [lerp(ca[0], cb[0]), lerp(ca[1], cb[1])] as [number, number], v};
    }
  }
  const l = keys[keys.length - 1];
  return {F: l.F, s: l.s, C: l.C || C0, v: 0};
};
const camStyle = (c: {F: [number, number]; s: number; C: [number, number]}): React.CSSProperties => ({
  transform: `translate(${f2(c.C[0] - c.F[0] * c.s)}px, ${f2(c.C[1] - c.F[1] * c.s)}px) scale(${c.s.toFixed(4)})`, transformOrigin: '0 0',
});

// ---------- Repères de la troisième partie
export const TL3 = {
  cut5: TL2.cut5,
  burst: P(6) - 1.0,            // éclatement (réf. 26,6 s)
  card: P(6) - 0.68,            // la marque devient le logo de la carte (réf. 27,17 s)
  morph: P(6) - 0.16,           // la carte devient la barre de navigation (réf. 27,7 s)
  close: ws(57) - 0.19,         // gros plan sur l'élément survolé (réf. 28,1 s)
  flood: ws(58) - 0.14,         // encre ocre (réf. 29,17 s)
  forest: ws(58) + 0.12,
  ctaGlass: P(7) - 0.39,        // réfraction cannelée vers le blanc (réf. 33,9 s)
  end: we(73),                  // carton final (réf. 36,35 s)
};

// ---------- Scène 6 : arc en horizon, cinq participants, compteur (réf. 19,6 à 26,8 s)
const AC = {x: 540, y: 1320};
const ANG = [-55, -28, 0, 28, 55];
const BAD = ANG.map((a) => ({x: AC.x + 430 * Math.sin((a * Math.PI) / 180), y: AC.y - 430 * Math.cos((a * Math.PI) / 180), a}));
const SUN = {x: 540, y: 1235};
export const badgeTimes = () => [TL3.cut5 + 0.5, TL3.cut5 + 0.85, ws(50) - 0.02, ws(50) + 0.18, ws(52) + 0.07];
const arcCam = (t: number) => {
  const c0 = TL3.cut5, pb = ws(51) - 0.04;
  return camPath(t, [
    {t: c0, F: [540, 960], s: 2.4, C: [540, 700]},
    {t: c0 + 0.5, F: [540, 960], s: 1.0, ease: expoOut},
    {t: c0 + 0.75, F: [540, 958], s: 1.03, ease: (x: number) => x},
    {t: c0 + 1.05, F: [330, 1010], s: 1.6, ease: Easing.inOut(Easing.sin)},
    {t: ws(49) + 0.1, F: [345, 1005], s: 1.62, ease: (x: number) => x},
    {t: ws(49) + 0.3, F: [540, 940], s: 1.6, ease: Easing.inOut(Easing.cubic)},
    {t: pb, F: [545, 945], s: 1.62, ease: (x: number) => x},
    {t: pb + 0.6, F: [540, 960], s: 1.0, ease: Easing.inOut(Easing.quad)},
    {t: TL3.burst, F: [540, 965], s: 1.02, ease: (x: number) => x},
    {t: TL3.card, F: [SUN.x, SUN.y], s: 1.7, C: [540, 900], ease: (x: number) => x * x * x},
  ]);
};
export const S6Arc: React.FC<{t: number}> = ({t}) => {
  if (t < TL3.cut5 || t > TL3.card + 0.12) return null;
  const c = arcCam(t);
  const zb = 12 * (1 - prog(t, TL3.cut5, 0.45, E_OUT));
  const tB = badgeTimes();
  const burst = prog(t, TL3.burst, 0.3, (x: number) => x * x);
  const ringFade = prog(t, TL3.burst + 0.05, 0.3);
  const whipBlur = t > ws(49) + 0.1 && t < ws(49) + 0.3 ? 35 * Math.sin(((t - ws(49) - 0.1) / 0.2) * Math.PI) : 0;
  const n = Math.round(Math.max(0, Math.min(60, ((t - (ws(51) - 0.04)) / Math.max(0.3, we(53) - ws(51))) * 60)));
  const s0 = ws(55) - 0.05;                                         // bascule du compteur : l'ancienne valeur sort, puis la nouvelle entre
  const oldOut = prog(t, s0, 0.1, E_IN), newIn = prog(t, s0 + 0.09, 0.14), newY = 1 - prog(t, s0 + 0.09, 0.22, E_OUT);
  const cntIn = prog(t, ws(51) + 0.05, 0.4, E_WORD);
  const cntOut = prog(t, TL3.burst - 0.05, 0.12);
  const curP = prog(t, TL3.burst - 0.05, 0.4, Easing.out(Easing.quad));
  const camFilter = zb > 0.1 ? `blur(${f2(zb)}px)` : dirF('arcwhip', whipBlur, 0);
  return (
    <AbsoluteFill>
      <DirBlur id="arcwhip" x={whipBlur} y={0} />
      {/* bandes de l'arc : jusqu'aux bords du cadre, horizon adouci */}
      <AbsoluteFill style={{filter: camFilter}}>
        <AbsoluteFill style={camStyle(c)}>
          <div style={{opacity: 1 - ringFade, filter: burst > 0.02 ? `blur(${f2(10 * burst)}px)` : undefined}}>
            {[{r: 430, c: '#EFD3B6'}, {r: 300, c: '#D9A066'}, {r: 255, c: '#FFFFFF'}].map((q, k) => (
              <div key={k} style={{position: 'absolute', left: AC.x - q.r, top: AC.y - q.r, width: 2 * q.r, height: 2 * q.r, borderRadius: '50%', background: q.c,
                boxShadow: k === 0 ? '0 0 120px rgba(201,138,46,0.25)' : undefined}} />
            ))}
            <div style={{position: 'absolute', left: -1200, right: -1200, top: 1190, height: 1400, background: 'linear-gradient(180deg, rgba(248,245,243,0) 0px, #F8F5F3 130px)'}} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* marque, badges et étiquettes : dans la zone utile */}
      <AbsoluteFill style={{...safeMask(262, 1258), filter: camFilter}}>
        <AbsoluteFill style={camStyle(c)}>
          {t < TL3.card && <div style={{position: 'absolute', left: SUN.x - 150, top: SUN.y - 150, maskImage: 'linear-gradient(180deg, #000 0px, #000 105px, transparent 235px)', WebkitMaskImage: 'linear-gradient(180deg, #000 0px, #000 105px, transparent 235px)'}}><Mark size={300} t={t} /></div>}
          {BAD.map((b, k) => {
            if (t < tB[k]) return null;
            const s = prog(t, tB[k], 0.25, backOut(1.6));
            const sc = Math.max(0, s);
            const lab = prog(t, tB[k] + 0.12, 0.18, E_OUT);
            const ux = Math.sin((b.a * Math.PI) / 180), uy = -Math.cos((b.a * Math.PI) / 180);
            const rise = 90 * (1 - Math.min(1, sc));                    // le badge sort de l'arc et monte jusqu'au bord
            const id = `badge${k}`;
            const bb = 25 * burst;
            const right = b.a <= 0;           // l'étiquette s'étire du côté intérieur
            return (
              <div key={k} style={{position: 'absolute', left: b.x - 60 + ux * 420 * burst - ux * rise, top: b.y - 60 + uy * 420 * burst - uy * rise, width: 120, height: 120,
                opacity: 1 - prog(t, TL3.burst + 0.04, 0.14), filter: dirF(id, Math.abs(ux) * bb, Math.abs(uy) * bb)}}>
                <DirBlur id={id} x={Math.abs(ux) * bb} y={Math.abs(uy) * bb} />
                <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: WHITE, boxShadow: '0 14px 34px rgba(150,80,40,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: `scale(${(0.2 + 0.8 * sc).toFixed(4)})`}}>
                  <Avatar size={86} i={k} />
                </div>
                <div style={{position: 'absolute', top: -54, [right ? 'left' : 'right']: 34, padding: '6px 14px', borderRadius: 10, background: OCRE, color: WHITE, fontFamily: FONT, fontSize: 30, fontWeight: 700,
                  whiteSpace: 'nowrap', boxShadow: '0 8px 18px rgba(201,138,46,0.35)', transform: `scaleX(${lab.toFixed(4)})`, transformOrigin: right ? 'left center' : 'right center',
                  filter: lab < 0.98 ? `blur(${f2(8 * (1 - lab))}px)` : undefined, opacity: lab > 0 ? 1 : 0} as React.CSSProperties}>+1 h</div>
              </div>
            );
          })}
        </AbsoluteFill>
      </AbsoluteFill>
      {t >= ws(51) && (
        <div style={{position: 'absolute', left: 140, width: 800, top: 560, height: 120, textAlign: 'center', fontFamily: FONT, opacity: cntIn * (1 - cntOut),
          transform: `translateY(${f2((1 - cntIn) * 40)}px)`, filter: cntIn < 0.97 ? `blur(${f2((1 - cntIn) * 10)}px)` : undefined}}>
          <div style={{position: 'absolute', inset: 0, opacity: 1 - oldOut, transform: `translateY(${f2(-40 * oldOut)}px)`, filter: oldOut > 0.02 && oldOut < 0.98 ? `blur(${f2(8 * oldOut)}px)` : undefined, fontSize: 96, fontWeight: 700, color: INK}}>{n}<span style={{fontSize: 42, marginLeft: 10, color: GREY}}>min</span></div>
          <div style={{position: 'absolute', inset: 0, opacity: newIn, transform: `translateY(${f2(40 * newY)}px)`, filter: newY > 0.02 ? `blur(${f2(8 * newY)}px)` : undefined, fontSize: 96, fontWeight: 700, color: OCRE_TXT}}>1 h<span style={{fontSize: 42, marginLeft: 12, color: INK}}>/ semaine</span></div>
        </div>
      )}
      {t >= TL3.burst - 0.05 && <Cursor size={64} style={{position: 'absolute', left: 1150 - (1150 - 575) * curP, top: 1120 - (1120 - 930) * curP}} />}
    </AbsoluteFill>
  );
};

// ---------- Carte titre qui naît de la marque, puis barre de navigation (réf. 27,17 à 29,2 s)
const NAV_ITEMS = [{l: 'Programme', x: 548}, {l: 'Résultat vérifié', x: 712}];
export const S6Card: React.FC<{t: number}> = ({t}) => {
  if (t < TL3.card || t >= TL3.flood + 0.32) return null;
  const q = prog(t, TL3.card + 0.08, 0.3, expoOut);                 // la carte s'étire vers la droite
  const sq = prog(t, TL3.card, 0.1, E_OUT);                          // carré qui apparaît autour de la marque
  const drift = -60 * prog(t, TL3.card + 0.38, TL3.morph - TL3.card - 0.38, (x: number) => x);
  const m = prog(t, TL3.morph, 0.24, Easing.inOut(Easing.cubic));   // carte vers barre
  const mBlur = 30 * Math.sin(Math.min(1, m) * Math.PI);
  // géométrie : carré autour de la marque, carte, barre
  const sqR = {x: 540 - 300, y: 900 - 300, w: 600, h: 600};
  const cardR = {x: 110, y: 720, w: 860, h: 360};
  const barR = {x: 110, y: 838, w: 860, h: 124};
  const L = (a: number, b: number, k: number) => a + (b - a) * k;
  const r1 = {x: L(sqR.x, cardR.x, q), y: L(sqR.y, cardR.y, q), w: L(sqR.w, cardR.w, q), h: L(sqR.h, cardR.h, q)};
  const r = {x: L(r1.x, barR.x, m) + drift * (1 - m), y: L(r1.y, barR.y, m), w: L(r1.w, barR.w, m), h: L(r1.h, barR.h, m)};
  const logo = {x: L(L(540, 270, q), 172, m) + drift * (1 - m), y: L(900, 900, m), s: L(L(510, 280, q), 84, m)};
  const ttl = prog(t, TL3.card + 0.2, 0.25, E_OUT);
  // survol, gros plan, recul
  const tHover = TL3.morph + 0.26;
  const glide = prog(t, tHover, 0.3, Easing.out(Easing.quad));
  const hot = prog(t, tHover + 0.18, 0.12);
  const CL = 0.38;
  const closeOn = t >= TL3.close && t < TL3.close + CL;
  const pull = prog(t, TL3.close + CL, 0.14, E_INOUT);
  const zs = closeOn ? 1.8 + 0.1 * prog(t, TL3.close, CL, (x: number) => x) : t >= TL3.close + CL ? 1.9 - 0.9 * pull : 1;
  const focus = {x: 740, y: 900};
  const farFade = Math.max(0, Math.min(1, (1.3 - zs) / 0.25));                                // logo et nom sortiraient du cadre dans le gros plan
  const camF = t < TL3.close ? {x: 540, y: 900} : {x: L(focus.x, 540, pull), y: 900};
  const vBlur = t >= TL3.close + CL ? 20 * Math.sin(pull * Math.PI) : 0;
  // fin : la barre s'étire, se floute, monte un peu (réf. 29,17 à 29,33 s)
  const sm = prog(t, TL3.flood - 0.05, 0.19, E_IN);
  const cur = t < tHover ? {x: logo.x + 20, y: logo.y + 18} : {x: L(logo.x + 20, NAV_ITEMS[1].x + 150, glide), y: L(logo.y + 18, 918, glide)};
  return (
    <AbsoluteFill style={{...safeMask(262, 1258, 0, 1080), filter: dirF('navblur', mBlur + 12 * sm, vBlur)}}>
      <DirBlur id="navblur" x={mBlur + 12 * sm} y={vBlur} />
      <AbsoluteFill style={{transform: `translateY(${f2(-10 * sm)}px) scaleX(${(1 + 0.25 * sm).toFixed(4)})`, transformOrigin: '540px 900px'}}>
      <AbsoluteFill style={{transform: `translate(${f2(540 - camF.x * zs)}px, ${f2(900 - camF.y * zs)}px) scale(${zs.toFixed(4)})`, transformOrigin: '0 0'}}>
        <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: L(36, 28, m), background: WHITE, opacity: sq,
          boxShadow: '0 30px 60px rgba(110,30,43,0.12)'}} />
        <div style={{position: 'absolute', left: logo.x - logo.s / 2, top: logo.y - logo.s / 2, opacity: farFade}}><Mark size={logo.s} t={t} /></div>
        {m < 0.6 && <div style={{position: 'absolute', left: logo.x + logo.s / 2 + 28, top: 900 - 68, fontFamily: FONT, fontSize: 64, fontWeight: 700, color: INK, lineHeight: 1.06,
          opacity: ttl * (1 - m / 0.6), transform: `translateX(${f2(-40 * (1 - ttl))}px)`, filter: ttl < 0.97 ? `blur(${f2(12 * (1 - ttl))}px)` : undefined, whiteSpace: 'nowrap'}}>L’Accélérateur<br />IA 30 jours</div>}
        {m > 0.4 && <div style={{position: 'absolute', left: 228, top: 900 - 20, fontFamily: FONT, fontSize: 30, fontWeight: 700, color: INK, opacity: prog(m, 0.4, 0.6) * farFade, whiteSpace: 'nowrap', lineHeight: '40px'}}>L’Accélérateur IA</div>}
        {NAV_ITEMS.map((it, k) => {
          const a = prog(t, TL3.morph + (k === 1 ? 0.1 : 0.22), 0.2, E_OUT);   // « Résultat vérifié » apparaît avec le mot dit
          const hv = k === 1 ? hot : 0;
          return <div key={k} style={{position: 'absolute', left: it.x, top: 900 - 18, fontFamily: FONT, fontSize: 26, fontWeight: 400, whiteSpace: 'nowrap', lineHeight: '36px', opacity: a,
            transform: `translateX(${f2((1 - a) * 16)}px)`,
            color: `rgb(${Math.round(31 + (168 - 31) * hv)}, ${Math.round(26 + (106 - 26) * hv)}, ${Math.round(27 + (28 - 27) * hv)})`}}>{it.l}</div>;
        })}
        <Cursor size={64} style={{position: 'absolute', left: cur.x, top: cur.y}} />
      </AbsoluteFill>
      </AbsoluteFill>
      {sm > 0 && <AbsoluteFill style={{background: 'repeating-linear-gradient(90deg, rgba(201,138,46,0.35) 0 6px, transparent 6px 14px)', opacity: 0.6 * sm}} />}
    </AbsoluteFill>
  );
};

// ---------- Encre ocre qui envahit le cadre, puis laisse place à la forêt (réf. 29,37 à 30,1 s)
export const Flood: React.FC<{t: number}> = ({t}) => {
  const f = useCurrentFrame();
  const t0 = TL3.flood + 0.14;
  if (t < t0) return null;
  const g = prog(t, t0, 0.16, E_OUT);
  const R = 2300 * g;
  const fade = prog(t, t0 + 0.1, 0.4, E_INOUT);
  const op = 1 - 0.85 * fade;
  return (
    <AbsoluteFill style={{opacity: op}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="inkg" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#D49A4A" /><stop offset="0.5" stopColor="#C98A2E" /><stop offset="1" stopColor="#B4702E" />
          </linearGradient>
          <filter id="inkedge" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.012" numOctaves={3} seed={f % 50} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={220} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation={12} />
          </filter>
        </defs>
        <circle cx={0} cy={300} r={R * 1.12} fill="#E3B07A" opacity={0.75} filter="url(#inkedge)" />
        <circle cx={0} cy={300} r={R} fill="url(#inkg)" filter="url(#inkedge)" />
        {t > t0 + 0.1 && [0, 1, 2, 3, 4].map((k) => {
          const yy = 260 + k * 360 + 40 * (t - t0) + 30 * Math.sin(t * 1.3 + k);
          return <path key={k} d={`M -60 ${f2(yy)} C 300 ${f2(yy - 120 + 40 * Math.sin(t + k))}, 700 ${f2(yy + 120)}, 1140 ${f2(yy - 30)}`} stroke="rgba(255,226,186,0.28)" strokeWidth={70} fill="none" style={{filter: 'blur(14px)'}} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Scène 7 : forêt claire, rangée de cercles reliés au moyeu, fiche de résultat, tampon (réf. 29,7 à 33,9 s)
const NODES = ['Usage', 'Équipes', 'Dossiers', 'Temps', 'Résultat'];
const forestCam = (t: number) => {
  const a = ws(61) - 0.1;
  return camPath(t, [
    {t: a, F: [540, 700], s: 0.88, C: [540, 700]},
    {t: a + 0.8, F: [540, 700], s: 1.1, C: [540, 700], ease: Easing.bezier(0.5, 0, 0.2, 1)},
    {t: a + 1.0, F: [540, 700], s: 1.11, C: [540, 700], ease: (x: number) => x},
    {t: a + 1.6, F: [590, 690], s: 1.0, C: [540, 700], ease: Easing.bezier(0.6, 0, 0.25, 1)},
    {t: P(7) - 0.62, F: [586, 692], s: 1.0, C: [540, 700], ease: (x: number) => x},
    {t: P(7) - 0.37, F: [586, 692], s: 0.9, C: [540, 760], ease: (x: number) => x * x},
  ]);
};
const screenOf = (c: {F: [number, number]; s: number; C: [number, number]}, x: number, y: number) => [c.C[0] + (x - c.F[0]) * c.s, c.C[1] + (y - c.F[1]) * c.s];
export const S7Forest: React.FC<{t: number}> = ({t}) => {
  if (t < TL3.flood + 0.14 || t > P(7) - 0.1) return null;
  const c = forestCam(t);
  const exitP = prog(t, P(7) - 0.62, 0.25, (x: number) => x * x);
  const tN = (k: number) => TL3.forest + 0.12 + 0.18 * k;
  const hubIn = sp(t, TL3.forest + 0.1, {damping: 12, stiffness: 160});
  const spin = prog(t, ws(61) - 0.15, 0.2, E_INOUT) * 120 + prog(t, ws(61) + 0.95, 0.25, E_INOUT) * 120;
  const cardIn = prog(t, ws(59) + 0.15, 0.5, E_WORD);
  const row1 = [0, 1, 2, 3, 4].map((q) => ws(59) + 0.45 + q * 0.12);
  const row1End = row1[4] + 0.1;
  const row2 = [0, 1, 2, 3, 4].map((q) => row1End + 0.2 + q * 0.12);
  const stamp = we(60) + 0.02;
  const stS = sp(t, stamp, {damping: 13, stiffness: 160});
  // flou de mouvement proportionnel à la vitesse réelle à l'écran (point du moyeu)
  const c1 = forestCam(t - 1 / 30);
  const [hx, hy] = screenOf(c, 540, 745), [px, py] = screenOf(c1, 540, 745);
  const dvx = Math.abs(hx - px), dvy = Math.abs(hy - py);
  const vx = dvx >= 2 ? Math.min(12, 0.6 * dvx) : 0, vy = dvy >= 2 ? Math.min(12, 0.6 * dvy) : 0;
  const par = {F: [c.F[0], 700 + (c.F[1] - 700) * 0.35] as [number, number], s: 1 + 0.4 * (c.s - 1), C: c.C};
  const bgFade = prog(t, TL3.flood + 0.24, 0.06);
  return (
    <AbsoluteFill style={{opacity: 1 - prog(t, TL3.ctaGlass + 0.12, 0.17, E_IN)}}>
      {/* fond : forêt claire floue, voile ocre sur le bas, brume, branches nettes au bord */}
      <AbsoluteFill style={{opacity: bgFade, overflow: 'hidden'}}>
        <AbsoluteFill style={{...camStyle(par)}}>
          <Img src={staticFile('bg_pines.jpg')} style={{position: 'absolute', left: -60, top: -60, width: 1200, height: 2040, objectFit: 'cover', filter: 'blur(7px)'}} />
          <div style={{position: 'absolute', left: -60, top: -60, width: 1200, height: 2040, background: 'rgba(214,140,60,0.45)', mixBlendMode: 'multiply',
            maskImage: 'linear-gradient(180deg, transparent 1000px, #000 1400px)', WebkitMaskImage: 'linear-gradient(180deg, transparent 1000px, #000 1400px)'}} />
          <div style={{position: 'absolute', left: -60, width: 1200, top: -60, height: 900, background: 'linear-gradient(180deg, rgba(255,250,246,0.35) 0%, rgba(255,250,246,0.2) 60%, rgba(255,250,246,0) 100%)'}} />
          <div style={{position: 'absolute', left: -60, width: 1200, top: 1120, height: 120, background: 'rgba(255,246,236,0.5)', filter: 'blur(24px)'}} />
          <div style={{position: 'absolute', left: -60, width: 1200, top: 560, height: 260, background: 'linear-gradient(180deg, rgba(222,140,70,0) 0%, rgba(222,140,70,0.35) 50%, rgba(222,140,70,0) 100%)', filter: 'blur(30px)'}} />
        </AbsoluteFill>
      </AbsoluteFill>
      <Flood t={t} />
      <AbsoluteFill style={{...safeMask(262, 1258), opacity: 1 - prog(t, TL3.ctaGlass + 0.1, 0.2), filter: exitP > 0.02 ? `blur(${f2(6 * exitP)}px)` : dirF('forestv', vx, vy)}}>
        <DirBlur id="forestv" x={vx} y={vy} />
        <AbsoluteFill style={camStyle(c)}>
          {/* rangée de cercles reliés */}
          {NODES.map((nm, k) => {
            const s = sp(t, tN(k), {damping: 12, stiffness: 180});
            const cx = 236 + k * 152;
            const conn = prog(t, tN(k) + 0.1, 0.12, E_OUT);
            return (
              <React.Fragment key={k}>
                {k < 4 && <div style={{position: 'absolute', left: cx + 69, top: 499, width: 14, height: 2, background: INK, transform: `scaleX(${conn.toFixed(3)})`, transformOrigin: 'left center'}} />}
                <div style={{position: 'absolute', left: cx - 69, top: 500 - 69, width: 138, height: 138, borderRadius: '50%', background: OCRE, boxShadow: '0 12px 28px rgba(120,60,20,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontFamily: FONT, fontSize: 24, fontWeight: 700, textAlign: 'center', lineHeight: 1.1,
                  transform: `scale(${Math.max(0, Math.min(1.06, s)).toFixed(4)})`, opacity: t >= tN(k) ? 1 : 0}}>{nm}</div>
              </React.Fragment>
            );
          })}
          <div style={{position: 'absolute', left: 539, top: 569, width: 2, height: 56, background: INK, transform: `scaleY(${prog(t, tN(4) + 0.1, 0.15).toFixed(3)})`, transformOrigin: 'center top'}} />
          {/* moyeu */}
          <div style={{position: 'absolute', left: 540 - 120, top: 745 - 120, width: 240, height: 240, borderRadius: '50%', background: 'rgba(201,138,46,0.35)', boxShadow: '0 0 0 32px rgba(201,138,46,0.18)',
            transform: `scale(${Math.max(0, Math.min(1.08, hubIn)).toFixed(4)})`, opacity: t >= TL3.forest + 0.1 ? 1 : 0}}>
            <div style={{position: 'absolute', inset: 30, borderRadius: '50%', background: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 40px rgba(150,70,30,0.25)'}}>
              <div style={{transform: `rotate(${f2(spin)}deg)`}}><Mark size={130} t={t} /></div>
            </div>
          </div>
          <div style={{position: 'absolute', left: 539, top: 865, width: 2, height: 35, background: INK, transform: `scaleY(${cardIn.toFixed(3)})`, transformOrigin: 'center top'}} />
          {/* fiche de résultat en verre givré */}
          <div style={{position: 'absolute', left: 170, top: 900, width: 740, height: 280, borderRadius: 22, background: 'rgba(255,255,255,0.58)', backdropFilter: 'blur(24px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.2)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 30px 70px rgba(90,40,10,0.18)', fontFamily: FONT, color: INK,
            opacity: cardIn, transform: `translateY(${f2((1 - cardIn) * 120)}px)`, filter: cardIn < 0.97 ? `blur(${f2((1 - cardIn) * 14)}px)` : undefined}}>
            <div style={{position: 'absolute', left: 40, top: 22, fontSize: 30, fontWeight: 700, letterSpacing: 0.5}}>FICHE DE RÉSULTAT</div>
            <div style={{position: 'absolute', left: 40, top: 60, fontSize: 24, color: '#3E3536'}}>Relevé à J30</div>
            <div style={{position: 'absolute', left: 40, right: 40, top: 100, height: 2, background: INK}} />
            {[{l: 'USAGE', ts: row1}, {l: 'TEMPS GAGNÉ', ts: row2}].map((rw, k) => (
              <div key={k} style={{position: 'absolute', left: 40, right: 40, top: 122 + k * 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{fontSize: 26, fontWeight: 700, letterSpacing: 0.4}}>{rw.l}</div>
                <div style={{display: 'flex', gap: 12}}>
                  {rw.ts.map((st, q) => {
                    const s = sp(t, st, {damping: 12, stiffness: 200});
                    return <div key={q} style={{width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(201,138,46,0.45)', boxSizing: 'border-box', position: 'relative'}}>
                      <div style={{position: 'absolute', inset: -3, borderRadius: '50%', background: OCRE, transform: `scale(${Math.min(1.15, s).toFixed(4)})`, opacity: t >= st ? 1 : 0}} />
                    </div>;
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{position: 'absolute', left: 600, top: 868, padding: '6px 18px', border: `6px solid ${BORDEAUX}`, borderRadius: 12, color: BORDEAUX, background: 'rgba(255,255,255,0.94)',
            fontFamily: FONT, fontWeight: 700, fontSize: 34, whiteSpace: 'nowrap', boxShadow: '0 12px 30px rgba(42,12,18,0.25)',
            opacity: prog(t, stamp, 0.08), transform: `rotate(-8deg) scale(${(1.9 - 0.9 * Math.min(1, stS)).toFixed(4)})`}}>Vérifié à J30</div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
// Réfraction cannelée : la forêt passe derrière des côtes de verre droites puis blanchit (réf. 33,9 à 34,05 s)
export const RibGlass: React.FC<{t: number}> = ({t}) => {
  const t0 = TL3.ctaGlass;
  if (t < t0 || t > t0 + 0.42) return null;
  const p = prog(t, t0, 0.12, E_INOUT) * (1 - prog(t, t0 + 0.3, 0.12));
  return (
    <AbsoluteFill style={{opacity: p, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0) 48px, rgba(255,255,255,0.25) 86px, rgba(255,255,255,0.7) 96px)'}}>
      <AbsoluteFill style={{background: '#FFFFFF', opacity: 0.85 * prog(t, t0 + 0.08, 0.22, E_IN)}} />
    </AbsoluteFill>
  );
};

// ---------- Scène 8 : étiquettes en chaîne + phrase d'appel, puis carton final (réf. 34,05 à 39,85 s)
const CHAIN = [{l: 'Abonnements', row: 0}, {l: 'Journée chez vous', row: 0}, {l: 'Vérifié à J30', row: 1}, {l: 'Audit gratuit', row: 1}];
export const S8Cta: React.FC<{t: number; ready: boolean}> = ({t, ready}) => {
  if (t < ws(67) - 0.1) return null;
  const endT = TL3.end;
  const ctaOut = prog(t, endT, 0.18, E_IN);
  const markIn = prog(t, endT + 0.03, 0.17, E_OUT);
  const markDrift = prog(t, endT + 0.2, 0.45, E_INOUT);
  const btnP = prog(t, endT + 0.22, 0.38, Easing.bezier(0.16, 1, 0.3, 1));
  const push = 1 + 0.06 * prog(t, endT + 0.9, DURATION - endT - 0.9, (x: number) => x);
  const url = 'antoinecontino.fr';
  const urlT0 = endT + 0.85;
  // composition du logo : marque + nom serrés, centrés
  const MS = 110, GAP = 18, TW = 452;
  const lockL = 540 - (MS + GAP + TW) / 2;
  return (
    <AbsoluteFill>
      {t < endT + 0.2 && (
        <AbsoluteFill style={{opacity: 1 - ctaOut, filter: ctaOut > 0.01 ? `blur(${f2(14 * ctaOut)}px)` : undefined, transform: `scale(${(1 - 0.03 * ctaOut).toFixed(4)})`}}>
          {[0, 1].map((row) => (
            <div key={row} style={{position: 'absolute', left: 0, right: 0, top: 590 + row * 80, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, fontFamily: FONT}}>
              {CHAIN.map((c, k) => {
                if (c.row !== row) return null;
                const tk = ws(67 + k) - 0.05;
                const p = prog(t, tk, 0.3, E_OUT);
                const arrowAfter = k < CHAIN.length - 1 && CHAIN[k + 1].row === row || (k === 1);
                const pa = k < CHAIN.length - 1 ? prog(t, ws(68 + k) - 0.13, 0.12, E_OUT) : 0;
                return (
                  <React.Fragment key={k}>
                    <div style={{padding: '12px 20px', borderRadius: 12, background: OCRE, color: WHITE, fontSize: 30, fontWeight: 700, whiteSpace: 'nowrap', opacity: p,
                      transform: `translate(${f2((1 - p) * 30)}px, ${f2((1 - p) * 16)}px)`, filter: p < 0.97 ? `blur(${f2((1 - p) * 6)}px)` : undefined, boxShadow: '0 8px 18px rgba(201,138,46,0.3)'}}>{c.l}</div>
                    {arrowAfter && <span style={{fontSize: 30, fontWeight: 700, color: INK, opacity: pa, transform: `translateX(${f2((1 - pa) * -12)}px)`}}>→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          ))}
          <FlyTitle t={t} ready={ready} size={62} y={880} weight={700} gather lines={[
            [{i: 67, from: [-20, 34]}, {i: 68, from: [16, -34]}, {i: 69, color: BORDEAUX, from: [20, 34]}, {i: 70, color: BORDEAUX, from: [16, -34]}],
            [{i: 71, from: [-16, 34]}, {i: 72, from: [16, -34]}, {i: 73, from: [20, 34]}],
          ]} />
        </AbsoluteFill>
      )}
      {t >= endT && (
        <AbsoluteFill style={{transform: `scale(${push.toFixed(4)})`, transformOrigin: '540px 860px'}}>
          <div style={{position: 'absolute', left: lockL - 30 * markDrift + 30, top: 650, opacity: prog(t, endT + 0.03, 0.08),
            transform: `scale(${(0.6 + 0.4 * markIn).toFixed(4)})`, filter: markIn < 0.98 ? `blur(${f2(16 * (1 - markIn))}px)` : undefined}}><Mark size={MS} t={t} /></div>
          {['L’Accélérateur', 'IA 30 jours'].map((w, k) => {
            const p = prog(t, endT + 0.2 + k * 0.08, 0.3, E_OUT);
            return <div key={k} style={{position: 'absolute', top: 646 + k * 66, left: lockL + MS + GAP + 40 * (1 - p), fontFamily: FONT, fontSize: 62, fontWeight: 700, color: INK, lineHeight: 1,
              opacity: prog(t, endT + 0.2 + k * 0.08, 0.12), filter: p < 0.97 ? `blur(${f2((1 - p) * 10)}px)` : undefined, whiteSpace: 'nowrap'}}>{w}</div>;
          })}
          <div style={{position: 'absolute', left: 210, top: 880, width: 660, height: 118, opacity: prog(t, endT + 0.22, 0.08),
            transform: `translate(${f2(160 * (1 - btnP))}px, ${f2(700 * (1 - btnP))}px) rotate(${f2(-14 * (1 - btnP))}deg)`, filter: btnP < 0.95 ? `blur(${f2((1 - btnP) * 12)}px)` : undefined}}>
            <div style={{position: 'absolute', inset: 0, background: OCRE, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontFamily: FONT,
              fontSize: 46, fontWeight: 700, boxShadow: '0 22px 50px rgba(110,30,43,0.22)'}}>Audit gratuit · 30 min</div>
          </div>
          <div style={{position: 'absolute', left: 110, width: 860, top: 1040, textAlign: 'center', fontFamily: FONT, fontSize: 44, fontWeight: 700, color: INK, whiteSpace: 'nowrap'}}>
            {url.split('').map((ch, k) => {
              const p = prog(t, urlT0 + k * 0.025, 0.1);
              return <span key={k} style={{opacity: p, filter: p < 0.97 ? `blur(${f2(6 * (1 - p))}px)` : undefined}}>{ch}</span>;
            })}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
