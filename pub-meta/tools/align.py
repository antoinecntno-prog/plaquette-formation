"""Aligne les mots du script sur les horodatages de la transcription.
Usage: python3 -I align.py script.json words.json timing.json
words.json : liste [{"text","start","end"}] (format ElevenLabs) ou {"words":[...]}
"""
import json, sys, re, unicodedata, difflib

def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    w = ''.join(c for c in w if unicodedata.category(c) != 'Mn')
    w = re.sub(r"[^a-z0-9']", '', w)
    return w

NUM = {"30": "trente", "10": "dix", "1": "une", "5": "cinq", "7": "sept"}

def norm_num(w):
    n = norm(w)
    return NUM.get(n, n)

script = json.load(open(sys.argv[1]))
raw = json.load(open(sys.argv[2]))
if isinstance(raw, dict):
    raw = raw.get('words', raw)
# keep only spoken words
tw = [w for w in raw if (w.get('type', 'word') == 'word') and norm(w.get('text', '')) != '']
tnorm = [norm_num(w['text']) for w in tw]

# flatten script words with sentence/chunk/line indexes
sw = []
for s in script['sentences']:
    for ci, chunk in enumerate(s['chunks']):
        for li, line in enumerate(chunk):
            for tok in line.split(' '):
                if tok.strip():
                    sw.append({'w': tok, 'n': norm_num(tok), 's': s['id'], 'c': ci, 'l': li})
# handle apostrophe-joined tokens: compare on normalized strings after removing apostrophes
snorm = [x['n'].replace("'", '') for x in sw]
tnorm2 = [t.replace("'", '') for t in tnorm]
sm = difflib.SequenceMatcher(a=snorm, b=tnorm2, autojunk=False)
matched = 0
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(i2 - i1):
            sw[i1 + k]['start'] = tw[j1 + k]['start']
            sw[i1 + k]['end'] = tw[j1 + k]['end']
            matched += 1
    elif tag == 'replace':
        # spread the transcript span over the script span
        t0 = tw[j1]['start']; t1 = tw[j2 - 1]['end']
        n = i2 - i1
        for k in range(n):
            sw[i1 + k]['start'] = t0 + (t1 - t0) * k / n
            sw[i1 + k]['end'] = t0 + (t1 - t0) * (k + 1) / n
            sw[i1 + k]['approx'] = True
# fill gaps (insert/delete) by interpolation between neighbours
for i, x in enumerate(sw):
    if 'start' in x:
        continue
    prev = next((sw[j] for j in range(i - 1, -1, -1) if 'start' in sw[j]), None)
    nxt = next((sw[j] for j in range(i + 1, len(sw)) if 'start' in sw[j]), None)
    a = prev['end'] if prev else 0.0
    b = nxt['start'] if nxt else a + 0.3
    # count consecutive unmatched
    j = i
    while j < len(sw) and 'start' not in sw[j]:
        j += 1
    n = j - i
    for k in range(n):
        sw[i + k]['start'] = a + (b - a) * k / n
        sw[i + k]['end'] = a + (b - a) * (k + 1) / n
        sw[i + k]['approx'] = True
total = len(sw)
audio_end = max(w['end'] for w in tw)
out = {'audio_end': audio_end, 'matched': matched, 'total': total, 'words': sw}
json.dump(out, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
print(f'matched {matched}/{total}, audio_end {audio_end:.2f}s')
for x in sw:
    if x.get('approx'):
        print('  approx:', x['w'], round(x['start'], 2))
