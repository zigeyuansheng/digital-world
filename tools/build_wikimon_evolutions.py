#!/usr/bin/env python3
"""Build the official-sourced evolution graph for the 595 playable species.

The official Digimon Reference Book does not publish evolution relations, so
this uses Wikimon's per-species "Evolves From / Evolves To" lists, which
aggregate the official games/anime/cards. It crawls every playable species
(cached + resumable), keeps only links that resolve to a known species id, and
writes:

  plugins/dsh-plugin-digital-world/data/wikimon-evolutions.json

Run in the background; re-running resumes from the cache.
"""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "plugins" / "dsh-plugin-digital-world" / "data" / "digimon.json"
SPRITE_JS = ROOT / "plugins" / "dsh-plugin-digital-world" / "lib" / "sprite-index.js"
OUT = ROOT / "plugins" / "dsh-plugin-digital-world" / "data" / "wikimon-evolutions.json"
CACHE = ROOT / "tools" / ".cache" / "wikimon"

UA = {"User-Agent": "DigitalWorld-dev/1.0 (research; contact: local)"}
STAGE = {"baby1": 0, "baby2": 1, "child": 2, "adult": 3, "perfect": 4, "ultimate": 5, "armor": 3, "hybrid": 3, "xros-wars": 2, "unknown": 1}


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def api(title: str) -> dict:
    url = (
        "https://wikimon.net/api.php?action=parse&prop=wikitext&format=json&redirects=1&page="
        + urllib.parse.quote(title)
    )
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as response:
        return json.loads(response.read().decode("utf-8"))


def section(wikitext: str, name: str) -> str:
    match = re.search(r"==\s*" + name + r"\s*==(.*?)(?=\n==[^=]|\Z)", wikitext, re.S)
    return match.group(1) if match else ""


def links(sec: str) -> list[str]:
    out = []
    for line in sec.splitlines():
        if not line.strip().startswith("*"):
            continue
        for link in re.findall(r"\[\[([^\]|#]+)", line):
            name = link.strip()
            if not name or name.lower().startswith(("category:", "file:", "template:")):
                continue
            if name not in out:
                out.append(name)
    return out


def fetch_one(sp: dict) -> dict:
    cache_file = CACHE / f"{sp['id']}.json"
    if cache_file.exists():
        try:
            return json.loads(cache_file.read_text(encoding="utf-8"))
        except Exception:
            pass
    record = {"id": sp["id"], "ok": False, "title": sp.get("name", sp["id"]), "to": [], "from": []}
    for attempt in range(3):
        try:
            parsed = api(sp.get("name", sp["id"]))
            if parsed.get("error"):
                raise RuntimeError(parsed["error"].get("info", "api error"))
            wikitext = parsed["parse"]["wikitext"]["*"]
            record = {
                "id": sp["id"],
                "ok": True,
                "title": parsed["parse"].get("title", sp.get("name", sp["id"])),
                "to": links(section(wikitext, "Evolves To")),
                "from": links(section(wikitext, "Evolves From")),
            }
            break
        except Exception as exc:  # noqa: BLE001
            record["error"] = str(exc)[:200]
            time.sleep(1.5 * (attempt + 1))
    CACHE.mkdir(parents=True, exist_ok=True)
    cache_file.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    return record


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    species = data["species"]
    by_id = {s["id"]: s for s in species}
    by_name = {norm(s["name"]): s for s in species}
    sprites = json.loads(re.search(r"Object\.freeze\((\[.*?\])\)\n", SPRITE_JS.read_text(encoding="utf-8"), re.S).group(1))
    available = {e["id"] for e in sprites}
    playable = [s for s in species if s["id"] in available]

    CACHE.mkdir(parents=True, exist_ok=True)
    records = {}
    failed = []
    t0 = time.time()

    import random
    from concurrent.futures import ThreadPoolExecutor, as_completed

    def work(sp: dict) -> dict:
        record = fetch_one(sp)
        time.sleep(random.uniform(0.05, 0.2))
        return record

    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(work, sp) for sp in playable]
        done = 0
        for future in as_completed(futures):
            record = future.result()
            records[record["id"]] = record
            done += 1
            if not record.get("ok"):
                failed.append(record["id"])
            if done % 50 == 0 or done == len(playable):
                print(f"[{done}/{len(playable)}] elapsed={time.time()-t0:.0f}s failed={len(failed)}", flush=True)

    # Map raw link names to species ids (all 1614, then keep available ones).
    def to_ids(names: list[str]) -> list[str]:
        out = []
        for name in names:
            sp = by_name.get(norm(name))
            if sp is not None and sp["id"] not in out:
                out.append(sp["id"])
        return out

    graph = {}
    for sid, record in records.items():
        graph[sid] = {
            "to": [x for x in to_ids(record.get("to", []))],
            "from": [x for x in to_ids(record.get("from", []))],
        }

    OUT.write_text(json.dumps({"source": "wikimon", "generatedAt": time.strftime("%Y-%m-%d"), "graph": graph}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    next_edges = 0
    cross_edges = 0
    zero = 0
    for sid, item in graph.items():
        si = STAGE.get(by_id[sid]["level"], 1)
        targets = [x for x in item["to"] if x in available]
        if not targets:
            zero += 1
        for t in targets:
            d = STAGE.get(by_id[t]["level"], 1) - si
            if d == 1:
                next_edges += 1
            elif d > 1:
                cross_edges += 1
    print(json.dumps({"playable": len(playable), "fetched": len(records), "failed": len(failed), "failedIds": failed[:20], "nextStageEdges": next_edges, "crossStageEdges": cross_edges, "zeroTargets": zero}, ensure_ascii=False))


if __name__ == "__main__":
    main()
