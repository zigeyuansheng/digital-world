# Digital Partner — Digimon Pixel Sprite Library

Extracted from the user-provided **Digital Partner 1.1.9 (PC)** build.

## Contents

- `manifest.json` — 1,360 frame records:
  - display name (`id`)
  - internal GameMaker sprite key (`sprite`)
  - tier / attribute / HP / ATK / velocity
  - frame index and PNG filename
- `plugin_match_report.json` — matching against the 1,614-entry Wikimon snapshot
  in the DSH plugin (543/643 display names matched directly)
- `game_data.json` — original `digimon_data.json` metadata from the game
- `*.png` — 1,360 transparent pixel sprites at native resolution
- `contact_sheet.png` — first 60 unique species preview
- `extract.log` — extraction summary

## Source / method

1. Extracted the NSIS installer with 7-Zip.
2. Opened the bundled GameMaker `data.win`.
3. Parsed the `SPRT` (sprite records), `TPAG` (texture page items), `TXTR`
   (texture pages), and `STRG` (strings) chunks.
4. Decoded the game's BZip2 + custom GameMaker QOI texture pages.
5. Cropped each sprite's source rectangle and saved it as a transparent PNG.
6. Joined the game's `digimon_data.json` metadata to the sprite records.

The library contains 668 unique internal sprite names and 643 unique display
names (some Digimon forms share a display name). Only actual Digimon from the
game's data are included.

Regenerate with:

```powershell
python tools/extract_digimon_sprites.py
```
