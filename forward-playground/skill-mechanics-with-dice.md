# Skill-Based Mechanics (Keeping Dice Randomness)

You're right - fixed attack patterns remove the fun of dice rolling. Here are Dark Souls-inspired mechanics that **keep randomness but reward skill**:

---

## 1. Stamina System (Resource Management)

**Concept:** Combat uses Stamina, must manage it carefully

### How It Works:
```
Start each combat with 6 Stamina
Each action costs Stamina:
- Attack: 2 Stamina
- Block: 1 Stamina
- Heavy Attack: 3 Stamina (deal +1 damage if hit)
- Rest: 0 Stamina (recover 2 Stamina)

Each round:
1. Choose action (costs Stamina)
2. Roll dice and resolve
3. If out of Stamina, must Rest (auto-miss)
```

**Example Combat:**
```
You (20 HP, 6 Stam) vs Beast (5 HP)

Round 1: Attack (6→4 Stam) → Roll 3d6 → [5,3,2] → Hit 2 dmg → Beast at 3 HP
Round 2: Attack (4→2 Stam) → Roll 3d6 → [4,2,1] → Hit 1 dmg → Beast at 2 HP
Round 3: Heavy Attack (2→-1 Stam) → Out of stamina! Must Rest!
Round 4: Rest (recover to 2 Stam) → Beast hits you for 1 HP
Round 5: Attack (2→0 Stam) → Roll 3d6 → [6,5,3] → Counter! Beast dies.
```

**Skill Factor:**
- Plan stamina spending across entire fight
- Heavy attacks vs safe attacks
- When to rest (defensive turns)

**Impact:** Adds Dark Souls stamina management, keeps dice rolls

---

## 2. Combat Momentum / Combo System

**Concept:** Consecutive outcomes build power

### How It Works:
```
Track last 3 rolls:
Hit-Hit-Hit = Next roll gets +1 damage
Block-Block = Next attack auto-crits
Miss-Miss = Next attack rerolls once for free
Counter-Counter = Instant kill (if enemy HP < 5)
```

**Example:**
```
You vs Beast (7 HP)

Round 1: Roll [4,2,1] → Hit 1 → Beast at 6 HP
Round 2: Roll [3,2,1] → Hit 1 → Beast at 5 HP [HIT-HIT combo!]
Round 3: Roll [5,4,2] → Hit 2 + 1 bonus = 3 dmg → Beast at 2 HP
Round 4: Roll [2,1,1] → Block → Combo broken
Round 5: Roll [6,3,2] → Counter → Beast dead
```

**Skill Factor:**
- Recognize combo opportunities
- Push for combos vs play safe
- Risk/reward decisions

**Impact:** Rewards consistency, keeps dice rolling exciting

---

## 3. Die Manipulation (Fate Points)

**Concept:** Spend resources to manipulate dice outcomes

### How It Works:
```
Gain 1 Fate Point per location
Fate uses (choose after seeing your 3d6 roll):
- Reroll one die
- Flip one die (1→6, 2→5, 3→4, etc.)
- Add +1 to all dice
- Remove lowest die, roll 1 new die

Only usable once per combat.
```

**Example:**
```
You vs Hollow (7 HP), you have 1 Fate Point

Round 3, critical moment (you at 5 HP, enemy at 3 HP):
Roll 3d6 → [2,2,1] = Block at best (enemy will hit you!)

Spend Fate: "Reroll the 1"
New roll: [2,2,5] → Choose 5 → Hit 2 dmg → Enemy at 1 HP
You block enemy attack, survive!

Next round: Finish it off.
```

**Skill Factor:**
- When to spend Fate (save for boss?)
- Which manipulation is best for situation
- Risk assessment

**Impact:** Clutch moments feel earned, keeps randomness

---

## 4. Enemy Tells (Prediction Mini-Game)

**Concept:** See clues about enemy's next move, prepare response

### How It Works:
```
After enemy rolls (but before revealing):
- Enemy rolled 1-2: You see "Enemy hesitates" (Miss or Block)
- Enemy rolled 3-4: You see "Enemy attacks" (Hit)
- Enemy rolled 5-6: You see "Enemy roars!" (Hit 2 or Counter)

You choose response:
- Aggressive: If you guessed wrong, take +1 damage
- Defensive: If you guessed right, negate all damage
- Balanced: Normal resolution
```

**Example:**
```
Round 3: Enemy rolls (hidden)
You see: "Enemy roars!" (5-6 roll = big attack coming!)

You choose: Defensive stance
You roll 3d6 → [4,3,2] → Hit 1 normally

Enemy reveals: 6 (Counter)
Because you chose Defensive + guessed right: Negate counter!
You deal 1 dmg, take 0.
```

**Skill Factor:**
- Read tells and predict
- Choose stance based on prediction
- Risk/reward in every round

**Impact:** Feels like reading enemy patterns without removing randomness

---

## 5. Perfect Timing Windows (Riposte System)

**Concept:** Risk Lux for huge payoff on correct prediction

### How It Works:
```
During combat, you can declare "Riposte" (costs 1 Lux):

Choose enemy outcome to counter:
- Counter Miss: If enemy misses, deal 3 damage
- Counter Block: If enemy blocks, deal 2 damage + break block
- Counter Hit: If enemy hits, negate + deal 2 damage

If you guess WRONG:
- Your roll is wasted (deal 0 damage)
- Take double damage from enemy
```

**Example:**
```
You (8 HP) vs Beast (4 HP), you have 2 Lux

Round 5: Spend 1 Lux → Declare "Riposte: Counter Hit"
You roll 3d6 → [5,4,3] → Set aside (will use if Riposte succeeds)
Enemy rolls 1d6 → 4 (Hit!)

SUCCESS! Your Riposte counters the Hit:
- Negate enemy damage
- Deal 2 damage
- Beast at 2 HP

High risk, high reward!
```

**Skill Factor:**
- Predict enemy roll (1/3 or 1/2 chance)
- Clutch plays with Lux
- Feels like Dark Souls parries

**Impact:** Skilled players can turn combat around with reads

---

## 6. Equipment Abilities (Active Powers)

**Concept:** Equipment has activated abilities on cooldown

### How It Works:
```
Gnarled Branch:
- Passive: 1 → Hit
- Active (2/combat): Double next roll result
  - Hit 1 → Hit 2, Hit 2 → Hit 4, etc.

Empty Prism:
- Passive: Enables Lux usage
- Active (1/location): Store a roll, use later
  - Roll amazing 6? Store it. Use on a bad roll round.

Warden's Shield:
- Passive: Can choose Block on 3
- Active (1/combat): Auto-block next 2 attacks
```

**Skill Factor:**
- When to activate abilities
- Cooldown management
- Combo abilities with rolls

**Impact:** Adds active decision-making to combat

---

## 7. Prepared Actions (Set Traps)

**Concept:** Spend turns setting up, gain advantage later

### How It Works:
```
Instead of attacking, you can Prepare:
- Set Trap: Next combat round, enemy takes 2 damage at start
- Take Aim: Next attack +2 damage
- Brace: Next 2 rounds, auto-block all attacks
- Study: Learn enemy's last 3 rolls (shown to you)

Preparation costs a turn (you deal 0 damage that round).
```

**Example:**
```
You vs Hollow (7 HP)

Round 1: Prepare: Set Trap (you deal 0, enemy hits you for 1)
Round 2: Trap triggers! Enemy takes 2. You roll → [5] → Hit 2.
  Total: 4 damage this round! Enemy at 3 HP.
Round 3: Finish it.

Strategic: Spend 1 turn preparing for big turn later.
```

**Skill Factor:**
- When to invest in preparation
- Which preparation for which enemy
- Long-term planning

**Impact:** Dark Souls buffing before boss fights

---

## 8. Weakness System (Exploit Openings)

**Concept:** After enemy rolls certain outcomes, they're vulnerable

### How It Works:
```
Enemy vulnerabilities (revealed on card):
- After Enemy Misses: Next hit deals +2 damage (opening!)
- After Enemy Blocks: Next attack ignores block
- After Enemy Counters: Next round they can't block

You must capitalize NEXT ROUND or opportunity expires.
```

**Example:**
```
Territorial Stag weakness: "After Miss, vulnerable to +2 damage"

Round 3: Enemy rolls 1 (Miss)
You see: "Stag is off-balance!" (weakness triggered)

Round 4: You roll [4,3,2] → Hit 1 + 2 weakness bonus = 3 damage!
Enemy at 2 HP.

Exploit the opening!
```

**Skill Factor:**
- Recognize weaknesses
- Save big moves for weakness windows
- Feels like boss fight phases

**Impact:** Pattern recognition without fixed patterns

---

## Recommended Combination

**Core Trio for Dark Souls feel:**

1. **Stamina System** (resource management across fight)
2. **Riposte System** (high-skill clutch plays)
3. **Enemy Tells** (prediction mini-game)

**Why this combo:**
- Stamina adds planning depth
- Riposte adds clutch moment potential
- Tells add pattern reading without removing randomness

**Expected impact:** Luck 60% → 45%, Skill 40% → 55%

---

## Other Good Options

**For build variety:** Equipment Abilities
**For combo depth:** Combat Momentum
**For preparation:** Prepared Actions
**For learning curve:** Weakness System

---

Want me to implement any of these and simulate the impact?

**My recommendation:** Start with **Stamina System** (easiest, biggest impact) + **Enemy Tells** (feels like Dark Souls reads).
