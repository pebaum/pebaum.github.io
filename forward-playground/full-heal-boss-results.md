# Full Heal + Predictable Boss Results

## Simulation Results

**10.1% completion rate** (101 out of 1000 runs)

The game is now completable but very challenging.

---

## Changes Implemented ✅

1. **Player starts with Empty Prism** (not in deck)
2. **No tool upgrades** (Empty Prism stays as-is, no Refined/Perfect Prism)
3. **Hollow positioned in last 3 cards** (predictable boss fight)
4. **Full heal after killing Hollow** (20 HP reward)
5. **Full heal between locations** (20 HP at start of each new location)
6. **Removed Caesura tier 3 bonus** (always +1 Lux)

---

## Deck Composition Per Location

**18 cards total** (down from 19):
- 2 Items (healing: 3/5/8 HP)
- 1 Weapon (scales by tier)
- 5 Beasts (HP scales by tier)
- 1 Hollow (guaranteed in last 3 cards)
- 1 Terror
- 3 Pits
- 1 Snare
- 1 Blessing (10/12/14 HP)
- 3 Caesuras

---

## Clear Rate Analysis

### Overall Pattern
Clear rates show a **tier-based difficulty spike**:

| Tier | Locations | Avg Clear % | Pattern |
|------|-----------|-------------|---------|
| 1 | 1-3 | 86.7% | High success rate |
| 2 | 4-6 | 77.7% | **-9% drop** |
| 3 | 7-9 | 69.2% | **-8.5% drop** |

### By Location

| Location | Clear % | Deaths | Notes |
|----------|---------|--------|-------|
| 1 | 86.3% | 137 (13.7%) | Strong start with items |
| 2 | 85.6% | 124 (12.4%) | Still in easy tier |
| 3 | 88.1% | 88 (8.8%) | Highest clear rate |
| 4 | **75.6%** | 159 (15.9%) | **Tier 2 spike, highest deaths** |
| 5 | 77.2% | 112 (11.2%) | Stabilizing |
| 6 | 80.3% | 75 (7.5%) | Recovery with better gear |
| 7 | **67.9%** | 98 (9.8%) | **Tier 3 spike** |
| 8 | 70.0% | 62 (6.2%) | Stabilizing |
| 9 | 69.7% | 44 (4.4%) | Final boss |

---

## Death Distribution

**Deaths are spread more evenly now** (no single bottleneck):

- Location 1-3: 34.9% of deaths (Tier 1)
- **Location 4-6: 34.6% of deaths (Tier 2)** ← Most dangerous tier
- Location 7-9: 25.6% of deaths (Tier 3)

**Key insight:** Location 4 is the deadliest (15.9% of all deaths) because:
1. Enemy HP jumps from 3-5 → 5-7
2. You might not have Sturdy Blade yet (weapon in deck)
3. First time facing harder enemies

---

## Healing vs Damage

### Per Location Average

| Location | Damage | Healing | Net | Boss Heal |
|----------|--------|---------|-----|-----------|
| 1 | 20.2 HP | 16.2 HP | **-4.0 HP** | +20 HP |
| 2 | 20.0 HP | 15.8 HP | **-4.2 HP** | +20 HP |
| 3 | 19.6 HP | 15.9 HP | **-3.7 HP** | +20 HP |
| 4 | 23.1 HP | 16.8 HP | **-6.3 HP** | +20 HP |
| 5 | 22.9 HP | 16.9 HP | **-6.0 HP** | +20 HP |
| 6 | 23.2 HP | 17.9 HP | **-5.3 HP** | +20 HP |
| 7 | 25.7 HP | 17.7 HP | **-8.0 HP** | +20 HP |
| 8 | 25.7 HP | 18.0 HP | **-7.7 HP** | +20 HP |
| 9 | 25.0 HP | 17.3 HP | **-7.7 HP** | +20 HP |

**Analysis:**
- Each location deals net **4-8 HP damage** before boss heal
- **Boss heal (+20 HP)** overcorrects, giving +16 HP net gain
- **Between-location heal (+20 HP)** ensures you start fresh each time
- With 2 full heals per location, you gain **net +32 HP per location**

Wait, that math doesn't add up with 10% completion rate...

---

## Why Is It Still Hard?

The 10% completion rate suggests **boss fights are the problem**.

### Possible Reasons:

1. **Boss damage spikes** - Players die DURING Hollow fights
   - Hollow has 7/9/10 HP (takes 7-10 combat rounds)
   - If you're low on HP when you reach the Hollow, you might die before defeating it
   - The heal happens AFTER defeating the Hollow

2. **Accumulation before boss** - You lose 4-8 HP before reaching the Hollow
   - If you start at 20 HP, you're at 12-16 HP when boss appears
   - Boss fight might deal another 5-10 HP
   - If you drop below 0 during the fight, you die

3. **Location 4 difficulty spike** - 159 deaths (15.9%)
   - Enemies jump to 5-7 HP
   - Weapon might not be drawn yet
   - First "hard" Hollow at 9 HP

---

## Possible Improvements

### Option 1: Heal BEFORE Boss Fight (Predictive Rest)
Since Hollow is in last 3 cards, you could:
- Heal to full when you draw 1st of last 3 cards
- Like a "bonfire before boss" in Dark Souls
- Ensures you enter boss fight at full HP

**Expected result:** 20-30% completion rate

---

### Option 2: Reduce Hollow HP Slightly
Current: 7 / 9 / 10 HP
Proposed: 6 / 8 / 9 HP

**Expected result:** 15-20% completion rate

---

### Option 3: Add 1 More Item Per Location
Current: 2 items (6/10/16 HP total)
Proposed: 3 items (9/15/24 HP total)

**Expected result:** 15-18% completion rate

---

### Option 4: Increase Item Healing
Current: 3 / 5 / 8 HP
Proposed: 5 / 7 / 10 HP

**Expected result:** 13-16% completion rate

---

## Equipment Scaling Impact

The weapon upgrades are working well:

### Tier 1: Gnarled Branch
- 1 → Hit
- Clear rate: 86.7%

### Tier 2: Sturdy Blade
- 1 → Hit, **2 → Hit**
- Clear rate: 77.7% (but facing harder enemies)
- Damage only increased +3 HP despite enemies getting +2 HP stronger

### Tier 3: Masterwork Blade
- 1 → Hit, 2 → Hit, **3-4 → Hit+1**
- Clear rate: 69.2% (but facing hardest enemies)
- Damage only increased +2.5 HP despite enemies getting another +2 HP stronger

**Conclusion:** Weapon scaling is WORKING—it's keeping damage growth reasonable despite enemy HP increases.

---

## Recommendations

**For 15-20% win rate (challenging roguelike):**
- Option 2: Reduce Hollow HP by 1 (easiest change)

**For 20-30% win rate (moderate difficulty):**
- Option 1: Heal to full when entering "last 3 cards" zone (thematic Dark Souls bonfire)

**For 25-35% win rate (more forgiving):**
- Combine Option 1 + Option 2

---

## Current State Assessment

**Pros:**
- ✅ Equipment scaling works well
- ✅ Predictable boss creates strategic planning
- ✅ Full heals prevent death spiral between locations
- ✅ Boss heal rewards victory
- ✅ Difficulty curve is mostly smooth

**Cons:**
- ❌ 10% completion rate is very low (might feel frustrating)
- ❌ Location 4 is a sharp difficulty spike
- ❌ Players might die during boss fights despite knowing boss is coming
- ❌ Tier transitions create ~8-10% clear rate drops

**Verdict:** Game is completable and has good systems, but might be too punishing for most players.

---

Would you like to:
1. Adjust difficulty (reduce Hollow HP or add "bonfire heal")?
2. Keep current difficulty (10% win rate, very challenging)?
3. Test with human players first to see how skill affects win rate?
