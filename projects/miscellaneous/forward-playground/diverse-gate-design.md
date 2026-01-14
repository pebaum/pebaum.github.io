# Forward - Diverse Gate System

## Gate Philosophy
Gates aren't a single card type - they're **thematic encounters** that check for keys. Each gate feels natural to its location:
- **Monster gates:** A beast that can only be defeated/pacified with a specific item
- **Trap gates:** Environmental hazards that need specific equipment to survive
- **Guardian gates:** NPCs/sentinels that demand tribute or proof of passage

---

## The Correct Path: 1 → 2 → 3 → 6 → 5 → 4 → 7 → 8 → 9

### Location 1: Home Village (Tutorial)
**No key, no gate**

---

### Location 2: Ashen Fortress
**Key obtained:** "Warden's Key" (replaces Item A)
- *Equipment card (doesn't take slot)*
- *"A heavy iron key bearing the Warden's seal."*

**No gate** (accessible from Location 1)

---

### Location 3: Frozen Wastes
**Key obtained:** "Crystal Vial" (replaces Item A)
- *Item card - Heals 3 HP + grants key*
- *"A vial of shimmering liquid that protects from extreme cold."*

**Gate:** **"Sealed Fortress Door"** (replaces Terror)
- **Type:** Guardian Gate (blocks path)
- **Description:** *"A massive iron door sealed by the Warden's order. It will not open."*
- **Checks for:** Warden's Key (from Location 2)
- **If missing:** "The door remains sealed. You are trapped in the frozen wastes." → **DEATH**
- **If present:** "You use the Warden's Key. The door opens with a groan." → Continue

---

### Location 6: Abyssal Depths
**Key obtained:** "Void Compass" (replaces Item A)
- *Equipment card (doesn't take slot)*
- *"A compass that points toward nothing. It guides through darkness."*

**Gate:** **"Hypothermia"** (replaces Terror)
- **Type:** Environmental Trap
- **Description:** *"The temperature drops to impossible lows. Your body begins to freeze."*
- **Checks for:** Crystal Vial (from Location 3)
- **If missing:** "Without protection, your blood crystallizes. You freeze solid." → **DEATH**
- **If present:** "The Crystal Vial's warmth protects you. You survive the cold." → Continue

---

### Location 5: Mirror Chamber
**Key obtained:** "Mirror Shard" (boss drop - special)
- *Special item (resurrection)*
- *Obtained after defeating Mirror Knight (Hollow boss)*
- **Effect:** Resurrect at 10 HP when reaching 0 HP (one-time use)

**Gate:** **"Shadow Beast"** (replaces Terror)
- **Type:** Monster Gate (Beast-like encounter)
- **Description:** *"A creature born of pure darkness emerges. Without light to guide you, you cannot perceive it."*
- **Checks for:** Void Compass (from Location 6)
- **If missing:** "You cannot see the beast. It tears you apart in the darkness." → **DEATH**
- **If present:** "The Void Compass illuminates the creature. You fight it normally."
  - Becomes a normal Beast (4 HP) that you can fight

**Note:** This gate is interesting - it transforms into a normal encounter if you have the key!

---

### Location 4: Corrupted Grove
**Key obtained:** "Elder's Seal" (replaces Item A)
- *Equipment card (doesn't take slot)*
- *"A glowing seal that purifies corruption."*

**Gate:** **"Mirror Doppelganger"** (replaces Terror)
- **Type:** Monster Gate (uncombatable without key)
- **Description:** *"Your reflection steps out of a mirror and attacks. It knows all your moves."*
- **Checks for:** Mirror Shard (from Location 5)
- **If missing:** "The doppelganger is stronger than you. It cannot be defeated." → **DEATH**
- **If present:** "The Mirror Shard resonates. The doppelganger shatters instantly." → Continue

---

### Location 7: Void Sanctum
**Key obtained:** "Eclipse Token" (replaces Item A)
- *Item card (doesn't heal)*
- *"A token bearing the mark of an eclipse. It hums with power."*

**Gate:** **"Corruption Pool"** (replaces Pit)
- **Type:** Trap Gate (environmental hazard)
- **Description:** *"You must cross a pool of living corruption. It writhes and reaches for you."*
- **Checks for:** Elder's Seal (from Location 4)
- **If missing:** "The corruption overwhelms you. You are consumed." → **DEATH**
- **If present:** "The Elder's Seal purifies the corruption. You cross safely." → Continue

---

### Location 8: Eclipse Citadel
**Key obtained:** "Final Key" (replaces Item A)
- *Equipment card (doesn't take slot)*
- *"The key to the final gate. It thrums with immense power."*

**Gate:** **"Eternal Eclipse Barrier"** (replaces Terror)
- **Type:** Environmental Barrier
- **Description:** *"The entrance is sealed by an eternal eclipse. No light can penetrate it."*
- **Checks for:** Eclipse Token (from Location 7)
- **If missing:** "Only the Eclipse Token can break this seal. You are trapped." → **DEATH**
- **If present:** "The Eclipse Token shatters the barrier. Light floods in." → Continue

---

### Location 9: The Convergence
**No key** (final location before boss)

**Gate:** **"Guardian of Convergence"** (replaces Terror)
- **Type:** Guardian Gate (sentinel)
- **Description:** *"A titanic guardian blocks the path. 'Show me the Final Key, or perish.'"*
- **Checks for:** Final Key (from Location 8)
- **If missing:** "You cannot provide the key. The guardian crushes you." → **DEATH**
- **If present:** "You present the Final Key. The guardian steps aside." → Continue

---

## Gate Type Distribution

### Environmental Traps (3)
- **Location 3:** Sealed Fortress Door (physical barrier)
- **Location 7:** Corruption Pool (hazardous terrain)
- **Location 8:** Eternal Eclipse Barrier (magical barrier)

### Monster Gates (2)
- **Location 5:** Shadow Beast (becomes fightable with key)
- **Location 4:** Mirror Doppelganger (instant-kill without key)

### Guardian Gates (2)
- **Location 6:** Hypothermia (environmental guardian)
- **Location 9:** Guardian of Convergence (sentinel NPC)

---

## Card Replacements per Location

| Location | Key Replaces | Gate Replaces | Gate Type |
|----------|--------------|---------------|-----------|
| 1 | - | - | None |
| 2 | Item A | - | None |
| 3 | Item A | Terror | Guardian Gate |
| 4 | Item A | Terror | Monster Gate |
| 5 | (Boss drop) | Terror | Monster Gate (fightable) |
| 6 | Item A | Terror | Environmental Trap |
| 7 | Item A | Pit | Trap Gate |
| 8 | Item A | Terror | Environmental Barrier |
| 9 | - | Terror | Guardian Gate |

**Total still 18 cards per location**

---

## Special Gate: Shadow Beast (Location 5)

This gate is unique - it **transforms** based on whether you have the key:

### Without Void Compass
```
You draw: Shadow Beast

"A creature born of pure darkness emerges.
 Without light, you cannot perceive it.

 Do you have the Void Compass? NO.

 You cannot see the beast.
 It tears you apart in the darkness.

 YOU DIED."
```

### With Void Compass
```
You draw: Shadow Beast

"A creature born of pure darkness emerges.

 Do you have the Void Compass? YES.

 The Void Compass illuminates the creature!
 It becomes visible."

[Shadow Beast becomes a standard Beast (4 HP) encounter]
[You fight it normally with combat rolls]
```

**This adds interesting gameplay:** The key doesn't bypass the encounter - it transforms it into a fightable enemy!

---

## Deck Composition Examples

### Location 3 (Frozen Wastes)
- 1 Crystal Vial (key, Item card - heals 3 HP)
- 1 Sealed Fortress Door (gate, checks Warden's Key)
- 1 Item B (heals 3 HP)
- 1 Gnarled Branch (weapon)
- 5 Beasts (2/2/2/4/4 HP)
- 1 Hollow (6 HP, guaranteed last 3 cards)
- 3 Pits
- 1 Snare
- 1 Blessing (heals 10 HP)
- 3 Caesuras

**Total: 18 cards**

---

### Location 5 (Mirror Chamber)
- 0 Key cards (Mirror Shard is boss drop)
- 1 Shadow Beast (gate, transforms into Beast if you have Void Compass)
- 2 Items A+B (heal 5 HP each)
- 1 Sturdy Blade (weapon)
- 5 Beasts (4/4/4/6/6 HP)
- 1 Mirror Knight (Hollow, 8 HP, drops Mirror Shard when defeated)
- 3 Pits
- 1 Snare
- 1 Blessing (heals 12 HP)
- 3 Caesuras

**Total: 18 cards**

**Special:** After defeating Mirror Knight (Hollow), player gains Mirror Shard automatically.

---

### Location 7 (Void Sanctum)
- 1 Eclipse Token (key, Item card - doesn't heal)
- 1 Corruption Pool (gate, replaces Pit)
- 1 Item B (heals 8 HP)
- 1 Masterwork Blade (weapon)
- 5 Beasts (6/6/6/8/8 HP)
- 1 Hollow (9 HP, guaranteed last 3 cards)
- 2 Pits (reduced from 3 because gate replaces one)
- 1 Snare
- 1 Terror (back in, since gate replaces Pit not Terror)
- 1 Blessing (heals 14 HP)
- 3 Caesuras

**Total: 18 cards**

---

## Implementation Notes

### Gate Card Structure
```python
@dataclass
class Card:
    name: str
    card_type: str  # "Gate" or original type
    gate_type: str  # "monster", "trap", "guardian", "transform"
    location: int
    required_key: str  # What key is needed
    hp: int = 0  # For transform gates (becomes Beast)
    heal: int = 0
    equipment_type: str = ""
    tier: int = 1
```

### Gate Resolution
```python
def resolve_gate(state: GameState, card: Card) -> bool:
    if card.required_key in state.inventory:
        if card.gate_type == "transform":
            # Shadow Beast: becomes a normal Beast fight
            return resolve_combat(state, card.hp)
        else:
            # Other gates: bypass completely
            return True
    else:
        # Don't have key: instant death
        return False
```

---

## Why This Design Is Better

### 1. Thematic Integration
- Gates feel like natural parts of the world
- "Corruption Pool" fits Void Sanctum
- "Hypothermia" fits Frozen Wastes
- Not just arbitrary checkpoints

### 2. Variety in Encounters
- Not every gate is the same "do you have key?" check
- Shadow Beast transforms into combat
- Corruption Pool is a trap
- Guardian demands tribute
- Keeps gameplay fresh

### 3. Clear Feedback
- Monster gates: "The beast is too powerful"
- Trap gates: "You don't have the tool to survive"
- Guardian gates: "You lack the required item"
- Each tells you what went wrong

### 4. Reuses Existing Systems
- Monster gates → Beast combat
- Trap gates → Environmental hazards
- Guardian gates → Instant checks
- No new mechanics needed

---

## Summary of Changes

**From:** All gates are Terror replacements
**To:** Gates distributed across card types:
- 5 gates replace Terror
- 1 gate replaces Pit (Location 7)
- 1 gate transforms into Beast (Location 5)

**Gate types:**
- 3 Environmental (barriers, traps)
- 2 Monsters (doppelganger, shadow beast)
- 2 Guardians (sentinels, gatekeepers)

All gates still result in **instant death** if you lack the key (except Shadow Beast which becomes fightable).

---

Ready to implement this diverse gate system?
