# Digital World

Private development repository for the **Digital World** project: a Godot-authored
FireRed/LeafGreen-style pixel scene layer intended to be used by the DSH
Digital World plugin.

## What is in this repository

```text
godot-digital-world/
  scenes/FileCity.tscn        FireRed-style environment scene
  preview_filecity.png        1280x720 preview
  assets/digimon/             1,360 real Digimon pixel sprites extracted from
                              Digital Partner 1.1.9 (668 unique sprite names)
  assets/sprites/environment/ FireRed overworld tileset and environment assets
  source/maps/overworld/      FireRed map scene used as environment source
  scripts/                    scene and actor scripts

digitalpartner_sprites/
  manifest.json               1,360 frame records with name/tier/type metadata
  contact_sheet.png           visual index
  game_data.json              original Digital Partner metadata
  README.md                   extraction details

digitalpartner_backgrounds/
  extracted Digital Partner background references and generated field concepts

plugins/dsh-plugin-digital-world/
  current DSH plugin source (scene integration is the next milestone)

tools/
  asset extraction, preview generation, and sprite validation scripts
```

## Current state

- FireRed/LeafGreen-style environment assets imported from the open-source
  Godot 4.4 fan project `SlayHorizon/pokemon-fireleaf-godot` (code MIT; art
  from the original games; private, non-commercial development only).
- `FileCity.tscn` contains the FireRed environment map with the Pokémon player
  and UI removed, plus six real Digimon actors. There is **no player-controlled
  movement** in the scene.
- Real Digimon pixel library extracted from the user-provided
  **Digital Partner 1.1.9** GameMaker build: 668 unique sprite names and
  1,360 transparent frame PNGs.
- DSH plugin integration is still in progress; the plugin source is included
  as the current development state.

## Engine

- Godot 4.4
- internal viewport 320×180 (configurable; project currently renders at
  1280×720 through `canvas_items` stretch)
- nearest-neighbor texture filtering
- GL Compatibility renderer

## Notes

This is a private, non-commercial development repository. Third-party asset
provenance is documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
