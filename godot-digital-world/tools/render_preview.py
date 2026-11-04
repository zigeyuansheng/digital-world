from PIL import Image
import os
ROOT = r"C:\Users\wang\Documents\deepseek-harness\default-workspace\godot-digital-world"
T=16; MW=40; MH=24
atlas=Image.open(os.path.join(ROOT,"assets","tiles","terrain.png")).convert("RGBA")
def tile(col,row):
    return atlas.crop((col*T,row*T,col*T+T,row*T+T))
map_img=Image.new("RGBA",(MW*T,MH*T),(0,0,0,0))
def set_tile(x,y,col,row): map_img.paste(tile(col,row),(x*T,y*T))
for y in range(MH):
    for x in range(MW): set_tile(x,y,(x*7+y*13)%4,0)
for x in range(19,22):
    for y in range(7,MH): set_tile(x,y,4+((x+y)%4),0)
for x in range(14,30):
    for y in range(14,17): set_tile(x,y,4+((x+y)%4),0)
for x in range(28,36):
    for y in range(7,14): set_tile(x,y,2,1)
for x in range(11,18):
    for y in range(15,21): set_tile(x,y,(x+y)%2,1)
for x in range(23,30):
    for y in range(18,22): set_tile(x,y,(x+y)%2,1)
for cx,cy in [(15,9),(17,10),(25,6),(31,16),(12,11),(22,21)]: set_tile(cx,cy,5+((cx+cy)%2),1)
for x in range(12,18): set_tile(x,11,0,2)
for y in range(8,11): set_tile(11,y,1,2)
# props
def paste(path,x,y):
    im=Image.open(os.path.join(ROOT,"assets","objects",path)).convert("RGBA")
    map_img.alpha_composite(im,(x*T,y*T))
paste("house.png",11,7)
paste("sign.png",18,10); paste("rock.png",8,12); paste("rock.png",33,17)
trees=[(2,2),(5,2),(8,3),(21,2),(25,2),(33,2),(37,3),(2,8),(4,13),(7,18),(2,21),(37,9),(39,15),(35,22),(14,2),(18,4),(30,3),(34,5),(9,22),(20,20)]
for tx,ty in sorted(trees,key=lambda p:p[1]):
    paste("tree.png",tx,ty)
# creatures (actual Digimon map sprites extracted from Digital Partner)
species=[("Agumon_f0.png",19,12),("Gabumon_f0.png",24,15),("Patamon_f0.png",15,16),("Palmon_f0.png",25,16),("Gomamon_f0.png",17,10),("Piyomon_f0.png",27,12)]
for name,tx,ty in species:
    spr=Image.open(os.path.join(ROOT,"assets","digimon",name)).convert("RGBA")
    spr=spr.resize((max(1,round(spr.width*0.7)),max(1,round(spr.height*0.7))),Image.Resampling.NEAREST)
    # center at tile center
    px=tx*T+8-spr.width//2; py=ty*T+8-spr.height//2
    sh=Image.open(os.path.join(ROOT,"assets","objects","shadow.png")).convert("RGBA")
    sh=sh.resize((max(1,sh.width//2),max(1,sh.height//2)),Image.Resampling.NEAREST)
    map_img.alpha_composite(sh,(tx*T+8-sh.width//2,ty*T+12))
    map_img.alpha_composite(spr,(px,py))
# camera crop
view=map_img.crop((160,102,480,282)).resize((1280,720),Image.Resampling.NEAREST)
view.save(os.path.join(ROOT,"preview_route01.png"))
print("preview saved", view.size)
