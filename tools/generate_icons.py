"""Génère les icônes PLAI de Matheasy (40 px et 80 px) dans resources/icons/. Nécessite Pillow."""
from PIL import Image, ImageDraw, ImageFont
import os

DST = os.path.join(os.path.dirname(__file__), '..', 'resources', 'icons')
FONTS = [
    'C:/Windows/Fonts/arialbd.ttf', 'C:/Windows/Fonts/arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
]

def load_font(size, bold=True):
    names = [f for f in FONTS if (('bd' in f.lower() or 'bold' in f.lower()) == bold)] + FONTS
    for f in names:
        try:
            return ImageFont.truetype(f, size)
        except Exception:
            continue
    return ImageFont.load_default()

def create_icon(size, path):
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    margin = max(1, size // 20)
    draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=size // 6,
                           fill=(255, 255, 255, 245), outline=(200, 200, 200, 255), width=max(1, size // 40))
    pink, black, grey = (233, 30, 144), (30, 30, 30), (120, 120, 120)
    font = load_font(int(size * 0.34), True)
    font_s = load_font(int(size * 0.16), False)

    # Signe « = » (deux barres roses) au-dessus de PLAI : rappel des mathématiques
    bar_h = max(2, size // 14)
    bar_w = int(size * 0.34)
    x0 = (size - bar_w) // 2
    y0 = int(size * 0.12)
    for k in range(2):
        y = y0 + k * (bar_h + max(1, size // 30))
        draw.rounded_rectangle([x0, y, x0 + bar_w, y + bar_h], radius=max(1, bar_h // 3), fill=pink)

    text, colors = 'PLAI', [black, black, pink, black]
    spacing = max(0, size // 60)
    widths = [draw.textbbox((0, 0), ch, font=font)[2] - draw.textbbox((0, 0), ch, font=font)[0] for ch in text]
    total = sum(widths) + spacing * (len(text) - 1)
    tx, ty = (size - total) // 2, int(size * 0.34)
    for ch, col, w in zip(text, colors, widths):
        draw.text((tx, ty), ch, fill=col, font=font)
        tx += w + spacing

    sub = 'Math'
    sb = draw.textbbox((0, 0), sub, font=font_s)
    draw.text(((size - (sb[2] - sb[0])) // 2, int(size * 0.74)), sub, fill=grey, font=font_s)
    img.save(path, 'PNG')
    print('Créé', path, size)

os.makedirs(DST, exist_ok=True)
create_icon(40, os.path.join(DST, 'icon.png'))
create_icon(80, os.path.join(DST, 'icon@2x.png'))
