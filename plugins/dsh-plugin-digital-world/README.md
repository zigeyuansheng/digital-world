# dsh-plugin-digital-world

**v0.4** — a persistent 1280×720 pixel Digital World for the DSH Web UI.

The game uses a generated **1,614-entry Wikimon snapshot** for species names, levels, attributes, types, moves, profiles and evolution links. All game systems — the original File Island layout, random eggs, care, training, battles, data absorption, DigiNest, File City restoration and the pixel renderer — are original designs.

## Play

> If this replaces a running v0.1 plugin, restart DeepSeek Harness once so the Host loads the new module generation; a browser refresh alone only reloads the client half.

Open the **数码世界 / Digital World** panel from the sidebar. The game has:

- a 1280×720 pixel stage: island map on the left, HUD on the right
- a random starter Digitama that hatches into a random Baby I from a complete-growth lineage
- multiple owned Digimon with a 12-slot DigiNest and a 3-slot battle party
- feeding, cleaning, petting, sleeping, healing and six-stat training
- exploration across File Island regions, wild battles and data absorption
- rebuild defeated data into a same-lineage egg (costs a rebuild program)
- real Wikimon evolution links, gated by level, Bond, power and data noise
- DigiLink party bonuses, File City facility upgrades, data storms and seasons
- a Dex browser over all 1,614 entries

## Data

`data/digimon.json` is generated from Wikimon's `List of Digimon` and per-page infoboxes. The build script is `tools/build-digimon-data.mjs`; its cache is under `tools/.cache` and should not be committed.

The generated snapshot contains **1,614 species** (pinned to the 2026-07-25 list revision, when Wikimon's page text counted 1,614), with **1,325 official Reference Book entries** as the authoritative subset. 1,103 entries have a Chinese name, 1,114 have at least one special move, and 1,294 have at least one recorded evolution target. The live Wikimon list has since grown; `tools/build-digimon-data.mjs --refresh` can rebuild a newer snapshot.

Default save location: `<DSH profile directory>/digital-world/state.json`.
Override `root` in `cordis.patch.yml` to use another directory.

## Files

- `lib/game-data.js` — catalog loader, indexes, regions, stage mapping
- `lib/world.js` — pure game engine and action API
- `lib/store.js` — serialized persistence
- `lib/panel-route.js` — `/api/digital-world` route
- `lib/plugin.js` — Host tool / route / passive clock
- `lib/client.js` — 1280×720 pixel UI
- `data/digimon.json` — generated Wikimon snapshot
- `docs/v0.2-design.md` — design history

## Test

```powershell
node test/run-tests.mjs
```
