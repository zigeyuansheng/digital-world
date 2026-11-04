from PIL import Image, ImageDraw
import os, math, random

ROOT = r"C:\Users\wang\Documents\deepseek-harness\default-workspace"
W, H = 640, 360
im = Image.new("RGB", (W, H), (27, 91, 156))
d = ImageDraw.Draw(im)

def px(x, y, w, h, c): d.rectangle([x, y, x+w-1, y+h-1], fill=c)

# Sky gradient, banded like the game's clean background.
sky = ["#1c5a9b", "#2367a7", "#2b75b1", "#3a8bc0", "#58a6d2", "#79c1e3", "#9bd8ed"]
for i, c in enumerate(sky):
    y0 = int(i * H * 0.20)
    y1 = int((i+1) * H * 0.20) + 1
    px(0, y0, W, max(1, y1-y0), c)

# Pixel clouds: blocky white puffs with cool shadow.
def cloud(x, y, s=1, tint="#e9f5ef"):
    blocks = [(0,14,28,8),(8,7,24,10),(18,2,24,10),(32,10,28,9),(44,17,20,6)]
    for bx,by,bw,bh in blocks:
        px(x+bx*s, y+by*s, bw*s, bh*s, tint)
    px(x+4*s, y+18*s, 54*s, 3*s, "#b7d8e5")
    px(x+12*s, y+20*s, 34*s, 2*s, "#a7cddd")

cloud(74, 48, 1)
cloud(408, 76, 1)
cloud(248, 118, 1)

# Distant mountain layers.
def poly(points, color):
    d.polygon(points, fill=color)
# far blue ridge
poly([(0,205),(74,160),(132,190),(198,146),(260,198),(330,160),(404,196),(470,152),(548,190),(640,158),(640,250),(0,250)], "#25516f")
poly([(0,226),(90,192),(168,222),(244,184),(330,220),(410,190),(490,218),(570,188),(640,218),(640,270),(0,270)], "#2d6380")
# dark treeline at horizon
random.seed(10)
for x in range(0,W,18):
    h = 12 + (x*13 % 20)
    poly([(x, 252),(x+10, 252-h),(x+20, 252)], "#1d4f3c")
px(0, 248, W, 8, "#2b6245")
px(0, 255, W, 7, "#387a4e")

# Meadow bands.
px(0, 258, W, 24, "#5f9f53")
px(0, 275, W, 32, "#6bae5a")
px(0, 300, W, 60, "#7fc267")
px(0, 330, W, 30, "#91d174")

# A winding pale path.
path = [(292, 258),(310, 258),(326, 275),(346, 300),(356, 330),(364, 360),(300, 360),(300, 330),(286, 300),(272, 275),(260, 258)]
d.polygon(path, fill="#cda86b")
# path edge shadow
d.line([(292,258),(274,276),(294,303),(308,360)], fill="#a78055", width=2)
d.line([(310,258),(328,278),(354,304),(364,360)], fill="#e4c58c", width=2)

# Flower meadow clusters.
random.seed(27)
flower_colors = ["#ef7e9f", "#f6e36a", "#f4f0d8", "#d998e8"]
for i in range(160):
    x = 8 + random.randrange(0, W-16)
    y = 270 + random.randrange(0, 84)
    if 260 <= x <= 370 and y > 255:
        continue
    px(x, y, 1, 4, "#3f7c42")
    c = flower_colors[i % len(flower_colors)]
    px(x-1, y-2, 3, 2, c)
    px(x, y-1, 1, 1, "#fff3a8" if c != "#f4f0d8" else "#e9c45c")
# grass blades
for i in range(130):
    x = random.randrange(0, W)
    y = 265 + random.randrange(0, 90)
    if 258 <= x <= 370 and y < 310: continue
    px(x, y, 1, 3 + random.randrange(0,3), "#4c934c")
    px(x+1, y, 1, 2, "#a5dd75")

# Big foreground pine, using the layered silhouette language of the game's
# clean-day background rather than generic round blobs.
def tree(x, y, scale=1.0):
    s = scale
    cx = int(x + 70 * s)
    # trunk and roots
    px(cx - int(6*s), int(y + 160*s), int(12*s), int(105*s), "#513322")
    px(cx - int(3*s), int(y + 160*s), int(3*s), int(105*s), "#7e5838")
    px(cx - int(28*s), int(y + 245*s), int(56*s), int(7*s), "#513322")
    # layered pine tiers, dark outline first
    for i in range(7):
        top = int(y + (8 + i*24)*s)
        half = int((20 + i*14)*s)
        stem = int(15*s)
        d.polygon([(cx-half, top+int(34*s)), (cx, top), (cx+half, top+int(34*s)),
                   (cx+int(8*s), top+int(34*s)), (cx-int(8*s), top+int(34*s))], fill="#173f2b")
        d.polygon([(cx-half+int(4*s), top+int(30*s)), (cx, top+int(7*s)), (cx+half-int(4*s), top+int(30*s)),
                   (cx+int(8*s), top+int(30*s))], fill="#245d3b")
        # left and right green shelves
        px(cx-half+int(4*s), top+int(24*s), int(28*s), int(8*s), "#2d7546")
        px(cx-int(24*s), top+int(24*s), int(28*s), int(8*s), "#3a8b50")
    # trunk branch stubs visible through canopy
    px(cx - int(24*s), int(y+132*s), int(48*s), int(7*s), "#513322")
    px(cx - int(16*s), int(y+142*s), int(32*s), int(5*s), "#7e5838")
    # highlights / ragged tips
    for i in range(8):
        px(cx - int(26*s) + int(i*6*s), int(y + (18 + (i%3)*21)*s), int(6*s), int(4*s), "#4fa65e")
        px(cx + int(8*s) + int(i*4*s), int(y + (28 + (i%2)*17)*s), int(5*s), int(4*s), "#6bc477")

tree(12, 38, 1.0)
# smaller tree right
tree(520, 120, 0.55)

# small signpost on path
px(300, 302, 2, 24, "#5b3e28")
px(286, 298, 30, 12, "#d9a55c")
px(289, 301, 24, 2, "#7a4c2b")
px(289, 305, 17, 2, "#7a4c2b")

# Save the clean background separately for the Godot scene (no baked actors).
bg_out = os.path.join(ROOT, "digitalpartner_backgrounds", "field_background.png")
im.copy().save(bg_out)

# Put actual Digimon sprites in the meadow (native pixel scale).
sprite_dir = os.path.join(ROOT, "digitalpartner_sprites")
placements = [
    ("Agumon_f0.png", 140, 280, 0.8),
    ("Gabumon_f0.png", 205, 294, 0.8),
    ("Patamon_f0.png", 360, 286, 0.85),
    ("Palmon_f0.png", 430, 300, 0.8),
    ("Gomamon_f0.png", 484, 282, 0.8),
    ("Piyomon_f0.png", 90, 310, 0.8),
]
for name, x, y, scale in placements:
    spr = Image.open(os.path.join(sprite_dir, name)).convert("RGBA")
    spr = spr.resize((max(1, round(spr.width*scale)), max(1, round(spr.height*scale))), Image.Resampling.NEAREST)
    # shadow
    shadow = Image.new("RGBA", (spr.width+10, 7), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([1,1, shadow.width-2, 6], fill=(10,25,20,85))
    im.paste(shadow, (x + (spr.width-shadow.width)//2, y + spr.height - 3), shadow)
    im.paste(spr, (x, y), spr)

# Foreground grass blades overlapping feet.
for i in range(70):
    x = random.randrange(0, W)
    y = 340 + random.randrange(0, 18)
    px(x, y, 1, 4, "#3f8d4b")
    px(x+1, y, 1, 3, "#69b75d")

# Very subtle sky dithering dots.
for i in range(180):
    x = random.randrange(0, W)
    y = random.randrange(0, 170)
    if (x + y) % 7 == 0:
        px(x, y, 1, 1, "#3c86ba" if y < 100 else "#7fc4df")

out = os.path.join(ROOT, "digitalpartner_backgrounds", "field_scene_concept.png")
im.save(out)
print(out, im.size)
