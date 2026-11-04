from PIL import Image, ImageDraw
import os

ROOT = r"C:\Users\wang\Documents\deepseek-harness\default-workspace\godot-digital-world"
OUT = os.path.join(ROOT, "assets", "creatures")

def px(d, x, y, w, h, color):
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=color)

def sprite(name, body, shade, accent, ink, kind, frame):
    im = Image.new("RGBA", (24, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    bob = frame
    px(d, 4, 28, 16, 3, (5, 14, 22, 80))
    # tail / wings / special appendages
    if kind == "dragon":
        px(d, 18, 18 + bob, 5, 4, shade); px(d, 21, 15 + bob, 2, 4, body)
    if kind == "bird":
        px(d, 2, 13 + bob, 6, 9, accent); px(d, 17, 13 + bob, 6, 9, accent)
    if kind == "plant":
        px(d, 9, 2 + bob, 6, 5, "#ff91c8"); px(d, 6, 3 + bob, 4, 4, "#ffb3d8"); px(d, 14, 3 + bob, 4, 4, "#ffb3d8")
    if kind == "seal":
        px(d, 2, 20 + bob, 7, 4, accent); px(d, 15, 20 + bob, 7, 4, accent)
    # legs
    px(d, 6, 25 + bob, 5, 4, shade); px(d, 14, 25 + bob, 5, 4, shade)
    # body
    px(d, 5, 12 + bob, 15, 15, ink)
    px(d, 6, 13 + bob, 13, 13, body)
    px(d, 9, 19 + bob, 7, 6, accent)
    # head
    px(d, 6, 3 + bob, 13, 12, ink)
    px(d, 7, 4 + bob, 11, 10, body)
    # ears / horn / head features
    if kind == "dragon":
        px(d, 8, 0 + bob, 3, 5, shade); px(d, 15, 0 + bob, 3, 5, shade)
        px(d, 9, 13 + bob, 3, 1, accent)
    elif kind == "beast":
        px(d, 7, 1 + bob, 4, 4, shade); px(d, 15, 1 + bob, 4, 4, shade)
        px(d, 17, 2 + bob, 3, 3, accent) # horn
    elif kind == "bird":
        px(d, 7, 1 + bob, 4, 5, accent); px(d, 15, 1 + bob, 4, 5, accent)
    elif kind == "plant":
        px(d, 10, 0 + bob, 5, 5, "#ff70b5")
    elif kind == "seal":
        px(d, 6, 1 + bob, 13, 3, "#9d7bd8")
    # eyes
    px(d, 9, 8 + bob, 2, 3, ink); px(d, 14, 8 + bob, 2, 3, ink)
    px(d, 10, 8 + bob, 1, 1, "#ffffff"); px(d, 15, 8 + bob, 1, 1, "#ffffff")
    # mouth / special
    if kind == "bird":
        px(d, 11, 13 + bob, 4, 2, "#ffd35e")
    else:
        px(d, 11, 13 + bob, 3, 1, ink)
    if kind == "dragon":
        px(d, 4, 16 + bob, 3, 3, shade); px(d, 18, 16 + bob, 3, 3, shade)
    return im

specs = [
    ("agumon", "#ffa24d", "#e87838", "#ffe4a5", "#4c2412", "dragon"),
    ("gabumon", "#83d2ef", "#3f9bc4", "#f4f6ff", "#173b4e", "beast"),
    ("patamon", "#f2b268", "#d88b43", "#fff1d2", "#4a2a18", "beast"),
    ("palmon", "#7ed957", "#3fa846", "#d9ffd1", "#193d22", "plant"),
    ("gomamon", "#eef4ff", "#c17edb", "#ff9e58", "#2e2747", "seal"),
    ("biyomon", "#ff9ccf", "#e567a6", "#69c7ff", "#4e1736", "bird"),
]
for name, body, shade, accent, ink, kind in specs:
    for frame in range(2):
        sprite(name, body, shade, accent, ink, kind, frame).save(os.path.join(OUT, f"{name}_f{frame}.png"))
print("digimon sprites generated")
