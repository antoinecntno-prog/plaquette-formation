import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Avatar, backOut, Cursor, DirBlur, dirF, E_IN, E_INOUT, E_OUT, expoOut, f2, FONT, GREY, INK, OCRE, P, prog, safeMask, ws, we, WHITE} from './lib';
import {E_WORD, FlyTitle, OCRE_TXT} from './Text';

// ---------- Repères communs (calés sur les phrases de la voix, comme les changements de plan de la référence)
export const TL = {
  unbend: P(2) - 0.28,          // les arcs se redressent en cannelures (réf. 2,2 à 2,47 s)
  rise: ws(14) + 0.05,          // le titre 2 monte (réf. 3,1 s)
  whip: P(3) - 0.3,             // fouetté vers le bas sur 8 images (réf. 4,53 à 4,8 s)
  cut3: P(3) - 0.05,            // coupe sèche vers les fenêtres (réf. 4,8 s)
  punch: ws(25) + 0.3,          // zoom sec (réf. 7,32 s)
  pull: ws(29) - 0.02,          // recul sec puis retour (réf. 8,45 s)
  disk: P(4) - 0.62,            // disque ocre (réf. 9,07 s)
};

// ---------- Scène 1 : « Vous avez payé des abonnements IA pour vos équipes. » (réf. 0 à 2,47 s)
// Mots qui arrivent à leur place, en alternant dessous / dessus ; le groupe dézoome lentement, puis rétrécit et se dissout.
export const S1Title: React.FC<{t: number; ready: boolean}> = ({t, ready}) => {
  const end = P(2) - 0.03;
  if (t > end) return null;
  const slow = prog(t, ws(1), Math.max(0.5, end - 0.27 - ws(1)), (x: number) => x);
  const fast = prog(t, end - 0.27, 0.27, E_IN);
  const sc = 1 - 0.12 * slow - 0.25 * fast;
  const D = 104;
  return (
    <AbsoluteFill style={{opacity: 1 - fast, filter: fast > 0.01 ? `blur(${f2(12 * fast)}px)` : undefined}}>
      <FlyTitle t={t} ready={ready} size={80} y={880} scale={sc} dur={0.34} ease={Easing.out(Easing.cubic)} lines={[
        [{i: 0, from: [-10, D]}, {i: 1, from: [10, -D]}, {i: 2, from: [-10, D]}, {i: 3, from: [10, -D]}],
        [{i: 4, from: [0, D]}, {i: 5, from: [90, 0]}, {i: 5, mark: true, from: [0, D]}],
        [{i: 6, from: [0, D]}, {i: 7, from: [90, 0]}, {i: 8, from: [0, D]}],
      ]} />
    </AbsoluteFill>
  );
};

export const cardTimes = () => [0, 1, 2].map((k) => TL.rise + 0.1 + k * 0.09);
// ---------- Scène 2 : « Ouvrir les comptes a pris dix minutes. » + trois cartes de comptes (réf. 2,5 à 4,8 s)
const TEAMS = ['Marketing', 'Ventes', 'Direction'];
const CHECKS = ['Accès créé', 'Identifiants envoyés', 'Réglages par défaut', 'Usage à définir', 'Suivi à prévoir'];
const CARD = {w: 236, h: 600, top: 540, xs: [162, 424, 686]};
const CardAccount: React.FC<{t: number; k: number; tIn: number; tOpen: number}> = ({t, k, tIn, tOpen}) => {
  if (t < tIn) return null;
  const p = prog(t, tIn, 0.34, E_WORD);
  const v = 1 - p;
  const dy = (1940 - CARD.top) * v;
  const o = prog(t, tOpen, 0.2, E_INOUT);
  const press = tOpen <= t && t < tOpen + 0.16 ? 1 - 0.05 * Math.sin(((t - tOpen) / 0.16) * Math.PI) : 1;
  const id = `cardblur${k}`;
  return (
    <div style={{position: 'absolute', left: CARD.xs[k], top: CARD.top, width: CARD.w, height: CARD.h, transform: `translateY(${f2(dy)}px)`, filter: dirF(id, 0, 26 * v * v)}}>
      <DirBlur id={id} x={0} y={26 * v * v} />
      <div style={{position: 'absolute', inset: 0, background: WHITE, borderRadius: 16, boxShadow: '0 22px 50px rgba(150,80,40,0.16), 0 2px 6px rgba(42,12,18,0.06)', fontFamily: FONT, color: INK}}>
        <Avatar size={52} i={k + 1} style={{position: 'absolute', left: 22, top: 24}} />
        <div style={{position: 'absolute', left: 20, top: 96, fontSize: 32, fontWeight: 700, letterSpacing: -0.3}}>{TEAMS[k]}</div>
        <div style={{position: 'absolute', left: 20, top: 140, fontSize: 19, color: GREY}}>Abonnement IA</div>
        <div style={{position: 'absolute', left: 20, top: 166, fontSize: 19, color: GREY}}>Compte individuel</div>
        <div style={{position: 'absolute', left: 18, right: 18, top: 214, height: 52, borderRadius: 10, overflow: 'hidden', transform: `scale(${press.toFixed(4)})`}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 104, transform: `translateY(${f2(-52 * o)}px)`}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 52, background: INK, color: WHITE, fontSize: 19, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Ouvrir le compte</div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 52, height: 52, background: OCRE, color: WHITE, fontSize: 19, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6}}>
              <svg width="18" height="18" viewBox="0 0 20 20"><path d="M4.5 10.5l3.5 3.5 7.5-8" stroke={WHITE} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Compte ouvert
            </div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 20, right: 20, top: 296, fontSize: 15, fontWeight: 700, color: INK, letterSpacing: 0.3}}>CE QUI EST FAIT</div>
        {CHECKS.map((c, r) => (
          <div key={r} style={{position: 'absolute', left: 20, right: 12, top: 330 + r * 44, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#3C3435', whiteSpace: 'nowrap'}}>
            <svg width="16" height="16" viewBox="0 0 20 20" style={{flex: 'none'}}><path d="M4 10.5l3.6 3.6 8-8.2" stroke={r < 3 ? OCRE : '#C9C1C2'} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {c}
          </div>
        ))}
        <div style={{position: 'absolute', left: 20, right: 20, bottom: 28, height: 9, borderRadius: 4, background: '#EFEAEA'}} />
        <div style={{position: 'absolute', left: 20, width: '55%', bottom: 48, height: 9, borderRadius: 4, background: '#EFEAEA'}} />
      </div>
    </div>
  );
};
export const S2Accounts: React.FC<{t: number; ready: boolean}> = ({t, ready}) => {
  const p2 = P(2);
  if (t < p2 - 0.1 || t >= TL.cut3) return null;          // coupe sèche : rien après TL.cut3
  const up = prog(t, TL.rise, 0.32, E_INOUT);
  const vel = Math.max(0, 1 - Math.abs(t - (TL.rise + 0.16)) / 0.16);
  const cardsIn = cardTimes();
  const pushStart = cardsIn[0] + 0.24;
  const push = prog(t, pushStart, TL.whip + 0.06 - pushStart, (x: number) => Math.pow(x, 1.6));
  const w = prog(t, TL.whip, TL.cut3 - TL.whip, (x: number) => Math.pow(x, 2.2));
  const sc = 1 + 0.08 * push;
  const wb = w > 0 ? 1 + 44 * w * w : 0;
  const titleY = 880 - 470 * up;                                  // centre du titre : 880 puis 410
  return (
    <AbsoluteFill style={{transform: `translateY(${f2(460 * w)}px) scale(${(1 + 0.02 * w).toFixed(4)})`, transformOrigin: '540px 860px', filter: dirF('whip2', 1.5 * w, wb)}}>
      {w > 0 && <DirBlur id="whip2" x={1.5 * w} y={wb} />}
      <AbsoluteFill style={{transform: `translateY(${f2(titleY - 880)}px) scale(${sc.toFixed(4)})`, transformOrigin: '540px 880px', filter: dirF('rise2', 0, vel * 6)}}>
        <DirBlur id="rise2" x={0} y={vel * 6} />
        <FlyTitle t={t} ready={ready} size={80} y={880} dur={0.24} ease={Easing.out(Easing.cubic)} halo lines={[
          [{i: 9, from: [70, 0]}, {i: 10, from: [70, 0]}, {i: 11, from: [70, 0]}],
          [{i: 12, from: [70, 0]}, {i: 13, from: [70, 0]}, {i: 14, color: OCRE_TXT, from: [70, 0], glow: true}, {i: 15, color: OCRE_TXT, from: [70, 0]}],
        ]} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${sc.toFixed(4)})`, transformOrigin: '540px 840px'}}>
        {[0, 1, 2].map((k) => <CardAccount key={k} t={t} k={k} tIn={cardsIn[k]} tOpen={cardsIn[k] + 0.34} />)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Scène 3 : fenêtres de chat (réf. 4,8 à 9,07 s)
const PROMPTS = [
  'Résume les budgets de l’année.',
  'Rédige le plan du salon.',
  'Trouve les écarts sur les ventes.',
  'Écris un mail au fournisseur.',
  'Classe les devis reçus.',
];
const WW = 640, WH = 128;
// positions au repos ; split : sens du départ latéral (0 = la fenêtre reste). Bords gauche ≥ 170 et droit ≤ 910 : tout reste dans la zone utile au travelling.
export const WINS = [
  {x: 250, y: 510, split: -1}, {x: 170, y: 636, split: 1}, {x: 230, y: 762, split: 0},
  {x: 270, y: 888, split: 1}, {x: 190, y: 1014, split: -1},
];
// zoom sec : nouveau plan sur les fenêtres 2 et 3 seulement, plus étroites et alignées (la coupe sèche cache le changement)
const PUNCH = {x: 310, w: 460, s: 1.7, oy: 953};
// avatars : posés sur les bords des fenêtres (jamais sur le texte), direction d'arrivée ; pax/pay = position dans le plan serré
const AVS = [
  {k: 0, ax: 584, ay: -50, dir: [1, -0.6]}, {k: 1, ax: 650, ay: 30, dir: [1, 0]},
  {k: 2, ax: -70, ay: 20, dir: [-1, 0.2], pax: 360, pay: -80}, {k: 3, ax: -80, ay: 20, dir: [-1, 0], pax: 360, pay: 112}, {k: 4, ax: 650, ay: 20, dir: [0.6, 1]},
];
export const landAt = (k: number) => TL.cut3 + 0.32 + 0.25 * k;
export const camScale = (t: number) => (t >= TL.cut3 && t < TL.disk ? Math.min(2, camAt(t).s) : 1);
const inPunch = (t: number) => t >= TL.punch && t < TL.pull;
// caméra : entrée de très près, travelling avant, zoom sec, recul sec puis retour (réf. 4,8 à 8,75 s)
const camAt = (t: number) => {
  const zin = prog(t, TL.cut3, 0.32, Easing.out(Easing.cubic));
  if (t < TL.punch) {
    const push = prog(t, TL.cut3 + 0.32, TL.punch - TL.cut3 - 0.32, Easing.inOut(Easing.sin));
    return {s: (1 + 1.6 * (1 - zin)) * (1 + 0.08 * push), ox: 540, oy: 800, dx: 0, dy: 0, zin};
  }
  if (t < TL.pull) {
    const h = prog(t, TL.punch, TL.pull - TL.punch, (x: number) => x);
    return {s: PUNCH.s * (1 + 0.03 * h), ox: 540, oy: PUNCH.oy, dx: 0, dy: -20 * h, zin: 1};
  }
  const b = prog(t, TL.pull, 8 / 30, Easing.out(Easing.cubic));
  return {s: 1.25 - 0.25 * b, ox: 540, oy: PUNCH.oy + (800 - PUNCH.oy) * b, dx: 0, dy: 0, zin: 1};
};
const Win: React.FC<{t: number; k: number; typeAt: number; stagger: number; splitP: number; keep?: boolean}> = ({t, k, typeAt, stagger, splitP, keep}) => {
  const w = WINS[k];
  const punch = inPunch(t);
  if (punch && k !== 2 && k !== 3) return null;
  const typed = Math.max(0, Math.floor((t - typeAt) * 34));
  const txt = PROMPTS[k].slice(0, typed);
  const caret = t > typeAt && typed < PROMPTS[k].length + 4 && Math.floor(t * 4) % 2 === 0;
  const st = 1 - prog(t, TL.cut3 + stagger, 0.3, Easing.out(Easing.cubic));   // décalage d'entrée de chaque fenêtre
  const sx = (k % 2 ? 220 : -220) * st + w.split * 1000 * splitP;
  const sy = -60 * st;
  const id = `winblur${k}`;
  const bx = 45 * Math.min(1, splitP * 4) * (w.split ? 1 : 0);
  return (
    <div style={{position: 'absolute', left: punch ? PUNCH.x : w.x, top: w.y, width: punch ? PUNCH.w : WW, height: WH, transform: `translate(${f2(sx)}px, ${f2(sy)}px)`,
      filter: dirF(id, bx, 0)}}>
      <DirBlur id={id} x={bx} y={0} />
      <WinBody txt={txt} caret={caret} />
    </div>
  );
};
export const WinBody: React.FC<{txt: string; caret?: boolean}> = ({txt, caret}) => (
  <div style={{position: 'absolute', inset: 0, background: WHITE, borderRadius: 18, boxShadow: '0 12px 40px rgba(201,138,46,0.22), 0 1px 3px rgba(42,12,18,0.06)', border: '1px solid rgba(110,30,43,0.08)', fontFamily: FONT}}>
    <div style={{position: 'absolute', left: 26, top: 18, right: 26, fontSize: 24, color: '#5E5859', whiteSpace: 'nowrap', overflow: 'hidden'}}>{txt}{caret ? <span style={{color: OCRE}}>|</span> : null}</div>
    <div style={{position: 'absolute', left: 20, bottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, color: INK}}>
      <span style={{fontSize: 26, lineHeight: '18px'}}>+</span>
      <span style={{padding: '5px 12px', borderRadius: 8, background: '#F2EEEE', fontWeight: 700}}>Chat</span>
      <span style={{color: GREY}}>Dossier</span>
    </div>
    <div style={{position: 'absolute', right: 22, bottom: 18, display: 'flex', alignItems: 'center', gap: 14, fontSize: 20, color: INK}}>
      <span>Modèle <span style={{color: GREY}}>standard</span></span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
      <svg width="22" height="18" viewBox="0 0 26 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round"><path d="M3 10v4M8 6v12M13 3v18M18 7v10M23 10v4" /></svg>
    </div>
  </div>
);
const FlyAvatar: React.FC<{t: number; a: typeof AVS[number]}> = ({t, a}) => {
  const w = WINS[a.k];
  const tl = landAt(a.k), dur = 7 / 30, t0 = tl - dur;
  if (t < t0) return null;
  const punch = inPunch(t);
  if (punch && a.pax === undefined) return null;
  const ax = punch ? a.pax! : a.ax, ay = punch ? a.pay! : a.ay, wx = punch ? PUNCH.x : w.x;
  const p = prog(t, t0, dur, backOut(1.2));
  const v = 1 - Math.min(1, p);
  const lin = 1 - prog(t, t0, dur, (x: number) => x);
  const D = 330;
  const off = prog(t, TL.pull + 0.3, 6 / 30, (x: number) => x * x * x);           // départ hors champ (réf. 8,8 s)
  const dx = a.dir[0] * D * v + a.dir[0] * 400 * off, dy = a.dir[1] * D * v + a.dir[1] * 400 * off;
  const hover = Math.sin((t - tl) * 1.6 + a.k) * 4;
  const bl = 25 * lin * lin + 25 * off;
  const id = `avblur${a.k}`;
  const lag = prog(t, t0 + 2 / 30, dur, backOut(1.2));                             // le curseur suit avec 2 images de retard
  const cl = (1 - Math.min(1, lag)) * D * 0.35;
  const right = ax > 300;
  const down = ay < 0;
  return (
    <div style={{position: 'absolute', left: wx + ax + dx, top: w.y + ay + dy + hover, opacity: 1 - off, transform: `scale(${(0.85 + 0.15 * Math.min(1, p)).toFixed(4)})`,
      filter: dirF(id, Math.abs(a.dir[0]) * bl, Math.abs(a.dir[1]) * bl)}}>
      <DirBlur id={id} x={Math.abs(a.dir[0]) * bl} y={Math.abs(a.dir[1]) * bl} />
      <Avatar size={92} i={a.k} />
      <Cursor size={40} flip={!right} style={{position: 'absolute', left: (right ? -30 : 78) + a.dir[0] * cl, top: (down ? 76 : -28) + a.dir[1] * cl,
        transform: right ? (down ? 'rotate(-14deg)' : 'rotate(-78deg)') : (down ? 'scaleX(-1) rotate(-14deg)' : 'scaleX(-1) rotate(-78deg)')}} />
    </div>
  );
};
export const S3Chats: React.FC<{t: number}> = ({t}) => {
  if (t < TL.cut3 || t > TL.disk + 0.1) return null;
  const c = camAt(t);
  const splitP = prog(t, TL.pull + 0.3 + 2 / 30, 9 / 30, Easing.in(Easing.quad));
  const streak = 1 - prog(t, TL.cut3, 0.3, E_WORD);
  // le masque de zone utile s'ouvre pendant les mouvements (entrée floue, recul, écartement) et se referme sur un cadre déjà rentré dans la zone
  const mkIn = prog(t, TL.cut3, 0.3, (x: number) => x);
  const mkPull = t >= TL.pull ? prog(t, TL.pull + 5 / 30, 4 / 30, (x: number) => x) : 1;
  const mkSplit = 1 - prog(t, TL.pull + 0.3, 2 / 30, (x: number) => x);
  const mk = Math.min(mkIn, mkPull, mkSplit);
  return (
    <AbsoluteFill style={{...safeMask(420 * mk, 1920 - 662 * mk, 100 * mk, 1080 - 100 * mk), filter: dirF('s3streak', 36 * streak, 6 * streak)}}>
      <DirBlur id="s3streak" x={36 * streak} y={6 * streak} />
      <AbsoluteFill style={{transform: `translate(${f2(c.dx)}px, ${f2(c.dy)}px) scale(${c.s.toFixed(4)})`, transformOrigin: `${f2(c.ox)}px ${f2(c.oy)}px`}}>
        {[0, 1, 3, 4].map((k) => <Win key={k} t={t} k={k} typeAt={landAt(k) + 0.15} stagger={[0, 1, 2, 3, 4].indexOf(k) / 30} splitP={splitP} />)}
        {t < TL.pull + 0.3 && <Win t={t} k={2} typeAt={landAt(2) + 0.15} stagger={2 / 30} splitP={0} keep />}
        {AVS.map((a) => <FlyAvatar key={a.k} t={t} a={a} />)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
// La fenêtre du milieu reste seule, passe au-dessus du disque, glisse au centre et se dissout quand le titre s'écrit (réf. 8,8 à 9,3 s)
export const KeptWindow: React.FC<{t: number}> = ({t}) => {
  const t0 = TL.pull + 0.3;
  const tOut = ws(30) - 0.06;
  if (t < t0 || t > tOut + 0.25) return null;
  const w = WINS[2];
  const mv = prog(t, t0 + 0.05, 0.5, E_INOUT);
  const out = prog(t, tOut, 6 / 30, E_OUT);
  const x = w.x + (540 - WW / 2 - w.x) * mv, y = w.y + (860 - WH / 2 - w.y) * mv;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: WW, height: WH, opacity: 1 - out, transform: `scale(${(1 - 0.06 * mv).toFixed(4)})`, filter: out > 0.01 ? `blur(${f2(12 * out)}px)` : undefined}}>
      <WinBody txt={PROMPTS[2]} />
    </div>
  );
};
