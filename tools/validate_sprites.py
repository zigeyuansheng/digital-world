import json, os
from PIL import Image
root=r"C:\Users\wang\Documents\deepseek-harness\default-workspace\digitalpartner_sprites"
m=json.load(open(os.path.join(root,'manifest.json'),encoding='utf-8'))
missing=[]; blank=[]; sizes={}
for e in m:
    p=os.path.join(root,e['file'])
    if not os.path.exists(p): missing.append(e['file']); continue
    im=Image.open(p).convert('RGBA'); bb=im.getbbox()
    if bb is None: blank.append(e['file'])
    sizes[e['file']]=im.size
print('entries',len(m),'files',len(os.listdir(root))-2,'missing',len(missing),'blank',len(blank))
print('missing sample',missing[:5],'blank sample',blank[:5])
print('unique ids',len({e['id'] for e in m}),'unique sprite names',len({e['sprite'] for e in m}))
print('frame counts', {k:sum(1 for e in m if e['frame']==k) for k in [0,1,2,3]})
print('size distribution top', sorted({v:list(sizes.values()).count(v) for v in set(sizes.values())}.items(), key=lambda x:-x[1])[:10])
