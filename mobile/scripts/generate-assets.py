"""Generate app icon and splash screen assets for App Store submission."""
import math
import os
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets')


def draw_poker_chip(draw, cx, cy, chip_radius, dash_width, bg_color):
    """Draw a poker chip with alternating green/white edge dashes."""
    dash_count = 20
    for i in range(dash_count):
        angle_start = (i / dash_count) * 360
        angle_end = ((i + 0.5) / dash_count) * 360
        color = '#34C759' if i % 2 == 0 else '#FFFFFF'
        # Draw arc segment as a thick arc
        bbox = [cx - chip_radius, cy - chip_radius, cx + chip_radius, cy + chip_radius]
        draw.arc(bbox, start=angle_start - 90, end=angle_end - 90, fill=color, width=dash_width)

    # Inner filled circle
    inner_r = chip_radius - dash_width // 2 - 4
    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], fill=bg_color)

    # Inner ring accents
    ring_r1 = inner_r - 6
    draw.ellipse([cx - ring_r1, cy - ring_r1, cx + ring_r1, cy + ring_r1], outline='#34C759', width=3)
    ring_r2 = int(chip_radius * 0.55)
    draw.ellipse([cx - ring_r2, cy - ring_r2, cx + ring_r2, cy + ring_r2], outline='#34C759', width=3)


def draw_spade(draw, cx, cy, size, color='#FFFFFF'):
    """Draw a spade suit symbol using shapes."""
    s = size
    # Top part: two circles forming the rounded top of the spade
    circle_r = int(s * 0.28)
    circle_offset_x = int(s * 0.18)
    circle_offset_y = int(s * 0.05)

    # Main body triangle (pointing up)
    top_y = cy - int(s * 0.48)
    bottom_y = cy + int(s * 0.15)

    # Draw the spade as a polygon + circles
    # Two upper circles
    lx = cx - circle_offset_x
    rx = cx + circle_offset_x
    circle_cy = cy + circle_offset_y

    draw.ellipse([lx - circle_r, circle_cy - circle_r, lx + circle_r, circle_cy + circle_r], fill=color)
    draw.ellipse([rx - circle_r, circle_cy - circle_r, rx + circle_r, circle_cy + circle_r], fill=color)

    # Triangle pointing up from circles to top
    draw.polygon([
        (cx, top_y),
        (cx - int(s * 0.38), circle_cy + int(circle_r * 0.4)),
        (cx + int(s * 0.38), circle_cy + int(circle_r * 0.4)),
    ], fill=color)

    # Fill between circles
    draw.rectangle([lx, circle_cy - circle_r // 2, rx, circle_cy + circle_r], fill=color)

    # Stem
    stem_w = int(s * 0.08)
    stem_top = circle_cy + circle_r // 2
    stem_bottom = cy + int(s * 0.48)
    draw.rectangle([cx - stem_w, stem_top, cx + stem_w, stem_bottom], fill=color)

    # Stem base flare
    flare_w = int(s * 0.18)
    flare_h = int(s * 0.06)
    draw.ellipse([cx - flare_w, stem_bottom - flare_h, cx + flare_w, stem_bottom + flare_h], fill=color)


def generate_icon():
    size = 1024
    img = Image.new('RGBA', (size, size), '#1C1C1E')
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2
    draw_poker_chip(draw, cx, cy, 380, 48, '#1C1C1E')
    draw_spade(draw, cx, cy - 30, 360)

    # "CP" text
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 80)
    except (OSError, IOError):
        font = ImageFont.load_default()
    draw.text((cx, cy + 200), 'CP', fill='#34C759', font=font, anchor='mm')

    img.save(os.path.join(ASSETS_DIR, 'icon.png'))
    print('Generated icon.png (1024x1024)')


def generate_splash():
    width, height = 1284, 2778
    img = Image.new('RGBA', (width, height), '#000000')
    draw = ImageDraw.Draw(img)

    cx = width // 2
    cy = height // 2 - 100

    draw_poker_chip(draw, cx, cy, 180, 24, '#000000')
    draw_spade(draw, cx, cy - 15, 180)

    # App name
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 56)
    except (OSError, IOError):
        font = ImageFont.load_default()
    draw.text((cx, cy + 280), 'Chelsea Poker', fill='#FFFFFF', font=font, anchor='mm')

    img.save(os.path.join(ASSETS_DIR, 'splash.png'))
    print('Generated splash.png (1284x2778)')


def generate_adaptive_icon():
    size = 1024
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2
    draw_poker_chip(draw, cx, cy, 320, 40, '#1C1C1E')
    draw_spade(draw, cx, cy - 25, 300)

    try:
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 64)
    except (OSError, IOError):
        font = ImageFont.load_default()
    draw.text((cx, cy + 170), 'CP', fill='#34C759', font=font, anchor='mm')

    img.save(os.path.join(ASSETS_DIR, 'adaptive-icon.png'))
    print('Generated adaptive-icon.png (1024x1024)')


if __name__ == '__main__':
    os.makedirs(ASSETS_DIR, exist_ok=True)
    generate_icon()
    generate_splash()
    generate_adaptive_icon()
    print('All assets generated!')
