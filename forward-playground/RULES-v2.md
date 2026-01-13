# Forward - Rules Document v2
## Updated: 2026-01-13

---

## Game Setup

- **Starting HP:** 20
- **Starting Lux:** 0 (max 3)
- **Equipment Slots:** 0/2 (empty)
- **Item Slots:** 0/2 (empty)

**Location 1 Deck:** 19 cards, shuffled at start

---

## Core Game Loop

1. **Draw 3 cards face-down** from the deck
2. **Optional: Spend 1 Lux to Peek** (see Peek mechanic below)
3. **Choose 1 card** from the 3 (without seeing it unless peeked)
4. **Flip and resolve** the chosen card
5. **Replace** the chosen card with a new draw
6. **Repeat** until deck is exhausted

---

## Combat System

### Combat Table

**Player:** Roll 3d6, **choose which die to use**
**Enemy:** Roll 1d6, uses that result

| Roll | Result |
|------|--------|
| 1 | **Miss** (deal 0 damage) |
| 2 | **Block** (negate all incoming damage) |
| 3-4 | **Hit** (deal 1 damage) |
| 5 | **Hit** (deal 2 damage) |
| 6 | **Counter** (block all incoming + deal 1 damage) |

### Combat Resolution

1. Both roll simultaneously (player rolls 3d6, enemy rolls 1d6)
2. Player chooses which of their 3 dice to use
3. Check for Blocks and Counters:
   - If either side Blocks or Counters, the other side deals 0 damage
   - Counters also deal 1 damage
4. Apply damage to both sides
5. Repeat until one side reaches 0 HP

**If player reaches 0 HP, the game ends (loss).**

---

## Equipment System

**Max 2 Equipment slots (persistent until swapped)**

### Gnarled Branch
**Effect:** When you roll a 1 in combat, deal 1 damage instead of missing.

**Modified table:**
- 1: Hit (1 dmg) ← changed from Miss
- 2: Block
- 3-4: Hit (1 dmg)
- 5: Hit (2 dmg)
- 6: Counter (block + 1 dmg)

### Empty Prism
**Effect:** Required to use the Lux system.

**Without Empty Prism:**
- You cannot spend Lux for any purpose
- You can still gain Lux from Caesura cards (stored but unusable)
- Once you equip Empty Prism, all stored Lux becomes available

**Note:** This means early game (before finding Empty Prism) has no Lux abilities!

---

## Lux System

**Max 3 Lux** (gained from Caesura cards)

**Requirements:** Must have **Empty Prism** equipped to spend Lux

### Lux Uses

1. **Heal 5 HP** (cost: 1 Lux)
2. **Reroll 1 die** in combat or Pit (cost: 1 Lux)
3. **Peek** (cost: 1 Lux) - see below

### Peek Mechanic

**Cost:** 1 Lux

**Effect:**
1. Flip **2 of the 3 face-down cards** face-up (you choose which 2)
2. Look at them
3. Choose **up to 2 of any of the 3 cards** to shuffle back into the deck
4. Draw replacement cards face-down
5. The remaining cards stay in the lineup (face-down again)

**Example:**
- You have 3 face-down cards: [A, B, C]
- Spend 1 Lux to peek
- Flip A and B face-up
- A is a Beast (dangerous!), B is a Caesura (safe), C is still unknown
- Shuffle A and C back into deck (you can shuffle the unknown one!)
- Draw 2 new cards face-down
- Now you have 3 face-down cards again, but you know one of them is the Caesura

---

## Item System

**Max 2 Item slots (consumable, one-time use)**

### Current Items (Testing Phase)
- **Old Boot:** Does nothing (placeholder for balance testing)
- **Older Boot:** Does nothing (placeholder for balance testing)

**Note:** Items are currently disabled to test other mechanics. Healing items will be added after balancing combat and Lux.

---

## Card Types

### Beast (5 cards)
**Enemy combat encounters**

- 3× Beast (3 HP each)
- 2× Beast (5 HP each)

**Resolution:** Enter combat using Combat System rules. Fight until one side reaches 0 HP.

### Hollow (1 card)
**Harder enemy combat encounter**

- 1× Hollow (7 HP)

**Resolution:** Same as Beast, but higher HP.

### Terror (1 card)
**Difficult choice between two bad options**

**Effect:** Choose one:
- **Lose 5 HP**
- **Lose 1 Lux** (if you have 0 Lux, must take HP loss)

### Pit (3 cards)
**Challenge: Roll dice to overcome obstacle**

**Mechanic:**
1. Roll d6 repeatedly
2. Need **3 successes** before **3 failures**
3. **Target Number:** 3+ (roll 3, 4, 5, or 6 = success)
4. **Penalty:** Take 2 HP damage per failure

**You can spend 1 Lux to reroll a failure** (if you have Empty Prism)

### Snare (1 card)
**Persistent penalty for remainder of location**

**Effect:** You cannot spend Lux for any purpose until location ends.

**Duration:** Persistent until:
- Location completes, OR
- You draw the Blessing card (cleanses Snare)

### Blessing (1 card)
**Major benefit**

**Effect:**
- Heal 10 HP
- Cleanse any active Snare

### Caesura (3 cards)
**Safe exploration moments**

**Effect:** Gain 1 Lux (max 3)

**No challenge, no decision** - just gain the resource and enjoy the flavor text.

---

## Win/Loss Conditions

**Win:** Complete all cards in the location with HP > 0

**Loss:** Reach 0 HP at any point

---

## Balance Summary (Location 1)

### Card Distribution
| Card Type | Count | Purpose |
|-----------|-------|---------|
| Beast | 5 | Combat (3HP, 3HP, 3HP, 5HP, 5HP) |
| Hollow | 1 | Combat (7HP) |
| Terror | 1 | Choice (5 HP or 1 Lux) |
| Pit | 3 | Challenge (TN3+, 2HP/fail) |
| Snare | 1 | Persistent penalty (no Lux) |
| Blessing | 1 | Major heal (10 HP + cleanse) |
| Caesura | 3 | Lux generation (1 Lux each) |
| Equipment | 2 | Gnarled Branch, Empty Prism |
| Item | 2 | Old Boot, Older Boot (placeholders) |
| **Total** | **19** | |

### Expected Outcomes (1000 simulations)
- **Win Rate:** 60.4%
- **Average Ending HP:** 10.7 HP (survivors only)
- **Average Damage Taken:** 22.0 HP
- **Average Healing Used:** 8.2 HP (from Blessing + Lux)

### Design Notes

**The 3d6 vs 1d6 combat system creates a ~60% win rate with current numbers.**

Player has significant advantage:
- Rolling 3d6 and choosing best ≈ average roll of 4.5
- Enemy rolling 1d6 ≈ average roll of 3.5

**Empty Prism dependency:**
- If drawn late, player has no Lux abilities for significant portion of game
- This creates high variance (lucky early draw vs unlucky late draw)
- Consider: Should Empty Prism be a starting item? Or always in top 5 cards?

**Blessing at 10 HP:**
- Seems balanced (not overpowered)
- With no Item healing, Blessing is the only guaranteed heal source
- Could potentially increase to 12 HP if win rate drops below 60%

---

## Open Questions for Playtesting

1. **Is 60% win rate correct for Location 1?** (Tutorial area)
   - Should it be easier (70%)?
   - Or is this the right challenge level?

2. **Empty Prism gating problem:**
   - Should Empty Prism be guaranteed early (top 5 cards)?
   - Or should it start equipped?
   - Or should Lux work without it (just weaker)?

3. **Is Blessing (10 HP) too strong?**
   - Simulation shows it's fine (60% win rate)
   - But no Item healing to compare against yet

4. **Should Terror choice be different?**
   - Current: 5 HP or 1 Lux
   - Alternative: 5 HP or discard Equipment? or 5 HP or lose Empty Prism?

5. **Is the new Peek mechanic powerful enough?**
   - AI doesn't use it (but that's because it doesn't have Empty Prism)
   - Human players might use it more strategically

6. **What should Item healing be?**
   - Currently disabled (Old Boot placeholders)
   - Once we finalize other mechanics, what HP values?
   - Should they compete with Lux healing (5 HP)?

---

## Changelog

### v2 (2026-01-13)
- **Combat:** Changed to 3d6 (choose best) for player, 1d6 for enemy
- **Combat Table:** Added Counter on 6 (block + deal 1 dmg)
- **Equipment:** Changed to Gnarled Branch (1→Hit) and Empty Prism (required for Lux)
- **Items:** Disabled (Old Boot, Older Boot) for balance testing
- **Terror:** Changed to 5 HP or 1 Lux (was 6 HP or discard Item)
- **Peek:** Changed to flip 2 cards, shuffle up to 2 back (was flip 1, shuffle 1 back)
- **Win rate:** 60.4% (up from 58%)

### v1 (2026-01-13)
- Initial design from "Start Over 1.11.26" specification
- All cards designed with pure math-based approach
- 58% win rate with aggressive healing AI
