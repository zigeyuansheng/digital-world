import json, os
ROOT = r"C:\Users\wang\Documents\deepseek-harness\default-workspace\godot-digital-world"
W,H=40,24
rows=[["grass"]*W for _ in range(H)]
for y in range(7,H):
    for x in range(19,22): rows[y][x]="path"
for y in range(14,17):
    for x in range(14,30): rows[y][x]="path"
for y in range(7,14):
    for x in range(28,36): rows[y][x]="water"
for y in range(15,21):
    for x in range(11,18): rows[y][x]="tall"
for y in range(18,22):
    for x in range(23,30): rows[y][x]="tall"
for x,y in [(15,9),(17,10),(25,6),(31,16),(12,11),(22,21)]: rows[y][x]="flower"
manifest={
  "id":"route-01","name":"File City Outskirts / Route 01","tile_size":16,
  "base_resolution":[320,180],"display_resolution":[1280,720],"map_size":[W,H],
  "layers":[{"name":"ground","rows":["".join({"grass":"G","path":"P","water":"W","tall":"T","flower":"F"}[c] for c in row) for row in rows]}],
  "objects":[{"type":"house","texture":"assets/objects/house.png","tile":[11,7]},{"type":"sign","texture":"assets/objects/sign.png","tile":[18,10]},{"type":"rock","texture":"assets/objects/rock.png","tile":[8,12]},{"type":"rock","texture":"assets/objects/rock.png","tile":[33,17]}],
  "actors":[{"species":"Agumon","texture":"assets/creatures/real/agumon.png","tile":[19,12],"radius":[10,5]},{"species":"Gabumon","texture":"assets/creatures/real/gabumon.png","tile":[24,15],"radius":[16,4]},{"species":"Patamon","texture":"assets/creatures/real/patamon.png","tile":[15,16],"radius":[24,9]},{"species":"Palmon","texture":"assets/creatures/real/palmon.png","tile":[25,16],"radius":[14,7]},{"species":"Gomamon","texture":"assets/creatures/real/gomamon.png","tile":[17,10],"radius":[8,5]},{"species":"Biyomon","texture":"assets/creatures/real/piyomon.png","tile":[27,12],"radius":[10,8]}],
  "note":"Tile letters: G grass, P path, W water, T tall grass, F flower. This is a renderer-neutral manifest for the DSH plugin."
}
with open(os.path.join(ROOT,"assets","scene_route01.json"),"w",encoding="utf-8") as f: json.dump(manifest,f,ensure_ascii=False,indent=2)
print("manifest saved")
