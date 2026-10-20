import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {BORDEAUX, clampOpt, DURATION, E_INOUT, E_OUT, FPS, P, prog, useFonts, VOICE_END, ws, we} from './lib';
import {FlutedBg} from './Backgrounds';
import {Caption} from './Text';
import {camScale, cardTimes, landAt, S1Title, S2Accounts, S3Chats, TL} from './Scenes1';
import {bleachAt, BleachStreaks, DiskLayer, GlassPanel, GlassSlab, KeptWindow, Landscape, S4Title, tintAt, TL2} from './Scenes2';
import {badgeTimes, RibGlass, S6Arc, S6Card, S7Forest, S8Cta, TL3} from './Scenes3';
import audioCfg from './audio.json';

// Position du motif cannelé : continue d'un plan à l'autre tant qu'il n'y a pas de coupe sèche
const phaseAt = (t: number) => {
  const p2 = P(2);
  if (t < p2) return 35 * t;
  return 35 * p2 + 60 * (t - p2);
};
const Backgrounds: React.FC<{t: number}> = ({t}) => {
  const p2 = P(2);
  // 0 à 3,3 s : arcs qui arrivent du blanc en dézoomant, puis se redressent en cannelures (réf. 0 à 2,47 s)
  if (t < TL.cut3) {
    const z = prog(t, 0, 0.8, E_OUT);
    const un = prog(t, TL.unbend, p2 - TL.unbend, E_INOUT);
    const tight = prog(t, TL.rise, TL.whip - TL.rise, E_INOUT);
    const drift = prog(t, 0.8, TL.unbend - 0.8, (x: number) => x);      // les arcs se resserrent en continu
    const heat = prog(t, TL.rise + 0.05, 0.55, E_OUT);                   // le foyer chauffe quand les cartes arrivent
    const period = (640 - 300 * z - 130 * drift) * (1 - un) + 130 * un - 25 * tight;
    const L = (a: number, b: number) => a + (b - a) * un;
    const gs = 0.5 + 0.5 * z;                                           // le halo s'ouvre depuis le centre
    const glow = {cx: L(650, 560), cy: L(920, 880) + 140 * heat, rx: (L(600, 560) + 320 * heat) * gs, ry: (L(900, 800) + 520 * heat) * gs};
    const tint: [number, number, number] = [Math.round(L(228, 220)), Math.round(L(160, 128)), Math.round(L(128, 90))];
    const refract = prog(t, p2, 0.25, E_INOUT);                          // une fois droites, les cannelures réfractent le halo chacune à sa hauteur
    return <FlutedBg t={t} curv={1 - un} period={period} phase={phaseAt(t)} intensity={z * (1 + 0.15 * un) * (1 + 0.4 * heat)} glow={glow} tint={tint}
      rScale={1 + 2 * (1 - z)} refract={refract} colRy={780 + 450 * heat} />;
  }
  // fenêtres : cannelures fines et pâles qui glissent à droite, puis se courbent en arcs blancs avant le disque (réf. 4,8 à 9,07 s)
  if (t < TL2.diskEnd) {
    const bend = prog(t, TL.disk - 0.32, 0.32, E_INOUT);
    const ph = -20 * (t - TL.cut3);
    const cs = camScale(t);                                         // les cannelures suivent la caméra (entrée, zoom sec, recul)
    if (bend <= 0) return <FlutedBg t={t} curv={0} period={72 * cs} phase={ph * cs} intensity={0.5} mask="chat" />;
    return <FlutedBg t={t} curv={1.5 * bend} period={(72 + 88 * bend) * cs} phase={ph * cs} intensity={0.45 + 0.3 * bend} mask="soft" />;
  }
  // paysage (teinte forte puis légère), blanchi à la fin du planning
  if (t < TL2.cut5) return <Landscape t={t} tint={tintAt(t)} bleach={bleachAt(t)} />;
  // arc, carte, barre : blanc avec cannelures droites très légères et halo ocre derrière l'arc
  if (t < TL3.ctaGlass) {
    const glow = 1 - prog(t, TL3.card, 0.3);
    const cardHeat = prog(t, TL3.card, 0.3);                          // cannelures plus présentes derrière la carte et la barre
    return (
      <AbsoluteFill>
        <FlutedBg t={t} curv={0} period={90} phase={-12 * t} intensity={0.3 + 0.35 * cardHeat} mask="flutes" tint={cardHeat > 0 ? [226, 170, 140] : undefined} />
        {cardHeat > 0 && <AbsoluteFill style={{opacity: cardHeat, background: 'linear-gradient(180deg, transparent 760px, rgba(255,255,255,0.85) 840px, rgba(255,255,255,0.85) 960px, transparent 1040px)'}} />}
        <AbsoluteFill style={{opacity: glow, background: 'radial-gradient(circle at 540px 1150px, rgba(201,138,46,0.16) 0px, rgba(201,138,46,0.08) 300px, rgba(201,138,46,0) 560px)'}} />
      </AbsoluteFill>
    );
  }
  // appel à l'action : arcs de verre dans la gamme ocre autour d'un foyer, puis lavis blanc sous le carton final (réf. 34,05 à 39,85 s)
  const ramp = prog(t, TL3.ctaGlass + 0.28, 0.8, E_OUT);
  const wash = prog(t, TL3.end + 0.45, 0.6, E_INOUT);
  const g = {cx: 600, cy: 900, rx: 560 + 240 * ramp, ry: 980 + 240 * ramp};
  return (
    <AbsoluteFill style={{opacity: prog(t, TL3.ctaGlass, 0.33, E_INOUT)}}>
      <FlutedBg t={t} curv={1} period={84} phase={16 * t} intensity={(0.35 + 0.65 * ramp) * (1 - 0.8 * wash)} glow={g} tint={[214, 128, 52]} />
      <div style={{position: 'absolute', left: g.cx - g.rx, top: g.cy - g.ry, width: 2 * g.rx, height: 2 * g.ry, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(201,138,46,0.5) 0%, rgba(214,150,90,0.3) 45%, rgba(240,210,180,0) 72%)', filter: 'blur(40px)', opacity: (0.5 + 0.5 * ramp) * (1 - wash)}} />
      {wash > 0 && <AbsoluteFill style={{opacity: 0.9 * wash, background: 'radial-gradient(ellipse 460px 260px at 540px 1000px, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 55%, #FFFFFF 100%)'}} />}
    </AbsoluteFill>
  );
};

type Cue = {src: string; at: number; vol: number};
// Habillage sonore calqué sur la référence : plucks graves sur les mots qui apparaissent, souffles aigus courts
// sur les transitions seulement (rien de grave posé sur la voix), clics d'interface, impact grave sur le disque.
export const cues = (): Cue[] => {
  const c: Cue[] = [];
  const add = (src: string, at: number, vol: number) => c.push({src, at: Math.max(0, at), vol});
  // ouverture
  add('sfx/pluck.wav', ws(0) - 0.08, 0.12);
  [2, 4, 5].forEach((i) => add('sfx/pluck.wav', ws(i) - 0.02, 0.15));
  add('sfx/pluck.wav', P(2) - 0.12, 0.2);
  [9, 10, 11].forEach((i) => add('sfx/pluck.wav', ws(i) - 0.02, 0.2));
  add('sfx/thump.wav', P(2) - 0.2, 0.3);
  cardTimes().forEach((x) => add('sfx/click.wav', x + 0.34, 0.18));
  // fouetté et coupe (la musique s'arrête 5,23 à 5,53)
  add('sfx/swish.wav', TL.whip - 0.12, 0.08);
  // fenêtres : clic net à chaque avatar, frappe discrète, clics sur le zoom sec et le recul
  [0, 1, 2, 3, 4].forEach((k) => { add('sfx/click.wav', landAt(k), 0.22); add('sfx/pluck.wav', landAt(k), 0.1); });
  [0, 1, 2, 3, 4].forEach((k) => add('sfx/typing.wav', landAt(k) + 0.15, 0.1));
  add('sfx/click.wav', TL.punch, 0.25);
  add('sfx/click.wav', TL.pull, 0.2);
  add('sfx/swish.wav', TL.pull + 0.33, 0.15);
  // disque : silence de la musique 8,43 à 8,77, puis impact grave qui descend et scintillement (réf. 8,88)
  add('sfx/subdrop.wav', TL.disk - 0.03, 0.45);
  add('sfx/shimmer.wav', TL.disk - 0.01, 0.12);
  add('sfx/shimmer.wav', TL2.stroke - 0.02, 0.07);
  // planning
  [ws(36), ws(41), ws(42) + 0.1, ws(42) + 0.45].forEach((x) => add('sfx/pluck.wav', x, 0.14));
  [0, 1, 2, 3, 4].forEach((q) => add('sfx/pluck.wav', ws(43) + q * 0.09, 0.1));
  add('sfx/thump.wav', P(5) - 0.6, 0.22);
  add('sfx/swish.wav', TL2.exit - 0.05, 0.18);
  // arc : coups graves à chaque participant, fouetté, compteur
  badgeTimes().forEach((x) => add('sfx/thump.wav', x, 0.35));
  add('sfx/shimmer.wav', ws(55) - 0.05, 0.08);
  add('sfx/swish.wav', TL3.burst - 0.06, 0.16);
  // carte, barre, survol
  add('sfx/shimmer.wav', TL3.card, 0.1);
  add('sfx/swish.wav', TL3.morph - 0.3, 0.12);
  add('sfx/click.wav', TL3.morph + 0.52, 0.25);
  add('sfx/click.wav', TL3.close, 0.3);
  // encre (la musique reprend à 20,5) et forêt
  add('sfx/swish.wav', TL3.flood - 0.05, 0.18);
  add('sfx/subdrop.wav', TL3.flood + 0.14, 0.28);
  add('sfx/ding.wav', TL3.forest + 0.1, 0.04);
  [0, 1, 2, 3, 4].forEach((k) => add('sfx/thump.wav', TL3.forest + 0.12 + 0.18 * k, 0.1));
  [0, 1, 2, 3, 4].forEach((q) => add('sfx/pluck.wav', ws(59) + 0.45 + q * 0.12, 0.06));
  add('sfx/stamp.wav', we(60) + 0.02, 0.38);
  // appel à l'action et carton final
  add('sfx/shimmer.wav', TL3.ctaGlass, 0.1);
  [0, 1, 2, 3].forEach((k) => add('sfx/pluck.wav', ws(67 + k) - 0.05, 0.14));
  add('sfx/swish.wav', TL3.end + 0.25, 0.18);
  add('sfx/click.wav', TL3.end + 0.6, 0.15);
  return c;
};

const musicVol = (f: number) => {
  const t = f / FPS;
  const fadeOut = interpolate(t, [DURATION - 1.6, DURATION - 0.2], [1, 0], clampOpt);
  // +3 dB dans trois respirations de la voix (rampes de 0,15 s)
  const bump = [[15.3, 15.7], [18.55, 19.45], [23.5, 23.9]].reduce((acc, [a, b]) => Math.max(acc, interpolate(t, [a, a + 0.15, b - 0.15, b], [0, 1, 1, 0], clampOpt)), 0);
  return audioCfg.musicUnder * fadeOut * (1 + 0.41 * bump);
};

export const Pub3: React.FC = () => {
  const ready = useFonts();
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#FFFFFF'}}>
      <Backgrounds t={t} />
      <S1Title t={t} ready={ready} />
      <S2Accounts t={t} ready={ready} />
      <S3Chats t={t} />
      <DiskLayer t={t} />
      <GlassSlab t={t} />
      <KeptWindow t={t} />
      <GlassPanel t={t} />
      <S4Title t={t} ready={ready} />
      <BleachStreaks t={t} />
      <S6Arc t={t} />
      <S6Card t={t} />
      <S7Forest t={t} />
      <RibGlass t={t} />
      <S8Cta t={t} ready={ready} />
      {ready && <>
        <Caption t={t} y={300} dark start={TL.cut3} until={P(4) - 0.1} chunks={[{from: 16, to: 21, kw: []}, {from: 22, to: 25, kw: []}, {from: 26, to: 29, kw: [28, 29]}]} />
        <Caption t={t} y={300} dark until={TL2.exit + 0.3} chunks={[{from: 34, to: 38, kw: [36]}, {from: 39, to: 42, kw: [41, 42]}, {from: 43, to: 46, kw: [43, 44]}]} />
        <Caption t={t} y={300} dark until={TL3.burst} chunks={[{from: 47, to: 50, kw: []}, {from: 51, to: 55, kw: [52, 53]}]} />
        <Caption t={t} y={300} dark until={P(7) - 0.45} chunks={[{from: 56, to: 57, kw: [57]}, {from: 58, to: 60, kw: [59, 60], kwColor: BORDEAUX}, {from: 61, to: 66, kw: [65, 66]}]} />
      </>}
      <Audio src={staticFile('voix.wav')} />
      {audioCfg.music && <Audio src={staticFile(audioCfg.music)} volume={musicVol} />}
      {audioCfg.sfx && cues().map((c, k) => (
        <Sequence key={k} from={Math.round(c.at * FPS)} durationInFrames={Math.round(2.2 * FPS)}>
          <Audio src={staticFile(c.src)} volume={c.vol * audioCfg.sfxGain} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
