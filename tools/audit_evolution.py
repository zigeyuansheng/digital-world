#!/usr/bin/env python3
"""Audit the surviving (sprite-backed) evolution graph against the official
Wikimon-derived catalog.

The catalog snapshot's `evolvesTo` is generated from Wikimon infobox data, so it
is the official baseline. This script verifies that, after removing species
without sprites, the remaining graph is still a faithful subgraph of the official
routes — no invented edges, no dangling targets — and measures how much official
branching was pruned.

Outputs
  digital-world/evolution-audit.json
  digital-world/EVOLUTION_AUDIT.md
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "plugins" / "dsh-plugin-digital-world" / "data" / "digimon.json"
SPRITE_JS = ROOT / "plugins" / "dsh-plugin-digital-world" / "lib" / "sprite-index.js"
OUT_JSON = ROOT / "evolution-audit.json"
OUT_MD = ROOT / "EVOLUTION_AUDIT.md"

STAGE_ORDER = {"baby1": 0, "baby2": 1, "child": 2, "adult": 3, "perfect": 4, "ultimate": 5, "armor": 3, "hybrid": 3, "xros-wars": 2, "unknown": 1}
LEVEL_LABEL = {"baby1": "幼年期I", "baby2": "幼年期II", "child": "成长期", "adult": "成熟期", "perfect": "完全体", "ultimate": "究极体", "armor": "装甲体", "hybrid": "混合体", "xros-wars": "Xros Wars", "unknown": "未知"}

# Canonical official lines used as spot checks (each edge must be a real evolvesTo).
CANON = {
    "亚古兽线": ["agumon", "greymon", "metal-greymon", "war-greymon"],
    "加布兽线": ["gabumon", "garurumon", "were-garurumon", "metal-garurumon"],
    "比丘兽线": ["piyomon", "birdramon", "garudamon"],
    "巴达兽线": ["patamon", "angemon"],
}


def load_sprites() -> list[dict]:
    text = SPRITE_JS.read_text(encoding="utf-8")
    m = re.search(r"Object\.freeze\((\[.*?\])\)\n", text, re.S)
    return json.loads(m.group(1))


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    species = data["species"]
    by_id = {s["id"]: s for s in species}
    sprites = load_sprites()
    available = {e["id"] for e in sprites}

    wiki_path = ROOT / "plugins" / "dsh-plugin-digital-world" / "data" / "wikimon-evolutions.json"
    wiki = None
    if wiki_path.exists():
        wiki = json.loads(wiki_path.read_text(encoding="utf-8")).get("graph")

    def official_to(s: dict) -> list[str]:
        if wiki is not None:
            entry = wiki.get(s["id"], {}).get("to")
            if isinstance(entry, list):
                return entry
        return s.get("evolvesTo", [])

    evolution_source = "wikimon" if wiki is not None else "catalog-snapshot"

    dangling = []
    for s in species:
        for tgt in official_to(s):
            if tgt not in by_id:
                dangling.append({"from": s["id"], "to": tgt})

    # Graph restricted to available species.
    edges = []
    invented = []          # edges whose target is not an official catalog id
    pruned_species = []    # species that lost at least one official target
    for s in species:
        if s["id"] not in available:
            continue
        official = [t for t in official_to(s) if t in by_id]
        kept = [t for t in official if t in available]
        dropped = [t for t in official if t not in available]
        for tgt in kept:
            edges.append({"from": s["id"], "to": tgt})
        if dropped:
            pruned_species.append({"id": s["id"], "dropped": dropped})
        for tgt in official_to(s):
            if tgt not in by_id:
                invented.append({"from": s["id"], "to": tgt})

    # Every kept edge must also be in the official list of its source.
    illegal = [e for e in edges if e["to"] not in official_to(by_id[e["from"]])]

    av_by_level = {}
    for s in species:
        if s["id"] in available:
            av_by_level[s["level"]] = av_by_level.get(s["level"], 0) + 1

    targets = {s["id"]: [t for t in official_to(s) if t in available] for s in species if s["id"] in available}
    reach = {}
    for level, min_idx in (("adult", 3), ("perfect", 4), ("ultimate", 5)):
        count = 0
        for s in species:
            if s["id"] not in available or s["level"] != "baby1":
                continue
            stack = [(s["id"], 0)]
            seen = {s["id"]}
            ok = False
            while stack:
                cur, depth = stack.pop()
                if STAGE_ORDER.get(by_id[cur]["level"], 1) >= min_idx:
                    ok = True
                    break
                if depth >= 8:
                    continue
                for nxt in targets.get(cur, []):
                    if nxt not in seen:
                        seen.add(nxt)
                        stack.append((nxt, depth + 1))
            if ok:
                count += 1
        reach[level] = count
    baby1_total = sum(1 for s in species if s["id"] in available and s["level"] == "baby1")

    canonical = []
    for label, chain in CANON.items():
        ok = all(c in by_id and n in official_to(by_id[c]) for c, n in zip(chain, chain[1:]))
        avail_ok = all(node in available for node in chain)
        canonical.append({"line": label, "chain": [by_id[n]["name"] if n in by_id else n for n in chain], "matchesOfficial": ok, "allHaveSprites": avail_ok})

    # Breadth: the Wikimon "can evolve to" set is very wide, so count cross-stage
    # (warp) edges — canonical single-line progression is stage-by-stage.
    warps = []
    deltas = []
    for s in species:
        if s["id"] not in available:
            continue
        si = STAGE_ORDER.get(s["level"], 1)
        for t in official_to(s):
            if t not in available or t not in by_id:
                continue
            ti = STAGE_ORDER.get(by_id[t]["level"], 1)
            d = ti - si
            deltas.append(d)
            if d > 1:
                warps.append({"from": s["id"], "fromLevel": s["level"], "to": t, "toLevel": by_id[t]["level"]})
    target_counts = sorted(len([t for t in s.get("evolvesTo", []) if t in available]) for s in species if s["id"] in available)
    n = len(target_counts) or 1
    breadth = {
        "avg": round(sum(target_counts) / n, 1),
        "median": target_counts[n // 2],
        "max": target_counts[-1] if target_counts else 0,
        "zero": sum(1 for c in target_counts if c == 0),
        "warpEdges": len(warps),
        "warpExamples": warps[:12],
    }

    report = {
        "totals": {
            "evolutionSource": evolution_source,
            "fullCatalog": len(species),
            "availableWithSprite": len(available),
            "removedWithoutSprite": len(species) - len(available),
            "availableByLevel": av_by_level,
            "edgesKept": len(edges),
            "prunedSpecies": len(pruned_species),
            "danglingOfficialTargets": len(dangling),
            "inventedEdges": len(invented),
            "illegalEdges": len(illegal),
        },
        "breadth": breadth,
        "baby1Reachability": {"baby1Count": baby1_total, **{f"canReach_{k}": v for k, v in reach.items()}},
        "canonicalLines": canonical,
        "danglingSample": dangling[:20],
        "prunedSample": pruned_species[:30],
    }
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    md = [
        "# 数码兽进化路线一致性审计",
        "",
        f"- 进化数据来源：**{evolution_source}**" + ("（Wikimon 官方来源汇总）" if evolution_source == "wikimon" else "（内置快照 evolvesTo）"),
        f"- 完整图鉴：{len(species)} 条",
        f"- 有像素图可上架：**{len(available)}** 条",
        f"- 无图暂下架：{len(species) - len(available)} 条",
        f"- 保留的官方进化边：{len(edges)} 条（全部来自官方 evolvesTo）",
        f"- 因下架被裁掉的官方分支涉及：{len(pruned_species)} 个物种",
        f"- 指向不存在物种的官方边：{len(dangling)}（应为 0）",
        f"- 非法/杜撰边：{len(illegal)}（应为 0）",
        "",
        "## 各阶段可用数量",
        "",
    ]
    for level in ["baby1", "baby2", "child", "adult", "perfect", "ultimate"]:
        md.append(f"- {LEVEL_LABEL[level]}：{av_by_level.get(level, 0)}")
    md.append("")
    md.append("## 初始蛋可进化到的阶段（幼年期I 起点）")
    md.append("")
    md.append(f"- 幼年期I 总数：{baby1_total}")
    md.append(f"- 能到成熟期：{reach.get('adult', 0)}；能到完全体：{reach.get('perfect', 0)}；能到究极体：{reach.get('ultimate', 0)}")
    md.append("")
    md.append("## 进化目标广度（是否像官方单线）")
    md.append("")
    md.append(f"- 平均每个可用物种可进化到：**{breadth['avg']}** 个目标（中位数 {breadth['median']}，最多 {breadth['max']}）")
    md.append(f"- 无任何可用进化目标：{breadth['zero']} 个物种")
    md.append(f"- 跨级直连（跳 2 级以上，如成长期→究极体）：**{breadth['warpEdges']}** 条")
    if breadth["warpExamples"]:
        ex = "；".join(f"{w['from']}({w['fromLevel']})→{w['to']}({w['toLevel']})" for w in breadth["warpExamples"][:6])
        md.append(f"- 示例：{ex}")
    md.append("")
    md.append("## 经典官方路线抽查")
    md.append("")
    for r in canonical:
        md.append(f"- {r['line']}：`{' → '.join(r['chain'])}` — 官方一致：{'是' if r['matchesOfficial'] else '否'}；全部有图：{'是' if r['allHaveSprites'] else '否'}")
    md.append("")
    md.append("## 结论")
    md.append("")
    structural_ok = len(illegal) == 0 and len(dangling) == 0 and all(r["matchesOfficial"] for r in canonical)
    canonical_like = breadth["avg"] <= 5 and breadth["warpEdges"] == 0
    if structural_ok and evolution_source == "wikimon":
        md.append(f"进化数据全部来自 Wikimon 官方来源的 `Evolves To`，与官方来源一致。需要注意：官方进化本身是**多分支图**（平均 {breadth['avg']} 个目标、含 {breadth['warpEdges']} 条跨级/特殊进化），并非单线；若产品要单线展示，需要另行指定标准线。")
    elif structural_ok and canonical_like:
        md.append("保留的进化路线全部来自官方来源，且广度接近单线，无杜撰边。")
    elif structural_ok:
        md.append("**结构上无杜撰边**（每条都来自官方 Wikimon evolvesTo，且无悬空目标），但当前数据是 Wikimon 的“可进化到”大合集，平均目标数远超单线、并存在跨级直连，**与动画/官方标准进化线不一致**。需要人工整理标准线（或采用官方游戏/图鉴的固定进化表）后才能说“与官方一致”。")
    else:
        md.append("存在需要人工复核的进化差异，见上方统计。")
    OUT_MD.write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps(report["totals"], ensure_ascii=False))
    print(json.dumps(breadth, ensure_ascii=False))
    for r in canonical:
        print(r["line"], r["matchesOfficial"], r["allHaveSprites"])


if __name__ == "__main__":
    main()
