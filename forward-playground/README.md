# Forward - Location 1 Design (Math-Based)

This folder contains the complete mathematical design for **Location 1: Home Village Termina**, built from pure first principles using ONLY the "Start Over 1.11.26" rules.

---

## Design Process

### 1. Core Math ([fresh-start-math.md](fresh-start-math.md))
- Calculated expected damage from d6 combat table: **~0.694 HP per round**
- Key finding: **Damage taken ≈ Enemy HP** (5 HP enemy deals ~5 HP to you)
- Determined combat encounter HP values (3, 5, 7 HP)
- Designed Pit mechanics (TN 3+, 2 HP per failure)
- Calculated damage and healing budgets

### 2. Card Effects ([card-effect-design.md](card-effect-design.md))
- Equipment: Combat table modifications (Telos' Arc, Warden's Shield)
- Items: 4 HP and 5 HP healing
- Blessing: 10 HP + Cleanse Snare
- Terror: 6 HP OR discard Item
- Snare: Cannot spend Lux
- Caesura: Gain 1 Lux (×3)

### 3. Complete Card List ([location-1-complete.md](location-1-complete.md))
- All 19 cards with exact rules text
- Damage summary: ~39 HP total
- Healing summary: 34 HP total
- Expected ending HP: **9-12 HP** with realistic play

---

## Key Numbers

| Stat | Value |
|------|-------|
| Starting HP | 20 |
| Total cards | 19 |
| Combat damage | ~26 HP (5 Beasts + 1 Hollow) |
| Non-combat damage | ~13 HP (3 Pits + 1 Terror) |
| **Total damage** | **~39 HP** |
| Item healing | 9 HP |
| Blessing healing | 10 HP |
| Lux healing | 15 HP (if all spent) |
| **Total healing** | **34 HP** |
| **Expected ending HP** | **9-12 HP** ✓ |

---

## Card Distribution (19 cards)

From "Start Over 1.11.26" specification:
- **2 Item** — Heal 4 HP, Heal 5 HP
- **2 Equipment** — Telos' Arc (offensive), Warden's Shield (defensive)
- **5 Beast** — 3×3HP, 2×5HP
- **1 Hollow** — 7 HP
- **1 Terror** — Choose: 6 HP OR discard Item
- **3 Pit** — TN 3+, 2 HP per failure
- **1 Snare** — Cannot spend Lux
- **1 Blessing** — Heal 10 HP + Cleanse Snare
- **3 Caesura** — Gain 1 Lux each

---

## Combat System

### Base D6 Table (both sides roll simultaneously)
| Roll | Result |
|------|--------|
| 1 | Miss (0 dmg) |
| 2 | Block (negate incoming) |
| 3-4-6 | Hit (1 dmg) |
| 5 | Critical (2 dmg) |

**Expected damage per round:** 0.694 HP (after accounting for blocks)

### Equipment Modifications

**Telos' Arc** (Offensive):
- 1 → Hit (1 dmg) instead of Miss
- Increases damage output by ~40%

**Warden's Shield** (Defensive):
- 3 → You choose Hit (1 dmg) OR Block
- Allows tactical blocking of big attacks

---

## Lux Economy

**Sources:** 3 Caesura cards = 3 Lux total (max 3)

**Uses:**
1. **Heal 5 HP** (most common use)
2. **Reroll 1 die** (critical combat moments)
3. **Peek at 1 card** (risk management)
4. **Special circumstance** (to be defined)

**Strategy:** Players must balance healing vs. utility
- Spending all 3 Lux on healing = 15 HP restored (safe)
- Saving 1-2 Lux for rerolls = fewer guaranteed heals but more control

---

## Balance Philosophy

This design creates **tension without being punishing**:

✅ Player can survive with good choices
✅ Multiple viable strategies (aggressive vs. defensive Equipment)
✅ Meaningful decisions (Terror choices, Lux spending)
✅ Resource management matters
✅ Tight but fair (ending with ~10 HP feels earned)

---

## Next Steps

### Before Location 2:
1. **Print and playtest** these 19 cards
2. **Track HP totals** across 5-10 runs
3. **Identify pain points:**
   - Is Snare too punishing?
   - Are 7 HP enemies too long (10 rounds)?
   - Do players always choose the same Terror option?
4. **Adjust numbers** if needed

### Moving Forward:
- Add **flavor text** to each card (currently just mechanics)
- Design **enemy-specific combat tables** (more variety than base d6)
- Create **Location 2** with slightly higher difficulty
- Define **Rest mechanics** (referenced but not specified)
- Design **Companion system** (mentioned in old notes)
- Define **endgame** (Guardian fight, win conditions)

---

## Design Principles Used

1. **Math first, flavor second** - Numbers must balance before adding theme
2. **Pure derivation** - No assumptions from previous versions
3. **Damage = Enemy HP** - Clean relationship from d6 probabilities
4. **Expected value** - Designed around average outcomes, not best/worst case
5. **Player agency** - Equipment choice, Terror choice, Lux spending all matter

---

## Files in This Folder

- **[README.md](README.md)** ← You are here
- **[fresh-start-math.md](fresh-start-math.md)** - Mathematical foundation and calculations
- **[card-effect-design.md](card-effect-design.md)** - Individual card effect specifications
- **[location-1-complete.md](location-1-complete.md)** - Final 19-card list with all details
