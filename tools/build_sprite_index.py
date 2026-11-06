#!/usr/bin/env python3
"""Build the species -> sprite index for the Digital World panel.

Sources
  plugins/dsh-plugin-digital-world/data/digimon.json   1614 Wikimon species
  digitalpartner_sprites/*.png                         real Digimon frames

Outputs
  plugins/dsh-plugin-digital-world/lib/sprite-index.js   ESM, Host + browser source
  (and the same JSON is inlined into client.js between SPRITE-DATA markers)

Matching order per sprite base name:
  1. exact normalized name (strip spaces, punctuation, case)
  2. curated alias (romanization / localization differences)
  3. variant suffix stripping (X-Antibody, Black, 2010, FM, Miko, Dex, ...)
  4. fuzzy close match (>= 0.92) as a last resort

A species maps to the first sprite base that lands on it; exact beats variant.
Prefer frame _f0, then _f1, then any.
"""
from __future__ import annotations

import difflib
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SPECIES_JSON = ROOT / "plugins" / "dsh-plugin-digital-world" / "data" / "digimon.json"
SPRITE_DIR = ROOT / "digitalpartner_sprites"
OUT_JS = ROOT / "plugins" / "dsh-plugin-digital-world" / "lib" / "sprite-index.js"
CLIENT_JS = ROOT / "plugins" / "dsh-plugin-digital-world" / "lib" / "client.js"
REPORT = ROOT / "digitalpartner_sprites" / "sprite-match-report.json"

# sprite base (normalized) -> plugin species name (normalized). Bidirectional use.
ALIASES = {
    "piyomon": "biyomon",
    "tailmon": "gatomon",
    "vamdemon": "myotismon",
    "omegamon": "omnimon",
    "dukemon": "gallantmon",
    "beelzebumon": "beelzemon",
    "saintgalgomon": "megagargomon",
    "atlurkabuterimon": "megakabuterimon",
    "heraklekabuterimon": "herculeskabuterimon",
    "holydramon": "magnadramon",
    "ofanimon": "ophanimon",
    "orgemon": "ogremon",
    "fladramon": "flamedramon",
    "tukaimon": "tsukaimon",
    "mochimon": "motimon",
    "fantomon": "phantomon",
    "plotmon": "salamon",
    "pukamon": "bukamon",
    "pyocomon": "yokomon",
    "impmon": "impmon",
}

VARIANT_TOKENS = {
    "x", "b", "2010", "fm", "miko", "g", "sm", "am", "bm", "alterb", "alters",
    "crimsonmode", "blk", "black", "virus", "orange", "blue", "green", "white",
    "deva", "armor", "dm", "fightermode", "dragonmode", "paladinmode", "zeed",
}


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def strip_variant(name: str) -> list[str]:
    """Return candidate bare names for a sprite base."""
    out = []
    # split CamelCase-ish underscores
    parts = [p for p in re.split(r"[_]", name) if p]
    if not parts:
        return out
    head = parts[0]
    # Dex / prefix markers
    if head.lower() == "dex" and len(parts) > 1:
        out.append("_".join(parts[1:]))
    tail = parts[1:]
    if tail and all(p.lower() in VARIANT_TOKENS for p in tail):
        out.append(head)
    # trailing suffix without underscore (e.g. SakuyamonMiko)
    for tok in VARIANT_TOKENS:
        if tok and len(tok) > 2 and head.lower().endswith(tok):
            out.append(head[: -len(tok)])
    return out


def pick_frame(files: list[Path]) -> Path:
    def rank(p: Path) -> tuple:
        m = re.search(r"_f(\d+)$", p.stem)
        n = int(m.group(1)) if m else 99
        return (0 if n == 0 else 1, n, p.name)

    return sorted(files, key=rank)[0]


def main() -> None:
    data = json.loads(SPECIES_JSON.read_text(encoding="utf-8"))
    species = data["species"] if isinstance(data, dict) else data
    species_by_norm = {}
    species_by_id = {}
    for sp in species:
        species_by_id[sp["id"]] = sp
        if sp.get("name"):
            species_by_norm[norm(sp["name"])] = sp

    # Extra keys so variant species line up with variant sprite bases, e.g.
    # "Agumon (X-Antibody)" -> agumonx matching "Agumon_X".
    for sp in species:
        name = sp.get("name")
        if not name:
            continue
        base = norm(name)
        for token in ("antibody", "animeversion", "anime"):
            if token in base:
                species_by_norm.setdefault(base.replace(token, ""), sp)

    bases: dict[str, list[Path]] = {}
    for png in SPRITE_DIR.glob("*.png"):
        m = re.match(r"^(.*)_f\d+$", png.stem)
        if m:
            bases.setdefault(m.group(1), []).append(png)

    plugin_norm_set = list(species_by_norm.keys())
    alias_rev = {}
    for sprite_key, plugin_key in ALIASES.items():
        alias_rev[sprite_key] = plugin_key
        alias_rev.setdefault(plugin_key, sprite_key)

    chosen: dict[str, dict] = {}
    how: dict[str, str] = {}
    unmatched = []

    def assign(sp: dict, base: str, method: str) -> bool:
        if sp["id"] in chosen:
            return False
        file = pick_frame(bases[base])
        with Image.open(file) as im:
            width, height = im.size
        chosen[sp["id"]] = {
            "id": sp["id"],
            "name": sp.get("name", ""),
            "file": file.name,
            "base": base,
            "width": width,
            "height": height,
        }
        how[sp["id"]] = method
        return True

    # Pass 1 exact, pass 2 alias, pass 3 variant-stripped, pass 4 fuzzy.
    ordered = sorted(bases.keys())
    for method in ("exact", "alias", "variant", "fuzzy"):
        for base in ordered:
            nb = norm(base)
            sp = None
            if method == "exact":
                sp = species_by_norm.get(nb)
            elif method == "alias":
                target = alias_rev.get(nb)
                sp = species_by_norm.get(target) if target else None
            elif method == "variant":
                for cand in strip_variant(base):
                    sp = species_by_norm.get(norm(cand))
                    if sp:
                        break
            else:
                close = difflib.get_close_matches(nb, plugin_norm_set, n=1, cutoff=0.92)
                sp = species_by_norm.get(close[0]) if close else None
            if sp is not None:
                assign(sp, base, method)

    entries = sorted(chosen.values(), key=lambda e: e["id"])
    coverage = len(entries)
    print(f"species with sprite: {coverage} / {len(species)}  (sprite bases {len(bases)})")
    from collections import Counter
    print("by method:", dict(Counter(how.values())))
    used = {e["base"] for e in entries}
    left = [b for b in bases if b not in used]
    print("unused sprite bases:", len(left), left[:25])

    payload = json.dumps(entries, ensure_ascii=False, separators=(",", ":"))
    OUT_JS.write_text(
        "/**\n"
        " * Species -> real Digimon sprite index.\n"
        " *\n"
        " * GENERATED by tools/build_sprite_index.py from digitalpartner_sprites —\n"
        " * do not hand-edit.\n"
        " */\n"
        f"export const SPRITE_INDEX = Object.freeze({payload})\n",
        encoding="utf-8",
    )

    # Inline the same data into the prebuilt browser bundle.
    text = CLIENT_JS.read_text(encoding="utf-8")
    begin = "// >>> SPRITE-DATA"
    end = "// <<< SPRITE-DATA <<<"
    block = (
        "    // >>> SPRITE-DATA (generated by tools/build_sprite_index.py) >>>\n"
        f"    const SPRITE_INDEX = Object.freeze({payload})\n"
        "    // <<< SPRITE-DATA <<<"
    )
    start = text.index(begin)
    line_start = text.rfind("\n", 0, start) + 1
    end_marker = text.index(end, start)
    line_end = text.find("\n", end_marker)
    if line_end == -1:
        line_end = len(text)
    CLIENT_JS.write_text(text[:line_start] + block + text[line_end:], encoding="utf-8")
    print(f"wrote {OUT_JS.name} and inlined into client.js")

    REPORT.write_text(
        json.dumps(
            {"coverage": coverage, "totalSpecies": len(species), "byMethod": dict(Counter(how.values())), "unusedSpriteBases": left},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
