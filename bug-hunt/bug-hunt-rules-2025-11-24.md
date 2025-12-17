# Bug Hunt: Festival Rush — Rules (2025-11-24)

Publish-ready one-pager for the current prototype.

## Snapshot
- Players: 1–4, simultaneous real-time.
- Days: 3 timed rounds (2:00 each by default).
- Win: Highest total points after Day 3. Tiebreakers: most Large bugs, then most total bugs; if still tied, one sudden-death Large bug roll-off.

## Components (table or print-and-play)
- Hex map with terrain costs 1 / 2 / 3 and a Camp at (0,0).
- Bug tokens: Small, Medium, Large.
- Hunter pawns and 10 HP tracker for each player.
- 1d6, timer (phone is fine).

## Setup
1) Place map; all Hunters start on Camp (0,0) at 10 HP.
2) Prepare bug pool and scatter across the map (leave Camp empty). Suggested mix: Small 10, Medium 6, Large 4.
3) Set Day timer to 2:00. Keep a scoresheet visible to all.

## Day Flow (all players act at once)
1) Start the timer.
2) Players loop independently while the clock runs:
   - Roll 1d6 for movement points.
   - Spend points entering adjacent hexes (cost 1/2/3). Remaining points carry over within the loop; entering a bug hex ends any remaining movement.
   - If you enter a bug hex, you must fight it before moving again.
3) When the timer ends, all actions stop immediately. Score defeated bugs you already claimed. Reset movement/fights; keep HP where it stands.

## Movement
- Adjacent hex moves only; pay the terrain cost per hex.
- You cannot enter or pass through a hex containing someone else’s active fight (their bug is locked to them until resolved).
- You may pass through other Hunters when they are not fighting.

## Combat
- Gate by size: Small hit on 4+, Medium 5+, Large 6+.
- Large bugs require 2 total hits to capture.
- Roll 1d6 repeatedly until you hit or the Day ends.
- On any roll of 1–3: you lose 1 HP (flat). This replaces sting values.
- On a completed capture: take the bug token and points (Small 1, Medium 2, Large 5).
- If HP drops to 0: you are knocked out and immediately return to Camp at full HP; your current action ends, you keep your tokens.

## Healing
- Entering Camp (0,0) fully heals you immediately. You may move on after healing if you still have movement.

## Scoring
- Points from captured bugs count instantly and persist across Days.
- End of Day: tally newly won bugs; do not lose points on knockout.
- After Day 3: highest total wins; use tiebreakers above.

## Between Days
- Scoop any remaining bugs, add fresh ones if desired, and re-scatter.
- Reset timer to full; keep scores; keep current HP (healing requires returning to Camp during play).

## Optional Variants
- Pressure Timer: +1 flat damage on low rolls (1–3) on Day 2; +2 on Day 3.
- Shop: Between Days, spend points on one-use items (Net = skip one bug, Smoke = walk past one bug, Poison = auto-kill Small/Medium).
- Specialties: Each Hunter picks Ground/Flying/Armored; once per fight, turn one miss into a hit vs that type.

## Digital Prototype Parity
- The accompanying `bug-hunt-web.html` follows these rules: 2:00 Days, Large = 2 hits and 5 points, 1–3 loses 1 HP, full heal on Camp, locked fights per player, and optional auto-play/simulation.
