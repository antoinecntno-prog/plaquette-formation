"""Bande son du showreel, synthétisée sur l'horloge des images (evenements.json)."""
import json
import numpy as np
from scipy import signal as sg
from scipy.io import wavfile

SR = 48000
D = 15.0
N = int(SR * D)
rng = np.random.default_rng(7)
sec = lambda s: int(round(s * SR))

sec_dry = np.zeros((2, N))
envoi = np.zeros((2, N))


def pose(sig, t, gain=1.0, pan=0.0, rev=0.2):
    """Place un signal mono à t secondes. pan scalaire ou tableau, de -1 (gauche) à 1 (droite)."""
    i = sec(t)
    if i < 0:
        sig = sig[-i:]
        if not np.isscalar(pan):
            pan = pan[-i:]
        i = 0
    n = min(len(sig), N - i)
    if n <= 0:
        return
    p = pan if np.isscalar(pan) else pan[:n]
    gl = np.cos((np.asarray(p) + 1) * np.pi / 4) * gain
    gr = np.sin((np.asarray(p) + 1) * np.pi / 4) * gain
    s = sig[:n]
    sec_dry[0, i:i + n] += s * gl
    sec_dry[1, i:i + n] += s * gr
    envoi[0, i:i + n] += s * gl * rev
    envoi[1, i:i + n] += s * gr * rev


def bande(x, lo, hi, ordre=2):
    sos = sg.butter(ordre, [lo, hi], btype='band', fs=SR, output='sos')
    return sg.sosfilt(sos, x)


def passe_bas(x, fc, ordre=2):
    return sg.sosfilt(sg.butter(ordre, fc, btype='low', fs=SR, output='sos'), x)


def passe_haut(x, fc, ordre=2):
    return sg.sosfilt(sg.butter(ordre, fc, btype='high', fs=SR, output='sos'), x)


def bruit(n):
    return rng.standard_normal(n)


def bruit_forme(dur, centre, largeur_oct, amp):
    """Bruit dont le spectre suit une bande (en octaves) centrée sur centre(u), u de 0 à 1."""
    n = sec(dur)
    f, t, Z = sg.stft(bruit(n), fs=SR, nperseg=1024)
    u = np.clip(t / dur, 0, 1)
    lf = np.log2(np.maximum(f, 20))[:, None]
    lc = np.log2(np.array([centre(x) for x in u]))[None, :]
    g = np.exp(-0.5 * ((lf - lc) / largeur_oct) ** 2)
    _, y = sg.istft(Z * g, fs=SR, nperseg=1024)
    y = y[:n]
    y /= np.max(np.abs(y)) + 1e-9
    e = np.array([amp(x) for x in np.linspace(0, 1, n)])
    return y * e


# ---------- Nappe ----------
def voix(f, dur, harmo=8, det=0.0018):
    t = np.arange(sec(dur)) / SR
    s = np.zeros_like(t)
    for d in (-det, det):
        for k in range(1, harmo + 1):
            s += np.sin(2 * np.pi * f * (1 + d) * k * t + rng.uniform(0, 6.28)) / (k ** 1.6)
    return s


ACCORDS = [
    (0.0, 9.15, [73.42, 110.0, 146.83, 174.61, 220.0]),       # ré mineur
    (9.15, 13.2, [58.27, 87.31, 116.54, 146.83, 174.61]),     # si bémol
    (13.2, 15.0, [87.31, 130.81, 174.61, 220.0, 261.63, 392.0]),  # fa, neuvième en haut
]
nappe = np.zeros(N)
for a, b, fs in ACCORDS:
    a0, b0 = max(0, a - 0.2), min(D, b + 0.2)
    s = sum(voix(f, b0 - a0) * (0.55 if f > 300 else 1.0) for f in fs)
    n = len(s)
    env = np.ones(n)
    fx = sec(0.2)
    if a > 0:
        env[:2 * fx] = np.linspace(0, 1, 2 * fx)
    if b < D:
        env[-2 * fx:] = np.linspace(1, 0, 2 * fx)
    i = sec(a0)
    nappe[i:i + n] += (s * env)[:N - i]
nappe = passe_bas(nappe, 1100, 3)
tt = np.arange(N) / SR
env_n = np.clip(tt / 1.4, 0, 1) ** 2 * (1 - 0.35 * np.exp(-((tt - 5.3) / 0.25) ** 2))
env_n *= 1 + 0.35 * np.clip((tt - 9.15) / 0.6, 0, 1) * (tt < 11.45) + 0.2 * (tt >= 13.2)
env_n *= np.clip((D - tt) / 0.9, 0, 1)
nappe *= env_n * (1 + 0.08 * np.sin(2 * np.pi * 0.23 * tt))
nappe /= np.max(np.abs(nappe))
pan_n = 0.35 * np.sin(2 * np.pi * 0.07 * tt)
pose(nappe * 0.12, 0, pan=pan_n, rev=0.35)
pose(nappe * 0.09, 0, pan=-pan_n, rev=0.35)


# ---------- Évènements ----------
def choc(g):
    n = sec(1.6)
    t = np.arange(n) / SR
    f = 42 + 110 * np.exp(-t / 0.06)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t / 0.42) * np.minimum(1, t / 0.003)
    corps = np.sin(2 * np.pi * 92 * t) * np.exp(-t / 0.09) * 0.5
    tr = bande(bruit(n), 900, 7000) * np.exp(-t / 0.012) * 0.9
    queue = bande(bruit(n), 200, 1800) * np.exp(-t / 0.35) * 0.12
    return (sub + corps + tr + queue) * g


def souffle(dur, montant=True):
    return bruit_forme(dur, lambda u: 350 * (9 ** u) if montant else 3000 * (0.12 ** u), 0.9,
                       lambda u: (u ** 2.2) * (1 if u < 0.92 else (1 - u) / 0.08 + 0.001))


def aiguille(dur, g):
    n = sec(dur)
    t = np.arange(n) / SR
    s = np.zeros(n)
    cadence = 23.0
    k = 0
    while True:
        tc = k / cadence + rng.uniform(-0.002, 0.002)
        if tc >= dur:
            break
        i = sec(max(tc, 0))
        m = min(sec(0.03), n - i)
        tl = np.arange(m) / SR
        clic = bande(bruit(m), 2200, 7500) * np.exp(-tl / 0.0025)
        coup = np.sin(2 * np.pi * 185 * tl) * np.exp(-tl / 0.012) * 0.6
        s[i:i + m] += (clic + coup) * (0.8 + 0.2 * rng.random())
        k += 1
    moteur = sum(np.sin(2 * np.pi * 96 * h * t) / h for h in (1, 2, 3, 5)) * 0.12 * (1 + 0.3 * np.sin(2 * np.pi * cadence * t))
    s += moteur
    env = np.minimum(1, t / 0.04) * np.minimum(1, (dur - t) / 0.06)
    return s * env * g


def montee(dur):
    n = sec(dur)
    t = np.arange(n) / SR
    u = t / dur
    f = 180 * (4.5 ** (u ** 1.5))
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))) / SR
    ton = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * (u ** 2)
    b = bruit_forme(dur, lambda x: 500 * (10 ** x), 0.7, lambda x: x ** 3)
    return ton * 0.35 + b * 0.8


def faisceau(dur):
    n = sec(dur)
    t = np.arange(n) / SR
    fm = np.sin(2 * np.pi * 1320 * t + 1.2 * np.sin(2 * np.pi * 330 * t))
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 28 * t)
    souf = bande(bruit(n), 3000, 9000) * 0.25
    env = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.12)
    return (fm * 0.12 * trem + souf * trem) * env


def brouille():
    n = sec(0.42)
    s = np.zeros(n)
    for k in range(9):
        i = sec(k * 0.045)
        m = sec(0.018)
        tl = np.arange(m) / SR
        f = rng.uniform(900, 3200)
        s[i:i + m] += np.sign(np.sin(2 * np.pi * f * tl)) * np.exp(-tl / 0.007) * 0.3
    return passe_bas(s, 6000)


def declic():
    n = sec(0.25)
    t = np.arange(n) / SR
    clic = bande(bruit(n), 2500, 9000) * np.exp(-t / 0.002)
    ton = np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.035) * 0.5
    bas = np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.03) * 0.4
    return clic + ton + bas


def tic(fort):
    n = sec(0.08)
    t = np.arange(n) / SR
    s = bande(bruit(n), 3000, 9000) * np.exp(-t / 0.0018)
    if fort:
        s += np.sin(2 * np.pi * 950 * t) * np.exp(-t / 0.018) * 0.7
    return s


def cloche(f, dur=1.6, tau=0.7):
    n = sec(dur)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) + 0.32 * np.sin(2 * np.pi * 2.0 * f * t) * np.exp(-t / 0.25)
         + 0.12 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / 0.12))
    return s * np.exp(-t / tau) * np.minimum(1, t / 0.002)


def cran():
    n = sec(0.06)
    t = np.arange(n) / SR
    return bande(bruit(n), 1500, 6000) * np.exp(-t / 0.003) + np.sin(2 * np.pi * 1450 * t) * np.exp(-t / 0.01) * 0.5


NOTES = [587.33, 698.46, 783.99, 880.0, 1046.5, 1174.66]

ev = json.load(open('evenements.json'))
for e in ev:
    ty, g = e['type'], e.get('gain', 1)
    if ty == 'choc':
        pose(choc(1), e['t'] - 0.005, gain=0.9 * g, rev=0.3)
    elif ty == 'souffle':
        dur = e['t1'] - e['t0'] + 0.08
        s = souffle(dur)
        pan = np.linspace(0.6, -0.6, len(s)) if abs(e['t0'] - 4.88) < 0.05 else 0.0
        pose(s, e['t0'], gain=0.55 * g, pan=pan, rev=0.25)
    elif ty == 'montee':
        pose(montee(e['t1'] - e['t0']), e['t0'], gain=0.5 * g, rev=0.3)
    elif ty == 'aiguille':
        dur = e['t1'] - e['t0']
        s = aiguille(dur, 1)
        if abs(e['t0'] - 0.1) < 0.05:
            pan = np.linspace(-0.8, 0.8, len(s))
        elif abs(e['t0'] - 4.95) < 0.05:
            pan = np.linspace(0.8, -0.8, len(s))
        else:
            pan = 0.0
        pose(s, e['t0'], gain=0.32 * g, pan=pan, rev=0.12)
    elif ty == 'faisceau':
        pose(faisceau(e['t1'] - e['t0']), e['t0'], gain=0.5, pan=0.4, rev=0.2)
    elif ty == 'brouille':
        pose(brouille(), e['t'], gain=0.28 * g, pan=0.45, rev=0.15)
    elif ty == 'declic':
        pose(declic(), e['t'], gain=0.4 * g, pan=0.45, rev=0.2)
    elif ty == 'tic':
        pose(tic(g > 0.9), e['t'], gain=0.22 * g, pan=-0.2, rev=0.1)
    elif ty == 'note':
        pose(cloche(NOTES[e['degre'] % len(NOTES)]), e['t'], gain=0.13, pan=-0.25 + 0.1 * e['degre'], rev=0.5)
    elif ty == 'cran':
        pose(cran(), e['t'], gain=0.3 * g, rev=0.1)
    elif ty == 'carillon':
        for k, f in enumerate([349.23, 440.0, 523.25, 698.46, 880.0]):
            pose(cloche(f, 2.2, 1.1), e['t'] + k * 0.035, gain=0.1, pan=-0.4 + 0.2 * k, rev=0.6)

# ---------- Réverbération et mastering ----------
ir_n = sec(1.8)
ti = np.arange(ir_n) / SR
ir = np.stack([passe_bas(bruit(ir_n), 6000) * np.exp(-ti / 0.45) for _ in range(2)])
ir[:, :sec(0.012)] = 0
ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
wet = np.stack([sg.fftconvolve(envoi[c], ir[c])[:N] for c in range(2)])
mix = sec_dry + wet * 0.55
mix = np.stack([passe_haut(mix[c], 28) for c in range(2)])
mix /= np.max(np.abs(mix))
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix *= 10 ** (-1.0 / 20) / np.max(np.abs(mix))
fin = np.clip((D - tt) / 0.35, 0, 1)
mix *= fin
mix[:, :sec(0.005)] *= np.linspace(0, 1, sec(0.005))
rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)))
print(f'crête -1.0 dBFS, RMS {rms:.1f} dBFS')
wavfile.write('son.wav', SR, (mix.T * 32767).astype(np.int16))
