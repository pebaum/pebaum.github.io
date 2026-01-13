# Forward - Player's Guide

## Overview

**Forward** is a solo deck-building adventure game where you navigate through 9 dangerous locations to reach a final boss encounter. Each location is represented by a deck of 18 cards containing monsters, traps, equipment, and healing items.

**Your goal:** Discover the one correct path through all 9 locations and survive to the end.

**The twist:** Only ONE path through the locations will work. Choose wrong, and you'll encounter gates and guardians that will kill you instantly if you lack the required items.

---

## Starting the Game

### Initial Setup
- **HP:** 20 (max 20)
- **Lux:** 0 (max 3)
- **Equipment:** Empty Prism (enables Lux system)
- **Inventory:** Empty

### Starting Location
You always begin at **Location 1: Home Village**

---

## The Diamond Map

Locations are arranged in a diamond formation:

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

**From each location, you can only move to adjacent locations you haven't visited yet.**

---

## Core Mechanics

### Combat System

#### Player Turn
- Roll 3d6 (three six-sided dice)
- Choose the best result
- Apply weapon bonuses

#### Combat Table
| Roll | Without Weapon | With Weapon |
|------|----------------|-------------|
| 1 | Miss (0 dmg) | Hit (1 dmg) |
| 2 | Block | Block (Tier 2+: Hit 1) |
| 3-4 | Hit (1 dmg) | Hit (1 dmg, Tier 3+: 2 dmg) |
| 5 | Hit (2 dmg) | Hit (2 dmg) |
| 6 | Counter (block + 1 dmg) | Counter (block + 1 dmg) |

#### Enemy Turn
- Roll 1d6
- Use same combat table (without weapon bonuses)

#### Combat Resolution
- Blocks and Counters negate enemy damage
- Both sides deal damage simultaneously (unless blocked)
- Combat continues until enemy HP = 0 or your HP = 0

---

## Equipment Progression

### Weapons (Tier-Based)

#### Tier 1 (Locations 1-3): Gnarled Branch
- **1 → Hit** (miss becomes 1 damage)

#### Tier 2 (Locations 4-6): Sturdy Blade
- **1 → Hit** (miss becomes 1 damage)
- **2 → Hit** (block becomes 1 damage)

#### Tier 3 (Locations 7-9): Masterwork Blade
- **1 → Hit** (miss becomes 1 damage)
- **2 → Hit** (block becomes 1 damage)
- **3-4 → Hit+1** (1 damage becomes 2 damage)

**Note:** You can only hold 2 pieces of equipment at once (weapon + Empty Prism). New weapons replace old ones.

---

## The Lux System

### What is Lux?
Lux is a magical resource (max 3) that powers special abilities. You need the **Empty Prism** (starting equipment) to use Lux.

### How to Gain Lux
- **Caesura cards:** +1 Lux each (3 per location)

### How to Spend Lux

#### 1. Heal (1 Lux)
- Restore 5 HP
- Cannot exceed max HP (20)
- Disabled while Snared

#### 2. Reroll (1 Lux)
- During combat, reroll one die
- Can turn a bad roll into a good one
- Use strategically on critical rounds

#### 3. Peek (1 Lux)
- When drawing 3 cards face-down
- Flip 2 cards face-up to see them
- Shuffle up to 2 cards back into deck
- Draw from remaining cards

---

## Card Types (18 per location)

### Beasts (5 per location)
- **Combat encounters**
- **HP by tier:**
  - Tier 1: 2, 2, 2, 4, 4 HP
  - Tier 2: 4, 4, 4, 6, 6 HP
  - Tier 3: 6, 6, 6, 8, 8 HP

### Hollow (1 per location - BOSS)
- **Boss encounter** (always in last 3 cards)
- **HP by tier:**
  - Tier 1: 6 HP
  - Tier 2: 8 HP
  - Tier 3: 9 HP
- **Special:** Location 5's Hollow (Mirror Knight) drops Mirror Shard

### Items (2 per location)
- **Instant healing**
- **Healing by tier:**
  - Tier 1: 3 HP each
  - Tier 2: 5 HP each
  - Tier 3: 8 HP each

### Weapon (1 per location)
- Gnarled Branch (Tier 1), Sturdy Blade (Tier 2), or Masterwork Blade (Tier 3)
- Replaces current weapon

### Terror (1 per location)
- **Forced choice:** Lose 4 HP OR lose 1 Lux
- Choose based on current resources

### Pit (3 per location)
- **Challenge:** Roll d6 until 3 successes or 3 failures
- **Success:** Roll 3+ on d6
- **Failure:** Roll 1-2, take 1 HP damage
- Can spend Lux to reroll failures

### Snare (1 per location)
- **Effect:** Disables Lux usage
- **Removed by:** Blessing card

### Blessing (1 per location)
- **Healing by tier:**
  - Tier 1: 10 HP
  - Tier 2: 12 HP
  - Tier 3: 14 HP
- **Bonus:** Removes Snare effect

### Caesura (3 per location)
- **Effect:** Gain +1 Lux (max 3)
- Critical for sustaining Lux usage

---

## Keys & Gates System

### How It Works
- **Keys** are special cards you collect from location decks
- **Gates** are deadly encounters that check if you have specific keys
- **If you have the key:** Pass safely (or fight a manageable enemy)
- **If you lack the key:** Instant death, game over

### Key Locations

| Location | Key Name | Card Type | Purpose |
|----------|----------|-----------|---------|
| 2 | Warden's Key | Equipment | Unlocks Location 3 |
| 3 | Crystal Vial | Item (heals 3 HP) | Unlocks Location 6 |
| 6 | Void Compass | Equipment | Unlocks Location 5 |
| 5 | **Mirror Shard** | **Boss Drop** | **Resurrection item** |
| 4 | Elder's Seal | Equipment | Unlocks Location 7 |
| 7 | Eclipse Token | Item | Unlocks Location 8 |
| 8 | Final Key | Equipment | Unlocks Location 9 |

**Important:** Keys don't say what they unlock! You must discover this through exploration (and dying).

---

## Gate Encounters

### Location 3: Sealed Fortress Door
- **Type:** Guardian Gate
- **Requires:** Warden's Key (from Location 2)
- **Description:** "A massive iron door sealed by the Warden's order."
- **Failure:** "The door remains sealed. You are trapped."

### Location 6: Hypothermia
- **Type:** Environmental Trap
- **Requires:** Crystal Vial (from Location 3)
- **Description:** "The temperature drops to impossible lows."
- **Failure:** "Your blood crystallizes. You freeze solid."

### Location 5: Shadow Beast
- **Type:** Monster Gate (transforms!)
- **Requires:** Void Compass (from Location 6)
- **With key:** Becomes a normal Beast (4 HP) you can fight
- **Without key:** "You cannot see the beast. It tears you apart in darkness."

### Location 4: Mirror Doppelganger
- **Type:** Monster Gate
- **Requires:** Mirror Shard (from Location 5 boss)
- **Description:** "Your reflection attacks. It knows all your moves."
- **Failure:** "The doppelganger is stronger than you."

### Location 7: Corruption Pool
- **Type:** Trap Gate
- **Requires:** Elder's Seal (from Location 4)
- **Description:** "You must cross a pool of living corruption."
- **Failure:** "The corruption overwhelms you."

### Location 8: Eternal Eclipse Barrier
- **Type:** Environmental Barrier
- **Requires:** Eclipse Token (from Location 7)
- **Description:** "The entrance is sealed by an eternal eclipse."
- **Failure:** "Only the Eclipse Token can break this seal."

### Location 9: Guardian of Convergence
- **Type:** Guardian Gate
- **Requires:** Final Key (from Location 8)
- **Description:** "A guardian blocks the path. 'Show me the Final Key.'"
- **Failure:** "The guardian crushes you."

---

## The Mirror Shard (Most Important Item)

### How to Get It
Defeat the **Mirror Knight** (Hollow boss of Location 5)

### What It Does
- **Passive resurrection:** When your HP reaches 0 anywhere in the game
- **Effect:** Resurrect at 10 HP
- **Uses:** One-time only (consumed when used)

### Why It's Critical
- Required to pass the gate in Location 4
- **Required for Final Boss survival** (mandatory death phase)
- Without it, you CANNOT win the game

---

## The Correct Path (Spoiler!)

<details>
<summary>Click to reveal the one correct path</summary>

### 1 → 2 → 3 → 6 → 5 → 4 → 7 → 8 → 9 → Final Boss

**Why this order:**
1. **Location 2:** Get Warden's Key
2. **Location 3:** Pass gate (need Warden's Key), get Crystal Vial
3. **Location 6:** Pass gate (need Crystal Vial), get Void Compass
4. **Location 5:** Pass gate (need Void Compass), defeat Mirror Knight, get Mirror Shard
5. **Location 4:** Pass gate (need Mirror Shard), get Elder's Seal
6. **Location 7:** Pass gate (need Elder's Seal), get Eclipse Token
7. **Location 8:** Pass gate (need Eclipse Token), get Final Key
8. **Location 9:** Pass gate (need Final Key), fight Hollow
9. **Final Boss:** Use Mirror Shard to survive mandatory death phase

**Any other path will result in death at a gate you cannot pass.**

</details>

---

## Strategy Guide

### Early Game (Locations 1-3)

**Goals:**
- Collect Caesuras for Lux
- Find weapon upgrades quickly
- Conserve HP for harder locations

**Tips:**
- Use Peek sparingly (only when desperate)
- Save Lux for healing when HP < 12
- Items heal 3 HP (use them before Blessing for efficiency)

### Mid Game (Locations 4-6)

**Goals:**
- Get Mirror Shard from Location 5
- Upgrade to Sturdy Blade or better
- Build Lux reserves

**Tips:**
- Beasts now have 4-6 HP (longer fights)
- Combat damage increases - heal more often
- Use Peek to find Blessing when low HP

### Late Game (Locations 7-9)

**Goals:**
- Survive to Final Boss with Mirror Shard
- Collect Final Key
- Enter Location 9 with high HP

**Tips:**
- Beasts have 6-8 HP (very long fights)
- Masterwork Blade is critical for efficiency
- Save Lux for emergencies
- Expect 25+ HP damage per location
- You heal to full HP between locations

---

## Healing Strategy

### Between Locations
- You **automatically heal to 20 HP** at the start of each new location

### During Locations
You have multiple healing sources:

1. **Items:** 3/5/8 HP (2 per location)
2. **Blessing:** 10/12/14 HP (1 per location)
3. **Lux healing:** 5 HP per Lux spent
4. **Crystal Vial (Location 3):** 3 HP + grants key

**Optimal healing order:**
1. Use Items first (3 HP each)
2. Save Blessing for emergencies (10+ HP)
3. Use Lux healing when HP < 12
4. Never waste healing above 20 HP

---

## Combat Tips

### Offensive Strategy
- **With Gnarled Branch (Tier 1):** 50% chance to deal 1+ damage per round
- **With Sturdy Blade (Tier 2):** 67% chance to deal 1+ damage per round
- **With Masterwork Blade (Tier 3):** 83% chance to deal 1+ damage per round

### Defensive Strategy
- **Block (roll 2):** Negates enemy damage
- **Counter (roll 6):** Blocks AND deals 1 damage
- **Combined:** ~33% chance to negate enemy damage per round

### When to Reroll (Lux)
- Enemy has 1 HP left, you rolled miss/block
- Your HP is critical, enemy rolled hit (reroll for block/counter)
- Final round of difficult fight

---

## Common Mistakes

### 1. Going to Location 3 Before Location 2
- **Result:** Die at Sealed Fortress Door (no Warden's Key)
- **Lesson:** Always go to Location 2 first

### 2. Trying to Skip Location 5
- **Result:** Cannot pass Location 4 gate (need Mirror Shard)
- **Result 2:** Die at Final Boss mandatory death phase
- **Lesson:** Location 5 is mandatory, not optional

### 3. Wasting Lux on Peek Too Early
- **Problem:** Need Lux for healing in emergencies
- **Solution:** Only peek when HP < 10 or facing critical decisions

### 4. Not Tracking Hollow Position
- **Problem:** Hollow appears in last 3 cards
- **Solution:** Count cards drawn (deck has 18), prepare at card 15+

### 5. Fighting with Low HP
- **Problem:** One bad roll can kill you
- **Solution:** Heal before difficult fights (Beasts 6+ HP, Hollow)

---

## Win Rate Expectations

### AI Win Rate (Conservative Play)
- **Linear path (1-9):** 41.1%
- **Correct diamond path:** ~45% (with Mirror Shard resurrection)

### Human Win Rate (Optimal Play)
- **Expected:** 50-60%
- **Factors:** Optimal peeking, healing timing, combat rerolls

### Difficulty by Tier
- **Tier 1 (Locations 1-3):** 98% clear rate (tutorial difficulty)
- **Tier 2 (Locations 4-6):** 92% clear rate (moderate challenge)
- **Tier 3 (Locations 7-9):** 83% clear rate (hard mode)

**Most dangerous location:** Location 7 (12.9% of all deaths)

---

## Quick Reference

### Starting Resources
- HP: 20 / 20
- Lux: 0 / 3
- Equipment: Empty Prism

### Healing Available Per Location
- Tier 1: ~20 HP (2 items + 1 blessing + 3 caesuras)
- Tier 2: ~25 HP (2 items + 1 blessing + 3 caesuras)
- Tier 3: ~30 HP (2 items + 1 blessing + 3 caesuras)

### Expected Damage Per Location
- Tier 1: ~18 HP
- Tier 2: ~22 HP
- Tier 3: ~25 HP

### Net HP Change
- **Within location:** -3 to -10 HP
- **Between locations:** +20 HP (full heal)
- **Overall:** Sustainable with good play

---

## Glossary

**Tier:** Difficulty level based on location group (1-3, 4-6, 7-9)

**Hollow:** Boss monster that appears in last 3 cards of each location

**Lux:** Magical resource used for healing, peeking, and rerolling

**Snare:** Status effect that disables Lux usage until Blessing is drawn

**Caesura:** Card that grants +1 Lux

**Gate:** Deadly encounter that checks for a specific key item

**Key:** Special item required to pass gates in later locations

**Mirror Shard:** Resurrection item that saves you from death once

**Empty Prism:** Starting equipment that enables Lux system

---

## Final Tips

1. **Death is learning** - Each failed run teaches you about gates and paths
2. **Mirror Shard is mandatory** - You cannot win without it
3. **Heal proactively** - Don't wait until HP < 5
4. **Track your Lux** - You need 3 Caesuras to max out
5. **Weapon upgrades matter** - New weapons dramatically improve damage
6. **Boss is predictable** - Hollow always in last 3 cards
7. **Between-location heal saves you** - Don't panic at low HP near location end
8. **Count your keys** - Missing one key = death at next gate
9. **Peeking is powerful** - Use it wisely when HP is critical
10. **The path is fixed** - Once you learn it, the game becomes about execution

---

## Good luck, traveler. May your path be true.

*"Forward, into the unknown."*
