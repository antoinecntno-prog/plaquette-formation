#!/usr/bin/env python3
"""Vidéo verticale de la formation IA, montée sur le modèle d'egghook.mp4.

Le plan de l'œuf d'egghook-trimmed.mp4 ouvre la vidéo, suivi de cinq cartons
en coupes franches. Le son reprend la piste d'egghook.mp4.

Lancement : python3 build_video.py
Le script écrit la vidéo finale et la planche de contrôle à côté des sources,
puis affiche les mesures de contrôle.

Prérequis : ffmpeg 5.1 ou plus et le module Pillow. Le contrôle final demande
aussi numpy : sans lui, le script s'arrête après la planche.
"""

# ============================================================================
# À MODIFIER ICI
# ============================================================================

# Textes des cartons, dans l'ordre d'apparition. "\u202f" est l'espace fine
# insécable placée avant le point d'interrogation.
TEXTES = [
    "L'IA vous tente\u202f?",
    "Pilotez-la.",
    "En une journée.",
    "Garanti 30 jours.",
    "Réservez un call.",
]

# Durée de chaque carton en images, à 30 images par seconde (30 = 1 s).
# Référence : 30, 28, 23, 21, 30.
DUREES_CARTONS = [30, 28, 23, 21, 30]

# Durée du plan de l'œuf en images. La coupe tombe pendant la chute, avant
# l'impact : image 64 dans la référence.
IMAGES_OUVERTURE = 64

# Couleurs (fond, texte) de chaque carton : noir sur blanc et blanc sur noir
# en alternance, comme la référence.
BLANC = (255, 255, 255)
NOIR = (0, 0, 0)
COULEURS = [(BLANC, NOIR), (NOIR, BLANC), (BLANC, NOIR), (NOIR, BLANC), (BLANC, NOIR)]

# ============================================================================
# Réglages calés sur la référence
# ============================================================================

POLICE = "InterDisplay-SemiBold.otf"
TAILLE_POLICE = 91          # px
INTERLETTRAGE_EM = -0.05    # soit -4,55 px à 91 px
CENTRE_X = 360              # px, centre visé pour la boîte d'encre
LIGNE_DE_BASE_Y = 672       # px, rangée la plus basse de l'encre hors jambages
LARGEUR_ENCRE_MAX = 615     # px, au-delà le script s'arrête avant le rendu
TEXTE_REPERE = "Need a website?"   # 610 x 67 px dans la référence

FPS = 30
LARGEUR, HAUTEUR = 720, 1280

REFERENCE = "egghook.mp4"
OUVERTURE = "egghook-trimmed.mp4"
SORTIE_VIDEO = "2026-10-25_video-formation-ia.mp4"
SORTIE_PLANCHE = "2026-10-25_planche-controle.png"
INSTANTS_PLANCHE = [2.5, 3.5, 4.4, 5.1, 6.0]   # secondes
SEUIL_SCENE = 0.3           # seuil de la détection de scène ffmpeg
DUREE_CONTROLE_AUDIO = 6.5  # secondes comparées à la référence
# Débuts des cinq salves sonores mesurés dans la référence (s), décalés des
# coupes image : le contrôle vérifie que le rendu les garde à 20 ms près.
SALVES = [2.378, 3.240, 4.092, 4.944, 5.796]

# Version officielle d'Inter, téléchargée si la police manque sur la machine.
URLS_INTER = [
    "https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip",
    "https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip",
]

# ============================================================================

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
from fractions import Fraction
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow manque. Installation : python3 -m pip install Pillow")

DOSSIER = Path(__file__).resolve().parent


# ---------------------------------------------------------------------------
# Outils
# ---------------------------------------------------------------------------

def lancer(cmd, cwd=None):
    """Lance une commande et arrête le script avec son message si elle échoue."""
    res = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, cwd=cwd)
    if res.returncode != 0:
        sys.exit(f"Échec de la commande :\n{' '.join(map(str, cmd))}\n{res.stderr[-3000:]}")
    return res


def sonder(chemin, compter=False):
    """Lit un fichier avec ffprobe et rend ses flux vidéo et audio avec son format."""
    cmd = ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json"]
    if compter:
        cmd.append("-count_frames")
    donnees = json.loads(lancer(cmd + [chemin]).stdout)
    flux = donnees.get("streams", [])
    video = next((f for f in flux if f.get("codec_type") == "video"), None)
    audio = next((f for f in flux if f.get("codec_type") == "audio"), None)
    return video, audio, donnees.get("format", {})


def nombre(valeur, defaut=0.0):
    """Valeur numérique lue par ffprobe, qui écrit parfois "N/A"."""
    try:
        return float(valeur)
    except (TypeError, ValueError):
        return defaut


def debut_video(video, fmt):
    """Instant de la première image, compté depuis le début du fichier (s)."""
    if video is None:
        return 0.0
    t0 = nombre(fmt.get("start_time"))
    return nombre(video.get("start_time"), t0) - t0


def dimensions_affichees(video):
    """Largeur et hauteur après la rotation que ffmpeg applique au décodage."""
    rotation = 0
    for donnee in video.get("side_data_list", []):
        if "rotation" in donnee:
            rotation = int(nombre(donnee["rotation"]))
    if "rotate" in video.get("tags", {}):
        rotation = int(nombre(video["tags"]["rotate"]))
    largeur, hauteur = video["width"], video["height"]
    return (hauteur, largeur) if abs(rotation) % 180 == 90 else (largeur, hauteur)


def fr(valeur, decimales=1):
    """Nombre décimal écrit à la française."""
    return f"{valeur:.{decimales}f}".replace(".", ",")


def debuts_cartons():
    """Première image de chaque carton dans la vidéo finale."""
    debuts, n = [], IMAGES_OUVERTURE
    for duree in DUREES_CARTONS:
        debuts.append(n)
        n += duree
    return debuts


def total_images():
    return IMAGES_OUVERTURE + sum(DUREES_CARTONS)


def compter_images(chemin):
    video, _, _ = sonder(chemin, compter=True)
    return int(video.get("nb_read_frames", 0))


def extraire_images(video, indices, dossier, prefixe):
    """Extrait en PNG les images de rang donné (0 = première) et rend {rang: chemin}."""
    indices = sorted(set(indices))
    if not indices:
        return {}
    expression = "+".join(f"eq(n,{i})" for i in indices)
    lancer(["ffmpeg", "-y", "-v", "error", "-i", video, "-vf", f"select='{expression}'",
            "-fps_mode", "passthrough", "-frames:v", len(indices),
            Path(dossier) / f"{prefixe}_%02d.png"])
    chemins = {i: Path(dossier) / f"{prefixe}_{k:02d}.png" for k, i in enumerate(indices, 1)}
    manquants = [i for i, chemin in chemins.items() if not chemin.exists()]
    if manquants:
        sys.exit(f"Images absentes de {Path(video).name} : rangs {manquants}")
    return chemins


def atomes_mp4(chemin):
    """Types des boîtes de premier niveau d'un MP4, dans l'ordre du fichier."""
    types = []
    with open(chemin, "rb") as f:
        while True:
            entete = f.read(8)
            if len(entete) < 8:
                break
            taille, lu = int.from_bytes(entete[:4], "big"), 8
            if taille == 1:
                taille, lu = int.from_bytes(f.read(8), "big"), 16
            types.append(entete[4:8].decode("latin-1"))
            if taille == 0:
                break
            f.seek(taille - lu, 1)
    return types


# ---------------------------------------------------------------------------
# Police
# ---------------------------------------------------------------------------

def trouver_police():
    """Cherche la police à côté du script, puis dans les dossiers système."""
    for chemin in (DOSSIER / POLICE, DOSSIER / "polices" / POLICE):
        if chemin.is_file():
            return chemin
    dossiers_systeme = [
        Path.home() / "Library" / "Fonts", Path("/Library/Fonts"),
        Path("/usr/share/fonts"), Path("/usr/local/share/fonts"),
        Path.home() / ".local" / "share" / "fonts", Path.home() / ".fonts",
    ]
    for dossier in dossiers_systeme:
        if dossier.is_dir():
            trouves = sorted(dossier.rglob(POLICE))
            if trouves:
                return trouves[0]
    return telecharger_police()


def telecharger_police():
    """Télécharge la version officielle d'Inter et en extrait la police."""
    cible = DOSSIER / "polices" / POLICE
    for url in URLS_INTER:
        print(f"Police absente, téléchargement de {url}")
        try:
            with tempfile.TemporaryDirectory() as tmp:
                archive = Path(tmp) / "inter.zip"
                urllib.request.urlretrieve(url, archive)
                with zipfile.ZipFile(archive) as zf:
                    membres = [m for m in zf.namelist() if Path(m).name == POLICE]
                    if not membres:
                        print(f"  {POLICE} absente de l'archive")
                        continue
                    membres.sort(key=lambda m: ("otf" not in m.lower(), len(m)))
                    cible.parent.mkdir(exist_ok=True)
                    cible.write_bytes(zf.read(membres[0]))
                    return cible
        except Exception as erreur:
            print(f"  échec : {erreur}")
    sys.exit(f"{POLICE} introuvable. Pose le fichier à côté du script puis relance.")


def charger_police(chemin, taille):
    return ImageFont.truetype(str(chemin), taille, layout_engine=ImageFont.Layout.BASIC)


class Police:
    """Police des cartons : dessin à TAILLE_POLICE, chasses exactes.

    Pillow arrondit la chasse de chaque lettre au pixel entier dans son moteur
    de base, et à 1/64 de pixel avec raqm. Les chasses sont donc lues à
    2048 px, la taille où une unité de dessin d'Inter vaut un pixel, puis
    ramenées à TAILLE_POLICE : le rendu ne dépend plus du moteur installé."""

    TAILLE_MESURE = 2048

    def __init__(self, chemin):
        self.dessin = charger_police(chemin, TAILLE_POLICE)
        self._mesure = charger_police(chemin, self.TAILLE_MESURE)

    def chasse(self, lettre):
        return self._mesure.getlength(lettre) * TAILLE_POLICE / self.TAILLE_MESURE


# ---------------------------------------------------------------------------
# Cartons
# ---------------------------------------------------------------------------

def poser_texte(texte, police, origine_x):
    """Pose le texte lettre par lettre et rend (toile, marge).

    Chaque lettre avance de sa chasse plus l'interlettrage, avec les décimales.
    La toile déborde du cadre d'une largeur d'image de chaque côté, pour
    mesurer un texte trop large."""
    interlettrage = INTERLETTRAGE_EM * TAILLE_POLICE
    marge = LARGEUR
    toile = Image.new("L", (LARGEUR + 2 * marge, HAUTEUR), 0)
    dessin = ImageDraw.Draw(toile)
    x = marge + origine_x
    for lettre in texte:
        dessin.text((x, LIGNE_DE_BASE_Y), lettre, font=police.dessin, fill=255, anchor="ls")
        x += police.chasse(lettre) + interlettrage
    return toile, marge


def boite(masque, seuil=0):
    """Boîte d'encre (gauche, haut, droite, bas), bornes incluses, pixels au-dessus du seuil."""
    b = masque.point(lambda v: 255 if v > seuil else 0).getbbox()
    return None if b is None else (b[0], b[1], b[2] - 1, b[3] - 1)


def milieu(gauche, droite):
    """Milieu entre le bord gauche de la colonne gauche et le bord droit de la colonne droite."""
    return (gauche + droite + 1) / 2


def composer_masque(texte, police):
    """Masque 720 x 1280 du texte et sa mesure.

    Le centrage se fait sur l'encre couverte à 50 % ou plus, la mesure qui
    résiste à la compression vidéo. La largeur retenue pour la limite de
    615 px compte toute l'encre, même pâle."""
    origine = 0.0
    for _ in range(4):
        toile, marge = poser_texte(texte, police, origine)
        b = boite(toile, 127)
        if b is None:
            sys.exit(f"Carton sans encre : {texte!r}")
        ecart = CENTRE_X - (milieu(b[0], b[2]) - marge)
        if abs(ecart) <= 0.5:
            break
        origine += ecart
    gauche, haut, droite, bas = boite(toile)
    mesure = {
        "largeur": droite - gauche + 1,
        "hauteur": bas - haut + 1,
        "gauche": gauche - marge,
        "droite": droite - marge,
        "haut": haut,
        "bas": bas,
        "centre": milieu(b[0], b[2]) - marge,
        "largeur_50": b[2] - b[0] + 1,
        "hauteur_50": b[3] - b[1] + 1,
    }
    return toile.crop((marge, 0, marge + LARGEUR, HAUTEUR)), mesure


def image_carton(masque, fond, encre):
    return Image.composite(Image.new("RGB", masque.size, encre),
                           Image.new("RGB", masque.size, fond), masque)


def preparer_cartons(police):
    """Compose les masques et arrête tout si un texte dépasse la largeur maximale."""
    _, repere = composer_masque(TEXTE_REPERE, police)
    print(f"Repère « {TEXTE_REPERE} » : {repere['largeur']} x {repere['hauteur']} px, "
          f"{repere['largeur_50']} x {repere['hauteur_50']} px à 50 % de couverture "
          f"(référence : 610 x 67 px)")
    masques, trop_larges = [], []
    for k, texte in enumerate(TEXTES, 1):
        masque, mesure = composer_masque(texte, police)
        masques.append((masque, mesure))
        tient = mesure["largeur"] <= LARGEUR_ENCRE_MAX
        print(f"Carton {k} « {texte} » : {mesure['largeur']} px de large "
              f"(maximum {LARGEUR_ENCRE_MAX}){'' if tient else '  TROP LARGE'}")
        if not tient:
            trop_larges.append(k)
    if trop_larges:
        sys.exit(f"Arrêt avant le rendu : carton(s) {trop_larges} au-delà de "
                 f"{LARGEUR_ENCRE_MAX} px. Raccourcis le texte à taille de police égale.")
    return masques


# ---------------------------------------------------------------------------
# Montage
# ---------------------------------------------------------------------------

MATRICES = {"bt709": "bt709", "smpte170m": "bt601", "bt470bg": "bt601"}
HORS_SDR = {"bt2020", "bt2020nc", "bt2020c", "smpte2084", "arib-std-b67"}


def options_couleur(video):
    """Repères colorimétriques de la sortie, repris du plan d'ouverture (BT.709 par défaut)."""
    espace = video.get("color_space", "bt709")
    if espace not in MATRICES:
        espace = "bt709"
    primaires = video.get("color_primaries", espace)
    transfert = video.get("color_transfer", espace)
    if primaires in ("unknown", "reserved"):
        primaires = "bt709"
    if transfert in ("unknown", "reserved"):
        transfert = "bt709"
    return espace, ["-colorspace", espace, "-color_primaries", primaires,
                    "-color_trc", transfert, "-color_range", "tv"]


def monter(reference, ouverture, masques, sortie, tmp, mode_audio="aac"):
    video_ouv, _, _ = sonder(ouverture)
    espace, tags = options_couleur(video_ouv)

    # Ouverture : les premières images du plan, gardées sans perte jusqu'à
    # l'encodage final. Seuls les horodatages sont renumérotés au rang de
    # l'image (settb, setpts) : les pixels ne passent par aucun filtre.
    segments = [tmp / "segment_0.nut"]
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", ouverture, "-map", "0:v:0", "-an",
           "-frames:v", IMAGES_OUVERTURE, "-vf", f"settb=1/{FPS},setpts=N",
           "-fps_mode", "passthrough", "-c:v", "ffv1"]
    if video_ouv.get("pix_fmt") != "yuv420p":
        cmd += ["-pix_fmt", "yuv420p"]
    lancer(cmd + [segments[0]])

    # Cartons : un PNG par texte, répété sur le nombre d'images exact.
    for k, ((masque, _), (fond, encre), duree) in enumerate(
            zip(masques, COULEURS, DUREES_CARTONS), 1):
        png = tmp / f"carton_{k}.png"
        image_carton(masque, fond, encre).save(png)
        segment = tmp / f"segment_{k}.nut"
        lancer(["ffmpeg", "-y", "-v", "error", "-loop", 1, "-framerate", FPS, "-i", png,
                "-frames:v", duree,
                "-vf", f"scale=out_color_matrix={MATRICES[espace]}:out_range=tv,format=yuv420p",
                "-c:v", "ffv1", segment])
        segments.append(segment)

    attendus = [IMAGES_OUVERTURE] + DUREES_CARTONS
    for segment, attendu in zip(segments, attendus):
        compte = compter_images(segment)
        if compte != attendu:
            sys.exit(f"{segment.name} : {compte} images pour {attendu} attendues")

    # Un segment NUT annonce sa durée sans sa dernière image : la durée exacte
    # est donc écrite dans la liste, sinon chaque raccord superpose une image.
    liste = tmp / "segments.txt"
    liste.write_text("ffconcat version 1.0\n" + "".join(
        f"file '{s.name}'\nduration {n / FPS:.9f}\n" for s, n in zip(segments, attendus)))

    # Son : la piste de la référence. -itsoffset place la première image de la
    # référence à t = 0, comme l'image 0 du rendu : le son garde son écart
    # d'origine avec l'image. En mode aac, aresample cale la piste sur t = 0
    # et la complète par du silence si elle est trop courte, avant le
    # réencodage en AAC 128 kb/s. Le mode copie la reprend sans réencodage.
    v_ref, _, f_ref = sonder(reference)
    decalage = debut_video(v_ref, f_ref)
    total = total_images()
    duree = total / FPS
    if mode_audio == "copie":
        audio = ["-c:a", "copy"]
    else:
        audio = ["-af", "aresample=async=1:first_pts=0,apad",
                 "-c:a", "aac", "-b:a", "128k", "-ar", 44100, "-ac", 2]
    lancer(["ffmpeg", "-y", "-v", "error",
            "-f", "concat", "-safe", 0, "-i", liste,
            "-itsoffset", f"{-decalage:.6f}", "-i", reference,
            "-map", "0:v:0", "-map", "1:a:0",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", 18, "-pix_fmt", "yuv420p",
            "-r", FPS, "-fps_mode", "cfr", "-frames:v", total, *tags,
            *audio, "-t", f"{duree:.6f}",
            "-movflags", "+faststart", sortie])


# ---------------------------------------------------------------------------
# Planche de contrôle
# ---------------------------------------------------------------------------

def nom_segment(indice):
    if indice < IMAGES_OUVERTURE:
        return "ouverture"
    for k, debut in enumerate(debuts_cartons(), 1):
        if debut <= indice < debut + DUREES_CARTONS[k - 1]:
            return f"carton {k}"
    return "après la fin"


def fabriquer_planche(reference, video, sortie, chemin_police, tmp):
    """Référence et rendu côte à côte, à chaque instant de INSTANTS_PLANCHE."""
    indices = [round(t * FPS) for t in INSTANTS_PLANCHE]
    n_ref, n_rendu = compter_images(reference), total_images()
    sources = [
        ("Référence", extraire_images(reference, [i for i in indices if i < n_ref], tmp, "ref")),
        ("Rendu", extraire_images(video, [i for i in indices if i < n_rendu], tmp, "rendu")),
    ]

    echelle = 0.3
    lv, hv = round(LARGEUR * echelle), round(HAUTEUR * echelle)
    marge, ecart_paire, ecart_bloc = 48, 14, 40
    bloc = 2 * lv + ecart_paire
    largeur = 2 * marge + len(indices) * bloc + (len(indices) - 1) * ecart_bloc
    y = 228
    hauteur = y + hv + 52

    fond, texte, discret, repere = (30, 30, 30), (242, 242, 242), (160, 160, 160), (255, 212, 0)
    planche = Image.new("RGB", (largeur, hauteur), fond)
    d = ImageDraw.Draw(planche)
    p_titre = charger_police(chemin_police, 30)
    p_texte = charger_police(chemin_police, 20)
    p_petit = charger_police(chemin_police, 17)

    d.text((marge, 26), "Planche de contrôle : référence et rendu côte à côte",
           font=p_titre, fill=texte)
    d.text((marge, 72), f"{Path(reference).name} à gauche, {Path(video).name} à droite. "
           f"Repères jaunes en marge : axe x = {CENTRE_X} px et ligne de base y = "
           f"{LIGNE_DE_BASE_Y} px.", font=p_petit, fill=discret)

    for i, (t, indice) in enumerate(zip(INSTANTS_PLANCHE, indices)):
        x_bloc = marge + i * (bloc + ecart_bloc)
        d.text((x_bloc, 122), f"{fr(t)} s", font=p_texte, fill=texte)
        d.text((x_bloc, 150), f"image {indice}, {nom_segment(indice)}", font=p_petit, fill=discret)
        for j, (nom, images) in enumerate(sources):
            x = x_bloc + j * (lv + ecart_paire)
            d.text((x, 196), nom, font=p_petit, fill=discret)
            d.rectangle((x - 1, y - 1, x + lv, y + hv), outline=(90, 90, 90))
            if indice not in images:
                d.text((x + 12, y + hv // 2 - 10), "après la fin", font=p_petit, fill=discret)
                continue
            vignette = Image.open(images[indice]).convert("RGB").resize((lv, hv), Image.LANCZOS)
            planche.paste(vignette, (x, y))
            yb = y + round(LIGNE_DE_BASE_Y * echelle)
            xc = x + round(CENTRE_X * echelle)
            if j == 0:
                d.line((x - 12, yb, x - 3, yb), fill=repere, width=2)
            else:
                d.line((x + lv + 2, yb, x + lv + 11, yb), fill=repere, width=2)
            d.line((xc, y - 12, xc, y - 3), fill=repere, width=2)
            d.line((xc, y + hv + 2, xc, y + hv + 11), fill=repere, width=2)

    planche.save(sortie)


# ---------------------------------------------------------------------------
# Contrôle
# ---------------------------------------------------------------------------

def controler(video, reference, ouverture, masques, planche, tmp):
    try:
        import numpy as np
    except ImportError:
        print("numpy manque : contrôle final non fait (python3 -m pip install numpy).")
        return True

    resultat = {"ok": True}

    def ligne(nom, valeur, ok):
        resultat["ok"] &= bool(ok)
        print(f"  [{'OK' if ok else 'ÉCART'}] {nom} : {valeur}")

    def mesurer(masque):
        """Boîte d'encre d'un masque et test d'une seule ligne."""
        rangs = np.where(masque.any(axis=1))[0]
        colonnes = np.where(masque.any(axis=0))[0]
        return {
            "gauche": int(colonnes.min()), "droite": int(colonnes.max()),
            "largeur": int(colonnes.max() - colonnes.min() + 1),
            "centre": milieu(int(colonnes.min()), int(colonnes.max())),
            "haut": int(rangs.min()), "bas": int(rangs.max()),
            "une_ligne": rangs.max() - rangs.min() + 1 <= 1.3 * TAILLE_POLICE,
        }

    def decalage_vertical(png, image):
        """Décalage vertical (px) qui superpose le mieux l'encre de l'image à celle du PNG."""
        profil_png = png.sum(axis=1).astype(float)
        profil_image = image.sum(axis=1).astype(float)
        return max(range(-20, 21), key=lambda d: float(np.dot(np.roll(profil_png, d), profil_image)))

    total = total_images()
    duree = total / FPS
    print("\nContrôle du rendu")

    # Format
    v, a, fmt = sonder(video, compter=True)
    n = int(v.get("nb_read_frames", 0))
    d_video, d_fichier = nombre(v.get("duration")), nombre(fmt.get("duration"))
    ligne("Format vidéo",
          f"{v['codec_name']} {v.get('profile', '')} {v['pix_fmt']}, {v['width']} x {v['height']}, "
          f"{v['r_frame_rate']} i/s (moyenne {v['avg_frame_rate']}), {n} images, "
          f"flux vidéo {fr(d_video, 3)} s, fichier {fr(d_fichier, 3)} s",
          v["width"] == LARGEUR and v["height"] == HAUTEUR and v["pix_fmt"] == "yuv420p"
          and v["r_frame_rate"] == f"{FPS}/1" and v["avg_frame_rate"] == f"{FPS}/1"
          and n == total and round(d_video, 3) == round(duree, 3)
          and round(d_fichier, 3) == round(duree, 3))
    d_audio = nombre(a.get("duration"))
    ligne("Format audio",
          f"{a['codec_name']}, {a['sample_rate']} Hz, {a['channels']} canaux, "
          f"{int(nombre(a.get('bit_rate'))) // 1000} kb/s, {fr(d_audio, 3)} s",
          a["codec_name"] == "aac" and a["sample_rate"] == "44100" and a["channels"] == 2
          and round(d_audio, 3) == round(duree, 3))
    atomes = atomes_mp4(video)
    rapide = "moov" in atomes and "mdat" in atomes and atomes.index("moov") < atomes.index("mdat")
    ligne("Faststart", " puis ".join(atomes), rapide)

    # Coupes
    lancer(["ffmpeg", "-v", "error", "-i", Path(video).resolve(), "-an",
            "-vf", "select='gte(scene,0)',metadata=print:file=scenes.txt", "-f", "null", "-"],
           cwd=tmp)
    scores, rang = {}, None
    for l in (tmp / "scenes.txt").read_text().splitlines():
        if l.startswith("frame:"):
            rang = int(l.split()[0].split(":")[1])
        elif l.startswith("lavfi.scene_score=") and rang is not None:
            scores[rang] = float(l.split("=")[1])
    coupes = sorted(i for i, s in scores.items() if s > SEUIL_SCENE)
    attendues = debuts_cartons()
    hors = [s for i, s in scores.items() if i not in attendues] or [0.0]
    ligne(f"Coupes (score de scène > {fr(SEUIL_SCENE)})",
          f"images {coupes}, attendu {attendues} ; score mini aux coupes "
          f"{fr(min(scores.get(i, 0) for i in attendues), 3)}, maxi ailleurs {fr(max(hors), 3)}",
          coupes == attendues)

    # PSNR de l'ouverture, images appariées par rang
    rang_image = f"trim=end_frame={IMAGES_OUVERTURE},settb=1/{FPS},setpts=N"
    lancer(["ffmpeg", "-v", "error", "-i", Path(video).resolve(), "-i", Path(ouverture).resolve(),
            "-lavfi", f"[0:v]{rang_image}[a];[1:v]{rang_image}[b];[a][b]psnr=stats_file=psnr.txt",
            "-f", "null", "-"], cwd=tmp)
    psnr = []
    for l in (tmp / "psnr.txt").read_text().splitlines():
        champs = dict(c.split(":", 1) for c in l.split())
        psnr.append(float(champs["psnr_avg"]))
    finis = [p for p in psnr if p != float("inf")]
    moyenne = sum(finis) / len(finis) if finis else float("inf")
    ligne(f"PSNR images 0 à {IMAGES_OUVERTURE - 1} face à {Path(ouverture).name}",
          f"mini {fr(min(psnr))} dB, moyenne {fr(moyenne)} dB sur {len(psnr)} images",
          len(psnr) == IMAGES_OUVERTURE and min(psnr) >= 40)

    # Cartons, mesurés sur l'image du milieu de chaque carton, encre à 50 %.
    # La ligne de base vient du calage vertical sur le PNG, posé à
    # LIGNE_DE_BASE_Y par construction ; le recouvrement vérifie le texte.
    milieux = [debut + duree_c // 2 for debut, duree_c in zip(debuts_cartons(), DUREES_CARTONS)]
    images = extraire_images(video, milieux, tmp, "controle")
    for k, (indice, (masque_png, _), (fond, encre), texte) in enumerate(
            zip(milieux, masques, COULEURS, TEXTES), 1):
        rvb = np.asarray(Image.open(images[indice]).convert("RGB")).astype(float)
        fond_mesure = np.median(rvb[:200].reshape(-1, 3), axis=0)
        gris_fond, gris_encre = sum(fond) / 3, sum(encre) / 3
        encre_video = np.abs(rvb.mean(axis=2) - gris_fond) >= abs(gris_encre - gris_fond) / 2
        encre_png = np.asarray(masque_png) >= 128
        mv, mp = mesurer(encre_video), mesurer(encre_png)
        base = LIGNE_DE_BASE_Y + decalage_vertical(encre_png, encre_video)
        recouvrement = (encre_video & encre_png).sum() / (encre_video | encre_png).sum()
        ok = (np.abs(fond_mesure - np.array(fond)).max() <= 2 and mv["une_ligne"]
              and abs(mv["centre"] - CENTRE_X) <= 3 and base == LIGNE_DE_BASE_Y
              and mv["largeur"] <= LARGEUR_ENCRE_MAX and recouvrement >= 0.95)
        ligne(f"Carton {k} « {texte} » (image {indice})",
              f"fond {tuple(int(c) for c in fond_mesure)} ; encre x {mv['gauche']} à "
              f"{mv['droite']} ({mv['largeur']} px), centre {fr(mv['centre'])}, "
              f"y {mv['haut']} à {mv['bas']}, ligne de base {base}, "
              f"{'une ligne' if mv['une_ligne'] else 'PLUSIEURS LIGNES'} ; "
              f"recouvrement du PNG {fr(100 * recouvrement)} % ; PNG seul : {mp['largeur']} px, "
              f"centre {fr(mp['centre'])}, y {mp['haut']} à {mp['bas']}", ok)

    # Audio, décodé sur l'axe où la première image de chaque fichier est à t = 0
    echantillons = round(DUREE_CONTROLE_AUDIO * 44100)

    def pcm(chemin):
        v_, _, f_ = sonder(chemin)
        res = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{debut_video(v_, f_):.6f}",
                              "-i", str(chemin), "-map", "0:a:0",
                              "-af", "aresample=async=1:first_pts=0",
                              "-t", str(DUREE_CONTROLE_AUDIO), "-f", "f32le", "-ac", "2",
                              "-ar", "44100", "-"], capture_output=True, check=True)
        return np.frombuffer(res.stdout, dtype="<f4").reshape(-1, 2).astype(np.float64)

    rendu, ref = pcm(video), pcm(reference)
    longueurs = (len(rendu), len(ref))
    nb = min(longueurs)
    rendu, ref = rendu[:nb], ref[:nb]
    r_total = np.corrcoef(rendu.ravel(), ref.ravel())[0, 1]
    r_canaux = [np.corrcoef(rendu[:, c], ref[:, c])[0, 1] for c in (0, 1)]
    m_rendu, m_ref = rendu.mean(axis=1), ref.mean(axis=1)
    taille_fft = 1 << (2 * nb - 1).bit_length()
    croisee = np.fft.irfft(np.fft.rfft(m_rendu, taille_fft) * np.conj(np.fft.rfft(m_ref, taille_fft)),
                           taille_fft)
    decalages = np.r_[0:2205, -2205:0]
    decalage = int(decalages[np.argmax(croisee[decalages])])
    ligne(f"Audio face à la référence, de 0 à {fr(DUREE_CONTROLE_AUDIO)} s",
          f"corrélation {fr(r_total, 4)} ; gauche {fr(r_canaux[0], 4)}, droite "
          f"{fr(r_canaux[1], 4)} ; décalage {decalage} échantillon(s) ; longueurs "
          f"{longueurs[0]} et {longueurs[1]} échantillons pour {echantillons} attendus",
          r_total >= 0.99 and decalage == 0 and longueurs == (echantillons, echantillons))

    # Débuts des salves dans le rendu, après le plan d'ouverture : l'enveloppe
    # passe au-dessus de 10 % de son maximum après 0,1 s de silence.
    fenetre = 220
    enveloppe = np.sqrt(np.convolve(m_rendu ** 2, np.ones(fenetre) / fenetre, mode="same"))
    depart = round(IMAGES_OUVERTURE / FPS * 44100)
    au_dessus = enveloppe > 0.1 * enveloppe[depart:].max()
    fronts = np.where(au_dessus[1:] & ~au_dessus[:-1])[0] + 1
    silence = round(0.1 * 44100)
    debuts = [f / 44100 for f in fronts
              if f >= depart and not au_dessus[max(0, f - silence):f].any()]
    ecarts_ms = [round(1000 * (d - s)) for d, s in zip(debuts, SALVES)]
    ligne("Débuts des salves dans le rendu",
          f"{', '.join(fr(d, 3) for d in debuts)} s ; attendu {', '.join(fr(s, 3) for s in SALVES)} s ; "
          f"écarts {ecarts_ms} ms",
          len(debuts) == len(SALVES) and all(abs(e) <= 20 for e in ecarts_ms))

    ligne("Planche de contrôle", Path(planche).name, Path(planche).is_file())
    print("Tous les critères sont tenus." if resultat["ok"] else "Au moins un critère est en écart.")
    return resultat["ok"]


# ---------------------------------------------------------------------------

def lire_arguments():
    parseur = argparse.ArgumentParser(description="Monte la vidéo de la formation IA.")
    parseur.add_argument("--reference", default=DOSSIER / REFERENCE, type=Path)
    parseur.add_argument("--ouverture", default=DOSSIER / OUVERTURE, type=Path)
    parseur.add_argument("--sortie", default=DOSSIER, type=Path, help="dossier de sortie")
    parseur.add_argument("--audio", choices=["aac", "copie"], default="aac",
                         help="aac : réencodage AAC 128 kb/s (par défaut) ; copie : piste "
                              "de la référence reprise sans réencodage")
    parseur.add_argument("--sans-controle", action="store_true")
    return parseur.parse_args()


def verifier_ouverture(chemin):
    """Arrête le script avant le rendu si le plan d'ouverture ne convient pas."""
    video, _, _ = sonder(chemin, compter=True)
    if video is None:
        sys.exit(f"{chemin.name} n'a pas de piste vidéo.")
    largeur, hauteur = dimensions_affichees(video)
    if (largeur, hauteur) != (LARGEUR, HAUTEUR):
        sys.exit(f"{chemin.name} s'affiche en {largeur} x {hauteur}, {LARGEUR} x {HAUTEUR} "
                 f"attendu (pas de mise à l'échelle).")
    if Fraction(video.get("avg_frame_rate", "0/1")) != FPS:
        sys.exit(f"{chemin.name} tourne à {video.get('avg_frame_rate')} i/s, {FPS} attendu.")
    if int(video.get("nb_read_frames", 0)) < IMAGES_OUVERTURE:
        sys.exit(f"{chemin.name} compte moins de {IMAGES_OUVERTURE} images.")
    couleur = {video.get("color_space"), video.get("color_primaries"), video.get("color_transfer")}
    if couleur & HORS_SDR:
        sys.exit(f"{chemin.name} est en HDR ou en BT.2020 ({', '.join(sorted(couleur & HORS_SDR))}) : "
                 f"convertis-le d'abord en BT.709 SDR.")


def main():
    args = lire_arguments()
    if not (len(TEXTES) == len(DUREES_CARTONS) == len(COULEURS)):
        sys.exit("Les listes du haut du fichier doivent compter une entrée par carton.")
    for outil in ("ffmpeg", "ffprobe"):
        if shutil.which(outil) is None:
            sys.exit(f"{outil} manque. macOS : brew install ffmpeg ; Ubuntu : sudo apt install ffmpeg")

    chemin_police = trouver_police()
    print(f"Police : {chemin_police}")
    masques = preparer_cartons(Police(chemin_police))

    for source in (args.reference, args.ouverture):
        if not source.is_file():
            sys.exit(f"Source introuvable : {source}")
    verifier_ouverture(args.ouverture)
    _, a_ref, _ = sonder(args.reference)
    if a_ref is None:
        sys.exit(f"{args.reference.name} n'a pas de piste audio.")

    args.sortie.mkdir(parents=True, exist_ok=True)
    video = args.sortie / SORTIE_VIDEO
    planche = args.sortie / SORTIE_PLANCHE
    with tempfile.TemporaryDirectory() as dossier_tmp:
        tmp = Path(dossier_tmp)
        monter(args.reference, args.ouverture, masques, video, tmp, args.audio)
        print(f"Vidéo : {video}")
        fabriquer_planche(args.reference, video, planche, chemin_police, tmp)
        print(f"Planche : {planche}")
        if not args.sans_controle:
            ok = controler(video, args.reference, args.ouverture, masques, planche, tmp)
            sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
