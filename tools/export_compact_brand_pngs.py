from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]

BG = "#0b0d10"
TEAL = "#14a3b8"
WHITE = "#f3f0ea"


def load_font(size: int, bold: bool = False):
    candidates = [
        "arialbd.ttf" if bold else "arial.ttf",
        "segoeuib.ttf" if bold else "segoeui.ttf",
    ]
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def scale_points(points, scale, offset_x=0, offset_y=0):
    return [(offset_x + x * scale, offset_y + y * scale) for x, y in points]


def draw_mark(image: Image.Image, include_wordmark: bool = False):
    draw = ImageDraw.Draw(image, "RGBA")
    w, h = image.size
    radius = int(w * 0.22)
    draw.rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=BG)

    if include_wordmark:
      icon_scale = w / 128 * 0.62
      icon_x = w * 0.08
      icon_y = h * 0.14
    else:
      icon_scale = w / 128 * 0.72
      icon_x = (w - 84 * icon_scale) / 2
      icon_y = h * 0.12

    outer = [(42, 0), (72, 17), (72, 51), (42, 68), (12, 51), (12, 17)]
    inner = [(42, 13), (61, 24), (61, 45), (42, 56), (23, 45), (23, 24)]
    draw.polygon(scale_points(inner, icon_scale, icon_x, icon_y), fill=(20, 163, 184, 40))
    draw.line(scale_points(outer + [outer[0]], icon_scale, icon_x, icon_y), fill=TEAL, width=max(2, int(icon_scale * 3.2)))

    # H bars
    bars = [
        (32, 21, 38, 49),
        (46, 21, 52, 49),
        (32, 32, 52, 38),
    ]
    for x1, y1, x2, y2 in bars:
        draw.rounded_rectangle(
            (icon_x + x1 * icon_scale, icon_y + y1 * icon_scale, icon_x + x2 * icon_scale, icon_y + y2 * icon_scale),
            radius=max(1, int(icon_scale * 1.2)),
            fill=TEAL,
        )

    teeth = [
        ((42, -7), (42, 4)),
        ((42, 64), (42, 75)),
        ((2, 34), (13, 34)),
        ((71, 34), (82, 34)),
    ]
    for (x1, y1), (x2, y2) in teeth:
        draw.line(
            scale_points([(x1, y1), (x2, y2)], icon_scale, icon_x, icon_y),
            fill=TEAL,
            width=max(2, int(icon_scale * 3.2)),
        )

    if include_wordmark:
        hbk_font = load_font(int(h * 0.17), bold=True)
        sub_font = load_font(int(h * 0.053), bold=True)
        text_x = int(w * 0.39)
        draw.text((text_x, int(h * 0.27)), "HBK", fill=WHITE, font=hbk_font)
        draw.text((text_x + 2, int(h * 0.50)), "CUSTOMS INC.", fill="#8e98a3", font=sub_font)
    else:
        hbk_font = load_font(int(h * 0.14), bold=True)
        text = "HBK"
        bbox = draw.textbbox((0, 0), text, font=hbk_font)
        text_w = bbox[2] - bbox[0]
        text_x = (w - text_w) / 2
        draw.text((text_x, int(h * 0.80)), text, fill=WHITE, font=hbk_font)


def export(name: str, size: int, include_wordmark: bool = False):
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_mark(image, include_wordmark=include_wordmark)
    image.save(ROOT / name)


def main():
    export("social-profile-square-500.png", 500, include_wordmark=False)
    export("social-profile-square-1200.png", 1200, include_wordmark=False)
    export("profile-square-250.png", 250, include_wordmark=False)
    export("brand-card-square-800.png", 800, include_wordmark=True)


if __name__ == "__main__":
    main()
