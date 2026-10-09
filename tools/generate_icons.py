"""Génère les icônes de Matheasy (40 px et 80 px) dans resources/icons/ à partir du logo JFB4PLAI
(resources/jfb4plai-logo.png). Le logo est recadré sur son cercle, l'extérieur du cercle devient
transparent (lisible sur thème clair comme sombre). Nécessite Pillow."""
from PIL import Image, ImageDraw
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'resources', 'jfb4plai-logo.png')
DST = os.path.join(ROOT, 'resources', 'icons')


def circle_bbox(img):
    """Plus petit carré contenant tous les pixels non blancs (le cercle bleu et son contenu)."""
    px = img.load()
    w, h = img.size
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and (r < 200 or g < 200 or b < 200):
                xs.append(x)
                ys.append(y)
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    half = max(max(xs) - min(xs), max(ys) - min(ys)) / 2 + 2
    return (int(cx - half), int(cy - half), int(cx + half) + 1, int(cy + half) + 1)


def create_icon(src, size, path):
    big = 8 * size  # masque calculé en grand puis réduit : bord du cercle lisse
    img = src.resize((big, big), Image.LANCZOS)
    mask = Image.new('L', (big, big), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, big - 1, big - 1], fill=255)
    img.putalpha(mask)
    img.resize((size, size), Image.LANCZOS).save(path, 'PNG')
    print('Créé', path, size)


src = Image.open(SRC).convert('RGBA')
src = src.crop(circle_bbox(src))
os.makedirs(DST, exist_ok=True)
create_icon(src, 40, os.path.join(DST, 'icon.png'))
create_icon(src, 80, os.path.join(DST, 'icon@2x.png'))
