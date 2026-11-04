import re, base64, struct, os
from pathlib import Path
from PIL import Image

ROOT = Path(r"C:\Users\wang\Documents\deepseek-harness\default-workspace")
SRC = ROOT / "tools" / "pokemon-fireleaf-godot" / "game"
tscn = SRC / "source" / "maps" / "overworld" / "overworld.tscn"
atlas = Image.open(SRC / "assets" / "sprites" / "environment" / "tilesets" / "overworld_tileset.png").convert("RGBA")
tall = Image.open(SRC / "assets" / "sprites" / "environment" / "tall_grass" / "tall_grass.png").convert("RGBA").crop((0,0,16,16))
t = tscn.read_text(encoding="utf8")
lines=t.splitlines(); nodes=[]; cur=None
for line in lines:
    if line.startswith('[node '):
        m=re.match(r'\[node name="([^"]+)"(?: type="([^"]+)")?(?: parent="([^"]+)")?',line)
        if m:
            cur={'name':m.group(1),'type':m.group(2),'parent':m.group(3),'lines':[]}; nodes.append(cur)
    elif cur is not None: cur['lines'].append(line)

def render_layer(layer):
    text='\n'.join(layer['lines']); m=re.search(r'tile_map_data = PackedByteArray\("([^"]*)"\)',text)
    if not m: return []
    b=base64.b64decode(m.group(1)); cells=[]; p=2
    while p+12<=len(b):
        x,y,src,ax,ay,alt=struct.unpack_from('<hhHHHH',b,p); p+=12
        if src!=0xFFFF: cells.append((x,y,src,ax,ay,alt))
    return cells

# world crop around Pallet Town, matching FileCity Camera2D at (192,170)
x0,y0,w,h=32,80,320,180
out=Image.new('RGBA',(w,h),(0,0,0,0))
for layer in nodes:
    if layer['type']!='TileMapLayer' or layer['parent'] not in ('PalletTown',):
        continue
    for x,y,src,ax,ay,alt in render_layer(layer):
        px,py=x*16-x0,y*16-y0
        if px>w or py>h or px+16<0 or py+16<0: continue
        if src==0:
            tile=atlas.crop((ax*16,ay*16,ax*16+16,ay*16+16))
        elif src==2:
            tile=tall
        else:
            continue
        out.alpha_composite(tile,(px,py))

# actual Digimon actors, matching file_city_actors.gd
actors=[('Agumon_f0.png',105,190,.7),('Gabumon_f0.png',165,195,.7),('Patamon_f0.png',65,225,.7),('Palmon_f0.png',160,235,.7),('Gomamon_f0.png',105,240,.7),('Piyomon_f0.png',265,240,.7)]
for name,ax,ay,scale in actors:
    spr=Image.open(ROOT/'digitalpartner_sprites'/name).convert('RGBA')
    spr=spr.resize((max(1,round(spr.width*scale)),max(1,round(spr.height*scale))),Image.Resampling.NEAREST)
    px=ax-x0-spr.width//2; py=ay-y0-spr.height//2
    shadow=Image.new('RGBA',(spr.width+8,6),(0,0,0,0))
    sd=Image.new('RGBA',shadow.size,(0,0,0,0)); from PIL import ImageDraw; d=ImageDraw.Draw(sd); d.ellipse([1,1,sd.width-2,5],fill=(0,0,0,80)); out.alpha_composite(sd,(px+spr.width//2-sd.width//2,ay-y0-2))
    out.alpha_composite(spr,(px,py))

out=out.resize((1280,720),Image.Resampling.NEAREST)
out.save(ROOT/'godot-digital-world'/'preview_filecity.png')
print('saved', out.size)
