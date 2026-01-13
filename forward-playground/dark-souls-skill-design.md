# Making Forward More Skill-Based (Dark Souls Design)

## Current State

**Luck vs Skill: ~60% Luck / 40% Skill**

**Luck factors:**
- Deck shuffle order (which cards appear when)
- Blind 3-card draw (33% chance to pick "right" card)
- Combat dice rolls (even with 3d6-choose, variance exists)
- When you find key cards (Empty Prism, Blessing, Equipment)

**Skill factors:**
- Healing timing (14% win rate difference!)
- Lux allocation (peek vs heal vs reroll)
- Peek strategy (which cards to shuffle back)
- Terror choices (HP vs Lux)
- Equipment usage (when to use Shield block)

---

## Dark Souls Design Principles

### What Makes Dark Souls Skill-Based?

1. **Pattern Recognition** - Learn enemy attacks, memorize safe windows
2. **Preparation** - Gear choice, resource loadout matters heavily
3. **Execution** - Timing, positioning, resource management in real-time
4. **Knowledge** - Veterans have massive advantage (know boss movesets, map layouts)
5. **Mastery Curve** - Steep learning curve but feels incredibly fair when mastered
6. **Death as Teacher** - You learn from every death, apply knowledge to next attempt
7. **No RNG in Combat** - Enemy attacks are deterministic, you control outcomes

**Dark Souls is ~30% Luck / 70% Skill** (loot drops are luck, everything else is skill)

---

## Suggestions to Increase Skill %

### Category 1: Reduce Random Variance

#### 1A. Show Enemy Stats Before Combat
**Current:** Beasts have hidden HP, you discover through fighting
**Proposed:** Show "Beast (5 HP)" when you flip the card

**Impact:**
- Luck: 60% → 55%
- Skill: Planning which fights to take, when to spend resources

**Example:**
```
You flip: "Territorial Stag (5 HP)"
You know this will take ~7 rounds and deal ~5 HP to you
You can decide: Fight now? Or shuffle back with peek?
```

#### 1B. Deterministic Enemy Behavior
**Current:** Enemy rolls 1d6 each round (random)
**Proposed:** Each enemy has a fixed attack pattern

**Example:**
```
Territorial Stag pattern:
Round 1: Hit (1)
Round 2: Hit (1)
Round 3: Charge (2)
Round 4: Miss
Round 5: Block
[Repeat pattern]
```

**Impact:**
- Luck: 60% → 45%
- Skill: Pattern memorization, optimal response planning
- Feels like Dark Souls boss patterns!

**Example Combat:**
```
Round 1: Stag will Hit (1). You roll 3d6 → [4,3,2] → choose 4 (Hit 1). Trade hits.
Round 2: Stag will Hit (1). You roll 3d6 → [6,2,1] → choose 6 (Counter). Block + Hit!
Round 3: Stag will Charge (2). You roll 3d6 → [5,3,2] → choose 5 (Hit 2). Trade, but you deal more!
```

You can **learn the pattern** and optimize responses.

#### 1C. Face-Up Card Draw
**Current:** Draw 3 face-down, choose blind
**Proposed:** Draw 3, reveal 1 face-up, 2 face-down (or all face-up!)

**Impact:**
- Luck: 60% → 50% (with 1 face-up) or 60% → 30% (all face-up)
- Skill: Choice becomes pure strategy, no guessing

**Example:**
```
Draw 3:
- [Face-up] Beast (5 HP)
- [Face-down] ???
- [Face-down] ???

You can choose the known danger or gamble on unknowns.
```

---

### Category 2: Increase Strategic Depth

#### 2A. Pre-Combat Loadout Phase
**Current:** Equipment slots fill as you find them
**Proposed:** Before each encounter, choose active equipment

**Example:**
```
You've collected: Gnarled Branch, Empty Prism, Warden's Shield
You can only equip 2 at a time.

Facing Beast (7 HP):
- Equip: Gnarled Branch + Empty Prism (offensive + Lux)
- Or: Warden's Shield + Empty Prism (defensive + Lux)

Strategic choice based on HP, Lux, enemy type!
```

**Impact:**
- Adds pre-fight decision point
- Gearsets like Dark Souls (fast roll vs tank builds)

#### 2B. Stance System in Combat
**Current:** Roll 3d6, pick one, apply result
**Proposed:** Choose combat stance before each round

**Example:**
```
Stances:
- Aggressive: Roll 3d6, +1 damage to hits, -1 to blocks
- Defensive: Roll 3d6, +1 to blocks, hits become 0 damage
- Balanced: Roll 3d6, no modifications (current)

Each round, choose stance before rolling.
```

**Impact:**
- Adds tactical layer to combat
- Responds to enemy patterns
- Like Dark Souls: heavy attack vs shield up

#### 2C. Combo System
**Current:** Each roll is independent
**Proposed:** Consecutive hits build combo bonus

**Example:**
```
Hit → Hit → Hit = +2 damage on 3rd hit
Block → Counter = Guaranteed crit on counter
Miss → Hit = Next hit +1 damage (momentum from whiff)
```

**Impact:**
- Rewards consistent play
- Creates risk/reward (go for combo or play safe?)
- Dark Souls: consecutive R1 attacks deal more stagger

#### 2D. Resource-Locked Abilities
**Current:** Lux can do 3 things (heal, reroll, peek)
**Proposed:** More abilities, must choose loadout

**Example:**
```
Lux Abilities (choose 3 to equip):
1. Heal 5 HP (cost: 1 Lux)
2. Reroll 1 die (cost: 1 Lux)
3. Peek 2 cards (cost: 1 Lux)
4. Guaranteed Block (cost: 2 Lux)
5. Deal 3 damage (cost: 2 Lux)
6. Draw extra card (cost: 1 Lux)
7. Shuffle deck (cost: 1 Lux)

Before location starts, choose which 3 you want available.
```

**Impact:**
- Build variety (healing build vs aggressive build)
- Replayability
- Dark Souls: spell loadout, miracle choices

---

### Category 3: Knowledge Rewards

#### 3A. Enemy Encyclopedia
**After defeating an enemy type, you can see its pattern**

**Example:**
```
First time fighting Territorial Stag:
- Unknown pattern, fights normally

After defeating it once:
- Unlock: Stag pattern revealed in future encounters
- See pattern: [Hit, Hit, Charge, Miss, Block]
- Now you can optimize fights against all Stags
```

**Impact:**
- Learning is rewarded
- Replays easier (like knowing Dark Souls bosses)
- Encourages multiple playthroughs

#### 3B. Deck Memory
**Track which cards you've seen this location**

**Example:**
```
Cards drawn so far: 8 / 19
Seen: 2 Beasts, 1 Caesura, 1 Equipment, 2 Pits, 1 Terror
Remaining unknown: 11 cards

You know:
- 3 Beasts left (out of 5 total, saw 2)
- 2 Caesuras left (out of 3 total, saw 1)
- Blessing not drawn yet!

This information helps you decide: peek now or save Lux?
```

**Impact:**
- Adds counting/tracking minigame
- Skilled players have advantage
- Dark Souls: learning map layouts, item locations

#### 3C. Preview System
**Spend Lux to see next 3 cards in deck order**

**Current peek:** See 2 of 3 in current draw, shuffle back up to 2
**New ability:** See next 3 cards in deck order (cost: 1 Lux)

**Example:**
```
Spend 1 Lux: See deck order
Next 3 cards: Beast (5 HP), Caesura, Pit

You can:
- Plan next 3 draws
- Save resources for Beast
- Know when Caesura arrives for Lux refill
```

**Impact:**
- Planning > luck
- Skilled players map out turns ahead
- Dark Souls: knowing boss phase transitions

---

### Category 4: Execution Challenges

#### 4A. Timed Decisions
**Current:** All decisions are untimed
**Proposed:** Some decisions have time pressure

**Example:**
```
Terror card flipped:
"Choose in 10 seconds: 5 HP or 1 Lux"

If no choice made in 10 seconds:
- Default to worse option (5 HP loss)
```

**Impact:**
- Execution skill matters
- Prevents analysis paralysis
- Dark Souls: reaction time in combat

#### 4B. Risk/Reward Windows
**Current:** All actions are 100% safe
**Proposed:** Some actions have risk/reward timing

**Example:**
```
During combat, you can attempt "Riposte":
- Costs 1 Lux
- If enemy rolls Miss or Block next round: Deal 5 damage
- If enemy rolls Hit or Crit: Take double damage

You must commit BEFORE enemy roll is revealed.
```

**Impact:**
- High risk, high reward
- Feels like Dark Souls parries (risky but huge payoff)

#### 4C. Perfect Play Bonuses
**Current:** No bonus for optimal play
**Proposed:** Bonus for flawless performance

**Example:**
```
Perfect Round: If you Block or Counter enemy attack (take 0 damage), gain +1 Lux

Perfect Combat: If you defeat enemy without taking damage, heal 2 HP

This rewards skilled play with resources.
```

**Impact:**
- Skill gap widens (good players get more resources)
- Dark Souls: no-hit runs get special loot

---

### Category 5: Preparation Systems

#### 5A. Rest Before Boss
**Proposed:** Before facing Hollow or final Beast, choose to Rest

**Example:**
```
You draw: Magistrate's Lackeys (7 HP Hollow)

Before fighting, you can Rest:
- Spend 2 Lux: Fully heal to 20 HP
- Or: Proceed with current HP

This is a bonfire moment!
```

**Impact:**
- Strategic healing timing
- Dark Souls: bonfire before boss

#### 5B. Equipment Crafting
**Proposed:** Combine items to make better gear

**Example:**
```
You have: Gnarled Branch + 2 Items
You can craft:
- Sturdy Branch: 1→Hit AND 2→Hit (costs 1 Item)
- Heavy Branch: 1→Hit, all hits deal +1 (costs 2 Items)

Resource tradeoffs!
```

**Impact:**
- Build customization
- Resource management depth
- Dark Souls: weapon upgrades, blacksmith

#### 5C. Location Choice
**Proposed:** Choose which location to tackle next

**Example:**
```
After Location 1, choose:
- Location 2 (easy): 70% win rate, weak rewards
- Location 3 (hard): 50% win rate, strong equipment

You can sequence locations for difficulty curve.
```

**Impact:**
- Player agency
- Routing optimization
- Dark Souls: multiple path options

---

## Recommended Changes for "Dark Souls Feel"

### Tier 1: Must-Have (Biggest Impact)

1. **Deterministic Enemy Patterns** (1B)
   - Each enemy has fixed attack sequence
   - Learn patterns, master encounters
   - Reduces luck from 60% → 45%

2. **Show Enemy Stats** (1A)
   - See HP before combat
   - Plan resource usage
   - Information = power

3. **Deck Memory Tracking** (3B)
   - Show which cards seen, which remain
   - Skilled players track odds
   - Adds counting minigame

### Tier 2: High Value (Adds Depth)

4. **Stance System** (2B)
   - Choose stance each round
   - Tactical layer to combat
   - Responds to patterns

5. **Perfect Play Bonuses** (4C)
   - Reward flawless execution
   - Skill gap widens
   - Feel powerful when good

6. **Enemy Encyclopedia** (3A)
   - Unlock patterns after first kill
   - Knowledge is rewarded
   - Replayability boost

### Tier 3: Nice-to-Have (Polish)

7. **Pre-Combat Loadout** (2A)
   - Swap gear before fights
   - Strategic preparation
   - Buildcrafting

8. **Resource-Locked Abilities** (2D)
   - Choose Lux abilities
   - Build variety
   - Replayability

9. **Risk/Reward Windows** (4B)
   - Riposte-like mechanics
   - High skill ceiling
   - Exciting moments

---

## Expected Impact

### If implementing Tier 1 changes:

**Before:**
- Luck: 60%, Skill: 40%
- Win rate: 63.7%
- Combat feels random
- Planning limited

**After:**
- Luck: 40%, Skill: 60%
- Win rate: 70% (newbies) → 85% (masters)
- Combat feels learnable
- Planning rewarded

### Feels Like Dark Souls When:

✅ You die, but **understand why**
✅ You retry, **apply knowledge**, and win
✅ Patterns become **recognizable and exploitable**
✅ Perfect play feels **rewarding and achievable**
✅ Progression comes from **skill mastery, not luck**

---

## Implementation Priority

### Phase 1: Deterministic Combat
1. Give each enemy a fixed attack pattern
2. Show pattern after first kill (unlockable)
3. Show enemy HP on card flip

**Test:** Does win rate increase with learning? (should be 60% first run → 75% third run)

### Phase 2: Information Systems
4. Add deck tracking UI (cards seen vs remaining)
5. Add preview mechanic (see next 3 cards for 1 Lux)

**Test:** Do skilled players have better win rates? (should see variance between good/bad players)

### Phase 3: Tactical Depth
6. Add stance system (aggressive/defensive/balanced)
7. Add perfect play bonuses (no-damage combat gives +1 Lux)

**Test:** Does combat feel more interactive and skill-based?

---

Would you like me to implement any of these and re-simulate?

**Recommendation:** Start with **Deterministic Enemy Patterns** (1B) - biggest impact, fits theme, makes game feel like Dark Souls.
