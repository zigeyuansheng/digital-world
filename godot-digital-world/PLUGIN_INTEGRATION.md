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
