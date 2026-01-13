# Reduced Damage Results

## Simulation Results

**41.9% completion rate** (419 out of 1000 runs)

Massive jump from 10.1% → 41.9% with damage reduction!

---

## Changes Made

### Enemy HP Reduced by 1
- **Tier 1 Beasts:** 3→2, 5→4 HP
- **Tier 2 Beasts:** 5→4, 7→6 HP
- **Tier 3 Beasts:** 7→6, 9→8 HP
- **Hollow:** 7→6, 9→8, 10→9 HP

### HP Penalties Reduced by 1
- **Pit damage:** 2→1 HP per failure
- **Terror damage:** 5→4 HP

### Healing Changes
- **Removed:** Full heal after defeating Hollow
- **Kept:** Full heal between locations only

---

## Clear Rate Analysis

### Tier 1 (Locations 1-3): 97.9% Average
- Location 1: **98.1%** (19 deaths / 1.9%)
- Location 2: **98.1%** (19 deaths / 1.9%)
- Location 3: **97.4%** (25 deaths / 2.5%)

**Very high success rate.** Early game is now very survivable.

### Tier 2 (Locations 4-6): 91.7% Average
- Location 4: **92.0%** (75 deaths / 7.5%)
- Location 5: **90.0%** (86 deaths / 8.6%) ← Deadliest tier 2 location
- Location 6: **93.0%** (54 deaths / 5.4%)

**Still challenging** but manageable. Location 5 is the bottleneck for Tier 2.

### Tier 3 (Locations 7-9): 83.4% Average
- Location 7: **82.5%** (126 deaths / 12.6%) ← **Deadliest overall**
- Location 8: **82.9%** (102 deaths / 10.2%)
- Location 9: **84.8%** (75 deaths / 7.5%)

**Hardest tier.** Location 7 is where most runs end (12.6% of all deaths).

---

## Death Distribution

| Tier | Deaths | % of Total |
|------|--------|------------|
| Tier 1 (1-3) | 63 | **10.9%** |
| Tier 2 (4-6) | 215 | **37.0%** |
| Tier 3 (7-9) | 303 | **52.1%** |

**Most deaths occur in Tier 3** (Locations 7-9), as expected for endgame.

**Location 7 is the final boss spike** - 12.6% of all deaths happen here.

---

## Damage vs Healing

| Location | Avg Damage | Avg Healing | Net |
|----------|------------|-------------|-----|
| 1 | 17.6 HP | 10.2 HP | **-7.4 HP** |
| 2 | 17.6 HP | 10.1 HP | **-7.5 HP** |
| 3 | 17.4 HP | 9.9 HP | **-7.5 HP** |
| 4 | 21.9 HP | 13.0 HP | **-8.9 HP** |
| 5 | 22.0 HP | 12.8 HP | **-9.2 HP** |
| 6 | 21.9 HP | 13.2 HP | **-8.7 HP** |
| 7 | 25.2 HP | 15.4 HP | **-9.8 HP** |
| 8 | 25.0 HP | 15.1 HP | **-9.9 HP** |
| 9 | 25.3 HP | 15.8 HP | **-9.5 HP** |

**Analysis:**
- Net damage per location: **7-10 HP**
- Between-location heal: **+20 HP**
- **Net gain per location cycle:** +10-13 HP

This creates sustainable progression where you can survive multiple locations.

---

## Comparison: Before vs After

| Metric | Before (10.1%) | After (41.9%) | Change |
|--------|---------------|---------------|--------|
| **Completion rate** | 10.1% | 41.9% | **+31.8%** ✅ |
| **Tier 1 clear rate** | 86.7% | 97.9% | +11.2% |
| **Tier 2 clear rate** | 77.7% | 91.7% | +14.0% |
| **Tier 3 clear rate** | 69.2% | 83.4% | +14.2% |
| **Location 1 deaths** | 13.7% | 1.9% | -11.8% |
| **Location 7 deaths** | 9.8% | 12.6% | +2.8% (now final gauntlet) |

**Key insights:**
- Early game is now **much more forgiving** (98% clear rate vs 86%)
- Tier 2 is now the **comfortable middle** (92% vs 78%)
- Tier 3 is now the **real challenge** (83% vs 69%)

---

## Difficulty Curve Assessment

### Current Curve (After Changes)
```
Tier 1: ████████████████████████ 98% (Tutorial)
Tier 2: ████████████████████     92% (Building power)
Tier 3: ██████████████████       83% (Final gauntlet)
Overall: ████████                 42% (Challenge)
```

**Pros:**
- ✅ Smooth difficulty ramp (98% → 92% → 83%)
- ✅ Early game doesn't gatekeep (only 11% die in Tier 1)
- ✅ Final tier provides real challenge (52% of deaths)
- ✅ Location 7 feels like a "final boss rush" (highest death rate)
- ✅ 42% win rate is in the sweet spot for challenging roguelikes

**Cons:**
- ⚠️ Tier 1 might be too easy (98% clear rate)
- ⚠️ Less tension in early game

---

## Target Audience Fit

### 42% Win Rate Comparison
- **Slay the Spire:** ~30-40% (experienced players)
- **Into the Breach:** ~40-50%
- **FTL:** ~20-30%
- **Dark Souls first playthrough:** ~40-50%

**Forward at 42% fits perfectly in the "challenging but fair" range.**

---

## Recommendations

### Option 1: Keep Current Balance ⭐ (Recommended)
- 42% AI win rate is excellent
- Smooth difficulty curve
- Early game accessible, late game challenging
- Humans with skill could reach 50-60% win rate

### Option 2: Slightly Increase Early Difficulty
If 98% Tier 1 clear rate feels too easy:
- Increase Tier 1 Hollow HP from 6 → 7 HP
- Expected result: 95% Tier 1 clear, 38% overall

### Option 3: Add More Tier 3 Challenge
If Location 7-9 feels too easy:
- Increase Tier 3 Beast HP by 1 (6→7, 8→9)
- Expected result: 78% Tier 3 clear, 35% overall

---

## Final Assessment

**Current balance is excellent:**
- ✅ 42% completion rate (challenging roguelike)
- ✅ Smooth difficulty ramp (no sharp spikes)
- ✅ Early game accessible (doesn't gatekeep new players)
- ✅ Late game challenging (52% of deaths in Tier 3)
- ✅ Equipment scaling matters (damage only increases 8 HP across 9 locations despite enemy HP doubling)
- ✅ Strategic depth (Location 7 is clear final gauntlet)

**No changes needed.** This is ready for playtesting!

---

## Key Stats Summary

| Metric | Value |
|--------|-------|
| **Full Campaign Wins** | 419 / 1000 (41.9%) |
| **Easiest Location** | Location 2 (98.1% clear) |
| **Hardest Location** | Location 7 (82.5% clear) |
| **Most Dangerous** | Location 7 (12.6% of all deaths) |
| **Tier 1 Deaths** | 10.9% |
| **Tier 2 Deaths** | 37.0% |
| **Tier 3 Deaths** | 52.1% |

The game now has a classic roguelike difficulty curve: accessible early, brutal endgame, rewarding for skilled players.
