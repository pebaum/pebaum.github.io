# Equipment/Item Scaling Results (No HP Growth)

## Simulation Results

**0.3% completion rate** (3 out of 1000 runs)

The game is now **essentially impossible** with static 20 HP and no between-location recovery.

---

## What Changed

### Removed:
- ❌ HP growth (+5 per location)
- ❌ Between-location healing (50% max HP)
- ❌ Lux healing scaling (kept at 5 HP)

### Added:
- ✅ Tier-based weapon progression
- ✅ Tier-based tool progression
- ✅ Tier-based item healing
- ✅ Equipment that gets better each tier

---

## Equipment Progression (Working as Intended)

### Tier 1 (Locations 1-3)
- **Gnarled Branch**: 1 → Hit
- **Empty Prism**: Enables Lux
- **Items**: Heal 3 HP each

### Tier 2 (Locations 4-6)
- **Sturdy Blade**: 1 → Hit, **2 → Hit**
- **Refined Prism**: Enables Lux, first reroll free
- **Items**: Heal 5 HP each

### Tier 3 (Locations 7-9)
- **Masterwork Blade**: 1 → Hit, 2 → Hit, **3-4 → Hit+1**
- **Perfect Prism**: Enables Lux, Caesuras give **+2 Lux**
- **Items**: Heal 8 HP each

---

## Why It's Not Working

### The Math Problem

**Location 1:**
- Damage taken: 22.4 HP
- Healing: 12.7 HP (2 items × 3 HP + Blessing 10 HP + some Lux)
- **Net: -9.7 HP**

**Location 2:**
- Damage taken: 17.3 HP (better weapon helps!)
- Healing: 12.4 HP
- **Net: -4.9 HP**

**Location 3:**
- Damage taken: 16.6 HP
- Healing: 11.7 HP
- **Net: -4.9 HP**

**Cumulative after 3 locations: ~-20 HP**

You start with 20 HP. After 3 locations, you've lost 20 HP. **You're dead.**

Even with better equipment reducing damage, you're still losing 5-10 HP per location. Over 9 locations, that's **45-90 HP lost** total.

---

## Clear Rate by Location

| Location | Clear % | Why |
|----------|---------|-----|
| 1 | 82.7% | Items help! Better than before (72%). |
| 2 | 67.7% | Weapon helps, but damage accumulating |
| 3 | 61.3% | Below baseline, HP critical |
| 4 | 48.7% | **Below 50%** - death spiral starts |
| 5 | 44.9% | Tier 2 gear not enough to offset damage |
| 6 | 36.0% | Cascading failure |
| 7-9 | 40-55% | Tier 3 gear is powerful, but few survive to see it |

**Death Distribution:**
- 65.7% die in Locations 1-3 (first tier)
- 31.6% die in Locations 4-6 (second tier)
- 2.7% die in Locations 7-9 (third tier)

Most players die before reaching the powerful Tier 2+ equipment.

---

## The Core Problem

**You need recovery between locations.**

Without some form of HP restoration between locations, the game is mathematically impossible because:

1. Every location deals net damage (even with perfect play)
2. Damage accumulates across 9 locations
3. Starting HP (20) is too low to absorb 9 locations of net damage

Even with equipment scaling, **the damage outpaces healing by 5-10 HP per location.**

---

## Possible Solutions

### Option 1: Between-Location Rest ⭐ (Recommended)

Add a fixed "Rest" mechanic between locations:
```
After completing Location N, heal 10 HP (cannot exceed 20 max).
```

**Impact:**
- Provides 80 HP total healing across 8 rests (9 locations)
- Keeps HP static at 20 max
- Maintains tension within each location
- Rewards survival with recovery

**Expected result:** 15-25% completion rate

---

### Option 2: Add More Items Per Location

Currently: 2 items per location (6 HP / 10 HP / 16 HP healing per tier)

**Proposal:** 4 items per location
- Tier 1: 4 × 3 HP = 12 HP
- Tier 2: 4 × 5 HP = 20 HP
- Tier 3: 4 × 8 HP = 32 HP

**Impact:**
- Doubles item healing
- Makes deck size larger (23 cards vs 19)
- Might make locations too long

**Expected result:** 5-10% completion rate (still too low)

---

### Option 3: Increase Item Healing

Currently: 3 HP / 5 HP / 8 HP

**Proposal:** 5 HP / 8 HP / 12 HP

**Impact:**
- Tier 1: 10 HP total (vs 6)
- Tier 2: 16 HP total (vs 10)
- Tier 3: 24 HP total (vs 16)

**Expected result:** 8-12% completion rate (still low)

---

### Option 4: Make Blessing Scale More Aggressively

Currently: 10 HP / 12 HP / 14 HP

**Proposal:** 12 HP / 15 HP / 18 HP

**Impact:**
- Tier 1: +2 HP (14 total healing vs 12)
- Tier 2: +5 HP (19 total healing vs 14)
- Tier 3: +8 HP (32 total healing vs 24)

**Expected result:** 10-15% completion rate

---

### Option 5: Combine Multiple Solutions

**Proposed combination:**
1. Between-location rest: Heal 8 HP
2. Increase item healing: 5 / 8 / 12 HP
3. Keep equipment scaling as-is

**Expected result:** 20-30% completion rate

---

## Recommendation

**Use Option 1: Between-Location Rest (10 HP)**

This is the cleanest solution because:
1. ✅ Keeps max HP at 20 (your requirement)
2. ✅ Keeps Lux healing at 5 HP (your requirement)
3. ✅ Maintains item/equipment scaling (your requirement)
4. ✅ Simple mechanic: "Rest after each location, heal 10 HP"
5. ✅ Feels thematic: You rest between dangerous expeditions
6. ✅ Expected ~15-25% win rate (challenging but fair)

**Implementation:**
```python
# In simulate_location, at the start:
if location_num > 1:
    # Rest between locations: heal 10 HP
    state.hp = min(state.hp + 10, state.max_hp)
```

---

## Equipment Scaling IS Working

The good news: **Equipment scaling is effective**

**Evidence:**
- Location 1 clear rate: 82.7% (vs 72% with old system) ✅
- Damage per location drops from 22 → 17 → 16 as you get better weapons
- Tier 2 weapon (2 → Hit) significantly reduces combat variance
- Tier 3 weapon (3-4 → Hit+1) deals massive damage
- Perfect Prism (+2 Lux from Caesuras) generates more resources

**The problem isn't the equipment scaling. The problem is lack of recovery between locations.**

---

## Next Steps

1. Add between-location rest (heal 10 HP)
2. Re-run simulation
3. Adjust rest amount if needed (8 HP? 12 HP?)
4. Target: 15-25% completion rate

Would you like me to implement Option 1 (rest between locations)?
