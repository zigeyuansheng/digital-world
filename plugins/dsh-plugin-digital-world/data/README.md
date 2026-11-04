# Digimon data pack

Generated from the [Wikimon](https://wikimon.net/) MediaWiki API.

- **Source:** `List_of_Digimon` (canonical list of Japanese Digimon names) plus each species article's `{{S2}}` infobox and `Attack Techniques` data.
- **Snapshot date:** 2026-11-04
- **Species count:** 1614
- **Generator:** `node tools/build-digimon-data.mjs` (add `--refresh` to ignore HTTP caches)

## Source caveat

The live `List_of_Digimon` page states "As of July 25th 2026, there are 1,614 Digimon listed on this page." The page has continued to grow since that date (the live revision contains 1,622 rendered list rows, plus one commented-out DlistJ block). To honour the published 1,614-entry snapshot, `tools/build-digimon-data.mjs` pins the **2026-07-25 revision** (`oldid=657881`) when the live page no longer matches 1,614 DlistJ entries. Page wikitexts for the species are fetched from the live wiki (with redirects followed).

Fields that are absent on a page are left empty rather than guessed. In particular, older or minor species pages may lack an English `pe` profile, a `{{ZHO}}` Simplified Chinese name, a type, or an `Evolves To` entry. `No Level`, `None` and `(?)` level values normalize to `unknown`; `None` attributes normalize to `unknown`. A few list entries are redirects or alternate forms that share one wiki page (for example `Kamemon` / `Chibi Kamemon` and `Shoutmon + Star Sword` / `Shoutmon + Rare Star Sword`); both entries are kept, using the shared page's fields.

## Schema

`data/digimon.json`:

```json
{
  "snapshotDate": "2026-11-04",
  "source": "Wikimon List of Digimon + page infoboxes",
  "count": 1614,
  "species": [
    {
      "id": "agumon",
      "name": "Agumon",
      "kanji": "アグモン",
      "zh": "亚古兽",
      "level": "child",
      "attribute": "vaccine",
      "type": "Reptile",
      "moves": ["Pepper Breath", "Spirit Fire"],
      "profile": "...",
      "debut": "Digital Monster Ver. 1",
      "evolvesTo": ["greymon", "centarumon"]
    }
  ]
}
```

- `id`: stable lowercase slug derived from the species name (unique, with `-2` suffixes on collision).
- `level`: one of `baby1`, `baby2`, `child`, `adult`, `perfect`, `ultimate`, `armor`, `hybrid`, `xros-wars`, `unknown`, or empty when the infobox gives no level.
- `attribute`: one of `vaccine`, `data`, `virus`, `free`, `variable`, `unknown`, `no-data`, or empty.
- `moves`: the first two `d`/`d2` entries of the first `{{T}}` Attack Techniques template.
- `profile`: English `pe` profile, wiki markup stripped, truncated to 600 characters.
- `zh`: best-effort Simplified Chinese name after `{{ZHO}}` in `ol`, falling back to the English name.
- `evolvesTo`: ids of species linked as primary targets in `==Evolves To==`; card-game/Battle Spirits/aggregate "Any ..." links are excluded and unknown targets are dropped.

## Build statistics

- Species with a non-empty level: 1567
- Species with a non-empty attribute: 1423
- Species with at least one evolution target: 1294
- Species with a non-empty English profile: 1140
- Species with a non-English Chinese name: 1103

### Level distribution

| Level | Count |
| --- | ---: |
| `ultimate` | 416 |
| `adult` | 315 |
| `perfect` | 303 |
| `child` | 199 |
| `unknown` | 119 |
| `armor` | 72 |
| `baby2` | 62 |
| `baby1` | 49 |
| `(empty)` | 47 |
| `hybrid` | 32 |

### Attribute distribution

| Attribute | Count |
| --- | ---: |
| `virus` | 464 |
| `data` | 355 |
| `vaccine` | 338 |
| `(empty)` | 191 |
| `unknown` | 139 |
| `free` | 93 |
| `variable` | 32 |
| `no-data` | 2 |
