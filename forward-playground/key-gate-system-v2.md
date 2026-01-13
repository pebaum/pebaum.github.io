# Forward - Key & Gate System (Revised)

## Core Mechanics

### Keys (Regular Cards)
- Keys are **regular cards** in location decks (Equipment, Items, or Blessings)
- They don't say what they unlock
- You pick them up like any other card
- They go into your inventory

### Gates (Regular Cards)
- Gates are **regular cards** in location decks
- They appear in locations you shouldn't go to yet
- When drawn, they check: "Do you have [specific key]?"
  - **If YES:** Card is discarded, continue normally
  - **If NO:** Instant death, game over

### No Backtracking
- Once you choose a location, you can only go to **unchosen locations**
- Can't return to previous locations
- Must commit to path choices

---

## The Correct Path: 1 → 2 → 3 → 6 → 5 → 4 → 7 → 8 → 9

### Location 1: Home Village (Tutorial)
**No keys, no gates**

**Available next:** 2, 3

---

### Location 2: Ashen Fortress
**Key obtained:** "Warden's Key" (Equipment card)
- *"A heavy iron key, etched with wardens' seals."*
- Doesn't say what it unlocks

**No gates** (always accessible from Location 1)

**Available next:** 1 (visited), 3, 4, 5

---

### Location 3: Frozen Wastes
**Key obtained:** "Crystal Vial" (Item card - heals 5 HP + gives key)
- *"A vial of shimmering liquid that protects from extreme cold."*
- Functions as healing item AND key

**Gate card:** "Warden's Gate" (appears randomly in deck)
- *"A massive sealed gate blocks your path. It bears the Warden's seal."*
- **Checks for:** Warden's Key (from Location 2)
- **If missing:** "Without the Warden's Key, you cannot pass. The gate remains sealed... forever." → **DEATH**

**Available next:** 1 (visited), 2 (visited), 5, 6

---

### Location 6: Abyssal Depths
**Key obtained:** "Void Compass" (Equipment card)
- *"A compass that points toward nothing. It guides you through darkness."*

**Gate card:** "Frozen Chasm"
- *"The air itself freezes solid. Your breath crystallizes."*
- **Checks for:** Crystal Vial (from Location 3)
- **If missing:** "Without protection from the cold, your blood freezes in your veins." → **DEATH**

**Available next:** 3 (visited), 5, 8

---

### Location 5: Mirror Chamber ⭐ CRITICAL
**Key obtained:** "Mirror Shard" (Special Item - resurrection)
- Dropped by Mirror Knight boss (Hollow)
- *"A shard of the Mirror Knight's essence. It reflects your soul."*
- **Effect:** When you reach 0 HP anywhere in the game, resurrect at 10 HP (one-time use)

**Gate card:** "Infinite Abyss"
- *"The chamber is pitch black. You can see nothing, hear nothing, feel nothing."*
- **Checks for:** Void Compass (from Location 6)
- **If missing:** "Without a guide, you wander forever into the void." → **DEATH**

**Available next:** 2 (visited), 3 (visited), 4, 6 (visited), 7, 8

---

### Location 4: Corrupted Grove
**Key obtained:** "Elder's Seal" (Equipment card)
- *"A glowing seal that purifies corruption."*

**Gate card:** "Reflection Trap"
- *"Your reflection steps out of the mirror and attacks you."*
- **Checks for:** Mirror Shard (from Location 5)
- **If missing:** "Your reflection is stronger than you. It destroys you utterly." → **DEATH**

**Note:** This forces you to go to Location 5 BEFORE Location 4

**Available next:** 2 (visited), 5 (visited), 7

---

### Location 7: Void Sanctum
**Key obtained:** "Eclipse Token" (Item card)
- *"A token bearing the mark of an eclipse."*

**Gate card:** "Corruption Surge"
- *"A wave of corruption sweeps through the area."*
- **Checks for:** Elder's Seal (from Location 4)
- **If missing:** "The corruption overwhelms you, body and soul." → **DEATH**

**Available next:** 4 (visited), 5 (visited), 8, 9

---

### Location 8: Eclipse Citadel
**Key obtained:** "Final Key" (Equipment card)
- *"The key to the final gate. It hums with power."*

**Gate card:** "Eclipse Barrier"
- *"The entrance is sealed by an eternal eclipse."*
- **Checks for:** Eclipse Token (from Location 7)
- **If missing:** "Only the Eclipse Token can break this seal. You are trapped." → **DEATH**

**Available next:** 5 (visited), 6 (visited), 7 (visited), 9

---

### Location 9: The Convergence
**No keys obtained** (final location before boss)

**Gate card:** "Sealed Gate of Convergence"
- *"The final gate to the Convergence. It requires a key of immense power."*
- **Checks for:** Final Key (from Location 8)
- **If missing:** "You cannot enter without the Final Key." → **DEATH**

**Available next:** Final Boss (if you have Mirror Shard)

---

## Key & Gate Implementation

### Key Cards

Keys replace existing cards in the deck:

| Location | Key | Replaces | Card Type |
|----------|-----|----------|-----------|
| 2 | Warden's Key | Item A | Equipment (doesn't take slot) |
| 3 | Crystal Vial | Item A | Item (heals 3 HP) |
| 6 | Void Compass | Item A | Equipment (doesn't take slot) |
| 5 | Mirror Shard | (Boss drop) | Special (resurrection) |
| 4 | Elder's Seal | Item A | Equipment (doesn't take slot) |
| 7 | Eclipse Token | Item A | Item (doesn't heal) |
| 8 | Final Key | Item A | Equipment (doesn't take slot) |

### Gate Cards

Gates replace existing cards in the deck:

| Location | Gate | Replaces | Checks For |
|----------|------|----------|------------|
| 3 | Warden's Gate | Terror | Warden's Key (from 2) |
| 6 | Frozen Chasm | Terror | Crystal Vial (from 3) |
| 5 | Infinite Abyss | Terror | Void Compass (from 6) |
| 4 | Reflection Trap | Terror | Mirror Shard (from 5) |
| 7 | Corruption Surge | Terror | Elder's Seal (from 4) |
| 8 | Eclipse Barrier | Terror | Eclipse Token (from 7) |
| 9 | Sealed Gate | Terror | Final Key (from 8) |

**Design Note:** Gates replace Terror cards so there's still 18 cards per location.

---

## Example Playthrough: Wrong Path

### Attempt 1: Player goes 1 → 3
```
Location 3 deck shuffles, player draws cards:
- Card 1: Beast (2 HP) → Fight and win
- Card 2: Caesura → Gain 1 Lux
- Card 3: WARDEN'S GATE → Check inventory for Warden's Key

  "A massive sealed gate blocks your path.
   It bears the Warden's seal.

   Do you have the Warden's Key? NO.

   Without the Warden's Key, you cannot pass.
   The gate remains sealed... forever.

   YOU DIED."

GAME OVER - Death at Location 3
```

**Player learns:** Need Warden's Key. Must have skipped Location 2.

---

### Attempt 2: Player goes 1 → 2 → 4
```
Location 2: Draws Warden's Key (picked up successfully)

Location 4 deck shuffles, player draws cards:
- Card 1: Beast (4 HP) → Fight and win
- Card 2: Item → Heal 5 HP
- Card 3: REFLECTION TRAP → Check inventory for Mirror Shard

  "Your reflection steps out of the mirror and attacks you.

   Do you have the Mirror Shard? NO.

   Your reflection is stronger than you.
   It destroys you utterly.

   YOU DIED."

GAME OVER - Death at Location 4
```

**Player learns:** Need Mirror Shard. Must be from Location 5. But how to get to Location 5?

---

### Attempt 3: Player goes 1 → 2 → 3 → 5
```
Location 2: Warden's Key (obtained)
Location 3: Warden's Gate → Check successful! Crystal Vial (obtained)

Location 5 deck shuffles, player draws cards:
- Card 1: Beast (4 HP) → Fight and win
- Card 2: Blessing → Heal 10 HP
- Card 3: INFINITE ABYSS → Check inventory for Void Compass

  "The chamber is pitch black.
   You can see nothing, hear nothing, feel nothing.

   Do you have the Void Compass? NO.

   Without a guide, you wander forever into the void.

   YOU DIED."

GAME OVER - Death at Location 5
```

**Player learns:** Need Void Compass. Probably from Location 6. But Location 6 requires... Crystal Vial (from 3)! Already have it!

---

### Attempt 4: Correct Path Discovery
```
1 → 2 (get Warden's Key)
  → 3 (pass Warden's Gate, get Crystal Vial)
  → 6 (pass Frozen Chasm, get Void Compass)
  → 5 (pass Infinite Abyss, defeat Mirror Knight, get Mirror Shard)
  → 4 (pass Reflection Trap, get Elder's Seal)
  → 7 (pass Corruption Surge, get Eclipse Token)
  → 8 (pass Eclipse Barrier, get Final Key)
  → 9 (pass Sealed Gate, fight Hollow)
  → Final Boss (Mirror Shard resurrects you during mandatory death phase)

VICTORY!
```

---

## Deck Composition (18 cards)

### Standard Location Deck
- 1 Key (Equipment or Item)
- 1 Gate (checks for previous key)
- 1 Remaining Item
- 1 Weapon
- 5 Beasts
- 1 Hollow (boss, guaranteed in last 3 cards)
- 3 Pits
- 1 Snare
- 1 Blessing
- 3 Caesuras

**Total: 18 cards** (same as before)

---

## Gate Card Positioning

**Option 1: Random** (anywhere in deck)
- More unpredictable
- Gate might appear early or late
- Higher tension: "Will I draw the gate?"

**Option 2: First 6 cards** (guaranteed early)
- Fast feedback on wrong path
- Less frustration (fail fast)
- Better for learning the correct path

**Recommendation:** **Option 2** (first 6 cards) for better UX

---

## Mirror Shard Special Case

**Mirror Shard is unique:**
- Not picked up from deck draw
- Automatically obtained after defeating Mirror Knight boss (Hollow of Location 5)
- Added to inventory immediately
- Doesn't take equipment slot
- Passive resurrection effect

**Why it's special:**
- Can't accidentally skip it
- Always tied to boss fight (climactic moment)
- Required for Final Boss survival

---

## Inventory System

### Simple Inventory (Unlimited)
- All keys/items go into a shared inventory
- Equipment still limited to 2 slots (weapon + Empty Prism)
- Keys don't take equipment slots
- Can't drop or discard keys

**Gates check:** "Is [key name] in inventory?"

---

## Implementation for Simulation

```python
@dataclass
class GameState:
    hp: int = 20
    max_hp: int = 20
    lux: int = 0
    equipment: List[Card] = None
    inventory: List[str] = None  # NEW: Track keys
    mirror_shard: bool = False    # NEW: Track Mirror Shard
    snare_active: bool = False
    current_location: int = 1
    locations_visited: List[int] = None  # NEW: Track path
```

### Gate Card Resolution
```python
def resolve_gate(state: GameState, gate_name: str, required_key: str) -> bool:
    if required_key in state.inventory:
        # Pass the gate
        return True
    else:
        # Instant death
        return False

# In resolve_card():
elif card.card_type == "Gate":
    if not resolve_gate(state, card.name, card.required_key):
        return False  # Player dies
```

---

## Why This Design Works

### 1. Discovery Through Failure
- Players learn by dying
- Each death teaches you about the path
- Classic roguelike design

### 2. No Spoilers
- Keys don't say what they unlock
- Must experiment to find correct path
- Replayability through mystery

### 3. Clean Implementation
- Keys are just regular cards
- Gates are just regular cards
- No special UI needed for "gate system"

### 4. Elegant Constraint
- Location 4 requires Mirror Shard (from 5)
- Location 5 requires Void Compass (from 6)
- Forces sequence: 6 → 5 → 4 (middle of path)

---

## Questions Answered

1. **Gate cards: can be anywhere in deck**
   - Answer: Put in first 6 cards for fast feedback

2. **Keys shouldn't say what they unlock**
   - Answer: Keys are just "Warden's Key" with no location hint

3. **Gates you encounter DO tell you**
   - Answer: "You need the Warden's Key" (teaches you what was needed)

4. **No backtracking**
   - Answer: Can only go to unchosen locations

---

## Next Steps

1. Add `inventory` tracking to GameState
2. Add `mirror_shard` bool to GameState
3. Create Gate card type with `required_key` field
4. Implement correct path: [1, 2, 3, 6, 5, 4, 7, 8, 9]
5. Update simulation to test this path
6. Add Mirror Shard resurrection mechanic
7. Balance damage/healing for out-of-order locations

Ready to implement?
