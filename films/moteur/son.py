# Bande son d'un film : coupe de la musique sur les mesures, bruitages Mixkit calés sur leur pic, -14 LUFS.
# Usage : python3 -I son.py <film/son.json> <sortie.wav>
import json, os, subprocess, sys
import numpy as np

SR = 48000

def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()

def db(g):
    return 10 ** (g / 20)

def enveloppe(x, ms=5):
    m = np.abs(x).max(axis=1)
    k = max(1, int(SR * ms / 1000))
    return np.convolve(m, np.ones(k) / k, mode="same")

def cale(x, mode):
    """Indice d'échantillon à poser sur l'instant de l'événement : le pic, ou l'attaque."""
    e = enveloppe(x)
    pic = int(np.argmax(e))
    if mode == "attaque":
        seuil = e[pic] * 0.18
        idx = np.nonzero(e[: pic + 1] >= seuil)[0]
        return int(idx[0]) if len(idx) else pic
    return pic

def temps_fort(m, t, fen=0.06):
    """Recale un temps sur l'attaque de grosse caisse la plus proche (énergie des basses)."""
    marge = 0.05
    a, b = int((t - fen - marge) * SR), int((t + fen) * SR)
    seg = m[a:b].mean(axis=1)
    k = int(SR * 0.003)
    bas = np.convolve(seg, np.ones(k) / k, mode="same")
    k2 = int(SR * 0.005)
    nrj = np.convolve(bas ** 2, np.ones(k2) / k2, mode="same")
    d = np.diff(nrj, prepend=nrj[0])
    lo = int(marge * SR)
    i = lo + int(np.argmax(d[lo:]))
    return (a + i) / SR

def principal(conf_path, sortie):
    base = os.path.dirname(os.path.abspath(conf_path))
    conf = json.load(open(conf_path, encoding="utf-8"))
    duree = conf["duree"]
    n = int(round(duree * SR))
    mix = np.zeros((n, 2), np.float32)
    # Musique : segments [début source, début film, durée], fondus de 8 ms aux raccords.
    mu = conf["musique"]
    m = decode(os.path.join(base, mu["fichier"]))
    piste = np.zeros((n, 2), np.float32)
    fondu = int(SR * 0.008)
    journal = []
    for src, dst, dur in mu["segments"]:
        s0 = temps_fort(m, src) if mu.get("recaler", True) else src
        journal.append((src, round(s0, 4), dst, dur))
        a = int(round(s0 * SR)); L = int(round(dur * SR)); d0 = int(round(dst * SR))
        bloc = m[a - fondu: a + L + fondu].copy()
        rampe = np.linspace(0, 1, fondu, dtype=np.float32)[:, None]
        bloc[:fondu] *= np.sqrt(rampe); bloc[-fondu:] *= np.sqrt(rampe[::-1])
        i0 = d0 - fondu
        j0 = max(0, i0); j1 = min(n, i0 + len(bloc))
        piste[j0:j1] += bloc[j0 - i0: j1 - i0]
    if mu.get("fin_fondu"):
        f = int(SR * mu["fin_fondu"]); piste[-f:] *= np.linspace(1, 0, f, dtype=np.float32)[:, None]
    mix += piste * db(mu.get("gain_db", 0))
    # Bruitages.
    cache = {}
    for b in conf["bruitages"]:
        f = os.path.join(base, conf["dossier_bruitages"], f"{b['id']}.mp3")
        if f not in cache: cache[f] = decode(f)
        x = cache[f]
        if "debut" in b: x = x[int(b["debut"] * SR):]
        if "duree" in b:
            x = x[: int(b["duree"] * SR)].copy()
            r = min(len(x), int(SR * 0.04)); x[-r:] *= np.linspace(1, 0, r, dtype=np.float32)[:, None]
        c = cale(x, b.get("cale", "pic"))
        d0 = int(round(b["t"] * SR)) - c
        j0 = max(0, d0); j1 = min(n, d0 + len(x))
        if j1 > j0: mix[j0:j1] += x[j0 - d0: j1 - d0] * db(b.get("gain", 0))
    tmp = sortie + ".brut.wav"
    ecrire(mix, tmp)
    # Normalisation EBU R128 en deux passes : -14 LUFS intégrés, crête vraie -1 dBTP.
    mes = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    j = json.loads(mes[mes.rindex("{"): mes.rindex("}") + 1])
    filtre = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
              f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true:print_format=summary")
    tmp2 = sortie + ".norm.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", filtre + ",aresample=48000", "-ar", "48000", "-c:a", "pcm_f32le", tmp2], check=True)
    # Dernier réglage de gain pour tomber à -14,0 LUFS (le filtre linéaire laisse quelques dixièmes d'écart).
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp2, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    li = float(r[r.rindex("I:"):].split()[1])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp2, "-af", f"volume={-14.0 - li:.2f}dB", "-c:a", "pcm_s24le", sortie], check=True)
    os.remove(tmp); os.remove(tmp2)
    for r in journal: print("segment", r)
    print("mesure avant", j["input_i"], "LUFS")

def ecrire(x, path):
    pcm = np.clip(x, -1, 1).astype(np.float32).tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", path],
                   input=pcm, check=True)

if __name__ == "__main__":
    principal(sys.argv[1], sys.argv[2])
