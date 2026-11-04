import json,re,os
root=r"C:\Users\wang\Documents\deepseek-harness\default-workspace"
m=json.load(open(os.path.join(root,"digitalpartner_sprites","manifest.json"),encoding="utf-8"))
d=json.load(open(os.path.join(root,"plugins","dsh-plugin-digital-world","data","digimon.json"),encoding="utf-8"))["species"]
def norm(s): return re.sub(r'[^a-z0-9]+','',s.lower())
sp={norm(x["name"]):x for x in d}
ids={}
for x in m:
    ids.setdefault(x["id"],x)
matched=[]; missing=[]
for name,e in ids.items():
    hit=sp.get(norm(name))
    (matched if hit else missing).append((name,e,hit))
print('ids',len(ids),'matched',len(matched),'missing',len(missing))
print('missing sample',[x[0] for x in missing[:40]])
report={"total_ids":len(ids),"matched":len(matched),"missing":len(missing),"matches":[{"id":n,"plugin_id":h["id"],"sprite":e["sprite"]} for n,e,h in matched],"missing_names":[n for n,e,h in missing]}
open(os.path.join(root,"digitalpartner_sprites","plugin_match_report.json"),"w",encoding="utf-8").write(json.dumps(report,ensure_ascii=False,indent=2))
