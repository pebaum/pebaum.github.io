# Simulation Results - Location 1 Balance

## Test 1: Conservative AI (heal when HP < 8)

**Win Rate: 44%** ⚠️ **WAY TOO HARD**
- 559 deaths (56%)
- 441 survivors (44%)

**Survivors averaged 7.3 HP** (median 8 HP)

**The Problem:**
- Damage taken: 25.6 HP ✓ (matches prediction)
- Healing used: **Only 8.3 HP** (vs 34 HP available!)
- Lux spent on healing: 0.4 per game
- **AI was too greedy**, died before using resources

---

## Test 2: Aggressive AI (heal when HP < 12)

**Win Rate: 58%** ⚠️ **STILL TOO HARD**
- 417 deaths (42%)
- 583 survivors (58%)

**Survivors averaged 10.1 HP** (median 12 HP)
- Much better! Closer to the 9-12 HP target

**Key improvements:**
- Healing used: 10.7 HP (+2.4 HP)
- Lux spent on healing: 1.2 per game (3× more)
- More survivors in 10-14 HP range

**HP Distribution (survivors):**
- 0-4 HP: 94 survivors (barely made it)
- 5-9 HP: 137 survivors
- **10-14 HP: 256 survivors** (sweet spot!)
- 15-19 HP: 93 survivors
- 20 HP: 3 survivors (perfect play)

---

## Analysis

### What We Learned

1. **Player behavior matters hugely!**
   - Conservative healing: 44% win rate
   - Aggressive healing: 58% win rate
   - **14% swing based on healing strategy**

2. **The math is close**
   - Damage prediction: 26 HP → Actual: 25.2 HP ✓
   - But healing usage varies wildly (8-11 HP depending on strategy)

3. **58% win rate is still too low**
   - Target should be **70-80%** for first location
   - Need to buff either healing or nerf damage slightly

---

## Recommended Balance Changes

### Option A: Buff Healing (★ Recommended)
**Changes:**
- Item 1 (Rations): 4 HP → **5 HP**
- Item 2 (Healing Salve): 5 HP → **6 HP**
- Blessing: 10 HP → **12 HP**

**Expected impact:**
- Total healing: +4 HP available
- Should push win rate to ~68-72%
- Survivors end with 12-14 HP average

**Why this is best:**
- Keeps combat difficulty intact
- Rewards finding healing cards
- Makes Items/Blessing feel more impactful
- Simplest change (just number tweaks)

### Option B: Nerf Damage
**Changes:**
- Hollow: 7 HP → **5 HP**
- Or: Change 1 Beast from 5 HP → **3 HP**

**Expected impact:**
- Total damage: -2 HP or -5 HP
- Should push win rate to ~65-70%

**Downside:**
- Less satisfying (fewer big fights)
- Makes early game too easy

### Option C: Add One More Caesura
**Changes:**
- 3 Caesura → **4 Caesura**
- Remove 1 Pit card (19 cards → 3 Pit becomes 2 Pit)

**Expected impact:**
- +1 Lux = +5 HP potential healing
- Should push win rate to ~68%
- More Lux for peek/reroll flexibility

**Downside:**
- Changes card distribution from spec
- Might make game too resource-rich

---

## Additional Insights

### Combat is Well-Balanced
- 5.2 combat encounters per game (close to expected 6)
- Damage from combat matches predictions (~25 HP)
- Equipment variety works (both offensive/defensive viable)
- Combat length feels right

### Pit Challenges are Fair
- Not causing unusual spike in deaths
- Damage is predictable (~2-4 HP per Pit)
- TN 3+ difficulty feels appropriate

### Terror Choice is Harsh But Fair
- 6 HP loss is significant
- Often forced to take it (no Items early game)
- Creates meaningful tension
- Consider reducing to 5 HP if doing Option A

### Snare is Appropriately Punishing
- Blocks Lux usage which is critical for survival
- Only 1 per location seems fair
- Blessing cleanses it (good counterplay exists)
- Adds strategic depth (find Blessing becomes priority)

### Peek Mechanic Underutilized
- AI only used peek 0.8 times with conservative healing
- Dropped to 0.0 times with aggressive healing
- Real players might use it more strategically
- Consider: Is 1 Lux the right price, or should it cost less?

---

## Final Recommendation

### Implement Option A with Minor Terror Nerf

**Updated Card Values:**
1. **Rations:** 4 HP → 5 HP (+1 HP)
2. **Healing Salve:** 5 HP → 6 HP (+1 HP)
3. **Blessing:** 10 HP → 12 HP (+2 HP)
4. **Terror:** 6 HP → 5 HP (-1 HP damage option)

**Total healing added:** +4 HP
**Total damage reduced:** -1 HP
**Net benefit:** +5 HP swing

**Expected outcome with aggressive AI:**
- Win rate: 58% → **72%** ✓
- Average ending HP: 10 HP → **14 HP** ✓
- Still challenging but fair for first location

---

## Next Steps

1. **Update [location-1-complete.md](location-1-complete.md)** with new values
2. **Re-run simulation** to verify ~70% win rate
3. **Playtest manually** to confirm AI behavior matches human play
4. **Move to Location 2 design** with slightly higher difficulty
5. **Consider progressive difficulty:**
   - Location 1: 70% win rate (tutorial)
   - Location 3: 60% win rate (moderate)
   - Location 5: 50% win rate (hard)
   - Location 9: 40% win rate (very hard)

---

## Validation: Math Worked!

✅ **Combat damage prediction was accurate** (26 HP predicted, 25.2 HP actual)
✅ **HP distribution makes sense** (most survivors in 10-14 HP range)
✅ **Equipment modifiers work** (Telos' Arc and Warden's Shield both viable)
✅ **Game has tension** (even with fixes, not a cakewalk)

The issue wasn't the math - it was **slightly underestimating how much buffer players need** for a first location. With +5 HP swing, the game should feel challenging but fair.
