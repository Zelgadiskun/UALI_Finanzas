"""Generador de iconos PWA para Ualí Finanzas 3.0 (Regla 70·20·10).
Dibuja el isotipo del Nido + Moneda Terracota + Brote Verde Salvia sobre
el fondo Alabastro Cálido con borde Azul Pizarra.
"""

from PIL import Image, ImageDraw

ALABASTER = (247, 245, 240, 255)  # #F7F5F0 (70%)
SLATE = (27, 38, 59, 255)         # #1B263B (70% tinta)
SAGE = (31, 122, 104, 255)        # #1F7A68 (20% identidad)
TERRA = (224, 109, 83, 255)       # #E06D53 (10% acento)


def draw_icon(size: int, corner_ratio: float = 0.24) -> Image.Image:
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Fondo redondeado en Alabastro Cálido con borde sutil en Verde Salvia
    d.rounded_rectangle(
        [0, 0, s - 1, s - 1],
        radius=int(s * corner_ratio),
        fill=ALABASTER,
        outline=SAGE,
        width=max(2, int(s * 0.03)),
    )

    # Sol / Moneda en Terracota Cálido
    cx, cy, r = int(s * 0.56), int(s * 0.48), int(s * 0.15)
    d.ellipse(
        [cx - r, cy - r, cx + r, cy + r],
        fill=TERRA,
        outline=SLATE,
        width=max(2, int(s * 0.04)),
    )

    # Tallo y hojas en Verde Salvia Esmeralda
    stem_x = int(s * 0.44)
    d.line(
        [(stem_x, int(s * 0.22)), (stem_x, int(s * 0.56))],
        fill=SLATE,
        width=max(2, int(s * 0.045)),
    )
    # Hoja derecha
    d.ellipse(
        [int(s * 0.44), int(s * 0.16), int(s * 0.66), int(s * 0.32)],
        fill=SAGE,
        outline=SLATE,
        width=max(2, int(s * 0.035)),
    )
    # Hoja izquierda
    d.ellipse(
        [int(s * 0.24), int(s * 0.24), int(s * 0.44), int(s * 0.38)],
        fill=SAGE,
        outline=SLATE,
        width=max(2, int(s * 0.035)),
    )

    # Base del Nido Protector
    d.pieslice(
        [int(s * 0.18), int(s * 0.34), int(s * 0.82), int(s * 0.84)],
        start=10,
        end=170,
        fill=SAGE,
        outline=SLATE,
        width=max(2, int(s * 0.04)),
    )

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

mask = Image.new("RGBA", (512, 512), ALABASTER)
inner = draw_icon(int(512 * 0.76))
mask.paste(inner, (int(512 * 0.12), int(512 * 0.12)), inner)
mask.convert("RGB").save("public/icon-512-maskable.png")

print("Iconos PWA de Uali 3.0 regenerados con exito.")
