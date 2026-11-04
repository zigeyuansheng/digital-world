import json, os, math
from PIL import Image, ImageDraw, ImageFont
ROOT=r"C:\Users\wang\Documents\deepseek-harness\default-workspace\digitalpartner_sprites"
m=json.load(open(os.path.join(ROOT,"manifest.json"),encoding="utf-8"))
# unique first frame entries
seen=set(); entries=[]
for x in m:
    if x["frame"]==0 and x["id"] not in seen:
        seen.add(x["id"]); entries.append(x)
entries=entries[:60]
cols,rows=10,6; cw,ch=128,112
sheet=Image.new("RGBA",(cols*cw,rows*ch),(38,54,66,255)); d=ImageDraw.Draw(sheet)
try: font=ImageFont.truetype("arial.ttf",11)
except: font=ImageFont.load_default()
for i,e in enumerate(entries):
    im=Image.open(os.path.join(ROOT,e["file"])).convert("RGBA")
    im.thumbnail((94,78),Image.Resampling.NEAREST)
    x=(i%cols)*cw+(cw-im.width)//2; y=(i//cols)*ch+8
    # checkerboard? simple dark bg
    sheet.alpha_composite(im,(x,y))
    label=e["id"][:20]
    tw=d.textlength(label,font=font)
    d.text(((i%cols)*cw+(cw-tw)//2, y+82),label,fill=(225,245,250),font=font)
    d.text(((i%cols)*cw+(cw-d.textlength(e["tier"],font=font))//2, y+95),e["tier"],fill=(120,190,210),font=font)
sheet.convert("RGB").save(os.path.join(ROOT,"contact_sheet.png"))
print("saved",len(entries),sheet.size)
