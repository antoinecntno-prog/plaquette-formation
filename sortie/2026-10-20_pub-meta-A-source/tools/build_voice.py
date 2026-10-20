"""Assemble la voix finale phrase par phrase et écrit timings.json.
Sources : prise V4 d'origine (phrases 2, 3, 5, 6, 7), test « i-a » (phrase 1), prise phrase 4 « i-a »."""
import json, subprocess, sys, numpy as np
S = sys.argv[1]
SR = 44100
def load(f):
    raw = subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'])
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
def words(f):
    d = json.load(open(f)); return [w for w in (d['words'] if isinstance(d, dict) else d) if w.get('type', 'word') == 'word']
src = {
    'old': (load(f'{S}/audio/voix_v4.mp3'), words(f'{S}/audio/words_v4.json')),
    'test': (load(f'{S}/iatest/t_ia_tiret.mp3'), words(f'{S}/iatest/t_ia_tiret_words.json')),
    's4': (load(f'{S}/iatest/s4.mp3'), words(f'{S}/iatest/s4_words.json')),
}
# phrases : (source, premier mot dans la source, dernier mot dans la source, indices globaux)
SENT = [
    ('test', 0, 8, range(0, 9)),
    ('old', 9, 15, range(9, 16)),
    ('old', 16, 29, range(16, 30)),
    ('s4', 0, 16, range(30, 47)),
    ('old', 47, 55, range(47, 56)),
    ('old', 56, 66, range(56, 67)),
    ('old', 67, 73, range(67, 74)),
]
GAPS = [0.42, 0.42, 0.80, 0.62, 1.05, 0.55]   # silence entre la fin d'une phrase et le début de la suivante
LEAD, TAIL = 0.22, 3.75
def env_db(a, t, win=0.01):
    i = int(t * SR); seg = a[max(0, i):i + int(win * SR)]
    return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-7) if len(seg) else -120
def refine(a, s, e, lo=None, hi=None):
    """Début et fin réels d'une phrase, sans déborder sur le mot précédent (lo) ni sur le mot suivant (hi)."""
    lo = 0 if lo is None else lo
    hi = len(a) / SR if hi is None else hi
    t = max(lo, s - 0.14)
    while t < s + 0.12 and env_db(a, t) < -42: t += 0.005
    st = max(lo, t - 0.03)
    t = min(hi - 0.01, e + 0.35)
    while t > e - 0.12 and env_db(a, t) < -42: t -= 0.005
    en = min(hi, t + 0.07)
    return st, en
def onset(a, ts):
    """Début audible réel d'un mot : on remonte depuis son début annoncé tant que le signal reste au-dessus de -48 dB."""
    t = ts
    while t > ts - 0.3 and env_db(a, t - 0.01) >= -48: t -= 0.005
    return t - 0.012
def bounds(name, a0, a1):
    a, ws_ = src[name]
    lo = onset(a, ws_[a0]['start']) if a0 > 0 else None
    hi = onset(a, ws_[a1 + 1]['start']) if a1 + 1 < len(ws_) else None
    return refine(a, ws_[a0]['start'], ws_[a1]['end'], lo, hi)
def highshelf(x, f0=7000, gain_db=4.5):
    A = 10 ** (gain_db / 40); w0 = 2 * np.pi * f0 / SR; al = np.sin(w0) / 2 * np.sqrt(2); c = np.cos(w0)
    b0 = A * ((A + 1) + (A - 1) * c + 2 * np.sqrt(A) * al); b1 = -2 * A * ((A - 1) + (A + 1) * c); b2 = A * ((A + 1) + (A - 1) * c - 2 * np.sqrt(A) * al)
    a0 = (A + 1) - (A - 1) * c + 2 * np.sqrt(A) * al; a1 = 2 * ((A - 1) - (A + 1) * c); a2 = (A + 1) - (A - 1) * c - 2 * np.sqrt(A) * al
    b = np.array([b0, b1, b2]) / a0; aa = np.array([1, a1 / a0, a2 / a0])
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for i in range(len(x)):
        xi = float(x[i]); yi = b[0] * xi + b[1] * x1 + b[2] * x2 - aa[1] * y1 - aa[2] * y2
        y[i] = yi; x2, x1, y2, y1 = x1, xi, y1, yi
    return y
def ride(x, st, pts):
    """Relève la fin de phrase qui retombe trop bas : pts = [(temps source, gain dB)], rampes de 40 ms."""
    g = np.zeros(len(x))
    for (ts, db) in pts:
        i = int((ts - st) * SR); r = int(0.04 * SR)
        ramp = np.clip((np.arange(len(x)) - i) / r, 0, 1)
        g = np.maximum(g, ramp * db)
    return x * (10 ** (g / 20))
def active_rms(x):
    fr = int(0.02 * SR); r = np.array([np.sqrt(np.mean(x[i:i + fr] ** 2)) for i in range(0, len(x) - fr, fr)])
    r = r[r > 10 ** (-35 / 20)]
    return float(np.sqrt(np.mean(r ** 2))) if len(r) else 1e-4
pieces, timing = [], [None] * 74
cursor = LEAD
out = [np.zeros(int(LEAD * SR), np.float32)]
ref_rms = None
slices = []
for k, (name, a0, a1, gidx) in enumerate(SENT):
    a, ws_ = src[name]
    st, en = bounds(name, a0, a1)
    x = a[int(st * SR):int(en * SR)].copy()
    slices.append((k, name, st, en, active_rms(x)))
target = np.median([s[4] for s in slices if s[1] == 'old'])
for k, (name, a0, a1, gidx) in enumerate(SENT):
    a, ws_ = src[name]
    _, _, st, en, r = slices[k]
    x = a[int(st * SR):int(en * SR)].copy() * (target / r)
    if name == 'test':
        # phrase 1 : « pour vos équipes. » retombe ~9 dB sous le reste, et le timbre est plus sombre que les autres prises
        x = ride(x, st, [(ws_[6]['start'] - 0.03, 6.0), (ws_[8]["start"] - 0.03, 14.0)])
        x = highshelf(x).astype(np.float32)
    n = len(x); fi, fo = int(0.02 * SR), int(0.03 * SR)
    x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo)
    for j, g in enumerate(gidx):
        w = ws_[a0 + j]
        timing[g] = {'s': round(cursor + (w['start'] - st), 3), 'e': round(cursor + (w['end'] - st), 3)}
    out.append(x); cursor += n / SR
    voice_end = cursor
    if k < len(GAPS):
        # silence de pause : on retire la marge déjà incluse en fin et en début de tranche
        nxt_name, b0 = SENT[k + 1][0], SENT[k + 1][1]
        b, wsb = src[nxt_name]
        nst, _ = bounds(nxt_name, b0, SENT[k + 1][2])
        tail_pad = en - ws_[a1]['end']; head_pad = wsb[b0]['start'] - nst
        g = max(0.08, GAPS[k] - max(0, tail_pad) - max(0, head_pad))
        out.append(np.zeros(int(g * SR), np.float32)); cursor += g
out.append(np.zeros(int(TAIL * SR), np.float32))
y = np.concatenate(out)
# mots faibles en début ou fin de phrase : on les remonte vers le niveau médian (bande 300-3400 Hz), sans toucher aux raccords
Y = np.fft.rfft(y); fr_ = np.fft.rfftfreq(len(y), 1 / SR); Y[(fr_ < 300) | (fr_ > 3400)] = 0; yb = np.fft.irfft(Y, len(y))
def word_level(s0, e0):
    fr = int(0.02 * SR); seg = yb[int(s0 * SR):int(e0 * SR)]
    pw = np.array([np.mean(seg[i:i + fr] ** 2) for i in range(0, max(1, len(seg) - fr), fr)]) + 1e-12
    pw = np.sort(10 * np.log10(pw))[len(pw) // 2:]
    return float(np.mean(pw))
lv = [word_level(timing[i]['s'], timing[i]['e']) for i in range(74)]
med = float(np.median(lv))
gain_db = np.zeros(len(y))
ramp = int(0.03 * SR)
for i in range(74):
    g = float(np.clip(med - 8 - lv[i], 0, 10 if i in (14, 46) else 7))   # « dix » et « plus. » sont presque chuchotés
    if g <= 0.05: continue
    a0, b0 = int((timing[i]['s'] - 0.06) * SR), int((timing[i]['e'] + 0.03) * SR)
    env = np.zeros(len(y)); env[a0:b0] = g
    env[a0:a0 + ramp] = np.linspace(0, g, ramp); env[b0 - ramp:b0] = np.linspace(g, 0, ramp)
    gain_db = np.maximum(gain_db, env)
    print('relevé', script_words[i] if 'script_words' in dir() else i, round(g, 1), 'dB')
y = y * (10 ** (gain_db / 20))
y = y / max(1.0, np.abs(y).max() / 0.95)
import wave
w = wave.open(f'{S}/pub/public/voix.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((y * 32767).astype(np.int16).tobytes()); w.close()
script = open(f'{S}/tools/script.txt').read().split()
WORDS = [{'t': script[i], 's': timing[i]['s'], 'e': timing[i]['e']} for i in range(74)]
dur = round(len(y) / SR, 3)
json.dump({'words': WORDS, 'voiceEnd': round(voice_end, 3), 'duration': dur}, open(f'{S}/pub/src/timings.json', 'w'), ensure_ascii=False, indent=0)
for s in slices: print('phrase', s[0] + 1, s[1], f'{s[2]:.2f}-{s[3]:.2f}', 'gain', round(float(target / s[4]), 2))
print('voix', round(voice_end, 2), 's, total', dur, 's')
for i in [0, 9, 16, 30, 47, 56, 67, 73]: print(i, WORDS[i])
