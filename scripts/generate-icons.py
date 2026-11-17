"""Generate the home screen PNGs with Pillow 13.0.0."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
INK = "#873b65"
CREAM = "#fff6fa"
PETAL = "#f399bf"
BACKGROUND = "#a24374"
ART_SIZE = 1024


def draw_icon(maskable):
    image = Image.new("RGB", (ART_SIZE, ART_SIZE), BACKGROUND)
    draw = ImageDraw.Draw(image)
    # Keep the full motif inside the central 40% radius on adaptive launchers.
    scale = 1.62 if maskable else 2

    def coords(*values):
        return tuple(round(ART_SIZE / 2 + (value - 256) * scale) for value in values)

    draw.rounded_rectangle(coords(107, 183, 405, 365), radius=round(36 * scale), fill=CREAM)
    draw.rounded_rectangle(coords(163, 147, 254, 218), radius=round(23 * scale), fill=CREAM)
    draw.ellipse(coords(181, 198, 331, 348), fill=INK)
    draw.ellipse(coords(205, 222, 307, 324), fill=PETAL)
    draw.ellipse(coords(222, 239, 290, 307), fill=INK)
    draw.ellipse(coords(237, 250, 256, 269), fill=CREAM)
    draw.ellipse(coords(352, 211, 376, 235), fill=PETAL)
    draw.polygon(coords(349, 107, 360, 134, 387, 145, 360, 156,
                        349, 183, 338, 156, 311, 145, 338, 134), fill=CREAM)
    return image


def main():
    output = ROOT / "icons"
    output.mkdir(exist_ok=True)
    icon = draw_icon(maskable=False)
    for size in (180, 192, 512):
        icon.resize((size, size), Image.Resampling.LANCZOS).save(output / f"moe-{size}.png", optimize=True)
    draw_icon(maskable=True).resize((512, 512), Image.Resampling.LANCZOS).save(
        output / "moe-maskable-512.png", optimize=True
    )


if __name__ == "__main__":
    main()
