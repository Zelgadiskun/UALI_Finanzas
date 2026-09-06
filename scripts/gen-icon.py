"""One-off icon generator for the PWA manifest — run manually, not part of
the build. Draws a simple wallet glyph (rounded card + coin) on the brand
indigo background at each size the manifest/HTML need, plus favicon.ico.
Proper native app-store icons come later, from Capacitor's own asset
pipeline in Phase 8 — this only has to satisfy "installable PWA" checks.
"""

from PIL import Image, ImageDraw

BRAND = (44, 63, 209, 255)  # #2c3fd1
WHITE = (255, 255, 255, 255)
GOLD = (201, 134, 10, 255)  # #c9860a


def draw_icon(size: int, corner_ratio: float = 0.22) -> Image.Image:
    # Draw at 4x and downscale for clean anti-aliased edges.
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * corner_ratio), fill=BRAND)

    # Wallet body.
    wx0, wy0, wx1, wy1 = int(s * 0.20), int(s * 0.32), int(s * 0.80), int(s * 0.72)
    d.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(s * 0.06), fill=WHITE)

    # Fold flap shadow line for a little depth.
    d.rounded_rectangle(
        [wx0, wy0, wx1, wy0 + int(s * 0.10)],
        radius=int(s * 0.06),
        fill=(255, 255, 255, 255),
        outline=(30, 40, 140, 60),
        width=max(1, int(s * 0.004)),
    )

    # Coin/clasp circle.
    cx, cy, r = int(s * 0.635), int(s * 0.52), int(s * 0.09)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GOLD)

    return img.resize((size, size), Image.LANCZOS)


sizes = [16, 32, 180, 192, 512]
imgs = {}
for sz in sizes:
    im = draw_icon(sz)
    imgs[sz] = im
    im.save(f"public/icon-{sz}.png")

imgs[192].convert("RGB").save(
    "public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
)

# Maskable icon: same art, but with generous safe-area padding (per the
# maskable-icon spec, only the inner ~80% is guaranteed visible once the
# OS applies its own mask shape).
mask = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
d = ImageDraw.Draw(mask)
d.rectangle([0, 0, 511, 511], fill=BRAND)
inner = draw_icon(int(512 * 0.7))
mask.paste(inner, (int(512 * 0.15), int(512 * 0.15)), inner)
mask.convert("RGB").save("public/icon-512-maskable.png")

print("done")
