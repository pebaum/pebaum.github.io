# Simulation Results v2 - Empty Prism Always First

## Test Condition
**Empty Prism is guaranteed as the first card drawn**
- All other cards shuffled randomly
- Player always has Lux access from the start

---

## Results (1000 simulations)

**Win Rate: 63.7%** ✓ (up from 60.4%)
- 637 survivors (63.7%)
- 363 deaths (36.3%)
- **+3.3% improvement** from having Empty Prism guaranteed

**Ending HP (survivors):**
- Average: 10.6 HP
- Median: 12.0 HP
- Range: 1-20 HP

**HP Distribution:**
- 0-4 HP: 85 (13%)
- 5-9 HP: 147 (23%)
- **10-14 HP: 284 (45%)** ← Most common
- 15-19 HP: 118 (19%)
- 20 HP: 3 (0.5%)

**Averages per game:**
- Damage taken: 21.7 HP (down from 22.0)
- Healing used: 8.2 HP (same)
- Combat encounters: 5.5 (same)
- **Lux spent on peek: 0.0** (still!)
- Lux spent on heal: 1.2 (up from 1.1)

---

## Analysis

### Empty Prism Guaranteed = +3.3% Win Rate

**Comparison:**
- Random Empty Prism: 60.4% win rate
- Guaranteed first card: **63.7% win rate**
- **Difference: +3.3%**

This is significant but not huge. The variance from random Empty Prism draw matters, but not as much as I expected.

**Why only +3.3%?**
- Most of the benefit comes from having Lux available for healing early
- Lux healing went from 1.1 → 1.2 per game (only +0.1!)
- The AI still barely uses Lux for anything other than emergency healing

### The AI Still Doesn't Peek!

**Lux spent on peek: 0.0** even with Empty Prism available from start.

**Why?**
1. AI only considers peeking when HP < 10 (survival mode)
2. When HP < 10, healing is more valuable than information
3. Peek logic is too conservative

**This means:**
- We can't evaluate the new peek mechanic effectiveness yet
- Need smarter AI or human playtest
- Real players would likely peek 1-2 times per location strategically

### Lux Healing Usage is Still Low

**Only 1.2 Lux spent on healing per game** (out of 3 available)

**Math:**
- 3 Caesuras give 3 Lux
- Terror can cost 1 Lux (if choosing that option)
- Using 1.2 on healing means ~1.8 Lux left over or spent on Terror

**Why so low?**
- AI heals aggressively with Lux when HP < 12
- But most damage comes in combat bursts
- By the time HP drops to 11, one Lux heal brings it back to 16
- Then no more healing needed until next big hit

This seems... reasonable? Or is the AI leaving Lux on the table?

### 63.7% Win Rate: Is This Right?

**For Location 1 (tutorial area), 63.7% feels good:**
- Not too easy (would be 75%+)
- Not too hard (would be <55%)
- Player needs to make good choices but can survive

**Location difficulty curve goal:**
- Location 1: 60-70% (tutorial) ✓
- Location 3: 50-60% (moderate)
- Location 5: 40-50% (hard)
- Location 9: 30-40% (very hard)

### Combat is Still Player-Favored

**3d6 (choose best) vs 1d6** is a huge advantage:
- Player average roll: ~4.5
- Enemy average roll: ~3.5
- Player hits more, blocks more, counters more
- Damage taken: 21.7 HP (vs expected 26 HP from 6 combats)

**Is this good?**
- Yes: Location 1 should feel conquerable
- Combat still has tension (you can still die)
- Equipment (Gnarled Branch) makes you stronger
- The "choose which die" mechanic adds skill expression

---

## Comparison: Random vs Guaranteed Empty Prism

| Metric | Random Prism | Guaranteed First | Change |
|--------|--------------|------------------|--------|
| Win Rate | 60.4% | 63.7% | +3.3% |
| Avg Ending HP | 10.7 HP | 10.6 HP | -0.1 HP |
| Damage Taken | 22.0 HP | 21.7 HP | -0.3 HP |
| Healing Used | 8.2 HP | 8.2 HP | 0 |
| Lux on Peek | 0.0 | 0.0 | 0 |
| Lux on Heal | 1.1 | 1.2 | +0.1 |

**Key insight:** Having Empty Prism early gives a modest but meaningful boost. The +3.3% win rate is entirely from having Lux healing available consistently.

---

## What Does This Mean for Design?

### 1. Empty Prism Should Be Guaranteed Early

**Options:**
- **Start equipped** (cleanest, removes variance)
- **Always first card** (current test - works well)
- **Guaranteed in first 3 cards** (still removes most variance)

**Recommendation:** **Start equipped** for simplicity
- Removes the "draw and immediately equip" step
- Consistent experience every playthrough
- One less thing to track

### 2. Blessing (10 HP) is Well-Balanced

With 63.7% win rate and only Blessing + Lux for healing:
- 10 HP is not overpowered
- Not underpowered either
- Could stay at 10 HP or increase to 12 HP if we add Items

### 3. The Peek Mechanic Needs Human Testing

AI doesn't peek strategically, so we can't evaluate:
- Is "flip 2, shuffle 2" powerful enough?
- Is 1 Lux the right cost?
- How often would players use it?

**Hypothesis:** Human players would peek 1-2 times per location when:
- Low HP and facing unknown cards
- Have multiple Lux and want to avoid combat
- Looking for specific cards (Blessing, Caesura)

### 4. Should We Add Item Healing Now?

**Current state:**
- 63.7% win rate with no Item healing
- Only Blessing (10 HP) + Lux (5 HP per) available

**If we add Items:**
- 2× Items at 4-5 HP each = +9 HP healing
- Would push win rate to ~72-75%
- Maybe too easy?

**Options:**
- Add Items but nerf Blessing (10 → 8 HP)
- Add Items but reduce to 1 Item instead of 2
- Add Items but make them 3 HP each instead of 4-5 HP
- Keep Items disabled for now

**Recommendation:** Add 2× Items (4 HP, 5 HP) and see if win rate hits 70-75%

### 5. Terror (5 HP or 1 Lux) is Working

AI chooses Lux loss when:
- Has Lux available
- HP < 12

This creates a real choice and seems balanced.

---

## Next Steps

1. **Decision: Should Empty Prism start equipped?**
   - Yes: Removes variance, cleaner design
   - No: Keep as guaranteed first card

2. **Re-enable Item healing** (4 HP, 5 HP)
   - Test if win rate goes to 70-75%
   - Adjust Blessing if too much healing

3. **Human playtest** to evaluate:
   - Peek mechanic usage and value
   - Does 3d6-choose combat feel good?
   - Is 63-70% win rate the right difficulty?

4. **Consider tweaking combat** if we want harder:
   - Player rolls 2d6 (choose best) instead of 3d6
   - Or enemy rolls 2d6 (take worst)
   - Target: 55-60% win rate if we want it harder

5. **Lock in Location 1 numbers** before Location 2 design

---

## Recommendation: Current v2 Numbers Are Good!

**Win rate: 63.7%** with Empty Prism guaranteed ✓

If we:
- **Start with Empty Prism equipped** (remove variance)
- **Keep current HP values** (Beasts 3/3/3/5/5, Hollow 7)
- **Keep Blessing at 10 HP**
- **Keep Terror at 5 HP or 1 Lux**
- **Add Items back** (4 HP, 5 HP)

Expected result:
- **Win rate: 68-72%** (good for tutorial location)
- Survivors end with 12-14 HP
- Challenging but fair
- Multiple viable strategies

This feels like the right balance for Location 1!
