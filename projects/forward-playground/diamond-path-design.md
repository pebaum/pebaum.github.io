# Forward - Diamond Path System Design

## Physical Layout (Diamond)

```
                    9
                  /   \
                7       8
              /   \   /   \
            4       5       6
              \   / | \   /
                2   |   3
                  \ | /
                    1
```

### Adjacency Map

| Location | Can Move To |
|----------|-------------|
| 1 | 2, 3 |
| 2 | 1, 3, 4, 5 |
| 3 | 1, 2, 5, 6 |
| 4 | 2, 5, 7 |
| 5 (center) | 2, 3, 4, 6, 7, 8 |
| 6 | 3, 5, 8 |
| 7 | 4, 5, 8, 9 |
| 8 | 5, 6, 7, 9 |
| 9 (final) | 7, 8 |

---

## The ONE Correct Path

```
1 → 2 → 3 → 6 → 5 → 4 → 7 → 8 → 9 → Final Boss
```

**Key insight:** Location 5 (Mirror Knight) is in the MIDDLE of the sequence, not near the end. Players must discover this through trial and error.

---

## Gate System Design

### Design Principle
Each location has a **death trap** that requires a specific item/equipment from the correct previous location. If you don't have it, you die instantly.

### Location Rewards (Items/Equipment Dropped)

| Location | Boss/Reward | Item Given | Purpose |
|----------|-------------|------------|---------|
| 1 | (Tutorial) | **Lantern** | Light-based item (generic) |
| 2 | Ashen Warden | **Warden's Key** | Unlocks gates |
| 3 | Frost Sentinel | **Crystal Vial** | Protects from cold |
| 6 | Abyssal Watcher | **Void Compass** | Navigate darkness |
| 5 | **Mirror Knight** | **Mirror Shard** | **Prevents mandatory death in Final Boss** |
| 4 | Corrupted Elder | **Elder's Seal** | Purifies corruption |
| 7 | Void Herald | **Eclipse Token** | Required for Location 8 |
| 8 | Eclipse Guardian | **Final Key** | Required for Location 9 |
| 9 | Hollow of Convergence | (None) | Unlocks Final Boss |

---

## Death Traps by Location

### Location 1: Home Village (Tutorial)
- **No trap** - Always safe
- **Reward:** Lantern (starting item, not used for gates)

---

### Location 2: Ashen Fortress
- **Entry requirement:** None (accessible from Location 1)
- **Death trap:** None
- **Boss:** Ashen Warden
- **Reward:** Warden's Key

---

### Location 3: Frozen Wastes
- **Entry requirement:** Must come from Location 2
- **Death trap card:** "Warden's Gate"
  - *"A massive sealed gate blocks your path. Without the Warden's Key, you cannot proceed."*
  - **Requires:** Warden's Key (from Location 2)
  - **If missing:** Instant death
- **Boss:** Frost Sentinel
- **Reward:** Crystal Vial (protects from freezing)

---

### Location 6: Abyssal Depths
- **Entry requirement:** Must have Crystal Vial (from Location 3)
- **Death trap card:** "Frozen Chasm"
  - *"You enter a chamber where the air itself freezes solid. Without protection, your blood crystallizes."*
  - **Requires:** Crystal Vial (from Location 3)
  - **If missing:** Instant death
- **Boss:** Abyssal Watcher
- **Reward:** Void Compass (navigate darkness)

---

### Location 5: Mirror Chamber ⭐ CRITICAL
- **Entry requirement:** Must have Void Compass (from Location 6)
- **Death trap card:** "Infinite Abyss"
  - *"The chamber is pitch black. Without a guide, you wander forever into the void."*
  - **Requires:** Void Compass (from Location 6)
  - **If missing:** Instant death
- **Boss:** Mirror Knight
- **Reward:** **Mirror Shard** (prevents mandatory death in Final Boss)

**Note:** This is the critical location. If you skip Location 5, you can't win the game.

---

### Location 4: Corrupted Grove
- **Entry requirement:** Must have Mirror Shard (from Location 5)
- **Death trap card:** "Reflection Trap"
  - *"Your reflection steps out of the shadows and attacks. Without the Mirror Shard's protection, it destroys you."*
  - **Requires:** Mirror Shard (from Location 5)
  - **If missing:** Instant death
- **Boss:** Corrupted Elder
- **Reward:** Elder's Seal (purifies corruption)

**Note:** This location REQUIRES you to have already been to Location 5. This is the key constraint.

---

### Location 7: Void Sanctum
- **Entry requirement:** Must have Elder's Seal (from Location 4)
- **Death trap card:** "Corruption Surge"
  - *"A wave of corruption overwhelms you. Without the Elder's Seal, you are consumed."*
  - **Requires:** Elder's Seal (from Location 4)
  - **If missing:** Instant death
- **Boss:** Void Herald
- **Reward:** Eclipse Token

---

### Location 8: Eclipse Citadel
- **Entry requirement:** Must have Eclipse Token (from Location 7)
- **Death trap card:** "Eclipse Barrier"
  - *"The entrance is sealed by an eclipse. Only the Eclipse Token can open it."*
  - **Requires:** Eclipse Token (from Location 7)
  - **If missing:** Instant death
- **Boss:** Eclipse Guardian
- **Reward:** Final Key

---

### Location 9: The Convergence
- **Entry requirement:** Must have Final Key (from Location 8)
- **Death trap card:** "Sealed Gate of Convergence"
  - *"The final gate requires the Final Key. Without it, you cannot enter."*
  - **Requires:** Final Key (from Location 8)
  - **If missing:** Instant death
- **Boss:** Hollow of Convergence
- **Reward:** Access to Final Boss

---

### Final Boss
- **Entry requirement:** Must have Mirror Shard (from Location 5)
- **Mandatory death phase:** At 50% HP, boss kills you
  - **With Mirror Shard:** Resurrect at 10 HP, continue fight
  - **Without Mirror Shard:** Instant game over

---

## Why Other Paths Fail

### Example: 1 → 2 → 4 → 5 → ...
- **Fails at Location 4:** Requires Mirror Shard (from Location 5)
- **Cannot proceed:** Need to go to 5 first, but 5 requires Void Compass (from 6)
- **Circular dependency:** Cannot reach Location 5 without going through 3 → 6 first

### Example: 1 → 3 → 6 → 5 → 4 → 7 → 8 → 9
- **Fails at Location 3:** Requires Warden's Key (from Location 2)
- **Skipped Location 2:** No Warden's Key
- **Instant death at Warden's Gate**

### Example: 1 → 2 → 3 → 6 → 8 → 9
- **Fails at Location 8:** Requires Eclipse Token (from Location 7)
- **Skipped Location 7:** No Eclipse Token
- **Instant death at Eclipse Barrier**

### Example: 1 → 2 → 3 → 6 → 5 → 4 → 7 → 8 → 9 ✓ (but skipped Mirror Knight)
- **Fails at Final Boss:** Requires Mirror Shard
- **If you somehow skipped Mirror Knight boss in Location 5:** No Mirror Shard
- **Mandatory death phase kills you permanently**

---

## Discovery Process (Player Experience)

### First Playthrough
```
Player: "I'll try 1 → 3 → 6..."
Game: *draws Warden's Gate card in Location 3*
       "You need the Warden's Key. You die instantly."
Player: "Okay, I need to go to Location 2 first."
```

### Second Playthrough
```
Player: "1 → 2 → 4 → 7..."
Game: *draws Reflection Trap card in Location 4*
       "You need the Mirror Shard. You die instantly."
Player: "Where do I get the Mirror Shard? Must be Location 5."
```

### Third Playthrough
```
Player: "1 → 2 → 3 → 5..."
Game: *draws Infinite Abyss card in Location 5*
       "You need the Void Compass. You die instantly."
Player: "I need to go to Location 6 first. But Location 6 needs Crystal Vial from Location 3..."
Player: "So it's 1 → 2 → 3 → 6 → 5!"
```

### Fourth Playthrough
```
Player: "1 → 2 → 3 → 6 → 5... got Mirror Shard! Now where?"
       "Location 4 needs Mirror Shard, perfect!"
       "1 → 2 → 3 → 6 → 5 → 4 → 7 → 8 → 9"
Game: *reaches Final Boss, mandatory death phase*
       *Mirror Shard activates, resurrects at 10 HP*
       "YOU WIN!"
```

---

## Item Management (Inventory)

### Option 1: Keep All Items
- Inventory has unlimited slots
- Once you get an item, you keep it forever
- Simpler system

### Option 2: Limited Inventory (2-3 items)
- Must choose which items to keep
- Adds strategic depth: "Do I drop the Lantern to pick up the Mirror Shard?"
- Risk: Might drop the wrong item and soft-lock yourself

**Recommendation:** **Option 1** (keep all items) to reduce frustration. The path discovery is hard enough without inventory puzzles.

---

## Death Trap Implementation

### Option A: Special Card Type
Each location deck has a "Gate" card:
- Appears randomly in the first 3 cards drawn
- When drawn: Check inventory for required item
- If missing: Instant death, game over

### Option B: Hollow Boss Requirement
The Hollow boss checks for the required item:
- Before combat starts, check inventory
- If missing: "The boss sees you are unprepared and kills you instantly."
- If present: Normal boss fight

**Recommendation:** **Option A** (Gate card) because:
- Appears early in location (immediate feedback)
- Boss fight is still the climax
- More dramatic: "Oh no, I don't have the key!"

---

## Card Distribution (18 cards + 1 Gate)

### New Deck Structure (19 cards)
- **1 Gate** (checks for required item, appears in first 3 cards)
- 2 Items
- 1 Weapon
- 5 Beasts
- 1 Hollow
- 1 Terror
- 3 Pits
- 1 Snare
- 1 Blessing
- 3 Caesuras

**Gate positioning:** Guarantee Gate appears in first 3 cards (like Hollow in last 3).

---

## Simulation Impact

### Current Win Rate: 41.1%
- Assumes linear path 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

### With Forced Correct Path: 1 → 2 → 3 → 6 → 5 → 4 → 7 → 8 → 9
- Locations are out of difficulty order
- Location 6 (Tier 2) comes before Location 5 (Tier 2)
- Location 4 (Tier 2) comes after Location 5 (Tier 2)

**Expected impact:** Minimal change to win rate (~41% still), but:
- Different difficulty curve
- Location 5 will feel easier (coming from Location 6)
- Location 4 will feel easier (coming from Location 5 with Mirror Shard)

### With Mirror Shard Resurrection
- Grants one extra life (resurrect at 10 HP)
- Used once during Locations 5-9 OR during Final Boss
- Expected impact: +5-10% win rate → **46-51% AI win rate**

---

## Summary: The Correct Path

```
START
  ↓
[1] Home Village (Tutorial)
  → Get: Lantern
  ↓
[2] Ashen Fortress
  → Get: Warden's Key
  ↓
[3] Frozen Wastes
  → Requires: Warden's Key
  → Get: Crystal Vial
  ↓
[6] Abyssal Depths
  → Requires: Crystal Vial
  → Get: Void Compass
  ↓
[5] Mirror Chamber ⭐ CRITICAL
  → Requires: Void Compass
  → Defeat: Mirror Knight
  → Get: Mirror Shard (resurrection item)
  ↓
[4] Corrupted Grove
  → Requires: Mirror Shard
  → Get: Elder's Seal
  ↓
[7] Void Sanctum
  → Requires: Elder's Seal
  → Get: Eclipse Token
  ↓
[8] Eclipse Citadel
  → Requires: Eclipse Token
  → Get: Final Key
  ↓
[9] The Convergence
  → Requires: Final Key
  → Defeat: Hollow of Convergence
  ↓
FINAL BOSS
  → Mandatory death phase (50% HP)
  → Requires: Mirror Shard to resurrect
  ↓
VICTORY!
```

---

## Next Steps

1. **Implement Gate cards** (check inventory, instant death if missing)
2. **Add inventory system** (track items obtained)
3. **Create Mirror Shard resurrection mechanic**
4. **Update simulation** to test correct path: 1→2→3→6→5→4→7→8→9
5. **Design Final Boss** (difficulty, HP, mechanics)
6. **Playtest path discovery** (is it fun to figure out?)

---

## Questions

1. **Gate card appearance:** Should it always be in first 3 cards, or random throughout deck?
2. **Multiple wrong items:** What if you have the wrong item? (e.g., Elder's Seal at Location 3 instead of Warden's Key)
3. **Item reveal:** Should items clearly state what they unlock? Or hidden (discover through play)?
4. **Backtracking:** Can you return to previous locations? Or one-way only?
5. **Visual cues:** How do players know which locations are adjacent (can move to)?

Let me know and I'll implement the gate system and update the simulation!
