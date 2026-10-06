"""Generate the alpha sidecar for a transparent PNG; default creates demo only if missing."""
from pathlib import Path
import argparse
import base64
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SIZE = 80


def demo(path):
    image = Image.new('RGBA', (640, 640))
    draw = ImageDraw.Draw(image)
    font_path = 'C:/Windows/Fonts/meiryo.ttc'
    large = ImageFont.truetype(font_path, 64)
    small = ImageFont.truetype(font_path, 30)
    draw.rounded_rectangle((95, 38, 545, 116), radius=22, fill='#f6eedb', outline='#685139', width=6)
    draw.text((320, 77), '赤 → 黄 → 青', font=small, anchor='mm', fill='#352b22')
    colors = ['#929b83', '#368fbe', '#cdd1c2', '#ddbd39', '#d95d53', '#a388b0']
    letters = ['ほ', 'き', 'り', 'せ', 'か', 'ね']
    for i, (color, letter) in enumerate(zip(colors, letters)):
        cx, cy = 155 + (i % 3) * 165, 237 + (i // 3) * 165
        # Equal filled contours prevent a scan from identifying either colour or glyph.
        draw.rounded_rectangle((cx - 60, cy - 60, cx + 60, cy + 60), radius=40, fill=color, outline='#f8eed6', width=7)
        draw.text((cx, cy - 4), letter, font=large, anchor='mm', fill='#29241e')
    draw.rounded_rectangle((155, 515, 485, 597), radius=22, fill='#f6eedb', outline='#685139', width=6)
    draw.text((320, 553), '□ □ □', font=small, anchor='mm', fill='#352b22')
    image.save(path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('image', nargs='?', default='images/fossil.png')
    args = parser.parse_args()
    path = ROOT / args.image
    if not path.exists():
        if args.image != 'images/fossil.png':
            raise FileNotFoundError(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        demo(path)
    with Image.open(path) as source:
        image = source.convert('RGBA')
        w, h = image.size
        side = max(w, h)
        square = Image.new('RGBA', (side, side))
        square.paste(image, ((side - w) // 2, (side - h) // 2))
        alpha = square.getchannel('A').resize((SIZE, SIZE), Image.Resampling.BOX).tobytes()
        if not any(alpha):
            raise ValueError('The image is fully transparent')
        if all(a == 255 for a in alpha):
            raise ValueError('A transparent background is required')
        data = dict(image=args.image.replace('\\', '/'), width=w, height=h, size=SIZE, alpha=base64.b64encode(alpha).decode('ascii'))
        (ROOT / 'images/fossil-mask.js').write_text('window.FOSSIL_MASK = ' + json.dumps(data, separators=(',', ':')) + ';\n', encoding='utf-8')
        print(f'{path.name}: {w}x{h}, alpha mask {SIZE}x{SIZE}, opaque area {sum(alpha) / 255:.1f} cells')


if __name__ == '__main__':
    main()
