# Card Effect Design (From Math)

## Equipment - Combat Table Modifiers

**Equipment 1: Aggressive Weapon (e.g., "Telos' Arc" bow)**
- **Effect:** When you roll a 1, deal 1 damage instead of missing.
- **Modified table:**
  - 1: Hit (1 dmg) ← changed from Miss
  - 2: Block
  - 3-4-6: Hit (1 dmg)
  - 5: Critical (2 dmg)
- **New expected damage:** 0.972 per round (up from 0.694)
- **+40% damage output**

**Equipment 2: Defensive Gear (e.g., "Warden's Shield")**
- **Effect:** When you roll a 3, you may choose to Block instead of dealing 1 damage.
- **Modified table:**
  - 1: Miss
  - 2: Block
  - 3: Hit (1 dmg) OR Block (your choice) ← added option
  - 4-6: Hit (1 dmg)
  - 5: Critical (2 dmg)
- **Tactical value:** Lets you block big incoming attacks when needed
- **Expected damage if always attacking:** Same as base (0.694)
- **Expected damage if blocking half the time on 3s:** 0.578 per round

### Design Notes
- Aggressive equipment increases your damage by ~40%
- Defensive equipment reduces damage taken in critical moments
- Both are useful depending on situation and player preference

---

## Items - Healing Consumables

**Item 1: "Rations"**
- **Effect:** Heal 4 HP
- **Flavor type:** Basic survival supplies

**Item 2: "Healing Salve"**
- **Effect:** Heal 5 HP
- **Flavor type:** Medicine/potion

**Total from Items: 9 HP**

---

## Blessing - Major Benefit

**Blessing Card**
- **Effect:** Heal 10 HP
- **Additional effect:** Cleanse any active Snare
- **Flavor type:** Moment of grace, providence, hope

This is the "big reward" card - always good to draw.

---

## Terror - Hard Choice

**Terror Card**
- **Effect:** Choose one:
  1. Lose 6 HP
  2. Discard 1 Item (if you have any)

**Design logic:**
- Early game: You likely don't have Items yet, must take HP loss
- Mid game: Tough choice - lose healing potential or lose HP now
- Late game: If you've used Items, must take HP loss

This creates meaningful tension depending on game state.

---

## Pit - Challenge Roll

**Pit Cards (3 total)**
- **Mechanic:** Roll d6. Need 3 successes before 3 failures.
- **Target Number:** 3+ (66.7% success rate per roll)
- **Damage:** 2 HP per failure
- **Expected outcome:** 1-2 failures = 2-4 HP damage per Pit

**Example prompts:**
- "Trapped corridor"
- "Treacherous crossing"
- "Maze-like passage"

---

## Snare - Persistent Penalty

**Snare Card**
- **Effect:** Until you complete this location, you cannot spend Lux.
- **Flavor type:** Curse, environmental hazard, psychological weight

**Design impact:**
- Locks your most flexible resource
- Can be removed by Blessing (cleanse effect)
- Creates urgency to find the Blessing card
- Makes combat more dangerous (can't reroll bad rolls)

**Alternative Snare ideas if this is too harsh:**
- "First roll in each combat is automatically a Miss"
- "Take 1 HP damage each time you draw a card"
- "-1 to all Pit rolls"

---

## Caesura - Safe Lux Generation

**Caesura Cards (3 total)**
- **Effect:** Gain 1 Lux (max 3)
- **Flavor:** Quiet moments, exploration, contemplation
- **No challenge, no decision** - just atmospheric text

These are the "safe" cards players hope to flip when at low HP.

---

## Summary of Effects

| Card Type | Count | Effect |
|-----------|-------|--------|
| Beast | 5 | Combat (3HP, 3HP, 3HP, 5HP, 5HP) |
| Hollow | 1 | Combat (7HP) |
| Item | 2 | Heal 4 HP / Heal 5 HP |
| Equipment | 2 | Modify combat table (offensive/defensive) |
| Terror | 1 | Lose 6 HP OR discard Item |
| Pit | 3 | Roll TN3+, 2HP per fail |
| Snare | 1 | Cannot spend Lux (until location ends) |
| Blessing | 1 | Heal 10 HP + Cleanse Snare |
| Caesura | 3 | Gain 1 Lux |
| **Total** | **19** | |

---

## Balance Check

**Maximum damage if player encounters everything:**
- Combat: 26 HP
- Pits: 6-9 HP (if failing 1-2 times per Pit)
- Terror: 6 HP (if taking damage)
- **Total: 38-41 HP**

**Maximum healing:**
- Items: 9 HP
- Blessing: 10 HP
- Lux: 15 HP (3 Lux × 5 HP each)
- **Total: 34 HP**

**Net with perfect play:**
- Start: 20 HP
- Take: ~38 HP damage
- Heal: 34 HP
- **End: 16 HP** ✓

**Net with realistic play:**
- Player uses 1-2 Lux for rerolls/peeks (not healing)
- Player doesn't encounter all 19 cards
- Some damage can't be avoided
- **End: 8-12 HP** ✓

The math works!
