# BOARDGAME DESIGN LAB

A no-build static web tool to prototype board games: draw a play area, place boards, spawn card stacks, import CSVs to create cards, drag tokens, and roll dice.

Open `index.html` directly or serve the repo root and visit `/gamedesignertool/`.

## Features
- Play area sized in inches (mapped to pixels at 70 px/in), black-bordered.
- Add board rectangles and edit labels inline.
- Card stacks with common sizes (poker, tarot, mini, square) and portrait/landscape orientation.
  - Stack actions: draw 1/5/N, shuffle (visual), set count, delete.
  - Drawn cards are individual, draggable, double-click to rotate, inline label editing.
- CSV import and search; select rows and spawn matching labeled cards.
- Tokens: round/square/hex with color, size, and label.
- Dice: quick roll d4–d20 in sidebar; place a draggable die on the board and click to roll.
- Selection + keyboard: click to select, Delete to remove, arrows to nudge (Shift for 10px, Ctrl for grid size), Ctrl+[ and Ctrl+] to adjust layering.
- Print: print just the play area; autosave to localStorage; Save/Load as JSON.

## Notes
- Everything runs client-side; CSV never leaves the browser.
- Measurements are approximate visual aids, not print-accurate.
