# Plugin Integration Contract — Route 01

The Godot project is the **scene asset layer**, not the game.

## Render contract

- Scene id: `route-01`
- Internal resolution: `320 × 180`
- Display resolution: `1280 × 720`
- Pixel scale: 4× nearest
- Tile size: `16 × 16`
- Main scene: `res://scenes/Main.tscn`
- Renderer-neutral scene manifest: `assets/scene_route01.json`

## State passed from the DSH plugin to the scene

```json
{
  "scene": "route-01",
  "weather": "sunny | rain | snow | aurora | storm",
  "time": "dawn | day | dusk | night",
  "season": "spring | summer | autumn | winter",
  "activeDigimon": {
    "species": "Agumon",
    "stage": "child",
    "mood": 82
  },
  "ambientActors": [
    { "species": "Gabumon", "mode": "wander" },
    { "species": "Patamon", "mode": "wander" }
  ]
}
```

## Events emitted from the scene

- `scene_ready`
- `actor_clicked` with species id (optional; the plugin decides whether to open a panel)
- `ambient_event` such as `butterfly`, `leaf`, `data_mote`

## Current scene

Route 01 is the first File Island vertical slice. It has no player movement.

## Web renderer contract (D2)

Because the Host cannot run a Godot runtime, the scene layer is exported as
renderer-neutral manifests and drawn by the panel's Canvas:

- Manifests: `assets/scenes/<region>.json` (one per File Island region), plus
  `assets/scenes/index.json`. Generate with `tools/build_scene_manifests.py`.
- Each manifest carries `kind` (city / gym / forest / desert / coast / snow /
  swamp / machine / volcano), a `palette`, placed `objects` and ambient `actors`.
- `facilities` objects map to the seven File City facilities and are drawn taller
  as `state.city.facilities[facility]` rises.
- The plugin copies manifests to `plugins/dsh-plugin-digital-world/lib/scene-data.js`
  (Host) and inlines them in `lib/client.js` (browser), so the panel renders the
  region scene after a page refresh.
- Panel view toggle: 现场 (region scene) / 岛屿 (island overview).

All six visible actors are real Digimon:

- Agumon
- Gabumon
- Patamon
- Palmon
- Gomamon
- Biyomon

The plugin is responsible for battle triggers, data absorption, evolution,
inventory, eggs, and the `digital_world` tool. The Godot scene is responsible
only for visible environment and ambient actor animation.
