# Forward game package

Forward is a solo or two-player (Guide) roguelike card adventure about crossing nine haunted Domains to reach the Golden City and face the Guardian. This folder reshapes the Notion export into a readable structure with rules, cards, art, and music references.

## Folder map
- `rules/rules.md` - clean draft of the rules.
- `rules/notion-export.md` - raw export for reference.
- `cards/cardlist.csv` and `cards/cardlist_all.csv` - full card tables from the export.
- `cards/by-domain/` - individual card markdown files renamed to `###-title.md`, grouped by Associated_Location (with `core/` for specials and trackers).
- `art/` - current style prompt and image assets.
- `music/` - music inspiration and notes (playlist link).

## Quick start
1) Read `rules/rules.md` for the trimmed, printable ruleset and designer notes.
2) Browse `cards/by-domain/<domain>/` to spot-check station cards for each Domain; specials and trackers live in `cards/by-domain/core/`.
3) Use `cards/cardlist_all.csv` if you want to filter or sort the full set (e.g., by Type or Domain).
4) Review `art/ARTWORK.md` and the images when briefing an artist; keep music references in `music/`.

## Card data snapshot
- 200 cards total in the export.
- Domain coverage: 9 Domains with 18-19 cards each; 31 cards are global specials/trackers.
- Type mix (counts from `cardlist_all.csv`): 84 Caesura, 24 Spare, 9 each of Pit/Terror/Blessing/Beast/Location, 8 Snare, 8 Rest, 8 Equipment, 8 Item, 6 Hollow, 4 Special-Tracker, 3 Companion, 3 Special.

## Notes
- The raw Notion export remains in `forward-11.25.25/unpacked` if you need the original filenames.
- All text has been normalized to ASCII for easier editing and print prep.
