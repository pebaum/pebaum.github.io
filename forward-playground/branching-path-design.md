# Forward - Branching Path System Design

## Location Map Structure

```
                    [1] Home Village (Terminus)
                     |
        ┌────────────┴────────────┐
        ↓                         ↓
       [2]                       [3]
        |                         |
    ┌───┼───┐                    [6]
    ↓   ↓   ↓                     |
   [3] [4] [?]                   [8]
        |                      ↗  |  ↘
    ┌───┼───┐                [7] ←─→ [9]
    ↓   ↓                      ↘  ↑  ↗
   [5] [7]                       [9]
    |
   [6]
    |
   [8]
    |
 [7]↔[9]
```

Let me clarify the path structure based on your description:

### Path Connections
- **Location 1 (Home Village)** → 2 or 3
- **Location 2** → 3 or 4
- **Location 3** → 6
- **Location 4** → 5 or 7
- **Location 5** → 6 (assumed, connects to 3's path)
- **Location 6** → 8
- **Location 7** ↔ 8 (bidirectional)
- **Location 7** → 9
- **Location 8** → 9
- **Location 9** → Final Boss Encounter

---

## Special Items (Path Gates)

### Mirror Knight's Blessing (Location 5)
- **Boss:** Mirror Knight
- **Reward:** Mirror Shard
- **Effect:** When you reach 0 HP, resurrect at 10 HP (one-time use)
- **Gate:** Required to survive Location 9 Final Boss (mandatory death mechanic without it)

### Other Gate Items (Design Needed)

To create a "correct path" system, each location needs to drop an item that gates a later location:

#### Proposed Gate System

| Location | Boss Name | Item Dropped | Gates Access To | Death Mechanic If Missing |
|----------|-----------|--------------|-----------------|---------------------------|
| 1 | (Tutorial) | Sealed Map Fragment | - | (Always passable) |
| 2 | Ashen Warden | Warden's Sigil | Location 4 | "The gate rejects you. You are not worthy." |
| 3 | Frost Sentinel | Crystal Key | Location 6 | "The barrier freezes you solid." |
| 4 | Corrupted Elder | Elder's Seal | Location 7 | "The corruption overwhelms you." |
| 5 | Mirror Knight | Mirror Shard | Location 9 Final Boss | "You face your reflection and are destroyed." |
| 6 | Abyssal Watcher | Watcher's Eye | Location 8 | "The abyss stares back, and you are lost." |
| 7 | Void Herald | Void Anchor | Location 9 (alt) | "The void consumes you entirely." |
| 8 | Eclipse Guardian | Eclipse Token | Location 9 (final gate) | "You are erased from existence." |

---

## The Correct Path

### Path 1: Standard Victory Route
```
1 → 2 → 4 → 5 → 6 → 8 → 7 → 9 → Final Boss
```

**Items collected:**
- Warden's Sigil (2) → unlocks 4
- Elder's Seal (4) → unlocks 7
- Mirror Shard (5) → survives Final Boss death mechanic
- Crystal Key (bypass 3, go through 6) → unlocks 8
- Watcher's Eye (6) → unlocks 8
- Eclipse Token (8) → unlocks 9
- Void Anchor (7) → backup for 9

**Wait, this doesn't work if 6 requires Crystal Key from 3...**

Let me redesign this more carefully. The user said:
- 2 → 3 is possible (so you can get Crystal Key after going to 2)
- Need to ensure there's exactly ONE path that collects all necessary items

### Revised Correct Path

```
1 → 2 → 3 → 6 → 8 → 7 → 9 → Final Boss
       ↓
       4 → 5
```

**Problem:** If you go 2 → 3 → 6, you miss 4 → 5 (Mirror Knight). But Mirror Shard is required for Final Boss.

**Alternative:** You MUST go through Location 5 to get Mirror Shard.

Let me redesign the requirements:

---

## Revised Gate System (Ensures Single Correct Path)

### Core Design Principle
- **Mirror Shard (Location 5) is MANDATORY** for Final Boss
- Create gates that force you through Location 5
- Other gates ensure you can't skip critical locations

### Gate Requirements

| From → To | Required Item | Source Location | Death Message |
|-----------|---------------|-----------------|---------------|
| 2 → 4 | Warden's Sigil | Automatically obtained in Location 2 | "The sealed gate rejects you." |
| 3 → 6 | Crystal Key | Automatically obtained in Location 3 | "The frozen barrier blocks your path." |
| 4 → 5 | (None) | - | (Open) |
| 5 → 6 | Mirror Shard | Obtained from Mirror Knight (Location 5 boss) | N/A (can't go this way) |
| 4 → 7 | Elder's Seal | Automatically obtained in Location 4 | "The corruption consumes you." |
| 6 → 8 | Watcher's Eye | Automatically obtained in Location 6 | "The abyss stares back." |
| 7 → 8 | (Both ways open) | - | (Open) |
| 8 → 7 | (Both ways open) | - | (Open) |
| 7 → 9 | Eclipse Token OR Void Anchor | Location 8 OR Location 7 | "You are erased from existence." |
| 8 → 9 | Eclipse Token | Automatically obtained in Location 8 | "The darkness devours you." |
| 9 → Final Boss | Mirror Shard | Location 5 (Mirror Knight) | "Your reflection destroys you." |

### The ONE Correct Path

```
1 → 2 (get Warden's Sigil)
    ↓
    4 (get Elder's Seal)
    ↓
    5 (defeat Mirror Knight, get Mirror Shard) ← CRITICAL
    ↓
    7 (get Void Anchor) ← Can use Elder's Seal from 4
    ↓
    8 (get Eclipse Token)
    ↓
    9 (requires Eclipse Token + Mirror Shard)
    ↓
    Final Boss (Mirror Shard triggers resurrection)
```

### Wrong Paths and Why They Fail

#### Path A: 1 → 3 → 6 → 8 → 9
- **Fails:** Never go through Location 5 → no Mirror Shard → die at Final Boss

#### Path B: 1 → 2 → 3 → 6 → 8 → 9
- **Fails:** Never go through Location 5 → no Mirror Shard → die at Final Boss

#### Path C: 1 → 2 → 4 → 7 → 9
- **Fails:** Never go through Location 5 → no Mirror Shard → die at Final Boss
- **Also fails:** Skipped Location 8 → no Eclipse Token → die entering Location 9

---

## Items as Loot vs Auto-Obtained

### Option 1: Auto-Obtained (Simpler)
- Defeating Hollow automatically grants the gate item
- No inventory management
- Player can't accidentally skip it

### Option 2: Boss Drop (More Interesting)
- Mirror Knight drops Mirror Shard as loot card
- Must be drawn from deck after boss fight
- Adds tension: "Did I get the critical item?"

**Recommendation:** Use **Auto-Obtained** for gate items, **Boss Drop** for Mirror Shard to make it special.

---

## Mirror Shard Mechanics

### How It Works
1. Defeat Mirror Knight (Location 5 boss)
2. Mirror Shard appears in your inventory automatically
3. Mirror Shard is passive (doesn't take equipment slot)
4. When you reach 0 HP (anywhere in game):
   - Mirror Shard activates automatically
   - You resurrect at 10 HP
   - Mirror Shard is consumed (one-time use)
5. **Special:** Final Boss has a "mandatory death" phase at 50% HP
   - Without Mirror Shard: Instant death, run ends
   - With Mirror Shard: Resurrect, continue fight

### Impact on Win Rate
- Current 41.1% win rate assumes no resurrection
- With Mirror Shard: +15-20% effective HP during final locations
- Expected win rate: 50-55% (with forced correct path)

---

## Implementation Questions

### 1. How do players choose paths?
**Option A:** At end of each location, present choice menu
```
You have cleared Location 2.

Choose your next destination:
[3] The Frozen Wastes (Crystal Key required)
[4] The Corrupted Grove (Warden's Sigil required) ✓
```

**Option B:** Locations are cards in the deck (choose-your-own-adventure style)

### 2. What happens if player chooses wrong path?
**Option A:** Instant death screen
```
You lack the required item to enter this location.
The [gate mechanic] destroys you.

GAME OVER
```

**Option B:** Warning before entering
```
⚠️ Warning: You lack [item name]
Entering will result in certain death.
Proceed anyway? [Yes] [No]
```

### 3. How does this affect simulation?
- Current simulation assumes linear 1-9 progression
- New simulation needs to:
  - Track correct path: 1→2→4→5→7→8→9
  - Account for Mirror Shard resurrection (extra life)
  - Test if forced path changes win rate

---

## Diagram: Final Correct Path

```
┌─────────────────────────────────────────────────┐
│  Location 1: Home Village (Terminus)            │
│  - Tutorial location                            │
│  - Always accessible                            │
└───────────────┬─────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────┐
│  Location 2: Ashen Fortress                       │
│  - Boss: Ashen Warden                             │
│  - Reward: Warden's Sigil (auto-obtained)        │
│  - Unlocks: Location 4                            │
└───────────────┬───────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────┐
│  Location 4: Corrupted Grove                      │
│  - Requires: Warden's Sigil                       │
│  - Boss: Corrupted Elder                          │
│  - Reward: Elder's Seal (auto-obtained)          │
│  - Unlocks: Location 5, Location 7                │
└───────────────┬───────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────┐
│  Location 5: Mirror Chamber ★ CRITICAL            │
│  - Requires: (Open from Location 4)               │
│  - Boss: Mirror Knight                            │
│  - Reward: Mirror Shard (resurrection item)      │
│  - Unlocks: Path to victory                       │
└───────────────┬───────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────┐
│  Location 7: Void Sanctum                         │
│  - Requires: Elder's Seal (from Location 4)       │
│  - Boss: Void Herald                              │
│  - Reward: Void Anchor (auto-obtained)           │
│  - Unlocks: Location 8, Location 9 (alt)         │
└───────────────┬───────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────┐
│  Location 8: Eclipse Citadel                      │
│  - Requires: (Open from Location 7)               │
│  - Boss: Eclipse Guardian                         │
│  - Reward: Eclipse Token (auto-obtained)         │
│  - Unlocks: Location 9                            │
└───────────────┬───────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────┐
│  Location 9: The Convergence                      │
│  - Requires: Eclipse Token (from Location 8)      │
│  - Boss: Hollow of location                       │
│  - Unlocks: Final Boss                            │
└───────────────┬───────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────┐
│  FINAL BOSS: [Name TBD]                           │
│  - Requires: Mirror Shard (from Location 5)       │
│  - Mandatory death phase at 50% HP                │
│  - Without Mirror Shard: Instant Game Over        │
│  - With Mirror Shard: Resurrect at 10 HP          │
└───────────────────────────────────────────────────┘
```

---

## Alternate Paths (All Lead to Failure)

### Path via Location 3
```
1 → 2 → 3 (get Crystal Key)
         ↓
         6 (requires Crystal Key)
         ↓
         8
         ↓
         9
         ↓
         Final Boss → DEATH (no Mirror Shard)
```

### Path skipping Location 5
```
1 → 2 → 4 → 7 → 8 → 9 → Final Boss → DEATH (no Mirror Shard)
```

---

## Questions for You

1. **Do you want failed paths to be visible/accessible?**
   - Players see locked locations in gray with requirements?
   - Or completely hide inaccessible locations?

2. **Should Mirror Shard be obvious or hidden?**
   - Tell player: "Mirror Shard grants resurrection"
   - Or hidden: Player discovers it when they die

3. **Final Boss design:**
   - How much HP for Final Boss?
   - What tier difficulty (equivalent to Location 10)?
   - Special mechanics besides mandatory death phase?

4. **Are Location 3 and Location 6 dead ends?**
   - Current design: 3 → 6 → nowhere (can't reach 9)
   - Should these connect differently?

5. **Path choice UI:**
   - After each location, show map and let player choose?
   - Or automatic progression with gates?

---

## Next Steps

1. Finalize location connections
2. Design gate items and their lore
3. Implement Mirror Shard resurrection mechanic
4. Create Final Boss encounter
5. Update simulation to test forced correct path
6. Balance Mirror Shard impact on win rate

Let me know your thoughts on the path structure and I'll refine this design!
