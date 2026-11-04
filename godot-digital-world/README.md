# Digital World — Godot Scene Layer

This is the Godot 4.4 scene-asset project for the DSH Digital World plugin.

It is **not** the game itself. It only renders the environment and the ambient
Digimon. The DSH plugin keeps the game state, random eggs, multiple Digimon,
data absorption, battles, Agent tools, and save data.

## Run

Open this folder in **Godot 4.4** and run `scenes/FileCity.tscn`.

## Scene contents

- `scenes/FileCity.tscn` — **main scene**: authentic FireRed/LeafGreen-style
  Pallet Town/Route 1 environment, stripped of the Pokémon player and UI;
  six real Digimon actors wander in the town area. Environment assets come
  from the open-source Godot 4.4 fan project `SlayHorizon/pokemon-fireleaf-godot`
  (code MIT; art from the original games).
- `preview_filecity.png` — 1280×720 preview of the FileCity layout
- `assets/sprites/environment/tilesets/overworld_tileset.png` — actual FireRed
  overworld tileset (1152×496, 16×16 tiles)
- `source/maps/overworld/overworld.tscn` — original map scene used as the
  environment source
- `scenes/Main.tscn` — earlier hand-built top-down Route 01 diorama
- `scenes/FieldBackground.tscn` — side-view field scene inspired by the
  Digital Partner clean-day background (`Scleanbgday`); no player movement,
  six Digimon wander in the meadow
- `preview_field_scene.png` — 1280×720 field scene preview
- `scripts/file_city_actors.gd` — Digimon actors for the FileCity map
- `scripts/field_background.gd` — builds the field scene and its ambient actors
- `assets/backgrounds/field_background.png` — clean field background without
  baked actors, generated for the Godot scene
- `scripts/main.gd` — builds the earlier top-down tilemap, props and creatures
- `scripts/creature.gd` — wandering/idle behaviour for the six Digimon
- `scripts/ambient.gd` — floating data motes
- `assets/scene_route01.json` — renderer-neutral scene manifest for the DSH plugin
- `preview_route01.png` — asset-layout preview (1280×720) built from the same assets
- `assets/tiles/terrain.png` — 16×16 pixel tile atlas
- `assets/objects/` — cottage, tree, sign, rock, shadow
- `assets/digimon/` — pixel sprite library extracted from the user-provided
  **Digital Partner 1.1.9** GameMaker build (`data.win`):
  - 668 unique Digimon sprite names
  - 1360 extracted frame PNGs
  - `manifest.json` with name / tier / attribute / type / frame metadata
  - `contact_sheet.png` is a quick visual index
  - scene currently uses Agumon, Gabumon, Patamon, Palmon, Gomamon and Biyomon
    (`Piyomon_f0.png` is the game's Biyomon sprite)
- `assets/creatures/` — older Wikimon map sprites retained only as reference

All species are real Digimon entries from the Wikimon snapshot in
`../plugins/dsh-plugin-digital-world/data/digimon.json`.

## No player movement

There is deliberately no player-controlled character. The visual scene is a
living diorama: the camera breathes gently, water tiles animate, tree canopies
sway, ambient motes drift, and the six Digimon wander around the route.

Gameplay actions are triggered by the DSH plugin buttons / `digital_world` tool,
not by walking a character in this scene.

## Plugin integration

The scene is intended to be used as the visual layer of the DSH plugin:

1. Export the scene as a Godot Web build (or render it as an autoplay scene
   capture) and embed it in the plugin panel.
2. Send `region`, `weather`, `time`, active Digimon and scene events from the
   plugin Host to the scene bridge.
3. Keep battle checks, data absorption, evolution, inventory and Agent actions
   in the plugin Host.

The current route scene is the first vertical slice; additional File Island
regions will be added as sibling `.tscn` scenes rather than changing this scene.
