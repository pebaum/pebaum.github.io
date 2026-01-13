# Simulation Results v2 - New Combat System

## Changes Made
1. **Combat:** Player rolls 3d6 (choose best), enemy rolls 1d6
2. **Combat table:** Added Counter on 6 (block + 1 dmg)
3. **Equipment:** Gnarled Branch (1→Hit), Empty Prism (required for Lux)
4. **Items:** Disabled (Old Boot, Older Boot) - no healing
5. **Terror:** 5 HP OR 1 Lux (was 6 HP OR discard Item)
6. **Peek:** Flip 2 cards, shuffle up to 2 back (was flip 1, shuffle 1)

---

## Results (1000 simulations)

**Win Rate: 60.4%** ✓
- 604 survivors (60.4%)
- 396 deaths (39.6%)

**Ending HP (survivors):**
- Average: 10.7 HP
- Median: 12.0 HP
- Range: 1-20 HP

**HP Distribution:**
- 0-4 HP: 95 (16%)
- 5-9 HP: 110 (18%)
- **10-14 HP: 254 (42%)** ← Most common
- 15-19 HP: 139 (23%)
- 20 HP: 6 (1%)

**Averages per game:**
- Damage taken: 22.0 HP (down from 25.2)
- Healing used: 8.2 HP (mostly Blessing + Lux)
- Combat encounters: 5.5 (out of 6)
- Lux spent on peek: 0.0 (!!!)
- Lux spent on heal: 1.1

---

## Analysis

### The 3d6 vs 1d6 System Creates Huge Player Advantage

**Math:**
- Player rolling 3d6 (choose best): Average ~4.5
- Enemy rolling 1d6: Average ~3.5

**Impact:**
- Player hits more often (better rolls)
- Player blocks more often (more chances at rolling 2)
- Player counters more often (more chances at rolling 6)
- Combat is much shorter (~3 HP less damage taken)

**This is a massive shift from v1:**
- v1: Both rolled 1d6 simultaneously = fair fight, 25 HP damage
- v2: Player rolls 3d6 vs 1d6 = player favored, 22 HP damage

### The Empty Prism Problem

**Critical Issue:** Empty Prism is required for all Lux usage, but it's a random draw!

**What happens:**
- Early game: Player draws cards, gains Lux from Caesuras, but **can't spend it**
- Empty Prism appears randomly (could be card 2, could be card 15)
- Once found, all stored Lux becomes usable
- But by then, player may have already faced most combat encounters

**Evidence from simulation:**
- Lux spent on peek: **0.0** (AI never peeked because it often didn't have Empty Prism)
- Lux spent on heal: Only **1.1** per game (should be 2-3 if always available)

**This creates high variance:**
- Lucky run: Find Empty Prism early (card 2-5) = lots of Lux flexibility = easy win
- Unlucky run: Find Empty Prism late (card 12-16) = no Lux healing = likely death

### Blessing (10 HP) is Balanced

With no Item healing, Blessing is the only guaranteed heal source:
- 10 HP heal + cleanse Snare
- Appears once per location
- With 60% win rate, it's not overpowered
- Could be buffed to 12 HP if needed

### Terror is Interesting Now

**5 HP or 1 Lux** creates a real choice:
- Early game (no Empty Prism): Must take 5 HP
- Mid game (have Empty Prism + Lux): Losing 1 Lux hurts healing potential
- Late game (low Lux): Must take 5 HP again

The choice feels more meaningful than "discard Item."

### New Peek Mechanic is Powerful (But Unused)

**Flip 2, shuffle up to 2 back** is very strong:
- See 2 of 3 cards
- Can shuffle back the unknown 3rd card too!
- Effectively "scry 2" + selective removal

But AI didn't use it (Empty Prism problem), so we can't evaluate effectiveness yet.

---

## Comparison: v1 vs v2

| Metric | v1 (1d6 vs 1d6) | v2 (3d6 vs 1d6) | Change |
|--------|------------------|------------------|--------|
| Win Rate | 58% | 60.4% | +2.4% |
| Avg Ending HP | 10.1 HP | 10.7 HP | +0.6 HP |
| Damage Taken | 25.2 HP | 22.0 HP | -3.2 HP |
| Healing Used | 10.7 HP | 8.2 HP | -2.5 HP |
| Lux on Peek | 0.0 | 0.0 | Same |
| Lux on Heal | 1.2 | 1.1 | -0.1 |

**Key insight:** 3d6 vs 1d6 reduces damage taken by 3 HP, making the game slightly easier despite less healing.

---

## Recommendations

### 1. Fix Empty Prism Gating (Critical)

**Problem:** Lux system is unusable until Empty Prism is found.

**Option A: Start with Empty Prism equipped**
- Pro: Lux system always available, consistent experience
- Con: Removes decision of Equipment choice

**Option B: Guarantee Empty Prism in top 5 cards**
- Pro: Lux available early, but still feels earned
- Con: Requires deck manipulation

**Option C: Remove Empty Prism requirement**
- Pro: Lux always works, simplifies rules
- Con: Loses the "you found the tool to use your power" moment
- Con: What does Empty Prism do then?

**Option D: Change Empty Prism effect**
- New effect: "Doubles Lux capacity (max 6 instead of 3)"
- Pro: Lux works without it, but better with it
- Con: Changes power curve significantly

**Recommendation:** **Option A** (start with Empty Prism) for cleaner design

### 2. Balance Combat Difficulty

**Current:** 3d6 vs 1d6 = player heavily favored

**If we want 70% win rate (easier Location 1):**
- Keep current system

**If we want 55% win rate (harder Location 1):**
- Player rolls 2d6 (choose best) vs enemy 1d6
- Or: Player rolls 3d6 vs enemy rolls 2d6

**If we want 50% win rate (fair fight):**
- Back to 1d6 vs 1d6 (v1 system)

**Recommendation:** Test with **Option A** (start with Empty Prism) first, see if Lux usage changes balance

### 3. Re-enable Item Healing

Once combat and Lux are balanced, add Items back:
- Item 1: Heal 4 HP
- Item 2: Heal 5 HP
- Should push win rate up 5-10%

### 4. Increase Blessing if Needed

If win rate drops below 60% after Empty Prism fix:
- Blessing: 10 HP → 12 HP (+2 HP)

### 5. Playtest New Peek Mechanic

Once Empty Prism is fixed, track:
- How often players peek (should be 1-2 times per location)
- How many cards shuffled back (should be 1-2 per peek)
- Does it feel powerful enough for 1 Lux?

---

## Next Steps

1. **Decide on Empty Prism fix** (start equipped? guaranteed early? remove requirement?)
2. **Re-run simulation** with fix
3. **Add Item healing** if win rate is stable at 60-65%
4. **Manual playtest** to verify AI behavior matches human play
5. **Lock in Location 1 numbers** before designing Location 2

---

## Design Philosophy Check

**From "Start Over 1.11.26":**
> "Draw 3 face down → choose one and resolve"

This blind choice is the core tension. With new peek mechanic, we can spend resources to reduce blindness. Good!

**Risk management meets existential courage.**

The 3d6 vs 1d6 system makes combat less scary (more control). Is this good or bad?
- Good: Less frustrating, skill expression through die choice
- Bad: Less tense, feels less "on the edge"

Current 60% win rate suggests tension is still there, just shifted from "will I roll well" to "did I find Empty Prism early enough."
