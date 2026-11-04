from PIL import Image, ImageDraw
import os, math, random

ROOT = r"C:\Users\wang\Documents\deepseek-harness\default-workspace\godot-digital-world"
TILE = 16

def px(draw, x, y, w, h, color):
    draw.rectangle([x, y, x + w - 1, y + h - 1], fill=color)

def make_tile(kind, variant=0, frame=0):
    im = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if kind == "grass":
        base = ["#73c85a", "#6bc151", "#7bce61", "#65b94c"][variant % 4]
        d.rectangle([0, 0, 15, 15], fill=base)
        # small pixel blades / speckles
        for i in range(11):
            x = (i * 5 + variant * 3) % 14
            y = (i * 7 + variant) % 13
            d.point((x, y), fill=["#8adf6c", "#5aa845", "#94e878"][i % 3])
        px(d, 3 + variant, 10, 2, 3, "#57a743")
        px(d, 10, 3 + variant % 2, 2, 2, "#8ade6c")
        px(d, 8, 12, 3, 1, "#4c963c")
    elif kind == "path":
        d.rectangle([0, 0, 15, 15], fill=["#d9b778", "#d1ad6d", "#e2c184"][variant % 3])
        for i in range(6):
            x = (i * 3 + variant * 2) % 13
            y = (i * 5 + variant) % 13
            px(d, x, y, 2, 1, "#b48953")
        px(d, 4 + variant, 11, 2, 1, "#efd79c")
    elif kind == "tall":
        d.rectangle([0, 0, 15, 15], fill="#3f8a44")
        for i in range(6):
            x = 2 + i * 2
            shift = (frame * 2 + i) % 2
            px(d, x + shift, 4, 1, 9, "#5bad55")
            px(d, x + shift, 2, 2, 3, "#8bd86d")
        px(d, 0, 13, 16, 3, "#34743a")
    elif kind == "water":
        d.rectangle([0, 0, 15, 15], fill="#3f9ec9")
        px(d, 0, 14, 16, 2, "#2b7ea6")
        shift = (frame * 4) % 16
        px(d, shift, 4, 8, 1, "#86e6f1")
        px(d, (shift + 8) % 16, 8, 7, 1, "#65c8df")
        px(d, (shift + 3) % 16, 11, 5, 1, "#a5f4f4")
    elif kind == "flower":
        d.rectangle([0, 0, 15, 15], fill="#73c85a")
        colors = ["#f6df6f", "#ff9fb0", "#f7f7f7", "#caa6ff"]
        c = colors[variant % len(colors)]
        px(d, 7, 7, 2, 5, "#3d833e")
        px(d, 5, 5, 3, 3, c)
        px(d, 9, 4, 3, 3, c)
        px(d, 8, 6, 2, 2, "#fff4b2")
    elif kind == "rock":
        d.rectangle([0, 0, 15, 15], fill="#73c85a")
        px(d, 4, 8, 8, 6, "#58635f")
        px(d, 5, 6, 6, 3, "#89958a")
        px(d, 6, 5, 4, 2, "#aab4a5")
    elif kind == "fence_h":
        d.rectangle([0, 0, 15, 15], fill="#73c85a")
        px(d, 2, 6, 2, 8, "#6a4328")
        px(d, 12, 6, 2, 8, "#6a4328")
        px(d, 1, 8, 14, 2, "#9b6b3f")
        px(d, 1, 11, 14, 1, "#5d3921")
    elif kind == "fence_v":
        d.rectangle([0, 0, 15, 15], fill="#73c85a")
        px(d, 7, 1, 2, 14, "#6a4328")
        px(d, 4, 4, 8, 2, "#9b6b3f")
        px(d, 4, 11, 8, 2, "#9b6b3f")
    elif kind == "sign":
        d.rectangle([0, 0, 15, 15], fill="#73c85a")
        px(d, 7, 8, 2, 7, "#583b22")
        px(d, 2, 3, 12, 7, "#d9a55c")
        px(d, 3, 4, 10, 1, "#fff0c2")
        px(d, 4, 6, 8, 1, "#7a4c2b")
    return im

# atlas 8x3 tiles: row0 grass 4 + path 4; row1 tall2 + water3 + flower2 + rock1; row2 fence_h, fence_v, sign
atlas = Image.new("RGBA", (8*TILE, 3*TILE), (0,0,0,0))
for i in range(4): atlas.paste(make_tile("grass", i), (i*TILE, 0))
for i in range(4): atlas.paste(make_tile("path", i), ((4+i)*TILE, 0))
atlas.paste(make_tile("tall",0,0), (0, TILE))
atlas.paste(make_tile("tall",1,1), (TILE, TILE))
for i in range(3): atlas.paste(make_tile("water", i, i), ((2+i)*TILE, TILE))
for i in range(2): atlas.paste(make_tile("flower", i), ((5+i)*TILE, TILE))
atlas.paste(make_tile("rock"), (7*TILE, TILE))
atlas.paste(make_tile("fence_h"), (0, 2*TILE))
atlas.paste(make_tile("fence_v"), (TILE, 2*TILE))
atlas.paste(make_tile("sign"), (2*TILE, 2*TILE))
atlas.save(os.path.join(ROOT, "assets", "tiles", "terrain.png"))

def tree_image():
    im = Image.new("RGBA", (48, 64), (0,0,0,0)); d = ImageDraw.Draw(im)
    # trunk
    px(d, 20, 38, 8, 24, "#5a3d27")
    px(d, 22, 38, 2, 22, "#76512f")
    # canopy blocky layers with dark outline
    px(d, 8, 20, 32, 24, "#1d4a30")
    px(d, 4, 26, 40, 16, "#1d4a30")
    px(d, 10, 16, 28, 24, "#2d7547")
    px(d, 6, 24, 36, 16, "#2d7547")
    px(d, 14, 12, 20, 16, "#3f9253")
    px(d, 10, 22, 28, 12, "#4aa45d")
    px(d, 16, 18, 10, 5, "#6bc978")
    px(d, 28, 28, 8, 5, "#62b96c")
    # leaf pixel details
    for x,y in [(10,34),(18,42),(35,34),(40,42),(24,23),(12,18)]:
        px(d, x, y, 3, 3, "#67bd70")
    return im
tree_image().save(os.path.join(ROOT, "assets", "objects", "tree.png"))

def house_image():
    im = Image.new("RGBA", (96, 80), (0,0,0,0)); d = ImageDraw.Draw(im)
    # outline / wall
    px(d, 10, 34, 76, 40, "#5b3e28")
    px(d, 14, 38, 68, 36, "#f2e1b8")
    px(d, 14, 38, 68, 4, "#d4bb83")
    # roof blocky
    px(d, 4, 26, 88, 16, "#7d302d")
    px(d, 12, 16, 72, 12, "#a9473e")
    px(d, 24, 8, 48, 10, "#c45a4b")
    px(d, 24, 8, 48, 3, "#e27b5e")
    px(d, 4, 38, 88, 3, "#5d2525")
    # windows
    px(d, 24, 48, 14, 14, "#5a3d27")
    px(d, 27, 51, 8, 8, "#6fc3d9")
    px(d, 28, 52, 2, 5, "#c6f8ff")
    px(d, 59, 48, 14, 14, "#5a3d27")
    px(d, 62, 51, 8, 8, "#6fc3d9")
    px(d, 63, 52, 2, 5, "#c6f8ff")
    # door
    px(d, 43, 48, 14, 26, "#71472c")
    px(d, 46, 52, 8, 18, "#9b6035")
    px(d, 53, 62, 2, 2, "#f6d36a")
    # chimney
    px(d, 68, 2, 9, 20, "#6d4a32")
    px(d, 67, 1, 11, 3, "#8e6742")
    return im
house_image().save(os.path.join(ROOT, "assets", "objects", "house.png"))

def sign_image():
    im = Image.new("RGBA", (16, 24), (0,0,0,0)); d=ImageDraw.Draw(im)
    px(d,7,9,2,14,"#5b3e28"); px(d,1,3,14,10,"#5b3e28"); px(d,3,5,10,6,"#d9a55c"); px(d,4,7,8,1,"#7a4c2b"); px(d,4,9,6,1,"#7a4c2b")
    return im
sign_image().save(os.path.join(ROOT, "assets", "objects", "sign.png"))

def rock_image():
    im = Image.new("RGBA", (16,16), (0,0,0,0)); d=ImageDraw.Draw(im)
    px(d,3,8,10,6,"#56605d"); px(d,4,6,7,4,"#859287"); px(d,5,5,5,2,"#adb7a8"); px(d,3,12,9,2,"#3d4745")
    return im
rock_image().save(os.path.join(ROOT, "assets", "objects", "rock.png"))

def shadow_image():
    im = Image.new("RGBA", (24,12), (0,0,0,0)); d=ImageDraw.Draw(im)
    px(d,3,4,18,5,(6,16,24,80)); px(d,6,2,12,8,(6,16,24,65))
    return im
shadow_image().save(os.path.join(ROOT, "assets", "objects", "shadow.png"))

# creature frames: six small pixel monsters, 24x32, two frames
palettes = [
    ("#7ce7ff", "#2aa7e8", "#d4fbff", "#08233a"),
    ("#ff9d7a", "#e3554f", "#ffe0cf", "#3a1116"),
    ("#8ce5af", "#37b77c", "#d9ffe9", "#0b2c22"),
    ("#efd88f", "#c39c45", "#fff6cc", "#332612"),
    ("#d9b8ff", "#9c72e8", "#f7ecff", "#281a44"),
    ("#c8c8d5", "#8f8fa8", "#f4f4ff", "#232333"),
]
for idx,(body,shade,accent,ink) in enumerate(palettes):
    for frame in range(2):
        im = Image.new("RGBA", (24,32), (0,0,0,0)); d=ImageDraw.Draw(im)
        bob = frame
        # shadow
        px(d,4,28,16,3,(8,16,24,70))
        # tail
        px(d,19,17+bob,4,5,shade); px(d,21,14+bob,2,4,body)
        # feet
        px(d,6,25+bob,5,4,shade); px(d,14,25+bob,5,4,shade)
        # body outline + fill
        px(d,5,12+bob,15,15,ink); px(d,6,13+bob,13,13,body); px(d,9,18+bob,7,6,accent)
        # head
        px(d,6,3+bob,13,12,ink); px(d,7,4+bob,11,10,body)
        # ears/horns
        px(d,7,1+bob,3,5,shade); px(d,15,1+bob,3,5,shade)
        # eyes
        px(d,9,8+bob,2,3,ink); px(d,14,8+bob,2,3,ink)
        px(d,10,8+bob,1,1,"#ffffff"); px(d,15,8+bob,1,1,"#ffffff")
        # mouth
        px(d,11,13+bob,3,1,ink)
        # shine
        px(d,8,5+bob,2,2,accent)
        im.save(os.path.join(ROOT, "assets", "creatures", f"creature_{idx}_f{frame}.png"))
print("assets generated")
