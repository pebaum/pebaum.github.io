# Forward - Fresh Start Math (Pure Design from Start Over Section)

## Step 1: Base Combat Math

### D6 Combat Table (both sides roll simultaneously)
| Roll | Result | Probability |
|------|--------|-------------|
| 1 | Miss (0 dmg) | 1/6 (16.67%) |
| 2 | Block (negate incoming) | 1/6 (16.67%) |
| 3 | Hit (1 dmg) | 1/6 (16.67%) |
| 4 | Hit (1 dmg) | 1/6 (16.67%) |
| 5 | Critical (2 dmg) | 1/6 (16.67%) |
| 6 | Hit (1 dmg) | 1/6 (16.67%) |

### Expected Damage Calculation

**Raw damage per roll (if nothing blocks):**
- Miss: 0 × (1/6) = 0
- Block: 0 × (1/6) = 0 (this blocks, doesn't attack)
- Hit: 1 × (3/6) = 0.5
- Crit: 2 × (1/6) = 0.333

**Raw total: 0.833 damage per roll**

**Accounting for opponent's blocks:**
- Opponent blocks 1/6 of the time
- My damage lands 5/6 of the time
- **Expected damage dealt: 0.833 × (5/6) = 0.694 HP per round**

### Key Finding: Damage Taken ≈ Enemy HP

Since both sides deal ~0.694 damage per round:
- **3 HP enemy:** Takes 4.3 rounds to kill → You take ~3 HP damage
- **5 HP enemy:** Takes 7.2 rounds to kill → You take ~5 HP damage
- **7 HP enemy:** Takes 10.1 rounds to kill → You take ~7 HP damage

**Rule of thumb: You take damage approximately equal to enemy's HP**

---

## Step 2: Combat Damage Budget

We have **6 combat encounters** per location:
- 5 Beasts
- 1 Hollow

### Option A: Conservative (20 HP total combat damage)
- 5 Beasts at 3 HP = 15 HP damage
- 1 Hollow at 5 HP = 5 HP damage
- **Total: 20 HP**

### Option B: Moderate (24 HP total combat damage)
- 3 Beasts at 3 HP = 9 HP damage
- 2 Beasts at 5 HP = 10 HP damage
- 1 Hollow at 5 HP = 5 HP damage
- **Total: 24 HP**

### Option C: Aggressive (26 HP total combat damage)
- 3 Beasts at 3 HP = 9 HP damage
- 2 Beasts at 5 HP = 10 HP damage
- 1 Hollow at 7 HP = 7 HP damage
- **Total: 26 HP**

---

## Step 3: Pit Mechanics Design

**Card text:** "Roll vs target. Need 3 successes before 3 failures."

### Target Number Options
| TN | Success Chance | Expected Successes | Expected Failures | Expected Total Rolls |
|----|----------------|-------------------|-------------------|---------------------|
| 2+ | 83.3% (5/6) | 3.6 rolls | 0.6 rolls | 4.2 rolls |
| 3+ | 66.7% (4/6) | 4.5 rolls | 1.5 rolls | 6.0 rolls |
| 4+ | 50% (3/6) | 6.0 rolls | 3.0 rolls | 9.0 rolls |

**For TN 3+ (moderate difficulty):**
- You'll roll ~6 times total
- Get 4.5 successes (need 3, so +1.5 extra)
- Get 1.5 failures (capped at 3)
- **Most players will succeed with 1-2 failures**

### Damage per Failure
If we have **3 Pit cards** with TN 3+:
- Total expected failures: 3 × 1.5 = 4.5 failures
- If each failure deals 2 HP: **~9 HP total from Pits**
- If each failure deals 3 HP: **~13.5 HP total from Pits**

**Design choice: 2 HP per failure feels balanced**

---

## Step 4: Total Damage Budget

Let's use **Option B** (moderate combat) and see where we land:

| Source | Damage |
|--------|--------|
| 5 Beasts + 1 Hollow (combat) | 24 HP |
| 3 Pit cards (TN 3+, 2 HP/fail) | ~9 HP |
| 1 Terror card | ??? |
| 1 Snare | ??? (penalty, not direct damage) |
| **Subtotal** | **33 HP + Terror** |

### Terror Card Design
Two-choice structure. Options:
1. Take HP damage now
2. Accept some other penalty (Dread? Bury cards? Lose Lux?)

**If Terror deals 6 HP (choosing damage option):**
- **Total damage available: ~39 HP**

This is way over our 20 HP starting health. We need healing.

---

## Step 5: Healing Budget

### Lux Healing (from 3 Caesura cards)
- 3 Caesura cards = 3 Lux
- Each Lux can heal for 5 HP
- **Max healing from Lux: 15 HP**

### Item Healing (2 Items)
Need to decide healing amounts. Options:
- **Conservative:** 3 HP and 4 HP = 7 HP total
- **Moderate:** 4 HP and 5 HP = 9 HP total
- **Generous:** 5 HP and 6 HP = 11 HP total

### Blessing Healing (1 Blessing)
Big moment, should be significant:
- **Option:** 8-10 HP

### Total Healing Budget
Using moderate assumptions:
- 2 Items: 9 HP
- 1 Blessing: 10 HP
- 3 Lux: 15 HP
- **Total: 34 HP**

---

## Step 6: Does it Balance?

### Damage vs Healing
- **Total damage available:** ~39 HP
- **Total healing available:** ~34 HP
- **Net deficit:** 5 HP
- **Player ending HP:** 20 - 5 = **15 HP**

This seems **too easy**. But wait - players won't always:
1. Use all Lux for healing (might use for rerolls/peeks)
2. Find healing cards before taking damage
3. Make optimal choices from the 3-card draw

### Realistic Scenario
- Player uses 2 Lux for healing (10 HP), saves 1 for critical reroll
- Player finds 1 Item early, 1 Item late (9 HP total)
- Player finds Blessing mid-game (10 HP)
- **Realistic healing used: 29 HP**
- **Realistic damage taken: ~35 HP** (not all cards drawn)
- **Ending HP: 20 + 29 - 35 = 14 HP**

Still seems survivable. Let me try Option C (aggressive):

### Option C Rebalanced
- **Combat:** 26 HP
- **Pits:** 9 HP
- **Terror:** 6 HP
- **Total damage:** 41 HP
- **Realistic healing:** 29 HP
- **Ending HP:** 20 + 29 - 41 = **8 HP**

**This feels better** - player survives but feels the pressure.

---

## WORKING NUMBERS for Location 1

### Combat Encounters
- 3 Beasts at 3 HP
- 2 Beasts at 5 HP
- 1 Hollow at 7 HP
- **Total combat damage: 26 HP**

### Pit Cards (3 cards)
- TN 3+ (need 3 successes before 3 failures)
- 2 HP per failure
- **Expected damage: ~9 HP**

### Terror Card (1 card)
- Choose one:
  - Take 6 HP damage
  - OR alternate penalty (lose Lux? Bury card?)
- **Expected damage if taking HP: 6 HP**

### Total Damage: 41 HP

### Healing
- 2 Items: 4 HP and 5 HP = 9 HP
- 1 Blessing: 10 HP
- 3 Lux → up to 15 HP (but realistically 10 HP spent on healing)
- **Total healing: 29 HP**

### Expected Result
- Starting: 20 HP
- Damage taken: ~35 HP (not all cards drawn)
- Healing gained: ~29 HP
- **Ending: 8-12 HP** ✓

This creates tension without being punishing.
